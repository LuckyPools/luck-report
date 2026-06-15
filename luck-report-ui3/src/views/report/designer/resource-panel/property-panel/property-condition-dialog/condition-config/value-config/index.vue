<template>
  <div>
    <a-row class="condition-config-row" align="middle">
      <a-col :span="8">
        <a-checkbox v-model:checked="newValueChecked" @change="onNewValueChange">
          {{ t('dialog.propCondition.newValue') }}
        </a-checkbox>
      </a-col>
      <a-col :span="8">
        <a-input
            v-show="newValueChecked"
            v-model:value="localNewValue"
            style="width: 250px"
            :placeholder="t('dialog.propCondition.newValuePlaceholder')"
            @change="onNewValueInputChange"
        />
      </a-col>
    </a-row>

    <a-row class="condition-config-row" align="middle">
      <a-col :span="8">
        <a-checkbox v-model:checked="formatChecked" @change="onFormatChange">
          {{ t('dialog.propCondition.format') }}
        </a-checkbox>
      </a-col>
      <a-col :span="8">
        <a-auto-complete
            v-show="formatChecked"
            v-model:value="format"
            :options="suggestionList"
            style="width: 250px"
            @blur="onFormatInputChange"
        />
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
/**
 * ValueConfig 条件值/格式配置（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - u-row/u-col/u-checkbox/u-input（自定义）→ a-row/a-col/a-checkbox/a-input
 * - vue-simple-suggest（自动补全）→ a-auto-complete（antd 内置）
 * - v-model 全部迁移到 v-model:value
 */
import { ref, watch, onMounted } from 'vue'
import configOptions from '../constants/config-options'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ValueConfig' })


const { t } = useI18n()
interface CellStyle {
  format?: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    cellStyle?: CellStyle | null
    newValue?: string
  }>(),
  {
    cellStyle: () => ({}),
    newValue: ''
  }
)

const emit = defineEmits<{
  (
    e: 'value-change',
    payload: {
      type: 'newValue' | 'format'
      checked: boolean
      value: string | null
    }
  ): void
}>()

const newValueChecked = ref<boolean>(false)
const localNewValue = ref<string>('')

const formatChecked = ref<boolean>(false)
const format = ref<string>('')

const suggestionList = ref<{ value: string }[]>([])

onMounted(() => {
  suggestionList.value = configOptions.getSuggestionList().map((item) => ({ value: item }))
})

const loadValueProperties = (cellStyle?: CellStyle | null): void => {
  if (!cellStyle) return

  formatChecked.value = cellStyle.format != null
  format.value = formatChecked.value ? (cellStyle.format as string) : ''
}

watch(
  () => props.cellStyle,
  (newVal) => {
    loadValueProperties(newVal)
  },
  { immediate: true, deep: true }
)

watch(
  () => props.newValue,
  (newVal) => {
    if (newVal != null && newVal !== '') {
      newValueChecked.value = true
      if (newVal !== localNewValue.value) {
        localNewValue.value = newVal
      }
    } else if (newVal === null) {
      newValueChecked.value = false
      localNewValue.value = ''
    }
  },
  { immediate: true }
)

const onNewValueChange = (): void => {
  if (newValueChecked.value) {
    emit('value-change', {
      type: 'newValue',
      checked: true,
      value: localNewValue.value || ''
    })
  } else {
    emit('value-change', {
      type: 'newValue',
      checked: false,
      value: null
    })
  }
}

const onNewValueInputChange = (): void => {
  if (newValueChecked.value) {
    emit('value-change', {
      type: 'newValue',
      checked: true,
      value: localNewValue.value
    })
  }
}

const onFormatChange = (): void => {
  emit('value-change', {
    type: 'format',
    checked: formatChecked.value,
    value: formatChecked.value ? format.value : null
  })
}

const onFormatInputChange = (): void => {
  if (formatChecked.value) {
    emit('value-change', {
      type: 'format',
      checked: true,
      value: format.value
    })
  }
}
</script>
