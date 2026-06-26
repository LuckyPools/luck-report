<template>
  <div class="data-mapping-tab">
    <a-form :label-col="{ style: { width: '100px' } }" >
      <div style="padding-top: 10px">
        <div v-if="!showMappingOptions" class="alert alert-info" style="margin-bottom: 10px;">
        </div>

        <a-form-item :label="t('property.dataset.mappingType')" v-show="showMappingOptions">
          <a-radio-group v-model:value="localMappingType" @change="handleMappingTypeChange">
            <a-radio
              v-for="option in mappingTypeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-radio>
          </a-radio-group>
        </a-form-item>

        <div v-show="showMappingOptions && localMappingType === 'simple'" class="form-group table-wrapper">
          <div class="top-button">
            <a-button
                type="primary"
                :title="t('property.dataset.addMappping')"
                @click="handleAddMapping"
            >
              <template #icon><i class="iconfont icon-plus-circle"></i></template>
            </a-button>
          </div>
          <a-table
            :columns="mappingColumns"
            :data-source="localMappingItems"
            :pagination="false"
            size="small"
            row-key="value"
            style="margin-top: 10px"
          >
            <template #bodyCell="{ column, index }">
              <template v-if="column.key === 'op'">
                <a-button
                    type="link"
                    :title="t('dialog.urlParam.edit')"
                    @click="handleEditMapping(index)"
                >
                  <i class="iconfont icon-edit"></i>
                </a-button>
                <a-button
                    type="link"
                    :title="t('dialog.urlParam.delete')"
                    @click="handleDeleteMapping(index)"
                    style="color: red"
                >
                  <i class="iconfont icon-delete"></i>
                </a-button>
              </template>
            </template>
          </a-table>
        </div>

        <div v-show="showMappingOptions && localMappingType === 'dataset'">
          <a-form-item :label="t('property.dataset.dataset')">
            <a-select
              v-model:value="localMappingDataset"
              :options="datasetOptions"
              :allow-clear="true"
              style="width: 250px"
              @change="handleMappingDatasetChange"
            />
          </a-form-item>

          <a-form-item :label="t('property.dataset.realValueProp')">
            <a-select
              v-model:value="localMappingKeyProperty"
              :options="mappingFieldOptions"
              :allow-clear="true"
              style="width: 250px"
              @change="handleMappingKeyPropertyChange"
            />
          </a-form-item>

          <a-form-item :label="t('property.dataset.displayValueProp')">
            <a-select
              v-model:value="localMappingValueProperty"
              :options="mappingFieldOptions"
              :allow-clear="true"
              style="width: 250px"
              @change="handleMappingValuePropertyChange"
            />
          </a-form-item>
        </div>
      </div>
    </a-form>
    <!-- 映射对话框 -->
    <mapping-dialog
      v-model:visible="dialogVisible"
      :mapping-item="currentMappingItem"
      :operation="dialogOperation"
      @save="handleMappingSave"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * DataMapping 数据映射面板（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. props 同步到 localMappingType/localMappingItems/...
 * 2. 用户在 simple/dataset 两种模式下增删改映射项
 * 3. localMappingDataset 变化时自动加载 mappingFields
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - u-form/u-form-item/u-select/u-option/u-radio-group/u-radio/u-button → a-form/a-form-item/a-select/a-radio-group/a-radio/a-button
 * - 原生 <table> → a-table
 * - Vuex mapGetters → useReportStore (Pinia)
 */
import { ref, computed, watch } from 'vue'
import { setDirty } from '@/utils/table'
import { showConfirm } from '@/utils/comnon'
import MappingDialog, { type MappingItem } from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/mapping-dialog/index.vue'
import { useReportStore } from '@/store/modules/report'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'DataMapping' })


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

const props = withDefaults(
  defineProps<{
    datasets?: { name: string; [key: string]: unknown }[]
    showMappingOptions?: boolean
    mappingType?: string
    mappingItems?: MappingItem[]
    mappingDataset?: string
    mappingKeyProperty?: string
    mappingValueProperty?: string
  }>(),
  {
    datasets: () => [],
    showMappingOptions: false,
    mappingType: 'simple',
    mappingItems: () => [],
    mappingDataset: '',
    mappingKeyProperty: '',
    mappingValueProperty: ''
  }
)

const emit = defineEmits<{
  (e: 'mapping-type-change', value: string): void
  (e: 'mapping-items-change', value: MappingItem[]): void
  (e: 'mapping-dataset-change', value: string): void
  (e: 'mapping-key-property-change', value: string): void
  (e: 'mapping-value-property-change', value: string): void
}>()

const reportStore = useReportStore()

// ====== 状态 ======
const mappingFields = ref<Field[]>([])
const dialogVisible = ref<boolean>(false)
const dialogOperation = ref<string>('add')
const currentMappingItem = ref<MappingItem>({ value: '', label: '' })
const editingIndex = ref<number>(-1)
const localMappingType = ref<string>(props.mappingType)
const localMappingItems = ref<MappingItem[]>([...props.mappingItems])
const localMappingDataset = ref<string>(props.mappingDataset)
const localMappingKeyProperty = ref<string>(props.mappingKeyProperty)
const localMappingValueProperty = ref<string>(props.mappingValueProperty)

