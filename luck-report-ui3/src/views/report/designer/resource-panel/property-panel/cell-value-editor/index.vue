<template>
  <div class="cell-value-editor">
    <a-form :label-col="{ style: { width: '100px' } }" :colon="false">

      <!-- 父单元格配置 -->
      <div v-show="showParentGroup" ref="parentGroup">
        <a-form-item class="property-label parent-cell" :label="t('property.prop.leftParent')">
          <a-radio-group
            v-model:value="leftParentType"
            @change="handleLeftParentTypeChange"
          >
            <a-radio
              v-for="option in parentTypeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item class="property-label">
          <a-select
            v-model:value="leftParentCellName"
            :disabled="leftParentType !== 'custom'"
            @change="handleLeftParentCellNameChange"
            style="width: 100px"
            :options="leftParentCellNameOptions"
            show-search
            :filter-option="filterOption"
          />
          <a-select
            v-model:value="leftParentRowNumber"
            :disabled="leftParentType !== 'custom' || leftParentCellName === 'root'"
            @change="handleLeftParentRowNumberChange"
            style="margin-left: 10px; width: 100px"
            :options="leftParentRowNumberOptions"
            show-search
            :filter-option="filterOption"
          />
        </a-form-item>

        <a-form-item class="property-label parent-cell" :label="t('property.prop.topParent')">
          <a-radio-group
            v-model:value="topParentType"
            @change="handleTopParentTypeChange"
          >
            <a-radio
              v-for="option in parentTypeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item class="property-label">
          <a-select
            v-model:value="topParentCellName"
            :disabled="topParentType !== 'custom'"
            @change="handleTopParentCellNameChange"
            style="width: 100px"
            :options="topParentCellNameOptions"
            show-search
            :filter-option="filterOption"
          />
          <a-select
            v-model:value="topParentRowNumber"
            :disabled="topParentType !== 'custom' || topParentCellName === 'root'"
            @change="handleTopParentRowNumberChange"
            style="margin-left: 10px; width: 100px"
            :options="topParentRowNumberOptions"
            show-search
            :filter-option="filterOption"
          />
        </a-form-item>
      </div>

      <!-- 渲染器配置 -->
      <div v-show="showRendererGroup" ref="rendererGroup" class="form-group" style="margin-bottom: 6px;">
        <label>{{ t('property.prop.renderBean') }}：</label>
        <div class="input-group" style="width: 290px; display: inline-block; height: 22px;">
          <div class="u-inline">
            <a-input
              v-model:value="rendererBean"
              style="width: 250px"
              @change="(e) => handleRendererChange((e.target as HTMLInputElement).value)"
            />
          </div>
          <span class="input-group-btn">
            <a-button @click="handleSelectRenderer">
              {{ t('property.prop.selectBean') }}
            </a-button>
          </span>
        </div>
      </div>

      <!-- 链接配置 -->
      <div v-show="showLinkGroup">
        <div class="property-quote">
          {{ t('property.prop.linkConfig') }}
        </div>

        <a-form-item class="property-label" :label="t('property.prop.linkUrl')">
          <a-input
            v-model:value="linkUrl"
            allow-clear
            :placeholder="linkUrlPlaceholder"
            style="width: 250px;"
            @change="(e) => handleLinkUrlChange((e.target as HTMLInputElement).value)"
          />
        </a-form-item>

        <a-form-item class="property-label" :label="t('property.prop.target')">
          <a-select
            v-model:value="linkTarget"
            @change="handleLinkTargetChange"
            style="width: 120px"
            :options="linkTargetOptions"
          />

          <a-button
            type="primary"
            style="margin-left: 10px;"
            @click="handleUrlParameterConfig"
          >
            {{ t('property.prop.urlParameterConfig') }}
          </a-button>
        </a-form-item>
      </div>

      <!-- 单元格类型 -->
      <a-form-item class="property-label" v-show="showTypeGroup" :label="t('property.prop.cellType')">
        <a-select
          v-model:value="cellType"
          @change="handleCellTypeChange"
          style="width: 250px"
          :options="cellTypeOptions"
        />
      </a-form-item>

    </a-form>

    <!-- URL 参数对话框 -->
    <URLParameterDialog
      v-model:visible="urlParameterDialogVisible"
      :parameters="linkParameters"
      @parameters-change="handleLinkParametersChange"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * CellValueEditor 单元格值编辑器（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 父组件传入 show*Group 控制不同分组显隐 + rowIndex/colIndex 定位单元格
 * 2. cellPosition (rowIndex,colIndex) 变化 → buildParentCellNameOptions/buildParentRowNumberOptions/updateLinkParameters
 * 3. 用户修改表单 → 同步写回 context 中的 cellDef
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UForm/UFormItem/USelect/UOption/URadioGroup/URadio/UInput/UButton（自定义）→ a-form/a-form-item/a-select/a-radio-group/a-radio/a-input/a-button
 * - 虚拟滚动 select(virtual/virtual-options) → a-select 直接用 options
 * - watch 中调用实例方法 → 函数式定义 + watch
 * - USelect 的 @change 接受 value（自定义）→ a-select @change 直接传 value
 * - UInput 的 @change 接受 value（自定义）→ a-input @change 传 event，需 .target.value
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { showAlert, deepCopy } from '@/utils/comnon'
import { setDirty } from '@/utils/table'
import { getCell, getCellName, setCell } from '@/utils/contextActions'
import URLParameterDialog, { type UrlParameterItem } from '../url-parameter-dialog/index.vue'
import TableManager from '@/views/report/designer/edit-table/manager'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'CellValueEditor' })


