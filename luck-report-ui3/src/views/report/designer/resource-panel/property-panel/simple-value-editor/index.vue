<template>
  <div class="simple-value-editor">

    <div class="property-quote">
      {{ t('property.simple.config') }}
    </div>

    <a-form :label-col="{ style: { width: '100px' } }" :colon="false">
      <a-form-item class="property-label" :label="t('property.simple.lineHeight')">
        <a-input-number
          v-model:value="lineHeight"
          :min="1"
          @change="onLineHeightChange"
          :placeholder="t('property.simple.tip')"
        />
      </a-form-item>
      <a-form-item class="property-label" :label="t('property.simple.content')">
        <a-textarea
          v-model:value="content"
          @input="onContentChange"
          style="width: 220px;"
          :rows="3"
        />
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
/**
 * SimpleValueEditor 简单值编辑器（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. cellPosition 变化或 isCellUpdate=true → loadCellData 回填
 * 2. 用户编辑 content / lineHeight → 写回 cellDef + 调用 hot.setDataAtCell 触发渲染
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UForm/UFormItem/UInputNumber（自定义）→ a-form/a-form-item/a-input-number
 * - 原生 <textarea> → a-textarea
 * - Vuex mapGetters/mapActions → useReportStore (Pinia) 组合式 API
 * - this.setCellUpdate(false) → reportStore.setCellUpdate(false)
 * - 数字输入框的 @change 接受 number|undefined（a-input-number 行为）
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { setDirty } from '@/utils/table'
import { deepCopy } from '@/utils/comnon'
import { setCell, getCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import { useReportStore } from '@/store/modules/report'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'SimpleValueEditor' })


const { t } = useI18n()
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

// ====== 状态：表单双向绑定 ======
const content = ref<string>('')
const lineHeight = ref<number | null>(null)

// ====== 来自 store 的派生值 ======
const context = computed(() => reportStore.getContext)
const isCellUpdate = computed(() => reportStore.getIsCellUpdate)

const cellPosition = computed<string>(() => `${props.rowIndex},${props.colIndex}`)

/** 回填 content/lineHeight */
const loadCellData = (): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (!cellDef) {
    content.value = ''
    lineHeight.value = null
    return
  }

  if (cellDef.value && cellDef.value.value !== undefined) {
    content.value = cellDef.value.value
  } else {
    content.value = ''
  }

  if (cellDef.cellStyle && cellDef.cellStyle.lineHeight !== undefined) {
    lineHeight.value = cellDef.cellStyle.lineHeight
  } else {
    lineHeight.value = null
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

onMounted(() => {
  // loadCellData 由 watch(cellPosition, immediate) 触发
})

onBeforeUnmount(() => {
  // 无需卸载额外资源
})

const onContentChange = (): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  const newCellDef = deepCopy(cellDef)

  if (newCellDef) {
    if (!newCellDef.value) {
      newCellDef.value = { type: 'simple', value: '' }
    }
    newCellDef.value.type = 'simple'
    newCellDef.value.value = content.value
    setCell(props.rowIndex, props.colIndex, newCellDef)
  }

  const hot = TableManager.get()
  if (hot && props.rowIndex !== null && props.colIndex !== null) {
    hot.setDataAtCell(props.rowIndex, props.colIndex, content.value)
  }

  setDirty()
}

const onLineHeightChange = (val: number | string | null): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  const newCellDef = deepCopy(cellDef)

  if (newCellDef) {
    if (!newCellDef.cellStyle) {
      newCellDef.cellStyle = {}
    }

    // a-input-number 传出来的值是 number|string|null，统一存 number|'' 形态
    const newValue: number | '' = (val === null || val === '' || val === undefined)
      ? ''
      : (typeof val === 'number' ? val : Number(val))

    newCellDef.cellStyle.lineHeight = newValue

    const hot = TableManager.get()
    if (hot) {
      const td = hot.getCell(props.rowIndex, props.colIndex)
      if (td) {
        if (newValue === '') {
          td.style.lineHeight = ''
        } else {
          td.style.lineHeight = String(newValue)
        }
        hot.render()
      }
    }

    setDirty()
    setCell(props.rowIndex, props.colIndex, newCellDef)
  }
}
</script>

<style scoped>
.simple-value-editor {
  width: 100%;
}
</style>