// ====== 来自 store ======
const context = computed(() => reportStore.getContext)

const datasources = computed(() => {
  const ctx = context.value
  if (!ctx) return []
  return (ctx.reportDef?.datasources as { name: string; datasets?: { name: string; fields?: Field[] }[] }[] | undefined) || []
})

// ====== 选项 ======
const datasetOptions = computed<SelectOption[]>(() =>
  (props.datasets || []).map((dataset) => ({
    value: dataset.name,
    label: dataset.name
  }))
)

const mappingFieldOptions = computed<SelectOption[]>(() =>
  mappingFields.value.map((field) => ({
    value: field.name,
    label: field.name
  }))
)

const mappingTypeOptions = computed<SelectOption[]>(() => [
  { value: 'simple', label: t('property.dataset.simple') },
  { value: 'dataset', label: t('property.dataset.ds') }
])

/** a-table 列定义 */
const mappingColumns = computed(() => [
  {
    title: t('property.dataset.realValue'),
    dataIndex: 'value',
    key: 'value',
    width: 120
  },
  {
    title: t('property.dataset.displayValue'),
    dataIndex: 'label',
    key: 'label',
    width: 120
  },
  {
    title: t('property.dataset.op'),
    key: 'op',
    width: 120
  }
])

// ====== 监听 props 同步 ======
watch(() => props.mappingType, (val) => { localMappingType.value = val })
watch(() => props.mappingItems, (val) => { localMappingItems.value = [...val] })
watch(() => props.mappingDataset, (val) => { localMappingDataset.value = val })
watch(() => props.mappingKeyProperty, (val) => { localMappingKeyProperty.value = val })
watch(() => props.mappingValueProperty, (val) => { localMappingValueProperty.value = val })

/**
 * 加载映射数据集的字段
 */
const loadMappingFields = (): void => {
  mappingFields.value = []

  if (localMappingDataset.value) {
    for (const datasource of datasources.value) {
      const dsList = datasource.datasets || []
      for (const ds of dsList) {
        if (ds.name === localMappingDataset.value) {
          mappingFields.value = ds.fields || []
          break
        }
      }
      if (mappingFields.value.length > 0) {
        break
      }
    }
  }
}

watch(localMappingDataset, () => {
  loadMappingFields()
}, { immediate: true })

/**
 * 处理映射类型变化
 */
const handleMappingTypeChange = (e: Event): void => {
  const target = e.target as HTMLInputElement
  localMappingType.value = target.value
  emit('mapping-type-change', localMappingType.value)
  setDirty()
}

/**
 * 处理添加映射
 */
const handleAddMapping = (): void => {
  currentMappingItem.value = { value: '', label: '' }
  dialogOperation.value = 'add'
  editingIndex.value = -1
  dialogVisible.value = true
}

/**
 * 处理编辑映射
 */
const handleEditMapping = (index: number): void => {
  const item = localMappingItems.value[index]
  currentMappingItem.value = {
    value: item.value,
    label: item.label
  }
  dialogOperation.value = 'edit'
  editingIndex.value = index
  dialogVisible.value = true
}

/**
 * 处理映射保存
 */
const handleMappingSave = (data: MappingItem): void => {
  if (dialogOperation.value === 'add') {
    localMappingItems.value.push(data)
  } else {
    if (editingIndex.value >= 0) {
      localMappingItems.value[editingIndex.value] = data
    }
  }
  emit('mapping-items-change', localMappingItems.value)
  setDirty()
}

/**
 * 处理删除映射
 */
const handleDeleteMapping = (index: number): void => {
  const item = localMappingItems.value[index]
  showConfirm(t('property.dataset.delConfirm')).then(() => {
    const newMappingItems = [...localMappingItems.value]
    const itemIndex = newMappingItems.indexOf(item)

    if (itemIndex !== -1) {
      newMappingItems.splice(itemIndex, 1)
      localMappingItems.value = newMappingItems
      emit('mapping-items-change', newMappingItems)
      setDirty()
    }
  })
}

/**
 * 处理映射数据集变化
 */
const handleMappingDatasetChange = (value: string): void => {
  localMappingDataset.value = value
  emit('mapping-dataset-change', localMappingDataset.value)
  setDirty()
}

/**
 * 处理映射键属性变化
 */
const handleMappingKeyPropertyChange = (value: string): void => {
  localMappingKeyProperty.value = value
  emit('mapping-key-property-change', localMappingKeyProperty.value)
  setDirty()
}

/**
 * 处理映射值属性变化
 */
const handleMappingValuePropertyChange = (value: string): void => {
  localMappingValueProperty.value = value
  emit('mapping-value-property-change', localMappingValueProperty.value)
  setDirty()
}
</script>

<style scoped>
.top-button {
  display: flex;
  justify-content: end;
}
</style>
