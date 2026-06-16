<template>
  <div class="image-value-editor" ref="container">

    <div class="property-quote">
      {{ t('property.image.config') }}
    </div>

    <a-form :label-col="{ style: { width: '100px' } }" :colon="false">
      <a-form-item class="property-label" :label="t('property.image.width') + '(px)'">
        <a-input-number
          :placeholder="t('property.image.widthPlaceholder')"
          v-model:value="width"
          :min="1"
          @change="handleWidthChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.image.height') + '(px)'">
        <a-input-number
          :placeholder="t('property.image.heightPlaceholder')"
          v-model:value="height"
          :min="1"
          @change="handleHeightChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.image.source')">
        <a-select
          v-model:value="source"
          style="width: 250px"
          :options="sourceOptions"
          @change="handleSourceChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('property.image.expand')" v-show="source === 'expression'">
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

      <a-form-item class="property-label" :label="t('property.image.p')" v-show="source === 'text'">
        <a-input
          :title="t('property.image.tip')"
          :placeholder="t('property.image.tip')"
          allow-clear
          style="width: 250px;"
          v-model:value="path"
          @blur="handlePathChange"
        />
      </a-form-item>

      <div v-show="source === 'expression'">
        <a-form-item class="property-label" :label="t('property.image.expr')">
        </a-form-item>
        <div style="border: solid 1px #eeeeee;">
          <CodeMirror v-model="codeValue" :basic-setup="true" :height="120" />
        </div>
      </div>
    </a-form>
  </div>
</template>

<script setup lang="ts">
/**
 * ImageValueEditor 图片值编辑器（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. cellPosition 变化或 isCellUpdate=true → loadCellData 回填
 * 2. source=text → 直接编辑 path；source=expression → CodeMirror 编辑 value.value
 * 3. width/height/source/path/expand 写回 cellDef.value
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UForm/UFormItem/USelect/UOption/URadioGroup/URadio/UInputNumber/UInput（自定义）→ a-form/a-form-item/a-select/a-radio-group/a-radio/a-input-number/a-input
 * - a-input-number 的 v-model:value 是 number|null
 * - this.$refs.codeEditor → ref<HTMLTextAreaElement | null>(null)
 * - Vuex mapGetters/mapActions → useReportStore (Pinia)
 */
import { ref, computed, watch, nextTick } from 'vue'
import CodeMirror from '@/components/code-mirror/index.vue'
import { setDirty } from '@/utils/table'
import { deepCopy } from '@/utils/comnon'
import { getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import { useReportStore } from '@/store/modules/report'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ImageValueEditor' })


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
const codeValue = ref<string>('')
const loadingCellData = ref<boolean>(false)
const width = ref<number | null>(null)
const height = ref<number | null>(null)
const source = ref<string>('text')
const path = ref<string>('')
const expand = ref<string>('None')

// ====== 来自 store ======
const context = computed(() => reportStore.getContext)
const isCellUpdate = computed(() => reportStore.getIsCellUpdate)

// ====== 选项 ======
const sourceOptions = computed<SelectOption[]>(() => [
  { value: 'text', label: t('property.image.path') },
  { value: 'expression', label: t('property.image.expr') }
])

const expandOptions = computed<SelectOption[]>(() => [
  { value: 'Down', label: t('property.image.down') },
  { value: 'Right', label: t('property.image.right') },
  { value: 'None', label: t('property.image.noneExpand') }
])

const cellPosition = computed<string>(() => `${props.rowIndex},${props.colIndex}`)

/** 加载单元格数据 */
const loadCellData = (): void => {
  const currentCellDef = getCell(props.rowIndex, props.colIndex)
  if (!currentCellDef || !currentCellDef.value) return

  loadingCellData.value = true

  width.value = currentCellDef.value.width ?? null
  height.value = currentCellDef.value.height ?? null
  source.value = currentCellDef.value.source || 'text'

  path.value = ''
  if (source.value === 'text') {
    path.value = currentCellDef.value.value || ''
  } else {
    let valueToSet = currentCellDef.value.value || ''
    if (valueToSet === 'undefined') {
      valueToSet = ''
    }
    codeValue.value = valueToSet
  }

  expand.value = currentCellDef.expand || 'None'

  nextTick(() => {
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

// 编辑器内容变化 → 写回 cellDef
watch(codeValue, (val) => {
  if (loadingCellData.value) return
  if (val === 'undefined' || val === undefined || val === null) return
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (cellDef && cellDef.value) {
    const newCellDef = deepCopy(cellDef)
    newCellDef.value.value = val
    setCell(props.rowIndex, props.colIndex, newCellDef)
  }
  setDirty()
})

const handleWidthChange = (): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (cellDef && cellDef.value) {
    const newCellDef = deepCopy(cellDef)
    newCellDef.value.width = width.value
    setCell(props.rowIndex, props.colIndex, newCellDef)
  }
  setDirty()
}

const handleHeightChange = (): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (cellDef && cellDef.value) {
    const newCellDef = deepCopy(cellDef)
    newCellDef.value.height = height.value
    setCell(props.rowIndex, props.colIndex, newCellDef)
  }
  setDirty()
}

const handleSourceChange = (): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (cellDef && cellDef.value) {
    const newCellDef = deepCopy(cellDef)
    newCellDef.value.source = source.value
    setCell(props.rowIndex, props.colIndex, newCellDef)
  }
  setDirty()
}

const handlePathChange = (): void => {
  if (path.value) {
    path.value = path.value.trim()
  }
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (cellDef && cellDef.value) {
    const newCellDef = deepCopy(cellDef)
    newCellDef.value.value = path.value
    setCell(props.rowIndex, props.colIndex, newCellDef)
  }
  setDirty()
}

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
      if (type === 'dataset' || type === 'expression' || type === 'image') {
        const newCellDef = deepCopy(cellDef)
        newCellDef.expand = expandValue
        setCell(i, j, newCellDef)
      }
    }
  }
  hot.render()
  setDirty()
}
</script>

<style scoped>
.image-value-editor {
  width: 100%;
}
</style>
