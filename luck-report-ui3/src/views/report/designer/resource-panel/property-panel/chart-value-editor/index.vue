<template>
  <div class="chart-value-editor" ref="container">

    <a-tabs v-model:active-key="activeTab" type="line">
      <a-tab-pane :key="'dataset'" :tab="t('chart.datasetBind')">
        <!-- 数据集绑定选项卡 -->
        <ChartDataset
          :dataset-config="datasetConfig"
          :fields="currentFields"
          :datasets="currentDatasets"
          @dataset-change="handleDatasetChange"
          @category-property-change="handleCategoryPropertyChange"
          @value-property-change="handleValuePropertyChange"
          @series-type-change="handleSeriesTypeChange"
          @series-property-change="handleSeriesPropertyChange"
          @series-text-change="handleSeriesTextChange"
          @aggregate-change="handleAggregateChange"
        />
      </a-tab-pane>

      <a-tab-pane :key="'option'" :tab="t('chart.option')">
        <!-- 选项选项卡 -->
        <ChartOption
          :chart-config="chartConfig"
          @chart-option-change="onChartOptionChange"
          @data-labels-change="onDataLabelsChange"
        />
      </a-tab-pane>

      <a-tab-pane v-if="showAxis" :key="'axis'" :tab="t('chart.axisConfig')">
        <!-- 轴配置选项卡 -->
        <ChartAxis
          v-show="activeTab === 'axis'"
          v-model:x-axes-config="xAxesConfig"
          v-model:y-axes-config="yAxesConfig"
          v-model:format="datasetConfig.format"
          @axis-change="onAxisChange"
        />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
/**
 * ChartValueEditor 图表值编辑器（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. cellPosition 变化或 isCellUpdate=true → loadChartConfig 回填
 * 2. 通过 ChartDataset / ChartOption / ChartAxis 子组件交互
 * 3. 写回 cellDef.value.chart（公共逻辑由 useChartConfig 接管）
 */
import { ref, reactive, computed } from 'vue'
import { useChartConfig, type ChartDataLabels, type ChartTitle, type ChartLegend, type ChartAnimation, type ChartLayout } from './useChartConfig'
import ChartDataset from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-dataset/index.vue'
import ChartAxis from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-axis/index.vue'
import ChartOption from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-option/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ChartValueEditor' })


const { t } = useI18n()
interface ChartDatasetConfig {
  datasetName: string
  categoryProperty: string
  valueProperty: string
  seriesType: string
  seriesProperty: string
  seriesText: string
  collectType: string
  format: string
}

interface ChartConfig {
  title: ChartTitle
  legend: ChartLegend
  dataLabels: ChartDataLabels
  animation: ChartAnimation
  layout: ChartLayout
}

interface FieldItem {
  name: string
}

interface DatasetItem {
  name: string
}

const props = withDefaults(
  defineProps<{
    id?: string
    showAxis?: boolean
    rowIndex?: number
    colIndex?: number
    row2Index?: number
    col2Index?: number
  }>(),
  {
    id: 'bar',
    showAxis: true,
    rowIndex: 0,
    colIndex: 0,
    row2Index: 0,
    col2Index: 0
  }
)

const {
  context,
  readChartConfig,
  handleChartOptionChange,
  handleDataLabelsChange,
  handleAxisChange,
  updateDatasetConfig,
  bindWatchers
} = useChartConfig({
  rowIndex: () => props.rowIndex,
  colIndex: () => props.colIndex
})

// ====== 状态 ======
const activeTab = ref<string>('dataset')

const datasetConfig = reactive<ChartDatasetConfig>({
  datasetName: '',
  categoryProperty: '',
  valueProperty: '',
  seriesType: 'text',
  seriesProperty: '',
  seriesText: '',
  collectType: '',
  format: ''
})

const chartConfig = reactive<ChartConfig>({
  title: { display: false, position: 'top', text: '' },
  legend: { display: true, position: 'top' },
  dataLabels: { display: false },
  animation: { duration: 1000, easing: 'easeOutQuad' },
  layout: { top: 10, bottom: 10, left: 10, right: 10 }
})

// xaxes/yaxes 仍需本地 ref（ChartAxis 子组件通过 v-model:x-axes-config 双向绑定）
// 因为子组件不能直接访问 reactive 内的整个 xAxesConfig（受限于子组件实现）
// 这里仅用于 v-model 绑定；真实值由 useChartConfig 读写 cellDef
const xAxesConfig = reactive<{ rotation: number; scaleLabel: { display: boolean; labelString: string } }>({
  rotation: 0,
  scaleLabel: { display: false, labelString: '' }
})

const yAxesConfig = reactive<{ rotation: number; scaleLabel: { display: boolean; labelString: string } }>({
  rotation: 0,
  scaleLabel: { display: false, labelString: '' }
})

const cellPosition = computed<string>(() => `${props.rowIndex},${props.colIndex}`)

/** 根据 datasetConfig.datasetName 拿到该数据集的字段列表 */
const currentFields = computed<FieldItem[]>(() => {
  const datasetName = datasetConfig.datasetName
  if (!datasetName) return []
  const datasources = context.value?.reportDef?.datasources || []
  for (const datasource of datasources) {
    const datasets = datasource.datasets || []
    for (const dataset of datasets) {
      if (dataset.name === datasetName) {
        return dataset.fields || []
      }
    }
  }
  return []
})

