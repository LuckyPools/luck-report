/**
 * 单元格相关子工作流（LangGraph 版本）
 * - modifyCellGraph：read → check_and_apply_row_col → modify_and_write_cells
 * - readCellsGraph：单节点拉取 cellsData（被 dispatcher read_cells 动作调用）
 *
 * 与自建引擎版本的差异：
 * 1. 不再 new LastValueAfterFinishChannel — channel 概念被 Annotation 取代
 * 2. skipWhen 在节点函数内部提前 return {}，或在条件边路由
 * 3. 节点直接返回 Partial<State>，由 LangGraph reducer 合并
 */

import { StateGraph, START, END } from '@langchain/langgraph'
import {
  ReportStateAnnotation,
  WorkflowRuntimeAnnotation,
  withInput
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { createLLMDecideNode } from '@/service/agent/workflow/nodes/llm-decide-node.ts'
import { createToolCallNode } from '@/service/agent/workflow/nodes/tool-call-node.ts'
import { runToolWithEvent } from '../utils.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'

/**
 * 修改单元格工作流（LangGraph 版本）
 *
 * 边映射：
 * - __start__ → read_cells
 * - read_cells → check_and_apply_row_col（行/列补齐）
 * - check_and_apply_row_col → modify_and_write_cells
 * - modify_and_write_cells → __end__
 *
 * @returns 编译后的可执行图
 */
export function modifyCellGraph(): CompiledReportGraph {
  // 节点1：读取单元格数据（LLM 节点，使用 resultKey='cellsData'）
  // 支持 taskParams.cellAddresses（数组，优先）或 cellAddress（单值）
  const readCells = createLLMDecideNode({
    nodeId: 'read_cells',
    allowedTools: ['read_cells'],
    requiredToolResults: ['read_cells'],
    maxIterations: 2,
    resultKey: 'cellsData',
    description:
      '从 taskParams.cellAddresses（数组）或 cellAddress（单值）读取坐标，一次 read_cells 取全部。\n' +
      'A=1/B=2/.../Z=26/AA=27（1-based），A1→{row:1,col:1}。\n' +
      '读到后立即结束，cellsData 会进入 modify_and_write_cells 的 context。'
  })

  // 节点2：补齐行列（解析 cellsData 目标坐标，差值时调 insert_row/insert_col）
  const checkAndApplyRowCol = withInput(async (state: ReportState, _config, runtime) => {
    const nodeId = 'check_and_apply_row_col'
    const cellsData = state.cellsData
    if (!cellsData || !runtime) return {} as ReportStateUpdate

    // 解析 cellsData 的 key（"row,col"，1-based）得到目标 maxRow/maxCol
    let targetRow = 0
    let targetCol = 0
    for (const key of Object.keys(cellsData)) {
      const [r, c] = key.split(',').map(n => parseInt(n, 10))
      if (Number.isFinite(r) && r > targetRow) targetRow = r
      if (Number.isFinite(c) && c > targetCol) targetCol = c
    }
    // 关键决策点：缺行列 0 时直接跳过（无目标坐标）
    if (targetRow === 0 && targetCol === 0) return {} as ReportStateUpdate

    // 工具返回 { "1": def, "2": def }，键数即为行/列数
    const rowsResult = await runtime.toolRegistry.executeTool('get_rows', {})
    const colsResult = await runtime.toolRegistry.executeTool('get_columns', {})
    const currentRows = rowsResult && typeof rowsResult === 'object' ? Object.keys(rowsResult).length : 0
    const currentCols = colsResult && typeof colsResult === 'object' ? Object.keys(colsResult).length : 0

    // 行/列不足则补齐（position 0-based，追加在末尾）
    if (currentRows < targetRow) {
      await runToolWithEvent(runtime, nodeId, 'insert_row', { position: currentRows, number: targetRow - currentRows })
    }
    if (currentCols < targetCol) {
      await runToolWithEvent(runtime, nodeId, 'insert_col', { position: currentCols, number: targetCol - currentCols })
    }

    // 回写 cellsData 触发下游
    return { cellsData } as ReportStateUpdate
  }, { nodeName: 'check_and_apply_row_col' })

  // 节点3：修改并写入单元格（LLM 节点；maxIterations 内部循环）
  const modifyAndWriteCellsLLM = createLLMDecideNode({
    nodeId: 'modify_and_write_cells',
    allowedTools: ['write_cells', 'get_cell_template', 'load_report_doc'],
    requiredToolResults: ['write_cells'],
    maxIterations: 6,
    description:
      'cellsData 已在 context 中。taskParams.cellAddresses 列出待写入的 cell，合并为一个 cells 对象、一次 write_cells 完成。\n' +
      '索引：get_cell_template 用 0-based，write_cells 的 key "row,col" 用 1-based（C4→"4,3"）。\n' +
      '失败重试同一次 write_cells，不要拆成多次。'
  })

  // 边序：__start__ → read_cells → check_and_apply_row_col → modify_and_write_cells（写入）→ __end__
  // 关键决策点：当 Dispatcher 已执行 read_cells 任务时，state.cellsData 已有数据，
  // 此时跳过内部 read_cells 节点，直接进入 check_and_apply_row_col，避免冗余读取
  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_cells', readCells)
    .addNode('check_and_apply_row_col', checkAndApplyRowCol)
    .addNode('modify_and_write_cells', modifyAndWriteCellsLLM)
    .addConditionalEdges(START, (state: ReportState) => {
      const cellsData = state.cellsData
      if (cellsData && typeof cellsData === 'object' && Object.keys(cellsData).length > 0) {
        return 'check_and_apply_row_col'
      }
      return 'read_cells'
    }, {
      read_cells: 'read_cells',
      check_and_apply_row_col: 'check_and_apply_row_col'
    })
    .addEdge('read_cells', 'check_and_apply_row_col')
    .addEdge('check_and_apply_row_col', 'modify_and_write_cells')
    .addEdge('modify_and_write_cells', END)

  return g.compile()
}

/**
 * 单元格地址 → 行列坐标
 * 支持 A1 / B2 / AA10 等 1-based 坐标，非法地址返回 null
 * （read_cells 工具要求 cellPositionArray 形态）
 */
export function cellAddressToPosition(addr: string): { row: number; col: number } | null {
  if (!addr) return null
  const m = /^([A-Z]+)(\d+)$/i.exec(addr.trim())
  if (!m) return null
  const colLetters = m[1].toUpperCase()
  let col = 0
  for (let i = 0; i < colLetters.length; i++) {
    col = col * 26 + (colLetters.charCodeAt(i) - 64)
  }
  return { row: Number(m[2]), col }
}

// ==================== 读单元格子工作流 ====================

/**
 * 读单元格工作流（dispatcher read_cells 动作调用）
 * 单节点，调 read_cells，结果写入 state.cellsData
 * 支持 task.params.cellAddress="A1" 或 task.params.cellAddresses=["A1","B2"]
 */
export function readCellsGraph(): CompiledReportGraph {
  const readNode = createToolCallNode({
    nodeId: 'read_cells',
    toolName: 'read_cells',
    args: (state) => {
      const p = state.taskParams ?? {}
      const addrs: string[] = Array.isArray(p.cellAddresses) ? p.cellAddresses
        : (p.cellAddress ? [p.cellAddress] : [])
      const positions = addrs.map(cellAddressToPosition).filter(Boolean) as Array<{ row: number; col: number }>
      if (positions.length === 0) return {} // 空 args → 工具按需返回
      return { cellPositionArray: positions }
    },
    resultKey: 'cellsData'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_cells', readNode)
    .addEdge(START, 'read_cells')
    .addEdge('read_cells', END)

  return g.compile()
}
