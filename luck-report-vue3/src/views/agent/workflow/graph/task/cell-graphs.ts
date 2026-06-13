/**
 * 单元格相关子工作流
 * - modifyCellGraph：修改单元格（read → check_and_apply_row_col → modify_and_write_cells）
 */

import {
  ReportStateGraph,
  LLMDecideNode,
  LastValueAfterFinishChannel,
  defaultRetryOn
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { reportStateSchema } from '../state.ts'

/**
 * 修改单元格工作流
 */
export function modifyCellGraph(): CompiledReportGraph {
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

  // 节点2：补齐行列（解析 cellsData 目标坐标，差值时调 insert_row/insert_col）
  graph.addNode('check_and_apply_row_col', async (state, runtime) => {
    const cellsData = state.cellsData
    if (!cellsData || !runtime) return {}

    // 解析 cellsData 的 key（"row,col"，1-based）得到目标 maxRow/maxCol
    let targetRow = 0
    let targetCol = 0
    for (const key of Object.keys(cellsData)) {
      const [r, c] = key.split(',').map(n => parseInt(n, 10))
      if (Number.isFinite(r) && r > targetRow) targetRow = r
      if (Number.isFinite(c) && c > targetCol) targetCol = c
    }
    if (targetRow === 0 && targetCol === 0) return {}

    // 工具返回 { "1": def, "2": def }，键数即为行/列数
    const rowsResult = await runtime.toolRegistry.executeTool('get_rows', {})
    const colsResult = await runtime.toolRegistry.executeTool('get_columns', {})
    const currentRows = rowsResult && typeof rowsResult === 'object' ? Object.keys(rowsResult).length : 0
    const currentCols = colsResult && typeof colsResult === 'object' ? Object.keys(colsResult).length : 0

    // 行/列不足则补齐（position 0-based，追加在末尾）
    if (currentRows < targetRow) {
      const args = { position: currentRows, number: targetRow - currentRows }
      const toolCallId = `check_row_col#${runtime.runId}#insert_row`
      runtime.emitEvent({ mode: 'updates', event: { nodeId: 'check_and_apply_row_col', output: { type: 'tool_call', toolCallId, toolName: 'insert_row', input: args }, status: 'running' }, timestamp: Date.now() })
      const result = await runtime.toolRegistry.executeTool('insert_row', args)
      runtime.emitEvent({ mode: 'updates', event: { nodeId: 'check_and_apply_row_col', output: { type: 'tool_result', toolCallId, toolName: 'insert_row', result }, status: 'success' }, timestamp: Date.now() })
    }
    if (currentCols < targetCol) {
      const args = { position: currentCols, number: targetCol - currentCols }
      const toolCallId = `check_row_col#${runtime.runId}#insert_col`
      runtime.emitEvent({ mode: 'updates', event: { nodeId: 'check_and_apply_row_col', output: { type: 'tool_call', toolCallId, toolName: 'insert_col', input: args }, status: 'running' }, timestamp: Date.now() })
      const result = await runtime.toolRegistry.executeTool('insert_col', args)
      runtime.emitEvent({ mode: 'updates', event: { nodeId: 'check_and_apply_row_col', output: { type: 'tool_result', toolCallId, toolName: 'insert_col', result }, status: 'success' }, timestamp: Date.now() })
    }

    // 回写 cellsData 触发下游（channel version 递增）
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
