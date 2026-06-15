<template>
  <div>
    <a-row class="condition-config-row" align="middle">
      <a-col :span="8">
        <a-checkbox v-model:checked="forceChecked" @change="onForceChange">
          {{ t('dialog.propCondition.forecolor') }}
        </a-checkbox>
      </a-col>
      <a-col :span="8">
        <u-color-picker
            v-show="forceChecked"
            v-model:value="forceColor"
            @change="onForceColorChange"
            show-text
            format="hex"
        />
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="forceChecked"
            v-model:value="forceScope"
            style="width: 120px"
            @change="onForceScopeChange"
            :options="scopeOptions"
        />
      </a-col>
    </a-row>

    <a-row class="condition-config-row" align="middle">
      <a-col :span="8">
        <a-checkbox v-model:checked="bgcolorChecked" @change="onBgcolorChange">
          {{ t('dialog.propCondition.bgcolor') }}
        </a-checkbox>
      </a-col>
      <a-col :span="8">
        <u-color-picker
            v-show="bgcolorChecked"
            v-model:value="bgColor"
            @change="onBgColorChange"
            show-text
            format="hex"
        />
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="bgcolorChecked"
            v-model:value="bgcolorScope"
            style="width: 120px"
            @change="onBgcolorScopeChange"
            :options="scopeOptions"
        />
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
/**
 * ColorConfig 颜色条件配置（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - u-row/u-col/u-checkbox/u-color-picker/u-select/u-option（自定义）→ a-row/a-col/a-checkbox/u-color-picker/a-select
 * - 颜色转换：hex ↔ rgb 字符串
 */
import { ref, watch, onMounted } from 'vue'
import { rgbToHex, hexToRgb } from '@/utils/color'
import configOptions from '../constants/config-options'
import { useI18n } from 'vue-i18n'
import UColorPicker from '@/components/color-picker/index.vue'

defineOptions({ name: 'ColorConfig' })


const { t } = useI18n()
interface CellStyle {
  forecolor?: string
  forecolorScope?: string
  bgcolor?: string
  bgcolorScope?: string
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
    e: 'color-change',
    payload: {
      type: 'forecolor' | 'bgcolor'
      checked: boolean
      value: string | null
      scope: string | null
    }
  ): void
}>()

const forceChecked = ref<boolean>(false)
const forceColor = ref<string>('#000000')
const forceScope = ref<string>('cell')

const bgcolorChecked = ref<boolean>(false)
const bgColor = ref<string>('#FFFFFF')
const bgcolorScope = ref<string>('cell')

const scopeOptions = ref<{ value: string; label: string }[]>([])

onMounted(() => {
  scopeOptions.value = configOptions.getScopeOptions()
})

watch(
  () => props.cellStyle,
  (newVal) => {
    loadColorProperties(newVal)
  },
  { immediate: true, deep: true }
)

const convertColorToRgb = (color: string): string | null => {
  if (!color) return null

  if (color.startsWith('#')) {
    return hexToRgb(color)
  } else if (color.length > 5 && color.startsWith('rgb')) {
    return color.substring(4, color.length - 1)
  }
  return color
}

const convertRgbToHex = (rgbString: string): string | null => {
  if (!rgbString) return null

  const rgbParts = rgbString.split(',')
  if (rgbParts.length === 3) {
    return rgbToHex(
      parseInt(rgbParts[0], 10),
      parseInt(rgbParts[1], 10),
      parseInt(rgbParts[2], 10)
    )
  }
  return null
}

const loadColorProperties = (cellStyle?: CellStyle | null): void => {
  if (!cellStyle) return

  forceChecked.value = !!(cellStyle.forecolor && cellStyle.forecolor !== '')
  if (forceChecked.value) {
    const hexColor = convertRgbToHex(cellStyle.forecolor as string)
    forceColor.value = hexColor || '#000000'
  } else {
    forceColor.value = ''
  }
  forceScope.value = cellStyle.forecolorScope || 'cell'

  bgcolorChecked.value = !!(cellStyle.bgcolor && cellStyle.bgcolor !== '')
  if (bgcolorChecked.value) {
    const hexColor = convertRgbToHex(cellStyle.bgcolor as string)
    bgColor.value = hexColor || '#FFFFFF'
  } else {
    bgColor.value = ''
  }
  bgcolorScope.value = cellStyle.bgcolorScope || 'cell'
}

const onForceChange = (): void => {
  emit('color-change', {
    type: 'forecolor',
    checked: forceChecked.value,
    value: forceChecked.value ? '0,0,0' : null,
    scope: forceChecked.value ? 'cell' : null
  })
}

const onForceColorChange = (): void => {
  const rgbColor = convertColorToRgb(forceColor.value)
  emit('color-change', {
    type: 'forecolor',
    checked: forceChecked.value,
    value: rgbColor,
    scope: forceScope.value
  })
}

const onForceScopeChange = (): void => {
  emit('color-change', {
    type: 'forecolor',
    checked: forceChecked.value,
    value: convertColorToRgb(forceColor.value),
    scope: forceScope.value
  })
}

const onBgcolorChange = (): void => {
  emit('color-change', {
    type: 'bgcolor',
    checked: bgcolorChecked.value,
    value: bgcolorChecked.value ? '0,0,0' : null,
    scope: bgcolorChecked.value ? 'cell' : null
  })
}

const onBgColorChange = (): void => {
  const rgbColor = convertColorToRgb(bgColor.value)
  emit('color-change', {
    type: 'bgcolor',
    checked: bgcolorChecked.value,
    value: rgbColor,
    scope: bgcolorScope.value
  })
}

const onBgcolorScopeChange = (): void => {
  emit('color-change', {
    type: 'bgcolor',
    checked: bgcolorChecked.value,
    value: convertColorToRgb(bgColor.value),
    scope: bgcolorScope.value
  })
}
</script>
