<template>
  <div class="u-radio-group">
    <slot></slot>
  </div>
</template>

<script>

import Emitter from "@/components/mixins/emitter";

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
      type: [Boolean, String, Number],
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
  },
  created() {
    // 监听on-radio-add事件，将radio实例存到options上
    this.$on('on-radio-add', (radio) => {
      this.options.push(radio)
      this.syncValue(this.value)
      this.syncOptionsDisable(this.disabled)
      this.syncOptionsButtonStyle(this.button)
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
     * @description 设置子选项的myDisabled属性
     * @param {Boolean} disabled 是否禁用
     */
    syncOptionsDisable(disabled) {
      this.options.forEach((d) => {
        d.myDisabled = disabled
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
  },
}
</script>
<style scoped>
.u-radio-group {
  //overflow: hidden
}
</style>
