<template>
  <div class="dataset-value-editor" ref="container">
    <a-tabs v-model:active-key="activeTab" type="card">
      <a-tab-pane :key="'dataset'" :tab="t('property.dataset.datasetConfig')">
        <dataset-config
            :datasets="datasets"
            :fields="currentFields"
            :group-items="groupItems"
            v-model:dataset="dataset"
            v-model:property="property"
            v-model:aggregate="aggregate"
            v-model:sort="sort"
            v-model:expand="expand"
            v-model:line-height="lineHeight"
            v-model:wrap-compute="wrapCompute"
            v-model:format="format"
            v-model:fill-blank-rows="fillBlankRows"
            v-model:multiple="multiple"
            v-model:show-sort-options="showSortOptions"
            v-model:show-expand-options="showExpandOptions"
            v-model:condition-groups="conditionGroups"
            @dataset-change="handleDatasetChange"
            @property-change="handlePropertyChange"
            @aggregate-change="handleAggregateChange"
            @sort-change="handleSortChange"
            @expand-change="handleExpandChange"
            @line-height-change="handleLineHeightChange"
            @wrap-compute-change="handleWrapComputeChange"
            @format-change="handleFormatChange"
            @fill-blank-rows-change="handleFillBlankRowsChange"
            @multiple-change="handleMultipleChange"
            @condition-groups-change="handleConditionGroupsChange"
            @update-custom-group="handleUpdateCustomGroup"
        />
      </a-tab-pane>

      <a-tab-pane :key="'condition'" :tab="t('property.dataset.filterCondition')">
        <filter-condition
          :dataset="dataset"
          v-model:conditions="conditions"
          :fields="currentFields"
          @update-filter-conditions="handleUpdateFilterConditions"
        />
      </a-tab-pane>

      <a-tab-pane :key="'mapping'" :tab="t('property.dataset.mapping')">
        <data-mapping
          :datasets="datasets"
          :show-mapping-options="showMappingOptions"
          :mapping-type="mappingType"
          :mapping-items="mappingItems"
          :mapping-dataset="mappingDataset"
          :mapping-key-property="mappingKeyProperty"
          :mapping-value-property="mappingValueProperty"
          @mapping-type-change="setMappingType"
          @mapping-items-change="setMappingItems"
          @mapping-dataset-change="setMappingDataset"
          @mapping-key-property-change="setMappingKeyProperty"
          @mapping-value-property-change="setMappingValueProperty"
        />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
/**
 * DatasetValueEditor 数据集值编辑器（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. cellPosition 变化或 isCellUpdate=true → loadCellData 回填
 * 2. 监听子组件的 v-model:xxx 事件 → 同步到本地 ref → 调用 setXxx 写回 cellDef
 * 3. setXxx / setMappingXxx → 遍历 rowIndex..row2Index × colIndex..col2Index，匹配 value.type==='dataset' 的格子深拷贝写回
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - u-tabs/u-tab-pane → a-tabs/a-tab-pane（v-model:active-key 替代 v-model）
 * - Vuex mapGetters/mapActions → useReportStore (Pinia)
 * - this.$nextTick → nextTick
 */
import { ref, computed, watch, nextTick } from 'vue'
import { setDirty } from '@/utils/table'
import { deepCopy } from '@/utils/comnon'
import { getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import { useReportStore } from '@/store/modules/report'
import FilterCondition from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/filter-condition/index.vue'
import DataMapping from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/data-mapping/index.vue'
import DatasetConfig from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/dataset-config/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'DatasetValueEditor' })


const { t } = useI18n()
/** 条件组结构 */
interface ConditionGroup {
  [key: string]: unknown
}

/** 数据集选项 */
interface DatasetOption {
  name: string
  fields?: { name: string; [key: string]: unknown }[]
  [key: string]: unknown
}

