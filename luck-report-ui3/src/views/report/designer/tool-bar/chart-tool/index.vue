<template>
  <a-dropdown trigger="click">
    <a-button type="text" :title="t('tools.chart.chart')" class="info-button">
      <i class="iconfont icon-pie-chart"></i>
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
 * ChartTool 图表工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 点击菜单项 → handleChartClick(category) → 在选中起始单元格写入 type=chart
 * 2. 推 undo/redo，支持 afterSelectionEnd 重新触发
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - ButtonGroup（自定义下拉按钮）→ a-dropdown + a-button + a-menu
 * - @/utils/table.js → @/utils/table（已有 TS 入口）
 * - data()/methods/watch → 函数 + watch
 * - 移除 $emit，本组件无对外事件
 * - 显式定义 chart 类型，避免使用 any
 */
import Handsontable from 'handsontable'
import { watch } from 'vue'
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface'
import { undoManager, setDirty } from '@/utils/table'
import { showAlert, deepCopy } from '@/utils/comnon'
import { getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import type { ReportCell, HandsontableSelectionRange } from '@/types/report-def'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ChartTool' })


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

/** 图表数据集类型枚举 */
type ChartCategory =
  | 'pie'
  | 'doughnut'
  | 'line'
  | 'bar'
  | 'horizontalBar'
  | 'area'
  | 'radar'
  | 'polarArea'
  | 'scatter'
  | 'bubble'

/** 单元格 value 中的 chart 结构 */
interface ChartConfig {
  dataset: {
    type: ChartCategory
  }
}

/** 菜单项（text 存 i18n key，模板内通过 $t 翻译） */
const menuItems: Array<{ key: string; text: string; icon: string; category: ChartCategory }> = [
  {
    key: 'pie',
    text: 'tools.chart.pie',
    icon: 'iconfont icon-pie-chart',
    category: 'pie'
  },
  {
    key: 'doughnut',
    text: 'tools.chart.doughnut',
    icon: 'iconfont icon-doughnut',
    category: 'doughnut'
  },
  {
    key: 'line',
    text: 'tools.chart.line',
    icon: 'iconfont icon-line',
    category: 'line'
  },
  {
    key: 'bar',
    text: 'tools.chart.bar',
    icon: 'iconfont icon-bar',
    category: 'bar'
  },
  {
    key: 'horizontalBar',
    text: 'tools.chart.horizontalBar',
    icon: 'iconfont icon-horizontal-bar',
    category: 'horizontalBar'
  },
  {
    key: 'area',
    text: 'tools.chart.area',
    icon: 'iconfont icon-area',
    category: 'area'
  },
  {
    key: 'radar',
    text: 'tools.chart.radar',
    icon: 'iconfont icon-radar',
    category: 'radar'
  },
  {
    key: 'polarArea',
    text: 'tools.chart.polar',
    icon: 'iconfont icon-polar',
    category: 'polarArea'
  },
  {
    key: 'scatter',
    text: 'tools.chart.scatter',
    icon: 'iconfont icon-scatter',
    category: 'scatter'
  },
  {
    key: 'bubble',
    text: 'tools.chart.bubble',
    icon: 'iconfont icon-bubble',
    category: 'bubble'
  }
]

/** a-menu 点击入口（按 key 分发到具体动作） */
function handleMenuClick(info: MenuInfo): void {
  const target = menuItems.find((it) => it.key === info.key)
  if (target) {
    handleChartClick(target.category)
  }
}

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
 * 构造新的 chart 对象
 */
function newChart(category: ChartCategory): ChartConfig {
  return {
    dataset: {
      type: category
    }
  }
}

/**
 * 处理图表点击事件
 */
function handleChartClick(category: ChartCategory): void {
  if (!checkSelection()) return
  const hot = TableManager.get()
  if (!hot) return
  const selected = hot.getSelected() as HandsontableSelectionRange[] | undefined
  if (!selected || selected.length === 0) return
  const [startRow, startCol, endRow, endCol] = selected[0]
  const cellDef = getCell(startRow, startCol) as ReportCell | null
  if (!cellDef) return

  const oldValue = cellDef.value
  const oldCellData = hot.getDataAtCell(startRow, startCol)

  const newCellDef = deepCopy(cellDef) as ReportCell
  hot.setDataAtCell(startRow, startCol, '')
  newCellDef.value = {
    type: 'chart',
    chart: newChart(category)
  } as unknown as ReportCell['value']
  setCell(startRow, startCol, newCellDef)
  hot.render()
  setDirty()
  Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol)

  undoManager.add({
    redo: () => {
      const currentCellDef = getCell(startRow, startCol) as ReportCell | null
      if (!currentCellDef) return
      const redoNewCellDef = deepCopy(currentCellDef) as ReportCell
      hot.setDataAtCell(startRow, startCol, '')
      redoNewCellDef.value = {
        type: 'chart',
        chart: newChart(category)
      } as unknown as ReportCell['value']
      setCell(startRow, startCol, redoNewCellDef)
      hot.render()
      setDirty()
      Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol)
    },
    undo: () => {
      const undoCellDef = getCell(startRow, startCol) as ReportCell | null
      if (!undoCellDef) return
      const undoNewCellDef = deepCopy(undoCellDef) as ReportCell
      undoNewCellDef.value = oldValue
      setCell(startRow, startCol, undoNewCellDef)
      hot.setDataAtCell(startRow, startCol, oldCellData)
      hot.render()
      setDirty()
      Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol)
    }
  })
}

/**
 * 同步工具状态：取选中区第一个单元格
 * （原 Vue2 版本仅做占位，保留同等行为）
 */
function refresh(startRow: number, startCol: number): void {
  void startRow
  void startCol
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