const { t } = useI18n()
interface SelectOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    showParentGroup?: boolean
    showRendererGroup?: boolean
    showLinkGroup?: boolean
    showTypeGroup?: boolean
    rowIndex?: number
    colIndex?: number
  }>(),
  {
    showParentGroup: false,
    showRendererGroup: false,
    showLinkGroup: false,
    showTypeGroup: false,
    rowIndex: 0,
    colIndex: 0
  }
)

const emit = defineEmits<{
  (e: 'select-renderer'): void
  (e: 'cell-type-change', value: string): void
}>()

// ====== 状态：表单双向绑定 ======
const urlParameterDialogVisible = ref<boolean>(false)
const leftParentCellNameOptions = ref<SelectOption[]>([])
const leftParentRowNumberOptions = ref<SelectOption[]>([])
const topParentCellNameOptions = ref<SelectOption[]>([])
const topParentRowNumberOptions = ref<SelectOption[]>([])
const leftParentType = ref<string>('default')
const topParentType = ref<string>('default')
const leftParentCellName = ref<string>('')
const leftParentRowNumber = ref<string>('')
const topParentCellName = ref<string>('')
const topParentRowNumber = ref<string>('')
const rendererBean = ref<string>('')
const linkUrl = ref<string>('')
const linkTarget = ref<string>('_blank')
const cellType = ref<string>('simple')
const linkParameters = ref<UrlParameterItem[]>([])

// ====== 计算属性 ======
const parentTypeOptions = computed<SelectOption[]>(() => [
  { label: t('property.prop.default'), value: 'default' },
  { label: t('property.prop.custom'), value: 'custom' }
])

const linkTargetOptions = computed<SelectOption[]>(() => [
  { label: t('property.prop.newWindow'), value: '_blank' },
  { label: t('property.prop.currentWindow'), value: '_self' },
  { label: t('property.prop.parentWindow'), value: '_parent' },
  { label: t('property.prop.topWindow'), value: '_top' }
])

const linkUrlPlaceholder = computed(() =>
  t('property.prop.urlExpressionSupport', { wrapper: '${...}' })
  + t('property.prop.urlExpressionExample', { example: "${# == '1' ? 'a.html' : 'b.html'}" })
)

const cellTypeOptions = computed<SelectOption[]>(() => [
  { label: t('property.prop.text'), value: 'simple' },
  { label: t('property.prop.expr'), value: 'expression' },
  { label: t('property.prop.dataset'), value: 'dataset' },
  { label: t('property.prop.image'), value: 'image' },
  { label: t('property.prop.slash'), value: 'slash' },
  { label: t('property.prop.qrcode'), value: 'qrcode' },
  { label: t('property.prop.barcode'), value: 'barcode' },
  { label: t('property.prop.chart'), value: 'chart' }
])

