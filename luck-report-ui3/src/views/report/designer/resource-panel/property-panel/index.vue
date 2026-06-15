<template>
  <div class="property-panel">
    <!-- 单元格值编辑器组件 -->
    <cell-value-editor
      :show-parent-group="showParentGroup"
      :show-renderer-group="showRendererGroup"
      :show-link-group="showLinkGroup"
      :show-type-group="showTypeGroup"
      :row-index="rowIndex"
      :col-index="colIndex"
      @select-renderer="handleSelectRenderer"
      @cell-type-change="handleCellTypeChange"
    />

    <!-- 表达式值编辑器Vue组件 -->
    <expression-value-editor
      ref="expressionValueEditor"
      v-if="expressionValueEditorVisible"
      :row-index="rowIndex"
      :col-index="colIndex"
      :row2-index="row2Index"
      :col2-index="col2Index"
    />

    <!-- 简单值编辑器Vue组件 -->
    <simple-value-editor
      ref="simpleValueEditor"
      v-if="simpleValueEditorVisible"
      :row-index="rowIndex"
      :col-index="colIndex"
      :row2-index="row2Index"
      :col2-index="col2Index"
    />

    <!-- 数据集值编辑器Vue组件 -->
    <dataset-value-editor
      ref="datasetValueEditor"
      v-if="datasetValueEditorVisible"
      :row-index="rowIndex"
      :col-index="colIndex"
      :row2-index="row2Index"
      :col2-index="col2Index"
    />

    <!-- 图片值编辑器Vue组件 -->
    <image-value-editor
      ref="imageValueEditor"
      v-if="imageValueEditorVisible"
      :row-index="rowIndex"
      :col-index="colIndex"
      :row2-index="row2Index"
      :col2-index="col2Index"
    />

    <!-- 斜线值编辑器Vue组件 -->
    <slash-value-editor
      ref="slashValueEditor"
      v-if="slashValueEditorVisible"
      :row-index="rowIndex"
      :col-index="colIndex"
      :row2-index="row2Index"
      :col2-index="col2Index"
    />

    <!-- 二维码/条形码值编辑器Vue组件 -->
    <zxing-value-editor
      ref="zxingValueEditor"
      v-if="zxingValueEditorVisible"
      :row-index="rowIndex"
      :col-index="colIndex"
      :row2-index="row2Index"
      :col2-index="col2Index"
    />

    <!-- 图表编辑器容器 -->
    <div ref="chartEditorContainer">
      <template v-for="(chartType, index) in chartEditorTypes" :key="index">
        <chart-value-editor
          ref="chartEditor"
          v-if="currentChartType === chartType.id"
          :id="chartType.id"
          :show-axis="chartType.showAxis"
          :row-index="rowIndex"
          :col-index="colIndex"
          :row2-index="row2Index"
          :col2-index="col2Index"
        />
      </template>
      <bubble-chart-value-editor
        ref="bubbleChartEditor"
        v-if="bubbleChartValueEditorVisible"
        :row-index="rowIndex"
        :col-index="colIndex"
        :row2-index="row2Index"
        :col2-index="col2Index"
      />
      <scatter-chart-value-editor
        ref="scatterChartEditor"
        v-if="scatterChartValueEditorVisible"
        :row-index="rowIndex"
        :col-index="colIndex"
        :row2-index="row2Index"
        :col2-index="col2Index"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
/**
 * PropertyPanel 属性面板根容器（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. refreshTrigger 变化 → refresh()：根据 cellDef.value.type 决定显示哪个值编辑器
 * 2. cell-value-editor 触发 cell-type-change → handleCellTypeChange：初始化对应类型的 value
 * 3. 通过 getContext/ContextUpdateProperty/... 等 store action 改写 cellsMap
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - Vuex store.getters['report/getContext'] → useReportStore().getContext
 * - this.editorMap.get(type).show(...) 仍保留兼容旧版编辑器调用
 * - store from '@/store' → useReportStore from '@/store/modules/report'
 */
