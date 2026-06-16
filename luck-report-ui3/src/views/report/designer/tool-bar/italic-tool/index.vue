<template>
  <a-button
    type="text"
    class="italic-tool"
    :class="{ 'is-active': isActive }"
    :title="t('italic')"
    @click="handleClick"
  >
    <i class="iconfont icon-font-italic" :style="{ color: isActive ? 'black' : '#666' }"></i>
  </a-button>
</template>

<script setup lang="ts">
/**
 * ItalicTool 斜体工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 监听 selectedCells 变化，回调 refresh 同步当前 italic 状态
 * 2. 点击 → 切换选中区所有单元格的 italic + 推 undo
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - 自定义 <div class="italic-tool"> → a-button[type="text"]（保持 28×28 紧凑外观）
 * - @/utils/table.js → @/utils/table
 * - data()/methods/watch → ref + 普通函数 + watch
 * - 移除 $emit，本组件无对外事件
 */
import { ref, watch } from 'vue'
import { undoManager, setDirty } from '@/utils/table'
import { showAlert, deepCopy } from '@/utils/comnon'
import { getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import type { ReportCell, ReportCellStyle } from '@/types/report-def'
import type { HandsontableInstance } from '@/types/handsontable'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ItalicTool' })


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

/** 单元格 key → 原 italic 值（用于 undo 恢复） */
type OldItalicMap = Record<string, boolean | undefined>

/** 当前激活的斜体状态（驱动按钮 active 态） */
const isActive = ref<boolean>(false)

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
 * 切换选区单元格斜体状态
 * @returns 旧 italic 值表（用于 undo）
 */
function updateCellsItalicStyle(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): OldItalicMap {
  const oldItalicStyle: OldItalicMap = {}

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const newCellDef = deepCopy(cellDef) as ReportCell
      const cellStyle = newCellDef.cellStyle as ReportCellStyle
      oldItalicStyle[`${i},${j}`] = cellStyle.italic as boolean | undefined
      // 切换斜体状态
      cellStyle.italic = !cellStyle.italic
      setCell(i, j, newCellDef)

      // 更新工具状态为第一个单元格的斜体状态
      if (i === startRow && j === startCol) {
        isActive.value = !!cellStyle.italic
      }
    }
  }
  return oldItalicStyle
}

/**
 * 恢复选区单元格斜体状态（undo 链路）
 */
function restoreItalicStyle(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  oldItalicStyle: OldItalicMap
): void {
  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const newCellDef = deepCopy(cellDef) as ReportCell
      const cellStyle = newCellDef.cellStyle as ReportCellStyle
      cellStyle.italic = oldItalicStyle[`${i},${j}`]
      setCell(i, j, newCellDef)

      // 更新工具状态为第一个单元格的斜体状态
      if (i === startRow && j === startCol) {
        isActive.value = !!cellStyle.italic
      }
    }
  }
}

/** 点击：切换选中区斜体 */
function handleClick(): void {
  if (!checkSelection()) return

  const table = TableManager.get()
  if (!table) return
  const [startRow, startCol, endRow, endCol] = pickRange(table)

  const oldItalicStyle = updateCellsItalicStyle(startRow, startCol, endRow, endCol)
  table.render()

  undoManager.add({
    redo: () => {
      updateCellsItalicStyle(startRow, startCol, endRow, endCol)
      table.render()
      setDirty()
    },
    undo: () => {
      restoreItalicStyle(startRow, startCol, endRow, endCol, oldItalicStyle)
      table.render()
      setDirty()
    }
  })
  setDirty()
}

/**
 * 同步工具状态：取选中区第一个单元格的 italic
 */
function refresh(startRow: number, startCol: number, endRow: number, endCol: number): void {
  if (startRow > endRow) [startRow, endRow] = [endRow, startRow]
  if (startCol > endCol) [startCol, endCol] = [endCol, startCol]

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue
      const cellStyle = cellDef.cellStyle as ReportCellStyle
      isActive.value = !!cellStyle.italic
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
