<template>
  <div class="u-color-picker">
    <div class="u-color-picker-trigger" @click="togglePicker">
      <slot>
        <a-button
          :size="size"
          type="default"
          style="border: none"
        >
          <span class="color-block" :style="{ backgroundColor: displayColor }"></span>
        </a-button>
      </slot>
    </div>
    <div
      v-if="pickerVisible"
      class="u-color-picker-popover"
      ref="popoverRef"
      @mousedown="handlePopoverMouseDown"
    >
      <Sketch
        :model-value="colors"
        @update:model-value="updateColor"
      />
      <div v-if="showText" class="u-color-picker-hex-input">
        <a-input
          :value="hexInputValue"
          size="small"
          @change="onHexInputChange"
        >
          <template #prefix>
            <span class="u-color-picker-hex-prefix">#</span>
          </template>
        </a-input>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * UColorPicker 颜色选择器（vue3 + TS + @ckpack/vue-color）
 *
 * 功能说明：
 * 1. 使用 Sketch 颜色选择器，支持多种颜色格式输出
 * 2. 支持 v-model:value 双向绑定
 * 3. 支持 beforeToggle 回调，在打开前进行校验
 * 4. 支持 closeOnChange，颜色改变后自动关闭
 *
 * 用法：
 *   <u-color-picker v-model:value="color" color-mode="hex" @change="onChange" />
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Sketch } from '@ckpack/vue-color'

defineOptions({ name: 'UColorPicker' })

/** 颜色值对象（vue-color 内部格式） */
interface ColorValue {
  hex: string
  hsl: { h: number; s: number; l: number; a: number }
  hsv: { h: number; s: number; v: number; a: number }
  rgba: { r: number; g: number; b: number; a: number }
  a: number
}

const props = withDefaults(
  defineProps<{
    /** 当前颜色值（hex 格式），支持 v-model:value */
    value?: string
    /** 颜色模式：hex, rgb, rgba, hsl, hsv */
    colorMode?: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsv'
    /** 输出颜色格式：hex | rgb（向后兼容，等同于 colorMode） */
    format?: 'hex' | 'rgb'
    /** 是否显示 hex 文本输入框 */
    showText?: boolean
    /** 是否禁用 */
    disabled?: boolean
    /** 切换前的回调，返回 false 则阻止切换 */
    beforeToggle?: () => boolean
    /** 颜色改变后是否自动关闭 */
    closeOnChange?: boolean
    /** 尺寸 */
    size?: 'large' | 'middle' | 'small'
  }>(),
  {
    value: '#000000',
    colorMode: 'hex',
    format: 'hex',
    showText: false,
    disabled: false,
    beforeToggle: undefined,
    closeOnChange: false,
    size: 'middle'
  }
)

const emit = defineEmits<{
  (e: 'update:value', val: string): void
  (e: 'change', val: string): void
}>()

/** 颜色选择器是否可见 */
const pickerVisible = ref<boolean>(false)
/** 是否在下次更新后关闭 */
const shouldCloseAfterUpdate = ref<boolean>(false)
/** popover DOM 引用 */
const popoverRef = ref<HTMLElement | null>(null)
/** 当前颜色值对象 */
const colors = ref<ColorValue>({
  hex: '#000000',
  hsl: { h: 0, s: 0, l: 0, a: 1 },
  hsv: { h: 0, s: 0, v: 0, a: 1 },
  rgba: { r: 0, g: 0, b: 0, a: 1 },
  a: 1
})

/** 展示颜色（用于 trigger 色块） */
const displayColor = computed<string>(() => {
  if (!props.value) return '#ffffff'
  return props.value
})

/** hex 文本输入框的值（去掉 # 前缀） */
const hexInputValue = computed<string>(() => {
  return colors.value.hex.replace('#', '')
})

/** 实际使用的颜色模式（优先使用 format，向后兼容） */
const actualColorMode = computed<'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsv'>(() => {
  if (props.format === 'rgb') return 'rgb'
  return props.colorMode
})

/** 同步外部 value → 内部 colors */
watch(
  () => props.value,
  (newVal) => {
    setColorFromValue(newVal)
  },
  { immediate: true }
)

/**
 * 从外部值设置内部颜色对象
 * @param value - 颜色值（hex 或 rgb 格式）
 */
