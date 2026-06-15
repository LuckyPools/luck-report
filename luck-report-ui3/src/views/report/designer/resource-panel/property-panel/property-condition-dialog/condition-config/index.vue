<template>
  <div class="condition-style">
    <ColorConfig
      :cell-style="localGroup.cellStyle"
      @color-change="handleColorChange"
    />

    <FontConfig
      :cell-style="localGroup.cellStyle"
      @font-change="handleFontChange"
    />

    <AlignConfig
      :cell-style="localGroup.cellStyle"
      @align-change="handleAlignChange"
    />

    <BorderConfig
      :cell-style="localGroup.cellStyle"
      @border-change="handleBorderChange"
      @border-save="handleBorderSave"
    />

    <ValueConfig
      :cell-style="localGroup.cellStyle"
      :new-value="localGroup.newValue"
      @value-change="handleValueChange"
    />

    <SizeConfig
      :row-height="localGroup.rowHeight"
      :col-width="localGroup.colWidth"
      @size-change="handleSizeChange"
    />

    <PagingConfig
      :paging="localGroup.paging"
      @paging-change="handlePagingChange"
    />

    <LinkConfig
      :link-url="localGroup.linkUrl"
      :link-target-window="localGroup.linkTargetWindow"
      :link-parameters="localGroup.linkParameters"
      @link-change="handleLinkChange"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ConditionConfig 条件组样式编辑容器（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. selectedGroup 变化 → 深拷贝到 localGroup
 * 2. 子组件触发 *-change → 改 localGroup 对应字段 → 触发 property-changed
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - 移除 Vuex，状态由父组件传 selectedGroup
 * - 移除 this.$set / this.$nextTick，使用 ref + watch + nextTick
 */
import { ref, watch, nextTick } from 'vue'
import { deepCopy } from '@/utils/comnon'
import { type UrlParameterItem } from '@/views/report/designer/resource-panel/property-panel/url-parameter-dialog/url-parameter-item-dialog/index.vue'
import ColorConfig from './color-config/index.vue'
import FontConfig from './font-config/index.vue'
import AlignConfig from './align-config/index.vue'
import BorderConfig from './border-config/index.vue'
import ValueConfig from './value-config/index.vue'
import SizeConfig from './size-config/index.vue'
import PagingConfig from './paging-config/index.vue'
import LinkConfig from './link-config/index.vue'

defineOptions({ name: 'ConditionConfig' })

interface BorderSide {
  color: string
  style: string
  width: number | string
}

interface CellStyle {
  forecolor?: string
  forecolorScope?: string
  bgcolor?: string
  bgcolorScope?: string
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
  align?: string
  alignScope?: string
  valign?: string
  valignScope?: string
  format?: string
  leftBorder?: BorderSide | null
  rightBorder?: BorderSide | null
  topBorder?: BorderSide | null
  bottomBorder?: BorderSide | null
  [key: string]: unknown
}

interface Paging {
  position?: string
  line?: number
  [key: string]: unknown
}

export interface SelectedGroup {
  id?: string
  name?: string | null
  cellStyle?: CellStyle | null
  rowHeight?: number | null
  colWidth?: number | null
  newValue?: string | null
  linkUrl?: string | null
  linkTargetWindow?: string | null
  linkParameters?: UrlParameterItem[] | null
  paging?: Paging | null
  conditions?: unknown[]
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    selectedGroup?: SelectedGroup | null
  }>(),
  {
    selectedGroup: null
  }
)

const emit = defineEmits<{
  (e: 'property-changed', group: SelectedGroup): void
}>()

interface LocalGroup {
  cellStyle: CellStyle | Record<string, unknown>
  rowHeight: number | null
  colWidth: number | null
  newValue: string | null
  linkUrl: string | null
  linkTargetWindow: string | null
  linkParameters: UrlParameterItem[] | null
  paging: Paging | null
  name: string | null
}

const createEmptyGroup = (): LocalGroup => ({
  cellStyle: {},
  rowHeight: null,
  colWidth: null,
  newValue: null,
  linkUrl: null,
  linkTargetWindow: null,
  linkParameters: null,
  paging: null,
  name: null
})

const localGroup = ref<LocalGroup>(createEmptyGroup())

const updateConfig = (config?: SelectedGroup | null): void => {
  if (!config) {
    localGroup.value = createEmptyGroup()
    return
  }

  const tempGroup = deepCopy(config) as SelectedGroup

  localGroup.value = {
    cellStyle: (tempGroup.cellStyle as CellStyle) || {},
    rowHeight: tempGroup.rowHeight !== undefined ? (tempGroup.rowHeight as number) : null,
    colWidth: tempGroup.colWidth !== undefined ? (tempGroup.colWidth as number) : null,
    newValue: tempGroup.newValue !== undefined ? (tempGroup.newValue as string) : null,
    linkUrl: tempGroup.linkUrl !== undefined ? (tempGroup.linkUrl as string) : null,
    linkTargetWindow:
      tempGroup.linkTargetWindow !== undefined ? (tempGroup.linkTargetWindow as string) : null,
    linkParameters:
      tempGroup.linkParameters !== undefined
        ? (tempGroup.linkParameters as UrlParameterItem[])
        : null,
    paging: tempGroup.paging !== undefined ? (tempGroup.paging as Paging) : null,
    name: tempGroup.name !== undefined ? (tempGroup.name as string) : null
  }
}

watch(
  () => props.selectedGroup,
  (newVal) => {
    updateConfig(newVal)
  },
  { immediate: true, deep: true }
)

const emitPropertyChange = (): void => {
  nextTick(() => {
    emit('property-changed', localGroup.value as unknown as SelectedGroup)
  })
}

