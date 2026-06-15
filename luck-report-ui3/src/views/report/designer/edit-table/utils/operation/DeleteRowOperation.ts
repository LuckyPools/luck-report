/**
 * DeleteRowOperation：删除行（含撤销/重做）
 *
 * 工作流程：
 * 1. 客户端调用 doDeleteRow() → 取出选中范围 → 调 deleteRow
 * 2. deleteRow 计算合并单元格受影响情况 → 删除行 → 调整 cellsMap
 * 3. undo/redo：redo 重新 deleteRow；undo 还原 rowHeights/mergeCells/removedCells
 *
 * 调用方：
 * - src/views/report/designer/edit-table/index.vue（绑定 this 调用 doDeleteRow）
 * - src/views/report/designer/edit-table/utils/ContextMenu.js（右键菜单项）
 *
 * 迁移说明：
 * - 保留原 .js 的所有函数签名，仅添加 TS 类型
 * - table 参数类型为 HandsontableInstance
 * - mergeCells / removedCells 显式声明为 any[]（mergeCells 对象结构复杂，留给后续细化）
 */
import Handsontable from 'handsontable';
import type { HandsontableInstance } from '@/types/handsontable';
import { resetTableData, setDirty, undoManager } from '@/utils/table';
import { renderRowHeader } from '../HeaderUtils';
import { t, i18n } from '@/locales';
import { showAlert } from '@/utils/comnon';
import {
  addCell,
  adjustDelRowHeaders,
  adjustInsertRowHeaders,
  getCell,
  getContext,
  removeCell
} from '@/utils/contextActions';
import { deepCopy } from '@/utils/comnon';
import type { ReportCell } from '@/types/report-def';

/** 合并单元格定义（项目用到的最小子集） */
interface MergeCellItem {
  row: number
  col: number
  rowspan: number
  colspan: number
}

/** 删除行操作的返回结构（用于 undo/redo） */
export interface DeleteRowResult {
  /** 起始行索引 */
  startRow: number
  /** 结束行索引 */
  endRow: number
  /** 删除的行数 */
  dif: number
  /** 原 rowHeights 快照 */
  oldRowHeights: number[]
  /** 原 mergeCells 快照（深拷贝） */
  oldMergeCells: MergeCellItem[]
  /** 被删除的单元格深拷贝（用于 undo 还原） */
  removedCells: ReportCell[]
}

/**
 * 删除行
 * 删除指定范围内的行，同时调整单元格数据、合并单元格配置和行头信息
 *
 * @param table handsontable 实例
 * @param startRow 起始行索引（从 0 开始）
 * @param endRow 结束行索引（从 0 开始）
 * @return 删除信息，用于撤销/还原
 */
export function deleteRow(table: HandsontableInstance, startRow: number, endRow: number): DeleteRowResult {
  const context = getContext()
  if (!context) {
    return { startRow, endRow, dif: 0, oldRowHeights: [], oldMergeCells: [], removedCells: [] }
  }
  const rowHeights = table.getSettings().rowHeights as number[]
  const mergeCells = (table.getSettings().mergeCells || []) as MergeCellItem[]
  const oldMergeCells: MergeCellItem[] = []
  const newMergeCells: MergeCellItem[] = mergeCells.concat([])
  for (const mergeItem of mergeCells) {
    oldMergeCells.push({ ...mergeItem })
    const row = mergeItem.row
    const rowspan = mergeItem.rowspan
    const rowEnd = row + rowspan - 1
    const index = newMergeCells.indexOf(mergeItem)
    if (row >= startRow && rowEnd <= endRow) {
      newMergeCells.splice(index, 1)
    } else if (row <= startRow && rowEnd >= endRow) {
      const span = endRow - startRow + 1
      let leftSpan = rowspan - span
      if (leftSpan === 0) leftSpan = 1
      if (leftSpan === 1 && mergeItem.colspan === 1) {
        newMergeCells.splice(index, 1)
      } else {
        newMergeCells[index] = {
          col: mergeItem.col,
          row: row,
          rowspan: leftSpan,
          colspan: mergeItem.colspan
        }
      }
    } else if (row > endRow) {
      const totalRows = endRow - startRow + 1
      newMergeCells[index] = {
        col: mergeItem.col,
        row: row - totalRows,
        rowspan: mergeItem.rowspan,
        colspan: mergeItem.colspan
      }
    }
  }
  table.updateSettings({ mergeCells: [] })
  const dif = endRow - startRow + 1
  const oldRowHeights = rowHeights.concat([])
  const newRowHeights = rowHeights.concat([])
  newRowHeights.splice(startRow, dif)
  const countCols = table.countCols()
  const removedCells: ReportCell[] = []
  for (let i = endRow; i >= startRow; i--) {
    for (let j = 0; j < countCols; j++) {
      const cell = getCell(i, j)
      if (cell) {
        removedCells.push(deepCopy(cell) as ReportCell)
        removeCell(cell)
      }
    }
    table.alter('remove_row', i)
    adjustDelRowHeaders(i)
  }
  renderRowHeader(table)
  const cellsMap = context.cellsMap
  const changeCells = []
  for (const cell of cellsMap.values()) {
    const rowIndex = cell.rowNumber - 1
    if (rowIndex >= endRow) {
      changeCells.push(cell)
    }
  }
  for (const cell of changeCells) {
    removeCell(cell)
  }
  for (const cell of changeCells) {
    const newCell = deepCopy(cell) as ReportCell
    newCell.rowNumber = cell.rowNumber - dif
    addCell(newCell)
  }
  table.updateSettings({ rowHeights: newRowHeights, mergeCells: newMergeCells })
  resetTableData(table)
  setDirty()

  return { startRow, endRow, dif, oldRowHeights, oldMergeCells, removedCells }
}

/**
 * 客户端调用入口：删除当前选中区域的行
 */
export function doDeleteRow(this: HandsontableInstance): void {
  const selected = this.getSelected()
  const context = getContext()
  if (!selected) {
    showAlert(i18n.global.t('table.rowTip')).then(() => { /* 取消无操作 */ })
    return
  }
  let [startRow, , endRow] = selected[0]
  if (endRow < startRow) {
    const temp = startRow
    startRow = endRow
    endRow = temp
  }

  const result = deleteRow(this, startRow, endRow)

  const _this = this
  if (!context) return
  const { dif, oldRowHeights, oldMergeCells, removedCells } = result
  const cellsMap = context.cellsMap
  undoManager.add({
    redo: function (): void {
      deleteRow(_this, startRow, endRow)
    },
    undo: function (): void {
      for (let i = endRow; i >= startRow; i--) {
        _this.alter('insert_row', i)
        adjustInsertRowHeaders(i)
      }
      renderRowHeader(_this)
      const changeCells = []
      for (const cell of cellsMap.values()) {
        const rowIndex = cell.rowNumber - 1
        if (rowIndex >= startRow) {
          changeCells.push(cell)
        }
      }
      for (const cell of changeCells) {
        removeCell(cell)
      }
      for (const cell of changeCells) {
        const newCell = deepCopy(cell) as ReportCell
        newCell.rowNumber = cell.rowNumber + dif
        addCell(newCell)
      }
      for (const cell of removedCells) {
        addCell(cell)
      }
      _this.updateSettings({ rowHeights: oldRowHeights, mergeCells: oldMergeCells })
      setDirty()
    }
  })
}
