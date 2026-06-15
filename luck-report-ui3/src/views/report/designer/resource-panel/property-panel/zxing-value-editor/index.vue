<template>
  <div class="zxing-value-editor" ref="container">

    <div class="property-quote">
      {{ t('property.zxing.config') }}
    </div>

    <a-form :label-col="{ style: { width: '100px' } }" :colon="false">
      <a-form-item class="property-label" :label="t('property.zxing.width')">
        <a-input-number
          v-model:value="width"
          :min="1"
          @change="handleWidthChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.zxing.height')">
        <a-input-number
          v-model:value="height"
          :min="1"
          @change="handleHeightChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.zxing.format')" v-show="showFormat">
        <a-select
          v-model:value="format"
          style="width: 250px"
          :options="formatOptions"
          :allow-clear="true"
          @change="handleFormatChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.zxing.source')">
        <a-select
          v-model:value="source"
          style="width: 250px"
          :options="sourceOptions"
          :allow-clear="true"
          @change="handleSourceChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.zxing.expand')" v-show="source === 'expression'">
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

      <a-form-item class="property-label" :label="t('property.zxing.text1')" v-show="source === 'text'">
        <a-input
          v-model:value="textValue"
          style="width: 250px;"
          @change="handleTextChange"
        />
      </a-form-item>

      <div v-show="source === 'expression'">
        <a-form-item class="property-label" :label="t('property.zxing.expr')">
        </a-form-item>
        <div style="border: solid 1px #eeeeee;">
          <textarea ref="codeEditor"></textarea>
        </div>
      </div>
    </a-form>
  </div>
</template>

<script setup lang="ts">
/**
 * ZxingValueEditor 二维码/条形码值编辑器（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. cellPosition 变化或 isCellUpdate=true → loadCellData 回填
 * 2. source=text → 直接编辑 textValue；source=expression → CodeMirror 编辑 value.value
 * 3. width/height/format/source/textValue/expand 写回 cellDef.value
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UForm/UFormItem/USelect/UOption/URadioGroup/URadio/UInputNumber/UInput（自定义）→ a-form/a-form-item/a-select/a-radio-group/a-radio/a-input-number/a-input
 * - a-input-number 的 v-model:value 是 number|null
 * - a-select 使用 :options 传值，不再使用 a-option 子节点
 * - a-radio 使用 v-model:value + :value 传值
 * - this.$refs.codeEditor → ref<HTMLTextAreaElement | null>(null)
 * - Vuex mapGetters/mapActions → useReportStore (Pinia)
 */
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import CodeMirror from 'codemirror'
import 'codemirror/addon/hint/show-hint.js'
import 'codemirror/addon/lint/lint.js'
import { setDirty } from '@/utils/table'
import { scriptValidation } from '@/api/designer'
import { showAlert } from '@/utils/comnon'
import { deepCopy } from '@/utils/comnon'
import { getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import { useReportStore } from '@/store/modules/report'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ZxingValueEditor' })


const { t } = useI18n()
interface SelectOption {
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
const loadingCellData = ref<boolean>(false)
const width = ref<number | null>(null)
const height = ref<number | null>(null)
const format = ref<string>('QR_CODE')
const source = ref<string>('text')
const textValue = ref<string>('')
const expand = ref<string>('None')
const showFormat = ref<boolean>(true)
const codeEditorRef = ref<HTMLTextAreaElement | null>(null)

// ====== 来自 store ======
const context = computed(() => reportStore.getContext)
const isCellUpdate = computed(() => reportStore.getIsCellUpdate)

// ====== 选项 ======
const formatOptions = computed<SelectOption[]>(() => [
  { value: 'AZTEC', label: 'AZTEC' },
  { value: 'CODABAR', label: 'CODABAR' },
  { value: 'CODE_39', label: 'CODE_39' },
  { value: 'CODE_93', label: 'CODE_93' },
  { value: 'CODE_128', label: 'CODE_128' },
  { value: 'DATA_MATRIX', label: 'DATA_MATRIX' },
  { value: 'EAN_8', label: 'EAN_8' },
  { value: 'EAN_13', label: 'EAN_13' },
  { value: 'ITF', label: 'ITF' },
  { value: 'PDF_417', label: 'PDF_417' },
  { value: 'UPC_E', label: 'UPC_E' },
  { value: 'UPC_A', label: 'UPC_A' }
])

const sourceOptions = computed<SelectOption[]>(() => [
  { value: 'text', label: t('property.zxing.text') },
  { value: 'expression', label: t('property.zxing.expr') }
])

const expandOptions = computed<SelectOption[]>(() => [
  { value: 'Down', label: t('property.zxing.down') },
  { value: 'Right', label: t('property.zxing.right') },
  { value: 'None', label: t('property.zxing.noneExpand') }
])

const cellPosition = computed<string>(() => `${props.rowIndex},${props.colIndex}`)

/** 构建脚本校验函数 */
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

  // 确保编辑器正确渲染
  nextTick(() => {
    if (codeMirror.value) {
      codeMirror.value.refresh()
    }
  })
  codeMirror.value.setSize('auto', '120px')

  // 监听内容变化
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
    setDirty()
  })

  // 加载初始数据
  loadCellData()
}

