<template>
  <div>
    <a-row class="condition-config-row" align="middle">
      <a-col :span="8">
        <a-checkbox v-model:checked="fontChecked" @change="onFontChange">
          {{ t('dialog.propCondition.font') }}
        </a-checkbox>
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="fontChecked"
            v-model:value="fontFamily"
            @change="onFontFamilyChange"
            style="width: 120px"
            :options="fontOptions"
        />
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="fontChecked"
            v-model:value="fontFamilyScope"
            @change="onFontFamilyScopeChange"
            style="width: 120px"
            :options="scopeOptions"
        />
      </a-col>
    </a-row>

    <a-row class="condition-config-row" align="middle">
      <a-col :span="8">
        <a-checkbox v-model:checked="fontSizeChecked" @change="onFontSizeChange">
          {{ t('dialog.propCondition.fontSize') }}
        </a-checkbox>
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="fontSizeChecked"
            v-model:value="fontSize"
            @change="onFontSizeValueChange"
            style="width: 120px"
            :options="fontSizeOptions"
        />
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="fontSizeChecked"
            v-model:value="fontSizeScope"
            @change="onFontSizeScopeChange"
            style="width: 120px"
            :options="scopeOptions"
        />
      </a-col>
    </a-row>

    <a-row class="condition-config-row" align="middle">
      <a-col :span="8">
        <a-checkbox v-model:checked="fontBoldChecked" @change="onFontBoldChange">
          {{ t('dialog.propCondition.bold') }}
        </a-checkbox>
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="fontBoldChecked"
            v-model:value="fontBold"
            @change="onFontBoldValueChange"
            style="width: 120px"
            :options="yesNoOptions"
        />
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="fontBoldChecked"
            v-model:value="fontBoldScope"
            @change="onFontBoldScopeChange"
            style="width: 120px"
            :options="scopeOptions"
        />
      </a-col>
    </a-row>

    <a-row class="condition-config-row" align="middle">
      <a-col :span="8">
        <a-checkbox v-model:checked="fontItalicChecked" @change="onFontItalicChange">
          {{ t('dialog.propCondition.italic') }}
        </a-checkbox>
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="fontItalicChecked"
            v-model:value="fontItalic"
            @change="onFontItalicValueChange"
            style="width: 120px"
            :options="yesNoOptions"
        />
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="fontItalicChecked"
            v-model:value="fontItalicScope"
            @change="onFontItalicScopeChange"
            style="width: 120px"
            :options="scopeOptions"
        />
      </a-col>
    </a-row>

    <a-row class="condition-config-row" align="middle">
      <a-col :span="8">
        <a-checkbox v-model:checked="fontUnderlineChecked" @change="onFontUnderlineChange">
          {{ t('dialog.propCondition.underline') }}
        </a-checkbox>
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="fontUnderlineChecked"
            v-model:value="fontUnderline"
            @change="onFontUnderlineValueChange"
            style="width: 120px"
            :options="yesNoOptions"
        />
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="fontUnderlineChecked"
            v-model:value="fontUnderlineScope"
            @change="onFontUnderlineScopeChange"
            style="width: 120px"
            :options="scopeOptions"
        />
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
/**
 * FontConfig 字体条件配置（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - u-row/u-col/u-checkbox/u-select/u-option（自定义）→ a-row/a-col/a-checkbox/a-select
 * - 选中态对齐使用 v-model:checked / v-model:value
 */
import { ref, watch, onMounted } from 'vue'
import configOptions from '../constants/config-options'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'FontConfig' })


