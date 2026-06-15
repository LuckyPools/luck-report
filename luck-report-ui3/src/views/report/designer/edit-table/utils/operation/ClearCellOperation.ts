/**
 * ClearCellOperation：清空单元格（内容 / 样式 / 全部），含撤销/重做
 *
 * 工作流程：
 * 1. 客户端调用 doCleanContent / doCleanStyle / doCleanAll(范围)
 * 2. cleanCells 根据 type 清空对应属性，记录旧值映射到 Map
 * 3. undo/redo 复用 cleanCells / undoCleanCells
 *
 * 调用方：
 * - src/views/report/designer/edit-table/index.vue
 * - src/views/report/designer/edit-table/utils/ContextMenu.js（右键菜单）
 *
 * 迁移说明：
 * - 保留原 .js 的所有函数签名，仅添加 TS 类型
 * - Map 的 value 类型声明为 CellValueMap（包含 value / cellStyle / cell 三种情形）
 * - Handsontable.hooks.run 显式 import Handsontable 用于钩子触发
 */
import Handsontable from 'handsontable';
import type { HandsontableInstance } from '@/types/handsontable';
import { setDirty, undoManager } from '@/utils/table';
import { $t } from '@/locales';
import { showAlert } from '@/utils/comnon';
import { addCell, getCell, removeCell } from '@/utils/contextActions';
import TableManager from '../../manager';

/** 清空类型 */
export type CleanType = 'content' | 'style' | 'all'

/** Map value 的联合类型（依 type 不同） */
export type CellValueMap = unknown

/**
 * 清空单元格内容
 * 将指定区域内的单元格内容清空，保留样式不变
 *
 * @param startRow 起始行索引，从 0 开始
 * @param endRow 结束行索引，从 0 开始
 * @param startCol 起始列索引，从 0 开始
 * @param endCol 结束列索引，从 0 开始
 * @return 被清空的单元格旧值映射，key 为 "row,col"，value 为旧值对象
 */
export function doCleanContent(startRow: number, endRow: number, startCol: number, endCol: number): Map<string, CellValueMap> {
  let removeCellsMap = cleanCells(startRow, endRow, startCol, endCol, 'content')
  undoManager.add({
    redo: function (): void {
      removeCellsMap = cleanCells(startRow, endRow, startCol, endCol, 'content')
    },
    undo: function (): void {
      undoCleanCells(startRow, endRow, startCol, endCol, removeCellsMap, 'content')
    }
  })
  return removeCellsMap
}

/**
 * 清空单元格样式
 * 将指定区域内的单元格样式重置为默认样式，保留内容不变
 *
 * @param startRow 起始行索引，从 0 开始
 * @param endRow 结束行索引，从 0 开始
 * @param startCol 起始列索引，从 0 开始
 * @param endCol 结束列索引，从 0 开始
 * @return 被清空的单元格旧样式映射，key 为 "row,col"，value 为旧样式对象
 */
export function doCleanStyle(startRow: number, endRow: number, startCol: number, endCol: number): Map<string, CellValueMap> {
  let removeCellsMap = cleanCells(startRow, endRow, startCol, endCol, 'style')
  undoManager.add({
    redo: function (): void {
      removeCellsMap = cleanCells(startRow, endRow, startCol, endCol, 'style')
    },
    undo: function (): void {
      undoCleanCells(startRow, endRow, startCol, endCol, removeCellsMap, 'style')
    }
  })
  return removeCellsMap
}

/**
 * 清空单元格全部（内容+样式）
 * 将指定区域内的单元格内容和样式全部清空，重置为默认空白单元格
 *
 * @param startRow 起始行索引，从 0 开始
 * @param endRow 结束行索引，从 0 开始
 * @param startCol 起始列索引，从 0 开始
 * @param endCol 结束列索引，从 0 开始
 * @return 被清空的单元格旧数据映射，key 为 "row,col"，value 为旧单元格对象
 */
export function doCleanAll(startRow: number, endRow: number, startCol: number, endCol: number): Map<string, CellValueMap> {
  let removeCellsMap = cleanCells(startRow, endRow, startCol, endCol, 'all')
  undoManager.add({
    redo: function (): void {
      removeCellsMap = cleanCells(startRow, endRow, startCol, endCol, 'all')
    },
    undo: function (): void {
      undoCleanCells(startRow, endRow, startCol, endCol, removeCellsMap, 'all')
    }
  })
  return removeCellsMap
}

