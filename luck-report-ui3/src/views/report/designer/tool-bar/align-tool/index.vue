<template>
  <a-dropdown trigger="click">
    <a-button type="text" :title="t('tools.alignLeft.upDownAlign')" class="info-button">
      <i :class="['iconfont', currentIconClass]"></i>
    </a-button>
    <template #overlay>
      <a-menu @click="handleMenuClick">
        <a-menu-item v-for="item in menuItems" :key="item.key">
          <i :class="item.icon" style="margin-right: 8px"></i>
          <span>{{ t(item.text) }}</span>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
/**
 * AlignTopTool 上下对齐工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 监听 selectedCells 变化，回调 refresh 同步当前 valign
 * 2. 点击菜单项 → handleAlignXxx → 写 cellStyle.valign + 推 undo
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - ButtonGroup（自定义下拉按钮）→ a-dropdown + a-button + a-menu
 * - @/utils/table.js → @/utils/table（已有 TS 入口）
 * - data()/methods/watch → ref + 普通函数 + watch
 * - 移除 $emit，本组件无对外事件
 *
 * 名称说明：
 * - 组件对外名沿用 AlignTopTool（与父级 tool-bar/index.vue 引用一致）
 */
import { ref, computed, watch } from 'vue'
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface'
import { undoManager, setDirty } from '@/utils/table'
import { showAlert } from '@/utils/comnon'
import { deepCopy } from '@/utils/comnon'
import { getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import type { ReportCell, ReportCellStyle } from '@/types/report-def'
import type { HandsontableInstance } from '@/types/handsontable'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'AlignTopTool' })


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

/** 垂直对齐方式 */
type VAlignType = 'top' | 'middle' | 'bottom'
/** 单元格 key → 原 valign 值（用于 undo 恢复） */
type OldValignsMap = Record<string, VAlignType | ''>

/** 当前激活的垂直对齐方式（驱动工具图标） */
const currentAlign = ref<VAlignType>('middle')

/** 图标 class 映射 */
const currentIconClass = computed<string>(() => {
  const iconMap: Record<VAlignType, string> = {
    top: 'icon-justify-top',
    middle: 'icon-justify',
    bottom: 'icon-justify-bottom'
  }
  return iconMap[currentAlign.value] || iconMap.middle
})

/** 菜单项（text 存 i18n key，模板内通过 $t 翻译） */
const menuItems: Array<{ key: string; text: string; icon: string; action: () => void }> = [
  {
    key: 'top',
    text: 'tools.alignTop.topAlign',
    icon: 'iconfont icon-justify-top',
    action: () => handleAlignTop()
  },
  {
    key: 'middle',
    text: 'tools.alignTop.middleAlign',
    icon: 'iconfont icon-vertical-align-middle',
    action: () => handleAlignMiddle()
  },
  {
    key: 'bottom',
    text: 'tools.alignTop.bottomAlign',
    icon: 'iconfont icon-justify-bottom',
    action: () => handleAlignBottom()
  }
]

/** a-menu 点击入口（按 key 分发到具体动作） */
function handleMenuClick(info: MenuInfo): void {
  const target = menuItems.find((it) => it.key === info.key)
  target?.action()
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
 * 构造单元格垂直对齐方式变更，并写回 store
 * @param align 目标 valign；传 null 时表示按 prevValigns 恢复
 * @param prevValigns 旧值表，仅在 undo 链路使用
 * @returns oldValigns 当前选区的 valign 快照（用于 undo）
 */
function buildCellAlign(align: VAlignType | null, prevValigns?: OldValignsMap): OldValignsMap {
  const oldValigns: OldValignsMap = {}
  const table = TableManager.get()
  if (!table) return oldValigns
  const [startRow, startCol, endRow, endCol] = pickRange(table)

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue

      const newCellDef = deepCopy(cellDef) as ReportCell
      const cellStyle = newCellDef.cellStyle as ReportCellStyle
      oldValigns[`${i},${j}`] = (cellStyle.valign as VAlignType | undefined) ?? ''

      let nextValign: VAlignType | '' = align ?? ''
      if (prevValigns) {
        nextValign = prevValigns[`${i},${j}`] ?? ''
      }

      const td = table.getCell(i, j) as HTMLElement | null
      if (td && nextValign) {
        td.style.verticalAlign = nextValign
      }
      cellStyle.valign = nextValign
      setCell(i, j, newCellDef)
    }
  }
  return oldValigns
}

/** 通用动作：应用 valign + 推 undo/redo */
function applyAlign(align: VAlignType): void {
  if (!checkSelection()) return
  const oldValigns = buildCellAlign(align)

  undoManager.add({
    undo: () => {
      buildCellAlign(null, oldValigns)
      setDirty()
    },
    redo: () => {
      buildCellAlign(align)
      setDirty()
    }
  })
  setDirty()
  currentAlign.value = align
}

function handleAlignTop(): void {
  applyAlign('top')
}
function handleAlignMiddle(): void {
  applyAlign('middle')
}
function handleAlignBottom(): void {
  applyAlign('bottom')
}

/**
 * 同步工具状态：取选中区第一个单元格的 valign
 */
function refresh(startRow: number, startCol: number, endRow: number, endCol: number): void {
  if (startRow > endRow) [startRow, endRow] = [endRow, startRow]
  if (startCol > endCol) [startCol, endCol] = [endCol, startCol]

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cellDef = getCell(i, j) as ReportCell | null
      if (!cellDef) continue
      const cellStyle = cellDef.cellStyle as ReportCellStyle
      currentAlign.value = (cellStyle.valign as VAlignType) || 'top'
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
/* 组件特定样式（如有需要在此扩展） */
</style>
