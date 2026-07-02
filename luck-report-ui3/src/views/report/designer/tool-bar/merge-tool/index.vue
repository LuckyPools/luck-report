<template>
  <a-button
    type="text"
    :title="t('mergeSplitCells')"
    class="info-button"
    @click="handleClick"
  >
    <i class="iconfont icon-merge"></i>
  </a-button>
</template>

<script setup lang="ts">
/**
 * MergeTool 合并/拆分单元格工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 点击按钮 → 若选区内存在已合并单元格则拆分，否则执行合并
 * 2. 推 undo/redo
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - u-button（自定义按钮）→ a-button[type="text"]（与 align-tool / border-tool 一致）
 * - @/utils/table.js → @/utils/table（已有 TS 入口）
 * - data()/methods/watch → 普通函数
 * - 移除 $emit，本组件无对外事件
 */
import { setDirty, undoManager } from '@/utils/table'
import { showAlert } from '@/utils/comnon'
import TableManager from '@/views/report/designer/edit-table/manager'
import { doMergeCells, type MergeCellItem } from '@/views/report/designer/edit-table/utils/MergeCellUtils'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'MergeTool' })


const { t } = useI18n()
/** 入参：当前选中单元格坐标（行/列均为 0-based，null 表示未选） */
interface SelectedCells {
  rowIndex: number | null
  colIndex: number | null
  row2Index: number | null
  col2Index: number | null
}

withDefaults(
  defineProps<{ selectedCells?: SelectedCells }>(),
  {
    selectedCells: () => ({
      rowIndex: null,
      colIndex: null,
      row2Index: null,
      col2Index: null
    })
  }
)

/**
 * 提取并归一化选中区域
 * @returns [startRow, startCol, endRow, endCol]
 */
function pickRange(): [number, number, number, number] {
  const table = TableManager.get()
  const selected = table?.getSelected()
  if (!table || !selected || selected.length === 0) {
    return [0, 0, 0, 0]
  }
  let [startRow, startCol, endRow, endCol] = selected[0]
  let tmp = endRow
  if (startRow > endRow) {
    endRow = startRow
    startRow = tmp
  }
  tmp = endCol
  if (startCol > endCol) {
    endCol = startCol
    startCol = tmp
  }
  return [startRow, startCol, endRow, endCol]
}

/** 读取当前 handsontable 的 mergeCells 配置（unknown[] → MergeCellItem[]） */
function readMergeCells(): MergeCellItem[] {
  const table = TableManager.get()
  if (!table) return []
  const settings = table.getSettings() as { mergeCells?: unknown }
  return Array.isArray(settings.mergeCells)
    ? (settings.mergeCells as MergeCellItem[]).map((it) => ({ ...it }))
    : []
}

/** 点击：合并/拆分选区 */
function handleClick(): void {
  const table = TableManager.get()
  const selected = table?.getSelected()
  if (!selected) {
    showAlert(t('selectTargetCellFirst') ?? 'selectTargetCellFirst')
    return
  }

  const [startRow, startCol, endRow, endCol] = pickRange()
  if (!table) return

  const oldMergeCells: MergeCellItem[] = readMergeCells().concat([])

  doMergeCells(startRow, startCol, endRow, endCol, table)

  undoManager.add({
    redo: () => {
      doMergeCells(startRow, startCol, endRow, endCol, table)
      setDirty()
    },
    undo: () => {
      table.updateSettings({ mergeCells: oldMergeCells } as Record<string, unknown>)
      setDirty()
    }
  })

  setDirty()
}
</script>
