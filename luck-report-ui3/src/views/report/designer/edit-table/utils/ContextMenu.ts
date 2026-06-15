/**
 * ContextMenu：handsontable 右键菜单配置
 *
 * 工作流程：
 * 1. ContentTable 组件初始化 handsontable 时，把 buildMenuConfigure() 的返回值作为 contextMenu 配置
 * 2. handsontable 渲染右键菜单时调用 callback(key, options)，根据 key 分发到对应操作
 * 3. 涉及的操作：
 *    - insert_row_above/below → doInsertRow
 *    - insert_col_left/right → doInsertCol
 *    - del_row / del_col → doDeleteRow / doDeleteCol
 *    - clean_content / clean_style / clean → doCleanContent / doCleanStyle / doCleanAll
 *    - repeat_row_xxx / title_row / summary_row / repeat_cancel → addRowHeader / adjustDelRowHeaders
 *    - row_height / col_width → 弹窗 RowColWidthHeightDialog 后批量更新 rowHeights/colWidths
 *    - copy_style / paste_style → 通过 window.__copy_cell_style__ 中转
 *
 * 调用方：
 * - src/views/report/designer/edit-table/index.vue（handsontable contextMenu 配置）
 *
 * 迁移说明：
 * - 默认导出 buildMenuConfigure() 返回值与原 .js 一致
 * - _this / this 上下文来自 handsontable 回调，类型 HandsontableInstance
 * - 全局 window.__copy_cell_style__ 保留（原代码已有，TS 阶段再考虑收敛）
 */
import { $t } from '@/locales';
import { setDirty, undoManager } from '@/utils/table';
import { doInsertRow } from '@/views/report/designer/edit-table/utils/operation/InsertRowOperation';
import { doInsertCol } from '@/views/report/designer/edit-table/utils/operation/InsertColOperation';
import { doDeleteRow } from '@/views/report/designer/edit-table/utils/operation/DeleteRowOperation';
import { doDeleteCol } from '@/views/report/designer/edit-table/utils/operation/DeleteColOperation';
import {
  doCleanContent,
  doCleanStyle,
  doCleanAll
} from '@/views/report/designer/edit-table/utils/operation/ClearCellOperation';
import { renderRowHeader } from '@/views/report/designer/edit-table/utils/HeaderUtils';
import RowColWidthHeightDialogClass from '@/views/report/designer/edit-table/row-col-width-height-dialog/class';
import RowColNumberDialogClass from '@/views/report/designer/edit-table/row-col-number-dialog/class';
import Handsontable from 'handsontable';
import type { HandsontableInstance } from '@/types/handsontable';
import { showAlert } from '@/utils/comnon';
import { addRowHeader, adjustDelRowHeaders, getCell } from '@/utils/contextActions';
import TableManager from '../manager';

/** 全局复制样式暂存（handsontable 菜单与外部共享） */
declare global {
  interface Window {
    __copy_cell_style__?: Record<string, unknown>
  }
}

/** handsontable contextMenu 配置（标准 i18n 名称、disabled 回调） */
interface MenuItemConfig {
  name: string
  disabled?: () => boolean
}

interface MenuConfig {
  callback: (key: string, options: unknown) => void
  items: Record<string, MenuItemConfig>
}

/** 单元格样式最小子集（用于复制/粘贴） */
interface CellStyle {
  fontSize?: number
  forecolor?: string
  fontFamily?: string
  valign?: string
  align?: string
  bgcolor?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  [key: string]: unknown
}

/**
 * 构造 handsontable 右键菜单配置
 * @returns handsontable contextMenu 选项
 */
