/**
 * LangGraph 工作流图注册表
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
import { buildUnifiedReportGraph } from './graphs/unit-report-graph.ts'

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


