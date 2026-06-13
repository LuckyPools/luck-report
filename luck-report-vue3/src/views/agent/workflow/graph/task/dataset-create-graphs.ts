/**
 * 数据集相关子工作流
 * - createDatasetGraph：创建数据集
 * - modifyDatasetGraph：修改数据集（委托至 dataset-update-graphs.ts）
 * - deleteDatasetGraph：删除数据集
 */

import {
  ReportStateGraph,
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { reportStateSchema } from '../state.ts'
import { runToolWithEvent } from '../utils.ts'
import {
  sharedInputKeys,
  sharedOutputKeys,
  addSharedDatasetPipeline
} from './dataset-shared-nodes.ts'

// 修改数据集工作流从独立文件重新导出
export { modifyDatasetGraph } from './dataset-update-graphs.ts'

// ==================== 创建数据集子工作流 ====================

/**
 * 创建数据集工作流（确定性代码管道 + 筛选条件 LLM 节点）
 *
 * prepare_schema → resolve_datasource → resolve_table → fetch_dataset_template
 * → resolve_filter_conditions → build_dataset → validate_dataset → add_dataset → confirm_dataset → sync_form_subgraph
 */
export function createDatasetGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: sharedInputKeys,
    output: sharedOutputKeys
  })

  // 独有节点：add_dataset（必须在 addSharedDatasetPipeline 之前添加）
  graph.addNode('add_dataset', async (state, runtime) => {
    const stepId = 'add_dataset'
    const dsName = state.targetDatasourceName
    const dataset = state.dataset
    if (!dsName || !dataset) return { errors: ['add_dataset: 缺少 datasourceName 或 dataset'] }

    const result: any = await runToolWithEvent(runtime, stepId, 'add_dataset', {
      datasourceName: dsName,
      dataset
    })
    if (result?.success === false) {
      return { errors: [`add_dataset 失败: ${result.message || '未知错误'}`] }
    }
    console.log(`[dataset-graph] ${stepId} 出口`, JSON.stringify({ success: true }))
    return { datasetWriteResult: { success: true, message: result?.message, datasetId: result?.datasetId } }
  }, {
    triggers: ['sqlValidationResult'],
    triggerMode: 'any',
    metadata: { silent: true, description: '写入数据集' }
  })

  // 一键添加公共管道（传入 writeNodeId = 'add_dataset'，创建模式不保留名称）
  addSharedDatasetPipeline(graph, 'add_dataset', { preserveName: false })

  // 只需补充起始边和末尾边
  graph.addEdge('__start__', 'prepare_schema')
  graph.addEdge('sync_form_subgraph', '__end__')

  return graph.compile()
}

// ==================== 删除数据集子工作流 ====================

export function deleteDatasetGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true },
    output: { datasets: true }
  })

  graph.addNode('confirm_dataset_exists', async (state, runtime) => {
    const datasets = await runtime?.toolRegistry.executeTool('get_datasets', {})
    return { datasets }
  }, {
    triggers: ['__start__'],
    triggerMode: 'all',
    metadata: { silent: true, description: '确认目标数据集存在' }
  })

  graph.addNode('delete_dataset_obj', async (state, runtime) => {
    const result = await runtime?.toolRegistry.executeTool('remove_dataset', {})
    return { datasets: result }
  }, {
    triggers: ['datasets'],
    triggerMode: 'all',
    metadata: { description: '删除数据集' }
  })

  graph.addEdge('__start__', 'confirm_dataset_exists')
  graph.addEdge('confirm_dataset_exists', 'delete_dataset_obj')
  graph.addEdge('delete_dataset_obj', '__end__')

  return graph.compile()
}
