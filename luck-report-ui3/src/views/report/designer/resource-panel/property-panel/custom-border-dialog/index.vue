<template>
  <a-modal
    :title="t('tools.border.customBorderLine')"
    :width="600"
    :open="visible"
    :z-index="zIndex"
    :mask-closable="false"
    @cancel="handleClose"
  >
    <div class="border-config-container">
      <div class="preset-section">
        <label class="preset-label">
          {{ t('tools.border.preset') }}：
        </label>
        <a-button
          type="text"
          :title="t('tools.border.allLine')"
          @click="applyAllBorder"
        >
          <i class="iconfont icon-full-border"></i>
        </a-button>
        <a-button
          type="text"
          :title="t('tools.border.noBorder')"
          @click="applyNoBorder"
        >
          <i class="iconfont icon-no-border"></i>
        </a-button>
      </div>

      <div class="main-content">
        <div class="preview-section">
          <div class="preview-container">
            <div class="outer-box" :class="outerBoxClass" @click="handleOuterBoxClick">
              <div
                class="inner-box"
                :style="innerBoxStyle"
              >
                <span class="preview-text">{{ t('tools.border.text') }}</span>
                <div
                  v-for="border in borders"
                  :key="border.position"
                  :class="['border-click-area', `border-${border.position}`]"
                  @click.stop="selectBorder(border.position)"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="property-section">
          <a-form :label-col="{ style: { width: '80px' } }" :colon="false">
            <a-form-item :label="t('tools.border.lineStyle')">
              <a-select v-model:value="currentBorderStyle.style">
                <a-select-option
                  v-for="option in lineStyleOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item :label="t('tools.border.size')">
              <a-select v-model:value="currentBorderStyle.width">
                <a-select-option
                  v-for="option in lineWidthOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item :label="t('tools.border.color')">
              <u-color-picker
                v-model:value="currentBorderStyle.color"
                format="hex"
                show-text
              />
            </a-form-item>
          </a-form>
        </div>
      </div>
    </div>

    <template #footer>
      <a-button @click="handleClose" style="margin-right: 10px;">{{ t('dialog.common.cancel') }}</a-button>
      <a-button type="primary" @click="handleOk">{{ t('dialog.common.ok') }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * CustomBorderDialog 自定义单元格边框弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → loadBorderData 从 cellStyle 或 4 个独立 prop 中加载数据
 * 2. 用户点击边框区域（top/right/bottom/left）→ activeBorder 切换
 * 3. 右侧表单修改当前激活边框的 style/width/color
 * 4. 「确定」→ 把本地边框值（color 转 rgb）通过 emit('save') 上抛
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UForm/UFormItem/USelect/UOption/UButton/UColorPicker（自定义）→ a-modal/a-form/a-form-item/a-select/a-select-option/a-button/u-color-picker
 * - slot="footer" → #footer
 * - 计算属性 currentBorderStyle 的 get/set → 拆成 ref + watch 双向同步
 * - mounted/beforeDestroy 绑定的 keydown → onMounted/onBeforeUnmount
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { rgbToHex, hexToRgb } from '@/utils/color'
import { useI18n } from 'vue-i18n'
import UColorPicker from '@/components/color-picker/index.vue'

defineOptions({ name: 'CustomBorderDialog' })


const { t } = useI18n()
/** 边框位置 */
type BorderPosition = 'top' | 'right' | 'bottom' | 'left'

/** 单条边框样式 */
interface BorderStyle {
  style: string
  width: number
  color: string
}

/** save emit 载荷（cellStyle 模式） */
interface CellStyleSavePayload {
  topBorder: BorderStyle
  bottomBorder: BorderStyle
  leftBorder: BorderStyle
  rightBorder: BorderStyle
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    cellStyle?: Record<string, BorderStyle> | null
    topBorder?: BorderStyle
    bottomBorder?: BorderStyle
    leftBorder?: BorderStyle
    rightBorder?: BorderStyle
    zIndex?: number
  }>(),
  {
    visible: false,
    cellStyle: null,
    topBorder: () => ({ style: 'solid', width: 1, color: '#000000' }),
    bottomBorder: () => ({ style: 'solid', width: 1, color: '#000000' }),
    leftBorder: () => ({ style: 'solid', width: 1, color: '#000000' }),
    rightBorder: () => ({ style: 'solid', width: 1, color: '#000000' }),
    zIndex: 20000
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:visible', val: boolean): void
  (e: 'save', payload: CellStyleSavePayload): void
}>()

const defaultBorder: BorderStyle = { style: 'none', width: 1, color: '#000000' }
const solidBorder: BorderStyle = { style: 'solid', width: 1, color: '#000000' }
const noBorder: BorderStyle = { style: 'none', width: 1, color: '#000000' }

const activeBorder = ref<BorderPosition>('left')
const localTopBorder = ref<BorderStyle>({ ...defaultBorder })
const localBottomBorder = ref<BorderStyle>({ ...defaultBorder })
const localLeftBorder = ref<BorderStyle>({ ...defaultBorder })
const localRightBorder = ref<BorderStyle>({ ...defaultBorder })
const borders: { position: BorderPosition }[] = [
  { position: 'top' },
  { position: 'right' },
  { position: 'bottom' },
  { position: 'left' }
]

/** 当前激活边框的引用（写入时同步到对应 local* 变量） */
const currentBorderStyle = computed<BorderStyle>({
  get(): BorderStyle {
    const map: Record<BorderPosition, BorderStyle> = {
      top: localTopBorder.value,
      right: localRightBorder.value,
      bottom: localBottomBorder.value,
      left: localLeftBorder.value
    }
    return map[activeBorder.value] ?? localRightBorder.value
  },
  set(val: BorderStyle) {
    const map: Record<BorderPosition, BorderStyle> = {
      top: localTopBorder.value,
      right: localRightBorder.value,
      bottom: localBottomBorder.value,
      left: localLeftBorder.value
    }
    map[activeBorder.value] = { ...val }
  }
})

const lineStyleOptions = computed(() => [
  { value: 'solid', label: t('tools.border.solidLine') },
  { value: 'dashed', label: t('tools.border.dashed') },
  { value: 'none', label: t('tools.border.none') }
])

const lineWidthOptions = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: (i + 1).toString()
}))

