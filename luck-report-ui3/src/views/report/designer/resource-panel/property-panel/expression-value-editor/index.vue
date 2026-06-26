<template>
  <div class="expression-value-editor" ref="containerRef">
    <a-form :label-col="{ style: { width: '100px' } }" >

      <div class="property-quote">
        {{ t('property.expr.config') }}
      </div>

      <!-- 换行计算选项 -->
      <a-form-item class="property-label" :label="t('property.base.newLineCompute')">
        <a-radio-group
          v-model:value="wrapCompute"
          @change="handleWrapComputeChange"
        >
          <a-radio
            v-for="option in wrapComputeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>

      <!-- 展开选项 -->
      <a-form-item class="property-label" :label="t('property.expr.expand')">
        <a-radio-group
          v-model:value="expand"
          @change="handleExpandChange"
        >
          <a-radio
            v-for="option in expandOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>

      <!-- 格式化输入框 -->
      <a-form-item class="property-label" :label="t('property.base.format')">
        <a-auto-complete
          v-model:value="format"
          :options="formatSuggestionOptions"
          :placeholder="t('property.base.formatTip')"
          class="format-suggest"
          @blur="handleFormatChange"
        />
      </a-form-item>

      <!-- 条件属性配置 -->
      <a-form-item class="property-label" :label="t('property.base.conditionProp')">
        <a-button
          type="primary"
          @click="handleConditionPropertyConfig"
        >
          <template #icon><i class="iconfont icon-filter"></i></template>
          {{ t('property.base.configCondition') }}
        </a-button>
      </a-form-item>

      <!-- 表达式编辑器 -->
      <a-form-item class="property-label" :label="t('property.expr.expr')">
      </a-form-item>
      <div>
        <CodeMirror v-model="codeValue" :basic-setup="true" :height="160" />
      </div>
    </a-form>

    <!-- 条件属性对话框 -->
    <PropertyConditionDialog
      ref="propertyConditionDialogRef"
      v-model:visible="propertyConditionDialogVisible"
      :fields="[]"
      :condition-groups="conditionGroups"
      @saveAfter="handlePropertyConditionSave"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ExpressionValueEditor 表达式值编辑器（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. cellPosition 变化或 isCellUpdate=true → loadCellData 回填
 * 2. CodeMirror 编辑器双向同步：编辑 → 写回 cellDef.value.value + hot.setDataAtCell
 * 3. wrapCompute/expand/format 变化 → 批量更新 rowIndex..row2Index × colIndex..col2Index 区域
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UForm/UFormItem/URadioGroup/URadio/UButton（自定义）→ a-form/a-form-item/a-radio-group/a-radio/a-button
 * - vue-simple-suggest → a-auto-complete
 * - this.$refs.codeEditor → ref<HTMLTextAreaElement | null>(null)
 * - this.$nextTick → nextTick
 * - Vuex mapGetters/mapActions → useReportStore (Pinia)
 * - CodeMirror 5 → 6，封装为 <CodeMirror> 响应式组件
 * - 自定义表达式（ds.field / cell("A1") 等）非严格 JS 语法，
 *   故不引入 @codemirror/lang-javascript 等语言包，避免误报
 *   （如需语法校验可重新接 scriptValidation API）
 */