import { ref, watch } from 'vue'
import { setDirty } from '@/utils/table'
import { deepCopy } from '@/utils/comnon'
import { getCell, setCell } from '@/utils/contextActions'
import CrossTabWidget from '@/views/report/designer/edit-table/cross-tab-widget/class'
import TableManager from '@/views/report/designer/edit-table/manager'
import { useReportStore } from '@/store/modules/report'
import ExpressionValueEditor from './expression-value-editor/index.vue'
import SimpleValueEditor from './simple-value-editor/index.vue'
import DatasetValueEditor from './dataset-value-editor/index.vue'
import ImageValueEditor from './image-value-editor/index.vue'
import SlashValueEditor from './slash-value-editor/index.vue'
import ZxingValueEditor from './zxing-value-editor/index.vue'
import ChartValueEditor from './chart-value-editor/index.vue'
import BubbleChartValueEditor from './bubble-chart-value-editor/index.vue'
import ScatterChartValueEditor from './scatter-chart-value-editor/index.vue'
import CellValueEditor from './cell-value-editor/index.vue'

defineOptions({ name: 'PropertyPanel' })

/** 图表类型配置 */
interface ChartType {
  id: string
  showAxis: boolean
}

/** 编辑器映射 */
interface EditorInstance {
  show?: (rowIndex: number, colIndex: number, row2Index: number, col2Index: number) => void
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    rowIndex?: number
    colIndex?: number
    row2Index?: number
    col2Index?: number
    refreshTrigger?: number
  }>(),
  {
    rowIndex: 0,
    colIndex: 0,
    row2Index: 0,
    col2Index: 0,
    refreshTrigger: 0
  }
)

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const reportStore = useReportStore()

// ====== 状态 ======
// 显示控制
const showParentGroup = ref<boolean>(false)
const showRendererGroup = ref<boolean>(false)
const showLinkGroup = ref<boolean>(false)
const showTypeGroup = ref<boolean>(false)

const initialized = ref<boolean>(false)

// 编辑器映射
const editorMap = ref<Map<string, EditorInstance>>(new Map())
const chartEditorMap = ref<Map<string, EditorInstance>>(new Map())

// 图表编辑器类型配置
const chartEditorTypes = ref<ChartType[]>([
  { id: 'bar', showAxis: true },
  { id: 'line', showAxis: true },
  { id: 'horbar', showAxis: true },
  { id: 'area', showAxis: true },
  { id: 'radar', showAxis: false },
  { id: 'polar', showAxis: false },
  { id: 'doughnut', showAxis: false },
  { id: 'pie', showAxis: false }
])

// 当前显示的图表类型
const currentChartType = ref<string>('')

// 编辑器可见性控制
const expressionValueEditorVisible = ref<boolean>(false)
const simpleValueEditorVisible = ref<boolean>(false)
const datasetValueEditorVisible = ref<boolean>(false)
const imageValueEditorVisible = ref<boolean>(false)
const slashValueEditorVisible = ref<boolean>(false)
const zxingValueEditorVisible = ref<boolean>(false)
const bubbleChartValueEditorVisible = ref<boolean>(false)
const scatterChartValueEditorVisible = ref<boolean>(false)

watch(
  () => props.refreshTrigger,
  () => {
    refresh()
  }
)

const hideAllEditors = (): void => {
  expressionValueEditorVisible.value = false
  simpleValueEditorVisible.value = false
  datasetValueEditorVisible.value = false
  imageValueEditorVisible.value = false
  slashValueEditorVisible.value = false
  zxingValueEditorVisible.value = false
  bubbleChartValueEditorVisible.value = false
  scatterChartValueEditorVisible.value = false
  currentChartType.value = ''
}

/**
 * 刷新属性面板
 */
