/**
 * 新版工作流图定义
 * 用 StateGraph 重写所有工作流，替换旧版 WorkflowDefinition
 *
 * 核心改进：
 * 1. Channel 门控：失败不写业务 Channel → 下游不触发
 * 2. 条件边：addConditionalEdges 替代 subworkflowSelector
 * 3. 子图嵌入：CompiledReportGraph 作为节点
 * 4. 两阶段提交：LLMDecideNode + LastValueAfterFinishChannel
 */

import {
  ReportStateGraph,
  LLMDecideNode,
  ToolCallNode,
  LastValueAfterFinishChannel,
  defaultRetryOn
} from './index'
import type { CompiledReportGraph } from './index'
import { reportStateSchema } from './state'

// ==================== 工具结果标准化（load_report_introduce） ====================

/**
 * 文档分隔符：与旧工具实现保持一致（兼容旧版 result 是字符串的兜底分支）
 * 仅在工具返回字符串时使用，新版工具已返回结构体，正常不会触发
 */
const DOC_SEPARATOR = /\n*---- 分界线 ----\n*/

/**
 * 从 load_report_introduce 工具返回结果中提取 { docName: content } 映射
 *
 * @param result - 工具返回值，新版为 { docs: { ... } }，旧版可能为字符串，可为空
 * @param fallbackNames - 当 result 是字符串时按此顺序一一对应分配 docName，可为空
 * @returns 文档名到内容的映射，Record<string, string>，可为空对象
 */
function extractDocsMap(result: any, fallbackNames?: string[]): Record<string, string> {
  if (!result) return {}
  // 主路径：新版工具返回结构体 { docs: { [fileName]: content } }
  if (typeof result === 'object' && result.docs && typeof result.docs === 'object') {
    // 过滤掉空字符串/非字符串值，避免把 error 字段塞进 cache
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(result.docs)) {
      if (typeof v === 'string' && v.length > 0) out[k] = v
    }
    return out
  }
  // 兜底：旧版 result 是字符串，按分隔符切分后按 fallbackNames 顺序映射
  // 分片数与请求数不一致时，缺失部分用整段兜底，保证 cache 至少把 docName 登记上
  if (typeof result === 'string' && fallbackNames && fallbackNames.length > 0) {
    const parts = result.split(DOC_SEPARATOR)
    const out: Record<string, string> = {}
    fallbackNames.forEach((name, i) => {
      out[name] = parts[i] ?? result
    })
    return out
  }
  return {}
}

/**
 * 把工具返回值规范化为 LLM/UI 友好的纯文本
 * 格式：[docName]\ncontent（多篇用 "\n\n---- 分界线 ----\n" 拼接）
 * 与 buildMessages.knowledgeBlock 的拼接格式保持一致
 *
 * @param result - 工具返回值，可为空
 * @returns 规范化后的纯文本，string
 */
function formatDocsAsText(result: any): string {
  if (!result) return ''
  // 主路径：结构体 → 按 key 顺序拼纯文本
  if (typeof result === 'object' && result.docs && typeof result.docs === 'object') {
    return Object.entries(result.docs)
      .filter(([, v]) => typeof v === 'string' && v.length > 0)
      .map(([name, content]) => `[${name}]\n${content}`)
      .join('\n\n---- 分界线 ----\n')
  }
  // 兜底：旧版字符串原样返回
  if (typeof result === 'string') return result
  return ''
}

// ==================== 创建数据集子工作流 ====================

/**
 * 创建数据集工作流
 *
 * 关键设计：
 * 1. 失败节点不写业务 Channel：validate_sql / build_fields 失败 → 不写 sqlValidationResult / fieldsResult → 下游不触发
 * 2. 条件边实现 SQL 校验失败回退
 * 3. LLMDecideNode 替换原 _llm_decide
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
    // [修复] 原 triggers: ['datasources']（prepare_sql 不写 datasources channel），改为 ['prepare_sql_out']（上游 LLM outChannel）
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

// ==================== 创建数据源子工作流 ====================

/**
 * 创建数据源工作流
 * 仅允许创建 buildin 类型数据源
 */
export function createDatasourceGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true },
    output: { datasources: true }
  })

  const searchOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('search_and_create_out', searchOut)
  graph.addNode('search_and_create', new LLMDecideNode({
    nodeId: 'search_and_create',
    allowedTools: ['search_schema', 'load_buildin_datasources', 'add_datasource'],
    requiredToolResults: ['search_schema', 'load_buildin_datasources', 'add_datasource'],
    description: '调用 search_schema 定位数据源，调用 load_buildin_datasources 校验名称，调用 add_datasource 创建',
    outChannelName: 'search_and_create_out'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '搜索并创建数据源' }
  })

  graph.addNode('confirm_datasource', async (state, runtime) => {
    const datasources = await runtime?.toolRegistry.executeTool('get_datasources', {})
    if (!datasources || (Array.isArray(datasources) && datasources.length === 0)) {
      return { errors: ['数据源创建可能失败，当前报表仍无数据源'] }
    }
    return { datasources }
  }, {
    // [修复] 原 triggers: ['search_and_create']（节点名非 Channel），改为 ['search_and_create_out']（已 addChannel）
    triggers: ['search_and_create_out'],
    triggerMode: 'any',
    metadata: { silent: true, description: '确认数据源存在' }
  })

  graph.addEdge('__start__', 'search_and_create')
  graph.addEdge('search_and_create', 'confirm_datasource')
  graph.addEdge('confirm_datasource', '__end__')

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
    // [修复] 原 triggers: ['sqlValidationResult']（modify_dataset_obj 不写该 channel），
    //       改为 ['modify_dataset_obj_out']（上游 LLM outChannel）
    triggers: ['modify_dataset_obj_out'],
    triggerMode: 'any',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    skipWhen: (state) => {
      // SQL 未变时跳过
      return state.sqlValidationResult?.data?.sqlChanged === false
    },
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
    // [修复] 原 triggers: ['fieldsResult'] 改为 ['validate_and_rebuild_out']（上游 LLM outChannel）
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
    // [修复] 原 triggers: ['datasetWriteResult'] 改为 ['update_dataset_out']（上游 LLM outChannel）
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

