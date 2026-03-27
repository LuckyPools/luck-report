<template>
  <div class="u-color-picker">
    <u-button
        :size="size"
        type="info"
        native-type="button"
        style="border: none"
        @click="togglePicker"
    >
      <i class="iconfont icon-unchecked" :style="{ backgroundColor: displayColor }"></i>
    </u-button>
    <div class="u-color-picker-popover" v-if="pickerVisible" ref="popover">
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
      if (!this.disabled) {
        this.pickerVisible = !this.pickerVisible
      }
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
    },
    setColorFromValue(value) {
      if (!value) return

      // 简单的颜色解析，实际项目中可能需要更复杂的解析逻辑
      if (value.startsWith('#')) {
        this.colors.hex = value
      } else if (value.startsWith('rgb')) {
        // 解析 rgb/rgba 值
        const matches = value.match(/\d+/g)
        if (matches && matches.length >= 3) {
          this.colors.rgba = {
            r: parseInt(matches[0]),
            g: parseInt(matches[1]),
            b: parseInt(matches[2]),
            a: matches[3] ? parseFloat(matches[3]) : 1
          }
        }
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

.u-color-picker-popover {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 9999;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
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