const refresh = (): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex) as Record<string, any> | null
  if (!cellDef) {
    return
  }

  // 显示所有组
  showParentGroup.value = true
  showTypeGroup.value = true
  showLinkGroup.value = true
  // showRendererGroup.value = true // 暂时隐藏

  initialized.value = true

  // 隐藏Vue组件编辑器
  currentChartType.value = ''
  expressionValueEditorVisible.value = false
  simpleValueEditorVisible.value = false
  datasetValueEditorVisible.value = false
  imageValueEditorVisible.value = false
  slashValueEditorVisible.value = false
  zxingValueEditorVisible.value = false
  bubbleChartValueEditorVisible.value = false
  scatterChartValueEditorVisible.value = false

  // 加载单元格类型
  const type = cellDef.value?.type || 'simple'
  // 显示对应编辑器
  if (type === 'chart') {
    const chartType = cellDef.value.chart?.dataset?.type

    // 处理特殊图表类型映射
    let actualChartType = chartType
    if (chartType === 'horizontalBar') {
      actualChartType = 'horbar'
    } else if (chartType === 'polarArea') {
      actualChartType = 'polar'
    }

    // 检查是否是散点图或气泡图
    if (chartType === 'scatter') {
      // 使用Vue组件显示散点图编辑器
      currentChartType.value = 'scatter'
      scatterChartValueEditorVisible.value = true
    } else if (chartType === 'bubble') {
      // 使用Vue组件显示气泡图编辑器
      currentChartType.value = 'bubble'
      bubbleChartValueEditorVisible.value = true
    } else {
      // 使用Vue组件显示图表编辑器
      currentChartType.value = actualChartType
    }
  } else {
    currentChartType.value = ''

    // 处理简单类型编辑器
    if (type === 'simple') {
      simpleValueEditorVisible.value = true
    } else if (type === 'expression') {
      expressionValueEditorVisible.value = true
    } else if (type === 'dataset') {
      datasetValueEditorVisible.value = true
    } else if (type === 'image') {
      imageValueEditorVisible.value = true
    } else if (type === 'slash') {
      slashValueEditorVisible.value = true
    } else if (type === 'zxing') {
      zxingValueEditorVisible.value = true
    } else {
      // 其他类型的编辑器
      const editor = editorMap.value.get(type)
      if (editor && editor.show) {
        editor.show(props.rowIndex, props.colIndex, props.row2Index, props.col2Index)
      }
    }
  }

  initialized.value = false
}

/**
 * 刷新属性（不切换编辑器，仅判断 type 是否变化）
 */
const refreshProperty = (): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex) as Record<string, any> | null
  if (!cellDef) {
    return
  }
  const oldCellDef = getCell(props.rowIndex, props.colIndex) as Record<string, any> | null
  const typeChanged = (cellDef.value?.type) !== (oldCellDef?.value?.type)
  const crossTabWidgetChanged = !!cellDef.crossTabWidget !== !!(oldCellDef && oldCellDef.crossTabWidget)

  if (typeChanged || crossTabWidgetChanged) {
    emit('refresh')
  }
}

const handleSelectRenderer = (): void => {
  // TODO: 实现选择渲染器的逻辑
}

