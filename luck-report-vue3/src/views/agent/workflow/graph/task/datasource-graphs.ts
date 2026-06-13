/**
 * 数据源相关子工作流
 * - createDatasourceGraph：创建数据源（仅支持 buildin）
 * - modifyDatasourceGraph：修改数据源（不支持）
 * - deleteDatasourceGraph：删除数据源（不支持）
 */

import {
  ReportStateGraph,
  LLMDecideNode,
  LastValueAfterFinishChannel,
  defaultRetryOn
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { reportStateSchema } from '../state.ts'
import {
  extractSearchCandidates,
  extractTargetTableNames,
  filterActiveErrors,
  pickDatasourceName,
  runToolWithEvent
} from '../utils.ts'

// ==================== 创建数据源子工作流 ====================

/**
 * 创建数据源工作流（仅支持 buildin）
 * 流程：search_and_filter（LLM 搜索+筛选）→ pick_and_add_datasource（代码选名+写入）→ confirm_datasource（校验结果）
 */
export function createDatasourceGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true, datasources: true, searchResults: true },
    output: { datasources: true, errors: true, targetDatasourceName: true, targetTableNames: true }
  })

  const hasSearchResults = (state: Record<string, any>) => {
    const sr = state.searchResults || {}
    return !!(sr.search_schema && sr.load_buildin_datasources)
  }

  // 节点1：搜索 + 加载 buildin 合法名（LLM 负责"理解用户意图"与决定是否终止）
  const searchOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('search_filter_out', searchOut)
  graph.addNode('search_and_filter', new LLMDecideNode({
    nodeId: 'search_and_filter',
    allowedTools: ['search_schema', 'load_buildin_datasources'],
    requiredToolResults: ['search_schema', 'load_buildin_datasources'],
    maxIterations: 3,
    resultKey: 'searchResults',
    resultKeyAsObject: true,
    description:
      '根据用户需求搜索可用的内置数据源。\n' +
      '1. 调用 search_schema 查找与用户需求匹配的数据源和表信息\n' +
      '2. 调用 load_buildin_datasources 获取合法 buildin 数据源名称列表\n' +
      '3. 比对两者，筛选出匹配的 buildin 数据源\n' +
      '【关键】如果 search_schema 返回的结果中没有 buildin 类型（只有 jdbc/spring），' +
      '则输出提示：当前无内置数据源匹配该需求，jdbc/spring 数据源需用户在报表设计器中手动添加。' +
      '【禁止】本步骤不允许调用 add_datasource / get_datasource_template，仅做搜索筛选',
    outChannelName: 'search_filter_out'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    skipWhen: hasSearchResults,
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '搜索数据源并筛选buildin类型' }
  })

  // 节点2：确定性选名 + 反查已存在则跳过 + 否则拉模板写入
  graph.addNode('pick_and_add_datasource', async (state, runtime) => {
    const stepId = 'pick_and_add_datasource'
    const sr: any = state.searchResults || {}

    const buildinList = sr.load_buildin_datasources
    const legalNames: string[] = Array.isArray(buildinList?.datasources) ? buildinList.datasources : []
    if (legalNames.length === 0) {
      return { errors: ['未获取到合法的 buildin 数据源列表'] }
    }

    const searchCandidates = extractSearchCandidates(sr.search_schema)
    const pickedName = pickDatasourceName(searchCandidates, legalNames)
      ?? pickDatasourceName(legalNames, legalNames)
    if (!pickedName) {
      return { errors: ['未找到与用户需求匹配的内置数据源，jdbc/spring 类型数据源需在报表设计器中手动添加'] }
    }

    const targetTableNames = extractTargetTableNames(
      sr.search_schema,
      pickedName,
      String(state.userMessage ?? ''),
      1
    )
    console.log(`[datasource-graph] ${stepId} 选名`, JSON.stringify({
      searchCandidates, pickedName, targetTableNames
    }))

    const existing: any = await runToolWithEvent(runtime, stepId, 'get_datasources', {})
    const dsList: any[] = Array.isArray(existing) ? existing : (Array.isArray(existing?.datasources) ? existing.datasources : [])
    const exists = dsList.some((d: any) => d?.name === pickedName)
    if (exists) {
      console.log(`[datasource-graph] ${stepId} 跳过创建`, JSON.stringify({ pickedName, reason: '已存在' }))
      return {
        targetDatasourceName: pickedName,
        targetTableNames: targetTableNames.length > 0 ? targetTableNames : undefined,
        datasources: dsList
      }
    }

    const template: any = await runToolWithEvent(runtime, stepId, 'get_datasource_template', { name: pickedName })
    if (!template || template.error || !template.name || template.type !== 'buildin') {
      return { errors: [`获取数据源模板失败，名称: ${pickedName}，模板: ${JSON.stringify(template)}`] }
    }

    const addResult: any = await runToolWithEvent(runtime, stepId, 'add_datasource', { datasource: template })
    if (addResult?.success === false) {
      return { errors: [`添加数据源失败: ${addResult.message || '未知错误'}`] }
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
      datasources: merged
    }
  }, {
    triggers: ['searchResults', 'search_filter_out'],
    triggerMode: 'any',
    skipWhen: (state) => !hasSearchResults(state),
    metadata: { silent: true, description: '选名+反查+写入数据源' }
  })

  // 节点3：确认数据源是否就绪
  graph.addNode('confirm_datasource', async (state) => {
    const dsName = state.targetDatasourceName
    const datasources = state.datasources
    if (!dsName) {
      return { errors: ['数据源选名失败，未确定 targetDatasourceName'] }
    }
    if (!datasources || (Array.isArray(datasources) && datasources.length === 0)) {
      return { errors: ['数据源创建失败或未找到匹配的内置数据源，当前报表仍无数据源'] }
    }
    const activeErrors = filterActiveErrors(state.errors)
    if (activeErrors.length > 0) {
      return { errors: activeErrors }
    }
    return {
      targetDatasourceName: dsName,
      targetTableNames: state.targetTableNames,
      datasources
    }
  }, {
    triggers: ['datasources', 'targetDatasourceName'],
    triggerMode: 'any',
    metadata: { silent: true, description: '确认数据源存在' }
  })

  // 边：search 可跳过（父图已 search）；pick 支持 __start__ 直连（预加载 searchResults 时）
  graph.addEdge('__start__', 'search_and_filter')
  graph.addEdge('__start__', 'pick_and_add_datasource')
  graph.addEdge('search_and_filter', 'pick_and_add_datasource')
  graph.addEdge('pick_and_add_datasource', 'confirm_datasource')
  graph.addEdge('confirm_datasource', '__end__')

  return graph.compile()
}