const cellPosition = computed<string>(() => `${props.rowIndex},${props.colIndex}`)

// ====== a-select 搜索过滤 ======
const filterOption = (input: string, option: SelectOption | undefined): boolean => {
  if (!option) return false
  return option.label.toString().toLowerCase().includes(input.toLowerCase())
}

// ====== 监听：cellPosition 变化时重建选项 ======
watch(cellPosition, () => {
  buildParentCellNameOptions()
  buildParentRowNumberOptions()
  updateLinkParameters()
})

onMounted(() => {
  buildParentCellNameOptions()
  buildParentRowNumberOptions()
  updateLinkParameters()
})

onBeforeUnmount(() => {
  // 无需卸载额外资源
})

// ====== 工具：解析单元格名（如 A1 → { name: 'A', num: '1' }） ======
const parseCellName = (cellName: string): { name: string; num: string } => {
  let pos = -1
  for (let i = 0; i < cellName.length; i++) {
    const char = cellName.charAt(i)
    const num = parseInt(char)
    if (!isNaN(num)) {
      pos = i
      break
    }
  }
  if (pos === -1) {
    return { name: cellName, num: '' }
  }
  const name = cellName.substring(0, pos)
  const num = cellName.substring(pos, cellName.length)
  return { name, num: num.toString() }
}

interface TableCell {
  style?: {
    display?: string
    [key: string]: string | undefined
  }
  [key: string]: unknown
}

const isCellHidden = (td: unknown): boolean => {
  if (!td || typeof td !== 'object') return false
  const cell = td as TableCell
  return Boolean(cell.style && cell.style.display === 'none')
}

const updateLinkParameters = (): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (cellDef && cellDef.linkParameters) {
    linkParameters.value = cellDef.linkParameters
  } else {
    linkParameters.value = []
  }
}

const buildParentCellNameOptions = (): void => {
  const hot = TableManager.get()
  if (!hot) return
  const countCols = hot.countCols()
  const cellDef = getCell(props.rowIndex, props.colIndex)

  const leftOptions: SelectOption[] = [{ value: 'root', label: t('property.prop.none') }]
  const topOptions: SelectOption[] = [{ value: 'root', label: t('property.prop.none') }]

  for (let j = 0; j < countCols; j++) {
    const name = getCellName(null, j)
    leftOptions.push({ value: name, label: name })
    topOptions.push({ value: name, label: name })
  }
  leftParentCellNameOptions.value = leftOptions
  topParentCellNameOptions.value = topOptions

  // 左父单元格
  if (cellDef && cellDef.leftParentCellName) {
    leftParentType.value = 'custom'
    const name = cellDef.leftParentCellName
    if (name === 'root') {
      leftParentCellName.value = 'root'
      leftParentRowNumber.value = ''
    } else {
      const data = parseCellName(name)
      leftParentCellName.value = data.name
      leftParentRowNumber.value = data.num
    }
  } else {
    leftParentType.value = 'default'
    if (props.colIndex === 0) {
      leftParentCellName.value = 'root'
      leftParentRowNumber.value = ''
    } else {
      let row = props.rowIndex
      let col = props.colIndex - 1
      const td = hot.getCell(row, col)
      if (isCellHidden(td)) {
        const mergeCells = hot.getSettings().mergeCells
        for (const item of mergeCells) {
          const rowStart = item.row, rowspan = item.rowspan, colStart = item.col, colspan = item.colspan
          const rowEnd = rowStart + rowspan - 1, colEnd = colStart + colspan - 1
          if (row >= rowStart && row <= rowEnd && col >= colStart && col <= colEnd) {
            row = rowStart
            col = colStart
            break
          }
        }
      }
      const cellName = getCellName(row, col)
      const data = parseCellName(cellName)
      leftParentCellName.value = data.name
      leftParentRowNumber.value = data.num
    }
  }

  // 父上单元格
  if (cellDef && cellDef.topParentCellName) {
    topParentType.value = 'custom'
    const name = cellDef.topParentCellName
    if (name === 'root') {
      topParentCellName.value = 'root'
      topParentRowNumber.value = ''
    } else {
      const data = parseCellName(name)
      topParentCellName.value = data.name
      topParentRowNumber.value = data.num
    }
  } else {
    topParentType.value = 'default'
    if (props.rowIndex === 0) {
      topParentCellName.value = 'root'
      topParentRowNumber.value = ''
    } else {
      let row = props.rowIndex - 1
      let col = props.colIndex
      const td = hot.getCell(row, col)
      if (isCellHidden(td)) {
        const mergeCells = hot.getSettings().mergeCells
        for (const item of mergeCells) {
          const rowStart = item.row, rowspan = item.rowspan, colStart = item.col, colspan = item.colspan
          const rowEnd = rowStart + rowspan - 1, colEnd = colStart + colspan - 1
          if (row >= rowStart && row <= rowEnd && col >= colStart && col <= colEnd) {
            row = rowStart
            col = colStart
            break
          }
        }
      }
      const cellName = getCellName(row, col)
      const data = parseCellName(cellName)
      topParentCellName.value = data.name
      topParentRowNumber.value = data.num
    }
  }

  // 渲染器
  if (cellDef && cellDef.cellStyle && cellDef.cellStyle.renderer) {
    rendererBean.value = cellDef.cellStyle.renderer
  } else {
    rendererBean.value = ''
  }

  // 链接
  if (cellDef) {
    linkUrl.value = cellDef.linkUrl || ''
    linkTarget.value = cellDef.linkTargetWindow || '_blank'
  } else {
    linkUrl.value = ''
    linkTarget.value = '_blank'
  }

  // 单元格类型
  if (cellDef && cellDef.value) {
    const type = cellDef.value.type || 'simple'
    if (type === 'zxing') {
      cellType.value = cellDef.value.category
    } else {
      cellType.value = type
    }
  } else {
    cellType.value = 'simple'
  }
}