const handleCellTypeChange = (value: string): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex) as Record<string, any> | null
  if (!cellDef) {
    return
  }
  const newCellDef = deepCopy(cellDef)
  const hot = TableManager.get() as any

  if (value === 'simple') {
    if (newCellDef.value?.type !== 'simple') {
      newCellDef.value = { type: 'simple' }
    }
    newCellDef.expand = 'None'
    setCell(props.rowIndex, props.colIndex, newCellDef)
    hideAllEditors()
    simpleValueEditorVisible.value = true
  } else if (value === 'expression') {
    if (newCellDef.value?.type !== 'expression') {
      newCellDef.value = { type: 'expression', value: '' }
    }
    newCellDef.expand = 'None'
    setCell(props.rowIndex, props.colIndex, newCellDef)
    hideAllEditors()
    expressionValueEditorVisible.value = true
  } else if (value === 'dataset') {
    if (newCellDef.value?.type !== 'dataset') {
      newCellDef.value = { type: 'dataset', datasetName: '', property: '', aggregate: '', conditions: [], order: 'none' }
    }
    newCellDef.expand = 'Down'
    setCell(props.rowIndex, props.colIndex, newCellDef)
    hideAllEditors()
    datasetValueEditorVisible.value = true
  } else if (value === 'image') {
    if (newCellDef.value?.type !== 'image') {
      newCellDef.value = { type: 'image', source: 'text' }
    }
    newCellDef.expand = 'None'
    setCell(props.rowIndex, props.colIndex, newCellDef)
    hideAllEditors()
    imageValueEditorVisible.value = true
  } else if (value === 'qrcode') {
    if (newCellDef.value?.type !== 'zxing' || newCellDef.value?.category !== 'qrcode') {
      const width = buildWidth(props.colIndex, hot.getCell(props.rowIndex, props.colIndex).colSpan, hot)
      const height = buildHeight(props.rowIndex, hot.getCell(props.rowIndex, props.colIndex).rowSpan, hot)
      newCellDef.value = { width, height, type: 'zxing', source: 'text', category: 'qrcode', data: '' }
      newCellDef.expand = 'None'
    }
    setCell(props.rowIndex, props.colIndex, newCellDef)
    hideAllEditors()
    zxingValueEditorVisible.value = true
  } else if (value === 'barcode') {
    if (newCellDef.value?.type !== 'zxing' || newCellDef.value?.category !== 'barcode') {
      const width = buildWidth(props.colIndex, hot.getCell(props.rowIndex, props.colIndex).colSpan, hot)
      const height = buildHeight(props.rowIndex, hot.getCell(props.rowIndex, props.colIndex).rowSpan, hot)
      newCellDef.value = { width, height, type: 'zxing', source: 'text', category: 'barcode', data: '', format: 'CODE_128' }
      newCellDef.expand = 'None'
    }
    setCell(props.rowIndex, props.colIndex, newCellDef)
    hideAllEditors()
    zxingValueEditorVisible.value = true
  } else if (value === 'slash') {
    const ctx = reportStore.getContext as any
    newCellDef.crossTabWidget = new CrossTabWidget(ctx, props.rowIndex, props.colIndex)
    newCellDef.expand = 'None'
    setCell(props.rowIndex, props.colIndex, newCellDef)
    hideAllEditors()
    slashValueEditorVisible.value = true
  } else if (value === 'chart') {
    const width = buildWidth(props.colIndex, hot.getCell(props.rowIndex, props.colIndex).colSpan, hot)
    const height = buildHeight(props.rowIndex, hot.getCell(props.rowIndex, props.colIndex).rowSpan, hot)
    newCellDef.value = {
      width,
      height,
      type: 'chart',
      chart: {
        dataset: {
          type: 'pie'
        }
      }
    }
    setCell(props.rowIndex, props.colIndex, newCellDef)
    hideAllEditors()
  }

  if (hot) {
    hot.setDataAtCell(props.rowIndex, props.colIndex, '')
  }
  setDirty()
}

/**
 * 构建宽度
 */
const buildWidth = (colIndex: number, colspan: number, hot: any): number => {
  let width = hot.getColWidth(colIndex) - 3
  if (!colspan || colspan < 2) {
    return width
  }
  const start = colIndex + 1
  const end = colIndex + colspan
  for (let i = start; i < end; i++) {
    width += hot.getColWidth(i)
  }
  return width
}

/**
 * 构建高度
 */
const buildHeight = (rowIndex: number, rowspan: number, hot: any): number => {
  let height = hot.getRowHeight(rowIndex) - 3
  if (!rowspan || rowspan < 2) {
    return height
  }
  const start = rowIndex + 1
  const end = rowIndex + rowspan
  for (let i = start; i < end; i++) {
    height += hot.getRowHeight(i)
  }
  return height
}
</script>

<style scoped>
.property-panel {
  margin: 8px
}
</style>