// ==================== 修改数据源子工作流 ====================

/**
 * 修改数据源工作流（不支持）
 * 数据源的修改不允许通过 Agent 操作，需用户在报表设计器中手动处理
 */
export function modifyDatasourceGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true },
    output: { datasources: true }
  })

  graph.addNode('not_supported', async () => {
    return { errors: ['数据源的修改暂不支持通过 Agent 操作，请在报表设计器中手动修改'] }
  }, {
    triggers: ['__start__'],
    triggerMode: 'all',
    metadata: { description: '修改数据源：不支持' }
  })

  graph.addEdge('__start__', 'not_supported')
  graph.addEdge('not_supported', '__end__')

  return graph.compile()
}

// ==================== 删除数据源子工作流 ====================

/**
 * 删除数据源工作流（不支持）
 * 数据源的删除不允许通过 Agent 操作，需用户在报表设计器中手动处理
 */
export function deleteDatasourceGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true },
    output: { datasources: true }
  })

  graph.addNode('not_supported', async () => {
    return { errors: ['数据源的删除暂不支持通过 Agent 操作，请在报表设计器中手动删除'] }
  }, {
    triggers: ['__start__'],
    triggerMode: 'all',
    metadata: { description: '删除数据源：不支持' }
  })

  graph.addEdge('__start__', 'not_supported')
  graph.addEdge('not_supported', '__end__')

  return graph.compile()
}
