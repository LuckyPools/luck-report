/**
 * LangGraph 工作流图注册表（VITE_USE_LANGGRAPH_ENGINE=true 时使用）
 * 与 graph/workflow-graphs.ts 保持同名同签名的工厂函数，agent-loop.ts 无感知切换
 *
 * 已迁移：datasource、dataset、cell、row、col、form、page、modify_report、analyze_report
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
  modifyFormGraph,
  modifyPageGraph,
  modifyReportGraph,
  analyzeReportGraph
} from './graphs'

/**
 * 已迁移到 LangGraph 的图注册表
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

// 顶层意图图
registerGraph('modify_report', modifyReportGraph)
registerGraph('analyze_report', analyzeReportGraph)

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
    // 表单/页面
    modify_form: modifyFormGraph,
    modify_page: modifyPageGraph
  }
  return migratedSubGraphFactories[subworkflowType]?.()
}
