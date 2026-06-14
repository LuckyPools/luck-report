/**
 * 修改报表主工作流（LangGraph 版本 · 任务计划模式）
 *
 * 新拓扑：
 *   load_docs ╮
 *             ├─► plan_tasks(LLM) ─► dispatch_task ⇄ dispatch_task ─► summary(LLM) ─► END
 * search_knowledge ╯
 *
 * 关键改造：
 * 1. 不再用 select_datasource_op / apply_datasource_type 等硬路由；Planner 把需求拆成 TaskPlan
 * 2. Dispatcher 节点自环执行，按 dependsOn 拓扑排序 + 失败策略
 * 3. summary 节点由 Planner 决定是否需要（plan 中 action='summary'）
 * 4. 现有 11 个子图原样复用，靠 task.description 透传到 userMessage 触发子图内 LLM 决策
 *
 * 与旧版本的兼容：
 * - ModifyReportInputAnnotation / ModifyReportOutputAnnotation 不变
 * - 业务字段（cellsData / datasources / datasets / rowData / colData / pageConfig / ...）字段名不变
 * - taskPlan / taskResults / plannerError 三个新字段为可选，旧 UI 不读取
 */

import { StateGraph, START, END } from '@langchain/langgraph'
import {
  ReportStateAnnotation,
  ModifyReportInputAnnotation,
  ModifyReportOutputAnnotation,
  WorkflowRuntimeAnnotation,
  withInput
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { extractDocsMap, filterActiveErrors, formatDocsAsText, runToolWithEvent } from '../utils.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'
import { createDatasourceGraph, modifyDatasourceGraph, deleteDatasourceGraph } from './datasource-graphs.ts'
import { createDatasetGraph, deleteDatasetGraph, modifyDatasetGraph } from './dataset-create-graphs.ts'
import { modifyCellGraph } from './cell-graphs.ts'
import { modifyRowGraph, modifyColGraph } from './row-col-graphs.ts'
import { modifyFormGraph, modifyPageGraph } from './form-page-graphs.ts'
import { buildLoadDocsNode } from './load-docs.ts'
import {
  buildPlannerNode,
  buildDispatcherNode,
  buildSummaryNode
} from '../dispatcher.ts'
import type { ActionRegistry } from '../task-plan.ts'
import { runtimeToContext } from '../index.ts'

/** Dispatcher 自环轮次字段名（写到 state，dispatcher 自增） */
const DISPATCH_ROUND_FIELD = 'dispatchRound'

/**
 * 修改报表工作流（任务计划模式）
 * @returns 编译后的可执行图
 */
export function modifyReportGraph(): CompiledReportGraph {
  // ===== 阶段1：前置探查 =====
  const loadDocs = buildLoadDocsNode()
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

  // ===== 阶段2：Planner（LLM Decider 包装，FC 强制输出 TaskPlan）=====
  const planner = buildPlannerNode({ maxRetries: 1 })

  /**
   * Planner 后处理节点（纯函数）
   * - LLM Decider 节点返回的 statePatch 形如 { plan_tasks: { tasks: [...] } }
   * - 把 plan_tasks 工具结果解析为 TaskNode[]，挂到 state.taskPlan
   * - 校验合法性：失败时填 plannerError，Dispatcher 看到后跳过调度
   */
  const collectPlan = withInput(async (state: ReportState) => {
    // 关键决策点：planner 节点 resultKey='taskResults'，所以 plan_tasks 工具结果在 state.taskResults['plan_tasks']
    // （state 没声明 plan_tasks 字段，LangGraph 会丢弃直接 return 的键；必须落到已声明字段才能被后续节点读）
    const planResult = state.taskResults?.['plan_tasks']
    if (!planResult) {
      return { plannerError: 'Planner 未调用 plan_tasks 工具', taskPlan: [] } as ReportStateUpdate
    }
    const tasks: any[] = Array.isArray(planResult?.tasks) ? planResult.tasks : []
    if (tasks.length === 0) {
      // Planner 主动输出空 → 走 summary 节点由其直接回答
      return { taskPlan: [], plannerError: null } as ReportStateUpdate
    }
    // 关键决策点：统一补默认值（id/action 必填，description 用于 LLM Decider 重写 userMessage）
    const plan = tasks.map((t, idx) => ({
      id: t.id || `t${idx + 1}`,
      action: t.action,
      params: { ...(t.params ?? {}), description: t.params?.description ?? t.description ?? state.userMessage },
      dependsOn: t.dependsOn ?? [],
      onFail: t.onFail ?? 'abort',
      maxRetries: t.maxRetries ?? 0,
      status: 'pending',
      retryCount: 0
    }))
    return { taskPlan: plan, plannerError: null } as ReportStateUpdate
  }, { nodeName: 'collect_plan' })

  // ===== 阶段3：Dispatcher（自环节点）=====
  const registry: ActionRegistry = buildActionRegistry()
  const dispatcher = buildDispatcherNode(registry, { maxRounds: 50 })

  // ===== 阶段4：Summary =====
  const summary = buildSummaryNode({ maxIterations: 2 })

  // ===== 主图组装 =====
  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('load_docs', loadDocs)
    .addNode('search_knowledge', searchKnowledge)
    .addNode('plan_tasks', planner)
    .addNode('collect_plan', collectPlan)
    .addNode('dispatch_task', dispatcher)
    .addNode('summary', summary)
    // 阶段1：load_docs + search_knowledge 并行汇合到 plan_tasks
    .addEdge(START, 'load_docs')
    .addEdge(START, 'search_knowledge')
    .addEdge('load_docs', 'plan_tasks')
    .addEdge('search_knowledge', 'plan_tasks')
    // 阶段2：planner → 收集 plan
    .addEdge('plan_tasks', 'collect_plan')
    // 阶段3：dispatch_task 自环
    .addEdge('collect_plan', 'dispatch_task')
    .addConditionalEdges('dispatch_task', (state: ReportState) => {
      // 全部 done 或卡死或超轮次 → 进 summary
      const plan = state.taskPlan ?? []
      const round = (state as any)[DISPATCH_ROUND_FIELD] ?? 0
      const allDone = plan.every(t => ['success', 'failed', 'skipped'].includes(t.status ?? ''))
      const dead = plan.length > 0 && plan.filter(t => t.status === 'pending' || t.status === 'in_progress').length === 0
      if (allDone || dead || round >= 50) return 'summary'
      return 'dispatch_task'
    }, {
      dispatch_task: 'dispatch_task',
      summary: 'summary'
    })
    // 阶段4：summary → END
    .addEdge('summary', END)

  return g.compile({ input: ModifyReportInputAnnotation, output: ModifyReportOutputAnnotation } as any)
}

/**
 * Action → 子图注册表
 * 覆盖：read 任务（直接读状态，不调子图） + 写任务（调对应子图）
 *
 * 关键决策：read_* 类任务由 Dispatcher 内置 executor 快速处理（不入子图），
 * 减少 LLM 决策消耗；write_* 类任务才走子图，依赖 LLM Decider 做实际写。
 *
 * 子图 invoke 透传机制：factory 接 task，闭包内把 task.params.description 注入到
 * 子图 invoke 期间的 userMessage（让子图内 LLM Decider 拿到该 task 的具体描述），
 * 不修改子图源码。
 */
function buildActionRegistry(): ActionRegistry {
  return {
    // ============== 读任务（直接读 state 字段，不调子图）==============
    read_datasources: {
      nodeId: 'read_datasources',
      kind: 'read',
      factory: () => readStateSubgraph('datasources'),
      pickOutput: (sub) => ({ datasources: sub.datasources })
    },
    read_datasets: {
      nodeId: 'read_datasets',
      kind: 'read',
      factory: () => readStateSubgraph('datasets'),
      pickOutput: (sub) => ({ datasets: sub.datasets })
    },
    read_cells: {
      nodeId: 'read_cells',
      kind: 'read',
      factory: () => readStateSubgraph('cellsData'),
      pickOutput: (sub) => ({ cellsData: sub.cellsData })
    },
    read_rows: {
      nodeId: 'read_rows',
      kind: 'read',
      factory: () => readStateSubgraph('rowData'),
      pickOutput: (sub) => ({ rowData: sub.rowData })
    },
    read_cols: {
      nodeId: 'read_cols',
      kind: 'read',
      factory: () => readStateSubgraph('colData'),
      pickOutput: (sub) => ({ colData: sub.colData })
    },
    read_form: {
      nodeId: 'read_form',
      kind: 'read',
      factory: () => readStateSubgraph('searchForm'),
      pickOutput: (sub) => ({ searchForm: sub.searchForm })
    },
    read_page: {
      nodeId: 'read_page',
      kind: 'read',
      factory: () => readStateSubgraph('pageConfig'),
      pickOutput: (sub) => ({ pageConfig: sub.pageConfig, headerConfig: sub.headerConfig, footerConfig: sub.footerConfig })
    },
    read_report: {
      nodeId: 'read_report',
      kind: 'read',
      factory: () => readStateSubgraph('reportState'),
      pickOutput: (sub) => ({ reportState: sub.reportState })
    },

    // ============== 写任务（调对应子图）==============
    create_datasource: wrapWriteAction('create_datasource_subgraph', createDatasourceGraph, (sub) => ({
      datasources: sub.datasources,
      datasetWriteResult: sub.datasetWriteResult
    })),
    modify_datasource: wrapWriteAction('modify_datasource_subgraph', modifyDatasourceGraph, (sub) => ({
      datasources: sub.datasources,
      datasetWriteResult: sub.datasetWriteResult
    })),
    delete_datasource: wrapWriteAction('delete_datasource_subgraph', deleteDatasourceGraph, (sub) => ({
      datasources: sub.datasources,
      datasetWriteResult: sub.datasetWriteResult
    })),
    create_dataset: wrapWriteAction('create_dataset_subgraph', createDatasetGraph, (sub) => ({
      datasets: sub.datasets,
      datasetWriteResult: sub.datasetWriteResult
    })),
    modify_dataset: wrapWriteAction('modify_dataset_subgraph', modifyDatasetGraph, (sub) => ({
      datasets: sub.datasets,
      datasetWriteResult: sub.datasetWriteResult
    })),
    delete_dataset: wrapWriteAction('delete_dataset_subgraph', deleteDatasetGraph, (sub) => ({
      datasets: sub.datasets,
      datasetWriteResult: sub.datasetWriteResult
    })),
    modify_cell: wrapWriteAction('modify_cell_subgraph', modifyCellGraph, (sub) => ({
      cellsData: sub.cellsData,
      datasetWriteResult: sub.datasetWriteResult
    })),
    modify_row: wrapWriteAction('modify_row_subgraph', modifyRowGraph, (sub) => ({
      rowData: sub.rowData,
      datasetWriteResult: sub.datasetWriteResult
    })),
    modify_col: wrapWriteAction('modify_col_subgraph', modifyColGraph, (sub) => ({
      colData: sub.colData,
      datasetWriteResult: sub.datasetWriteResult
    })),
    modify_form: wrapWriteAction('modify_form_subgraph', modifyFormGraph, (sub) => ({
      searchForm: sub.searchForm,
      datasetWriteResult: sub.datasetWriteResult
    })),
    modify_page: wrapWriteAction('modify_page_subgraph', modifyPageGraph, (sub) => ({
      pageConfig: sub.pageConfig,
      headerConfig: sub.headerConfig,
      footerConfig: sub.footerConfig,
      datasetWriteResult: sub.datasetWriteResult
    }))
  }
}

/**
 * 把"写子图"封装成 ActionRegistryEntry
 * 闭包持有 task，子图 invoke 时把 task.params.description 注入到 userMessage + taskParams
 * @param nodeId - 节点 ID 标识
 * @param factoryFn - 子图工厂（无参，返回 CompiledReportGraph）
 * @param pickOutput - 子图结果 → statePatch 映射
 * @returns ActionRegistryEntry
 */
function wrapWriteAction(
  nodeId: string,
  factoryFn: () => CompiledReportGraph,
  pickOutput: (subResult: any) => Record<string, any>
): ActionRegistry['create_datasource'] {
  return {
    nodeId,
    kind: 'write',
    factory: (task) => {
      const sub = factoryFn()
      return {
        invoke: async (state: any, options?: any) => {
          // 关键决策点：闭包注入 task.params 到子图 invoke 期间的 userMessage / taskParams
          // 子图内 LLM Decider 节点会读到这两个字段，从而执行"该 task 范围内的具体动作"
          const desc = task?.params?.description ?? state.userMessage
          const childState = { ...state, userMessage: desc, taskParams: task?.params ?? {} }
          return await sub.invoke(childState, options)
        }
      } as CompiledReportGraph
    },
    pickOutput
  }
}

/**
 * 把 state 的某个字段透传出来的"读子图"
 * 实际只跑一个空子图返回 state，由 pickOutput 提取字段
 * 读任务用 subGraph.invoke 是为了不破坏统一调度（executor 统一调用入口）
 * @param field - state 中要读的字段名
 * @returns 一个能 invoke 的子图
 */
function readStateSubgraph(field: string, _task?: any): CompiledReportGraph {
  const nodeName = `passthrough_${field}`
  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode(nodeName, withInput(async (state: ReportState) => {
      // 把当前 state 原样返回；pickOutput 决定取哪个字段
      return { [field]: (state as any)[field] } as ReportStateUpdate
    }, { nodeName }))
    .addEdge(START, nodeName)
    .addEdge(nodeName, END)
  return g.compile() as CompiledReportGraph
}