// ==================== 修改数据源子工作流 ====================

/**
 * 修改数据源工作流
 */
export function modifyDatasourceGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true },
    output: { datasources: true }
  })

  graph.addNode('read_datasource', async (state, runtime) => {
    const datasources = await runtime?.toolRegistry.executeTool('get_datasources', {})
    return { datasources }
  }, {
    triggers: ['__start__'],
    triggerMode: 'all',
    metadata: { silent: true, description: '读取目标数据源的当前配置' }
  })

  const modifyOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('modify_datasource_obj_out', modifyOut)
  graph.addNode('modify_datasource_obj', new LLMDecideNode({
    nodeId: 'modify_datasource_obj',
    allowedTools: ['update_datasource', 'get_datasource_template'],
    requiredToolResults: ['update_datasource'],
    description: '基于读取的数据源对象修改字段，调用 update_datasource 写入',
    outChannelName: 'modify_datasource_obj_out'
  }), {
    triggers: ['datasources'],
    triggerMode: 'all',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '修改数据源对象' }
  })

  graph.addEdge('__start__', 'read_datasource')
  graph.addEdge('read_datasource', 'modify_datasource_obj')
  graph.addEdge('modify_datasource_obj', '__end__')

  return graph.compile()
}

// ==================== 删除数据源子工作流 ====================

/**
 * 删除数据源工作流
 */
export function deleteDatasourceGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true },
    output: { datasources: true }
  })

  graph.addNode('confirm_datasource_exists', async (state, runtime) => {
    const datasources = await runtime?.toolRegistry.executeTool('get_datasources', {})
    return { datasources }
  }, {
    triggers: ['__start__'],
    triggerMode: 'all',
    metadata: { silent: true, description: '确认目标数据源存在' }
  })

  graph.addNode('delete_datasource_obj', async (state, runtime) => {
    const result = await runtime?.toolRegistry.executeTool('remove_datasource', {})
    return { datasources: result }
  }, {
    triggers: ['datasources'],
    triggerMode: 'all',
    metadata: { description: '删除数据源' }
  })

  graph.addEdge('__start__', 'confirm_datasource_exists')
  graph.addEdge('confirm_datasource_exists', 'delete_datasource_obj')
  graph.addEdge('delete_datasource_obj', '__end__')

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

// ==================== 修改单元格子工作流 ====================

/**
 * 修改单元格工作流
 */
export function modifyCellGraph(): CompiledReportGraph {
  // [修复] input 增加 searchResults：接收主图 load_docs 加载的文档内容，
  // 配合 LLMDecideNode.buildMessages 注入，单元格子图内的 LLM 节点能看到知识
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true, datasets: true, searchResults: true },
    output: { cellsData: true }
  })

  // 节点1：读取单元格数据
  const readOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_cells_out', readOut)
  graph.addNode('read_cells', new LLMDecideNode({
    nodeId: 'read_cells',
    allowedTools: ['read_cells'],
    requiredToolResults: ['read_cells'],
    maxIterations: 2,
    resultKey: 'cellsData',
    description: '本步骤仅负责一次性读取用户指定的所有目标单元格（必须把用户提到的全部坐标一次传入 read_cells.cellPositionArray，例如 A1+B2 应传 [{row:1,col:1},{row:2,col:2}]）。**禁止**重复读取、禁止输出任何文字向用户提问、禁止在本步骤尝试写入。读到结果后立即结束本步骤，写入操作由后续的 modify_and_write_cells 完成。**读到的 cellsData 会自动进入 modify_and_write_cells 的 context，无需也不允许重读**。',
    outChannelName: 'read_cells_out'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '读取单元格数据' }
  })

  // 节点2：补齐行列（纯函数，零 LLM）
  // 解析 cellsData 目标坐标 → 调 get_rows/get_columns 拿当前 rows/cols → 差值时调 insert_row/insert_col
  // 彻底消除"LLM 漏调 insert_row/insert_col"的概率
  graph.addNode('check_and_apply_row_col', async (state, runtime) => {
    const cellsData = state.cellsData
    if (!cellsData || !runtime) return {}

    // 1. 从 cellsData 的 key 解析目标 maxRow/maxCol（key 为 "row,col"，从1开始）
    let targetRow = 0
    let targetCol = 0
    for (const key of Object.keys(cellsData)) {
      const [r, c] = key.split(',').map(n => parseInt(n, 10))
      if (Number.isFinite(r) && r > targetRow) targetRow = r
      if (Number.isFinite(c) && c > targetCol) targetCol = c
    }
    if (targetRow === 0 && targetCol === 0) return {}

    // 2. 调 get_rows / get_columns 拿当前 rows / cols
    // 工具返回 { "1": def, "2": def } 形式，键数即为行/列数
    const rowsResult = await runtime.toolRegistry.executeTool('get_rows', {})
    const colsResult = await runtime.toolRegistry.executeTool('get_columns', {})
    const currentRows = rowsResult && typeof rowsResult === 'object' ? Object.keys(rowsResult).length : 0
    const currentCols = colsResult && typeof colsResult === 'object' ? Object.keys(colsResult).length : 0

    // 3. 行不足则补齐（position 是 0-based 索引，追加在末尾）
    if (currentRows < targetRow) {
      const args = { position: currentRows, number: targetRow - currentRows }
      const toolCallId = `check_row_col#${runtime.runId}#insert_row`
      runtime.emitEvent({ mode: 'updates', event: { nodeId: 'check_and_apply_row_col', output: { type: 'tool_call', toolCallId, toolName: 'insert_row', input: args }, status: 'running' }, timestamp: Date.now() })
      const result = await runtime.toolRegistry.executeTool('insert_row', args)
      runtime.emitEvent({ mode: 'updates', event: { nodeId: 'check_and_apply_row_col', output: { type: 'tool_result', toolCallId, toolName: 'insert_row', result }, status: 'success' }, timestamp: Date.now() })
    }

    // 4. 列不足则补齐
    if (currentCols < targetCol) {
      const args = { position: currentCols, number: targetCol - currentCols }
      const toolCallId = `check_row_col#${runtime.runId}#insert_col`
      runtime.emitEvent({ mode: 'updates', event: { nodeId: 'check_and_apply_row_col', output: { type: 'tool_call', toolCallId, toolName: 'insert_col', input: args }, status: 'running' }, timestamp: Date.now() })
      const result = await runtime.toolRegistry.executeTool('insert_col', args)
      runtime.emitEvent({ mode: 'updates', event: { nodeId: 'check_and_apply_row_col', output: { type: 'tool_result', toolCallId, toolName: 'insert_col', result }, status: 'success' }, timestamp: Date.now() })
    }

    // 回写 cellsData 触发下游 modify_and_write_cells（同值覆盖，channel version 递增）
    return { cellsData }
  }, {
    triggers: ['cellsData'],
    triggerMode: 'any',
    metadata: { description: '补齐行列' }
  })

  // 节点3：修改并写入单元格
  const writeOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('modify_and_write_cells_out', writeOut)
  graph.addNode('modify_and_write_cells', new LLMDecideNode({
    nodeId: 'modify_and_write_cells',
    // [修复] 加入 load_report_introduce 作为兜底：主图 load_docs 可能没加载到关键文档，
    // 子图内 LLM 在发现自己缺知识时（如"父格+表达式"复合需求）可主动补查
    allowedTools: ['write_cells', 'get_cell_template', 'load_report_introduce'],
    requiredToolResults: ['write_cells'],
    maxIterations: 6,
    description: 'cellsData 已在 context 中，禁止重读。按"读 cellsData → 场景判断（空/类型变更/同类型修改）→ 一次 write_cells"流程处理。' +
      '**索引基准**：get_cell_template 的 rowIndex/colIndex 是 0-based；write_cells 的 key "row,col" 是 1-based，如 C4 → rowIndex=3, colIndex=2, key="4,3"。' +
      '失败必须按 message 修正后重试 write_cells，禁止换工具。',
    outChannelName: 'modify_and_write_cells_out'
  }), {
    triggers: ['cellsData'],
    triggerMode: 'any',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '修改并写入单元格' }
  })

  graph.addEdge('__start__', 'read_cells')
  graph.addEdge('read_cells', 'check_and_apply_row_col')
  graph.addEdge('check_and_apply_row_col', 'modify_and_write_cells')
  graph.addEdge('modify_and_write_cells', '__end__')

  return graph.compile()
}

