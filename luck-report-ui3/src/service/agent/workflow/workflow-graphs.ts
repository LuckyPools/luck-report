/**
 * LangGraph 工作流图注册表（VITE_USE_LANGGRAPH_ENGINE=true 时使用）
 * 与 graph/workflow-graphs.ts 保持同名同签名的工厂函数，agent-loop.ts 无感知切换
 *
 * 顶层唯一入口：[report_agent]（Planner 自主规划 read_* + write_* + summary 任务，Dispatcher 自环执行）
 */

import type { CompiledReportGraph } from './langgraph'
import {
  createDatasourceGraph,
  modifyDatasourceGraph,
  deleteDatasourceGraph,
  createDatasetGraph,
  modifyDatasetGraph,
  deleteDatasetGraph,
  modifyCellGraph,
  modifyRowGraph,
  modifyColGraph,
  deleteRowGraph,
  deleteColGraph,
  modifyFormGraph,
  modifyPageGraph
} from './graphs'
import { buildUnifiedReportGraph } from './graphs/unified-report-graph.ts'

/**
 * 工作流图注册表
 * 格式与 graph/workflow-graphs.ts 一致：intentType → factory
 */
const graphRegistry = new Map<string, () => CompiledReportGraph>()

/**
 * 注册工作流图
 * @param intentType - 意图类型，不可为空
 * @param factory - 编译后图的工厂函数，不可为空
 */
function registerGraph(intentType: string, factory: () => CompiledReportGraph): void {
  graphRegistry.set(intentType, factory)
}

// 顶层统一入口：read + write 自由混排，Planner 自主规划
registerGraph('report_agent', () => buildUnifiedReportGraph())

/**
 * 根据意图类型获取工作流图
 * @param intentType - 意图类型
 * @returns 对应工作流图；未找到时返回 undefined
 */
export function getGraphByIntent(intentType: string): CompiledReportGraph | undefined {
  return graphRegistry.get(intentType)?.()
}

/**
 * 根据子工作流类型获取子图
 * @param subworkflowType - 子工作流类型
 * @returns 对应子图；未找到时返回 undefined
 */
export function getSubGraphByType(subworkflowType: string): CompiledReportGraph | undefined {
  const migratedSubGraphFactories: Record<string, () => CompiledReportGraph> = {
    // 数据源
    create_datasource: createDatasourceGraph,
    modify_datasource: modifyDatasourceGraph,
    delete_datasource: deleteDatasourceGraph,
    // 数据集
    create_dataset: createDatasetGraph,
    modify_dataset: modifyDatasetGraph,
    delete_dataset: deleteDatasetGraph,
    // 单元格
    modify_cell: modifyCellGraph,
    // 行/列
    modify_row: modifyRowGraph,
    modify_col: modifyColGraph,
    delete_row: deleteRowGraph,
    delete_col: deleteColGraph,
    // 表单/页面
    modify_form: modifyFormGraph,
    modify_page: modifyPageGraph
  }
  return migratedSubGraphFactories[subworkflowType]?.()
}
