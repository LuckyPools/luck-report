/**
 * 分析报表主工作流
 * 读取报表的各类配置数据，分析报表结构并返回分析结果
 */

import {
  ReportStateGraph,
  LLMDecideNode,
  ToolCallNode,
  LastValueAfterFinishChannel,
  defaultRetryOn
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { reportStateSchema } from '../state.ts'
import { extractDocsMap } from '../utils.ts'

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
