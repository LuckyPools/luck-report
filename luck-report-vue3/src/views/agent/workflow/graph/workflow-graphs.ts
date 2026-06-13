/** 工作流图统一导出与注册表入口（按业务域拆分到 task/ 子模块） */

import { createDatasetGraph, modifyDatasetGraph, deleteDatasetGraph } from './task/dataset-create-graphs.ts'
import { createDatasourceGraph, modifyDatasourceGraph, deleteDatasourceGraph } from './task/datasource-graphs.ts'
import { modifyCellGraph } from './task/cell-graphs.ts'
import { modifyRowGraph, modifyColGraph } from './task/row-col-graphs.ts'
import { modifyFormGraph, modifyPageGraph } from './task/form-page-graphs.ts'
import { modifyReportGraph } from './task/modify-report-graph.ts'
import { analyzeReportGraph } from './task/analyze-report-graph.ts'
import type { CompiledReportGraph } from './index'

// 子图直接转发，供新业务代码按域引用
export {
  createDatasetGraph, modifyDatasetGraph, deleteDatasetGraph,
  createDatasourceGraph, modifyDatasourceGraph, deleteDatasourceGraph,
  modifyCellGraph,
  modifyRowGraph, modifyColGraph,
  modifyFormGraph, modifyPageGraph,
  modifyReportGraph, analyzeReportGraph
}

export type { CompiledReportGraph }

const graphRegistry = new Map<string, () => CompiledReportGraph>()

/**
 * 注册工作流图
 * @param intentType 意图类型，不可为空
 * @param factory 编译后图的工厂函数，不可为空
 */
function registerGraph(intentType: string, factory: () => CompiledReportGraph): void {
  graphRegistry.set(intentType, factory)
}

registerGraph('modify_report', modifyReportGraph)
registerGraph('analyze_report', analyzeReportGraph)

/**
 * 根据意图类型获取工作流图
 */
export function getGraphByIntent(intentType: string): CompiledReportGraph | undefined {
  return graphRegistry.get(intentType)?.()
}

/**
 * 根据子工作流类型获取子图
 */
export function getSubGraphByType(subworkflowType: string): CompiledReportGraph | undefined {
  const subGraphFactories: Record<string, () => CompiledReportGraph> = {
    create_datasource: createDatasourceGraph,
    create_dataset: createDatasetGraph,
    modify_dataset: modifyDatasetGraph,
    modify_datasource: modifyDatasourceGraph,
    delete_datasource: deleteDatasourceGraph,
    delete_dataset: deleteDatasetGraph,
    modify_cell: modifyCellGraph,
    modify_row: modifyRowGraph,
    modify_col: modifyColGraph
  }
  return subGraphFactories[subworkflowType]?.()
}
