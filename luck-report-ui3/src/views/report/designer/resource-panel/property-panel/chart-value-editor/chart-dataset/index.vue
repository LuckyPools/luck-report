<template>
  <div class="chart-dataset">
    <a-form :label-col="{ style: { width: '100px' } }" :colon="false">
      <a-form-item class="property-label" :label="t('chart.dataset')">
        <a-select
          v-model:value="localDatasetConfig.datasetName"
          style="width: 250px"
          :options="datasetOptions"
          @change="handleDatasetChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('chart.categoryProperty')">
        <a-select
          v-model:value="localDatasetConfig.categoryProperty"
          style="width: 250px"
          :options="fieldOptions"
          :allow-clear="true"
          @change="handleCategoryPropertyChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('chart.valueProperty')">
        <a-select
          v-model:value="localDatasetConfig.valueProperty"
          style="width: 250px"
          :options="fieldOptions"
          :allow-clear="true"
          @change="handleValuePropertyChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('chart.seriesProperty')">
        <a-radio-group v-model:value="localDatasetConfig.seriesType" @change="handleSeriesTypeChange">
          <a-radio
            v-for="option in seriesTypeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        class="property-label"
        v-show="localDatasetConfig.seriesType === 'property'"
        :label="t('chart.prop')"
      >
        <a-select
          v-model:value="localDatasetConfig.seriesProperty"
          style="width: 250px"
          :options="fieldOptions"
          :allow-clear="true"
          @change="handleSeriesPropertyChange"
        />
      </a-form-item>

      <a-form-item
        class="property-label"
        v-show="localDatasetConfig.seriesType === 'text'"
        :label="t('chart.staticValue')"
      >
        <a-input
          style="width: 250px;"
          v-model:value="localDatasetConfig.seriesText"
          @change="handleSeriesTextChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('chart.aggregate')">
        <a-select
          v-model:value="localDatasetConfig.collectType"
          style="width: 250px"
          :options="aggregateOptions"
          :allow-clear="true"
          @change="handleAggregateChange"
        />
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
/**
 * ChartDataset 图表数据集绑定子组件（vue3 + TS + ant-design-vue）
 */
import { ref, computed, watch } from 'vue'
import { setDirty } from '@/utils/table'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ChartDataset' })


const { t } = useI18n()
interface DatasetConfig {
  datasetName: string
  categoryProperty: string
  valueProperty: string
  seriesType: string
  seriesProperty: string
  seriesText: string
  collectType: string
  format: string
}

interface SelectOption {
  value: string
  label: string
}

interface FieldItem {
  name: string
}

interface DatasetItem {
  name: string
}

const props = withDefaults(
  defineProps<{
    datasetConfig: DatasetConfig
    fields?: FieldItem[]
    datasets?: DatasetItem[]
  }>(),
  {
    fields: () => [],
    datasets: () => []
  }
)

const emit = defineEmits<{
  (e: 'dataset-change', value: string): void
  (e: 'category-property-change', value: string): void
  (e: 'value-property-change', value: string): void
  (e: 'series-type-change', value: string): void
  (e: 'series-property-change', value: string): void
  (e: 'series-text-change', value: string): void
  (e: 'aggregate-change', value: string): void
}>()

// ====== 状态 ======
const localDatasetConfig = ref<DatasetConfig>({
  datasetName: '',
  categoryProperty: '',
  valueProperty: '',
  seriesType: 'text',
  seriesProperty: '',
  seriesText: '',
  collectType: '',
  format: ''
})

// ====== 选项 ======
const datasetOptions = computed<SelectOption[]>(() =>
  props.datasets.map((dataset) => ({
    value: dataset.name,
    label: dataset.name
  }))
)

const fieldOptions = computed<SelectOption[]>(() =>
  props.fields.map((field) => ({
    value: field.name,
    label: field.name
  }))
)

const aggregateOptions = computed<SelectOption[]>(() => [
  { value: 'select', label: t('chart.select') },
  { value: 'sum', label: t('chart.sum') },
  { value: 'count', label: t('chart.count') },
  { value: 'max', label: t('chart.max') },
  { value: 'min', label: t('chart.min') },
  { value: 'avg', label: t('chart.avg') }
])

const seriesTypeOptions = computed<SelectOption[]>(() => [
  { value: 'property', label: t('chart.property') },
  { value: 'text', label: t('chart.static') }
])

watch(
  () => props.datasetConfig,
  (newVal) => {
    if (newVal) {
      localDatasetConfig.value = { ...localDatasetConfig.value, ...newVal }
    }
  },
  { deep: true, immediate: true }
)

const handleDatasetChange = (value: string): void => {
  emit('dataset-change', value)
  setDirty()
}

const handleCategoryPropertyChange = (value: string): void => {
  emit('category-property-change', value)
  setDirty()
}

const handleValuePropertyChange = (value: string): void => {
  emit('value-property-change', value)
  setDirty()
}

const handleSeriesTypeChange = (value: string): void => {
  emit('series-type-change', value)
  setDirty()
}

const handleSeriesPropertyChange = (value: string): void => {
  emit('series-property-change', value)
  setDirty()
}

const handleSeriesTextChange = (): void => {
  emit('series-text-change', localDatasetConfig.value.seriesText)
  setDirty()
}

const handleAggregateChange = (value: string): void => {
  emit('aggregate-change', value)
  setDirty()
}
</script>

<style scoped>
.chart-dataset {
  margin-top: 10px;
}
</style>
