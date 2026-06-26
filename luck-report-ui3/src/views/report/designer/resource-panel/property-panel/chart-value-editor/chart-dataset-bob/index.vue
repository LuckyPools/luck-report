<template>
  <div class="chart-dataset-bob">
    <a-form :label-col="{ style: { width: '100px' } }" >
      <a-form-item class="property-label" :label="t('chart.dataset')">
        <a-select
          v-model:value="localDatasetName"
          :options="datasetOptions"
          @change="handleDatasetChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('chart.categoryProperty')">
        <a-select
          v-model:value="localCategoryProperty"
          :options="fieldOptions"
          :allow-clear="true"
          @change="handleCategoryPropertyChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('chart.xProperty')">
        <a-select
          v-model:value="localXProperty"
          :options="fieldOptions"
          @change="handleXPropertyChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('chart.yProperty')">
        <a-select
          v-model:value="localYProperty"
          :options="fieldOptions"
          @change="handleYPropertyChange"
        />
      </a-form-item>

      <a-form-item v-if="showRProperty" class="property-label" :label="t('chart.rProperty')">
        <a-select
          v-model:value="localRProperty"
          :options="fieldOptions"
          @change="handleRPropertyChange"
        />
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
/**
 * ChartDataConfig 图表数据集配置（用于气泡/散点图，vue3 + TS + ant-design-vue）
 */
import { ref, computed, watch } from 'vue'
import { setDirty } from '@/utils/table'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ChartDataConfig' })


const { t } = useI18n()
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
    datasetName?: string
    categoryProperty?: string
    xProperty?: string
    yProperty?: string
    rProperty?: string
    showRProperty?: boolean
    datasets?: DatasetItem[]
    fields?: FieldItem[]
  }>(),
  {
    datasetName: '',
    categoryProperty: '',
    xProperty: '',
    yProperty: '',
    rProperty: '',
    showRProperty: true,
    datasets: () => [],
    fields: () => []
  }
)

const emit = defineEmits<{
  (e: 'update-dataset', payload: Record<string, string>): void
}>()

// ====== 状态 ======
const localDatasetName = ref<string>('')
const localCategoryProperty = ref<string>('')
const localXProperty = ref<string>('')
const localYProperty = ref<string>('')
const localRProperty = ref<string>('')

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

watch(
  () => props.datasetName,
  (newVal) => {
    localDatasetName.value = newVal || ''
  },
  { immediate: true }
)

watch(
  () => props.categoryProperty,
  (newVal) => {
    localCategoryProperty.value = newVal || ''
  },
  { immediate: true }
)

watch(
  () => props.xProperty,
  (newVal) => {
    localXProperty.value = newVal || ''
  },
  { immediate: true }
)

watch(
  () => props.yProperty,
  (newVal) => {
    localYProperty.value = newVal || ''
  },
  { immediate: true }
)

watch(
  () => props.rProperty,
  (newVal) => {
    localRProperty.value = newVal || ''
  },
  { immediate: true }
)

// 处理数据集变化
const handleDatasetChange = (): void => {
  // 清空属性选择
  localCategoryProperty.value = ''
  localXProperty.value = ''
  localYProperty.value = ''
  localRProperty.value = ''

  // 通知父组件更新配置
  emit('update-dataset', {
    datasetName: localDatasetName.value,
    categoryProperty: '',
    xProperty: '',
    yProperty: '',
    rProperty: ''
  })

  setDirty()
}

// 处理类别属性变化
const handleCategoryPropertyChange = (): void => {
  emit('update-dataset', { categoryProperty: localCategoryProperty.value })
  setDirty()
}

// 处理X属性变化
const handleXPropertyChange = (): void => {
  emit('update-dataset', { xProperty: localXProperty.value })
  setDirty()
}

// 处理Y属性变化
const handleYPropertyChange = (): void => {
  emit('update-dataset', { yProperty: localYProperty.value })
  setDirty()
}

// 处理R属性变化
const handleRPropertyChange = (): void => {
  emit('update-dataset', { rProperty: localRProperty.value })
  setDirty()
}
</script>

<style scoped>
.chart-dataset-bob {
  margin-top: 10px;
}
</style>
