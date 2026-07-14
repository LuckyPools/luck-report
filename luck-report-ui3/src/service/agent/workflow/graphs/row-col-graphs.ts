/**
 * 行/列结构相关子工作流（LangGraph 版本）
 *
 * 创建/修改/删除/读取 四类操作各自独立子图，职责单一：
 * - createRowGraph：read → insert_row
 * - modifyRowGraph：read → set_rows（修改已有行属性）
 * - createColGraph：read → insert_col
 * - modifyColGraph：read → set_columns（修改已有列属性）
 * - deleteRowGraph / deleteColGraph：read → delete
 * - readRowsGraph / readColsGraph：单节点读
 *
 * 关键设计：创建和修改分离，避免 insert_col/set_columns 在同一子图内重复调用
 */

import { StateGraph, START, END } from '@langchain/langgraph'
import {
  ReportStateAnnotation,
  WorkflowRuntimeAnnotation
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { createLLMDecideNode } from '@/service/agent/workflow/nodes/llm-decide-node.ts'
import { createToolCallNode } from '@/service/agent/workflow/nodes/tool-call-node.ts'
import { buildCheckIfNeedModifyNode } from '@/service/agent/workflow/nodes/check-node.ts'

import { logger } from '../logger.ts'

const log = logger('row-col-graphs')


// ==================== 创建行子工作流 ====================

/**
 * 创建行工作流
 * 边序：__start__ → read_rows → create_row_llm → __end__
 * 先读取当前行结构，再由 LLM 决策调用 insert_row 工具插入新行
 * @returns 编译后的可执行图
 */
export function createRowGraph(): CompiledReportGraph {
  const readRows = createToolCallNode({
    nodeId: 'read_rows',
    toolName: 'get_rows',
    args: {},
    resultKey: 'rowData'
  })

  const createRowLLM = createLLMDecideNode({
    nodeId: 'create_row_llm',
    allowedTools: ['insert_row', 'load_report_doc'],
    requiredToolResultsAny: ['insert_row'],
    maxIterations: 3,
    description:
      '【必须调工具】你必须调用 insert_row 工具完成行插入，否则任务失败。\n' +
      '【必须用 native 格式】请使用 OpenAI 原生 function calling（tool_calls 字段）输出工具调用，' +
      '不要把工具调用写到文本 content 里（不要用 ```json {"tool": ...} ``` 这种格式）。\n' +
      'rowData 已在 context 中，不需要再调 get_rows。\n' +
      'taskParams 可能包含 rowNumber（起始行号，从1开始）和 count（行数），若 count>1 则一次插入多行。\n' +
      'insert_row 参数：position（插入位置，从0开始，= rowNumber - 1）、number（插入行数，= count ?? 1）。\n' +
      '例如：taskParams={"rowNumber":4,"count":2} → insert_row({position:3, number:2})。'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_rows', readRows)
    .addNode('create_row_llm', createRowLLM)
    .addEdge(START, 'read_rows')
    .addEdge('read_rows', 'create_row_llm')
    .addEdge('create_row_llm', END)

  return g.compile()
}

// ==================== 修改行子工作流 ====================

/**
 * 修改行属性工作流（修改已有行的属性，如高度、可见性等）
 * 边序：__start__ → read_rows → check_if_rows_match → [条件边] → modify_and_write_row → __end__
 * @returns 编译后的可执行图
 */
export function modifyRowGraph(): CompiledReportGraph {
  const readRows = createToolCallNode({
    nodeId: 'read_rows',
    toolName: 'get_rows',
    args: {},
    resultKey: 'rowData'
  })

  // 检查节点：判断当前行数据是否已符合需求
  const checkIfRowsMatch = buildCheckIfNeedModifyNode({
    nodeId: 'check_if_rows_match',
    dataKey: 'rowData',
    skipKey: 'skipRowModify',
    dataDescription: '行数据格式为数组 [{"number": 行号, "height": 高度, ...}]'
  })

  const modifyAndWriteRowLLM = createLLMDecideNode({
    nodeId: 'modify_and_write_row',
    allowedTools: ['set_rows', 'get_row_definitions_template', 'load_report_doc'],
    requiredToolResultsAny: ['set_rows'],
    maxIterations: 4,
    description:
      '【必须调工具】你必须调用 set_rows 工具完成行属性修改，否则任务失败。\n' +
      '【必须用 native 格式】请使用 OpenAI 原生 function calling（tool_calls 字段）输出工具调用，' +
      '不要把工具调用写到文本 content 里（不要用 ```json {"tool": ...} ``` 这种格式）。\n' +
      'rowData 已在 context 中，不需要再调 get_rows。\n' +
      '批量修改 → set_rows({rows: 全量数组}) 一次性传入。\n' +
      '不确定行定义格式时，可先调 get_row_definitions_template 获取模板。\n' +
      '禁止分多轮写入。'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_rows', readRows)
    .addNode('check_if_rows_match', checkIfRowsMatch)
    .addNode('modify_and_write_row', modifyAndWriteRowLLM)
    .addEdge(START, 'read_rows')
    .addEdge('read_rows', 'check_if_rows_match')
    // 检查节点后的条件边：如果已符合需求则跳过修改，否则继续执行
    .addConditionalEdges('check_if_rows_match', (state) => {
      if (state.skipRowModify === true) {
        log.info('[modifyRowGraph] 行数据已符合需求，跳过修改操作')
        return 'END'
      }
      return 'modify_and_write_row'
    }, {
      END: END,
      modify_and_write_row: 'modify_and_write_row'
    })
    .addEdge('modify_and_write_row', END)

  return g.compile()
}

// ==================== 创建列子工作流 ====================

/**
 * 创建列工作流
 * 边序：__start__ → read_cols → create_col_llm → __end__
 * 先读取当前列结构，再由 LLM 决策调用 insert_col 工具插入新列
 * @returns 编译后的可执行图
 */
export function createColGraph(): CompiledReportGraph {
  const readCols = createToolCallNode({
    nodeId: 'read_cols',
    toolName: 'get_columns',
    args: {},
    resultKey: 'colData'
  })

  const createColLLM = createLLMDecideNode({
    nodeId: 'create_col_llm',
    allowedTools: ['insert_col', 'load_report_doc'],
    requiredToolResultsAny: ['insert_col'],
    maxIterations: 3,
    description:
      '【必须调工具】你必须调用 insert_col 工具完成列插入，否则任务失败。\n' +
      '【必须用 native 格式】请使用 OpenAI 原生 function calling（tool_calls 字段）输出工具调用，' +
      '不要把工具调用写到文本 content 里（不要用 ```json {"tool": ...} ``` 这种格式）。\n' +
      'colData 已在 context 中，不需要再调 get_columns。\n' +
      'taskParams 可能包含 columnNumber（起始列号，从1开始）和 count（列数），若 count>1 则一次插入多列。\n' +
      'insert_col 参数：position（插入位置，从0开始，= columnNumber - 1）、number（插入列数，= count ?? 1）。\n' +
      '例如：taskParams={"columnNumber":2,"count":3} → insert_col({position:1, number:3})。'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_cols', readCols)
    .addNode('create_col_llm', createColLLM)
    .addEdge(START, 'read_cols')
    .addEdge('read_cols', 'create_col_llm')
    .addEdge('create_col_llm', END)

  return g.compile()
}

// ==================== 修改列子工作流 ====================

/**
 * 修改列属性工作流（修改已有列的属性，如宽度、可见性等）
 * 边序：__start__ → read_cols → check_if_cols_match → [条件边] → modify_and_write_col → __end__
 * @returns 编译后的可执行图
 */
export function modifyColGraph(): CompiledReportGraph {
  const readCols = createToolCallNode({
    nodeId: 'read_cols',
    toolName: 'get_columns',
    args: {},
    resultKey: 'colData'
  })

  // 检查节点：判断当前列数据是否已符合需求
  const checkIfColsMatch = buildCheckIfNeedModifyNode({
    nodeId: 'check_if_cols_match',
    dataKey: 'colData',
    skipKey: 'skipColModify',
    dataDescription: '列数据格式为数组 [{"number": 列号, "width": 宽度, ...}]'
  })

  const modifyAndWriteColLLM = createLLMDecideNode({
    nodeId: 'modify_and_write_col',
    allowedTools: ['set_columns', 'get_column_definitions_template', 'load_report_doc'],
    requiredToolResultsAny: ['set_columns'],
    maxIterations: 4,
    description:
      '【必须调工具】你必须调用 set_columns 工具完成列属性修改，否则任务失败。\n' +
      '【必须用 native 格式】请使用 OpenAI 原生 function calling（tool_calls 字段）输出工具调用，' +
      '不要把工具调用写到文本 content 里（不要用 ```json {"tool": ...} ``` 这种格式）。\n' +
      'colData 已在 context 中，不需要再调 get_columns。\n' +
      '批量修改 → set_columns({columns: 全量数组}) 一次性传入。\n' +
      '不确定列定义格式时，可先调 get_column_definitions_template 获取模板。\n' +
      '禁止分多轮写入。'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_cols', readCols)
    .addNode('check_if_cols_match', checkIfColsMatch)
    .addNode('modify_and_write_col', modifyAndWriteColLLM)
    .addEdge(START, 'read_cols')
    .addEdge('read_cols', 'check_if_cols_match')
    // 检查节点后的条件边：如果已符合需求则跳过修改，否则继续执行
    .addConditionalEdges('check_if_cols_match', (state) => {
      if (state.skipColModify === true) {
        log.info('[modifyColGraph] 列数据已符合需求，跳过修改操作')
        return 'END'
      }
      return 'modify_and_write_col'
    }, {
      END: END,
      modify_and_write_col: 'modify_and_write_col'
    })
    .addEdge('modify_and_write_col', END)

  return g.compile()
}

// ==================== 删除行子工作流 ====================

/**
 * 删除行工作流
 * 边序：__start__ → read_rows → delete_row_llm → __end__
 * @returns 编译后的可执行图
 */
export function deleteRowGraph(): CompiledReportGraph {
  const readRows = createToolCallNode({
    nodeId: 'read_rows',
    toolName: 'get_rows',
    args: {},
    resultKey: 'rowData'
  })

  const deleteRowLLM = createLLMDecideNode({
    nodeId: 'delete_row_llm',
    allowedTools: ['delete_row', 'load_report_doc'],
    requiredToolResultsAny: ['delete_row'],
    maxIterations: 3,
    description:
      '【必须调工具】你必须调用 delete_row 工具完成行删除，否则任务失败。\n' +
      '【必须用 native 格式】请使用 OpenAI 原生 function calling（tool_calls 字段）输出工具调用，' +
      '不要把工具调用写到文本 content 里（不要用 ```json {"tool": ...} ``` 这种格式）。\n' +
      'rowData 已在 context 中，不需要再调 get_rows。\n' +
      'delete_row 参数：startRow（起始行索引，从0开始）、endRow（结束行索引，从0开始）。\n' +
      '注意：用户说的行号通常从1开始，而 delete_row 的索引从0开始，需要减1转换。\n' +
      '例如：删除第2行 → startRow=1, endRow=1。'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_rows', readRows)
    .addNode('delete_row_llm', deleteRowLLM)
    .addEdge(START, 'read_rows')
    .addEdge('read_rows', 'delete_row_llm')
    .addEdge('delete_row_llm', END)

  return g.compile()
}

// ==================== 删除列子工作流 ====================

/**
 * 删除列工作流
 * 边序：__start__ → read_cols → delete_col_llm → __end__
 * @returns 编译后的可执行图
 */
export function deleteColGraph(): CompiledReportGraph {
  const readCols = createToolCallNode({
    nodeId: 'read_cols',
    toolName: 'get_columns',
    args: {},
    resultKey: 'colData'
  })

  const deleteColLLM = createLLMDecideNode({
    nodeId: 'delete_col_llm',
    allowedTools: ['delete_col', 'load_report_doc'],
    requiredToolResultsAny: ['delete_col'],
    maxIterations: 3,
    description:
      '【必须调工具】你必须调用 delete_col 工具完成列删除，否则任务失败。\n' +
      '【必须用 native 格式】请使用 OpenAI 原生 function calling（tool_calls 字段）输出工具调用，' +
      '不要把工具调用写到文本 content 里（不要用 ```json {"tool": ...} ``` 这种格式）。\n' +
      'colData 已在 context 中，不需要再调 get_columns。\n' +
      'delete_col 参数：startCol（起始列索引，从0开始）、endCol（结束列索引，从0开始）。\n' +
      '注意：用户说的列号通常从1开始，而 delete_col 的索引从0开始，需要减1转换。\n' +
      '例如：删除第2列 → startCol=1, endCol=1。'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_cols', readCols)
    .addNode('delete_col_llm', deleteColLLM)
    .addEdge(START, 'read_cols')
    .addEdge('read_cols', 'delete_col_llm')
    .addEdge('delete_col_llm', END)

  return g.compile()
}

// ==================== 读行/读列子工作流 ====================

/**
 * 读行结构（dispatcher read_rows 动作调用）
 * 单节点，调 get_rows，结果写入 state.rowData
 * 参数：taskParams.rowNumbers=[1,2,3]（可选过滤）
 */
export function readRowsGraph(): CompiledReportGraph {
  const readNode = createToolCallNode({
    nodeId: 'read_rows',
    toolName: 'get_rows',
    args: (state) => {
      const p = state.taskParams ?? {}
      if (Array.isArray(p.rowNumbers) && p.rowNumbers.length > 0) {
        return { rowNumbers: p.rowNumbers }
      }
      return {}
    },
    resultKey: 'rowData'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_rows', readNode)
    .addEdge(START, 'read_rows')
    .addEdge('read_rows', END)

  return g.compile()
}

/**
 * 读列结构（dispatcher read_cols 动作调用）
 * 单节点，调 get_columns，结果写入 state.colData
 * 参数：taskParams.columnNumbers=[1,2,3]（可选过滤）
 */
export function readColsGraph(): CompiledReportGraph {
  const readNode = createToolCallNode({
    nodeId: 'read_cols',
    toolName: 'get_columns',
    args: (state) => {
      const p = state.taskParams ?? {}
      if (Array.isArray(p.columnNumbers) && p.columnNumbers.length > 0) {
        return { columnNumbers: p.columnNumbers }
      }
      return {}
    },
    resultKey: 'colData'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_cols', readNode)
    .addEdge(START, 'read_cols')
    .addEdge('read_cols', END)

  return g.compile()
}