/**
 * 清空单元格核心方法
 * 根据类型清空指定区域内的单元格内容、样式或全部
 *
 * @param startRow 起始行索引，从 0 开始
 * @param endRow 结束行索引，从 0 开始
 * @param startCol 起始列索引，从 0 开始
 * @param endCol 结束列索引，从 0 开始
 * @param type 清空类型：content=仅内容，style=仅样式，all=全部
 * @return 被清空的数据映射，用于撤销还原
 */
export function cleanCells(startRow: number, endRow: number, startCol: number, endCol: number, type: CleanType): Map<string, CellValueMap> {
  const removeCellsMap = new Map<string, CellValueMap>()
  const hot = TableManager.get() as HandsontableInstance | null
  if (!hot) return removeCellsMap
  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cell = getCell(i, j)
      if (!cell) continue
      // cellStyle 是 ReportCell 的可选字段，统一 cast 为 CellStyle 后访问
      const cellStyle = cell.cellStyle as Record<string, any> | undefined
      if (cellStyle) cellStyle.format = null
      const key = cell.rowNumber + ',' + cell.columnNumber
      if (type === 'content') {
        removeCellsMap.set(key, cell.value)
        cell.value = { type: 'simple', value: '' }
        cell.expand = 'None'
        cell.conditionPropertyItems = null
        hot.setDataAtCell(i, j, '')
      } else if (type === 'style') {
        removeCellsMap.set(key, cell.cellStyle)
        cell.cellStyle = { fontSize: 10, forecolor: '0,0,0', fontFamily: '宋体', align: 'center', valign: 'middle' }
      } else if (type === 'all') {
        removeCell(cell)
        removeCellsMap.set(key, cell)
        const newCell = {
          rowNumber: cell.rowNumber,
          columnNumber: cell.columnNumber,
          expand: 'None',
          value: { type: 'simple', value: '' },
          cellStyle: { fontSize: 10, forecolor: '0,0,0', fontFamily: '宋体', align: 'center', valign: 'middle' }
        }
        addCell(newCell)
        hot.setDataAtCell(i, j, '')
      }
    }
  }
  // 显式触发 afterSelectionEnd，通知上层 UI 刷新
  Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol)
  hot.render()
  return removeCellsMap
}

/**
 * 撤销清空单元格操作
 * 根据类型还原被清空的单元格内容、样式或全部
 *
 * @param startRow 起始行索引，从 0 开始
 * @param endRow 结束行索引，从 0 开始
 * @param startCol 起始列索引，从 0 开始
 * @param endCol 结束列索引，从 0 开始
 * @param removeCellsMap 清空时保存的旧数据映射
 * @param type 清空类型：content=仅内容，style=仅样式，all=全部
 */
export function undoCleanCells(
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
  removeCellsMap: Map<string, CellValueMap>,
  type: CleanType
): void {
  const hot = TableManager.get() as HandsontableInstance | null
  if (!hot) return
  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cell = getCell(i, j)
      if (!cell) continue
      const key = cell.rowNumber + ',' + cell.columnNumber
      if (type === 'content') {
        const orgValue = removeCellsMap.get(key)
        if (!orgValue) {
          showAlert($t('table.contextMenu.cancelConetntFail'))
          return
        }
        cell.value = orgValue
        const value = cell.value as { type: string; datasetName?: string; aggregate?: string; property?: string; value?: string }
        const valueType = value.type
        let text = value.value || ''
        if (valueType === 'dataset') {
          text = (value.datasetName || '') + '.' + (value.aggregate || '') + '(' + (value.property || '') + ')'
        }
        hot.setDataAtCell(i, j, text)
      } else if (type === 'style') {
        const orgStyle = removeCellsMap.get(key)
        if (!orgStyle) {
          showAlert($t('table.contextMenu.cancelStyleFail'))
          return
        }
        cell.cellStyle = orgStyle as typeof cell.cellStyle
      } else if (type === 'all') {
        removeCell(cell)
        const orgCell = removeCellsMap.get(key) as typeof cell | null
        if (!orgCell) {
          showAlert($t('table.contextMenu.cancelClearFail'))
          return
        }
        addCell(orgCell)
        const value = orgCell.value as { type: string; datasetName?: string; aggregate?: string; property?: string; value?: string }
        const valueType = value.type
        let text = value.value || ''
        if (valueType === 'dataset') {
          text = (value.datasetName || '') + '.' + (value.aggregate || '') + '(' + (value.property || '') + ')'
        }
        hot.setDataAtCell(i, j, text)
      }
    }
  }
  Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol)
  hot.render()
}
