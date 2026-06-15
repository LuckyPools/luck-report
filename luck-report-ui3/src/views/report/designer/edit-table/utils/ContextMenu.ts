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
 * - helper 函数（pasteStyle / undoPasteStyle / checkXxx）从 buildMenuConfigure 内闭包
 *   抽到模块顶层，便于单测和复用；运行时行为完全等价
 */
import Handsontable from 'handsontable'
import { t, i18n } from '@/locales'
import { setDirty, undoManager } from '@/utils/table'
import { doInsertRow } from '@/views/report/designer/edit-table/utils/operation/InsertRowOperation'
import { doInsertCol } from '@/views/report/designer/edit-table/utils/operation/InsertColOperation'
import { doDeleteRow } from '@/views/report/designer/edit-table/utils/operation/DeleteRowOperation'
import { doDeleteCol } from '@/views/report/designer/edit-table/utils/operation/DeleteColOperation'
import {
  doCleanContent,
  doCleanStyle,
  doCleanAll
} from '@/views/report/designer/edit-table/utils/operation/ClearCellOperation'
import { renderRowHeader } from '@/views/report/designer/edit-table/utils/HeaderUtils'
import RowColWidthHeightDialogClass from '@/views/report/designer/edit-table/row-col-width-height-dialog/class'
import RowColNumberDialogClass from '@/views/report/designer/edit-table/row-col-number-dialog/class'
import type { HandsontableInstance } from '@/types/handsontable'
import { showAlert } from '@/utils/comnon'
import { addRowHeader, adjustDelRowHeaders, getCell } from '@/utils/contextActions'
import TableManager from '../manager'

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

/** 选中区域（handsontable getSelected 返回元组） */
type Selection = [number, number, number, number]

/**
 * 工具：取出当前选中区域，并归一化为 startRow/endRow/startCol/endCol
 * @returns 选中区域信息；无选中返回 null
 */
function getCurrentSelection(): { startRow: number; endRow: number; startCol: number; endCol: number } | null {
  const hot = TableManager.get() as HandsontableInstance | null
  if (!hot || typeof hot.getSelected !== 'function') return null
  const selected = hot.getSelected()
  if (!selected || selected.length === 0) return null
  const selection = selected[0] as Selection | undefined
  if (!selection) return null
  const [row1, col1, row2, col2] = selection
  return {
    startRow: Math.min(row1, row2),
    endRow: Math.max(row1, row2),
    startCol: Math.min(col1, col2),
    endCol: Math.max(col1, col2)
  }
}

/**
 * 工具：取出当前选中的行范围（不关心列）
 */
function getCurrentRowSelection(): { startRow: number; endRow: number } | null {
  const sel = getCurrentSelection()
  if (!sel) return null
  return { startRow: sel.startRow, endRow: sel.endRow }
}

/**
 * 工具：取出当前选中的列范围（不关心行）
 */
function getCurrentColSelection(): { startCol: number; endCol: number } | null {
  const sel = getCurrentSelection()
  if (!sel) return null
  return { startCol: sel.startCol, endCol: sel.endCol }
}

/**
 * 粘贴样式到指定区域
 * 把 window.__copy_cell_style__ 的内容复制到区域内每个单元格的 cellStyle 中
 * @returns key="row,col" -> 旧 cellStyle 的 Map（用于 undo）
 */