const buildParentRowNumberOptions = (): void => {
  const hot = TableManager.get()
  if (!hot) return
  const countRows = hot.countRows()
  const leftOptions: SelectOption[] = []
  const topOptions: SelectOption[] = []
  for (let j = 0; j < countRows; j++) {
    leftOptions.push({ label: j + 1, value: String(j + 1) })
    topOptions.push({ label: j + 1, value: String(j + 1) })
  }
  leftParentRowNumberOptions.value = leftOptions
  topParentRowNumberOptions.value = topOptions
}

// ====== 父单元格：左 ======
const handleLeftParentTypeChange = (): void => {
  // a-radio-group 的 @change 传的是 event 对象，v-model 已把新值同步到 leftParentType
  if (leftParentType.value === 'default') {
    setParentCell(null, true)
    updateLeftParentToDefault()
  }
}

const updateLeftParentToDefault = (): void => {
  const hot = TableManager.get()
  if (!hot) return
  if (props.colIndex === 0) {
    leftParentCellName.value = 'root'
    leftParentRowNumber.value = ''
    return
  }
  let row = props.rowIndex
  let col = props.colIndex - 1
  const td = hot.getCell(row, col)
  if (isCellHidden(td)) {
    const mergeCells = hot.getSettings().mergeCells
    for (const item of mergeCells) {
      const rowStart = item.row, rowspan = item.rowspan, colStart = item.col, colspan = item.colspan
      const rowEnd = rowStart + rowspan - 1, colEnd = colStart + colspan - 1
      if (row >= rowStart && row <= rowEnd && col >= colStart && col <= colEnd) {
        row = rowStart
        col = colStart
        break
      }
    }
  }
  const cellName = getCellName(row, col)
  const data = parseCellName(cellName)
  leftParentCellName.value = data.name
  leftParentRowNumber.value = data.num
}

const handleLeftParentCellNameChange = (value: string): void => {
  if (value === 'root') {
    leftParentRowNumber.value = ''
    setParentCell('root', true)
  } else {
    const num = leftParentRowNumber.value
    if (value !== '' && num !== '') {
      setParentCell(value + num.toString(), true)
    }
  }
}

const handleLeftParentRowNumberChange = (value: string): void => {
  const name = leftParentCellName.value
  if (name === 'root') {
    setParentCell('root', true)
  } else {
    if (name !== '' && value !== '' && value !== null) {
      setParentCell(name + value.toString(), true)
    }
  }
}

