/**
 * 修改数据集工作流
 * modifyDatasetGraph：读取现有数据集 + 共享管道重建 + update_dataset 覆盖写入
 */

import { ReportStateGraph } from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { reportStateSchema } from '../state.ts'
import { runToolWithEvent } from '../utils.ts'
import { addSharedDatasetPipeline } from './dataset-shared-nodes.ts'

// ==================== 修改数据集子工作流 ====================

/**
 * 修改数据集工作流（确定性代码管道 + 筛选条件 LLM 节点）
 *
 * load_existing_dataset → prepare_schema → resolve_datasource → resolve_table
 * → fetch_dataset_template → resolve_filter_conditions → build_dataset
 * → validate_dataset → update_dataset → confirm_dataset → sync_form_subgraph
 */
export function modifyDatasetGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true, datasets: true, searchResults: true },
    output: {
      datasets: true,
      searchForm: true,
      dataset: true,
      errors: true,
      targetDatasourceName: true,
      datasetWriteResult: true
    }
  })

  // 独有前置节点：读取现有数据集（必须在 addSharedDatasetPipeline 之前添加）
  graph.addNode('load_existing_dataset', async (state, runtime) => {
    const stepId = 'load_existing_dataset'
    // 1. 调用 get_datasets 获取所有数据集
    const allDatasets: any = await runToolWithEvent(runtime, stepId, 'get_datasets', {})
    // 2. 根据 intent 定位目标数据集（按名称匹配）
    const targetName = state.intent?.targetDatasetName || state.intent?.datasetName
    const dsList: any[] = Array.isArray(allDatasets)
      ? allDatasets
      : (Array.isArray(allDatasets?.datasets) ? allDatasets.datasets : [])
    if (!targetName) {
      return { errors: ['load_existing_dataset: intent 中缺少目标数据集名称（targetDatasetName 或 datasetName）'] }
    }
    const found = dsList.find((d: any) => d?.name === targetName)
    if (!found) {
      return { errors: [`load_existing_dataset: 未找到目标数据集 "${targetName}"，当前共有 ${dsList.length} 个数据集`] }
    }
    const dsName = found.datasourceName || found.datasource
    console.log(`[dataset-update] ${stepId} 出口`, JSON.stringify({
      datasetName: found.name,
      datasourceName: dsName,
      fieldCount: Array.isArray(found.fields) ? found.fields.length : 0
    }))
    // 3. 写入 state
    return {
      dataset: found,
      targetDatasourceName: dsName,
      datasets: dsList
    }
  }, {
    triggers: ['__start__'],
    triggerMode: 'all',
    metadata: { silent: true, description: '读取现有数据集对象' }
  })

  // 独有节点：update_dataset（必须在 addSharedDatasetPipeline 之前添加）
  graph.addNode('update_dataset', async (state, runtime) => {
    const stepId = 'update_dataset'
    const dsName = state.targetDatasourceName
    const dataset = state.dataset
    const datasetName = (dataset as any)?.name
    if (!dsName || !dataset || !datasetName) {
      return { errors: ['update_dataset: 缺少 datasourceName 或 dataset'] }
    }
    const result: any = await runToolWithEvent(runtime, stepId, 'update_dataset', {
      datasourceName: dsName,
      datasetName,
      dataset
    })
    if (result?.success === false) {
      return { errors: [`update_dataset 失败: ${result.message || '未知错误'}`] }
    }
    console.log(`[dataset-update] ${stepId} 出口`, JSON.stringify({ success: true }))
    return { datasetWriteResult: { success: true, message: result?.message } }
  }, {
    triggers: ['sqlValidationResult'],
    triggerMode: 'any',
    metadata: { silent: true, description: '覆盖写入数据集' }
  })

  // 公共管道（传入 writeNodeId = 'update_dataset'，修改模式保留原名称）
  addSharedDatasetPipeline(graph, 'update_dataset', { preserveName: true })

  // 补充起始边和末尾边
  graph.addEdge('__start__', 'load_existing_dataset')
  graph.addEdge('load_existing_dataset', 'prepare_schema')
  graph.addEdge('sync_form_subgraph', '__end__')

  return graph.compile()
}
