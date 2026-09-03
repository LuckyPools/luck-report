<template>
  <div class="u-radio-group">
    <slot></slot>
  </div>
</template>

<script>

import Emitter from "@/components/mixins/emitter";
import { oneOf } from '../utils'

export default {
  name: 'URadioGroup',
  mixins: [Emitter],
  data() {
    return {
      options: [], // 选项
    }
  },
  props: {
    value: {
      type: [String, Boolean, Number],
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    // 是否启用按钮样式
    button: {
      type: Boolean,
      default: false,
    },
    // 尺寸
    size: {
      validator(value) {
        return oneOf(value, ['large', 'medium', 'small', 'mini'])
      },
      type: String,
      default: 'medium',
    },
  },
  watch: {
    value: {
      handler(newVal) {
        this.syncValue(newVal)
      },
      immediate: true,
    },
    // 禁用状态
    disabled: {
      handler(newVal) {
        this.syncOptionsDisable(newVal)
      },
      immediate: true,
    },
    // 是否使用按钮样式
    button: {
      handler(newVal) {
        this.syncOptionsButtonStyle(newVal)
      },
      immediate: true,
    },
    // 尺寸
    size: {
      handler(newVal) {
        this.syncOptionsSize(newVal)
      },
      immediate: true,
    },
  },
  created() {
    // 监听on-radio-add事件，将radio实例存到options上
    this.$on('on-radio-add', (radio) => {
      this.options.push(radio)
      this.syncValue(this.value)
      this.syncOptionsDisable(this.disabled)
      this.syncOptionsButtonStyle(this.button)
      this.syncOptionsSize(this.size)
    })
    // 监听on-radio-remove事件，将radio实例从options中移除
    this.$on('on-radio-remove', (radio) => {
      this.options.splice(this.options.indexOf(radio), 1)
      this.dispatch('UFormItem', 'form-change', radio)
    })
    // 监听radio的选中事件，做value值同步
    this.$on('on-radio-select', (radio) => {
      this.syncValue(radio.label)
      if (this.value !== radio.label) {
        this.$emit("change", radio.label);
      }
    })
  },
  methods: {
    /**
     * @description value值同步
     * @param {Boolean/String/Number} focusVal 选中值，为radio组件的label属性
     */
    syncValue(focusVal) {
      this.$emit('input', focusVal)
      this.options.forEach((d) => {
        d.selected = d.label === focusVal
      })
      this.dispatch('UFormItem', 'form-change', focusVal)
    },
    /**
     * @description 设置子选项的localDisabled属性
     * @param {Boolean} disabled 是否禁用
     */
    syncOptionsDisable(disabled) {
      this.options.forEach((d) => {
        d.localDisabled = disabled
      })
    },
    /**
     * @description 设置子选项的button属性，用以控制按钮样式
     * @param {Boolean} value 是否设置
     */
    syncOptionsButtonStyle(value) {
      this.options.forEach((d) => {
        d.button = value
      })
    },
    /**
     * @description 设置子选项的localSize属性，用以控制尺寸
     * @param {String} value 尺寸，合法值：large/medium/small/mini
     */
    syncOptionsSize(value) {
      this.options.forEach((d) => {
        d.localSize = value
      })
    },
  },
}
</script>
<style scoped>
.u-radio-group {
  //overflow: hidden
}
</style>
