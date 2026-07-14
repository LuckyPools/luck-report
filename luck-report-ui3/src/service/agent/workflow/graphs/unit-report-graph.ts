/**
 * 统一报表主工作流（LangGraph 版本 · 三阶段架构 + 任务计划模式）
 *
 * 阶段切分：
 *   START → load_docs ─┐
 *   START → search_knowledge ─┴─► understand_and_plan → validate_plan
 *     ├─ taskPlan 就绪 → dispatch_task ⇄ dispatch_task → summary → END
 *     └─ plannerError 非空 → summary（规划失败兜底，#A 改为回灌 understand_and_plan）
 *
 * 关键设计：
 * - understand_and_plan 合并原 gather_requirements + plan_execution，
 *   LLM 一次调用完成"理解需求 + 规划任务"，省掉 RequirementsSpec 中间层
 * - ask_user 在 understand_and_plan 阶段可用（中断型）
 * - plan_tasks 在 understand_and_plan 阶段可用（必调）
 * - validate_plan 节点（原 collect_plan）做结构校验 + 依赖拓扑补全 + 覆盖度校验
 * - summary 节点根据 state.plannerError / state.taskResults 路由两种模式
 */

import { StateGraph, START, END } from '@langchain/langgraph'
import {
  ReportStateAnnotation,
  ReportAgentInputAnnotation,
  ReportAgentOutputAnnotation,
  WorkflowRuntimeAnnotation,
  withInput
} from '../index.ts'
import type { CompiledReportGraph, ReportState, ReportStateUpdate } from '../index.ts'
import { buildUnderstandPlanNode, buildValidatePlanNode } from '../nodes/understand-plan-node.ts'
import {
  createDatasourceGraph,
  modifyDatasourceGraph,
  deleteDatasourceGraph,
  readDatasourcesGraph
} from './datasource-graphs.ts'
import {
  createDatasetGraph,
  deleteDatasetGraph,
  modifyDatasetGraph,
  readDatasetsGraph
} from './dataset-create-graphs.ts'
import { modifyCellGraph, mergeCellsGraph, readCellsGraph } from './cell-graphs.ts'
import { createTableGraph } from './table-graphs.ts'
import { createRowGraph, modifyRowGraph, createColGraph, modifyColGraph, deleteRowGraph, deleteColGraph, readRowsGraph, readColsGraph } from './row-col-graphs.ts'
import { modifyFormGraph, readFormGraph } from './form-graphs.ts'
import { buildLoadDocsNode } from './load-docs.ts'
import { buildDispatcherNode, buildSummaryNode } from '../dispatcher.ts'
import type { ActionRegistry } from '../task-plan.ts'
import { modifyPageGraph, readPageGraph } from "@/service/agent/workflow/graphs/page-graphs.ts";
import { runToolWithEvent } from '../utils.ts'

/** Dispatcher 自环轮次字段名 */
const DISPATCH_ROUND_FIELD = 'dispatchRound'

/**
 * 构建统一报表主工作流
 *
 * 边序（三阶段架构）：
 *   START ─┬─► load_docs ───────────────┐
 *          └─► search_knowledge ─────────┴─► understand_and_plan → validate_plan
 *                                                  ├─► dispatch_task ⇄ dispatch_task → summary → END
 *                                                  └─► summary → END（plannerError 非空时，#A 改为回灌）
 */
