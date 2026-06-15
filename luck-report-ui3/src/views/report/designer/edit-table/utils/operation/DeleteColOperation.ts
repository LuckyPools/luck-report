/**
 * DeleteColOperation：删除列（含撤销/重做）
 *
 * 工作流程：
 * 1. 客户端调用 doDeleteCol() → 取出选中范围 → 调 deleteCol
 * 2. deleteCol 计算合并单元格受影响情况 → 删除列 → 调整 cellsMap
 * 3. undo/redo：redo 重新 deleteCol；undo 还原 colWidths/mergeCells/removedCells
 *
 * 调用方：
 * - src/views/report/designer/edit-table/index.vue（绑定 this 调用 doDeleteCol）
 * - src/views/report/designer/edit-table/utils/ContextMenu.js（右键菜单项）
 *
 * 迁移说明：
 * - 保留原 .js 的所有函数签名，仅添加 TS 类型
 * - 不操作行头（删除列不影响 rowHeaders）
 */
import Handsontable from 'handsontable';
import type { HandsontableInstance } from '@/types/handsontable';
import { resetTableData, setDirty, undoManager } from '@/utils/table';
import { showAlert } from '@/utils/comnon';
import { t, i18n } from '@/locales';
import { addCell, getCell, getContext, removeCell } from '@/utils/contextActions';
import { deepCopy } from '@/utils/comnon';
import type { ReportCell } from '@/types/report-def';

/** 合并单元格定义（项目用到的最小子集） */
interface MergeCellItem {
  row: number
  col: number
  rowspan: number
  colspan: number
}

/** 删除列操作的返回结构（用于 undo/redo） */
export interface DeleteColResult {
  /** 起始列索引 */
  startCol: number
  /** 结束列索引 */
  endCol: number
  /** 删除的列数 */
  dif: number
  /** 原 colWidths 快照 */
  oldColWidths: number[]
  /** 原 mergeCells 快照（深拷贝） */
  oldMergeCells: MergeCellItem[]
  /** 被删除的单元格深拷贝（用于 undo 还原） */
  removedCells: ReportCell[]
}

/**
 * 删除列
 * 删除指定范围内的列，同时调整单元格数据、合并单元格配置
 *
 * @param table handsontable 实例
 * @param startCol 起始列索引（从 0 开始）
 * @param endCol 结束列索引（从 0 开始）
 * @return 删除信息，用于撤销/还原
 */
export function deleteCol(table: HandsontableInstance, startCol: number, endCol: number): DeleteColResult {
  const context = getContext()
  if (!context) {
    return { startCol, endCol, dif: 0, oldColWidths: [], oldMergeCells: [], removedCells: [] }
  }
  const colWidths = table.getSettings().colWidths as number[]
  const mergeCells = (table.getSettings().mergeCells || []) as MergeCellItem[]
  const oldMergeCells: MergeCellItem[] = []
  const newMergeCells: MergeCellItem[] = mergeCells.concat([])
  for (const mergeItem of mergeCells) {
    oldMergeCells.push({ ...mergeItem })
    const col = mergeItem.col
    const colspan = mergeItem.colspan
    const colEnd = col + colspan - 1
    const index = newMergeCells.indexOf(mergeItem)
    if (col >= startCol && colEnd <= endCol) {
      newMergeCells.splice(index, 1)
    } else if (col <= startCol && colEnd >= endCol) {
      const span = endCol - startCol + 1
      let leftSpan = colspan - span
      if (leftSpan === 0) leftSpan = 1
      if (leftSpan === 1 && mergeItem.rowspan === 1) {
        newMergeCells.splice(index, 1)
      } else {
        newMergeCells[index] = {
          col: col,
          row: mergeItem.row,
          rowspan: mergeItem.rowspan,
          colspan: leftSpan
        }
      }
    } else if (col > endCol) {
      const totalCols = endCol - startCol + 1
      newMergeCells[index] = {
        row: mergeItem.row,
        col: col - totalCols,
        rowspan: mergeItem.rowspan,
        colspan: mergeItem.colspan
      }
    }
  }
  table.updateSettings({ mergeCells: [] })
  const dif = endCol - startCol + 1
  const oldColWidths = colWidths.concat([])
  const newColWidths = colWidths.concat([])
  newColWidths.splice(startCol, dif)
  const countRows = table.countRows()
  const removedCells: ReportCell[] = []
  for (let i = endCol; i >= startCol; i--) {
    table.alter('remove_col', i)
    for (let j = 0; j < countRows; j++) {
      const cell = getCell(j, i)
      if (cell) {
        removedCells.push(deepCopy(cell) as ReportCell)
        removeCell(cell)
      }
    }
  }
  const cellsMap = context.cellsMap
  const changeCells = []
  for (const cell of cellsMap.values()) {
    const colIndex = cell.columnNumber - 1
    if (colIndex >= endCol) {
      changeCells.push(cell)
    }
  }
  for (const cell of changeCells) {
    removeCell(cell)
  }
  for (const cell of changeCells) {
    const newCell = deepCopy(cell) as ReportCell
    newCell.columnNumber = cell.columnNumber - dif
    addCell(newCell)
  }
  table.updateSettings({ colWidths: newColWidths, mergeCells: newMergeCells })
  resetTableData(table)
  setDirty()

  return { startCol, endCol, dif, oldColWidths, oldMergeCells, removedCells }
}

/**
 * 客户端调用入口：删除当前选中区域的列
 */
export function doDeleteCol(this: HandsontableInstance): void {
  const selected = this.getSelected()
  const context = getContext()
  if (!selected) {
    showAlert(i18n.global.t('table.colTip'))
    return
  }
  let [, startCol, , endCol] = selected[0]
  if (endCol < startCol) {
    const temp = startCol
    startCol = endCol
    endCol = temp
  }

  const result = deleteCol(this, startCol, endCol)

  const _this = this
  if (!context) return
  const { dif, oldColWidths, oldMergeCells, removedCells } = result
  const cellsMap = context.cellsMap
  undoManager.add({
    redo: function (): void {
      deleteCol(_this, startCol, endCol)
    },
    undo: function (): void {
      for (let i = endCol; i >= startCol; i--) {
        _this.alter('insert_col', i)
      }
      const changeCells = []
      for (const cell of cellsMap.values()) {
        const colIndex = cell.columnNumber - 1
        if (colIndex >= startCol) {
          changeCells.push(cell)
        }
      }
      for (const cell of changeCells) {
        removeCell(cell)
      }
      for (const cell of changeCells) {
        const newCell = deepCopy(cell) as ReportCell
        newCell.columnNumber = cell.columnNumber + dif
        addCell(newCell)
      }
      for (const cell of removedCells) {
        addCell(cell)
      }
      _this.updateSettings({ colWidths: oldColWidths, mergeCells: oldMergeCells })
      setDirty()
    }
  })
}
