/**
 * 行/列结构相关子工作流
 * - modifyRowGraph：修改行（read → ensure → modify_and_write）
 * - modifyColGraph：修改列（read → ensure → modify_and_write）
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

/**
 * 修改行结构工作流：read → ensure → modify_and_write
 * read 节点用 resultKey='rowData' 把 get_rows 写入 state，write 节点不设 resultKey
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
    args: {},
    outChannelName: 'read_rows_out',
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
    allowedTools: ['set_rows', 'insert_row', 'get_row_definitions_template', 'load_report_introduce'],
    requiredToolResultsAny: ['set_rows', 'insert_row'],
    maxIterations: 4,
    description:
      '【必须调工具】你必须调用 set_rows / insert_row 之一完成写入，' +
      '否则任务失败。\n' +
      '【必须用 native 格式】请使用 OpenAI 原生 function calling（tool_calls 字段）输出工具调用，' +
      '不要把工具调用写到文本 content 里（不要用 ```json {"tool": ...} ``` 这种格式）。\n' +
      'rowData 已在 context 中，不需要再调 get_rows。\n' +
      '批量改或新建 → set_rows({rows: 全量数组}) 一次性传入。' +
      '不确定行定义格式时，可先调 get_row_definitions_template 获取模板。' +
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

/**
 * 修改列结构工作流：read → ensure → modify_and_write
 * read 节点用 resultKey='colData' 把 get_columns 写入 state，write 节点不设 resultKey
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
    args: {},
    outChannelName: 'read_cols_out',
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
    allowedTools: ['set_columns', 'insert_col', 'get_column_definitions_template', 'load_report_introduce'],
    requiredToolResultsAny: ['set_columns', 'insert_col'],
    maxIterations: 4,
    description:
      '【必须调工具】你必须调用 set_columns / insert_col 之一完成写入，' +
      '否则任务失败。\n' +
      '【必须用 native 格式】请使用 OpenAI 原生 function calling（tool_calls 字段）输出工具调用，' +
      '不要把工具调用写到文本 content 里（不要用 ```json {"tool": ...} ``` 这种格式）。\n' +
      'colData 已在 context 中，不需要再调 get_columns。\n' +
      '批量改或新建 → set_columns({columns: 全量数组}) 一次性传入。' +
      '不确定列定义格式时，可先调 get_column_definitions_template 获取模板。' +
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