// ==================== 修改行子工作流 ====================

/**
 * 修改行结构工作流：read → ensure → modify_and_write，专注行操作（行高/插入/删除行）。
 * read 节点用 resultKey='rowData' 把 get_rows 返回的数组写入 state.rowData；
 * write 节点不设 resultKey（工具返回 success/message 不是数据本身），改用 outChannel 触发下游。
 */
export function modifyRowGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true, searchResults: true },
    output: { rowData: true }
  })

  // 节点1：读取行
  const readOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_rows_out', readOut)
  graph.addNode('read_rows', new ToolCallNode({
    nodeId: 'read_rows',
    toolName: 'get_rows',
    // [派生参数] 不传参 = 读所有行；后续若需要"按范围读"可改成函数从 state 取
    args: {},
    outChannelName: 'read_rows_out',
    // [对齐 LLMDecideNode] 保持 resultKey='rowData'，下游 modify_and_write_row 的 triggers=rowData 不变
    resultKey: 'rowData'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '读取行数据' }
  })

  // 节点2：确保目标行存在（缺失时插入）
  const ensureOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('ensure_row_out', ensureOut)
  graph.addNode('ensure_row', new LLMDecideNode({
    nodeId: 'ensure_row',
    allowedTools: ['insert_row'],
    description: '检查目标行号是否已存在。已存在直接结束；不存在则调 insert_row 补齐。' +
      '**禁止**调用 set_rows / 列相关工具 / write_cells 等。',
    outChannelName: 'ensure_row_out'
  }), {
    triggers: ['rowData'],
    triggerMode: 'any',
    metadata: { description: '补齐缺失的行' }
  })

  // 节点3：修改并写入行
  const writeOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('modify_and_write_row_out', writeOut)
  graph.addNode('modify_and_write_row', new LLMDecideNode({
    nodeId: 'modify_and_write_row',
    allowedTools: ['set_rows', 'insert_row', 'load_report_introduce'],
    requiredToolResultsAny: ['set_rows', 'insert_row'],
    maxIterations: 4,
    description:
      '【必须调工具】你必须调用 set_rows / insert_row 之一完成写入，' +
      '否则任务失败。\n' +
      '【必须用 native 格式】请使用 OpenAI 原生 function calling（tool_calls 字段）输出工具调用，' +
      '不要把工具调用写到文本 content 里（不要用 ```json {"tool": ...} ``` 这种格式）。\n' +
      'rowData 已在 context 中，不需要再调 get_rows。\n' +
      '批量改或新建 → set_rows({rows: 全量数组}) 一次性传入。' +
      '禁止分多轮写入。',
    outChannelName: 'modify_and_write_row_out'
  }), {
    triggers: ['rowData'],
    triggerMode: 'any',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '修改并写入行数据' }
  })

  graph.addEdge('__start__', 'read_rows')
  graph.addEdge('read_rows', 'ensure_row')
  graph.addEdge('ensure_row', 'modify_and_write_row')
  graph.addEdge('modify_and_write_row', '__end__')

  return graph.compile()
}

// ==================== 修改列子工作流 ====================

/**
 * 修改列结构工作流：read → ensure → modify_and_write，专注列操作（列宽/插入/删除列）。
 * read 节点用 resultKey='colData' 把 get_columns 返回的数组写入 state.colData；
 * write 节点不设 resultKey（工具返回 success/message 不是数据本身），改用 outChannel 触发下游。
 */