/** 字段元数据 */
interface Field {
  name: string
  [key: string]: unknown
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

const reportStore = useReportStore()

// ====== 状态 ======
const activeTab = ref<string>('dataset')
const datasets = ref<DatasetOption[]>([])
const currentFields = ref<Field[]>([])
const initialized = ref<boolean>(false)

// 数据集配置
const dataset = ref<string>('')
const property = ref<string>('')
const aggregate = ref<string>('select')
const sort = ref<string>('none')
const expand = ref<string>('None')
const lineHeight = ref<string | number>('')
const wrapCompute = ref<string>('custom')
const format = ref<string>('')
const fillBlankRows = ref<string>('custom')
const multiple = ref<number>(0)

// 过滤条件
const conditions = ref<unknown[]>([])

// 其他配置
const showMappingOptions = ref<boolean>(false)
const showSortOptions = ref<boolean>(true)
const showExpandOptions = ref<boolean>(true)

// 数据映射相关属性（用于传递给子组件）
const mappingType = ref<string>('simple')
const mappingItems = ref<unknown[]>([])
const mappingDataset = ref<string>('')
const mappingKeyProperty = ref<string>('')
const mappingValueProperty = ref<string>('')

// 条件属性项
const conditionGroups = ref<ConditionGroup[]>([])

// 自定义分组项
const groupItems = ref<unknown[]>([])

// ====== 来自 store ======
const context = computed(() => reportStore.getContext)
const isCellUpdate = computed(() => reportStore.getIsCellUpdate)

const cellPosition = computed<string>(() => `${props.rowIndex},${props.colIndex}`)

/**
 * 加载单元格数据
 */
const loadCellData = (): void => {
  initialized.value = false

  const cellDef = getCell(props.rowIndex, props.colIndex) as Record<string, any> | null
  if (!cellDef) return

  loadDatasets()
  loadInitialValues(cellDef)

  nextTick(() => {
    initialized.value = true
  })
}

/**
 * 加载数据集列表
 */
const loadDatasets = (): void => {
  datasets.value = []
  const ctx = context.value
  if (!ctx) return
  const datasources = (ctx.reportDef?.datasources as DatasetOption[] | undefined) || []
  for (const datasource of datasources) {
    const dsList = (datasource.datasets as DatasetOption[] | undefined) || []
    for (const ds of dsList) {
      datasets.value.push(ds)
    }
  }
}

/**
 * 加载初始值
 */
const loadInitialValues = (cellDef: Record<string, any>): void => {
  // 设置换行计算
  if (cellDef.cellStyle?.wrapCompute) {
    wrapCompute.value = 'default'
  } else {
    wrapCompute.value = 'custom'
  }

  // 设置行高
  if (cellDef.cellStyle?.lineHeight) {
    lineHeight.value = cellDef.cellStyle.lineHeight
  } else {
    lineHeight.value = ''
  }

  // 设置格式
  if (cellDef.cellStyle?.format) {
    format.value = cellDef.cellStyle.format
  } else {
    format.value = ''
  }

  // 设置填充空白行
  if (cellDef.fillBlankRows) {
    fillBlankRows.value = 'default'
    multiple.value = cellDef.multiple || 0
  } else {
    fillBlankRows.value = 'custom'
  }

  // 设置展开方向
  if (cellDef.expand) {
    expand.value = cellDef.expand
  } else {
    expand.value = 'None'
  }

  // 设置数据集值
  const value = cellDef.value
  if (value) {
    dataset.value = value.datasetName || ''
    property.value = value.property || ''
    aggregate.value = value.aggregate || 'select'
    sort.value = value.order || 'none'

    // 设置过滤条件
    conditions.value = value.conditions || []

    // 设置数据映射
    mappingType.value = value.mappingType || 'simple'
    mappingItems.value = value.mappingItems || []
    mappingDataset.value = value.mappingDataset || ''
    mappingKeyProperty.value = value.mappingKeyProperty || ''
    mappingValueProperty.value = value.mappingValueProperty || ''
  }

  // 初始化条件属性项
  if (cellDef.conditionPropertyItems) {
    conditionGroups.value = [...cellDef.conditionPropertyItems]
  } else {
    conditionGroups.value = []
  }

  // 初始化自定义分组项
  if (value?.groupItems) {
    groupItems.value = [...value.groupItems]
  } else {
    groupItems.value = []
  }

  // 触发数据集变化事件，加载字段
  handleDatasetChange()

  handleAggregateChange()
}

/**
 * 处理数据集变化
 */
const handleDatasetChange = (): void => {
  currentFields.value = []

  if (dataset.value) {
    const ctx = context.value
    if (!ctx) return
    const datasources = (ctx.reportDef?.datasources as DatasetOption[] | undefined) || []
    for (const datasource of datasources) {
      const dsList = (datasource.datasets as DatasetOption[] | undefined) || []
      for (const ds of dsList) {
        if (ds.name === dataset.value) {
          currentFields.value = (ds.fields as Field[] | undefined) || []
          break
        }
      }
      if (currentFields.value.length > 0) {
        break
      }
    }
  }

  if (initialized.value) {
    setDatasetName(dataset.value)
  }
}

/**
 * 处理属性变化
 */
const handlePropertyChange = (): void => {
  // 更新属性，无论是否初始化状态都保存
  setProperty(property.value)
}

/**
 * 处理聚合类型变化
 */
const handleAggregateChange = (params?: { showSortOptions: boolean; showExpandOptions: boolean }): void => {
  if (params && typeof params === 'object') {
    showSortOptions.value = params.showSortOptions
    showExpandOptions.value = params.showExpandOptions
  } else {
    if (
      aggregate.value === 'sum' || aggregate.value === 'count' ||
      aggregate.value === 'max' || aggregate.value === 'min' ||
      aggregate.value === 'avg'
    ) {
      showSortOptions.value = false
      showExpandOptions.value = false
    } else {
      showSortOptions.value = true
      showExpandOptions.value = true
    }
  }

  if (aggregate.value === 'group' || aggregate.value === 'select') {
    showMappingOptions.value = true
  } else {
    showMappingOptions.value = false
  }

  if (initialized.value) {
    setAggregate(aggregate.value)
  }
}

watch(cellPosition, () => {
  loadCellData()
}, { immediate: true })

watch(isCellUpdate, (newVal) => {
  if (newVal) {
    loadCellData()
    reportStore.setCellUpdate(false)
  }
})

/**
 * 处理排序变化
 */
const handleSortChange = (): void => {
  // 更新排序，无论是否初始化状态都保存
  setOrder(sort.value)
}

/**
 * 处理展开方向变化
 */
const handleExpandChange = (): void => {
  // 更新展开方向，无论是否初始化状态都保存
  setExpand(expand.value)
}

/**
 * 处理行高变化
 */
const handleLineHeightChange = (): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex) as Record<string, any> | null
  if (cellDef && cellDef.cellStyle) {
    const hot = TableManager.get() as any
    if (hot) {
      const td = hot.getCell(props.rowIndex, props.colIndex)
      if (td) {
        if (lineHeight.value === '' || lineHeight.value === null) {
          td.style.lineHeight = ''
        } else {
          td.style.lineHeight = lineHeight.value
        }
        hot.render()
      }
    }

    for (let i = props.rowIndex; i <= props.row2Index; i++) {
      for (let j = props.colIndex; j <= props.col2Index; j++) {
        const originalCellDef = getCell(i, j) as Record<string, any> | null
        if (originalCellDef) {
          const updatedCellDef = deepCopy(originalCellDef)
          if (!updatedCellDef.cellStyle) {
            updatedCellDef.cellStyle = {}
          }
          updatedCellDef.cellStyle.lineHeight = lineHeight.value
          setCell(i, j, updatedCellDef)
        }
      }
    }

    setDirty()
  }
}

