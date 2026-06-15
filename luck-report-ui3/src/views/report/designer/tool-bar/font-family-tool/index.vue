<template>
  <div class="u-inline font-family-tool-dropdown">
    <a-dropdown trigger="click">
      <a-button type="text" :title="t('tools.font.font')" class="info-button">
        <span class="button-text">{{ currentFontFamily }}</span>
      </a-button>
      <template #overlay>
        <a-menu @click="handleMenuClick">
          <a-menu-item v-for="font in fontFamilies" :key="font">
            <span :style="{ fontFamily: font }">{{ font }}</span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<script setup lang="ts">
/**
 * FontFamilyTool 字体工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 监听 selectedCells 变化，回调 refresh 同步当前 fontFamily
 * 2. 点击菜单项 → applyFontFamily(font) → 写 cellStyle.fontFamily + 推 undo
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - ButtonGroup（自定义下拉按钮）→ a-dropdown + a-button + a-menu
 * - @/utils/table.js → @/utils/table（已有 TS 入口）
 * - data()/methods/watch → ref + 普通函数 + watch
 * - 移除 $emit，本组件无对外事件
 */
import { ref, watch } from 'vue'
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface'
import { undoManager, setDirty } from '@/utils/table'
import { showAlert } from '@/utils/comnon'
import { deepCopy } from '@/utils/comnon'
import { getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import type { ReportCell, ReportCellStyle } from '@/types/report-def'
import type { HandsontableInstance } from '@/types/handsontable'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'FontFamilyTool' })


const { t } = useI18n()
/** 入参：当前选中单元格坐标（行/列均为 0-based，null 表示未选） */
interface SelectedCells {
  rowIndex: number | null
  colIndex: number | null
  row2Index: number | null
  col2Index: number | null
}

const props = withDefaults(
  defineProps<{ selectedCells: SelectedCells }>(),
  {
    selectedCells: () => ({
      rowIndex: null,
      colIndex: null,
      row2Index: null,
      col2Index: null
    })
  }
)

/** 单元格 key → 原 fontFamily 值（用于 undo 恢复） */
type OldFontFamilyMap = Record<string, string | undefined>

const DEFAULT_FONT_FAMILY = '宋体'

/** 字体选项 */
const fontFamilies: string[] = [
  '宋体',
  '仿宋',
  '黑体',
  '楷体',
  '微软雅黑',
  'Arial',
  'Impact',
  'Times New Roman',
  'Comic Sans MS',
  'Courier New'
]

/** 当前激活的字体（驱动按钮文字） */
const currentFontFamily = ref<string>(DEFAULT_FONT_FAMILY)

/** a-menu 点击入口（按 key 找到字体名后分发） */
function handleMenuClick(info: MenuInfo): void {
  const font = String(info.key)
  applyFontFamily(font)
}

/**
 * 检查是否有选中的单元格
 * @returns true=有选择；false=无选择且已弹提示
 */
function checkSelection(): boolean {
  const hot = TableManager.get()
  const selected = hot?.getSelected()
  if (!selected || selected.length === 0) {
    showAlert((window as { $t?: (k: string) => string }).$t?.('selectTargetCellFirst') ?? 'selectTargetCellFirst')
    return false
  }
  return true
}

/**
 * 提取并归一化选中区域
 * @returns [startRow, startCol, endRow, endCol]
 */
function pickRange(table: HandsontableInstance): [number, number, number, number] {
  const selected = table.getSelected()
  let [startRow, startCol, endRow, endCol] = selected[0]
  if (startRow > endRow) [startRow, endRow] = [endRow, startRow]
  if (startCol > endCol) [startCol, endCol] = [endCol, startCol]
  return [startRow, startCol, endRow, endCol]
}

/**
 * 应用选定的字体 + 推 undo/redo
 */
function applyFontFamily(fontFamily: string): void {
  if (!checkSelection()) return

  const table = TableManager.get()
  if (!table) return
  const [startRow, startCol, endRow, endCol] = pickRange(table)

  const oldFontFamily = updateFontFamily(startRow, startCol, endRow, endCol, fontFamily)
  table.render()

  undoManager.add({
    redo: () => {
      updateFontFamily(startRow, startCol, endRow, endCol, fontFamily)
      table.render()
      setDirty()
    },
    undo: () => {
      restoreFontFamily(startRow, startCol, endRow, endCol, oldFontFamily)
      table.render()
      setDirty()
    }
  })
  setDirty()
}

/**
 * 更新选区单元格字体
 * @returns 旧 fontFamily 表（用于 undo）
 */
function updateFontFamily(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  fontFamily: string
): OldFontFamilyMap {
  const oldFontFamily: OldFontFamilyMap = {}

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const newCellDef = deepCopy(cellDef) as ReportCell
      const cellStyle = newCellDef.cellStyle as ReportCellStyle
      oldFontFamily[`${i},${j}`] = newCellDef.cellStyle.fontFamily as string | undefined
      cellStyle.fontFamily = fontFamily
      setCell(i, j, newCellDef)

      // 更新工具状态为第一个单元格的字体
      if (i === startRow && j === startCol) {
        currentFontFamily.value = fontFamily
      }
    }
  }
  return oldFontFamily
}

/**
 * 恢复选区单元格字体（undo 链路）
 */
function restoreFontFamily(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  oldFontFamily: OldFontFamilyMap
): void {
  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const newCellDef = deepCopy(cellDef) as ReportCell
      const cellStyle = newCellDef.cellStyle as ReportCellStyle
      cellStyle.fontFamily = oldFontFamily[`${i},${j}`]
      setCell(i, j, newCellDef)

      // 更新工具状态为第一个单元格的字体
      if (i === startRow && j === startCol) {
        currentFontFamily.value = (cellStyle.fontFamily as string) || DEFAULT_FONT_FAMILY
      }
    }
  }
}

/**
 * 同步工具状态：取选中区第一个单元格的 fontFamily
 */
function refresh(startRow: number, startCol: number, endRow: number, endCol: number): void {
  if (startRow > endRow) [startRow, endRow] = [endRow, startRow]
  if (startCol > endCol) [startCol, endCol] = [endCol, startCol]

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const cellStyle = cellDef.cellStyle as ReportCellStyle
      currentFontFamily.value = (cellStyle.fontFamily as string) || DEFAULT_FONT_FAMILY
      return
    }
  }
}

watch(
  () => props.selectedCells,
  (newVal) => {
    if (newVal.rowIndex !== null && newVal.colIndex !== null) {
      refresh(newVal.rowIndex, newVal.colIndex, newVal.row2Index ?? 0, newVal.col2Index ?? 0)
    }
  },
  { deep: true }
)
</script>

<style scoped>
.font-family-tool-dropdown .button-text {
  display: inline-block;
  vertical-align: top;
  width: 28px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-left: 0;
}
</style>
