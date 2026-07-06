/**
 * 数据源相关子工作流（LangGraph 版本）
 * - createDatasourceGraph：创建数据源（仅 buildin）
 * - modifyDatasourceGraph：修改数据源（不支持）
 * - deleteDatasourceGraph：删除数据源（不支持）
 * - readDatasourcesGraph：单节点拉取数据源列表（被 dispatcher read_datasources 动作调用）
 *
 * 与自建引擎版本的差异：
 * 1. 不再 new LastValueAfterFinishChannel / graph.addChannel — channel 概念已被 Annotation 取代
 * 2. 不再 { triggers, triggerMode, skipWhen } 选项 — 用 addEdge/addConditionalEdges 表达
 * 3. 节点函数直接返回 Partial<State>，由 LangGraph reducer 自动合并
 * 4. skipWhen 语义：在节点函数内部提前 return {}，或在条件边上路由跳过
 */

import { StateGraph, START, END } from '@langchain/langgraph'
import {
  ReportStateAnnotation,
  WorkflowRuntimeAnnotation,
  withInput
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { createLLMDecideNode } from '@/service/agent/workflow/nodes/llm-decide-node.ts'
import { createToolCallNode } from '@/service/agent/workflow/nodes/tool-call-node.ts'
import {
  extractSearchCandidates,
  extractTargetTableNames,
  filterActiveErrors,
  pickDatasourceName,
  runToolWithEvent
} from '../utils.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'

/**
 * 检查 searchResults 是否包含必需的搜索/筛选数据
 * @param state - 当前状态
 * @returns 是否已有有效搜索结果
 */
function hasSearchResults(state: ReportState): boolean {
  const sr: any = state.searchResults || {}
  return !!(sr.search_schema && sr.load_buildin_datasources)
}

// ==================== 创建数据源子工作流 ====================

/**
 * 创建数据源工作流（LangGraph 版本）
 * 流程：search_and_filter（LLM 搜索+筛选）→ pick_and_add_datasource（代码选名+写入）→ confirm_datasource（校验结果）
 *
 * 边映射（参考 doc/trigger-mapping.md）：
 * - __start__ → search_and_filter（搜索）
 * - __start__ → pick_and_add_datasource（兜底直连，命中缓存时跳过搜索）
 * - search_and_filter → pick_and_add_datasource（all 模式汇合：两个源任一就绪即可，原 any 模式行为）
 * - pick_and_add_datasource → confirm_datasource
 * - confirm_datasource → __end__
 *
 * @returns 编译后的可执行图
 */
export function createDatasourceGraph(): CompiledReportGraph {
  // 节点1：搜索 + 加载 buildin 合法名
  const searchAndFilter = createLLMDecideNode({
    nodeId: 'search_and_filter',
    allowedTools: ['search_schema', 'load_buildin_datasources'],
    requiredToolResults: ['search_schema', 'load_buildin_datasources'],
    maxIterations: 3,
    resultKey: 'searchResults',
    resultKeyAsObject: true,
    description:
      '根据用户需求搜索可用的内置数据源。\n' +
      '1. 调用 search_schema 查找与用户需求匹配的数据源和表信息\n' +
      '   - 如果 taskParams 中有 purpose 字段，用 purpose 作为 search_schema 的 query 参数\n' +
      '   - 如果 taskParams 中有 name 字段，用 name 作为 search_schema 的 query 参数\n' +
      '   - 否则用用户消息作为 query\n' +
      '2. 调用 load_buildin_datasources 获取合法 buildin 数据源名称列表\n' +
      '3. 比对两者，筛选出匹配的 buildin 数据源\n' +
      '【关键】如果 search_schema 返回的结果中没有 buildin 类型（只有 jdbc/spring），' +
      '则输出提示：当前无内置数据源匹配该需求，jdbc/spring 数据源需用户在报表设计器中手动添加。\n' +
      '本步骤仅做搜索筛选。'
  })

  // 节点2：确定性选名 + 反查已存在则跳过 + 否则拉模板写入
  const pickAndAddDatasource = withInput(async (state: ReportState, _config: any, runtime) => {
    const stepId = 'pick_and_add_datasource'
    const sr: any = state.searchResults || {}

    // guard：search_and_filter 尚未完成时 searchResults 无数据，提前返回避免误报 error
    if (!hasSearchResults(state)) {
      return {} as ReportStateUpdate
    }

    const buildinList = sr.load_buildin_datasources
    const legalNames: string[] = Array.isArray(buildinList?.datasources) ? buildinList.datasources : []
    if (legalNames.length === 0) {
      return { errors: ['未获取到合法的 buildin 数据源列表'] } as ReportStateUpdate
    }

    const searchCandidates = extractSearchCandidates(sr.search_schema)
    const pickedName = pickDatasourceName(searchCandidates, legalNames)
      ?? pickDatasourceName(legalNames, legalNames)
    if (!pickedName) {
      return { errors: ['未找到与用户需求匹配的内置数据源，jdbc/spring 类型数据源需在报表设计器中手动添加'] } as ReportStateUpdate
    }

    const targetTableNames = extractTargetTableNames(
      sr.search_schema,
      pickedName,
      String(state.userMessage ?? ''),
      1
    )
    console.log(`[datasource-graph] ${stepId} 选名: ${pickedName}`)

    const existing: any = await runToolWithEvent(runtime, stepId, 'get_datasources', {})
    const dsList: any[] = Array.isArray(existing) ? existing : (Array.isArray(existing?.datasources) ? existing.datasources : [])
    const exists = dsList.some((d: any) => d?.name === pickedName)
    if (exists) {
      console.log(`[datasource-graph] ${stepId} 跳过创建: ${pickedName} 已存在`)
      return {
        targetDatasourceName: pickedName,
        targetTableNames: targetTableNames.length > 0 ? targetTableNames : undefined,
        datasources: dsList
      } as ReportStateUpdate
    }

    const template: any = await runToolWithEvent(runtime, stepId, 'get_datasource_template', { name: pickedName })
    if (!template || template.error || !template.name || template.type !== 'buildin') {
      return { errors: [`获取数据源模板失败，名称: ${pickedName}，模板: ${JSON.stringify(template)}`] } as ReportStateUpdate
    }

    const addResult: any = await runToolWithEvent(runtime, stepId, 'add_datasource', { datasource: template })
    if (addResult?.success === false) {
      return { errors: [`添加数据源失败: ${addResult.message || '未知错误'}`] } as ReportStateUpdate
    }

    const newDatasource = {
      name: template.name,
      type: template.type,
      datasets: Array.isArray(template.datasets) ? template.datasets : []
    }
    const previous = Array.isArray(state.datasources) ? state.datasources : []
    const merged = previous.some((d: any) => d?.name === newDatasource.name)
      ? previous
      : [...previous, newDatasource]
    return {
      targetDatasourceName: pickedName,
      targetTableNames: targetTableNames.length > 0 ? targetTableNames : undefined,
      datasources: merged,
      __executed_pick_and_add_datasource: true
    } as ReportStateUpdate
  }, { nodeName: 'pick_and_add_datasource' })

  // 节点3：确认数据源就绪
  const confirmDatasource = withInput(async (state: ReportState) => {
    const dsName = state.targetDatasourceName
    const datasources = state.datasources
    if (!dsName) {
      return { errors: ['数据源选名失败，未确定 targetDatasourceName'] } as ReportStateUpdate
    }
    if (!datasources || (Array.isArray(datasources) && datasources.length === 0)) {
      return { errors: ['数据源创建失败或未找到匹配的内置数据源，当前报表仍无数据源'] } as ReportStateUpdate
    }
    const activeErrors = filterActiveErrors(state.errors)
    if (activeErrors.length > 0) {
      return { errors: activeErrors } as ReportStateUpdate
    }
    return {
      targetDatasourceName: dsName,
      targetTableNames: state.targetTableNames,
      datasources
    } as ReportStateUpdate
  }, { nodeName: 'confirm_datasource' })

  // 关键：使用链式 API 保持 LangGraph StateGraph 的 N 类型推断
  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('search_and_filter', searchAndFilter)
    .addNode('pick_and_add_datasource', pickAndAddDatasource)
    .addNode('confirm_datasource', confirmDatasource)
    .addEdge(START, 'search_and_filter')
    .addEdge('search_and_filter', 'pick_and_add_datasource')
    .addEdge('pick_and_add_datasource', 'confirm_datasource')
    .addEdge('confirm_datasource', END)

  return g.compile()
}

// ==================== 修改数据源子工作流 ====================

/**
 * 修改数据源工作流（不支持）
 * 数据源的修改不允许通过 Agent 操作，需用户在报表设计器中手动处理
 * @returns 编译后的可执行图
 */
export function modifyDatasourceGraph(): CompiledReportGraph {
  const notSupported = withInput(async () => {
    return { errors: ['数据源的修改暂不支持通过 Agent 操作，请在报表设计器中手动修改'] } as ReportStateUpdate
  }, { nodeName: 'not_supported_modify' })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('not_supported_modify', notSupported)
    .addEdge(START, 'not_supported_modify')
    .addEdge('not_supported_modify', END)

  return g.compile()
}

// ==================== 读数据源子工作流 ====================

/**
 * 读数据源工作流（dispatcher read_datasources 动作调用）
 * 单节点，调 get_datasources，结果写入 state.datasources
 * 参数：taskParams.name（可选，指定数据源名称）
 */
export function readDatasourcesGraph(): CompiledReportGraph {
  const readNode = createToolCallNode({
    nodeId: 'read_datasources',
    toolName: 'get_datasources',
    args: (state) => {
      const p = state.taskParams ?? {}
      return p.name ? { name: p.name } : {}
    },
    resultKey: 'datasources'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_datasources', readNode)
    .addEdge(START, 'read_datasources')
    .addEdge('read_datasources', END)

  return g.compile()
}

// ==================== 删除数据源子工作流 ====================

/**
 * 删除数据源工作流（不支持）
 * 数据源的删除不允许通过 Agent 操作，需用户在报表设计器中手动处理
 * @returns 编译后的可执行图
 */
export function deleteDatasourceGraph(): CompiledReportGraph {
  const notSupported = withInput(async () => {
    return { errors: ['数据源的删除暂不支持通过 Agent 操作，请在报表设计器中手动删除'] } as ReportStateUpdate
  }, { nodeName: 'not_supported_delete' })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('not_supported_delete', notSupported)
    .addEdge(START, 'not_supported_delete')
    .addEdge('not_supported_delete', END)

  return g.compile()
}