/**
 * 处理换行计算变化
 */
const handleWrapComputeChange = (): void => {
  const wrapComputeValue = wrapCompute.value === 'default'

  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j) as Record<string, any> | null
      if (!cellDef) continue

      const newCellDef = deepCopy(cellDef)
      if (!newCellDef.cellStyle) {
        newCellDef.cellStyle = {}
      }
      newCellDef.cellStyle.wrapCompute = wrapComputeValue
      setCell(i, j, newCellDef)
    }
  }
  setDirty()
}

/**
 * 处理格式变化
 */
const handleFormatChange = (): void => {
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j) as Record<string, any> | null
      if (!cellDef) continue

      const newCellDef = deepCopy(cellDef)
      if (!newCellDef.cellStyle) {
        newCellDef.cellStyle = {}
      }
      newCellDef.cellStyle.format = format.value
      setCell(i, j, newCellDef)
    }
  }
  setDirty()
}

/**
 * 处理填充空白行变化
 */
const handleFillBlankRowsChange = (): void => {
  const fillBlankRowsValue = fillBlankRows.value === 'default'

  // 更新填充空白行，无论是否初始化状态都保存
  setFillBlankRows(fillBlankRowsValue)
}

/**
 * 处理倍数变化
 */
const handleMultipleChange = (): void => {
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j) as Record<string, any> | null
      if (!cellDef) continue

      const newCellDef = deepCopy(cellDef)
      newCellDef.multiple = multiple.value
      setCell(i, j, newCellDef)
    }
  }
  setDirty()
}