function setColorFromValue(value: string): void {
  if (!value) return

  if (value.startsWith('#')) {
    colors.value.hex = value
    // 解析 hex 到 rgba
    const hex = value.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    colors.value.rgba = { r, g, b, a: 1 }
  } else if (value.startsWith('rgb')) {
    // 解析 rgb/rgba 值
    const matches = value.match(/\d+/g)
    if (matches && matches.length >= 3) {
      colors.value.rgba = {
        r: parseInt(matches[0], 10),
        g: parseInt(matches[1], 10),
        b: parseInt(matches[2], 10),
        a: matches[3] ? parseFloat(matches[3]) : 1
      }
      // 转换为 hex
      const toHex = (n: number) => {
        const h = Math.min(255, Math.max(0, n)).toString(16)
        return h.length === 1 ? '0' + h : h
      }
      colors.value.hex = '#' + toHex(colors.value.rgba.r) + toHex(colors.value.rgba.g) + toHex(colors.value.rgba.b)
    }
  }
}

/**
 * 切换颜色选择器显示状态
 */
function togglePicker(): void {
  if (props.disabled) return
  if (!pickerVisible.value && typeof props.beforeToggle === 'function' && !props.beforeToggle()) {
    return
  }
  pickerVisible.value = !pickerVisible.value
}

/**
 * 关闭颜色选择器
 */
function closePicker(): void {
  pickerVisible.value = false
}

/**
 * 处理点击外部关闭
 * @param event - 鼠标事件
 */
function handleClickOutside(event: MouseEvent): void {
  if (pickerVisible.value && popoverRef.value && !popoverRef.value.contains(event.target as Node)) {
    const trigger = (event.target as HTMLElement).closest('.u-color-picker-trigger')
    if (!trigger) {
      closePicker()
    }
  }
}

/**
 * 更新颜色值
 * @param val - 颜色值对象
 */
function updateColor(val: ColorValue): void {
  colors.value = val
  let colorValue: string

  switch (actualColorMode.value) {
    case 'hex':
      colorValue = val.hex
      break
    case 'rgb':
      colorValue = `rgb(${val.rgba.r}, ${val.rgba.g}, ${val.rgba.b})`
      break
    case 'rgba':
      colorValue = `rgba(${val.rgba.r}, ${val.rgba.g}, ${val.rgba.b}, ${val.rgba.a})`
      break
    case 'hsl':
      colorValue = `hsl(${val.hsl.h}, ${val.hsl.s * 100}%, ${val.hsl.l * 100}%)`
      break
    case 'hsv':
      colorValue = `hsv(${val.hsv.h}, ${val.hsv.s * 100}%, ${val.hsv.v * 100}%)`
      break
    default:
      colorValue = val.hex
  }

  emit('update:value', colorValue)
  emit('change', colorValue)

  // 如果点击了预设颜色，则关闭
  if (props.closeOnChange || shouldCloseAfterUpdate.value) {
    shouldCloseAfterUpdate.value = false
    pickerVisible.value = false
  }
}

/**
 * 处理 hex 文本输入框变更
 * @param e - 输入事件
 */
function onHexInputChange(e: Event): void {
  const target = e.target as HTMLInputElement
  let val = target.value.trim()
  if (!val.startsWith('#')) {
    val = '#' + val
  }
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    colors.value.hex = val
    // 解析 hex 到 rgba
    const hex = val.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    colors.value.rgba = { r, g, b, a: 1 }
    updateColor(colors.value)
  }
}

/**
 * 处理 popover 鼠标按下事件
 * @param event - 鼠标事件
 */
function handlePopoverMouseDown(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (target.closest('.vc-sketch-presets-color')) {
    shouldCloseAfterUpdate.value = true
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.u-color-picker {
  position: relative;
  display: inline-block;
}

.u-color-picker-trigger {
  display: inline-block;
  cursor: pointer;
}

.u-color-picker-popover {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 9999;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 8px;
}

.color-block {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  vertical-align: middle;
  border: 1px solid #dcdfe6;
}

.u-color-picker-hex-input {
  margin-top: 8px;
}

.u-color-picker-hex-prefix {
  color: #999;
}

/* vue-color 组件样式覆盖 */
:deep(.vc-sketch) {
  position: relative;
  width: 200px;
  padding: 0;
  box-sizing: initial;
  background: #fff;
  border-radius: 4px;
  box-shadow: none;
}
</style>