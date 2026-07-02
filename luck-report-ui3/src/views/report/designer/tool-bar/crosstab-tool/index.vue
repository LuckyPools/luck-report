<template>
  <a-button
    :title="t('tools.crosstab.title')"
    type="text"
    class="info-button"
    @click="handleClick"
  >
    <i class="iconfont icon-slash-header"></i>
  </a-button>
  <CrosstabDialog
    :visible="dialogVisible"
    @saveAfter="handleSaveAfter"
    @close="dialogVisible = false"
  />
</template>

<script setup lang="ts">
/**
 * CrosstabTool 交叉表工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 点击按钮 → 弹出 CrosstabDialog
 * 2. 用户输入表达式并确认 → handleSaveAfter → 写入 type=slash + 注册 CrossTabWidget
 * 3. 推 undo/redo，支持 afterSelectionEnd 重新触发
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - u-button（自定义按钮）→ a-button[type="text"]（与 align-tool/border-tool 一致）
 * - @/utils/table.js → @/utils/table（已有 TS 入口）
 * - data()/methods/watch → ref + 普通函数 + watch
 * - 移除 $emit，本组件无对外事件
 */
import { ref, watch } from 'vue'
import Handsontable from 'handsontable'
import { setDirty, undoManager } from '@/utils/table'
import CrossTabWidget from '@/views/report/designer/edit-table/cross-tab-widget/class'
import CrossTabWidgetManager from '@/views/report/designer/edit-table/cross-tab-widget/manager'
import CrosstabDialog from '@/views/report/designer/tool-bar/crosstab-tool/crosstab-dialog/index.vue'
import { showAlert, deepCopy } from '@/utils/comnon'
import { getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import type { ReportCell, HandsontableSelectionRange } from '@/types/report-def'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'CrosstabTool' })


const { t } = useI18n()
/** 入参：当前选中单元格坐标（行/列均为 0-based，null 表示未选） */
interface SelectedCells {
  rowIndex: number | null
  colIndex: number | null
  row2Index: number | null
  col2Index: number | null
}

/** 选区快照（点击时缓存，saveAfter 时使用） */
interface SelectedCellSnapshot {
  rowIndex: number
  colIndex: number
  cellDef: ReportCell
  selected: HandsontableSelectionRange
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

/** 工具激活态（仅作占位，保留与 Vue2 版本同等行为） */
const isActive = ref<boolean>(false)
/** 选区快照 */
const selectedCell = ref<SelectedCellSnapshot | null>(null)
/** 旧 cell data（undo 还原 handsontable 显示） */
const oldCellData = ref<string>('')
/** 旧 cellDef.value（undo 还原 store） */
const oldCellDataValue = ref<unknown>(null)
/** 对话框显隐 */
const dialogVisible = ref<boolean>(false)

/**
 * 检查是否有选中的单元格
 * @returns true=有选择；false=无选择且已弹提示
 */
function checkSelection(): boolean {
  const hot = TableManager.get()
  const selected = hot?.getSelected()
  if (!selected || selected.length === 0) {
    showAlert(t('selectTargetCellFirst') ?? 'selectTargetCellFirst')
    return false
  }
  return true
}

/**
 * 打开交叉表对话框
 */
function handleClick(): void {
  if (!checkSelection()) return
  const hot = TableManager.get()
  if (!hot) return
  const selected = hot.getSelected() as HandsontableSelectionRange[] | undefined
  if (!selected || selected.length === 0) return
  const [rowIndex, colIndex] = selected[0]
  const cellDef = getCell(rowIndex, colIndex) as ReportCell | null
  if (!cellDef) return

  selectedCell.value = {
    rowIndex,
    colIndex,
    cellDef,
    selected: selected[0]
  }
  oldCellData.value = String(hot.getDataAtCell(rowIndex, colIndex) ?? '')
  oldCellDataValue.value = cellDef.value
  dialogVisible.value = true
}

/**
 * 对话框保存回调
 */
function handleSaveAfter(value: string): void {
  const snap = selectedCell.value
  if (!snap) return
  const { rowIndex, colIndex, cellDef, selected } = snap
  const hot = TableManager.get()
  if (!hot) return

  const newCellDef = deepCopy(cellDef) as ReportCell
  newCellDef.value = {
    type: 'slash'
  } as unknown as ReportCell['value']
  setCell(rowIndex, colIndex, newCellDef)

  const widgetKey = `${rowIndex}_${colIndex}`
  if (CrossTabWidgetManager.has(widgetKey)) {
    CrossTabWidgetManager.remove(widgetKey)
  }
  CrossTabWidgetManager.set(widgetKey, new CrossTabWidget(hot, rowIndex, colIndex, value))

  hot.render()
  setDirty()
  Handsontable.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, selected[2], selected[3])

  undoManager.add({
    redo: () => {
      const redoCellDef = deepCopy(getCell(rowIndex, colIndex)) as ReportCell
      redoCellDef.value = {
        type: 'slash'
      } as unknown as ReportCell['value']
      setCell(rowIndex, colIndex, redoCellDef)
      const key = `${rowIndex}_${colIndex}`
      if (CrossTabWidgetManager.has(key)) {
        CrossTabWidgetManager.remove(key)
      }
      CrossTabWidgetManager.set(key, new CrossTabWidget(hot, rowIndex, colIndex, value))
      hot.render()
      setDirty()
      Handsontable.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, selected[2], selected[3])
    },
    undo: () => {
      const undoCellDef = deepCopy(getCell(rowIndex, colIndex)) as ReportCell
      undoCellDef.value = oldCellDataValue.value
      const key = `${rowIndex}_${colIndex}`
      if (CrossTabWidgetManager.has(key)) {
        CrossTabWidgetManager.remove(key)
      }
      setCell(rowIndex, colIndex, undoCellDef)
      hot.setDataAtCell(rowIndex, colIndex, oldCellData.value)
      hot.render()
      setDirty()
      Handsontable.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, selected[2], selected[3])
    }
  })
}

/**
 * 同步工具激活态
 */
function refresh(rowIndex: number, colIndex: number): void {
  const cellDef = getCell(rowIndex, colIndex) as ReportCell | null
  const widgetKey = `${rowIndex}_${colIndex}`
  isActive.value = !!(cellDef && CrossTabWidgetManager.has(widgetKey))
}

watch(
  () => props.selectedCells,
  (newVal) => {
    if (newVal.rowIndex !== null && newVal.colIndex !== null) {
      refresh(newVal.rowIndex, newVal.colIndex)
    }
  },
  { deep: true }
)
</script>
