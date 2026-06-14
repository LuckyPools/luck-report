/**
 * 修改报表主工作流（LangGraph 版本）
 * 完整流程：load_docs + 并行知识搜索 → plan_tasks（探查意图）→ select_datasource_op / apply_datasource_type → 子图路由 → form/page 收尾
 *
 * 与自建引擎版本的差异：
 * 1. 不再 new LastValueAfterFinishChannel
 * 2. skipWhen 在节点函数内部提前 return {}
 * 3. 路由完全用 addConditionalEdges 表达
 * 4. 子图节点用 withInput 包装，调用 subGraph.execute(state, { runtime })
 * 5. search_business / search_agent / search_schema 合并为单节点 search_knowledge，按 intent 决定跑哪几个工具
 */

import { StateGraph, START, END } from '@langchain/langgraph'
import {
  ReportStateAnnotation,
  ModifyReportInputAnnotation,
  ModifyReportOutputAnnotation,
  WorkflowRuntimeAnnotation,
  withInput,
  runtimeToContext
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { createLLMDecideNode } from '@/views/agent/workflow/nodes/llm-decide-node.ts'
import { extractDocsMap, filterActiveErrors, formatDocsAsText, runToolWithEvent } from '../utils.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'
import { createDatasourceGraph, modifyDatasourceGraph, deleteDatasourceGraph } from './datasource-graphs.ts'
import { createDatasetGraph, deleteDatasetGraph, modifyDatasetGraph } from './dataset-create-graphs.ts'
import { modifyCellGraph } from './cell-graphs.ts'
import { modifyRowGraph, modifyColGraph } from './row-col-graphs.ts'
import { modifyFormGraph, modifyPageGraph } from './form-page-graphs.ts'
import { buildLoadDocsNode } from './load-docs.ts'

/**
 * 修改报表工作流（LangGraph 版本）
 * @returns 编译后的可执行图
 */
export function modifyReportGraph(): CompiledReportGraph {
  // 阶段1：加载本地知识库（无条件必跑，复用公共 load_docs 节点）
  const loadDocs = buildLoadDocsNode()

  // 知识搜索（按 intent 决定跑哪些工具）
  // 关键：自建引擎里 search_business/search_agent/search_schema 是三个独立节点 + skipWhen
  // LangGraph 改用单节点 + 内部按 intent 标志位条件触发；这样在 barrier 节点（plan_tasks）之前不依赖外部分支
  const searchKnowledge = withInput(async (state: ReportState, _config, runtime) => {
    const intent = state.intent
    const sr = { ...(state.searchResults || {}) } as Record<string, any>

    // 业务知识搜索
    if (intent?.needsBusinessKnowledge && !sr.search_business) {
      sr.search_business = await runToolWithEvent(runtime, 'search_business', 'search_business_knowledge', { query: state.userMessage })
    }
    // 报表制作经验
    if (intent?.needsAgentKnowledge && !sr.search_agent) {
      sr.search_agent = await runToolWithEvent(runtime, 'search_agent', 'search_agent_knowledge', { query: state.userMessage })
    }
    // 表结构搜索
    if (intent?.needsSchemaSearch && !sr.search_schema) {
      sr.search_schema = await runToolWithEvent(runtime, 'search_schema', 'search_schema', { query: state.userMessage })
    }

    return { searchResults: sr } as ReportStateUpdate
  }, { nodeName: 'search_knowledge' })

  // 阶段2：plan_tasks 探查（仅 datasource / dataset / form 场景必跑）
  const planTasks = createLLMDecideNode({
    nodeId: 'plan_tasks',
    allowedTools: ['get_datasources', 'get_datasets', 'get_search_form'],
    maxIterations: 1,
    description:
      '**只读探查节点**。根据用户需求和 intent，仅调用与本步意图直接相关的只读工具来确认上下文：' +
      '数据源场景：get_datasources/get_datasets；表单场景：get_search_form。' +
      '**禁止**调用 get_paper_config / get_rows / get_columns / read_cells / write_* 等工具；' +
      '**禁止**在本节点执行任何修改动作；**禁止**分多轮重复调用同一个工具。' +
      '单元格/行列场景无需本步探查，子图内的 read_cells / read_rows_cols 节点会自动读取。' +
      '一次探查完成后立即结束。'
  })

  // 阶段2.5：声明数据源操作类型（仅数据源场景）
  // 关键决策点：内部把 create_datasource 升级为 create_datasource_and_dataset（一步出结果，省一个纯代码节点）
  const selectDatasourceOp = createLLMDecideNode({
    nodeId: 'select_datasource_op',
    allowedTools: ['select_datasource_operation'],
    requiredToolResults: ['select_datasource_operation'],
    maxIterations: 1,
    description:
      '【本节点唯一任务】立刻调用 select_datasource_operation 工具，**禁止**调用其他任何工具。\n' +
      '【禁止】不要重复审视历史对话、不要重新分析用户意图、不要纠结数据源名称。意图已经由 plan_tasks 节点分析好，你只负责"翻译"。\n' +
      '【禁止】不要在思考里长篇大论，看到意图后 1 步内就调工具，思考控制在 200 字以内。\n' +
      '【决策树】根据 state.intent.datasourceOperationHint（plan_tasks 已经给好）直接映射：\n' +
      '  - 包含"新建/创建/添加/新增"且涉及数据源 → operationType=create_datasource_and_dataset（直接升级，连带建数据集）\n' +
      '  - 包含"新建/创建/添加/新增"且仅涉及数据集 → operationType=create_dataset（datasourceName 从 searchResults.get_datasources 里挑最匹配的）\n' +
      '  - 包含"修改/编辑/更新/改" → operationType=modify_datasource 或 modify_dataset（按 hint 指明）\n' +
      '  - 包含"删除/移除" → operationType=delete_datasource 或 delete_dataset\n' +
      '【兜底】如果 hint 缺失，根据 userMessage 里的动词（创建/修改/删除）做最直接判断，**不要反复揣摩**。'
  })

  // 阶段2.6：应用数据源操作类型到 intent（升级为 create_datasource_and_dataset 等）
  // 关键决策点：把"原始 operationType"映射为"父图路由期望的最终类型"
  //  - create_datasource → create_datasource_and_dataset（一步完成创建+建数据集）
  //  - 其它 operationType 原样透传
  const applyDatasourceType = withInput(async (state: ReportState) => {
    const result = state.select_datasource_operation
    let opType: string | undefined = result?.operationType
    // 关键决策点：create_datasource 升级为 create_datasource_and_dataset
    if (opType === 'create_datasource') opType = 'create_datasource_and_dataset'
    if (opType && state.intent) {
      return { intent: { ...state.intent, datasourceOperationType: opType } } as ReportStateUpdate
    }
    return {} as ReportStateUpdate
  }, { nodeName: 'apply_datasource_type' })

  // 阶段3：子图嵌入工厂
  // 关键：自建引擎里通过 triggerMode/skipWhen 控制子图何时被调度
  // LangGraph 直接由条件边从 plan_tasks / apply_datasource_type 路由进来，skipWhen 退化为条件边的 if 分支
  const runSubGraph = (
    subGraphFactory: () => CompiledReportGraph,
    nodeName: string,
    description: string,
    pickOutput: (result: any) => Record<string, any>
  ) => withInput(async (state: ReportState, _config, runtime) => {
    const subGraph = subGraphFactory()
    const childRuntime = runtime?.fork?.()
    const result = await subGraph.invoke(state as Record<string, any>, {
      context: runtimeToContext(childRuntime ?? runtime)
    })
    const childErrors = filterActiveErrors((result as any).errors)
    const out = pickOutput(result)
    if (childErrors.length > 0) out.errors = childErrors
    return out as ReportStateUpdate
  }, { nodeName })

  // 复用 runner 工厂减少重复
  const createDatasourceSub = runSubGraph(
    createDatasourceGraph,
    'create_datasource_subgraph',
    '创建数据源子流程',
    (r) => ({
      targetDatasourceName: (r as any).targetDatasourceName,
      targetTableNames: (r as any).targetTableNames,
      datasources: (r as any).datasources
    })
  )
  const createDatasetSub = runSubGraph(
    createDatasetGraph,
    'create_dataset_subgraph',
    '创建数据集子流程',
    (r) => ({
      datasets: (r as any).datasets,
      searchForm: (r as any).searchForm,
      dataset: (r as any).dataset,
      targetDatasourceName: (r as any).targetDatasourceName
    })
  )
  const modifyDatasetSub = runSubGraph(
    modifyDatasetGraph,
    'modify_dataset_subgraph',
    '修改数据集子流程',
    (r) => ({
      datasets: (r as any).datasets,
      searchForm: (r as any).searchForm,
      dataset: (r as any).dataset
    })
  )
  const modifyCellSub = runSubGraph(
    modifyCellGraph,
    'modify_cell_subgraph',
    '修改单元格子流程',
    (r) => ({ cellsData: (r as any).cellsData })
  )
  const modifyRowSub = runSubGraph(
    modifyRowGraph,
    'modify_row_subgraph',
    '修改行结构子流程',
    (r) => ({ rowData: (r as any).rowData })
  )
  const modifyColSub = runSubGraph(
    modifyColGraph,
    'modify_col_subgraph',
    '修改列结构子流程',
    (r) => ({ colData: (r as any).colData })
  )
  const modifyFormSub = runSubGraph(
    modifyFormGraph,
    'modify_form_subgraph',
    '修改查询表单子流程',
    (r) => ({ searchForm: (r as any).searchForm })
  )
  const modifyPageSub = runSubGraph(
    modifyPageGraph,
    'modify_page_subgraph',
    '修改页面配置子流程（含页眉页脚）',
    (r) => ({
      pageConfig: (r as any).pageConfig,
      headerConfig: (r as any).headerConfig,
      footerConfig: (r as any).footerConfig
    })
  )
  // 数据源 modify / delete 在 select_datasource_op 阶段接入
  const modifyDatasourceSub = runSubGraph(
    modifyDatasourceGraph,
    'modify_datasource_subgraph',
    '修改数据源子流程',
    (r) => ({ datasources: (r as any).datasources })
  )
  const deleteDatasourceSub = runSubGraph(
    deleteDatasourceGraph,
    'delete_datasource_subgraph',
    '删除数据源子流程',
    (r) => ({ datasources: (r as any).datasources })
  )
  const deleteDatasetSub = runSubGraph(
    deleteDatasetGraph,
    'delete_dataset_subgraph',
    '删除数据集子流程',
    (r) => ({ datasets: (r as any).datasets })
  )

  // 条件边：plan_tasks → 下游路由
  const planTasksRouter = (state: ReportState) => {
    const opType = state.intent?.datasourceOperationType
    if (opType === 'create_datasource') return 'create_datasource_subgraph'
    if (opType === 'create_dataset') return 'create_dataset_subgraph'
    if (opType === 'modify_dataset') return 'modify_dataset_subgraph'
    if (state.intent?.needsDatasourceOperation && !opType) return 'select_datasource_op'
    if (state.intent?.needsCellOperation) return 'modify_cell_subgraph'
    if (state.intent?.needsRowOperation) return 'modify_row_subgraph'
    if (state.intent?.needsColOperation) return 'modify_col_subgraph'
    if (state.intent?.needsFormOperation) return 'modify_form_subgraph'
    if (state.intent?.needsPageConfigOperation) return 'modify_page_subgraph'
    return END
  }

  // 条件边：apply_datasource_type → 子图路由
  const applyTypeRouter = (state: ReportState) => {
    const opType = state.intent?.datasourceOperationType
    if (opType === 'create_datasource' || opType === 'create_datasource_and_dataset') return 'create_datasource_subgraph'
    if (opType === 'create_dataset') return 'create_dataset_subgraph'
    if (opType === 'modify_dataset') return 'modify_dataset_subgraph'
    if (opType === 'modify_datasource') return 'modify_datasource_subgraph'
    if (opType === 'delete_datasource') return 'delete_datasource_subgraph'
    if (opType === 'delete_dataset') return 'delete_dataset_subgraph'
    return END
  }

  // 条件边：create_datasource_subgraph 完成后 → create_dataset_subgraph（仅当升级场景）
  const createDsSubRouter = (state: ReportState) => {
    const childErrors = filterActiveErrors(state.errors)
    if (childErrors.length > 0) return END
    if (state.intent?.datasourceOperationType === 'create_datasource_and_dataset') return 'create_dataset_subgraph'
    return END
  }

  // 条件边：create_dataset_subgraph / modify_dataset_subgraph / modify_cell_subgraph
  //        / modify_row_subgraph / modify_col_subgraph 完成后 → 接力下游子图
  // 合并为单一路由函数：参数化"已跳过的子图"和"是否检查 errors"
  // 命中优先级：cell → row → col → form → page → END
  const makeSubEndRouter = (skipFlags: { cell?: boolean; row?: boolean; col?: boolean; form?: boolean }, checkErrors: boolean) =>
    (state: ReportState) => {
      if (checkErrors && filterActiveErrors(state.errors).length > 0) return END
      const intent = state.intent
      if (!skipFlags.cell && intent?.needsCellOperation) return 'modify_cell_subgraph'
      if (!skipFlags.row && intent?.needsRowOperation) return 'modify_row_subgraph'
      if (!skipFlags.col && intent?.needsColOperation) return 'modify_col_subgraph'
      if (!skipFlags.form && intent?.needsFormOperation) return 'modify_form_subgraph'
      if (intent?.needsPageConfigOperation) return 'modify_page_subgraph'
      return END
    }

  // 关键：使用链式 API 保持 LangGraph StateGraph 的 N 类型推断
  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('load_docs', loadDocs)
    .addNode('search_knowledge', searchKnowledge)
    .addNode('plan_tasks', planTasks)
    .addNode('select_datasource_op', selectDatasourceOp)
    .addNode('apply_datasource_type', applyDatasourceType)
    .addNode('create_datasource_subgraph', createDatasourceSub)
    .addNode('create_dataset_subgraph', createDatasetSub)
    .addNode('modify_dataset_subgraph', modifyDatasetSub)
    .addNode('modify_datasource_subgraph', modifyDatasourceSub)
    .addNode('delete_datasource_subgraph', deleteDatasourceSub)
    .addNode('delete_dataset_subgraph', deleteDatasetSub)
    .addNode('modify_cell_subgraph', modifyCellSub)
    .addNode('modify_row_subgraph', modifyRowSub)
    .addNode('modify_col_subgraph', modifyColSub)
    .addNode('modify_form_subgraph', modifyFormSub)
    .addNode('modify_page_subgraph', modifyPageSub)
    // 阶段1：load_docs + search_knowledge 并行（all 模式汇合到 plan_tasks）
    .addEdge(START, 'load_docs')
    .addEdge(START, 'search_knowledge')
    .addEdge(['load_docs', 'search_knowledge'], 'plan_tasks')
    // 阶段2：plan_tasks 条件路由
    .addConditionalEdges('plan_tasks', planTasksRouter, {
      create_datasource_subgraph: 'create_datasource_subgraph',
      create_dataset_subgraph: 'create_dataset_subgraph',
      modify_dataset_subgraph: 'modify_dataset_subgraph',
      modify_cell_subgraph: 'modify_cell_subgraph',
      modify_row_subgraph: 'modify_row_subgraph',
      modify_col_subgraph: 'modify_col_subgraph',
      modify_form_subgraph: 'modify_form_subgraph',
      modify_page_subgraph: 'modify_page_subgraph',
      select_datasource_op: 'select_datasource_op',
      [END]: END
    })
    .addEdge('select_datasource_op', 'apply_datasource_type')
    .addConditionalEdges('apply_datasource_type', applyTypeRouter, {
      create_datasource_subgraph: 'create_datasource_subgraph',
      create_dataset_subgraph: 'create_dataset_subgraph',
      modify_dataset_subgraph: 'modify_dataset_subgraph',
      modify_datasource_subgraph: 'modify_datasource_subgraph',
      delete_datasource_subgraph: 'delete_datasource_subgraph',
      delete_dataset_subgraph: 'delete_dataset_subgraph',
      [END]: END
    })
    // 子图完成后按意图接力到 form/page
    .addConditionalEdges('create_datasource_subgraph', createDsSubRouter, {
      create_dataset_subgraph: 'create_dataset_subgraph',
      [END]: END
    })
    .addConditionalEdges('create_dataset_subgraph', makeSubEndRouter({ form: true }, true), {
      modify_cell_subgraph: 'modify_cell_subgraph',
      modify_row_subgraph: 'modify_row_subgraph',
      modify_col_subgraph: 'modify_col_subgraph',
      modify_form_subgraph: 'modify_form_subgraph',
      modify_page_subgraph: 'modify_page_subgraph',
      [END]: END
    })
    .addConditionalEdges('modify_dataset_subgraph', makeSubEndRouter({}, false), {
      modify_cell_subgraph: 'modify_cell_subgraph',
      modify_row_subgraph: 'modify_row_subgraph',
      modify_col_subgraph: 'modify_col_subgraph',
      modify_form_subgraph: 'modify_form_subgraph',
      modify_page_subgraph: 'modify_page_subgraph',
      [END]: END
    })
    .addConditionalEdges('modify_cell_subgraph', makeSubEndRouter({ cell: true }, false), {
      modify_row_subgraph: 'modify_row_subgraph',
      modify_col_subgraph: 'modify_col_subgraph',
      modify_form_subgraph: 'modify_form_subgraph',
      modify_page_subgraph: 'modify_page_subgraph',
      [END]: END
    })
    .addConditionalEdges('modify_row_subgraph', makeSubEndRouter({ cell: true, row: true }, false), {
      modify_col_subgraph: 'modify_col_subgraph',
      modify_form_subgraph: 'modify_form_subgraph',
      modify_page_subgraph: 'modify_page_subgraph',
      [END]: END
    })
    .addConditionalEdges('modify_col_subgraph', makeSubEndRouter({ cell: true, row: true, col: true }, false), {
      modify_form_subgraph: 'modify_form_subgraph',
      modify_page_subgraph: 'modify_page_subgraph',
      [END]: END
    })
    .addConditionalEdges('modify_form_subgraph', (state: ReportState) => {
      if (state.intent?.needsPageConfigOperation) return 'modify_page_subgraph'
      return END
    }, {
      modify_page_subgraph: 'modify_page_subgraph',
      [END]: END
    })
    .addEdge('modify_page_subgraph', END)

  return g.compile({ input: ModifyReportInputAnnotation, output: ModifyReportOutputAnnotation })
}
