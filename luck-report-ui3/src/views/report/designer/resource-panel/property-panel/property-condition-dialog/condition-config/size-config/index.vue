<template>
  <div>
    <a-row class="condition-config-row" align="middle">
      <a-col :span="8">
        <a-checkbox v-model:checked="rowHeightChecked" @change="onRowHeightChange">
          {{ t('dialog.propCondition.rowHeight') }}
        </a-checkbox>
      </a-col>
      <a-col :span="8">
        <a-input-number
            v-show="rowHeightChecked"
            v-model:value="localRowHeight"
            :min="1"
            @change="onRowHeightValueChange"
        />
      </a-col>
      <a-col :span="8">
      </a-col>
    </a-row>

    <a-row class="condition-config-row" align="middle">
      <a-col :span="8">
        <a-checkbox v-model:checked="colWidthChecked" @change="onColWidthChange">
          {{ t('dialog.propCondition.colWidth') }}
        </a-checkbox>
      </a-col>
      <a-col :span="8">
        <a-input-number
            v-show="colWidthChecked"
            v-model:value="localColWidth"
            :min="1"
            @change="onColWidthValueChange"
        />
      </a-col>
      <a-col :span="8">
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
/**
 * SizeConfig 行列宽高条件配置（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - u-row/u-col/u-checkbox/u-input-number（自定义）→ a-row/a-col/a-checkbox/a-input-number
 * - 选中态对齐使用 v-model:checked / v-model:value
 */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'SizeConfig' })


const { t } = useI18n()
const props = withDefaults(
  defineProps<{
    rowHeight?: number | null
    colWidth?: number | null
  }>(),
  {
    rowHeight: null,
    colWidth: null
  }
)

const emit = defineEmits<{
  (
    e: 'size-change',
    payload: {
      type: 'rowHeight' | 'colWidth'
      checked: boolean
      value: number | null
    }
  ): void
}>()

const rowHeightChecked = ref<boolean>(false)
const localRowHeight = ref<number>(0)

const colWidthChecked = ref<boolean>(false)
const localColWidth = ref<number>(0)

const loadRowHeight = (rowHeight?: number | null): void => {
  rowHeightChecked.value = rowHeight !== null && rowHeight !== undefined && rowHeight !== -1
  localRowHeight.value = rowHeightChecked.value ? (rowHeight as number) : 0
}

const loadColWidth = (colWidth?: number | null): void => {
  colWidthChecked.value = colWidth !== null && colWidth !== undefined && colWidth !== -1
  localColWidth.value = colWidthChecked.value ? (colWidth as number) : 0
}

watch(
  () => props.rowHeight,
  (newVal) => {
    loadRowHeight(newVal)
  },
  { immediate: true }
)

watch(
  () => props.colWidth,
  (newVal) => {
    loadColWidth(newVal)
  },
  { immediate: true }
)

const onRowHeightChange = (): void => {
  emit('size-change', {
    type: 'rowHeight',
    checked: rowHeightChecked.value,
    value: rowHeightChecked.value ? localRowHeight.value : null
  })
}

const onRowHeightValueChange = (): void => {
  if (rowHeightChecked.value) {
    emit('size-change', {
      type: 'rowHeight',
      checked: true,
      value: localRowHeight.value
    })
  }
}

const onColWidthChange = (): void => {
  emit('size-change', {
    type: 'colWidth',
    checked: colWidthChecked.value,
    value: colWidthChecked.value ? localColWidth.value : null
  })
}

const onColWidthValueChange = (): void => {
  if (colWidthChecked.value) {
    emit('size-change', {
      type: 'colWidth',
      checked: true,
      value: localColWidth.value
    })
  }
}
</script>
