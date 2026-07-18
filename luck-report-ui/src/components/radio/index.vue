<template>
  <label
      class="u-radio"
      :class="{
      'u-radio-selected': selected,
      'u-radio-disabled': disabled || localDisabled,
      [`u-radio-${localSize}-border`]: border,
      [`u-radio-${localSize}-button`]: button,
      'u-radio-selected-button': selected && button,
    }"
  >
    <input
        class="u-radio-input"
        type="radio"
        @click="onClick"
        :disabled="disabled || localDisabled"
    />
    <span
        class="u-radio-icon"
        :class="{
        'u-radio-icon-selected': selected,
        'u-radio-icon-disabled': disabled || localDisabled,
        'u-radio-icon-button': button
      }"
    >
    </span>
    <span class="u-radio-label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script>
// 工具函数，用于判断传入的值是否符合条件
import { oneOf } from '../utils'
import Emitter from '../mixins/emitter'

export default {
  name: 'URadio',
  mixins: [Emitter],
  data() {
    return {
      selected: false, // 是否被选中
      localDisabled: false, // 内部的禁用属性，交由父级控制
      button: false, // 按钮样式
      localSize: 'medium', // 真实用于渲染的尺寸，由父级同步（避开 prop 警告）
    }
  },
  props: {
    value: {
      type: [String, Number, Boolean],
      default: '',
    },
    label: {
      type: [String, Number, Boolean],
      default: '',
    },
    // 禁用状态
    disabled: {
      type: Boolean,
      default: false,
    },
    // 是否绘制边框
    border: {
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
    // 初始化判断是否已被选中
    value: {
      handler(newVal) {
        this.selected = this.value && this.value === this.label
      },
      immediate: true,
    },
    // 把 prop 同步到内部 data，组组件直接改 localSize 不再触发 prop 警告
    size: {
      handler(newVal) {
        this.localSize = newVal
      },
      immediate: true,
    },
  },
  mounted() {
    // 通知myRadioGroup组件调用on-radio-add方法，参数为当前radio实例
    this.dispatch('URadioGroup', 'on-radio-add', this)
  },
  beforeDestroy() {
    // 移除时，调用myRadioGroup组件的on-radio-remove方法
    this.dispatch('URadioGroup', 'on-radio-remove', this)
  },
  methods: {
    onClick() {
      if (!this.selected) {
        this.$emit("change", true);
      }
      this.selected = true
      this.$emit('input', this.label)
      this.dispatch('URadioGroup', 'on-radio-select', this)
    },
  },
}
</script>
<style scoped>

.u-radio {
  display: inline-block;
  box-sizing: border-box;
  vertical-align: top;
  font-size: 16px;
  line-height: 20px;
  height: 20px;
  margin-right: 20px;
  cursor: pointer
}

.u-radio-input {
  display: none
}

.u-radio-icon {
  box-sizing: border-box;
  border: 1px solid #ddd;
  height: 14px;
  width: 14px;
  border-radius: 50%;
  background-color: #fff;
  display: inline-block;
  position: relative;
  top: 2px
}

.u-radio-icon:after {
  content: "";
  position: absolute;
  width: 4px;
  height: 4px;
  background-color: #fff;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  transition: transform .2s;
  transform: translate(-50%, -50%) scale(0)
}

.u-radio-icon-selected {
  background-color: #00554a
}

.u-radio-icon-selected:after {
  transform: translate(-50%, -50%) scale(1)
}

.u-radio-icon-disabled {
  background-color: #eee
}

.u-radio-icon-disabled:after {
  background-color: #aaa
}

.u-radio-icon-button {
  display: none
}

.u-radio-label {
  display: inline-block;
  margin-left: 3px
}

.u-radio-selected {
  color: #00554a;
  border-color: #00554a !important
}

.u-radio-selected-button {
  background-color: #00554a !important;
  color: #fff
}

.u-radio-disabled {
  cursor: not-allowed;
  color: #c0c4cc;
  border-color: #c0c4cc !important
}

.u-radio-large-border {
  height: 40px;
  padding: 8px 8px 12px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px
}

.u-radio-medium-border {
  height: 36px;
  padding: 6px 8px 10px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px
}

.u-radio-small-border {
  height: 32px;
  padding: 4px 8px 8px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px
}

.u-radio-mini-border {
  height: 28px;
  padding: 2px 8px 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px
}

.u-radio-large-button {
  float: left;
  background-color: #fff;
  height: 40px;
  line-height: 38px;
  padding: 0 15px 0 12px;
  margin: 0;
  border: 1px solid #dcdfe6
}

.u-radio-medium-button {
  float: left;
  background-color: #fff;
  height: 36px;
  line-height: 34px;
  padding: 0 15px 0 12px;
  margin: 0;
  border: 1px solid #dcdfe6
}

.u-radio-small-button {
  float: left;
  background-color: #fff;
  height: 32px;
  line-height: 30px;
  padding: 0 15px 0 12px;
  margin: 0;
  border: 1px solid #dcdfe6;
  font-size: 14px
}

.u-radio-mini-button {
  float: left;
  background-color: #fff;
  height: 28px;
  line-height: 26px;
  padding: 0 15px 0 12px;
  margin: 0;
  border: 1px solid #dcdfe6;
  font-size: 14px
}
</style>
