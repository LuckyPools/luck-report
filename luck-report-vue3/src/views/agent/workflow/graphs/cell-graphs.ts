/**
 * 单元格相关子工作流（LangGraph 版本）
 * - modifyCellGraph：read → check_and_apply_row_col → modify_and_write_cells
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
import { createLLMDecideNode } from '@/views/agent/workflow/nodes/llm-decide-node.ts'
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
  const readCells = createLLMDecideNode({
    nodeId: 'read_cells',
    allowedTools: ['read_cells'],
    requiredToolResults: ['read_cells'],
    maxIterations: 2,
    resultKey: 'cellsData',
    description:
      '本步骤仅负责一次性读取用户指定的所有目标单元格（必须把用户提到的全部坐标一次传入 read_cells.cellPositionArray，例如 A1+B2 应传 [{row:1,col:1},{row:2,col:2}]）。' +
      '**禁止**重复读取、禁止输出任何文字向用户提问、禁止在本步骤尝试写入。' +
      '读到结果后立即结束本步骤，写入操作由后续的 modify_and_write_cells 完成。' +
      '**读到的 cellsData 会自动进入 modify_and_write_cells 的 context，无需也不允许重读**。'
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
    allowedTools: ['write_cells', 'get_cell_template', 'load_report_introduce'],
    requiredToolResults: ['write_cells'],
    maxIterations: 6,
    description:
      'cellsData 已在 context 中，禁止重读。按"读 cellsData → 场景判断（空/类型变更/同类型修改）→ 一次 write_cells"流程处理。' +
      '**索引基准**：get_cell_template 的 rowIndex/colIndex 是 0-based；write_cells 的 key "row,col" 是 1-based，如 C4 → rowIndex=3, colIndex=2, key="4,3"。' +
      '失败必须按 message 修正后重试 write_cells，禁止换工具。'
  })

  // 边序：__start__ → read_cells → check_and_apply_row_col → modify_and_write_cells（写入）→ __end__
  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_cells', readCells)
    .addNode('check_and_apply_row_col', checkAndApplyRowCol)
    .addNode('modify_and_write_cells', modifyAndWriteCellsLLM)
    .addEdge(START, 'read_cells')
    .addEdge('read_cells', 'check_and_apply_row_col')
    .addEdge('check_and_apply_row_col', 'modify_and_write_cells')
    .addEdge('modify_and_write_cells', END)

  return g.compile()
}