export default function buildMenuConfigure(): MenuConfig {
  return {
    callback: function (key: string): void {
      const _this = this as unknown as HandsontableInstance
      if (key === 'insert_row_above') {
        const dialog = new RowColNumberDialogClass()
        dialog.show((number: number) => {
          doInsertRow.call(_this, true, number)
        }, true)
      } else if (key === 'insert_row_below') {
        const dialog = new RowColNumberDialogClass()
        dialog.show((number: number) => {
          doInsertRow.call(_this, false, number)
        }, true)
      } else if (key === 'insert_col_left') {
        const dialog = new RowColNumberDialogClass()
        dialog.show((number: number) => {
          doInsertCol.call(_this, true, number)
        }, false)
      } else if (key === 'insert_col_right') {
        const dialog = new RowColNumberDialogClass()
        dialog.show((number: number) => {
          doInsertCol.call(_this, false, number)
        }, false)
      } else if (key === 'del_row') {
        doDeleteRow.call(_this)
      } else if (key === 'del_col') {
        doDeleteCol.call(_this)
      } else if (key === 'clean_content') {
        const selected = _this.getSelected()
        if (!selected || selected.length === 0) return
        const selection = selected[0]
        if (!selection) return
        const [row1, col1, row2, col2] = selection
        const startRow = Math.min(row1, row2)
        const endRow = Math.max(row1, row2)
        const startCol = Math.min(col1, col2)
        const endCol = Math.max(col1, col2)
        doCleanContent(startRow, endRow, startCol, endCol)
      } else if (key === 'clean_style') {
        const selected = _this.getSelected()
        if (!selected || selected.length === 0) return
        const selection = selected[0]
        if (!selection) return
        const [row1, col1, row2, col2] = selection
        const startRow = Math.min(row1, row2)
        const endRow = Math.max(row1, row2)
        const startCol = Math.min(col1, col2)
        const endCol = Math.max(col1, col2)
        doCleanStyle(startRow, endRow, startCol, endCol)
      } else if (key === 'clean') {
        const selected = _this.getSelected()
        if (!selected || selected.length === 0) return
        const selection = selected[0]
        if (!selection) return
        const [row1, col1, row2, col2] = selection
        const startRow = Math.min(row1, row2)
        const endRow = Math.max(row1, row2)
        const startCol = Math.min(col1, col2)
        const endCol = Math.max(col1, col2)
        doCleanAll(startRow, endRow, startCol, endCol)
      } else if (key === 'repeat_row_header') {
        const selected = _this.getSelected()
        if (!selected || selected.length === 0) return
        const [row1, , row2] = selected[0]
        const startRow = Math.min(row1, row2)
        const endRow = Math.max(row1, row2)
        for (let rowNumber = startRow; rowNumber <= endRow; rowNumber++) {
          addRowHeader(rowNumber, 'headerrepeat')
        }
        renderRowHeader(_this)
        setDirty()
      } else if (key === 'title_row') {
        const selected = _this.getSelected()
        if (!selected || selected.length === 0) return
        const [row1, , row2] = selected[0]
        const startRow = Math.min(row1, row2)
        const endRow = Math.max(row1, row2)
        for (let rowNumber = startRow; rowNumber <= endRow; rowNumber++) {
          addRowHeader(rowNumber, 'title')
        }
        renderRowHeader(_this)
        setDirty()
      } else if (key === 'repeat_row_footer') {
        const selected = _this.getSelected()
        if (!selected || selected.length === 0) return
        const [row1, , row2] = selected[0]
        const startRow = Math.min(row1, row2)
        const endRow = Math.max(row1, row2)
        for (let rowNumber = startRow; rowNumber <= endRow; rowNumber++) {
          addRowHeader(rowNumber, 'footerrepeat')
        }
        renderRowHeader(_this)
        setDirty()
      } else if (key === 'summary_row') {
        const selected = _this.getSelected()
        if (!selected || selected.length === 0) return
        const [row1, , row2] = selected[0]
        const startRow = Math.min(row1, row2)
        const endRow = Math.max(row1, row2)
        for (let rowNumber = startRow; rowNumber <= endRow; rowNumber++) {
          addRowHeader(rowNumber, 'summary')
        }
        renderRowHeader(_this)
        setDirty()
      } else if (key === 'repeat_cancel') {
        const selected = _this.getSelected()
        if (!selected || selected.length === 0) return
        const [row1, , row2] = selected[0]
        const startRow = Math.min(row1, row2)
        const endRow = Math.max(row1, row2)
        for (let rowNumber = startRow; rowNumber <= endRow; rowNumber++) {
          adjustDelRowHeaders(rowNumber)
        }
        renderRowHeader(_this)
        setDirty()
      } else if (key === 'row_height') {
        const selected = _this.getSelected()
        if (!selected || selected.length === 0) return
        const [row1, , row2] = selected[0]
        const startRow = Math.min(row1, row2)
        const endRow = Math.max(row1, row2)
        const rowHeight = _this.getRowHeight(startRow)
        const dialog = new RowColWidthHeightDialogClass()
        dialog.show((newHeight: number) => {
          const rowHeights = _this.getSettings().rowHeights as number[]
          for (let i = startRow; i <= endRow; i++) {
            rowHeights[i] = newHeight
          }
          _this.updateSettings({
            rowHeights: rowHeights,
            manualRowResize: rowHeights
          })
        }, rowHeight, false)
        setDirty()
      } else if (key === 'col_width') {
        const selected = _this.getSelected()
        if (!selected || selected.length === 0) return
        const [, col1, , col2] = selected[0]
        const startCol = Math.min(col1, col2)
        const endCol = Math.max(col1, col2)
        const colWidth = _this.getColWidth(startCol)
        const dialog = new RowColWidthHeightDialogClass()
        dialog.show((newColWidth: number) => {
          const colWidths = _this.getSettings().colWidths as number[]
          for (let i = startCol; i <= endCol; i++) {
            colWidths[i] = newColWidth
          }
          _this.updateSettings({
            colWidths: colWidths,
            manualColumnResize: colWidths
          })
        }, colWidth, true)
        setDirty()
      } else if (key === 'copy_style') {
        const selected = _this.getSelected()
        if (!selected || selected.length === 0) return
        const [row1, col1] = selected[0]
        const startRow = row1
        const startCol = col1
        const cell = getCell(startRow, startCol)
        if (!cell) {
          showAlert($t('selectTargetCellFirst'))
          return
        }
        window.__copy_cell_style__ = cell.cellStyle as Record<string, unknown>
      } else if (key === 'paste_style') {
        if (!window.__copy_cell_style__) {
          showAlert($t('copyStyleFirst'))
          return
        }
        const selected = _this.getSelected()
        if (!selected || selected.length === 0) return
        const [row1, col1, row2, col2] = selected[0]
        const startRow = Math.min(row1, row2)
        const endRow = Math.max(row1, row2)
        const startCol = Math.min(col1, col2)
        const endCol = Math.max(col1, col2)
        const oldCellsStyleMap = pasteStyle(startRow, endRow, startCol, endCol)
        undoManager.add({
          redo: function (): void {
            pasteStyle(startRow, endRow, startCol, endCol)
          },
          undo: function (): void {
            undoPasteStyle(startRow, endRow, startCol, endCol, oldCellsStyleMap)
          }
        })
      }
    },
    items: {
      insert_row_above: {
        name: '<i class="iconfont icon-insertrow" style="color: #3344d3;font-size: 13px"></i> ' + $t('table.contextMenu.insertRowUp')
      },
      insert_row_below: {
        name: '<i class="iconfont icon-insertrow" style="color: #3344d3;font-size: 13px"></i> ' + $t('table.contextMenu.insertRowDown')
      },
      insert_col_left: {
        name: '<i class="iconfont icon-insert-column" style="color: #008ed3;font-size: 13px"></i> ' + $t('table.contextMenu.insertColBefore')
      },
      insert_col_right: {
        name: '<i class="iconfont icon-insert-column" style="color: #008ed3;font-size: 13px"></i> ' + $t('table.contextMenu.insertColAfter')
      },
      del_row: {
        name: '<i class="iconfont icon-deleterow" style="color: #d30a16;font-size: 13px"></i>  ' + $t('table.contextMenu.delRow'),
        disabled: checkRowDeleteOperationDisabled
      },
      del_col: {
        name: '<i class="iconfont icon-deletecolumn" style="color: #d30a16;font-size: 13px"></i>  ' + $t('table.contextMenu.delCol'),
        disabled: checkColDeleteOperationDisabled
      },
      row_height: {
        name: '<i class="iconfont icon-height" style="color: #d30a16;font-size: 13px;font-weight:bold"></i>  ' + $t('table.contextMenu.rowHeight'),
        disabled: checkRowDeleteOperationDisabled
      },
      col_width: {
        name: '<i class="iconfont icon-width" style="color: #d30a16;font-size: 13px;font-weight:bold"></i>  ' + $t('table.contextMenu.colWidth'),
        disabled: checkColDeleteOperationDisabled
      },
      title_row: {
        name: '<i class="iconfont icon-title" style="color: #9C27B0;font-size: 13px"></i>  ' + $t('table.contextMenu.title'),
        disabled: checkRowDeleteOperationDisabled
      },
      repeat_row_header: {
        name: '<i class="iconfont icon-header-repeat" style="color: #9C27B0;font-size: 13px"></i>  ' + $t('table.contextMenu.repeatHeader'),
        disabled: checkRowDeleteOperationDisabled
      },
      repeat_row_footer: {
        name: '<i class="iconfont icon-footer-repeat" style="color: #9C27B0;font-size: 13px"></i>  ' + $t('table.contextMenu.repeatFooter'),
        disabled: checkRowDeleteOperationDisabled
      },
      summary_row: {
        name: '<i class="iconfont icon-summary" style="color: #9C27B0;font-size: 13px"></i>  ' + $t('table.contextMenu.summary'),
        disabled: checkRowDeleteOperationDisabled
      },
      repeat_cancel: {
        name: '<i class="iconfont icon-error" style="color: #d30e00;font-size: 13px"></i>  ' + $t('table.contextMenu.cancel'),
        disabled: checkRowDeleteOperationDisabled
      },
      copy_style: {
        name: '<i class="iconfont icon-copy" style="color: #d30e00;font-size: 13px"></i>  ' + $t('table.contextMenu.copy'),
        disabled: checkCopyOperationDisabled
      },
      paste_style: {
        name: '<i class="iconfont icon-paste" style="color: #d30e00;font-size: 13px"></i>  ' + $t('table.contextMenu.paste'),
        disabled: checkPasteOperationDisabled
      },
      clean_content: {
        name: '<i class="iconfont icon-clean-content" style="color: #007471;font-size: 13px"></i>  ' + $t('table.contextMenu.clearContent'),
        disabled: checkCleanOperationDisabled
      },
      clean_style: {
        name: '<i class="iconfont icon-clean-style" style="color: #00746f;font-size: 13px"></i>  ' + $t('table.contextMenu.clearStyle'),
        disabled: checkCleanOperationDisabled
      },
      clean: {
        name: '<i class="iconfont icon-clean" style="color: #d30e00;font-size: 13px"></i>  ' + $t('table.contextMenu.clearAll'),
        disabled: checkCleanOperationDisabled
      }
    }
  }

  /**
   * 粘贴样式到指定区域
   * 把 window.__copy_cell_style__ 的内容复制到区域内每个单元格的 cellStyle 中
   * @returns key="row,col" -> 旧 cellStyle 的 Map（用于 undo）
   */
  function pasteStyle(startRow: number, endRow: number, startCol: number, endCol: number): Map<string, CellStyle> {
    const style = window.__copy_cell_style__ as CellStyle | undefined
    const cellsMap = new Map<string, CellStyle>()
    const hot = TableManager.get() as HandsontableInstance | null
    if (!hot || !style) return cellsMap
    for (let i = startRow; i <= endRow; i++) {
      for (let j = startCol; j <= endCol; j++) {
        const cell = getCell(i, j)
        if (!cell) continue
        const key = cell.rowNumber + ',' + cell.columnNumber
        // ReportCell.cellStyle 是 Record<string, any> | undefined，赋值时统一 cast 为 CellStyle
        if (!cell.cellStyle) {
          cell.cellStyle = {} as CellStyle
        }
        const cellStyle = cell.cellStyle as CellStyle
        const oldStyle = JSON.parse(JSON.stringify(cellStyle)) as CellStyle
        cellsMap.set(key, oldStyle)
        cellStyle.fontSize = style.fontSize
        cellStyle.forecolor = style.forecolor
        cellStyle.fontFamily = style.fontFamily
        cellStyle.valign = style.valign
        cellStyle.align = style.align
        cellStyle.bgcolor = style.bgcolor
        cellStyle.bold = style.bold
        cellStyle.italic = style.italic
        cellStyle.underline = style.underline
      }
    }
    Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol)
    hot.render()
    return cellsMap
  }

  /**
   * 撤销粘贴样式：把旧 cellStyle 回写到每个单元格
   */
  function undoPasteStyle(startRow: number, endRow: number, startCol: number, endCol: number, oldStyleMap: Map<string, CellStyle>): Map<string, CellStyle> {
    void window.__copy_cell_style__
    const cellsMap = new Map<string, CellStyle>()
    const hot = TableManager.get() as HandsontableInstance | null
    if (!hot) return cellsMap
    for (let i = startRow; i <= endRow; i++) {
      for (let j = startCol; j <= endCol; j++) {
        const cell = getCell(i, j)
        if (!cell) continue
        const key = cell.rowNumber + ',' + cell.columnNumber
        const oldStyle = oldStyleMap.get(key)
        if (oldStyle) {
          cell.cellStyle = oldStyle
        }
      }
    }
    Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol)
    hot.render()
    return cellsMap
  }

  /**
   * 复制样式菜单项是否禁用
   * - 未注册 handsontable 实例 → 禁用
   * - 无选中区域 → 禁用
   */
  function checkCopyOperationDisabled(): boolean {
    const hot = TableManager.get() as HandsontableInstance | null
    if (!hot || typeof hot.getSelected !== 'function') return true
    const selected = hot.getSelected()
    if (!selected || selected.length === 0) return true
    return false
  }

  /**
   * 粘贴样式菜单项是否禁用
   * - 需同时存在选中区域 + 已复制过样式
   */
  function checkPasteOperationDisabled(): boolean {
    const hot = TableManager.get() as HandsontableInstance | null
    if (!hot || typeof hot.getSelected !== 'function') return true
    const selected = hot.getSelected()
    if (!selected || selected.length === 0) return true
    if (window.__copy_cell_style__) return false
    return true
  }

  /**
   * 行删除 / 复制等行级菜单项是否禁用
   * - 选中行数 == 总行数时不允许删除
   */
  function checkRowDeleteOperationDisabled(): boolean {
    const hot = TableManager.get() as HandsontableInstance | null
    if (!hot || typeof hot.getSelected !== 'function') return true
    const selected = hot.getSelected()
    if (!selected || selected.length === 0) return true
    const selection = selected[0]
    if (!selection) return true
    const [startRow, , endRow] = selection
    const dif = Math.abs(startRow - endRow) + 1
    const countRows = typeof hot.countRows === 'function' ? hot.countRows() : 0
    return dif >= countRows
  }

  /**
   * 列删除 / 复制等列级菜单项是否禁用
   */
  function checkColDeleteOperationDisabled(): boolean {
    const hot = TableManager.get() as HandsontableInstance | null
    if (!hot || typeof hot.getSelected !== 'function') return true
    const selected = hot.getSelected()
    if (!selected || selected.length === 0) return true
    const selection = selected[0]
    if (!selection) return true
    const [, startCol, , endCol] = selection
    const dif = Math.abs(startCol - endCol) + 1
    const countCols = typeof hot.countCols === 'function' ? hot.countCols() : 0
    return dif >= countCols
  }

  /**
   * 清空类菜单项是否禁用
   */
  function checkCleanOperationDisabled(): boolean {
    const hot = TableManager.get() as HandsontableInstance | null
    if (!hot || typeof hot.getSelected !== 'function') return true
    const selected = hot.getSelected()
    if (!selected || selected.length === 0) return true
    return false
  }
}
