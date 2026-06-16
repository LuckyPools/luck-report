<template>
  <div class="u-inline">
    <u-color-picker
      v-model:value="selectedColor"
      :before-toggle="checkSelection"
      @change="onColorChange"
    >
      <a-button
        type="default"
        :title="t('tools.foreColor.color')"
        class="font-color-btn"
      >
        <div class="icon-wrapper">
          <i class="iconfont icon-font-color"></i>
          <span class="color-indicator" :style="{ backgroundColor: displayColor }"></span>
        </div>
      </a-button>
    </u-color-picker>
  </div>
</template>

<script setup lang="ts">
/**
 * FontColorTool 字体颜色工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 监听 selectedCells 变化，回调 refresh 同步当前 forecolor
 * 2. UColorPicker 打开前通过 beforeToggle 校验是否选中单元格
 * 3. 选色 → onColorChange → 写 cellStyle.forecolor + 推 undo
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - UColorPicker + UButton（自定义）→ UColorPicker + a-button
 * - v-model → v-model:value（Vue 3 双向绑定语法）
 * - @/utils/table.js → @/utils/table
 * - data()/methods/watch → ref + 普通函数 + watch
 */
import { ref, computed, watch } from 'vue'
import { undoManager, setDirty } from '@/utils/table'
import { showAlert, deepCopy } from '@/utils/comnon'
import { getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import { hexToRgb, rgbToHex } from '@/utils/color'
import UColorPicker from '@/components/color-picker/index.vue'
import type { ReportCell, ReportCellStyle } from '@/types/report-def'
import type { HandsontableInstance } from '@/types/handsontable'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'FontColorTool' })


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

/** 单元格 key → 原 forecolor 值（用于 undo 恢复） */
type OldForeColorMap = Record<string, string>

const DEFAULT_RGB = '0,0,0'
const DEFAULT_HEX = '#000000'

/** 当前激活的 rgb 颜色（用于 undo 恢复） */
const currentColor = ref<string>(DEFAULT_RGB)
/** UColorPicker 双向绑定的 hex 颜色 */
const selectedColor = ref<string>(DEFAULT_HEX)

/** 颜色指示器展示色 */
const displayColor = computed<string>(() => selectedColor.value || DEFAULT_HEX)

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
 * 颜色变化回调
 * @param color - hex 颜色值
 */
function onColorChange(color: string): void {
  if (!checkSelection()) return

  const rgbStr = hexToRgb(color)
  currentColor.value = rgbStr

  const table = TableManager.get()
  if (!table) return
  const [startRow, startCol, endRow, endCol] = pickRange(table)

  const oldForeColorStyle = updateCellsForeColorStyle(startRow, startCol, endRow, endCol, rgbStr)
  table.render()

  undoManager.add({
    redo: () => {
      updateCellsForeColorStyle(startRow, startCol, endRow, endCol, rgbStr)
      table.render()
      setDirty()
    },
    undo: () => {
      restoreForeColorStyle(startRow, startCol, endRow, endCol, oldForeColorStyle)
      table.render()
      setDirty()
    }
  })
  setDirty()
}

/**
 * 更新选区单元格字体颜色
 * @returns 旧 forecolor 表（用于 undo）
 */
function updateCellsForeColorStyle(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  color: string
): OldForeColorMap {
  const oldForeColorStyle: OldForeColorMap = {}

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const newCellDef = deepCopy(cellDef) as ReportCell
      const cellStyle = newCellDef.cellStyle as ReportCellStyle
      oldForeColorStyle[`${i},${j}`] = cellStyle.forecolor as string
      cellStyle.forecolor = color
      setCell(i, j, newCellDef)
    }
  }
  return oldForeColorStyle
}

/**
 * 恢复选区单元格字体颜色（undo 链路）
 */
function restoreForeColorStyle(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  oldForeColorStyle: OldForeColorMap
): void {
  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const newCellDef = deepCopy(cellDef) as ReportCell
      const cellStyle = newCellDef.cellStyle as ReportCellStyle
      cellStyle.forecolor = oldForeColorStyle[`${i},${j}`]
      setCell(i, j, newCellDef)

      if (i === startRow && j === startCol) {
        currentColor.value = (cellStyle.forecolor as string) || DEFAULT_RGB
        const rgbParts = currentColor.value.split(',')
        if (rgbParts.length === 3) {
          selectedColor.value = rgbToHex(
            parseInt(rgbParts[0], 10),
            parseInt(rgbParts[1], 10),
            parseInt(rgbParts[2], 10)
          )
        } else {
          selectedColor.value = DEFAULT_HEX
        }
      }
    }
  }
}

/**
 * 同步工具状态：取选中区第一个单元格的 forecolor
 */
function refresh(startRow: number, startCol: number, endRow: number, endCol: number): void {
  if (startRow > endRow) [startRow, endRow] = [endRow, startRow]
  if (startCol > endCol) [startCol, endCol] = [endCol, startCol]

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const cellStyle = cellDef.cellStyle as ReportCellStyle
      currentColor.value = (cellStyle.forecolor as string) || DEFAULT_RGB

      const rgbParts = currentColor.value.split(',')
      if (rgbParts.length === 3) {
        selectedColor.value = rgbToHex(
          parseInt(rgbParts[0], 10),
          parseInt(rgbParts[1], 10),
          parseInt(rgbParts[2], 10)
        )
      } else {
        selectedColor.value = DEFAULT_HEX
      }
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
.icon-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.icon-wrapper .iconfont {
  font-size: 16px;
  line-height: 1;
}

.color-indicator {
  width: 14px;
  height: 3px;
  margin-top: 1px;
  border-radius: 1px;
}
</style>