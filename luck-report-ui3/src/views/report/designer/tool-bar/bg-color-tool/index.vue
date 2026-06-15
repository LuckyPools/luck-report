<template>
  <div class="u-inline">
    <a-popover
      trigger="click"
      :open="popoverOpen"
      @openChange="handlePopoverOpenChange"
      placement="bottom"
    >
      <template #content>
        <div class="bg-color-popover">
          <input
            type="color"
            :value="selectedColor"
            @input="onColorInput"
            @change="onColorChange"
            class="bg-color-native-input"
          />
          <div class="bg-color-presets">
            <a-button
              v-for="preset in presetColors"
              :key="preset"
              size="small"
              :style="{ backgroundColor: preset, width: '20px', height: '20px', padding: 0, border: '1px solid #d9d9d9' }"
              @click="applyPreset(preset)"
            />
          </div>
        </div>
      </template>
      <a-button
        type="default"
        :title="t('tools.bgColor.bgColor')"
        class="bg-color-btn"
      >
        <div class="icon-wrapper">
          <i class="iconfont icon-background"></i>
          <span class="color-indicator" :style="{ backgroundColor: displayColor }"></span>
        </div>
      </a-button>
    </a-popover>
  </div>
</template>

<script setup lang="ts">
/**
 * BgColorTool 背景色工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 监听 selectedCells 变化，回调 refresh 同步当前 bgcolor
 * 2. popover 打开时校验是否选中单元格
 * 3. 选色 → onColorChange → 写 cellStyle.bgcolor + 推 undo
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - UColorPicker + UButton（自定义）→ a-popover + a-button + 原生 <input type="color">
 *   - ant-design-vue 4 主包未内置 ColorPicker，使用 popover + 原生 picker 兜底
 *   - 保留 @before-toggle 的语义：用 popover 的 openChange 拦截，未选单元格时强制关闭
 * - @/utils/table.js → @/utils/table
 * - data()/methods/watch → ref + 普通函数 + watch
 * - 移除 $emit，本组件无对外事件
 */
import { ref, computed, watch } from 'vue'
import { undoManager, setDirty } from '@/utils/table'
import { showAlert } from '@/utils/comnon'
import { deepCopy } from '@/utils/comnon'
import { getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import { hexToRgb, rgbToHex } from '@/utils/color'
import type { ReportCell, ReportCellStyle } from '@/types/report-def'
import type { HandsontableInstance } from '@/types/handsontable'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'BgColorTool' })


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

/** 单元格 key → 原 bgcolor 值（用于 undo 恢复） */
type OldBgColorMap = Record<string, string>

/** 颜色格式：rgb 字符串（"r,g,b"） */
const DEFAULT_RGB = '255,255,255'
const DEFAULT_HEX = '#FFFFFF'

/** 当前激活的 rgb 颜色（用于 undo 恢复 & 颜色指示器） */
const currentColor = ref<string>(DEFAULT_RGB)
/** popover 双向绑定的 hex 颜色 */
const selectedColor = ref<string>(DEFAULT_HEX)
/** popover 开关 */
const popoverOpen = ref<boolean>(false)

/** 颜色指示器展示色（取自 popover 选中值） */
const displayColor = computed<string>(() => selectedColor.value || DEFAULT_HEX)

/** 颜色预设 */
const presetColors: string[] = [
  '#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#00FFFF',
  '#0000FF', '#800080', '#FF00FF', '#FFFFFF', '#000000'
]

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
 * popover 显隐切换拦截：未选单元格时强制关闭（对应原 @before-toggle 语义）
 */
function handlePopoverOpenChange(open: boolean): void {
  if (open && !checkSelection()) {
    popoverOpen.value = false
    return
  }
  popoverOpen.value = open
}

/** 选色器实时输入（拖动时） */
function onColorInput(e: Event): void {
  const target = e.target as HTMLInputElement
  selectedColor.value = target.value
}

/** 选色器确认（释放鼠标时） */
function onColorChange(e: Event): void {
  const target = e.target as HTMLInputElement
  const hex = target.value
  applyColor(hex)
  popoverOpen.value = false
}

/** 应用预设颜色 */
function applyPreset(hex: string): void {
  selectedColor.value = hex
  applyColor(hex)
  popoverOpen.value = false
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
 * 把 hex 颜色应用到选区并推 undo
 */
function applyColor(hex: string): void {
  if (!checkSelection()) return
  const rgbStr = hexToRgb(hex)
  currentColor.value = rgbStr

  const table = TableManager.get()
  if (!table) return
  const [startRow, startCol, endRow, endCol] = pickRange(table)

  const oldBgColorStyle = updateCellsBgColorStyle(startRow, startCol, endRow, endCol, rgbStr)
  table.render()

  undoManager.add({
    redo: () => {
      updateCellsBgColorStyle(startRow, startCol, endRow, endCol, rgbStr)
      table.render()
      setDirty()
    },
    undo: () => {
      restoreBgColorStyle(startRow, startCol, endRow, endCol, oldBgColorStyle)
      table.render()
      setDirty()
    }
  })
  setDirty()
}

/**
 * 更新选区单元格背景色
 * @returns 旧 bgcolor 表（用于 undo）
 */
function updateCellsBgColorStyle(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  color: string
): OldBgColorMap {
  const oldBgColorStyle: OldBgColorMap = {}

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const newCellDef = deepCopy(cellDef) as ReportCell
      const cellStyle = newCellDef.cellStyle as ReportCellStyle
      oldBgColorStyle[`${i},${j}`] = cellStyle.bgcolor as string
      cellStyle.bgcolor = color
      setCell(i, j, newCellDef)
    }
  }
  return oldBgColorStyle
}

/**
 * 恢复选区单元格背景色（undo 链路）
 */
function restoreBgColorStyle(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  oldBgColorStyle: OldBgColorMap
): void {
  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const newCellDef = deepCopy(cellDef) as ReportCell
      const cellStyle = newCellDef.cellStyle as ReportCellStyle
      cellStyle.bgcolor = oldBgColorStyle[`${i},${j}`]
      setCell(i, j, newCellDef)

      if (i === startRow && j === startCol) {
        currentColor.value = (cellStyle.bgcolor as string) || DEFAULT_RGB
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
 * 同步工具状态：取选中区第一个单元格的 bgcolor
 */
function refresh(startRow: number, startCol: number, endRow: number, endCol: number): void {
  if (startRow > endRow) [startRow, endRow] = [endRow, startRow]
  if (startCol > endCol) [startCol, endCol] = [endCol, startCol]

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const cellStyle = cellDef.cellStyle as ReportCellStyle
      currentColor.value = (cellStyle.bgcolor as string) || DEFAULT_RGB

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
.bg-color-btn {
  border: none;
  padding: 0 10px;
}

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
  margin-top: 2px;
  border: 1px solid #cccccc;
  box-sizing: border-box;
}

.bg-color-popover {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
}

.bg-color-native-input {
  width: 220px;
  height: 32px;
  padding: 0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.bg-color-presets {
  display: grid;
  grid-template-columns: repeat(10, 20px);
  gap: 4px;
}
</style>