export function modifyColGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true, searchResults: true },
    output: { colData: true }
  })

  // 节点1：读取列
  const readOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_cols_out', readOut)
  graph.addNode('read_cols', new ToolCallNode({
    nodeId: 'read_cols',
    toolName: 'get_columns',
    // [派生参数] 不传参 = 读所有列；后续若需要"按范围读"可改成函数从 state 取
    args: {},
    outChannelName: 'read_cols_out',
    // [对齐 LLMDecideNode] 保持 resultKey='colData'，下游 modify_and_write_col 的 triggers=colData 不变
    resultKey: 'colData'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '读取列数据' }
  })

  // 节点2：确保目标列存在（缺失时插入）
  const ensureOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('ensure_col_out', ensureOut)
  graph.addNode('ensure_col', new LLMDecideNode({
    nodeId: 'ensure_col',
    allowedTools: ['insert_col'],
    description: '检查目标列号是否已存在。已存在直接结束；不存在则调 insert_col 补齐。' +
      '**禁止**调用 set_columns / 行相关工具 / write_cells 等。',
    outChannelName: 'ensure_col_out'
  }), {
    triggers: ['colData'],
    triggerMode: 'any',
    metadata: { description: '补齐缺失的列' }
  })

  // 节点3：修改并写入列
  const writeOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('modify_and_write_col_out', writeOut)
  graph.addNode('modify_and_write_col', new LLMDecideNode({
    nodeId: 'modify_and_write_col',
    allowedTools: ['set_columns', 'insert_col', 'load_report_introduce'],
    requiredToolResultsAny: ['set_columns', 'insert_col'],
    maxIterations: 4,
    description:
      '【必须调工具】你必须调用 set_columns / insert_col 之一完成写入，' +
      '否则任务失败。\n' +
      '【必须用 native 格式】请使用 OpenAI 原生 function calling（tool_calls 字段）输出工具调用，' +
      '不要把工具调用写到文本 content 里（不要用 ```json {"tool": ...} ``` 这种格式）。\n' +
      'colData 已在 context 中，不需要再调 get_columns。\n' +
      '批量改或新建 → set_columns({columns: 全量数组}) 一次性传入。' +
      '禁止分多轮写入。',
    outChannelName: 'modify_and_write_col_out'
  }), {
    triggers: ['colData'],
    triggerMode: 'any',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '修改并写入列数据' }
  })

  graph.addEdge('__start__', 'read_cols')
  graph.addEdge('read_cols', 'ensure_col')
  graph.addEdge('ensure_col', 'modify_and_write_col')
  graph.addEdge('modify_and_write_col', '__end__')

  return graph.compile()
}

// ==================== 主工作流 ====================

/**
 * 修改报表主工作流
 *
 * 阶段1：4 个并行搜索节点（Barrier AND 语义）
 * 阶段2：意图路由
 * 阶段3：子图嵌入
 * 阶段4：单元格/表单/页面操作
 */
