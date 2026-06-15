<template>
  <div class="scatter-chart-value-editor" ref="container">
    <!-- 选项卡导航 -->
    <a-tabs v-model:active-key="activeTab" type="line">
      <a-tab-pane :key="'dataset'" :tab="t('chart.datasetBind')">
        <!-- 数据集绑定选项卡 -->
        <ChartDataConfig
          ref="datasetTab"
          :dataset-name="datasetValues.datasetName"
          :category-property="datasetValues.categoryProperty"
          :x-property="datasetValues.xProperty"
          :y-property="datasetValues.yProperty"
          :datasets="currentDatasets"
          :fields="currentFields"
          :show-r-property="false"
          @update-dataset="handleDatasetUpdate"
        />
      </a-tab-pane>

      <a-tab-pane :key="'option'" :tab="t('chart.option')">
        <ChartOption
          :chart-config="chartConfig"
          :show-data-label="true"
          @chart-option-change="onChartOptionChange"
          @data-labels-change="onDataLabelsChange"
        />
      </a-tab-pane>

      <a-tab-pane :key="'axis'" :tab="t('chart.axisConfig')">
        <ChartAxis
          v-model:x-axes-config="xAxesConfig"
          v-model:y-axes-config="yAxesConfig"
          v-model:format="xAxisFormat"
          @axis-change="onAxisChange"
        />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
/**
 * ScatterChartValueEditor 散点图值编辑器（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. cellPosition 变化或 isCellUpdate=true → loadChartConfig 回填
 * 2. 通过 ChartDataConfig / ChartOption / ChartAxis 子组件交互
 * 3. 写回 cellDef.value.chart（公共逻辑由 useChartConfig 接管）
 */
import { ref, reactive, computed } from 'vue'
import { useChartConfig, type ChartDataLabels, type ChartTitle, type ChartLegend, type ChartAnimation } from '../chart-value-editor/useChartConfig'
import ChartAxis from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-axis/index.vue'
import ChartOption from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-option/index.vue'
import ChartDataConfig from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-dataset-bob/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ScatterChartValueEditor' })


const { t } = useI18n()
interface DatasetValues {
  datasetName: string
  categoryProperty: string
  xProperty: string
  yProperty: string
}

interface ChartConfig {
  title: ChartTitle
  legend: ChartLegend
  animation: ChartAnimation
  dataLabels: ChartDataLabels
}

interface ScaleLabel {
  display: boolean
  labelString: string
}

interface AxesConfig {
  rotation: number
  scaleLabel: ScaleLabel
}

interface FieldItem {
  name: string
}

interface DatasetItem {
  name: string
}

const props = withDefaults(
  defineProps<{
    rowIndex?: number
    colIndex?: number
    row2Index?: number
    col2Index?: number
  }>(),
  {
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

const datasetValues = reactive<DatasetValues>({
  datasetName: '',
  categoryProperty: '',
  xProperty: '',
  yProperty: ''
})

const chartConfig = reactive<ChartConfig>({
  title: { display: false, position: 'top', text: '' },
  legend: { display: false, position: 'top' },
  animation: { duration: 1000, easing: 'easeOutQuart' },
  dataLabels: { display: false }
})

const xAxesConfig = reactive<AxesConfig>({
  rotation: 0,
  scaleLabel: { display: false, labelString: '' }
})

const yAxesConfig = reactive<AxesConfig>({
  rotation: 0,
  scaleLabel: { display: false, labelString: '' }
})

const xAxisFormat = ref<string>('')

const cellPosition = computed<string>(() => `${props.rowIndex},${props.colIndex}`)

/** 获取所有可用数据集列表 */
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

/** 根据当前选中的数据集获取对应字段列表 */
const currentFields = computed<FieldItem[]>(() => {
  const datasetName = datasetValues.datasetName
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

/** 加载图表配置 */
const loadChartConfig = (): void => {
  const config = readChartConfig()
  if (!config) return

  // 加载数据集配置
  const dataset = (config.dataset || {}) as Partial<DatasetValues & { format: string }>
  datasetValues.datasetName = dataset.datasetName ?? ''
  datasetValues.categoryProperty = dataset.categoryProperty ?? ''
  datasetValues.xProperty = dataset.xProperty ?? ''
  datasetValues.yProperty = dataset.yProperty ?? ''
  xAxisFormat.value = dataset.format ?? ''

  // 加载X/Y轴
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

  // 加载图表选项
  for (const option of config.options) {
    switch (option.type) {
      case 'animation':
        chartConfig.animation.duration = (option.duration as number) ?? 1000
        chartConfig.animation.easing = (option.easing as string) ?? 'easeOutQuart'
        break
      case 'title':
        chartConfig.title.display = Boolean(option.display)
        chartConfig.title.position = (option.position as string) ?? 'top'
        chartConfig.title.text = (option.text as string) ?? ''
        break
      case 'legend':
        chartConfig.legend.display = Boolean(option.display)
        chartConfig.legend.position = (option.position as string) ?? 'top'
        break
    }
  }

  // 加载插件配置
  for (const plugin of config.plugins) {
    if (plugin.name === 'data-labels') {
      chartConfig.dataLabels.display = Boolean(plugin.display)
    }
  }
}

bindWatchers(cellPosition, loadChartConfig)

/** 数据集配置更新 */
const handleDatasetUpdate = (config: Record<string, string>): void => {
  Object.assign(datasetValues, config)
  updateDatasetConfig(config)
}

/** chart options 变更 */
const onChartOptionChange = (payload: { type: string; option: Record<string, unknown> }): void => {
  handleChartOptionChange(payload)
  switch (payload.type) {
    case 'animation':
      Object.assign(chartConfig.animation, payload.option)
      break
    case 'title':
      Object.assign(chartConfig.title, payload.option)
      break
    case 'legend':
      Object.assign(chartConfig.legend, payload.option)
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
      xAxisFormat.value = String(payload.value ?? '')
      break
  }
}
</script>

<style scoped>
.scatter-chart-value-editor {
  width: 100%;
}
</style>
