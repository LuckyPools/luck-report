/**
 * 数据集相关子工作流
 * - createDatasetGraph：创建数据集
 * - modifyDatasetGraph：修改数据集
 * - deleteDatasetGraph：删除数据集
 */

import {
  ReportStateGraph,
  LLMDecideNode,
  LastValueAfterFinishChannel,
  defaultRetryOn
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { reportStateSchema } from '../state.ts'

// ==================== 创建数据集子工作流 ====================

/**
 * 创建数据集工作流
 * 失败节点不写业务 Channel，下游不触发；SQL 校验失败走条件边回退
 */
export function createDatasetGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true },
    output: { datasetWriteResult: true, searchForm: true }
  })

  // 节点1：确认数据源并准备SQL
  const prepareSqlOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('prepare_sql_out', prepareSqlOut)
  graph.addNode('prepare_sql', new LLMDecideNode({
    nodeId: 'prepare_sql',
    allowedTools: ['get_datasources', 'search_schema', 'load_buildin_datasources', 'add_datasource', 'get_table_relation', 'load_bean_methods', 'get_datasets', 'get_dataset_template'],
    requiredToolResults: ['get_datasources'],
    maxIterations: 4,
    description: '确认数据源存在（不存在则通过 search_schema 定位并创建），准备SQL或Bean方法，生成数据集对象',
    outChannelName: 'prepare_sql_out'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '确认数据源与准备SQL' }
  })

  // 节点2：校验SQL
  const validateSqlOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('validate_sql_out', validateSqlOut)
  graph.addNode('validate_sql', new LLMDecideNode({
    nodeId: 'validate_sql',
    allowedTools: ['preview_data', 'build_fields'],
    requiredToolResults: ['preview_data', 'build_fields'],
    maxIterations: 3,
    description: '调用 preview_data 验证SQL，调用 build_fields 解析字段',
    outChannelName: 'validate_sql_out'
  }), {
    triggers: ['prepare_sql_out'],
    triggerMode: 'any',
    retryPolicy: { maxAttempts: 3, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '校验SQL并解析字段' }
  })

  // 节点3：写入数据集
  const addDatasetOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('add_dataset_out', addDatasetOut)
  graph.addNode('add_dataset', new LLMDecideNode({
    nodeId: 'add_dataset',
    allowedTools: ['add_dataset'],
    requiredToolResults: ['add_dataset'],
    maxIterations: 3,
    description: '调用 add_dataset 写入数据集',
    outChannelName: 'add_dataset_out'
  }), {
    triggers: ['fieldsResult'],
    triggerMode: 'all',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '写入数据集' }
  })

  // 节点4：同步查询表单
  const syncFormOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('sync_form_out', syncFormOut)
  graph.addNode('sync_form', new LLMDecideNode({
    nodeId: 'sync_form',
    allowedTools: ['get_search_form', 'set_search_form'],
    maxIterations: 3,
    description: '检查查询表单是否已配置对应筛选组件，缺失则补充',
    outChannelName: 'sync_form_out'
  }), {
    triggers: ['datasetWriteResult'],
    triggerMode: 'all',
    metadata: { description: '同步查询表单' }
  })

  // 边：严格顺序
  graph.addEdge('__start__', 'prepare_sql')
  graph.addEdge('prepare_sql', 'validate_sql')
  graph.addEdge('validate_sql', 'add_dataset')
  graph.addEdge('add_dataset', 'sync_form')
  graph.addEdge('sync_form', '__end__')

  return graph.compile()
}

// ==================== 修改数据集子工作流 ====================

/**
 * 修改数据集工作流
 * 关键点：validate_and_rebuild_fields 在"SQL 未变"时跳过
 */
export function modifyDatasetGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true, datasets: true, searchResults: true },
    output: { datasets: true, searchForm: true }
  })

  // 节点1：确认数据集存在
  graph.addNode('confirm_dataset_exists', async (state, runtime) => {
    const datasets = await runtime?.toolRegistry.executeTool('get_datasets', {})
    return { datasets: Array.isArray(datasets) ? datasets : [datasets] }
  }, {
    triggers: ['__start__'],
    triggerMode: 'all',
    metadata: { silent: true, description: '获取现有数据集对象' }
  })

  // 节点2：修改数据集内容
  const modifyOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('modify_dataset_obj_out', modifyOut)
  graph.addNode('modify_dataset_obj', new LLMDecideNode({
    nodeId: 'modify_dataset_obj',
    allowedTools: ['get_table_relation', 'load_bean_methods', 'get_dataset_template'],
    maxIterations: 3,
    description: '基于获取的数据集对象修改字段，可调用 get_table_relation 或 load_bean_methods 辅助',
    outChannelName: 'modify_dataset_obj_out'
  }), {
    triggers: ['datasets'],
    triggerMode: 'all',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '修改数据集内容' }
  })

  // 节点3：校验SQL并重建字段
  const validateOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('validate_and_rebuild_out', validateOut)
  graph.addNode('validate_and_rebuild_fields', new LLMDecideNode({
    nodeId: 'validate_and_rebuild_fields',
    allowedTools: ['preview_data', 'build_fields'],
    requiredToolResults: ['preview_data', 'build_fields'],
    maxIterations: 3,
    description: '若修改了SQL，调用 preview_data 验证，调用 build_fields 重建字段',
    outChannelName: 'validate_and_rebuild_out'
  }), {
    triggers: ['modify_dataset_obj_out'],
    triggerMode: 'any',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    skipWhen: (state) => state.sqlValidationResult?.data?.sqlChanged === false,
    metadata: { description: '校验SQL并重建字段' }
  })

  // 节点4：更新数据集
  const updateOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('update_dataset_out', updateOut)
  graph.addNode('update_dataset', new LLMDecideNode({
    nodeId: 'update_dataset',
    allowedTools: ['update_dataset'],
    requiredToolResults: ['update_dataset'],
    maxIterations: 3,
    description: '调用 update_dataset 写入修改',
    outChannelName: 'update_dataset_out'
  }), {
    triggers: ['validate_and_rebuild_out'],
    triggerMode: 'any',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '写入数据集' }
  })

  // 节点5：同步查询表单
  const syncFormOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('sync_modified_form_out', syncFormOut)
  graph.addNode('sync_modified_form', new LLMDecideNode({
    nodeId: 'sync_modified_form',
    allowedTools: ['get_search_form', 'set_search_form'],
    maxIterations: 3,
    description: '检查查询表单是否已配置对应筛选组件，缺失则补充',
    outChannelName: 'sync_modified_form_out'
  }), {
    triggers: ['update_dataset_out'],
    triggerMode: 'any',
    metadata: { description: '同步查询表单' }
  })

  // 边
  graph.addEdge('__start__', 'confirm_dataset_exists')
  graph.addEdge('confirm_dataset_exists', 'modify_dataset_obj')
  // 条件边：SQL 未变时跳过 rebuild 直接 update
  graph.addConditionalEdges('modify_dataset_obj', (state) => {
    if (!state.sqlValidationResult?.data?.sqlChanged) {
      return 'update_dataset'
    }
    return 'validate_and_rebuild_fields'
  })
  graph.addEdge('validate_and_rebuild_fields', 'update_dataset')
  graph.addEdge('update_dataset', 'sync_modified_form')
  graph.addEdge('sync_modified_form', '__end__')

  return graph.compile()
}

// ==================== 删除数据集子工作流 ====================

/**
 * 删除数据集工作流
 */
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