export function pasteStyle(startRow: number, endRow: number, startCol: number, endCol: number): Map<string, CellStyle> {
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
export function undoPasteStyle(startRow: number, endRow: number, startCol: number, endCol: number, oldStyleMap: Map<string, CellStyle>): Map<string, CellStyle> {
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
export function checkCopyOperationDisabled(): boolean {
  return getCurrentSelection() === null
}

/**
 * 粘贴样式菜单项是否禁用
 * - 需同时存在选中区域 + 已复制过样式
 */
export function checkPasteOperationDisabled(): boolean {
  if (getCurrentSelection() === null) return true
  if (window.__copy_cell_style__) return false
  return true
}

/**
 * 行删除 / 复制等行级菜单项是否禁用
 * - 选中行数 == 总行数时不允许删除
 */
export function checkRowDeleteOperationDisabled(): boolean {
  const hot = TableManager.get() as HandsontableInstance | null
  const sel = getCurrentRowSelection()
  if (!hot || !sel) return true
  const dif = sel.endRow - sel.startRow + 1
  const countRows = typeof hot.countRows === 'function' ? hot.countRows() : 0
  return dif >= countRows
}

/**
 * 列删除 / 复制等列级菜单项是否禁用
 */
export function checkColDeleteOperationDisabled(): boolean {
  const hot = TableManager.get() as HandsontableInstance | null
  const sel = getCurrentColSelection()
  if (!hot || !sel) return true
  const dif = sel.endCol - sel.startCol + 1
  const countCols = typeof hot.countCols === 'function' ? hot.countCols() : 0
  return dif >= countCols
}

/**
 * 清空类菜单项是否禁用
 */
export function checkCleanOperationDisabled(): boolean {
  return getCurrentSelection() === null
}

/**
 * 工具：批量给选中行加 band 类型（title / summary / repeat / ...）
 * @param hot handsontable 实例
 * @param band 行 band 标识
 */
function applyBandToRows(hot: HandsontableInstance, band: string): void {
  const sel = getCurrentRowSelection()
  if (!sel) return
  for (let rowNumber = sel.startRow; rowNumber <= sel.endRow; rowNumber++) {
    addRowHeader(rowNumber, band)
  }
  renderRowHeader(hot)
  setDirty()
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
        const sel = getCurrentSelection()
        if (!sel) return
        doCleanContent(sel.startRow, sel.endRow, sel.startCol, sel.endCol)
      } else if (key === 'clean_style') {
        const sel = getCurrentSelection()
        if (!sel) return
        doCleanStyle(sel.startRow, sel.endRow, sel.startCol, sel.endCol)
      } else if (key === 'clean') {
        const sel = getCurrentSelection()
        if (!sel) return
        doCleanAll(sel.startRow, sel.endRow, sel.startCol, sel.endCol)
      } else if (key === 'repeat_row_header') {
        applyBandToRows(_this, 'headerrepeat')
      } else if (key === 'title_row') {
        applyBandToRows(_this, 'title')
      } else if (key === 'repeat_row_footer') {
        applyBandToRows(_this, 'footerrepeat')
      } else if (key === 'summary_row') {
        applyBandToRows(_this, 'summary')
      } else if (key === 'repeat_cancel') {
        const sel = getCurrentRowSelection()
        if (!sel) return
        for (let rowNumber = sel.startRow; rowNumber <= sel.endRow; rowNumber++) {
          adjustDelRowHeaders(rowNumber)
        }
        renderRowHeader(_this)
        setDirty()
      } else if (key === 'row_height') {
        const sel = getCurrentRowSelection()
        if (!sel) return
        const rowHeight = _this.getRowHeight(sel.startRow)
        const dialog = new RowColWidthHeightDialogClass()
        dialog.show((newHeight: number) => {
          const rowHeights = _this.getSettings().rowHeights as number[]
          for (let i = sel.startRow; i <= sel.endRow; i++) {
            rowHeights[i] = newHeight
          }
          _this.updateSettings({
            rowHeights: rowHeights,
            manualRowResize: rowHeights
          })
        }, rowHeight, false)
        setDirty()
      } else if (key === 'col_width') {
        const sel = getCurrentColSelection()
        if (!sel) return
        const colWidth = _this.getColWidth(sel.startCol)
        const dialog = new RowColWidthHeightDialogClass()
        dialog.show((newColWidth: number) => {
          const colWidths = _this.getSettings().colWidths as number[]
          for (let i = sel.startCol; i <= sel.endCol; i++) {
            colWidths[i] = newColWidth
          }
          _this.updateSettings({
            colWidths: colWidths,
            manualColumnResize: colWidths
          })
        }, colWidth, true)
        setDirty()
      } else if (key === 'copy_style') {
        const sel = getCurrentSelection()
        if (!sel) return
        const cell = getCell(sel.startRow, sel.startCol)
        if (!cell) {
          showAlert(i18n.global.t('selectTargetCellFirst'))
          return
        }
        window.__copy_cell_style__ = cell.cellStyle as Record<string, unknown>
      } else if (key === 'paste_style') {
        if (!window.__copy_cell_style__) {
          showAlert(i18n.global.t('copyStyleFirst'))
          return
        }
        const sel = getCurrentSelection()
        if (!sel) return
        const { startRow, endRow, startCol, endCol } = sel
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
        name: '<i class="iconfont icon-insertrow" style="color: #3344d3;font-size: 13px"></i> ' + i18n.global.t('table.contextMenu.insertRowUp')
      },
      insert_row_below: {
        name: '<i class="iconfont icon-insertrow" style="color: #3344d3;font-size: 13px"></i> ' + i18n.global.t('table.contextMenu.insertRowDown')
      },
      insert_col_left: {
        name: '<i class="iconfont icon-insert-column" style="color: #008ed3;font-size: 13px"></i> ' + i18n.global.t('table.contextMenu.insertColBefore')
      },
      insert_col_right: {
        name: '<i class="iconfont icon-insert-column" style="color: #008ed3;font-size: 13px"></i> ' + i18n.global.t('table.contextMenu.insertColAfter')
      },
      del_row: {
        name: '<i class="iconfont icon-deleterow" style="color: #d30a16;font-size: 13px"></i>  ' + i18n.global.t('table.contextMenu.delRow'),
        disabled: checkRowDeleteOperationDisabled
      },
      del_col: {
        name: '<i class="iconfont icon-deletecolumn" style="color: #d30a16;font-size: 13px"></i>  ' + i18n.global.t('table.contextMenu.delCol'),
        disabled: checkColDeleteOperationDisabled
      },
      row_height: {
        name: '<i class="iconfont icon-height" style="color: #d30a16;font-size: 13px;font-weight:bold"></i>  ' + i18n.global.t('table.contextMenu.rowHeight'),
        disabled: checkRowDeleteOperationDisabled
      },
      col_width: {
        name: '<i class="iconfont icon-width" style="color: #d30a16;font-size: 13px;font-weight:bold"></i>  ' + i18n.global.t('table.contextMenu.colWidth'),
        disabled: checkColDeleteOperationDisabled
      },
      title_row: {
        name: '<i class="iconfont icon-title" style="color: #9C27B0;font-size: 13px"></i>  ' + i18n.global.t('table.contextMenu.title'),
        disabled: checkRowDeleteOperationDisabled
      },
      repeat_row_header: {
        name: '<i class="iconfont icon-header-repeat" style="color: #9C27B0;font-size: 13px"></i>  ' + i18n.global.t('table.contextMenu.repeatHeader'),
        disabled: checkRowDeleteOperationDisabled
      },
      repeat_row_footer: {
        name: '<i class="iconfont icon-footer-repeat" style="color: #9C27B0;font-size: 13px"></i>  ' + i18n.global.t('table.contextMenu.repeatFooter'),
        disabled: checkRowDeleteOperationDisabled
      },
      summary_row: {
        name: '<i class="iconfont icon-summary" style="color: #9C27B0;font-size: 13px"></i>  ' + i18n.global.t('table.contextMenu.summary'),
        disabled: checkRowDeleteOperationDisabled
      },
      repeat_cancel: {
        name: '<i class="iconfont icon-error" style="color: #d30e00;font-size: 13px"></i>  ' + i18n.global.t('table.contextMenu.cancel'),
        disabled: checkRowDeleteOperationDisabled
      },
      copy_style: {
        name: '<i class="iconfont icon-copy" style="color: #d30e00;font-size: 13px"></i>  ' + i18n.global.t('table.contextMenu.copy'),
        disabled: checkCopyOperationDisabled
      },
      paste_style: {
        name: '<i class="iconfont icon-paste" style="color: #d30e00;font-size: 13px"></i>  ' + i18n.global.t('table.contextMenu.paste'),
        disabled: checkPasteOperationDisabled
      },
      clean_content: {
        name: '<i class="iconfont icon-clean-content" style="color: #007471;font-size: 13px"></i>  ' + i18n.global.t('table.contextMenu.clearContent'),
        disabled: checkCleanOperationDisabled
      },
      clean_style: {
        name: '<i class="iconfont icon-clean-style" style="color: #00746f;font-size: 13px"></i>  ' + i18n.global.t('table.contextMenu.clearStyle'),
        disabled: checkCleanOperationDisabled
      },
      clean: {
        name: '<i class="iconfont icon-clean" style="color: #d30e00;font-size: 13px"></i>  ' + i18n.global.t('table.contextMenu.clearAll'),
        disabled: checkCleanOperationDisabled
      }
    }
  }
}