const getBorderCss = (border: BorderStyle): string => {
  if (!border || border.style === 'none') {
    return 'none'
  }
  const width = border.width || 1
  const color = border.color || '#000000'
  return `${border.style} ${width}px ${color}`
}

const innerBoxStyle = computed(() => ({
  borderTop: getBorderCss(localTopBorder.value),
  borderRight: getBorderCss(localRightBorder.value),
  borderBottom: getBorderCss(localBottomBorder.value),
  borderLeft: getBorderCss(localLeftBorder.value)
}))

const outerBoxClass = computed(() => ({
  'active-top': activeBorder.value === 'top',
  'active-right': activeBorder.value === 'right',
  'active-bottom': activeBorder.value === 'bottom',
  'active-left': activeBorder.value === 'left'
}))

/** 把 rgb(...) 字符串或 rgb 数字数组统一转为 hex */
const rgbToHexIfNeeded = (color: string | undefined): string => {
  if (typeof color === 'string' && color.includes(',')) {
    return rgbToHex(color)
  }
  return color ?? '#000000'
}

/** 加载初始边框数据：优先 cellStyle，否则取 4 个独立 prop */
const loadBorderData = (): void => {
  if (props.cellStyle) {
    localTopBorder.value = props.cellStyle.topBorder
      ? { ...props.cellStyle.topBorder, color: rgbToHexIfNeeded(props.cellStyle.topBorder.color) }
      : { ...defaultBorder }
    localBottomBorder.value = props.cellStyle.bottomBorder
      ? { ...props.cellStyle.bottomBorder, color: rgbToHexIfNeeded(props.cellStyle.bottomBorder.color) }
      : { ...defaultBorder }
    localLeftBorder.value = props.cellStyle.leftBorder
      ? { ...props.cellStyle.leftBorder, color: rgbToHexIfNeeded(props.cellStyle.leftBorder.color) }
      : { ...defaultBorder }
    localRightBorder.value = props.cellStyle.rightBorder
      ? { ...props.cellStyle.rightBorder, color: rgbToHexIfNeeded(props.cellStyle.rightBorder.color) }
      : { ...defaultBorder }
  } else {
    localTopBorder.value = { ...props.topBorder }
    localBottomBorder.value = { ...props.bottomBorder }
    localLeftBorder.value = { ...props.leftBorder }
    localRightBorder.value = { ...props.rightBorder }
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadBorderData()
    }
  }
)

