/**
 * 单元格相关子工作流（LangGraph 版本）
 * - modifyCellGraph：read → check → check_and_apply_row_col → write_cells → END
 * - readCellsGraph：单节点调 read_cells 工具，读取单元格数据
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
import { buildCheckIfNeedModifyNode } from '@/service/agent/workflow/nodes/check-node.ts'
import { runToolWithEvent } from '../utils.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'

/**
 * 修改单元格工作流（LangGraph 版本）
 *
 * 边映射：
 * - __start__ → read_cells 或 check_if_cells_match（已有数据时跳过读取）
 * - read_cells → check_if_cells_match
 * - check_if_cells_match → [条件边] → check_and_apply_row_col 或 END
 * - check_and_apply_row_col → write_cells
 * - write_cells → END
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
      '从 taskParams.cellAddresses（数组）或 cellAddress（单值）读取坐标，一次 read_cells 取全部。\n' +
      'A=1/B=2/.../Z=26/AA=27（1-based），A1→{row:1,col:1}。\n' +
      '读到后立即结束，cellsData 会进入 check_if_cells_match 的 context。'
  })

  // 节点2：检查当前单元格数据是否已符合需求
  const checkIfCellsMatch = buildCheckIfNeedModifyNode({
    nodeId: 'check_if_cells_match',
    dataKey: 'cellsData',
    skipKey: 'skipCellModify',
    dataDescription: '单元格数据格式为 {"row,col": {value, type, ...}}，row和col从1开始'
  })

  // 节点3：补齐行列（解析 cellsData 目标坐标，差值时调 insert_row/insert_col）
  const checkAndApplyRowCol = withInput(async (state: ReportState, _config, runtime) => {
    const nodeId = 'check_and_apply_row_col'
    const cellsData = state.cellsData
    if (!cellsData || !runtime) return {} as ReportStateUpdate

    let targetRow = 0
    let targetCol = 0
    for (const key of Object.keys(cellsData)) {
      const [r, c] = key.split(',').map(n => parseInt(n, 10))
      if (Number.isFinite(r) && r > targetRow) targetRow = r
      if (Number.isFinite(c) && c > targetCol) targetCol = c
    }
    if (targetRow === 0 && targetCol === 0) return {} as ReportStateUpdate

    const rowsResult = await runtime.toolRegistry.executeTool('get_rows', {})
    const colsResult = await runtime.toolRegistry.executeTool('get_columns', {})
    const currentRows = rowsResult && typeof rowsResult === 'object' ? Object.keys(rowsResult).length : 0
    const currentCols = colsResult && typeof colsResult === 'object' ? Object.keys(colsResult).length : 0

    if (currentRows < targetRow) {
      await runToolWithEvent(runtime, nodeId, 'insert_row', { position: currentRows, number: targetRow - currentRows })
    }
    if (currentCols < targetCol) {
      await runToolWithEvent(runtime, nodeId, 'insert_col', { position: currentCols, number: targetCol - currentCols })
    }

    return { cellsData } as ReportStateUpdate
  }, { nodeName: 'check_and_apply_row_col' })

  // 节点4：写入单元格（LLM 节点，一次 write_cells 完成所有目标单元格的写入）
  const writeCells = createLLMDecideNode({
    nodeId: 'write_cells',
    allowedTools: ['write_cells', 'get_cell_template', 'get_datasets', 'load_report_doc'],
    requiredToolResults: ['write_cells'],
    maxIterations: 6,
    description: (state: ReportState) => {
      // 关键决策点：基于 cellsData 动态判断是否含 dataset 类型单元格，
      // 仅在含 dataset 类型时强制 LLM 先调 get_datasets 校验，避免简单场景（改 A1=张三）的冗余工具调用
      const cellsData = state.cellsData
      let hasDatasetCell = false
      let cellAddressList: string[] = []
      if (cellsData && typeof cellsData === 'object') {
        for (const [addr, cell] of Object.entries(cellsData)) {
          if (cellAddressList.length < 20) cellAddressList.push(addr)
          const v = (cell as any)?.value
          if (v && typeof v === 'object' && v.type === 'dataset') {
            hasDatasetCell = true
            break
          }
        }
      }
      // taskParams.cellAddress(es) 也作为地址兜底（单值或数组）
      const tp = state.taskParams
      if (!hasDatasetCell && tp && typeof tp === 'object') {
        if (tp.cellAddress) cellAddressList.push(String(tp.cellAddress))
        if (Array.isArray(tp.cellAddresses)) {
          for (const a of tp.cellAddresses) {
            if (cellAddressList.length < 20) cellAddressList.push(String(a))
          }
        }
      }

      let desc =
        'cellsData 已在 context 中。taskParams.cellAddresses 列出待写入的 cell，合并为一个 cells 对象、一次 write_cells 完成。\n' +
        '索引：get_cell_template 用 0-based，write_cells 的 key "row,col" 用 1-based（C4→"4,3"）。\n' +
        '失败重试同一次 write_cells，不要拆成多次。\n' +
        '当 userMessage 涉及"制作/创建报表"时，参考 [Agent知识库] 中已加载的报表制作规范，严格按规范配置：标题行跨列合并（colSpan）+居中加粗+大字号、表头行深底浅字+加粗+边框、数据行绑定 dataset 类型并设 expand:Down、所有单元格加边框。不要使用简陋无样式的裸单元格。\n'
      if (cellAddressList.length > 0) {
        desc += `本次写入的目标单元格: ${cellAddressList.join(', ')}\n`
      }
      if (hasDatasetCell) {
        desc +=
          '\n【强约束 — 防捏造】本次写入含 dataset 类型单元格：\n' +
          '1、若上文 [可用数据集清单] 已列出引用的 datasetName 且包含目标 property，可直接使用；\n' +
          '2、若 [可用数据集清单] 缺失、字段不全、或引用的 datasetName/字段不在清单中，**必须**先调 get_datasets 工具拿到真实 datasetName/fields 列表后再 write_cells；\n' +
          '3、禁止使用规划阶段推测的 datasetName 或 property，禁止凭空编造字段名（如 id/name/email 等）。\n'
      }
      return desc
    }
  })

  // ==================== 构建图 ====================
  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_cells', readCells)
    .addNode('check_if_cells_match', checkIfCellsMatch)
    .addNode('check_and_apply_row_col', checkAndApplyRowCol)
    .addNode('write_cells', writeCells)

  // __start__ → read_cells 或直接 check_if_cells_match（已有数据时跳过读取）
  g.addConditionalEdges(START, (state: ReportState) => {
    const cellsData = state.cellsData
    if (cellsData && typeof cellsData === 'object' && Object.keys(cellsData).length > 0) {
      return 'check_if_cells_match'
    }
    return 'read_cells'
  }, {
    read_cells: 'read_cells',
    check_if_cells_match: 'check_if_cells_match'
  })

  g.addEdge('read_cells', 'check_if_cells_match')

  // check_if_cells_match → END 或 check_and_apply_row_col
  g.addConditionalEdges('check_if_cells_match', (state: ReportState) => {
    if (state.skipCellModify === true) {
      console.log('[modifyCellGraph] 单元格数据已符合需求，跳过修改操作')
      return 'END'
    }
    return 'check_and_apply_row_col'
  }, {
    END: END,
    check_and_apply_row_col: 'check_and_apply_row_col'
  })

  g.addEdge('check_and_apply_row_col', 'write_cells')
  g.addEdge('write_cells', END)

  return g.compile()
}

/**
 * 单元格地址 → 行列坐标
 * 支持 A1 / B2 / AA10 等 1-based 坐标，非法地址返回 null
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
 */
