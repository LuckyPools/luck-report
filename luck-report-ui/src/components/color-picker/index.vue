<template>
  <div class="u-color-picker">
    <div class="u-color-picker-trigger" @click="togglePicker">
      <slot>
        <u-button
            :size="size"
            type="info"
            native-type="button"
            style="border: none"
        >
          <span class="color-block" :style="{ backgroundColor: displayColor }"></span>
        </u-button>
      </slot>
    </div>
    <div class="u-color-picker-popover" v-if="pickerVisible" ref="popover" @mousedown="handlePopoverMouseDown">
      <sketch-picker
        :value="colors"
        @input="updateColor"
      />
    </div>
  </div>
</template>

<script>
import { Sketch } from 'vue-color'
import UButton from "@/components/button/index.vue";

export default {
  name: 'UColorPicker',
  components: {
    UButton,
    'sketch-picker': Sketch
  },
  props: {
    value: {
      type: String,
      default: '#000000'
    },
    // 颜色模式：hex, rgb, rgba, hsl, hsv
    colorMode: {
      type: String,
      default: 'hex',
      validator: function(value) {
        return ['hex', 'rgb', 'rgba', 'hsl', 'hsv'].indexOf(value) !== -1
      }
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false
    },
    // 切换前的回调，返回 false 则阻止切换
    beforeToggle: {
      type: Function,
      default: null
    },
    // 颜色改变后是否自动关闭
    closeOnChange: {
      type: Boolean,
      default: false
    },
    // 尺寸
    size: {
      type: String,
      default: 'medium',
      validator: function(value) {
        return ['large', 'medium', 'small', 'mini'].indexOf(value) !== -1
      }
    }
  },
  data() {
    return {
      pickerVisible: false,
      shouldCloseAfterUpdate: false,
      colors: {
        hex: '#000000',
        hsl: { h: 0, s: 0, l: 0, a: 1 },
        hsv: { h: 0, s: 0, v: 0, a: 1 },
        rgba: { r: 0, g: 0, b: 0, a: 1 },
        a: 1
      }
    }
  },
  computed: {
    displayColor() {
      if (!this.value) return '#ffffff'
      return this.value
    }
  },
  watch: {
    value: {
      handler(newVal) {
        this.setColorFromValue(newVal)
      },
      immediate: true
    }
  },
  mounted() {
    // 添加点击外部关闭事件
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeDestroy() {
    // 移除点击外部关闭事件
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    togglePicker() {
      if (this.disabled) return
      if (!this.pickerVisible && typeof this.beforeToggle === 'function' && !this.beforeToggle()) return
      if (!this.pickerVisible && this.value) {
        this.setColorFromValue(this.value)
      }
      this.pickerVisible = !this.pickerVisible
    },
    closePicker() {
      this.pickerVisible = false
    },
    handleClickOutside(event) {
      // 如果点击的不是组件内部元素，则关闭选择器
      if (this.pickerVisible && this.$el && !this.$el.contains(event.target)) {
        this.closePicker()
      }
    },
    updateColor(val) {
      this.colors = val
      let colorValue

      switch (this.colorMode) {
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

      this.$emit('input', colorValue)
      this.$emit('change', colorValue)

      this.$nextTick(() => {
        if (this.closeOnChange || this.shouldCloseAfterUpdate) {
          this.shouldCloseAfterUpdate = false
          this.pickerVisible = false
        }
      })
    },
    handlePopoverMouseDown(event) {
      if (event.target.closest('.vc-sketch-presets-color')) {
        this.shouldCloseAfterUpdate = true
      }
    },
    /**
     * 从外部值完整构建颜色对象（hex / rgba / hsl / hsv）
     * vue-color Sketch 优先用 hsl 初始化；只写 hex 时刷新后会显示 0,0,0
     */
    setColorFromValue(value) {
      if (!value) return

      let r = 0
      let g = 0
      let b = 0
      let a = 1

      if (value.startsWith('#')) {
        let hex = value.replace('#', '').trim()
        if (hex.length === 3) {
          hex = hex.split('').map((c) => c + c).join('')
        }
        if (hex.length !== 6) return
        r = parseInt(hex.substring(0, 2), 16)
        g = parseInt(hex.substring(2, 4), 16)
        b = parseInt(hex.substring(4, 6), 16)
      } else if (value.startsWith('rgb')) {
        const matches = value.match(/[\d.]+/g)
        if (!matches || matches.length < 3) return
        r = parseInt(matches[0], 10)
        g = parseInt(matches[1], 10)
        b = parseInt(matches[2], 10)
        a = matches[3] ? parseFloat(matches[3]) : 1
      } else if (value.includes(',')) {
        const parts = value.split(',')
        if (parts.length < 3) return
        r = parseInt(parts[0].trim(), 10)
        g = parseInt(parts[1].trim(), 10)
        b = parseInt(parts[2].trim(), 10)
      } else {
        return
      }

      if ([r, g, b].some((n) => Number.isNaN(n))) return
      this.colors = this.buildColorFromRgb(r, g, b, Number.isNaN(a) ? 1 : a)
    },
    clampByte(n) {
      return Math.min(255, Math.max(0, Math.round(n)))
    },
    rgbToHsv(r, g, b) {
      const rn = r / 255
      const gn = g / 255
      const bn = b / 255
      const max = Math.max(rn, gn, bn)
      const min = Math.min(rn, gn, bn)
      const d = max - min
      let h = 0
      const s = max === 0 ? 0 : d / max
      const v = max
      if (d !== 0) {
        switch (max) {
          case rn:
            h = (gn - bn) / d + (gn < bn ? 6 : 0)
            break
          case gn:
            h = (bn - rn) / d + 2
            break
          default:
            h = (rn - gn) / d + 4
            break
        }
        h *= 60
      }
      return { h, s, v, a: 1 }
    },
    rgbToHsl(r, g, b) {
      const rn = r / 255
      const gn = g / 255
      const bn = b / 255
      const max = Math.max(rn, gn, bn)
      const min = Math.min(rn, gn, bn)
      const l = (max + min) / 2
      let h = 0
      let s = 0
      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case rn:
            h = (gn - bn) / d + (gn < bn ? 6 : 0)
            break
          case gn:
            h = (bn - rn) / d + 2
            break
          default:
            h = (rn - gn) / d + 4
            break
        }
        h *= 60
      }
      return { h, s, l, a: 1 }
    },
    buildColorFromRgb(r, g, b, a = 1) {
      const rr = this.clampByte(r)
      const gg = this.clampByte(g)
      const bb = this.clampByte(b)
      const toHex = (n) => n.toString(16).padStart(2, '0')
      return {
        hex: `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`,
        rgba: { r: rr, g: gg, b: bb, a },
        hsv: { ...this.rgbToHsv(rr, gg, bb), a },
        hsl: { ...this.rgbToHsl(rr, gg, bb), a },
        a
      }
    }
  }
}
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
}

.color-block {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  vertical-align: middle;
  border: 1px solid #dcdfe6;
}


/* vue-color 组件样式覆盖 */
.vc-sketch {
  position: relative;
  width: 200px;
  padding: 0;
  box-sizing: initial;
  background: #fff;
  border-radius: 4px;
  box-shadow: none;
}
</style>
