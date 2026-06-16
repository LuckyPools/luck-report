<template>
  <div>
    <a-row class="condition-config-row" align="middle">
      <a-col :span="8">
        <a-checkbox v-model:checked="alignChecked" @change="onAlignChange">
          {{ t('dialog.propCondition.align') }}
        </a-checkbox>
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="alignChecked"
            v-model:value="align"
            @change="onAlignValueChange"
            style="width: 120px"
            :options="alignOptions"
        />
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="alignChecked"
            v-model:value="alignScope"
            @change="onAlignScopeChange"
            style="width: 120px"
            :options="scopeOptions"
        />
      </a-col>
    </a-row>

    <a-row class="condition-config-row" align="middle">
      <a-col :span="8">
        <a-checkbox v-model:checked="valignChecked" @change="onValignChange">
          {{ t('dialog.propCondition.valign') }}
        </a-checkbox>
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="valignChecked"
            v-model:value="valign"
            @change="onValignValueChange"
            style="width: 120px"
            :options="valignOptions"
        />
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="valignChecked"
            v-model:value="valignScope"
            @change="onValignScopeChange"
            style="width: 120px"
            :options="scopeOptions"
        />
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
/**
 * AlignConfig 对齐方式条件配置（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - u-row/u-col/u-checkbox/u-select/u-option（自定义）→ a-row/a-col/a-checkbox/a-select
 * - 选中态对齐使用 v-model:checked / v-model:value
 */
import { ref, watch, onMounted } from 'vue'
import configOptions from '../constants/config-options'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'AlignConfig' })


const { t } = useI18n()
interface CellStyle {
  align?: string
  alignScope?: string
  valign?: string
  valignScope?: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    cellStyle?: CellStyle | null
  }>(),
  {
    cellStyle: () => ({})
  }
)

const emit = defineEmits<{
  (
    e: 'align-change',
    payload: {
      type: 'align' | 'valign'
      checked: boolean
      value: string | null
      scope: string | null
    }
  ): void
}>()

const alignChecked = ref<boolean>(false)
const align = ref<string>('')
const alignScope = ref<string>('cell')

const valignChecked = ref<boolean>(false)
const valign = ref<string>('')
const valignScope = ref<string>('cell')

const alignOptions = ref<{ value: string; label: string }[]>([])
const valignOptions = ref<{ value: string; label: string }[]>([])
const scopeOptions = ref<{ value: string; label: string }[]>([])

/**
 * 加载对齐属性
 */
const loadAlignProperties = (cellStyle?: CellStyle | null): void => {
  if (!cellStyle) return

  alignChecked.value = !!(cellStyle.align && cellStyle.align !== '')
  align.value = alignChecked.value ? (cellStyle.align as string) : ''
  alignScope.value = cellStyle.alignScope || 'cell'

  valignChecked.value = !!(cellStyle.valign && cellStyle.valign !== '')
  valign.value = valignChecked.value ? (cellStyle.valign as string) : ''
  valignScope.value = cellStyle.valignScope || 'cell'
}

onMounted(() => {
  alignOptions.value = configOptions.getAlignOptions()
  valignOptions.value = configOptions.getValignOptions()
  scopeOptions.value = configOptions.getScopeOptions()
})

watch(
  () => props.cellStyle,
  (newVal) => {
    loadAlignProperties(newVal)
  },
  { immediate: true, deep: true }
)

const onAlignChange = (): void => {
  emit('align-change', {
    type: 'align',
    checked: alignChecked.value,
    value: alignChecked.value ? 'center' : null,
    scope: alignChecked.value ? 'cell' : null
  })
}

const onAlignValueChange = (): void => {
  emit('align-change', {
    type: 'align',
    checked: alignChecked.value,
    value: align.value,
    scope: alignScope.value
  })
}

const onAlignScopeChange = (): void => {
  emit('align-change', {
    type: 'align',
    checked: alignChecked.value,
    value: align.value,
    scope: alignScope.value
  })
}

const onValignChange = (): void => {
  emit('align-change', {
    type: 'valign',
    checked: valignChecked.value,
    value: valignChecked.value ? 'middle' : null,
    scope: valignChecked.value ? 'cell' : null
  })
}

const onValignValueChange = (): void => {
  emit('align-change', {
    type: 'valign',
    checked: valignChecked.value,
    value: valign.value,
    scope: valignScope.value
  })
}

const onValignScopeChange = (): void => {
  emit('align-change', {
    type: 'valign',
    checked: valignChecked.value,
    value: valign.value,
    scope: valignScope.value
  })
}
</script>
