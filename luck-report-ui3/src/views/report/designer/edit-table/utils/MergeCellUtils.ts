/**
 * MergeCellUtils：合并 / 拆分单元格核心逻辑
 *
 * 工作流程：
 * 1. 客户端调用 doMergeCells(startRow, startCol, endRow, endCol, table)
 * 2. 遍历选中区域：若区域内存在已合并单元格 → 拆分；否则 → 合并
 * 3. 通过 table.updateSettings({ mergeCells }) 写回 handsontable
 *
 * 调用方：
 * - src/views/report/designer/edit-table/index.vue（绑定 this 调 doMergeCells）
 * - src/views/report/designer/edit-table/utils/ContextMenu.js（右键菜单项）
 *
 * 迁移说明：
 * - 保留原 .js 的所有函数签名
 * - table 参数类型为 HandsontableInstance
 * - 内部表头 DOM 读取 colSpan / rowSpan，HTMLElement 上有原生支持，不需额外声明
 */
import { addCell, getCell } from '@/utils/contextActions';
import { buildNewCellDef } from '@/utils/table';
import type { HandsontableInstance } from '@/types/handsontable';

/** 合并单元格配置（handsontable mergeCells 数组元素） */
export interface MergeCellItem {
  row: number
  col: number
  rowspan: number
  colspan: number
}

/** doMergeCells 返回结构 */
export interface MergeCellsResult {
  /** 操作类型：merge=合并；split=拆分；none=无操作 */
  action: 'merge' | 'split' | 'none'
  /** 合并配置（已更新） */
  mergeCells: MergeCellItem[]
}

/**
 * 合并/拆分单元格核心逻辑
 * 检查选中区域内是否存在已合并的单元格，存在则拆分，否则执行合并
 *
 * @param startRow 起始行索引（从 0 开始）
 * @param startCol 起始列索引（从 0 开始）
 * @param endRow 结束行索引（从 0 开始）
 * @param endCol 结束列索引（从 0 开始）
 * @param table handsontable 实例
 * @return 包含 action 与更新后 mergeCells 的结果对象
 */
export function doMergeCells(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  table: HandsontableInstance
): MergeCellsResult {
  let doMerge = true
  let doSplit = false
  const mergeCells = (table.getSettings().mergeCells || []) as MergeCellItem[]

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const td = table.getCell(i, j) as (HTMLElement & { colSpan?: number; rowSpan?: number }) | null
      if (!td) continue
      const colSpan = td.colSpan || 1
      const rowSpan = td.rowSpan || 1

      if (colSpan > 1 || rowSpan > 1) {
        let index = 0
        doSplit = true
        doMerge = false

        while (index < mergeCells.length) {
          const mergeItem = mergeCells[index]
          const row = mergeItem.row
          const col = mergeItem.col
          if (row === i && col === j) {
            mergeCells.splice(index, 1)
            break
          }
          index++
        }
      }
    }
  }

  if (doMerge) {
    if (endRow < startRow) {
      const tmp = startRow
      startRow = endRow
      endRow = tmp
    }
    if (endCol < startCol) {
      const tmp = startCol
      startCol = endCol
      endCol = tmp
    }

    let rowSpan = endRow - startRow
    let colSpan = endCol - startCol
    rowSpan = rowSpan === 0 ? 1 : rowSpan + 1
    colSpan = colSpan === 0 ? 1 : colSpan + 1

    const newMergeItem: MergeCellItem = { row: startRow, col: startCol, rowspan: rowSpan, colspan: colSpan }
    mergeCells.push(newMergeItem)
  } else if (doSplit) {
    for (let i = startRow; i <= endRow; i++) {
      for (let j = startCol; j <= endCol; j++) {
        const cellDef = getCell(i, j)
        if (!cellDef) {
          const newCell = buildNewCellDef(i + 1, j + 1)
          addCell(newCell)
        }
      }
    }
  }

  table.updateSettings({ mergeCells })

  return {
    action: doMerge ? 'merge' : (doSplit ? 'split' : 'none'),
    mergeCells
  }
}