// ====== 父单元格：上 ======
const handleTopParentTypeChange = (): void => {
  // a-radio-group 的 @change 传的是 event 对象，v-model 已把新值同步到 topParentType
  if (topParentType.value === 'default') {
    setParentCell(null, false)
    updateTopParentToDefault()
  }
}

const updateTopParentToDefault = (): void => {
  const hot = TableManager.get()
  if (!hot) return
  if (props.rowIndex === 0) {
    topParentCellName.value = 'root'
    topParentRowNumber.value = ''
    return
  }
  let row = props.rowIndex - 1
  let col = props.colIndex
  const td = hot.getCell(row, col)
  if (isCellHidden(td)) {
    const mergeCells = hot.getSettings().mergeCells
    for (const item of mergeCells) {
      const rowStart = item.row, rowspan = item.rowspan, colStart = item.col, colspan = item.colspan
      const rowEnd = rowStart + rowspan - 1, colEnd = colStart + colspan - 1
      if (row >= rowStart && row <= rowEnd && col >= colStart && col <= colEnd) {
        row = rowStart
        col = colStart
        break
      }
    }
  }
  const cellName = getCellName(row, col)
  const data = parseCellName(cellName)
  topParentCellName.value = data.name
  topParentRowNumber.value = data.num
}

const handleTopParentCellNameChange = (value: string): void => {
  if (value === 'root') {
    topParentRowNumber.value = ''
    setParentCell('root', false)
  } else {
    const num = topParentRowNumber.value
    if (value !== '' && num !== '') {
      setParentCell(value + num.toString(), false)
    }
  }
}

const handleTopParentRowNumberChange = (value: string): void => {
  const name = topParentCellName.value
  if (name === 'root') {
    setParentCell('root', false)
  } else {
    if (name !== '' && value !== '' && value !== null) {
      setParentCell(name + value.toString(), false)
    }
  }
}

const setParentCell = (parentCellName: string | null, isLeft: boolean): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (!cellDef) {
    return
  }
  const newCellDef = deepCopy(cellDef)
  if (isLeft) {
    newCellDef.leftParentCellName = parentCellName
  } else {
    newCellDef.topParentCellName = parentCellName
  }
  setCell(props.rowIndex, props.colIndex, newCellDef)
  setDirty()
}

// ====== 渲染器 ======
const handleRendererChange = (value: string): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (!cellDef) {
    return
  }
  const newCellDef = deepCopy(cellDef)
  if (!newCellDef.cellStyle) {
    newCellDef.cellStyle = {}
  }
  newCellDef.cellStyle.renderer = value
  setCell(props.rowIndex, props.colIndex, newCellDef)
  setDirty()
}

const handleSelectRenderer = (): void => {
  emit('select-renderer')
}

// ====== 链接 ======
const handleLinkUrlChange = (value: string): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (!cellDef) {
    return
  }
  const newCellDef = deepCopy(cellDef)
  newCellDef.linkUrl = value
  setCell(props.rowIndex, props.colIndex, newCellDef)
  setDirty()
}

const handleLinkTargetChange = (value: string): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (!cellDef) {
    return
  }
  const newCellDef = deepCopy(cellDef)
  newCellDef.linkTargetWindow = value
  setCell(props.rowIndex, props.colIndex, newCellDef)
  setDirty()
}

const handleUrlParameterConfig = (): void => {
  if (!linkUrl.value || linkUrl.value === '') {
    showAlert(t('property.prop.urlTip'))
    return
  }
  urlParameterDialogVisible.value = true
}

const handleLinkParametersChange = (value: UrlParameterItem[]): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (!cellDef) {
    return
  }
  const newCellDef = deepCopy(cellDef)
  newCellDef.linkParameters = value || []
  setCell(props.rowIndex, props.colIndex, newCellDef)
  setDirty()
  linkParameters.value = value || []
}

// ====== 单元格类型 ======
const handleCellTypeChange = (value: string): void => {
  emit('cell-type-change', value)
}
</script>

<style scoped>
.cell-value-editor {
  width: 100%;
}

.parent-cell {
  margin-bottom: 0 !important;
}
</style>