/**
 * 处理条件属性项变化
 */
const handleConditionGroupsChange = (newConditionGroups: ConditionGroup[]): void => {
  conditionGroups.value = newConditionGroups

  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const originalCellDef = getCell(i, j) as Record<string, any> | null
      if (originalCellDef) {
        const updatedCellDef = deepCopy(originalCellDef)
        updatedCellDef.conditionPropertyItems = newConditionGroups
        setCell(i, j, updatedCellDef)
      }
    }
  }

  setDirty()
}

/**
 * 处理 cellDef 条件更新
 */
const handleUpdateFilterConditions = (newConditions: unknown[]): void => {
  conditions.value = newConditions

  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const originalCellDef = getCell(i, j) as Record<string, any> | null
      if (originalCellDef) {
        const updatedCellDef = deepCopy(originalCellDef)
        updatedCellDef.value.conditions = newConditions
        setCell(i, j, updatedCellDef)
      }
    }
  }
  setDirty()
}

/**
 * 处理自定义分组更新
 */
const handleUpdateCustomGroup = (newGroupItems: unknown[]): void => {
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const originalCellDef = getCell(i, j) as Record<string, any> | null
      if (originalCellDef) {
        const updatedCellDef = deepCopy(originalCellDef)
        updatedCellDef.value.groupItems = newGroupItems
        setCell(i, j, updatedCellDef)
      }
    }
  }
  groupItems.value = [...newGroupItems]
}

/**
 * 更新表格数据
 */
const updateTableData = (): void => {
  const hot = TableManager.get() as any
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j) as Record<string, any> | null
      if (!cellDef) {
        continue
      }
      const value = cellDef.value
      const valueType = value?.type
      let data: string = ''
      if (valueType === 'simple') {
        data = String(value.value ?? '')
      } else if (valueType === 'dataset') {
        data = `${value.datasetName ?? ''}.${value.aggregate ?? ''}(${value.property ?? ''})`
      } else if (valueType === 'expression') {
        data = String(value.value ?? '')
      }
      if (hot) {
        hot.setDataAtCell(cellDef.rowNumber - 1, cellDef.columnNumber - 1, data)
      }
    }
  }
}

/**
 * 设置数据集名称
 */
const setDatasetName = (datasetName: string): void => {
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j) as Record<string, any> | null
      if (!cellDef) {
        continue
      }
      const valueType = cellDef.value?.type
      if (valueType === 'dataset') {
        const newCellDef = deepCopy(cellDef)
        newCellDef.value.datasetName = datasetName
        setCell(i, j, newCellDef)
      }
    }
  }
  updateTableData()
  setDirty()
}

/**
 * 设置属性
 */
const setProperty = (newProperty: string): void => {
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j) as Record<string, any> | null
      if (!cellDef) {
        continue
      }
      const valueType = cellDef.value?.type
      if (valueType === 'dataset') {
        const newCellDef = deepCopy(cellDef)
        newCellDef.value.property = newProperty
        setCell(i, j, newCellDef)
      }
    }
  }
  updateTableData()
  setDirty()
}

/**
 * 设置聚合类型
 */
const setAggregate = (newAggregate: string): void => {
  const hot = TableManager.get() as any
  let none = false
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j) as Record<string, any> | null
      if (!cellDef) {
        continue
      }
      const valueType = cellDef.value?.type
      if (valueType === 'dataset') {
        const newCellDef = deepCopy(cellDef)
        newCellDef.value.aggregate = newAggregate
        if (
          newAggregate === 'sum' || newAggregate === 'count' || newAggregate === 'max' ||
          newAggregate === 'min' || newAggregate === 'avg'
        ) {
          newCellDef.value.order = 'none'
          newCellDef.expand = 'None'
          none = true
        }
        setCell(i, j, newCellDef)
      }
    }
  }
  if (none) {
    sort.value = 'none'
    expand.value = 'None'
  }
  updateTableData()
  if (hot) {
    hot.render()
  }
  setDirty()
}