export function buildUnifiedReportGraph(): CompiledReportGraph {
  // ===== 阶段1：前置探查 =====
  const loadDocs = buildLoadDocsNode()
  const searchKnowledge = withInput(async (state: ReportState, _config, runtime) => {
    const intent = state.intent
    const sr = { ...(state.searchResults || {}) } as Record<string, any>
    if (intent?.needsBusinessKnowledge && !sr.search_business) {
      sr.search_business = await runToolWithEvent(runtime, 'search_business', 'search_business_knowledge', { query: state.userMessage })
    }
    if (intent?.needsAgentKnowledge && !sr.search_agent) {
      sr.search_agent = await runToolWithEvent(runtime, 'search_agent', 'search_agent_knowledge', { query: state.userMessage })
      // 将 search_agent_knowledge 结果同时写入 knowledgeCache，
      // 使 buildMessages 可以通过 knowledgeCache 读取到知识库内容
      if (sr.search_agent && runtime.memoryManager) {
        const cache = runtime.memoryManager.getKnowledgeCache()
        if (cache) {
          cache.put('search_agent', typeof sr.search_agent === 'string' ? sr.search_agent : JSON.stringify(sr.search_agent))
        }
      }
    }
    if (intent?.needsSchemaSearch && !sr.search_schema) {
      sr.search_schema = await runToolWithEvent(runtime, 'search_schema', 'search_schema', { query: state.userMessage })
    }
    return { searchResults: sr } as ReportStateUpdate
  }, { nodeName: 'search_knowledge' })

  // ===== 阶段2：理解需求 + 规划任务 + 校验规划 =====
  const understandAndPlan = buildUnderstandPlanNode({ maxIterations: 8 })
  const validatePlan = buildValidatePlanNode()

  // ===== 阶段3：Dispatcher（自环节点）=====
  const registry: ActionRegistry = buildActionRegistry()
  const dispatcher = buildDispatcherNode(registry, { maxRounds: 50 })

  // ===== 阶段4：Summary =====
  const summary = buildSummaryNode({ maxIterations: 2 })

  // ===== 主图组装 =====
  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('load_docs', loadDocs, { metadata: { description: '加载报表文档' } })
    .addNode('search_knowledge', searchKnowledge, { metadata: { description: '检索业务知识/Agent 经验/数据源表结构' } })
    // 阶段2：understand_and_plan → validate_plan
    .addNode('understand_and_plan', understandAndPlan, { metadata: { description: '理解用户需求并规划任务' } })
    .addNode('validate_plan', validatePlan, { metadata: { description: '校验任务计划' } })
    // 阶段3：dispatch_task（自环）
    .addNode('dispatch_task', dispatcher, { metadata: { description: '按计划执行任务' } })
    // 阶段4：summary
    .addNode('summary', summary, { metadata: { description: '汇总执行结果' } })
    // 阶段1：load_docs + search_knowledge 并行汇合到 understand_and_plan
    .addEdge(START, 'load_docs')
    .addEdge(START, 'search_knowledge')
    .addEdge('load_docs', 'understand_and_plan')
    .addEdge('search_knowledge', 'understand_and_plan')
    // 阶段2：understand_and_plan → validate_plan
    .addEdge('understand_and_plan', 'validate_plan')
    // validate_plan 条件路由（#A 改动）：
    //   plannerError && replanRound<2 → understand_and_plan（回灌重规划，#A 反馈链路）
    //   plannerError && replanRound>=2 → summary（超限，报告规划错误）
    //   taskPlan 就绪 → dispatch_task
    //   否则 → summary
    .addConditionalEdges('validate_plan', (state: ReportState) => {
      if (state.plannerError) {
        if ((state.replanRound ?? 0) < 2) {
          console.log(`[unit-report-graph] validate_plan 失败 (replanRound=${state.replanRound})，回灌 understand_and_plan 重规划`)
          return 'understand_and_plan'
        }
        console.log(`[unit-report-graph] validate_plan 失败且重规划超限 (replanRound=${state.replanRound})，进 summary`)
        return 'summary'
      }
      if (Array.isArray(state.taskPlan) && state.taskPlan.length > 0) return 'dispatch_task'
      return 'summary'
    }, {
      understand_and_plan: 'understand_and_plan',
      dispatch_task: 'dispatch_task',
      summary: 'summary'
    })
    // 阶段3：dispatch_task 自环
    .addConditionalEdges('dispatch_task', (state: ReportState) => {
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

  return g.compile({ input: ReportAgentInputAnnotation, output: ReportAgentOutputAnnotation } as any)
}

/**
 * Action → 子图注册表
 *
 * read 类子图模式一致（单 ToolCallNode），批量生成
 * write 类子图各自独立，走 wrapWriteAction 统一封装
 */
function buildActionRegistry(): ActionRegistry {
  return {
    // ============== 读任务 ==============
    read_datasources: {
      nodeId: 'read_datasources',
      kind: 'read',
      factory: () => readDatasourcesGraph(),
      pickOutput: (sub) => ({ datasources: sub.datasources })
    },
    read_datasets: {
      nodeId: 'read_datasets',
      kind: 'read',
      factory: () => readDatasetsGraph(),
      pickOutput: (sub) => ({ datasets: sub.datasets })
    },
    read_cells: {
      nodeId: 'read_cells',
      kind: 'read',
      factory: () => readCellsGraph(),
      pickOutput: (sub) => ({ cellsData: sub.cellsData })
    },
    read_rows: {
      nodeId: 'read_rows',
      kind: 'read',
      factory: () => readRowsGraph(),
      pickOutput: (sub) => ({ rowData: sub.rowData })
    },
    read_cols: {
      nodeId: 'read_cols',
      kind: 'read',
      factory: () => readColsGraph(),
      pickOutput: (sub) => ({ colData: sub.colData })
    },
    read_form: {
      nodeId: 'read_form',
      kind: 'read',
      factory: () => readFormGraph(),
      pickOutput: (sub) => ({ searchForm: sub.searchForm })
    },
    read_page: {
      nodeId: 'read_page',
      kind: 'read',
      factory: () => readPageGraph(),
      pickOutput: (sub) => ({
        pageConfig: sub.pageConfig,
        headerConfig: sub.headerConfig,
        footerConfig: sub.footerConfig
      })
    },
    // read_report：读取完整报表结构（组合多字段）
    read_report: {
      nodeId: 'read_report',
      kind: 'read',
      factory: () => readCellsGraph(),
      pickOutput: (sub) => ({
        cellsData: sub.cellsData,
        datasources: sub.datasources,
        datasets: sub.datasets,
        rowData: sub.rowData,
        colData: sub.colData,
        searchForm: sub.searchForm,
        pageConfig: sub.pageConfig,
        headerConfig: sub.headerConfig,
        footerConfig: sub.footerConfig
      })
    },

    // ============== 写任务：数据源 ==============
    create_datasource: wrapWriteAction('create_datasource_subgraph', createDatasourceGraph, (sub) => ({
      datasources: sub.datasources,
      targetDatasourceName: sub.targetDatasourceName,
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

    // ============== 写任务：数据集 ==============
    create_dataset: wrapWriteAction('create_dataset_subgraph', createDatasetGraph, (sub) => ({
      datasets: sub.datasets,
      dataset: sub.dataset,
      datasetWriteResult: sub.datasetWriteResult
    })),
    modify_dataset: wrapWriteAction('modify_dataset_subgraph', modifyDatasetGraph, (sub) => ({
      datasets: sub.datasets,
      dataset: sub.dataset,
      datasetWriteResult: sub.datasetWriteResult
    })),
    delete_dataset: wrapWriteAction('delete_dataset_subgraph', deleteDatasetGraph, (sub) => ({
      datasets: sub.datasets,
      datasetWriteResult: sub.datasetWriteResult
    })),

    // ============== 写任务：单元格 / 行 / 列 ==============
    modify_cell: wrapWriteAction('modify_cell_subgraph', modifyCellGraph, (sub) => ({
      cellsData: sub.cellsData,
      datasetWriteResult: sub.datasetWriteResult
    })),
    merge_cell: wrapWriteAction('merge_cell_subgraph', mergeCellsGraph, (sub) => ({
      cellsData: sub.cellsData,
      datasetWriteResult: sub.datasetWriteResult
    })),
    create_row: wrapWriteAction('create_row_subgraph', createRowGraph, (sub) => ({
      rowData: sub.rowData,
      datasetWriteResult: sub.datasetWriteResult
    })),
    modify_row: wrapWriteAction('modify_row_subgraph', modifyRowGraph, (sub) => ({
      rowData: sub.rowData,
      datasetWriteResult: sub.datasetWriteResult
    })),
    delete_row: wrapWriteAction('delete_row_subgraph', deleteRowGraph, (sub) => ({
      rowData: sub.rowData,
      datasetWriteResult: sub.datasetWriteResult
    })),
    create_col: wrapWriteAction('create_col_subgraph', createColGraph, (sub) => ({
      colData: sub.colData,
      datasetWriteResult: sub.datasetWriteResult
    })),
    modify_col: wrapWriteAction('modify_col_subgraph', modifyColGraph, (sub) => ({
      colData: sub.colData,
      datasetWriteResult: sub.datasetWriteResult
    })),
    delete_col: wrapWriteAction('delete_col_subgraph', deleteColGraph, (sub) => ({
      colData: sub.colData,
      datasetWriteResult: sub.datasetWriteResult
    })),

    // ============== 写任务：表格 ==============
    // 关键决策点：create_table 批量按 band 创建完整报表（替代 modify_cell 的批量场景）
    // 输出 cellsData（写入结果）+ datasets（供下游报表读取数据集）
    create_table: wrapWriteAction('create_table_subgraph', createTableGraph, (sub) => ({
      cellsData: sub.cellsData,
      datasets: sub.datasets,
      datasetWriteResult: sub.datasetWriteResult
    })),

    // ============== 写任务：表单 / 页面 ==============
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
          const desc = task?.params?.description ?? state.userMessage
          const childState = { ...state, userMessage: desc, taskParams: task?.params ?? {} }
          console.log(`[wrapWriteAction] ${nodeId} 开始执行子图, task=${task?.id}:${task?.action}, userMessage=${desc?.substring(0, 80)}`)
          try {
            const result = await sub.invoke(childState, options)
            console.log(`[wrapWriteAction] ${nodeId} 子图执行完成, result keys:`, Object.keys(result ?? {}))
            console.log(`[wrapWriteAction] ${nodeId} 子图结果: dataset=${!!result?.dataset}, datasetWriteResult=${JSON.stringify(result?.datasetWriteResult)}, errors=${JSON.stringify(result?.errors)}`)
            return result
          } catch (e: any) {
            console.error(`[wrapWriteAction] ${nodeId} 子图执行异常:`, e?.message ?? String(e))
            throw e
          }
        }
      } as CompiledReportGraph
    },
    pickOutput
  }
}