export function readCellsGraph(): CompiledReportGraph {
  const readNode = createToolCallNode({
    nodeId: 'read_cells',
    toolName: 'read_cells',
    args: (state) => {
      const p = state.taskParams ?? {}
      if (Array.isArray(p.cellPositionArray) && p.cellPositionArray.length > 0) {
        return { cellPositionArray: p.cellPositionArray }
      }
      return {}
    },
    resultKey: 'cellsData'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_cells', readNode)
    .addEdge(START, 'read_cells')
    .addEdge('read_cells', END)

  return g.compile()
}

// ==================== 合并/拆分单元格子工作流 ====================

/**
 * 合并/拆分单元格工作流（dispatcher merge_cell 动作调用）
 * 选中区域已合并则拆分，未合并则合并
 */
export function mergeCellsGraph(): CompiledReportGraph {
  const mergeNode = createToolCallNode({
    nodeId: 'merge_cells',
    toolName: 'merge_cells',
    args: (state) => {
      const p = state.taskParams ?? {}
      return {
        startRow: p.startRow,
        startCol: p.startCol,
        endRow: p.endRow,
        endCol: p.endCol
      }
    },
    resultKey: 'mergeResult'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('merge_cells', mergeNode)
    .addEdge(START, 'merge_cells')
    .addEdge('merge_cells', END)

  return g.compile()
}
