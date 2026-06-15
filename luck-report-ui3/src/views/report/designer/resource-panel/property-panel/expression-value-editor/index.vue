<template>
  <div class="expression-value-editor" ref="container">
    <a-form :label-col="{ style: { width: '100px' } }" :colon="false">

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
        <textarea ref="codeEditor"></textarea>
      </div>
    </a-form>

    <!-- 条件属性对话框 -->
    <PropertyConditionDialog
      ref="propertyConditionDialog"
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
 * - CodeMirror 实例统一存到 ref，beforeUnmount 钩子用 onBeforeUnmount
 * - scriptValidation API 沿用
 */
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import CodeMirror from 'codemirror'
import 'codemirror/addon/hint/show-hint.js'
import 'codemirror/addon/lint/lint.js'
import { setDirty } from '@/utils/table'
import { scriptValidation } from '@/api/designer'
import PropertyConditionDialog from '@/views/report/designer/resource-panel/property-panel/property-condition-dialog/index.vue'
import { showAlert } from '@/utils/comnon'
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
const codeMirror = ref<any>(null)
const initialized = ref<boolean>(false)
const wrapCompute = ref<string>('default')
const expand = ref<string>('None')
const format = ref<string>('')
const loadingCellData = ref<boolean>(false)
const propertyConditionDialogVisible = ref<boolean>(false)
const conditionGroups = ref<any[]>([])
const codeEditorRef = ref<HTMLTextAreaElement | null>(null)
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

/** 构建 CodeMirror 脚本校验函数 */
const buildScriptLintFunction = () => {
  return async (text: string, updateLinting: any, options: any, editor: any) => {
    if (text === '') {
      updateLinting(editor, [])
      return
    }
    if (!text || text === '') {
      return
    }

    try {
      const result = await scriptValidation(text)
      if (result) {
        for (const item of result) {
          item.from = { line: item.line - 1 }
          item.to = { line: item.line - 1 }
        }
        updateLinting(editor, result)
      } else {
        updateLinting(editor, [])
      }
    } catch (error) {
      console.error('Script validation error:', error)
      showAlert(t('property.base.syntaxError'))
    }
  }
}

/** 初始化 CodeMirror */
const initCodeEditor = (): void => {
  const textarea = codeEditorRef.value
  if (!textarea) return

  codeMirror.value = CodeMirror.fromTextArea(textarea, {
    mode: 'javascript',
    lineNumbers: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
    lint: {
      getAnnotations: buildScriptLintFunction(),
      async: true
    },
    lineWrapping: true,
    viewportMargin: Infinity,
    indentWithTabs: false,
    tabSize: 2,
    smartIndent: true,
    cursorScrollMargin: 10
  })

  nextTick(() => {
    if (codeMirror.value) {
      codeMirror.value.refresh()
    }
  })
  codeMirror.value.setSize('auto', '160px')

  codeMirror.value.on('change', (cm: any) => {
    if (loadingCellData.value) return
    const expr = cm.getValue()
    if (expr === 'undefined' || expr === undefined || expr === null) {
      return
    }
    const cellDef = getCell(props.rowIndex, props.colIndex)
    if (cellDef && cellDef.value) {
      const newCellDef = deepCopy(cellDef)
      newCellDef.value.value = expr
      setCell(props.rowIndex, props.colIndex, newCellDef)
    }
    const hot = TableManager.get()
    if (hot) {
      hot.setDataAtCell(props.rowIndex, props.colIndex, expr)
    }
    setDirty()
  })

  // 初始化后再加载数据
  loadCellData()
}

/** 加载单元格数据 */
const loadCellData = (): void => {
  loadingCellData.value = true

  const cellDef = getCell(props.rowIndex, props.colIndex)

  // 编辑器已初始化 → 立即设置值
  if (codeMirror.value && cellDef && cellDef.value) {
    let valueToSet = cellDef.value.value || ''
    if (valueToSet === 'undefined') {
      valueToSet = ''
    }
    codeMirror.value.setValue(valueToSet)
  }

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
    initialized.value = true
    if (!codeMirror.value) {
      initCodeEditor()
    } else {
      codeMirror.value.refresh()
    }
    loadingCellData.value = false
  })
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

onBeforeUnmount(() => {
  if (codeMirror.value) {
    codeMirror.value.toTextArea()
    codeMirror.value = null
  }
})

const handleExpandChange = (val: string): void => {
  const hot = TableManager.get()
  if (!hot) return
  expand.value = val
  for (let i = props.rowIndex; i <= props.row2Index; i++) {
    for (let j = props.colIndex; j <= props.col2Index; j++) {
      const cellDef = getCell(i, j)
      if (!cellDef) continue

      const type = cellDef.value?.type
      if (type === 'dataset' || type === 'expression') {
        const newCellDef = deepCopy(cellDef)
        newCellDef.expand = val
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
