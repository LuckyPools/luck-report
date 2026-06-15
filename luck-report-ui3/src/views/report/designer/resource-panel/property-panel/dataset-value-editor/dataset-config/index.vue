<template>
  <div>
    <a-form :label-col="{ style: { width: '100px' } }" :colon="false">
      <a-form-item class="property-label" :label="t('property.dataset.dataset')" style="margin-top: 10px">
        <a-select
            v-model:value="localDataset"
            style="width: 250px"
            :options="datasetOptions"
            :allow-clear="true"
            @change="handleDatasetChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.dataset.property')">
        <a-select
            v-model:value="localProperty"
            style="width: 250px"
            :options="propertyOptions"
            :allow-clear="true"
            @change="handlePropertyChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.dataset.aggregateType')">
        <a-select
            v-model:value="localAggregate"
            style="width: 250px"
            :options="aggregateOptions"
            :allow-clear="true"
            @change="handleAggregateChange"
        />
      </a-form-item>

      <a-form-item class="property-label" v-show="localAggregate === 'customgroup'">
        <a-button
            type="primary"
            @click="handleCustomGroupConfig"
        >
          {{ t('property.dataset.configCustomGroup') }}
        </a-button>
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.dataset.sortType')" v-show="localShowSortOptions">
        <a-radio-group v-model:value="localSort" @change="handleSortChange">
          <a-radio
              v-for="option in sortOptions"
              :key="option.value"
              :value="option.value"
          >
            {{ option.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.dataset.expand')" v-show="localShowExpandOptions">
        <a-radio-group v-model:value="localExpand" @change="handleExpandChange">
          <a-radio
              v-for="option in expandOptions"
              :key="option.value"
              :value="option.value"
          >
            {{ option.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.dataset.lineHeight')">
        <a-input-number
            :placeholder="t('property.dataset.lineHeightTip')"
            v-model:value="localLineHeight"
            :min="1"
            @change="handleLineHeightChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.base.newLineCompute')">
        <a-radio-group v-model:value="localWrapCompute" @change="handleWrapComputeChange">
          <a-radio
              v-for="option in wrapComputeOptions"
              :key="option.value"
              :value="option.value"
          >
            {{ option.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.base.format')">
        <a-auto-complete
            v-model:value="localFormat"
            :options="suggestionOptions"
            :filter-option="true"
            :placeholder="t('property.base.formatTip')"
            style="width: 250px"
            @blur="handleFormatChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.base.fillBlank')">
        <a-radio-group v-model:value="localFillBlankRows" @change="handleFillBlankRowsChange">
          <a-radio
              v-for="option in fillBlankRowsOptions"
              :key="option.value"
              :value="option.value"
          >
            {{ option.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.base.rowTimes')" v-show="localFillBlankRows === 'default'">
        <a-input-number
            v-model:value="localMultiple"
            :min="1"
            @change="handleMultipleChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.base.conditionProp')">
        <a-button
            type="primary"
            @click="handleConditionPropertyConfig"
        >
          <template #icon><i class="iconfont icon-filter"></i></template>
          {{ t('property.base.configCondition') }}
        </a-button>
      </a-form-item>
    </a-form>

    <!-- 自定义分组对话框组件 -->
    <CustomGroupDialog
      v-model:visible="customGroupDialogVisible"
      :group-items="(groupItems as GroupItem[])"
      :fields="fields"
      @save="handleCustomGroupSave"
    />

    <!-- 属性条件对话框组件 -->
    <PropertyConditionDialog
        v-model:visible="propertyConditionDialogVisible"
        :fields="fields"
        :condition-groups="conditionGroups"
        @saveAfter="handlePropertyConditionSave"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * DatasetConfig 数据集配置面板（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. props 同步到 localDataset/localProperty/... （watch）
 * 2. 用户切换 → 触发 update:xxx + xxx-change 事件
 * 3. 内部状态变化：aggregate 切换时联动 showSortOptions/showExpandOptions/showMappingOptions
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - u-form/u-form-item/u-select/u-option/u-radio-group/u-radio/u-input-number/u-button → a-form/a-form-item/a-select/a-radio-group/a-radio/a-input-number/a-button
 * - vue-simple-suggest → a-auto-complete
 * - a-select 使用 :options 传值
 * - a-radio 使用 v-model:value + :value 传值
 * - Vuex mapGetters → useReportStore (Pinia)
 */
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { setDirty } from '@/utils/table'
import { showAlert } from '@/utils/comnon'
import PropertyConditionDialog from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/index.vue'
import CustomGroupDialog, { type GroupItem } from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/dataset-config/custom-group-dialog/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'DatasetConfig' })


const { t } = useI18n()
/** select / radio 选项 */
interface SelectOption {
  value: string
  label: string
}

/** 字段元数据 */
interface Field {
  name: string
  [key: string]: unknown
}

/** 条件组结构 */
interface ConditionGroup {
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    datasets?: { name: string; [key: string]: unknown }[]
    fields?: Field[]
    groupItems?: GroupItem[]
    dataset?: string
    property?: string
    aggregate?: string
    sort?: string
    expand?: string
    lineHeight?: string | number
    wrapCompute?: string
    format?: string
    fillBlankRows?: string
    multiple?: number
    showSortOptions?: boolean
    showExpandOptions?: boolean
    conditionGroups?: ConditionGroup[]
  }>(),
  {
    datasets: () => [],
    fields: () => [],
    groupItems: () => [],
    dataset: '',
    property: '',
    aggregate: 'select',
    sort: 'none',
    expand: 'None',
    lineHeight: 10,
    wrapCompute: 'custom',
    format: '',
    fillBlankRows: 'custom',
    multiple: 0,
    showSortOptions: true,
    showExpandOptions: true,
    conditionGroups: () => []
  }
)

const emit = defineEmits<{
  (e: 'update:dataset', value: string): void
  (e: 'update:property', value: string): void
  (e: 'update:aggregate', value: string): void
  (e: 'update:sort', value: string): void
  (e: 'update:expand', value: string): void
  (e: 'update:lineHeight', value: string | number): void
  (e: 'update:wrapCompute', value: string): void
  (e: 'update:format', value: string): void
  (e: 'update:fillBlankRows', value: string): void
  (e: 'update:multiple', value: number): void
  (e: 'update:showSortOptions', value: boolean): void
  (e: 'update:showExpandOptions', value: boolean): void
  (e: 'update:conditionGroups', value: ConditionGroup[]): void
  (e: 'dataset-change', value: string): void
  (e: 'property-change', value: string): void
  (e: 'aggregate-change', payload: { aggregate: string; showSortOptions: boolean; showExpandOptions: boolean }): void
  (e: 'sort-change', value: string): void
  (e: 'expand-change', value: string): void
  (e: 'line-height-change', value: string | number): void
  (e: 'wrap-compute-change', value: string): void
  (e: 'format-change', value: string): void
  (e: 'fill-blank-rows-change', value: string): void
  (e: 'multiple-change', value: number): void
  (e: 'condition-groups-change', value: ConditionGroup[]): void
  (e: 'update-custom-group', value: GroupItem[]): void
}>()

// ====== 内部状态 ======
const localDataset = ref<string>('')
const localProperty = ref<string>('')
const localAggregate = ref<string>('select')
const localSort = ref<string>('none')
const localExpand = ref<string>('None')
const localLineHeight = ref<string | number>(10)
const localWrapCompute = ref<string>('custom')
const localFormat = ref<string>('')
const localFillBlankRows = ref<string>('custom')
const localMultiple = ref<number>(0)
const localShowSortOptions = ref<boolean>(true)
const localShowExpandOptions = ref<boolean>(true)
const isInitialized = ref<boolean>(false)
const propertyConditionDialogVisible = ref<boolean>(false)
const customGroupDialogVisible = ref<boolean>(false)

const suggestionList = ref<string[]>([
  'yyyy/MM/dd',
  'yyyy/MM',
  'yyyy-MM',
  'yyyy',
  'yyyy-MM-dd HH:mm:ss',
  'yyyy年MM月dd日 HH:mm:ss',
  'yyyy-MM-dd',
  'yyyy年MM月dd日',
  'HH:mm',
  'HH:mm:ss',
  '#.##',
  '#.00',
  '##.##%',
  '##.00%',
  '##,###.##',
  '￥##,###.##',
  '$##,###.##',
  '0.00E00',
  '##0.0E0'
])

const suggestionOptions = computed(() =>
  suggestionList.value.map((s) => ({ value: s, label: s }))
)

// ====== 监听 props 同步到本地 ======
watch(() => props.dataset, (val) => { localDataset.value = val })
watch(() => props.property, (val) => { localProperty.value = val })
watch(() => props.aggregate, (val) => { localAggregate.value = val })
watch(() => props.sort, (val) => { localSort.value = val })
watch(() => props.expand, (val) => { localExpand.value = val })
watch(() => props.lineHeight, (val) => { localLineHeight.value = val })
watch(() => props.wrapCompute, (val) => { localWrapCompute.value = val })
watch(() => props.format, (val) => { localFormat.value = val })
watch(() => props.fillBlankRows, (val) => { localFillBlankRows.value = val })
watch(() => props.multiple, (val) => { localMultiple.value = val })
watch(() => props.showSortOptions, (val) => { localShowSortOptions.value = val })
watch(() => props.showExpandOptions, (val) => { localShowExpandOptions.value = val })

// ====== 选项 ======
const datasetOptions = computed(() =>
  (props.datasets || []).map((dataset) => ({
    value: dataset.name,
    label: dataset.name
  }))
)

const propertyOptions = computed(() =>
  (props.fields || []).map((field) => ({
    value: field.name,
    label: field.name
  }))
)

const aggregateOptions = computed<SelectOption[]>(() => [
  { value: 'select', label: t('property.dataset.select') },
  { value: 'group', label: t('property.dataset.group') },
  { value: 'customgroup', label: t('property.dataset.customGroup') },
  { value: 'sum', label: t('property.dataset.sum') },
  { value: 'count', label: t('property.dataset.count') },
  { value: 'max', label: t('property.dataset.max') },
  { value: 'min', label: t('property.dataset.min') },
  { value: 'avg', label: t('property.dataset.avg') }
])

const sortOptions = computed<SelectOption[]>(() => [
  { value: 'none', label: t('property.dataset.notSort') },
  { value: 'asc', label: t('property.dataset.asc') },
  { value: 'desc', label: t('property.dataset.desc') }
])

const expandOptions = computed<SelectOption[]>(() => [
  { value: 'Down', label: t('property.dataset.down') },
  { value: 'Right', label: t('property.dataset.right') },
  { value: 'None', label: t('property.dataset.noneExpand') }
])

const wrapComputeOptions = computed<SelectOption[]>(() => [
  { value: 'default', label: t('property.base.open') },
  { value: 'custom', label: t('property.base.close') }
])

const fillBlankRowsOptions = computed<SelectOption[]>(() => [
  { value: 'default', label: t('property.base.open') },
  { value: 'custom', label: t('property.base.close') }
])

onMounted(() => {
  initData()
  // 标记组件已完成初始化
  nextTick(() => {
    isInitialized.value = true
  })
})

/**
 * 初始化数据
 */
const initData = (): void => {
  localDataset.value = props.dataset
  localProperty.value = props.property
  localAggregate.value = props.aggregate
  localSort.value = props.sort
  localExpand.value = props.expand
  localLineHeight.value = props.lineHeight
  localWrapCompute.value = props.wrapCompute
  localFormat.value = props.format
  localFillBlankRows.value = props.fillBlankRows
  localMultiple.value = props.multiple
  localShowSortOptions.value = props.showSortOptions
  localShowExpandOptions.value = props.showExpandOptions
}

/**
 * 处理数据集变化
 */
const handleDatasetChange = (value: string): void => {
  localDataset.value = value
  emit('update:dataset', localDataset.value)
  emit('dataset-change', localDataset.value)
}

/**
 * 处理属性变化
 */
const handlePropertyChange = (): void => {
  emit('update:property', localProperty.value)
  emit('property-change', localProperty.value)
}

/**
 * 处理聚合类型变化
 */
const handleAggregateChange = (): void => {
  if (
    localAggregate.value === 'sum' || localAggregate.value === 'count' ||
    localAggregate.value === 'max' || localAggregate.value === 'min' ||
    localAggregate.value === 'avg'
  ) {
    localShowSortOptions.value = false
    localShowExpandOptions.value = false
  } else {
    localShowSortOptions.value = true
    localShowExpandOptions.value = true
  }

  emit('update:aggregate', localAggregate.value)
  emit('update:showSortOptions', localShowSortOptions.value)
  emit('update:showExpandOptions', localShowExpandOptions.value)
  emit('aggregate-change', {
    aggregate: localAggregate.value,
    showSortOptions: localShowSortOptions.value,
    showExpandOptions: localShowExpandOptions.value
  })
}

/**
 * 处理排序变化
 */
const handleSortChange = (e: Event): void => {
  const target = e.target as HTMLInputElement
  localSort.value = target.value
  emit('update:sort', localSort.value)
  emit('sort-change', localSort.value)
}

/**
 * 处理展开方向变化
 */
const handleExpandChange = (e: Event): void => {
  const target = e.target as HTMLInputElement
  localExpand.value = target.value
  emit('update:expand', localExpand.value)
  emit('expand-change', localExpand.value)
}

/**
 * 处理行高变化
 */
const handleLineHeightChange = (value: string | number): void => {
  localLineHeight.value = value
  emit('update:lineHeight', localLineHeight.value)
  emit('line-height-change', localLineHeight.value)
}

/**
 * 处理换行计算变化
 */
const handleWrapComputeChange = (e: Event): void => {
  const target = e.target as HTMLInputElement
  localWrapCompute.value = target.value
  emit('update:wrapCompute', localWrapCompute.value)
  emit('wrap-compute-change', localWrapCompute.value)
}

/**
 * 处理格式变化
 */
const handleFormatChange = (): void => {
  if (!isInitialized.value) {
    return
  }
  emit('update:format', localFormat.value)
  emit('format-change', localFormat.value)
}

/**
 * 处理填充空白行变化
 */
const handleFillBlankRowsChange = (e: Event): void => {
  const target = e.target as HTMLInputElement
  localFillBlankRows.value = target.value
  emit('update:fillBlankRows', localFillBlankRows.value)
  emit('fill-blank-rows-change', localFillBlankRows.value)
}

/**
 * 处理倍数变化
 */
const handleMultipleChange = (value: number): void => {
  if (!isInitialized.value) {
    return
  }
  localMultiple.value = value
  emit('update:multiple', localMultiple.value)
  emit('multiple-change', localMultiple.value)
}

/**
 * 处理条件属性配置
 */
const handleConditionPropertyConfig = (): void => {
  propertyConditionDialogVisible.value = true
}

/**
 * 处理属性条件保存后的回调
 */
const handlePropertyConditionSave = (newConditionGroups: ConditionGroup[]): void => {
  emit('update:conditionGroups', newConditionGroups)
  emit('condition-groups-change', newConditionGroups)
  setDirty()
}

/**
 * 处理自定义分组配置
 */
const handleCustomGroupConfig = (): void => {
  if (props.fields.length === 0) {
    showAlert(t('property.dataset.bindDatasetTip'))
    return
  }
  customGroupDialogVisible.value = true
  setDirty()
}

/**
 * 处理自定义分组保存
 */
const handleCustomGroupSave = (groupItems: GroupItem[]): void => {
  emit('update-custom-group', groupItems)
  setDirty()
}
</script>

<style scoped>
.simple-suggest :deep(.default-input) {
  width: 250px !important;
  height: 35px;
  display: inline-block;
}
</style>