/** 获取所有可用数据集 */
const currentDatasets = computed<DatasetItem[]>(() => {
  const datasources = context.value?.reportDef?.datasources || []
  const result: DatasetItem[] = []
  for (const datasource of datasources) {
    const datasets = datasource.datasets || []
    for (const dataset of datasets) {
      result.push(dataset)
    }
  }
  return result
})

/** 加载图表配置：从 cellDef.value.chart 回填到本地 state */
const loadChartConfig = (): void => {
  const config = readChartConfig()
  if (!config) {
    return
  }

  // 防止 undefined 把默认的 rotation 覆盖为 undefined
  if (config.xaxes) {
    if (config.xaxes.rotation !== undefined) xAxesConfig.rotation = config.xaxes.rotation
    if (config.xaxes.scaleLabel) {
      xAxesConfig.scaleLabel.display = config.xaxes.scaleLabel.display
      xAxesConfig.scaleLabel.labelString = config.xaxes.scaleLabel.labelString
    }
  }
  if (config.yaxes) {
    if (config.yaxes.rotation !== undefined) yAxesConfig.rotation = config.yaxes.rotation
    if (config.yaxes.scaleLabel) {
      yAxesConfig.scaleLabel.display = config.yaxes.scaleLabel.display
      yAxesConfig.scaleLabel.labelString = config.yaxes.scaleLabel.labelString
    }
  }
  if (config.dataset && typeof config.dataset === 'object') {
    Object.assign(datasetConfig, config.dataset)
  }
  if (Array.isArray(config.options)) {
    for (const option of config.options) {
      switch (option.type) {
        case 'title':
          Object.assign(chartConfig.title, option)
          break
        case 'legend':
          Object.assign(chartConfig.legend, option)
          break
        case 'animation':
          Object.assign(chartConfig.animation, option)
          break
        case 'layout':
          if (option.layout) {
            Object.assign(chartConfig.layout, option.layout as ChartLayout)
          }
          break
      }
    }
  }
  if (Array.isArray(config.plugins)) {
    for (const plugin of config.plugins) {
      if (plugin.name === 'data-labels') {
        chartConfig.dataLabels.display = Boolean(plugin.display)
      }
    }
  }
}

bindWatchers(cellPosition, loadChartConfig)

/** 通用：写入 dataset 字段（避免 7 个 handleXxxChange 重复） */
const updateDatasetField = (
  field: keyof ChartDatasetConfig,
  value: string
): void => {
  datasetConfig[field] = value
  updateDatasetConfig({ [field]: value })
}

const handleDatasetChange = (value: string): void => updateDatasetField('datasetName', value)
const handleCategoryPropertyChange = (value: string): void => updateDatasetField('categoryProperty', value)
const handleValuePropertyChange = (value: string): void => updateDatasetField('valueProperty', value)
const handleSeriesTypeChange = (value: string): void => updateDatasetField('seriesType', value)
const handleSeriesPropertyChange = (value: string): void => updateDatasetField('seriesProperty', value)
const handleSeriesTextChange = (value: string): void => updateDatasetField('seriesText', value)
const handleAggregateChange = (value: string): void => updateDatasetField('collectType', value)

/** chart options 变更 */
const onChartOptionChange = (payload: { type: string; option: Record<string, unknown> }): void => {
  handleChartOptionChange(payload)
  // 本地 state 同步
  switch (payload.type) {
    case 'title':
      Object.assign(chartConfig.title, payload.option)
      break
    case 'legend':
      Object.assign(chartConfig.legend, payload.option)
      break
    case 'animation':
      Object.assign(chartConfig.animation, payload.option)
      break
    case 'layout':
      if (payload.option.layout) {
        Object.assign(chartConfig.layout, payload.option.layout as ChartLayout)
      }
      break
  }
}

/** data-labels 显隐 */
const onDataLabelsChange = (dataLabels: ChartDataLabels): void => {
  handleDataLabelsChange(dataLabels)
  chartConfig.dataLabels.display = dataLabels.display
}

/** x/y 轴变化 */
const onAxisChange = (payload: { type: string; value: unknown }): void => {
  handleAxisChange(payload)
  switch (payload.type) {
    case 'x-rotation':
      if (typeof payload.value === 'number') xAxesConfig.rotation = payload.value
      break
    case 'x-title-display':
      xAxesConfig.scaleLabel.display = Boolean(payload.value)
      break
    case 'x-title-text':
      xAxesConfig.scaleLabel.labelString = String(payload.value ?? '')
      break
    case 'y-rotation':
      if (typeof payload.value === 'number') yAxesConfig.rotation = payload.value
      break
    case 'y-title-display':
      yAxesConfig.scaleLabel.display = Boolean(payload.value)
      break
    case 'y-title-text':
      yAxesConfig.scaleLabel.labelString = String(payload.value ?? '')
      break
    case 'format':
      datasetConfig.format = String(payload.value ?? '')
      break
  }
}
</script>

<style scoped>
.chart-value-editor {
  width: 100%;
}
</style>