/**
 * 设置排序
 */
const setOrder = (order: string): void => {
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j) as Record<string, any> | null
      if (!cellDef) {
        continue
      }
      const valueType = cellDef.value?.type
      if (valueType === 'dataset') {
        const newCellDef = deepCopy(cellDef)
        newCellDef.value.order = order
        setCell(i, j, newCellDef)
      }
    }
  }
  setDirty()
}

/**
 * 设置展开方向
 */
const setExpand = (newExpand: string): void => {
  const originalCellDef = getCell(props.rowIndex, props.colIndex) as Record<string, any> | null
  if (originalCellDef) {
    const updatedCellDef = deepCopy(originalCellDef)
    updatedCellDef.expand = newExpand
    setCell(props.rowIndex, props.colIndex, updatedCellDef)
  }
  const hot = TableManager.get() as any
  if (hot) {
    hot.render()
  }
  setDirty()
}

/**
 * 设置填充空白行
 */
const setFillBlankRows = (value: boolean): void => {
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j) as Record<string, any> | null
      if (!cellDef) {
        continue
      }
      const newCellDef = deepCopy(cellDef)
      newCellDef.fillBlankRows = value
      if (!newCellDef.multiple) {
        newCellDef.multiple = 0
      }
      setCell(i, j, newCellDef)
    }
  }
  setDirty()
}

/**
 * 设置映射类型
 */
const setMappingType = (newMappingType: string): void => {
  mappingType.value = newMappingType
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j) as Record<string, any> | null
      if (!cellDef) {
        continue
      }
      if (cellDef.value?.type === 'dataset') {
        const newCellDef = deepCopy(cellDef)
        newCellDef.value.mappingType = newMappingType
        setCell(i, j, newCellDef)
      }
    }
  }
  setDirty()
}

/**
 * 设置映射项
 */
const setMappingItems = (newMappingItems: unknown[]): void => {
  mappingItems.value = newMappingItems
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j) as Record<string, any> | null
      if (!cellDef) {
        continue
      }
      if (cellDef.value?.type === 'dataset') {
        const newCellDef = deepCopy(cellDef)
        newCellDef.value.mappingItems = newMappingItems
        setCell(i, j, newCellDef)
      }
    }
  }
  setDirty()
}

/**
 * 设置映射数据集
 */
const setMappingDataset = (newMappingDataset: string): void => {
  mappingDataset.value = newMappingDataset
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j) as Record<string, any> | null
      if (!cellDef) {
        continue
      }
      if (cellDef.value?.type === 'dataset') {
        const newCellDef = deepCopy(cellDef)
        newCellDef.value.mappingDataset = newMappingDataset
        setCell(i, j, newCellDef)
      }
    }
  }
  setDirty()
}

/**
 * 设置映射键属性
 */
const setMappingKeyProperty = (newMappingKeyProperty: string): void => {
  mappingKeyProperty.value = newMappingKeyProperty
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j) as Record<string, any> | null
      if (!cellDef) {
        continue
      }
      if (cellDef.value?.type === 'dataset') {
        const newCellDef = deepCopy(cellDef)
        newCellDef.value.mappingKeyProperty = newMappingKeyProperty
        setCell(i, j, newCellDef)
      }
    }
  }
  setDirty()
}

/**
 * 设置映射值属性
 */
const setMappingValueProperty = (newMappingValueProperty: string): void => {
  mappingValueProperty.value = newMappingValueProperty
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j) as Record<string, any> | null
      if (!cellDef) {
        continue
      }
      if (cellDef.value?.type === 'dataset') {
        const newCellDef = deepCopy(cellDef)
        newCellDef.value.mappingValueProperty = newMappingValueProperty
        setCell(i, j, newCellDef)
      }
    }
  }
  setDirty()
}
</script>

<style scoped>
</style>
