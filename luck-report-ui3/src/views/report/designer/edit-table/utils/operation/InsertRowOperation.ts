/**
 * InsertRowOperation：插入/删除行的操作（含撤销/重做）
 *
 * 工作流程：
 * 1. 客户端（ContentTable / ContextMenu）调用 doInsertRow(above, number)
 * 2. doInsertRow 计算插入位置 → 调 insertRow 实际插入 → 记录 undo 步骤
 * 3. undo/redo 复用 insertRow，undo 时反向：删除行 + 还原 rowHeader + 调整 cellsMap
 *
 * 调用方：
 * - src/views/report/designer/edit-table/index.vue（绑定 this 调用 doInsertRow）
 * - src/views/report/designer/edit-table/utils/ContextMenu.js（右键菜单项）
 *
 * 迁移说明：
 * - 保留原 .js 的所有函数签名，仅添加 TS 类型
 * - table/hot 参数类型为 HandsontableInstance
 * - this 上下文由调用方保证（doInsertRow 仍是 method-style 调用）
 */
import Handsontable from 'handsontable';
import type { HandsontableInstance } from '@/types/handsontable';
import { buildNewCellDef, resetTableData, setDirty, undoManager } from '@/utils/table';
import { renderRowHeader } from '@/views/report/designer/edit-table/utils/HeaderUtils';
import { $t } from '@/locales';
import { showAlert } from '@/utils/comnon';
import {
  addCell,
  adjustDelRowHeaders,
  adjustInsertRowHeaders,
  getCell,
  getContext,
  removeCell
} from '@/utils/contextActions';
import { deepCopy } from '@/components/utils';

/** 插入行操作的返回结构（用于 undo/redo） */
export interface InsertRowResult {
  /** 插入位置（0 基） */
  position: number
  /** 插入行数 */
  number: number
  /** 新行默认高度 */
  newRowHeight: number
}

/**
 * 插入行
 * 在指定位置插入指定数量的行，同时调整单元格数据和行头信息
 *
 * @param table handsontable 实例
 * @param position 插入位置（行索引，从 0 开始）
 * @param number 插入行数，默认 1
 * @return 插入信息，用于撤销/还原
 */
export function insertRow(table: HandsontableInstance, position: number, number = 1): InsertRowResult {
  const defaultRowHeight = 25
  const rowHeights = table.getSettings().rowHeights as number[]
  const newRowHeights: number[] = rowHeights.concat([])
  for (let i = 0; i < number; i++) {
    newRowHeights.splice(position, 0, defaultRowHeight)
  }
  table.alter('insert_row', position, number)
  adjustInsertRowHeaders(position)
  renderRowHeader(table)

  buildNewRowCells(table, position, number)
  table.updateSettings({
    rowHeights: newRowHeights,
    manualRowResize: newRowHeights
  })
  resetTableData(table)
  setDirty()

  return { position, number, newRowHeight: defaultRowHeight }
}

/**
 * 构建新行的单元格数据
 * 将 position 及之后的单元格行号下移 number 位，并在新位置创建空白单元格
 *
 * @param hot handsontable 实例
 * @param position 插入位置
 * @param number 插入行数
 */
function buildNewRowCells(hot: HandsontableInstance, position: number, number: number): void {
  const countCols = hot.countCols()
  const context = getContext()
  if (!context) return
  const cellsMap = context.cellsMap
  const changeCells = []
  for (const cell of cellsMap.values()) {
    const rowIndex = cell.rowNumber - 1
    if (rowIndex >= position) {
      changeCells.push(cell)
    }
  }
  for (const cell of changeCells) {
    removeCell(cell)
  }
  for (const cell of changeCells) {
    const newCell = deepCopy(cell)
    newCell.rowNumber = cell.rowNumber + number
    addCell(newCell)
  }
  for (let i = 0; i < number; i++) {
    for (let j = 0; j < countCols; j++) {
      const newCellDef = buildNewCellDef(position + i + 1, j + 1)
      addCell(newCellDef)
    }
  }
}

/**
 * 客户端调用入口：在当前选中区域的指定位置插入行
 *
 * @param above true=在选中区上方插入；false=在选中区下方插入
 * @param number 插入行数，默认 1
 */
export function doInsertRow(this: HandsontableInstance, above: boolean, number = 1): void {
  const selected = this.getSelected()
  if (!selected) {
    showAlert($t('table.rowTip')).then(() => { /* 取消无操作 */ })
    return
  }
  const range = selected[0]
  const startRow = range[0]
  const endRow = range[2]
  let position = startRow
  if (startRow > endRow) {
    if (above) {
      position = endRow
    } else {
      position = startRow + 1
    }
  } else {
    if (above) {
      position = startRow
    } else {
      position = endRow + 1
    }
  }

  insertRow(this, position, number)

  // 闭包引用 handsontable 实例，供 undo/redo 复用
  const _this = this
  const context = getContext()
  if (!context) return
  const cellsMap = context.cellsMap
  const removeCells: unknown[] = []
  let removeRowHeight = 25
  undoManager.add({
    redo: function (): void {
      insertRow(_this, position, number)
    },
    undo: function (): void {
      removeCells.splice(0, removeCells.length)
      const rowHeights = _this.getSettings().rowHeights as number[]
      const newRowHeights: number[] = rowHeights.concat([])
      for (let i = 0; i < number; i++) {
        removeRowHeight = newRowHeights[position]
        newRowHeights.splice(position, 1)
      }
      _this.alter('remove_row', position, number)
      adjustDelRowHeaders(position)
      renderRowHeader(_this)
      _this.updateSettings({
        rowHeights: newRowHeights,
        manualRowResize: newRowHeights
      })
      const countCols = _this.countCols()
      for (let i = 0; i < number; i++) {
        for (let j = 0; j < countCols; j++) {
          const cell = getCell(position, j)
          if (cell) {
            removeCells.push(cell)
            removeCell(cell)
          }
        }
      }
      const changeCells = []
      for (const cell of cellsMap.values()) {
        const rowIndex = cell.rowNumber - 1
        if (rowIndex > position) {
          changeCells.push(cell)
        }
      }
      for (const cell of changeCells) {
        removeCell(cell)
      }
      for (const cell of changeCells) {
        cell.rowNumber = cell.rowNumber - number
        addCell(cell)
      }
      setDirty()
    }
  })
}