/** 加载单元格数据 */
const loadCellData = (): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (!cellDef || !cellDef.value) return

  // 设置宽度
  width.value = cellDef.value.width ?? null

  // 设置高度
  height.value = cellDef.value.height ?? null

  // 设置格式
  format.value = cellDef.value.format || 'QR_CODE'

  // 设置数据源
  source.value = cellDef.value.source || 'text'

  // 设置文本值
  textValue.value = cellDef.value.value || ''

  // 设置展开选项
  expand.value = cellDef.expand || 'None'

  // 根据类型决定是否显示格式选项
  showFormat.value = cellDef.value.category !== 'qrcode'

  // 如果是表达式模式，初始化编辑器并设置值
  if (source.value === 'expression') {
    nextTick(() => {
      if (!codeMirror.value) {
        initCodeEditor()
      } else {
        let valueToSet = cellDef.value.value || ''
        if (valueToSet === 'undefined') {
          valueToSet = ''
        }
        loadingCellData.value = true
        codeMirror.value.setValue(valueToSet)
        loadingCellData.value = false
        codeMirror.value.refresh()
      }
    })
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

onBeforeUnmount(() => {
  if (codeMirror.value) {
    codeMirror.value.toTextArea()
    codeMirror.value = null
  }
})

/** 处理宽度变化 */
const handleWidthChange = (): void => {
  if (width.value === null || isNaN(width.value)) {
    showAlert(t('property.zxing.numberTip'))
    return
  }
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (cellDef && cellDef.value) {
    const newCellDef = deepCopy(cellDef)
    newCellDef.value.width = width.value
    setCell(props.rowIndex, props.colIndex, newCellDef)
    const hot = TableManager.get()
    if (hot) {
      hot.render()
    }
  }
  setDirty()
}

/** 处理高度变化 */
const handleHeightChange = (): void => {
  if (height.value === null || isNaN(height.value)) {
    showAlert(t('property.zxing.numberTip'))
    return
  }
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (cellDef && cellDef.value) {
    const newCellDef = deepCopy(cellDef)
    newCellDef.value.height = height.value
    setCell(props.rowIndex, props.colIndex, newCellDef)
    const hot = TableManager.get()
    if (hot) {
      hot.render()
    }
  }
  setDirty()
}

/** 处理格式变化 */
const handleFormatChange = (): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (cellDef && cellDef.value) {
    const newCellDef = deepCopy(cellDef)
    newCellDef.value.format = format.value
    setCell(props.rowIndex, props.colIndex, newCellDef)
  }
  setDirty()
}

/** 处理数据源变化 */
const handleSourceChange = (): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (cellDef && cellDef.value) {
    const newCellDef = deepCopy(cellDef)
    newCellDef.value.source = source.value
    setCell(props.rowIndex, props.colIndex, newCellDef)

    // 根据数据源类型初始化编辑器
    if (source.value === 'expression') {
      nextTick(() => {
        if (!codeMirror.value) {
          initCodeEditor()
        } else {
          const currentCellDef = getCell(props.rowIndex, props.colIndex)
          loadingCellData.value = true
          codeMirror.value.setValue(currentCellDef.value.value || '')
          loadingCellData.value = false
          codeMirror.value.refresh()
        }
      })
    }
  }
  setDirty()
}

/** 处理文本变化 */
const handleTextChange = (): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (cellDef && cellDef.value) {
    const newCellDef = deepCopy(cellDef)
    newCellDef.value.value = textValue.value
    setCell(props.rowIndex, props.colIndex, newCellDef)
  }
  setDirty()
}

/** 处理展开选项变化 */
const handleExpandChange = (expandValue: string): void => {
  const hot = TableManager.get()
  if (!hot) return
  expand.value = expandValue

  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (cellDef) {
    const newCellDef = deepCopy(cellDef)
    newCellDef.expand = expandValue
    setCell(props.rowIndex, props.colIndex, newCellDef)
  }

  hot.render()
  setDirty()
}
</script>

<style scoped>
.zxing-value-editor {
  width: 100%;
}
</style>
