/**
 * InsertColOperation：插入/删除列的操作（含撤销/重做）
 *
 * 工作流程：
 * 1. 客户端调用 doInsertCol(left, number) → 计算插入位置 → 调 insertCol
 * 2. insertCol 实际插入列 + 调整 cellsMap + 更新列宽
 * 3. undo/redo 复用 insertCol，undo 时反向：删除列 + 还原 colWidths
 *
 * 调用方：
 * - src/views/report/designer/edit-table/index.vue（绑定 this 调用）
 * - src/views/report/designer/edit-table/utils/ContextMenu.js（右键菜单项）
 *
 * 迁移说明：
 * - 保留原 .js 的所有函数签名，仅添加 TS 类型
 * - table 参数类型为 HandsontableInstance
 * - 不操作行头（rowHeaders 是行级概念）
 */
import Handsontable from 'handsontable';
import type { HandsontableInstance } from '@/types/handsontable';
import { buildNewCellDef, resetTableData, setDirty, undoManager } from '@/utils/table';
import { showAlert } from '@/utils/comnon';
import { t, i18n } from '@/locales';
import { addCell, getCell, getCellsMap, removeCell } from '@/utils/contextActions';
import { deepCopy } from '@/utils/comnon';

/** 插入列操作的返回结构（用于 undo/redo） */
export interface InsertColResult {
  /** 插入位置（0 基） */
  position: number
  /** 插入列数 */
  number: number
  /** 新列默认宽度 */
  newColWidth: number
}

/**
 * 插入列
 * 在指定位置插入指定数量的列，同时调整单元格数据
 *
 * @param table handsontable 实例
 * @param position 插入位置（列索引，从 0 开始）
 * @param number 插入列数，默认 1
 * @return 插入信息，用于撤销/还原
 */
export function insertCol(table: HandsontableInstance, position: number, number = 1): InsertColResult {
  const defaultColWidth = 98
  const colWidths = table.getSettings().colWidths as number[]
  const newColWidths: number[] = colWidths.concat([])
  for (let i = 0; i < number; i++) {
    newColWidths.splice(position, 0, defaultColWidth)
  }
  table.alter('insert_col', position, number)

  const cellsMap = getCellsMap()
  if (!cellsMap) return { position, number, newColWidth: defaultColWidth }
  const changeCells = []
  for (const cell of cellsMap.values()) {
    const colIndex = cell.columnNumber - 1
    if (colIndex >= position) {
      changeCells.push(cell)
    }
  }
  for (const cell of changeCells) {
    removeCell(cell)
  }
  for (const cell of changeCells) {
    const newCell = deepCopy(cell)
    newCell.columnNumber = cell.columnNumber + number
    addCell(newCell)
  }
  const countRows = table.countRows()
  for (let i = 0; i < number; i++) {
    for (let j = 0; j < countRows; j++) {
      const newCellDef = buildNewCellDef(j + 1, position + i + 1)
      addCell(newCellDef)
    }
  }
  table.updateSettings({
    colWidths: newColWidths,
    manualColumnResize: newColWidths
  })
  resetTableData(table)
  setDirty()

  return { position, number, newColWidth: defaultColWidth }
}

/**
 * 客户端调用入口：在当前选中区域的指定位置插入列
 *
 * @param left true=在选中区左侧插入；false=在选中区右侧插入
 * @param number 插入列数，默认 1
 */
export function doInsertCol(this: HandsontableInstance, left: boolean, number = 1): void {
  const selected = this.getSelected()
  if (!selected) {
    showAlert(i18n.global.t('table.colTip'))
    return
  }
  const range = selected[0]
  const startCol = range[1]
  const endCol = range[3]
  let position = startCol
  if (startCol > endCol) {
    if (left) {
      position = endCol
    } else {
      position = startCol + 1
    }
  } else {
    if (left) {
      position = startCol
    } else {
      position = endCol + 1
    }
  }

  insertCol(this, position, number)

  const _this = this
  const removeCells: unknown[] = []
  let removeColWidth = 98
  const cellsMap = getCellsMap()
  if (!cellsMap) return
  undoManager.add({
    redo: function (): void {
      insertCol(_this, position, number)
    },
    undo: function (): void {
      removeCells.splice(0, removeCells.length)
      const colWidths = _this.getSettings().colWidths as number[]
      const newColWidths: number[] = colWidths.concat([])
      for (let i = 0; i < number; i++) {
        removeColWidth = newColWidths[position]
        newColWidths.splice(position, 1)
      }
      _this.alter('remove_col', position, number)
      _this.updateSettings({
        colWidths: newColWidths,
        manualColumnResize: newColWidths
      })
      const countRows = _this.countRows()
      for (let i = 0; i < number; i++) {
        for (let j = 0; j < countRows; j++) {
          const cell = getCell(j, position)
          if (cell) {
            removeCell(cell)
            removeCells.push(cell)
          }
        }
      }
      const changeCells = []
      for (const cell of cellsMap.values()) {
        const colIndex = cell.columnNumber - 1
        if (colIndex > position) {
          changeCells.push(cell)
        }
      }
      for (const cell of changeCells) {
        removeCell(cell)
      }
      for (const cell of changeCells) {
        const newCell = deepCopy(cell)
        newCell.columnNumber = cell.columnNumber - number
        addCell(newCell)
      }
      setDirty()
    }
  })
}