import { ref, computed, watch, nextTick } from 'vue'
import CodeMirror from '@/components/code-mirror/index.vue'
import { setDirty } from '@/utils/table'
import PropertyConditionDialog from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/index.vue'
import { deepCopy } from '@/utils/comnon'
import { getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import { useReportStore } from '@/store/modules/report'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ExpressionValueEditor' })


const { t } = useI18n()
interface SelectOption {
  value: string
  label: string
}

interface AutoCompleteOption {
  value: string
  label: string
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
const codeValue = ref<string>('')
const wrapCompute = ref<string>('default')
const expand = ref<string>('None')
const format = ref<string>('')
const loadingCellData = ref<boolean>(false)
const propertyConditionDialogVisible = ref<boolean>(false)
const conditionGroups = ref<any[]>([])
const containerRef = ref<HTMLDivElement | null>(null)
const propertyConditionDialogRef = ref<InstanceType<typeof PropertyConditionDialog> | null>(null)

// ====== 来自 store ======
const context = computed(() => reportStore.getContext)
const isCellUpdate = computed(() => reportStore.getIsCellUpdate)

const cellPosition = computed<string>(() => `${props.rowIndex},${props.colIndex}`)

// ====== 选项 ======
const wrapComputeOptions = computed<SelectOption[]>(() => [
  { value: 'default', label: t('property.base.open') },
  { value: 'custom', label: t('property.base.close') }
])

const expandOptions = computed<SelectOption[]>(() => [
  { value: 'Down', label: t('property.dataset.down') },
  { value: 'Right', label: t('property.dataset.right') },
  { value: 'None', label: t('property.dataset.noneExpand') }
])

const formatSuggestionList = [
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
]

const formatSuggestionOptions = computed<AutoCompleteOption[]>(() =>
  formatSuggestionList.map((s) => ({ value: s, label: s }))
)

/** 从单元格同步数据到 UI */
const loadCellData = (): void => {
  loadingCellData.value = true

  const cellDef = getCell(props.rowIndex, props.colIndex)

  let valueToSet = ''
  if (cellDef && cellDef.value) {
    valueToSet = cellDef.value.value || ''
    if (valueToSet === 'undefined') {
      valueToSet = ''
    }
  }
  codeValue.value = valueToSet

  if (cellDef && cellDef.expand) {
    expand.value = cellDef.expand
  }
  if (cellDef && cellDef.cellStyle && cellDef.cellStyle.format) {
    format.value = cellDef.cellStyle.format
  } else {
    format.value = ''
  }
  if (cellDef && cellDef.cellStyle && cellDef.cellStyle.wrapCompute) {
    wrapCompute.value = 'default'
  } else {
    wrapCompute.value = 'custom'
  }

  nextTick(() => {
    loadingCellData.value = false
  })
}

// 编辑器内容变化 → 写回 cellDef + 表格
const handleCodeChange = (value: string): void => {
  if (loadingCellData.value) return
  if (value === 'undefined' || value === undefined || value === null) return
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (cellDef && cellDef.value) {
    const newCellDef = deepCopy(cellDef)
    newCellDef.value.value = value
    setCell(props.rowIndex, props.colIndex, newCellDef)
  }
  const hot = TableManager.get()
  if (hot) {
    hot.setDataAtCell(props.rowIndex, props.colIndex, value)
  }
  setDirty()
}

watch(codeValue, (val) => {
  handleCodeChange(val)
})

watch(cellPosition, () => {
  loadCellData()
}, { immediate: true })

watch(isCellUpdate, (newVal) => {
  if (newVal) {
    loadCellData()
    reportStore.setCellUpdate(false)
  }
})

const handleExpandChange = (): void => {
  // a-radio-group 的 @change 传的是 event 对象，v-model 已把新值同步到 expand
  const hot = TableManager.get()
  if (!hot) return
  const expandValue = expand.value
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j)
      if (!cellDef) continue

      const type = cellDef.value?.type
      if (type === 'dataset' || type === 'expression') {
        const newCellDef = deepCopy(cellDef)
        newCellDef.expand = expandValue
        setCell(i, j, newCellDef)
      }
    }
  }
  hot.render()
  setDirty()
}

const handleWrapComputeChange = (): void => {
  const wrapComputeValue = wrapCompute.value === 'default'

  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j)
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

const handleFormatChange = (): void => {
  if (loadingCellData.value) return
  const hot = TableManager.get()
  if (!hot) return
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j)
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

const handleConditionPropertyConfig = async (): Promise<void> => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (!cellDef) return

  const groups = cellDef.conditionPropertyItems
    ? deepCopy(cellDef.conditionPropertyItems)
    : []

  conditionGroups.value = groups
  propertyConditionDialogVisible.value = true
}

const handlePropertyConditionSave = (groups: any[]): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (!cellDef) return

  const newCellDef = deepCopy(cellDef)
  newCellDef.conditionPropertyItems = deepCopy(groups)

  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      setCell(i, j, newCellDef)
    }
  }
  setDirty()
}
</script>

<style scoped>
.format-suggest {
  width: 250px;
}
</style>
