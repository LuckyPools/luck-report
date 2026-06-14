/**
 * 行/列结构相关子工作流（LangGraph 版本）
 * - modifyRowGraph：read → ensure → modify_and_write
 * - modifyColGraph：read → ensure → modify_and_write
 *
 * 与自建引擎版本的差异：
 * 1. 读节点用 ToolCallNode（纯函数）→ 直接返回 { [resultKey]: result }
 * 2. 写节点用 LLMDecideNode → LangGraph reducer 合并
 * 3. 不再 new LastValueAfterFinishChannel
 * 4. 幂等位防 modify_and_write_row/col 二次调度
 */

import { StateGraph, START, END } from '@langchain/langgraph'
import {
  ReportStateAnnotation,
  WorkflowRuntimeAnnotation,
  withInput
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { createLLMDecideNode } from '@/views/agent/workflow/nodes/llm-decide-node.ts'
import { createToolCallNode } from '@/views/agent/workflow/nodes/tool-call-node.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'

/**
 * 修改行结构工作流（LangGraph 版本）
 * 边序：__start__ → read_rows → ensure_row → modify_and_write_row → __end__
 * @returns 编译后的可执行图
 */
export function modifyRowGraph(): CompiledReportGraph {
  // 节点1：读取行（ToolCallNode）
  const readRows = createToolCallNode({
    nodeId: 'read_rows',
    toolName: 'get_rows',
    args: {},
    resultKey: 'rowData'
  })

  // 节点2：确保目标行存在（LLM 节点）
  const ensureRow = createLLMDecideNode({
    nodeId: 'ensure_row',
    allowedTools: ['insert_row'],
    description:
      '检查目标行号是否已存在。已存在直接结束；不存在则调 insert_row 补齐。' +
      '**禁止**调用 set_rows / 列相关工具 / write_cells 等。'
  })

  // 节点3：修改并写入行（LLM 节点；maxIterations 内部循环）
  const modifyAndWriteRowLLM = createLLMDecideNode({
    nodeId: 'modify_and_write_row',
    allowedTools: ['set_rows', 'insert_row', 'get_row_definitions_template', 'load_report_introduce'],
    requiredToolResultsAny: ['set_rows', 'insert_row'],
    maxIterations: 4,
    description:
      '【必须调工具】你必须调用 set_rows / insert_row 之一完成写入，否则任务失败。\n' +
      '【必须用 native 格式】请使用 OpenAI 原生 function calling（tool_calls 字段）输出工具调用，' +
      '不要把工具调用写到文本 content 里（不要用 ```json {"tool": ...} ``` 这种格式）。\n' +
      'rowData 已在 context 中，不需要再调 get_rows。\n' +
      '批量改或新建 → set_rows({rows: 全量数组}) 一次性传入。' +
      '不确定行定义格式时，可先调 get_row_definitions_template 获取模板。' +
      '禁止分多轮写入。'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_rows', readRows)
    .addNode('ensure_row', ensureRow)
    .addNode('modify_and_write_row', modifyAndWriteRowLLM)
    .addEdge(START, 'read_rows')
    .addEdge('read_rows', 'ensure_row')
    .addEdge('ensure_row', 'modify_and_write_row')
    .addEdge('modify_and_write_row', END)

  return g.compile()
}

/**
 * 修改列结构工作流（LangGraph 版本）
 * 边序：__start__ → read_cols → ensure_col → modify_and_write_col → __end__
 * @returns 编译后的可执行图
 */
export function modifyColGraph(): CompiledReportGraph {
  // 节点1：读取列（ToolCallNode）
  const readCols = createToolCallNode({
    nodeId: 'read_cols',
    toolName: 'get_columns',
    args: {},
    resultKey: 'colData'
  })

  // 节点2：确保目标列存在（LLM 节点）
  const ensureCol = createLLMDecideNode({
    nodeId: 'ensure_col',
    allowedTools: ['insert_col'],
    description:
      '检查目标列号是否已存在。已存在直接结束；不存在则调 insert_col 补齐。' +
      '**禁止**调用 set_columns / 行相关工具 / write_cells 等。'
  })

  // 节点3：修改并写入列（LLM 节点；maxIterations 内部循环）
  const modifyAndWriteColLLM = createLLMDecideNode({
    nodeId: 'modify_and_write_col',
    allowedTools: ['set_columns', 'insert_col', 'get_column_definitions_template', 'load_report_introduce'],
    requiredToolResultsAny: ['set_columns', 'insert_col'],
    maxIterations: 4,
    description:
      '【必须调工具】你必须调用 set_columns / insert_col 之一完成写入，否则任务失败。\n' +
      '【必须用 native 格式】请使用 OpenAI 原生 function calling（tool_calls 字段）输出工具调用，' +
      '不要把工具调用写到文本 content 里（不要用 ```json {"tool": ...} ``` 这种格式）。\n' +
      'colData 已在 context 中，不需要再调 get_columns。\n' +
      '批量改或新建 → set_columns({columns: 全量数组}) 一次性传入。' +
      '不确定列定义格式时，可先调 get_column_definitions_template 获取模板。' +
      '禁止分多轮写入。'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_cols', readCols)
    .addNode('ensure_col', ensureCol)
    .addNode('modify_and_write_col', modifyAndWriteColLLM)
    .addEdge(START, 'read_cols')
    .addEdge('read_cols', 'ensure_col')
    .addEdge('ensure_col', 'modify_and_write_col')
    .addEdge('modify_and_write_col', END)

  return g.compile()
}