export function modifyReportGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true },
    // [修复] output 增加 rowData / colData：让 modify_row/col_subgraph 读到的行/列数据回传到主图 state，
    // 方便后续步骤（form/page）按需引用，也与 modify_cell_subgraph 回传 cellsData 行为一致
    output: { cellsData: true, rowData: true, colData: true, pageConfig: true }
  })

  // 阶段1：知识准备（4 个并行节点）
  graph.addNode('load_docs', async (state, runtime) => {
    // [修复] 防御性兜底：意图分析可能漏掉 requiredDocs 或填成空数组，
    // 此时根据 intent + 用户消息关键字自动补齐最小必加载档，避免后续 LLM 零知识可用
    const intent = state.intent ?? {}
    const originalDocs: string[] = Array.isArray(intent.requiredDocs) ? intent.requiredDocs : []
    const docs: string[] = [...originalDocs]
    const userMsg = String(state.userMessage ?? '')

    // 单元格修改场景：强制追加 CELL_COMMON_ATTRIBUTE（修改单元格必备）
    if (intent.needsCellOperation && !docs.includes('CELL_COMMON_ATTRIBUTE')) {
      docs.push('CELL_COMMON_ATTRIBUTE')
    }
    // 涉及"父格/子格"等关键字时补齐 PARENT_CELL_RELATION
    if (/父格|子格|主格|左父格|上父格|父子格/.test(userMsg) && !docs.includes('PARENT_CELL_RELATION')) {
      docs.push('PARENT_CELL_RELATION')
    }
    // 涉及"统计/汇总/求和/表达式/计算/展开数据"等关键字时补齐知识档
    if (/统计|汇总|求和|求平均|计数|聚合|合计|累计|展开数据|公式|表达式|计算/.test(userMsg)) {
      if (!docs.includes('EXPRESSION_CELL')) docs.push('EXPRESSION_CELL')
      if (!docs.includes('EXPRESSION')) docs.push('EXPRESSION')
      if (!docs.includes('FUNCTION')) docs.push('FUNCTION')
    }

    const stepId = 'load_docs'
    const toolCallId = `wf_load_docs_${Date.now()}`

    // [增强] 会话级缓存去重：同文档不重复加载、不重复写 tool_result 到 messages
    // 解决"会话内多次重载同一文档"导致的 token 浪费问题
    const memoryManager = runtime?.memoryManager
    const cache = memoryManager?.getKnowledgeCache()
    const missingDocs = cache ? cache.filterMissing(docs) : docs
    const hitDocs = docs.filter(d => !missingDocs.includes(d))

    // [决策点日志] 状态变化处打日志：实际加载的文档列表，便于排查漏加载
    console.log(`[DEBUG][load_docs] requiredDocs=${JSON.stringify(originalDocs)} → 期望=${JSON.stringify(docs)} → 缓存命中=${JSON.stringify(hitDocs)} → 待加载=${JSON.stringify(missingDocs)}`)

    // 缓存全部命中：直接走"无需加载"分支，零工具调用、零 token 消耗
    if (cache && missingDocs.length === 0) {
      runtime?.emitEvent({
        mode: 'updates',
        event: {
          nodeId: stepId,
          output: { type: 'step_progress', message: `📚 知识库已就绪：${docs.join('、')}（全部命中会话缓存，未重复加载）` },
          status: 'success'
        },
        timestamp: Date.now()
      })
      // 注意：state.searchResults 只存 docRefs（几十字节），不存全文
      // 文档全文从 cache 走，避免 binop 累积膨胀
      return { searchResults: { docRefs: docs } }
    }

    // 有缺失文档：发射工具调用事件
    runtime?.emitEvent({
      mode: 'updates',
      event: {
        nodeId: stepId,
        output: {
          type: 'step_progress',
          message: hitDocs.length > 0
            ? `📚 加载知识库：${docs.join('、')}（命中 ${hitDocs.length} 个、新加载 ${missingDocs.length} 个）`
            : `📚 加载知识库：${docs.length > 0 ? docs.join('、') : '（无需文档）'}`
        },
        status: 'running'
      },
      timestamp: Date.now()
    })
    runtime?.emitEvent({
      mode: 'updates',
      event: {
        nodeId: stepId,
        output: {
          type: 'tool_call',
          toolCallId,
          toolName: 'load_report_introduce',
          input: { fileNames: missingDocs }
        },
        status: 'running'
      },
      timestamp: Date.now()
    })

    // 调工具：只请求缺失文档（注意：传 missingDocs 而非 docs）
    const result = await runtime?.toolRegistry.executeTool('load_report_introduce', { fileNames: missingDocs })

    // [增强] 写缓存：把工具返回内容存到 cache，跨 turn 复用
    if (cache && result) {
      const docsMap = extractDocsMap(result, missingDocs)
      if (docsMap && Object.keys(docsMap).length > 0) {
        cache.putBatch(docsMap)
      }
    }

    // [增强] 写 1 条 tool_result 到 messages（仅缺失部分，且只在首次加载时）
    if (memoryManager && missingDocs.length > 0) {
      memoryManager.addMessage({
        role: 'tool_result',
        toolCallId,
        toolName: 'load_report_introduce',
        content: formatDocsAsText(result),
        docRefs: [...missingDocs]  // 关键标记：记录本次 tool_result 加载的文档名
      })
    }

    runtime?.emitEvent({
      mode: 'updates',
      event: {
        nodeId: stepId,
        output: {
          type: 'tool_result',
          toolCallId,
          toolName: 'load_report_introduce',
          result: formatDocsAsText(result)
        },
        status: result ? 'success' : 'failed'
      },
      timestamp: Date.now()
    })

    // [修复] state.searchResults 只存 docRefs（不存全文）
    // 全文走 cache，binop 累加只增 docRefs 数组（不会膨胀）
    return { searchResults: { docRefs: docs } }
  }, {
    triggers: ['__start__'],
    triggerMode: 'all',
    // [修复] 不再设为 silent：用户需要看到知识库加载步骤，工具调用必须显式呈现
    metadata: { description: '加载本地知识库' }
  })

  const searchBusinessOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('search_business_out', searchBusinessOut)
  graph.addNode('search_business', new LLMDecideNode({
    nodeId: 'search_business',
    allowedTools: ['search_business_knowledge'],
    description: '搜索与用户需求相关的业务术语、业务规则等知识',
    outChannelName: 'search_business_out'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    skipWhen: (state) => !state.intent?.needsBusinessKnowledge,
    metadata: { silent: true, description: '搜索业务知识' }
  })

  const searchAgentOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('search_agent_out', searchAgentOut)
  graph.addNode('search_agent', new LLMDecideNode({
    nodeId: 'search_agent',
    allowedTools: ['search_agent_knowledge'],
    description: '搜索报表制作的案例、最佳实践和设计经验',
    outChannelName: 'search_agent_out'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    skipWhen: (state) => !state.intent?.needsAgentKnowledge,
    metadata: { silent: true, description: '搜索报表制作经验' }
  })

  const searchSchemaOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('search_schema_out', searchSchemaOut)
  graph.addNode('search_schema', new LLMDecideNode({
    nodeId: 'search_schema',
    allowedTools: ['search_schema'],
    description: '跨数据源搜索表结构，定位包含相关表的数据源',
    outChannelName: 'search_schema_out'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    skipWhen: (state) => !state.intent?.needsSchemaSearch,
    metadata: { silent: true, description: '搜索数据源表结构' }
  })

  const planOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('plan_tasks_out', planOut)
  graph.addNode('plan_tasks', new LLMDecideNode({
    nodeId: 'plan_tasks',
    allowedTools: [
      'get_datasources', 'get_datasets',
      'get_search_form'
    ],
    maxIterations: 1,
    description: '**只读探查节点**。根据用户需求和 intent，仅调用与本步意图直接相关的只读工具来确认上下文：' +
      '数据源场景：get_datasources/get_datasets；表单场景：get_search_form。' +
      '**禁止**调用 get_paper_config / get_rows / get_columns / read_cells / write_* 等工具；' +
      '**禁止**在本节点执行任何修改动作；**禁止**分多轮重复调用同一个工具。' +
      '单元格/行列场景无需本步探查，子图内的 read_cells / read_rows_cols 节点会自动读取。' +
      '一次探查完成后立即结束。',
    outChannelName: 'plan_tasks_out'
  }), {
    // triggers 改用实际 Channel 名（load_docs/search_* 是节点名，不是 Channel）
    triggers: ['searchResults'],
    triggerMode: 'any',
    skipWhen: (state) => {
      const i = state.intent
      return !i?.needsDatasourceOperation
        && !i?.needsCellOperation
        && !i?.needsFormOperation
        && !i?.needsPageConfigOperation
        && !i?.needsRowOperation
        && !i?.needsColOperation
    },
    metadata: { description: '分析用户需求并规划任务' }
  })

  // 节点2.2：数据源操作路由器（仅在 needsDatasourceOperation 时跑）
  // 拆出来单独跑的好处：requiredToolResults 只在需要时强制，不会误伤纯单元格/表单/页面场景
  const selectOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('select_datasource_op_out', selectOut)
  graph.addNode('select_datasource_op', new LLMDecideNode({
    nodeId: 'select_datasource_op',
    allowedTools: ['select_datasource_operation'],
    requiredToolResults: ['select_datasource_operation'],
    description: '声明具体的数据源/数据集操作类型（创建/修改/删除）',
    outChannelName: 'select_datasource_op_out'
  }), {
    // 由 plan_tasks_out 触发（plan_tasks 是数据源场景的前置）
    triggers: ['plan_tasks_out'],
    triggerMode: 'any',
    // 仅在需要数据源操作时跑
    skipWhen: (state) => !state.intent?.needsDatasourceOperation,
    metadata: { description: '声明数据源操作类型' }
  })

  // 阶段3：子图嵌入
  graph.addNode('create_datasource_subgraph', async (state, runtime) => {
    const subGraph = createDatasourceGraph()
    // [修复] 用 fork() 派生独立 runtime，避免子图 setChannelMap 覆盖主图 channelMap
    const childRuntime = runtime?.fork()
    const result = await subGraph.execute(state, { configurable: { runtime: childRuntime } })
    return result.state
  }, {
    triggers: ['plan_tasks_out', 'select_datasource_op_out'],
    triggerMode: 'any',
    skipWhen: (state) => state.intent?.datasourceOperationType !== 'create_datasource',
    // [修复] input 增加 searchResults：把主图 load_docs 加载的文档带进子图，
    // 子图内的 LLM 节点能通过 buildMessages 看到文档内容
    input: { datasources: true, intent: true, userMessage: true, searchResults: true },
    output: { datasources: true },
    metadata: { description: '创建数据源子流程' }
  })

  graph.addNode('create_dataset_subgraph', async (state, runtime) => {
    const subGraph = createDatasetGraph()
    // [修复] 用 fork() 派生独立 runtime，避免子图 setChannelMap 覆盖主图 channelMap
    const childRuntime = runtime?.fork()
    const result = await subGraph.execute(state, { configurable: { runtime: childRuntime } })
    return result.state
  }, {
    triggers: ['plan_tasks_out', 'select_datasource_op_out'],
    triggerMode: 'any',
    skipWhen: (state) => state.intent?.datasourceOperationType !== 'create_dataset',
    // [修复] input 增加 searchResults
    input: { datasources: true, intent: true, userMessage: true, searchResults: true },
    output: { datasets: true, searchForm: true },
    metadata: { description: '创建数据集子流程' }
  })

  graph.addNode('modify_dataset_subgraph', async (state, runtime) => {
    const subGraph = modifyDatasetGraph()
    // [修复] 用 fork() 派生独立 runtime，避免子图 setChannelMap 覆盖主图 channelMap
    const childRuntime = runtime?.fork()
    const result = await subGraph.execute(state, { configurable: { runtime: childRuntime } })
    return result.state
  }, {
    triggers: ['plan_tasks_out', 'select_datasource_op_out'],
    triggerMode: 'any',
    skipWhen: (state) => state.intent?.datasourceOperationType !== 'modify_dataset',
    // [修复] input 增加 searchResults
    input: { datasets: true, intent: true, userMessage: true, searchResults: true },
    output: { datasets: true, searchForm: true },
    metadata: { description: '修改数据集子流程' }
  })

  graph.addNode('modify_cell_subgraph', async (state, runtime) => {
    const subGraph = modifyCellGraph()
    // [修复] 用 fork() 派生独立 runtime，避免子图 setChannelMap 覆盖主图 channelMap
    const childRuntime = runtime?.fork()
    const result = await subGraph.execute(state, { configurable: { runtime: childRuntime } })
    return result.state
  }, {
    // triggers 任一到位即触发：纯单元格场景靠 plan_tasks_out，
    // "先建数据集再写单元格"链路则靠 select_datasource_op_out
    triggers: ['plan_tasks_out', 'select_datasource_op_out'],
    triggerMode: 'any',
    skipWhen: (state) => !state.intent?.needsCellOperation,
    // [修复] input 增加 searchResults：让单元格子图的 LLM 节点能拿到文档知识，
    // 解决"修改父格+统计展开数据"这种复合需求 LLM 不知道如何设置表达式类型的问题
    input: { datasets: true, cellsData: true, intent: true, searchResults: true },
    output: { cellsData: true },
    metadata: { description: '修改单元格子流程' }
  })

  // 行结构子流程：处理行高调整、插入/删除行
  // 与 modify_cell_subgraph 并列，由 plan_tasks 按 needsRowOperation 路由
  graph.addNode('modify_row_subgraph', async (state, runtime) => {
    const subGraph = modifyRowGraph()
    const childRuntime = runtime?.fork()
    const result = await subGraph.execute(state, { configurable: { runtime: childRuntime } })
    return result.state
  }, {
    triggers: ['plan_tasks_out', 'select_datasource_op_out'],
    triggerMode: 'any',
    skipWhen: (state) => !state.intent?.needsRowOperation,
    input: { intent: true, userMessage: true, searchResults: true },
    output: { rowData: true },
    metadata: { description: '修改行结构子流程' }
  })

  // 列结构子流程：处理列宽调整、插入/删除列
  // 与 modify_row_subgraph 并列，由 plan_tasks 按 needsColOperation 路由
  graph.addNode('modify_col_subgraph', async (state, runtime) => {
    const subGraph = modifyColGraph()
    const childRuntime = runtime?.fork()
    const result = await subGraph.execute(state, { configurable: { runtime: childRuntime } })
    return result.state
  }, {
    triggers: ['plan_tasks_out', 'select_datasource_op_out'],
    triggerMode: 'any',
    skipWhen: (state) => !state.intent?.needsColOperation,
    input: { intent: true, userMessage: true, searchResults: true },
    output: { colData: true },
    metadata: { description: '修改列结构子流程' }
  })

  // 阶段4：表单/页面操作
  const modifyFormOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('modify_form_out', modifyFormOut)
  graph.addNode('modify_form', new LLMDecideNode({
    nodeId: 'modify_form',
    allowedTools: ['get_search_form', 'set_search_form'],
    description: '根据需求修改查询表单的配置',
    outChannelName: 'modify_form_out'
  }), {
    triggers: ['plan_tasks_out', 'select_datasource_op_out'],
    triggerMode: 'any',
    skipWhen: (state) => !state.intent?.needsFormOperation,
    input: { datasets: true, intent: true },
    metadata: { description: '修改查询表单' }
  })

  const modifyPageOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('modify_page_out', modifyPageOut)
  graph.addNode('modify_page', new LLMDecideNode({
    nodeId: 'modify_page',
    allowedTools: ['get_paper_config', 'update_paper'],
    description: '根据需求修改页面配置（纸张大小、边距、方向等）',
    outChannelName: 'modify_page_out'
  }), {
    triggers: ['plan_tasks_out', 'select_datasource_op_out'],
    triggerMode: 'any',
    skipWhen: (state) => !state.intent?.needsPageConfigOperation,
    input: { cellsData: true, searchForm: true, intent: true },
    output: { pageConfig: true },
    metadata: { description: '修改页面配置' }
  })

  // 边
  graph.addEdge('__start__', 'load_docs')
  graph.addEdge('__start__', 'search_business')
  graph.addEdge('__start__', 'search_agent')
  graph.addEdge('__start__', 'search_schema')
  // Barrier 终点改为 plan_tasks（route_datasource_op 已拆分为两个节点，plan_tasks 是入口）
  graph.addEdge(['load_docs', 'search_business', 'search_agent', 'search_schema'], 'plan_tasks')

  // 条件路由：阶段2 → 阶段3 子图，按意图路由
  graph.addConditionalEdges('plan_tasks', (state) => {
    const opType = state.intent?.datasourceOperationType
    if (opType === 'create_datasource') return 'create_datasource_subgraph'
    if (opType === 'create_dataset') return 'create_dataset_subgraph'
    if (opType === 'modify_dataset') return 'modify_dataset_subgraph'
    if (state.intent?.needsCellOperation) return 'modify_cell_subgraph'
    if (state.intent?.needsRowOperation) return 'modify_row_subgraph'
    if (state.intent?.needsColOperation) return 'modify_col_subgraph'
    if (state.intent?.needsFormOperation) return 'modify_form'
    if (state.intent?.needsPageConfigOperation) return 'modify_page'
    return '__end__'
  })

  // 子工作流完成后的路由
  graph.addConditionalEdges('create_datasource_subgraph', () => 'create_dataset_subgraph')
  graph.addConditionalEdges('create_dataset_subgraph', (state) => {
    if (state.intent?.needsCellOperation) return 'modify_cell_subgraph'
    if (state.intent?.needsRowOperation) return 'modify_row_subgraph'
    if (state.intent?.needsColOperation) return 'modify_col_subgraph'
    if (state.intent?.needsFormOperation) return 'modify_form'
    if (state.intent?.needsPageConfigOperation) return 'modify_page'
    return '__end__'
  })
  graph.addConditionalEdges('modify_dataset_subgraph', (state) => {
    if (state.intent?.needsCellOperation) return 'modify_cell_subgraph'
    if (state.intent?.needsRowOperation) return 'modify_row_subgraph'
    if (state.intent?.needsColOperation) return 'modify_col_subgraph'
    if (state.intent?.needsFormOperation) return 'modify_form'
    if (state.intent?.needsPageConfigOperation) return 'modify_page'
    return '__end__'
  })
  // modify_cell_subgraph 完成后按 form → page → __end__ 分级判断
  graph.addConditionalEdges('modify_cell_subgraph', (state) => {
    if (state.intent?.needsFormOperation) return 'modify_form'
    if (state.intent?.needsPageConfigOperation) return 'modify_page'
    return '__end__'
  })
  // modify_row_subgraph 完成后：行+列场景接力到 modify_col_subgraph；否则走 form/page/__end__
  graph.addConditionalEdges('modify_row_subgraph', (state) => {
    if (state.intent?.needsColOperation) return 'modify_col_subgraph'
    if (state.intent?.needsFormOperation) return 'modify_form'
    if (state.intent?.needsPageConfigOperation) return 'modify_page'
    return '__end__'
  })
  // modify_col_subgraph 完成后按 form → page → __end__ 分级判断
  graph.addConditionalEdges('modify_col_subgraph', (state) => {
    if (state.intent?.needsFormOperation) return 'modify_form'
    if (state.intent?.needsPageConfigOperation) return 'modify_page'
    return '__end__'
  })
  graph.addEdge('modify_form', 'modify_page')
  graph.addEdge('modify_page', '__end__')

  return graph.compile()
}

// ==================== 分析报表工作流 ====================

/**
 * 分析报表工作流
 * 读取报表的各类配置数据，分析报表结构并返回分析结果
 * @returns 编译后的可执行图，CompiledReportGraph
 */
export function analyzeReportGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true },
    // [改造] 补齐行/列数据输出，便于 LLM 拿 rowData / colData 回答"行高" / "列宽"类问题
    output: { cellsData: true, rowData: true, colData: true, pageConfig: true, searchForm: true }
  })

  // ==================== 节点1：加载文档（无条件必跑） ====================
  graph.addNode('load_docs', async (state, runtime) => {
    const docs = state.intent?.requiredDocs ?? []
    // [修复] 工具返回结构体 { docs: { [fileName]: content } }，统一用 extractDocsMap 提取
    // 与主图 load_docs 节点行为一致，避免 analyze 图里 searchResults.docs 出现双层嵌套
    const result = await runtime?.toolRegistry.executeTool('load_report_introduce', { fileNames: docs })
    return { searchResults: { docs: extractDocsMap(result, docs) } }
  }, {
    triggers: ['__start__'],
    triggerMode: 'all',
    metadata: { silent: true, description: '加载报表文档' }
  })

  // ==================== 节点2：读取数据源/数据集 ====================
  const readDatasourcesOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_datasources_out', readDatasourcesOut)
  graph.addNode('read_datasources', new LLMDecideNode({
    nodeId: 'read_datasources',
    allowedTools: ['get_datasources', 'get_datasets'],
    description: '读取数据源和数据集信息',
    outChannelName: 'read_datasources_out'
  }), {
    // [改造] 改为从 searchResults 触发，与其他 read 节点解耦，支持并行调度
    triggers: ['searchResults'],
    triggerMode: 'any',
    // [新增] 仅当意图标记需要数据源/数据集时执行；否则不进 stepRecords、不占 LLM 上下文
    skipWhen: (state) => !state.intent?.needsDatasourceOperation,
    metadata: { description: '读取数据源信息' }
  })

  // ==================== 节点3：读取单元格 ====================
  const readCellsOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_cells_out', readCellsOut)
  graph.addNode('read_cells', new LLMDecideNode({
    nodeId: 'read_cells',
    allowedTools: ['read_cells'],
    description: '读取单元格数据',
    outChannelName: 'read_cells_out'
  }), {
    // [改造] 改为从 searchResults 触发，与其他 read 节点解耦，支持并行调度
    triggers: ['searchResults'],
    triggerMode: 'any',
    // [新增] 仅当意图标记需要读单元格时执行
    skipWhen: (state) => !state.intent?.needsCellOperation,
    metadata: { description: '读取单元格数据' }
  })

  // ==================== 节点4：读取行数据（新增） ====================
  const readRowsOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_rows_out', readRowsOut)
  graph.addNode('read_rows', new ToolCallNode({
    nodeId: 'read_rows',
    toolName: 'get_rows',
    // [派生参数] 不传参 = 读所有行；后续若需要"按行号读"可改成函数从 state 取
    args: {},
    outChannelName: 'read_rows_out',
    // [对齐 LLMDecideNode.resultKey 模式] 下游用 resultKey 作 state 字段
    resultKey: 'rowData'
  }), {
    triggers: ['searchResults'],
    triggerMode: 'any',
    // [新增] 仅当意图标记需要行信息时执行
    skipWhen: (state) => !state.intent?.needsRowOperation,
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '读取行数据' }
  })

  // ==================== 节点5：读取列数据（新增） ====================
  // [改造] 与 read_rows 同样模式，对应 needsColOperation 意图
  const readColsOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_cols_out', readColsOut)
  graph.addNode('read_cols', new ToolCallNode({
    nodeId: 'read_cols',
    toolName: 'get_columns',
    // [派生参数] 不传参 = 读所有列
    args: {},
    outChannelName: 'read_cols_out',
    // [对齐 LLMDecideNode.resultKey 模式] 下游用 resultKey 作 state 字段
    resultKey: 'colData'
  }), {
    triggers: ['searchResults'],
    triggerMode: 'any',
    // [新增] 仅当意图标记需要列信息时执行
    skipWhen: (state) => !state.intent?.needsColOperation,
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '读取列数据' }
  })

  // ==================== 节点6：读取查询表单 ====================
  const readFormOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_form_out', readFormOut)
  graph.addNode('read_form', new LLMDecideNode({
    nodeId: 'read_form',
    allowedTools: ['get_search_form'],
    description: '读取查询表单配置',
    outChannelName: 'read_form_out'
  }), {
    // [改造] 改为从 searchResults 触发，与其他 read 节点解耦，支持并行调度
    triggers: ['searchResults'],
    triggerMode: 'any',
    // [新增] 仅当意图标记需要查询表单时执行
    skipWhen: (state) => !state.intent?.needsFormOperation,
    metadata: { description: '读取查询表单' }
  })

  // ==================== 节点7：读取页面配置 ====================
  const readPageOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_page_out', readPageOut)
  graph.addNode('read_page_config', new LLMDecideNode({
    nodeId: 'read_page_config',
    allowedTools: ['get_paper_config'],
    description: '读取页面配置',
    outChannelName: 'read_page_out'
  }), {
    // [改造] 改为从 searchResults 触发，与其他 read 节点解耦，支持并行调度
    triggers: ['searchResults'],
    triggerMode: 'any',
    // [新增] 仅当意图标记需要页面配置时执行
    skipWhen: (state) => !state.intent?.needsPageConfigOperation,
    metadata: { description: '读取页面配置' }
  })

  // ==================== 边：load_docs 是入口，6 个 read 节点并行从 searchResults 触发 ====================
  graph.addEdge('__start__', 'load_docs')
  graph.addEdge('read_datasources', '__end__')
  graph.addEdge('read_cells', '__end__')
  graph.addEdge('read_rows', '__end__')
  graph.addEdge('read_cols', '__end__')
  graph.addEdge('read_form', '__end__')
  graph.addEdge('read_page_config', '__end__')

  return graph.compile()
}

// ==================== 图注册表 ====================

/**
 * 工作流图注册表
 * 根据意图类型获取对应的编译后图
 */
const graphRegistry = new Map<string, () => CompiledReportGraph>()

/** 注册工作流图 */
function registerGraph(intentType: string, factory: () => CompiledReportGraph): void {
  graphRegistry.set(intentType, factory)
}

// 注册主工作流
registerGraph('modify_report', modifyReportGraph)
registerGraph('analyze_report', analyzeReportGraph)

/**
 * 根据意图类型获取工作流图
 * @param intentType - 意图类型，string，不可为空
 * @returns 编译后的工作流图，CompiledReportGraph | undefined
 */
export function getGraphByIntent(intentType: string): CompiledReportGraph | undefined {
  const factory = graphRegistry.get(intentType)
  return factory?.()
}

/**
 * 根据子工作流类型获取子图
 * @param subworkflowType - 子工作流类型，string，不可为空
 * @returns 编译后的子工作流图，CompiledReportGraph | undefined
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
    // 行列结构子图：拆为 modify_row / modify_col，互补干扰、互不感知
    modify_row: modifyRowGraph,
    modify_col: modifyColGraph
  }
  const factory = subGraphFactories[subworkflowType]
  return factory?.()
}