const ensureCellStyle = (): void => {
  if (!localGroup.value.cellStyle) {
    localGroup.value.cellStyle = {}
  }
}

interface ColorChangePayload {
  type: 'forecolor' | 'bgcolor'
  checked: boolean
  value: string | null
  scope: string | null
}

const handleColorChange = (payload: ColorChangePayload): void => {
  ensureCellStyle()

  if (payload.type === 'forecolor') {
    localGroup.value.cellStyle.forecolor = payload.value
    localGroup.value.cellStyle.forecolorScope = payload.scope
  } else if (payload.type === 'bgcolor') {
    localGroup.value.cellStyle.bgcolor = payload.value
    localGroup.value.cellStyle.bgcolorScope = payload.scope
  }

  emitPropertyChange()
}

interface FontChangePayload {
  type: 'fontFamily' | 'fontSize' | 'bold' | 'italic' | 'underline'
  checked: boolean
  value: string | number | boolean | null
  scope: string | null
}

const handleFontChange = (payload: FontChangePayload): void => {
  ensureCellStyle()

  if (payload.type === 'fontFamily') {
    localGroup.value.cellStyle.fontFamily = payload.value as string
    localGroup.value.cellStyle.fontFamilyScope = payload.scope
  } else if (payload.type === 'fontSize') {
    localGroup.value.cellStyle.fontSize = payload.value as string | number
    localGroup.value.cellStyle.fontSizeScope = payload.scope
  } else if (payload.type === 'bold') {
    localGroup.value.cellStyle.bold = payload.value as boolean | string | null
    localGroup.value.cellStyle.boldScope = payload.scope
  } else if (payload.type === 'italic') {
    localGroup.value.cellStyle.italic = payload.value as boolean | string | null
    localGroup.value.cellStyle.italicScope = payload.scope
  } else if (payload.type === 'underline') {
    localGroup.value.cellStyle.underline = payload.value as boolean | string | null
    localGroup.value.cellStyle.underlineScope = payload.scope
  }

  emitPropertyChange()
}

interface AlignChangePayload {
  type: 'align' | 'valign'
  checked: boolean
  value: string | null
  scope: string | null
}

const handleAlignChange = (payload: AlignChangePayload): void => {
  ensureCellStyle()

  if (payload.type === 'align') {
    localGroup.value.cellStyle.align = payload.value
    localGroup.value.cellStyle.alignScope = payload.scope
  } else if (payload.type === 'valign') {
    localGroup.value.cellStyle.valign = payload.value
    localGroup.value.cellStyle.valignScope = payload.scope
  }

  emitPropertyChange()
}

interface BorderChangePayload {
  checked: boolean
  borders: {
    leftBorder: BorderSide | null
    rightBorder: BorderSide | null
    topBorder: BorderSide | null
    bottomBorder: BorderSide | null
  }
}

const handleBorderChange = (payload: BorderChangePayload): void => {
  ensureCellStyle()

  localGroup.value.cellStyle.leftBorder = payload.borders.leftBorder
  localGroup.value.cellStyle.rightBorder = payload.borders.rightBorder
  localGroup.value.cellStyle.topBorder = payload.borders.topBorder
  localGroup.value.cellStyle.bottomBorder = payload.borders.bottomBorder

  emitPropertyChange()
}

interface BorderSavePayload {
  topBorder: BorderSide
  bottomBorder: BorderSide
  leftBorder: BorderSide
  rightBorder: BorderSide
}

const handleBorderSave = (borderData: BorderSavePayload): void => {
  if (localGroup.value.cellStyle) {
    localGroup.value.cellStyle.topBorder = borderData.topBorder
    localGroup.value.cellStyle.bottomBorder = borderData.bottomBorder
    localGroup.value.cellStyle.leftBorder = borderData.leftBorder
    localGroup.value.cellStyle.rightBorder = borderData.rightBorder
  }
  emitPropertyChange()
}

interface ValueChangePayload {
  type: 'newValue' | 'format'
  checked: boolean
  value: string | null
}

const handleValueChange = (payload: ValueChangePayload): void => {
  if (payload.type === 'newValue') {
    localGroup.value.newValue = payload.value
  } else if (payload.type === 'format') {
    ensureCellStyle()
    localGroup.value.cellStyle.format = payload.value
  }

  emitPropertyChange()
}

interface SizeChangePayload {
  type: 'rowHeight' | 'colWidth'
  checked: boolean
  value: number | null
}

const handleSizeChange = (payload: SizeChangePayload): void => {
  if (payload.type === 'rowHeight') {
    localGroup.value.rowHeight = payload.value
  } else if (payload.type === 'colWidth') {
    localGroup.value.colWidth = payload.value
  }

  emitPropertyChange()
}

interface PagingChangePayload {
  checked: boolean
  paging: Paging | null
}

const handlePagingChange = (payload: PagingChangePayload): void => {
  localGroup.value.paging = payload.paging
  emitPropertyChange()
}

interface LinkChangePayload {
  checked: boolean
  linkUrl: string | null
  linkTargetWindow: string | null
  linkParameters: UrlParameterItem[] | null
}

const handleLinkChange = (payload: LinkChangePayload): void => {
  localGroup.value.linkUrl = payload.linkUrl
  localGroup.value.linkTargetWindow = payload.linkTargetWindow
  localGroup.value.linkParameters = payload.linkParameters
  emitPropertyChange()
}
</script>

<style scoped>
.condition-style {
  height: 446px;
  overflow-y: scroll;
}
</style>
<style>
.condition-config-row {
  height: 36px;
  margin-bottom: 5px;
}
</style>