const { t } = useI18n()
interface CellStyle {
  fontFamily?: string
  fontFamilyScope?: string
  fontSize?: string | number
  fontSizeScope?: string
  bold?: boolean | string | null
  boldScope?: string
  italic?: boolean | string | null
  italicScope?: string
  underline?: boolean | string | null
  underlineScope?: string
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

type FontChangeType = 'fontFamily' | 'fontSize' | 'bold' | 'italic' | 'underline'

const emit = defineEmits<{
  (
    e: 'font-change',
    payload: {
      type: FontChangeType
      checked: boolean
      value: string | number | boolean | null
      scope: string | null
    }
  ): void
}>()

const fontChecked = ref<boolean>(false)
const fontFamily = ref<string>('')
const fontFamilyScope = ref<string>('cell')

const fontSizeChecked = ref<boolean>(false)
const fontSize = ref<string | number>('')
const fontSizeScope = ref<string>('cell')

const fontBoldChecked = ref<boolean>(false)
const fontBold = ref<string>('')
const fontBoldScope = ref<string>('cell')

const fontItalicChecked = ref<boolean>(false)
const fontItalic = ref<string>('')
const fontItalicScope = ref<string>('cell')

const fontUnderlineChecked = ref<boolean>(false)
const fontUnderline = ref<string>('')
const fontUnderlineScope = ref<string>('cell')

const fontOptions = ref<{ value: string | number; label: string }[]>([])
const fontSizeOptions = ref<{ value: string | number; label: string }[]>([])
const yesNoOptions = ref<{ value: string; label: string }[]>([])
const scopeOptions = ref<{ value: string; label: string }[]>([])

onMounted(() => {
  fontOptions.value = configOptions.getFontOptions() as { value: string | number; label: string }[]
  fontSizeOptions.value = configOptions.getFontSizeOptions()
  yesNoOptions.value = configOptions.getYesNoOptions()
  scopeOptions.value = configOptions.getScopeOptions()
})

watch(
  () => props.cellStyle,
  (newVal) => {
    loadFontProperties(newVal)
  },
  { immediate: true, deep: true }
)

const normalizeBool = (val: unknown): string =>
  val === true || val === 'true' ? 'true' : 'false'

const loadFontProperties = (cellStyle?: CellStyle | null): void => {
  if (!cellStyle) return

  fontChecked.value = !!(cellStyle.fontFamily && cellStyle.fontFamily !== '0')
  fontFamily.value = fontChecked.value ? (cellStyle.fontFamily as string) : ''
  fontFamilyScope.value = cellStyle.fontFamilyScope || 'cell'

  fontSizeChecked.value = !!(cellStyle.fontSize && cellStyle.fontSize !== '0')
  fontSize.value = fontSizeChecked.value ? (cellStyle.fontSize as string | number) : ''
  fontSizeScope.value = cellStyle.fontSizeScope || 'cell'

  fontBoldChecked.value = !(
    cellStyle.bold === null ||
    cellStyle.bold === undefined ||
    cellStyle.bold === ''
  )
  fontBold.value = fontBoldChecked.value ? normalizeBool(cellStyle.bold) : ''
  fontBoldScope.value = cellStyle.boldScope || 'cell'

  fontItalicChecked.value = !(
    cellStyle.italic === null ||
    cellStyle.italic === undefined ||
    cellStyle.italic === ''
  )
  fontItalic.value = fontItalicChecked.value ? normalizeBool(cellStyle.italic) : ''
  fontItalicScope.value = cellStyle.italicScope || 'cell'

  fontUnderlineChecked.value = !(
    cellStyle.underline === null ||
    cellStyle.underline === undefined ||
    cellStyle.underline === ''
  )
  fontUnderline.value = fontUnderlineChecked.value ? normalizeBool(cellStyle.underline) : ''
  fontUnderlineScope.value = cellStyle.underlineScope || 'cell'
}

const onFontChange = (): void => {
  emit('font-change', {
    type: 'fontFamily',
    checked: fontChecked.value,
    value: fontChecked.value ? '宋体' : null,
    scope: fontChecked.value ? 'cell' : null
  })
}

const onFontFamilyChange = (): void => {
  emit('font-change', {
    type: 'fontFamily',
    checked: fontChecked.value,
    value: fontFamily.value,
    scope: fontFamilyScope.value
  })
}

const onFontFamilyScopeChange = (): void => {
  emit('font-change', {
    type: 'fontFamily',
    checked: fontChecked.value,
    value: fontFamily.value,
    scope: fontFamilyScope.value
  })
}

const onFontSizeChange = (): void => {
  emit('font-change', {
    type: 'fontSize',
    checked: fontSizeChecked.value,
    value: fontSizeChecked.value ? '12' : null,
    scope: fontSizeChecked.value ? 'cell' : null
  })
}

const onFontSizeValueChange = (): void => {
  emit('font-change', {
    type: 'fontSize',
    checked: fontSizeChecked.value,
    value: fontSize.value,
    scope: fontSizeScope.value
  })
}

const onFontSizeScopeChange = (): void => {
  emit('font-change', {
    type: 'fontSize',
    checked: fontSizeChecked.value,
    value: fontSize.value,
    scope: fontSizeScope.value
  })
}

const onFontBoldChange = (): void => {
  emit('font-change', {
    type: 'bold',
    checked: fontBoldChecked.value,
    value: fontBoldChecked.value ? true : null,
    scope: fontBoldChecked.value ? 'cell' : null
  })
}

const onFontBoldValueChange = (): void => {
  emit('font-change', {
    type: 'bold',
    checked: fontBoldChecked.value,
    value: fontBold.value,
    scope: fontBoldScope.value
  })
}

const onFontBoldScopeChange = (): void => {
  emit('font-change', {
    type: 'bold',
    checked: fontBoldChecked.value,
    value: fontBold.value,
    scope: fontBoldScope.value
  })
}

const onFontItalicChange = (): void => {
  emit('font-change', {
    type: 'italic',
    checked: fontItalicChecked.value,
    value: fontItalicChecked.value ? true : null,
    scope: fontItalicChecked.value ? 'cell' : null
  })
}

const onFontItalicValueChange = (): void => {
  emit('font-change', {
    type: 'italic',
    checked: fontItalicChecked.value,
    value: fontItalic.value,
    scope: fontItalicScope.value
  })
}

const onFontItalicScopeChange = (): void => {
  emit('font-change', {
    type: 'italic',
    checked: fontItalicChecked.value,
    value: fontItalic.value,
    scope: fontItalicScope.value
  })
}

const onFontUnderlineChange = (): void => {
  emit('font-change', {
    type: 'underline',
    checked: fontUnderlineChecked.value,
    value: fontUnderlineChecked.value ? true : null,
    scope: fontUnderlineChecked.value ? 'cell' : null
  })
}

const onFontUnderlineValueChange = (): void => {
  emit('font-change', {
    type: 'underline',
    checked: fontUnderlineChecked.value,
    value: fontUnderline.value,
    scope: fontUnderlineScope.value
  })
}

const onFontUnderlineScopeChange = (): void => {
  emit('font-change', {
    type: 'underline',
    checked: fontUnderlineChecked.value,
    value: fontUnderline.value,
    scope: fontUnderlineScope.value
  })
}
</script>
