<template>
  <a-button
    type="text"
    class="underline-tool"
    :class="{ 'is-active': isActive }"
    :title="t('underline')"
    @click="handleClick"
  >
    <i class="iconfont icon-font-underline" :style="{ color: isActive ? 'black' : '#666' }"></i>
  </a-button>
</template>

<script setup lang="ts">
/**
 * UnderlineTool 下划线工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 监听 selectedCells 变化，回调 refresh 同步当前 underline 状态
 * 2. 点击 → 切换选中区所有单元格的 underline + 推 undo
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - 自定义 <div class="underline-tool"> → a-button[type="text"]（保持 28×28 紧凑外观）
 * - @/utils/table.js → @/utils/table
 * - data()/methods/watch → ref + 普通函数 + watch
 * - 移除 $emit，本组件无对外事件
 */
import { ref, watch } from 'vue'
import { undoManager, setDirty } from '@/utils/table'
import { showAlert } from '@/utils/comnon'
import { deepCopy } from '@/utils/comnon'
import { getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import type { ReportCell, ReportCellStyle } from '@/types/report-def'
import type { HandsontableInstance } from '@/types/handsontable'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'UnderlineTool' })


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

/** 单元格 key → 原 underline 值（用于 undo 恢复） */
type OldUnderlineMap = Record<string, boolean | undefined>

/** 当前激活的下划线状态（驱动按钮 active 态） */
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
 * 切换选区单元格下划线状态
 * @returns 旧 underline 值表（用于 undo）
 */
function updateCellsUnderlineStyle(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): OldUnderlineMap {
  const oldUnderlineStyle: OldUnderlineMap = {}

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const newCellDef = deepCopy(cellDef) as ReportCell
      const cellStyle = newCellDef.cellStyle as ReportCellStyle
      oldUnderlineStyle[`${i},${j}`] = cellStyle.underline
      // 切换下划线状态
      cellStyle.underline = !cellStyle.underline
      setCell(i, j, newCellDef)

      // 更新工具状态为第一个单元格的下划线状态
      if (i === startRow && j === startCol) {
        isActive.value = !!cellStyle.underline
      }
    }
  }
  return oldUnderlineStyle
}

/**
 * 恢复选区单元格下划线状态（undo 链路）
 */
function restoreUnderlineStyle(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  oldUnderlineStyle: OldUnderlineMap
): void {
  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const newCellDef = deepCopy(cellDef) as ReportCell
      const cellStyle = newCellDef.cellStyle as ReportCellStyle
      cellStyle.underline = oldUnderlineStyle[`${i},${j}`]
      setCell(i, j, newCellDef)

      // 更新工具状态为第一个单元格的下划线状态
      if (i === startRow && j === startCol) {
        isActive.value = !!cellStyle.underline
      }
    }
  }
}

/** 点击：切换选中区下划线 */
function handleClick(): void {
  if (!checkSelection()) return

  const table = TableManager.get()
  if (!table) return
  const [startRow, startCol, endRow, endCol] = pickRange(table)

  const oldUnderlineStyle = updateCellsUnderlineStyle(startRow, startCol, endRow, endCol)
  table.render()

  undoManager.add({
    redo: () => {
      updateCellsUnderlineStyle(startRow, startCol, endRow, endCol)
      table.render()
      setDirty()
    },
    undo: () => {
      restoreUnderlineStyle(startRow, startCol, endRow, endCol, oldUnderlineStyle)
      table.render()
      setDirty()
    }
  })
  setDirty()
}

/**
 * 同步工具状态：取选中区第一个单元格的 underline
 */
function refresh(startRow: number, startCol: number, endRow: number, endCol: number): void {
  if (startRow > endRow) [startRow, endRow] = [endRow, startRow]
  if (startCol > endCol) [startCol, endCol] = [endCol, startCol]

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue
      const cellStyle = cellDef.cellStyle as ReportCellStyle
      isActive.value = !!cellStyle.underline
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
.underline-tool {
  width: 28px;
  height: 28px;
  margin: 4px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 4px;
}

.underline-tool :deep(.ant-btn) {
  width: 28px;
  height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 4px;
  box-sizing: border-box;
}

.underline-tool:hover :deep(.ant-btn) {
  border-color: #d9d9d9;
}

.underline-tool.is-active :deep(.ant-btn) {
  background-color: rgb(236, 237, 237);
}

.underline-tool .iconfont {
  font-size: 16px;
}
</style>
