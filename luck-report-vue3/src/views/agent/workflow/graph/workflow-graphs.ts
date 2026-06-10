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
    allowedTools: ['add_dataset', 'restore_data'],
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
    allowedTools: ['update_dataset', 'restore_data'],
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
  // [修复] description 显式声明"本步骤只读，写入在后续步骤"，
  // 避免 LLM 在本步读到没有写工具后误判整个任务无法完成而拒绝执行
  // [修复] resultKey='cellsData'：把读到的单元格数据直接写入 state.cellsData，
  // 否则返回 {read_cells: ...} 永远无法触发下游 ensure_row_col / modify_and_write_cells
  // [修复] requiredToolResults=['read_cells']：强制 LLM 必须先调 read_cells 拿到数据再结束本步，
  // 防止 LLM "本步没法写"就输出文本求助导致图引擎死等
  // [修复] 移除 read_cell（坐标体系 0-based 和 read_cells 的 1-based 冲突），并限制只能调 read_cells 一次
  const readOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_cells_out', readOut)
  graph.addNode('read_cells', new LLMDecideNode({
    nodeId: 'read_cells',
    allowedTools: ['read_cells'],
    requiredToolResults: ['read_cells'],
    maxIterations: 2,
    resultKey: 'cellsData',
    description: '本步骤仅负责一次性读取用户指定的所有目标单元格（必须把用户提到的全部坐标一次传入 read_cells.cellPositionArray，例如 A1+B2 应传 [{row:1,col:1},{row:2,col:2}]）。**禁止**重复读取、禁止调用 read_cell、禁止输出任何文字向用户提问、禁止在本步骤尝试写入。读到结果后立即结束本步骤，写入操作由后续的 modify_and_write_cells 完成。**读到的 cellsData 会自动进入 modify_and_write_cells 的 context，无需也不允许重读**。',
    outChannelName: 'read_cells_out'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '读取单元格数据' }
  })

  // 节点2：确保行列足够
  const ensureOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('ensure_row_col_out', ensureOut)
  graph.addNode('ensure_row_col', new LLMDecideNode({
    nodeId: 'ensure_row_col',
    allowedTools: ['get_rows', 'get_columns', 'insert_row', 'insert_col', 'set_rows', 'set_columns'],
    description: '单元格不存在时补齐行列',
    outChannelName: 'ensure_row_col_out'
  }), {
    triggers: ['cellsData'],
    triggerMode: 'any',
    skipWhen: (state) => {
      // 单元格已存在时跳过
      const cellsData = state.cellsData
      if (!cellsData) return false
      const values = Object.values(cellsData)
      return values.length > 0 && values.some(v => v && Object.keys(v).length > 0)
    },
    metadata: { description: '确保行列足够' }
  })

  // 节点3：修改并写入单元格
  // [修复] 收紧 allowedTools：除了写工具外，只保留 backup_data（写前自动备份）和 get_cell_template（创建/类型变更场景）
  // [修复] **移除 read_cells**：上游 read_cells 节点已把数据写入 state.cellsData，本节点不允许再读，
  // 否则 LLM 会拿到"读一次 + 重读一次"的两份数据，徒增 token 且容易把"新建 vs 修改"场景判断错
  // [修复] 用 requiredToolResultsAny（OR 语义）替代 requiredToolResults：write_cells 和 write_cell 二选一即可
  // [修复] maxIterations=4：决策流程最坏需要 get_cell_template + write_cells = 2 步，加 LLM 出错重试 1-2 次的安全垫
  // [修复] description 强约束：cellsData 已在 context 中，禁止任何形式的"先读"操作
  const writeOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('modify_and_write_cells_out', writeOut)
  graph.addNode('modify_and_write_cells', new LLMDecideNode({
    nodeId: 'modify_and_write_cells',
    // [修复] 加入 load_report_introduce 作为兜底：主图 load_docs 可能没加载到关键文档，
    // 子图内 LLM 在发现自己缺知识时（如"父格+表达式"复合需求）可主动补查
    allowedTools: ['write_cells', 'write_cell', 'get_cell_template', 'backup_data', 'restore_data', 'load_report_introduce'],
    requiredToolResultsAny: ['write_cells', 'write_cell'],
    maxIterations: 4,
    description: '**cellsData 已在 context 中**（上游 read_cells 节点已读完全部目标单元格），**禁止**调用 read_cells / read_cell 重新读取。' +
      '按"决策流程"处理每个目标单元格：' +
      '① 读取 context.cellsData 中的 cell 结构；' +
      '② 场景判断：' +
      '- cell 为空/不存在（创建场景）→ 调 get_cell_template({type,rowIndex,colIndex}) 取初始模板，仅改 value；' +
      '- cell.value.type != 需求类型（类型变更场景）→ 调 get_cell_template({type:新类型}) 取新模板，整体替换 cell；' +
      '- cell.value.type == 需求类型（同类型修改场景）→ 直接复用 cellsData 中的 cell，仅改 value 字段；' +
      '③ **一次**调 write_cells({cells:{"row,col":完整cell}}) 写完所有目标，**禁止分多轮写入**。' +
      '写入完成后立即结束本步骤。',
    outChannelName: 'modify_and_write_cells_out'
  }), {
    triggers: ['cellsData'],
    triggerMode: 'any',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '修改并写入单元格' }
  })

  graph.addEdge('__start__', 'read_cells')
  graph.addEdge('read_cells', 'ensure_row_col')
  graph.addEdge('ensure_row_col', 'modify_and_write_cells')
  graph.addEdge('modify_and_write_cells', '__end__')

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
    output: { cellsData: true, pageConfig: true }
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
    // 工具返回结构体 { docs: Record<fileName, content> }：每篇文档按 fileName 一一对应
    // 直接 putBatch 即可，无需再按分隔符切分，根除"只缓存首篇"导致的重复加载 bug
    // 兜底：若 result 是字符串（旧调用方/异常），按分隔符切分后按 missingDocs 顺序映射
    if (cache && result) {
      const docsMap = extractDocsMap(result, missingDocs)
      if (docsMap && Object.keys(docsMap).length > 0) {
        cache.putBatch(docsMap)
      }
    }

    // [增强] 写 1 条 tool_result 到 messages（仅缺失部分，且只在首次加载时）
    // 关键：load_docs 是普通函数节点，不会自动写 messages，必须手动 addMessage
    // 标记 docRefs=missingDocs，让 buildMessages.getLoadedDocNames() 能检测到
    // 注意：load_docs 第 2 次跑时如果全部命中缓存（missingDocs=[]），不写 messages（避免累加）
    // 内容用纯文本格式（[docName]\ncontent）而不是 JSON，LLM 和聊天 UI 都友好
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

  // 阶段2：意图路由（拆分为两个语义清晰的节点）
  // 关键改进：原 route_datasource_op 把"任务规划"和"数据源操作路由"混在一起，
  // 且强制 requiredToolResults=['select_datasource_operation']，导致纯单元格/表单/页面场景
  // LLM 正确判断后不调用该工具，节点返回 errors，下游 Channel 不提交 → 图提前结束。
  // 拆为 plan_tasks（通用任务规划器，总跑）+ select_datasource_op（数据源操作路由，仅 needsDatasourceOperation 时跑）

  // 节点2.1：通用任务规划器（任何操作都要跑）
  // [修复] 收紧 allowedTools：去掉 get_paper_config / get_rows / get_columns / read_cell
  // 这些与单元格修改场景无关，LLM 之前看到就乱调，典型症状：纯改单元格却调用 get_paper_config / get_rows
  // 数据源操作由独立的 select_datasource_op 节点处理，plan_tasks 只需保留只读探查工具供 LLM 校验上下文
  // [修复] maxIterations=1 + requiredToolResults 不设但 LLM 必须在本步不输出任何修改动作（仅探查）
  const planOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('plan_tasks_out', planOut)
  graph.addNode('plan_tasks', new LLMDecideNode({
    nodeId: 'plan_tasks',
    allowedTools: [
      'get_datasources', 'get_datasets',
      'get_search_form'
    ],
    maxIterations: 1,
    // 关键：不设 requiredToolResults。plan_tasks 是"任务规划器"而非业务执行器，
    // 缺工具调用 ≠ 规划失败，LLM 应基于 intent 自主决定调用哪些工具
    // [修复] 移除 read_cells：单元格场景的"读取现有 cell"职责由 modify_cell_subgraph.read_cells 节点承担，
    // plan_tasks 跑 read_cells 会导致子图重复读一次，且 LLM 拿到 cellsData 后也无法直接用于 modify_and_write_cells
    description: '**只读探查节点**。根据用户需求和 intent，仅调用与本步意图直接相关的只读工具来确认上下文：' +
      '数据源场景：get_datasources/get_datasets；表单场景：get_search_form。' +
      '**禁止**调用 get_paper_config / get_rows / get_columns / read_cell / read_cells / write_* 等工具；' +
      '**禁止**在本节点执行任何修改动作；**禁止**分多轮重复调用同一个工具。' +
      '单元格场景无需本步探查，子图内的 read_cells 节点会自动读取。' +
      '一次探查完成后立即结束。',
    outChannelName: 'plan_tasks_out'
  }), {
    // triggers 改用实际 Channel 名（load_docs/search_* 是节点名，不是 Channel）
    triggers: ['searchResults'],
    triggerMode: 'any',
    // 任意 4 种操作任一需要时都要跑（用于分发到正确的子图）
    skipWhen: (state) => {
      const i = state.intent
      return !i?.needsDatasourceOperation
        && !i?.needsCellOperation
        && !i?.needsFormOperation
        && !i?.needsPageConfigOperation
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
  // [修复] 子图节点触发条件改为 ['plan_tasks_out', 'select_datasource_op_out'] 任一到位即触发
  // 原因：
  //   - plan_tasks_out：纯单元格/表单/页面场景只产出这个 Channel
  //   - select_datasource_op_out：数据源/数据集场景额外产出这个 Channel
  // 配合 skipWhen 实现"只跑对应意图的那个子图"
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

  // 条件路由挂在 plan_tasks 上（plan_tasks 总跑，select_datasource_op 是条件跑的）
  // 判定逻辑：优先看 datasourceOperationType（数据源操作路由结果），再看 intent.needsCellOperation（单元格场景）
  // 条件边：阶段2 → 阶段3 子图（按意图路由）
  // [修复] 末尾追加 needsFormOperation / needsPageConfigOperation 兜底，
  // 避免"单 form"或"单 page"场景 plan_tasks 返回 null 提前结束图
  graph.addConditionalEdges('plan_tasks', (state) => {
    const opType = state.intent?.datasourceOperationType
    if (opType === 'create_datasource') return 'create_datasource_subgraph'
    if (opType === 'create_dataset') return 'create_dataset_subgraph'
    if (opType === 'modify_dataset') return 'modify_dataset_subgraph'
    if (state.intent?.needsCellOperation) return 'modify_cell_subgraph'
    if (state.intent?.needsFormOperation) return 'modify_form'
    if (state.intent?.needsPageConfigOperation) return 'modify_page'
    return '__end__'
  })

  // 子工作流完成后的路由
  graph.addConditionalEdges('create_datasource_subgraph', () => 'create_dataset_subgraph')
  graph.addConditionalEdges('create_dataset_subgraph', (state) => {
    if (state.intent?.needsCellOperation) return 'modify_cell_subgraph'
    if (state.intent?.needsFormOperation) return 'modify_form'
    if (state.intent?.needsPageConfigOperation) return 'modify_page'
    return '__end__'
  })
  graph.addConditionalEdges('modify_dataset_subgraph', (state) => {
    if (state.intent?.needsCellOperation) return 'modify_cell_subgraph'
    if (state.intent?.needsFormOperation) return 'modify_form'
    if (state.intent?.needsPageConfigOperation) return 'modify_page'
    return '__end__'
  })
  // [修复] 原实现硬编码 () => 'modify_form'，当 needsFormOperation=false 时 modify_form 被 skipWhen 跳过，
  // modify_page 也因 needsPageConfigOperation=false 被跳过，导致 modify_cell_subgraph 之后图直接断流
  // 改为：按 form → page → __end__ 分级判断
  graph.addConditionalEdges('modify_cell_subgraph', (state) => {
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
 */
export function analyzeReportGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true },
    output: { cellsData: true, pageConfig: true, searchForm: true }
  })

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

  const readDatasourcesOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_datasources_out', readDatasourcesOut)
  graph.addNode('read_datasources', new LLMDecideNode({
    nodeId: 'read_datasources',
    allowedTools: ['get_datasources', 'get_datasets'],
    description: '读取数据源和数据集信息',
    outChannelName: 'read_datasources_out'
  }), {
    // [修复] 原 triggers: ['load_docs']（节点名非 Channel），改为 ['searchResults']（load_docs 写 searchResults）
    triggers: ['searchResults'],
    triggerMode: 'any',
    metadata: { description: '读取数据源信息' }
  })

  const readCellsOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_cells_out', readCellsOut)
  graph.addNode('read_cells', new LLMDecideNode({
    nodeId: 'read_cells',
    allowedTools: ['read_cells', 'read_cell'],
    description: '读取单元格数据',
    outChannelName: 'read_cells_out'
  }), {
    // [修复] 原 triggers: ['read_datasources']（节点名），改为上游 outChannel 'read_datasources_out'
    triggers: ['read_datasources_out'],
    triggerMode: 'any',
    metadata: { description: '读取单元格数据' }
  })

  const readFormOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_form_out', readFormOut)
  graph.addNode('read_form', new LLMDecideNode({
    nodeId: 'read_form',
    allowedTools: ['get_search_form'],
    description: '读取查询表单配置',
    outChannelName: 'read_form_out'
  }), {
    // [修复] 原 triggers: ['read_cells']（节点名），改为 'read_cells_out'
    triggers: ['read_cells_out'],
    triggerMode: 'any',
    metadata: { description: '读取查询表单' }
  })

  const readPageOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_page_out', readPageOut)
  graph.addNode('read_page_config', new LLMDecideNode({
    nodeId: 'read_page_config',
    allowedTools: ['get_paper_config'],
    description: '读取页面配置',
    outChannelName: 'read_page_out'
  }), {
    // [修复] 原 triggers: ['read_form']（节点名），改为 'read_form_out'
    triggers: ['read_form_out'],
    triggerMode: 'any',
    metadata: { description: '读取页面配置' }
  })

  graph.addEdge('__start__', 'load_docs')
  graph.addEdge('load_docs', 'read_datasources')
  graph.addEdge('read_datasources', 'read_cells')
  graph.addEdge('read_cells', 'read_form')
  graph.addEdge('read_form', 'read_page_config')
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
    modify_cell: modifyCellGraph
  }
  const factory = subGraphFactories[subworkflowType]
  return factory?.()
}