const selectBorder = (position: BorderPosition): void => {
  activeBorder.value = position
}

const handleOuterBoxClick = (event: MouseEvent): void => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const outerSize = 140
  const innerSize = 100
  const margin = (outerSize - innerSize) / 2

  if (y < margin) {
    selectBorder('top')
  } else if (y > outerSize - margin) {
    selectBorder('bottom')
  } else if (x < margin) {
    selectBorder('left')
  } else if (x > outerSize - margin) {
    selectBorder('right')
  }
}

const applyAllBorder = (): void => {
  localTopBorder.value = { ...solidBorder }
  localBottomBorder.value = { ...solidBorder }
  localLeftBorder.value = { ...solidBorder }
  localRightBorder.value = { ...solidBorder }
}

const applyNoBorder = (): void => {
  localTopBorder.value = { ...noBorder }
  localBottomBorder.value = { ...noBorder }
  localLeftBorder.value = { ...noBorder }
  localRightBorder.value = { ...noBorder }
}

const handleClose = (): void => {
  emit('close')
  emit('update:visible', false)
}

const handleOk = (): void => {
  const topBorder: BorderStyle = { ...localTopBorder.value }
  const bottomBorder: BorderStyle = { ...localBottomBorder.value }
  const leftBorder: BorderStyle = { ...localLeftBorder.value }
  const rightBorder: BorderStyle = { ...localRightBorder.value }

  topBorder.color = hexToRgb(localTopBorder.value.color)
  bottomBorder.color = hexToRgb(localBottomBorder.value.color)
  leftBorder.color = hexToRgb(localLeftBorder.value.color)
  rightBorder.color = hexToRgb(localRightBorder.value.color)

  emit('save', {
    topBorder,
    bottomBorder,
    leftBorder,
    rightBorder
  })
  emit('close')
  emit('update:visible', false)
}

const handleKeydown = (e: KeyboardEvent): void => {
  if (props.visible && e.key === 'Escape') {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.border-config-container {
  padding: 10px;
}

.preset-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 15px;
}

.preset-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.main-content {
  display: flex;
  gap: 20px;
}

.preview-section {
  flex: 0 0 200px;
  display: flex;
  flex-direction: column;
}

.preview-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  padding: 20px;
}

.outer-box {
  width: 140px;
  height: 140px;
  border: 1px solid #c0c4cc;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  cursor: pointer;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.outer-box:hover {
  border-color: #a0a4ac;
}

.outer-box.active-top {
  box-shadow: inset 0 1px 0 rgba(33, 115, 70, 0.4), 0 -1px 0 rgba(33, 115, 70, 0.4);
}

.outer-box.active-right {
  box-shadow: inset -1px 0 0 rgba(33, 115, 70, 0.4), 1px 0 0 rgba(33, 115, 70, 0.4);
}

.outer-box.active-bottom {
  box-shadow: inset 0 -1px 0 rgba(33, 115, 70, 0.4), 0 1px 0 rgba(33, 115, 70, 0.4);
}

.outer-box.active-left {
  box-shadow: inset 1px 0 0 rgba(33, 115, 70, 0.4), -1px 0 0 rgba(33, 115, 70, 0.4);
}

.inner-box {
  width: 100px;
  height: 100px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  cursor: pointer;
  box-sizing: border-box;
}

.preview-text {
  font-size: 14px;
  color: #333;
  user-select: none;
}

.border-click-area {
  position: absolute;
  background-color: transparent;
  cursor: pointer;
}

.border-top {
  top: -20px;
  left: -20px;
  right: -20px;
  height: 20px;
}

.border-bottom {
  bottom: -20px;
  left: -20px;
  right: -20px;
  height: 20px;
}

.border-left {
  top: 0;
  bottom: 0;
  left: -20px;
  width: 20px;
}

.border-right {
  top: 0;
  bottom: 0;
  right: -20px;
  width: 20px;
}

.property-section {
  flex: 1;
}

.property-section :deep(.ant-form) {
  padding-top: 20px;
}
</style>
