<template>
  <div
      class="u-input-number"
      :class="{ [`u-input-number-size-${size}`]: true }"
  >
    <span
        class="u-input-number-button u-input-number-button-left"
        :class="{
        'u-input-number-button-disabled': disabled || decreaseForbid,
      }"
        @click="handleDecrease"
    >-</span
    >
    <input
        class="u-input-number-input"
        :class="{
        'u-input-number-input-disabled': disabled,
      }"
        type="text"
        :value="currentValue"
        @blur="handleBlur"
        @input="handleInput"
        :disabled="disabled"
    />
    <span
        class="u-input-number-button u-input-number-button-right"
        :class="{
        'u-input-number-button-disabled': disabled || increaseForbid,
      }"
        @click="handleIncrease"
    >+</span
    >
  </div>
</template>

<script>
// 工具函数，用于判断传入的值是否符合条件
import { oneOf } from '../utils'
import Emitter from "@/components/mixins/emitter";

export default {
  name: 'UInputNumber',
  mixins: [Emitter],
  data() {
    return {
      currentValue: 0, // 初始值
      increaseForbid: false, // 是否还能递增
      decreaseForbid: false, // 是否还能递减
    }
  },
  props: {
    value: {
      type: [Number, String],
      default: 0,
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false,
    },
    // 用户定义的步数
    step: {
      type: Number,
      default: 1,
    },
    // 是否限制为严格步数
    stepStrictly: {
      type: Boolean,
      default: false,
    },
    // 精度
    precision: {
      type: Number,
      default: 0,
    },
    // 最大值
    max: {
      type: Number,
    },
    // 最小值
    min: {
      type: Number,
    },
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
        this.currentValue = newVal
        this.handleBlur(false)
      },
      immediate: true,
    },
  },
  methods: {
    /**
     * @description 数值增加
     */
    handleIncrease() {
      if (this.disabled || this.increaseForbid) return

      this.currentValue = this.currentValue + this.step
      // 增加后检查是否超过最大值
      if (this.max !== undefined && this.currentValue >= this.max) {
        this.currentValue = this.max
        this.increaseForbid = true
      }
      this.$emit('input', this.currentValue)
      this.$emit('change', this.currentValue)
    },
    /**
     * @description 数值减少
     */
    handleDecrease() {
      if (this.disabled || this.decreaseForbid) return
      this.currentValue = this.currentValue - this.step
      // 减少后检查是否低于最小值
      if (this.min !== undefined && this.currentValue <= this.min) {
        this.currentValue = this.min
        this.decreaseForbid = true
      }
      this.$emit('input', this.currentValue)
      this.$emit('change', this.currentValue)
    },
    /**
     * @description 失去焦点时，做下值类型校验
     */
    handleBlur(emitEvent = true) {
      if(!this.currentValue && this.currentValue !== 0) return;
      if (typeof this.currentValue !== 'number') {
        this.currentValue = Number(this.currentValue.replace(/[^\d.-]/g, ''))
      }
      // NaN校验
      if (isNaN(this.currentValue)) {
        this.currentValue = 0
      }

      // 严格步数校验
      if (this.stepStrictly) {
        this.currentValue = this._approCalc(this.currentValue, this.step)
      }

      // 精度校验
      if (this.precision > 0) {
        this.currentValue = this.currentValue.toFixed(
            Math.floor(this.precision)
        )
      }

      // 数值范围判断 - 修复 min=0 时条件失效的问题
      if (this.min !== undefined && this.currentValue <= this.min) {
        this.decreaseForbid = true
        this.currentValue = this.min
      } else {
        this.decreaseForbid = false
      }
      if (this.max !== undefined && this.currentValue >= this.max) {
        this.increaseForbid = true
        this.currentValue = this.max
      } else {
        this.increaseForbid = false
      }

      if (emitEvent) {
        this.$emit('input', this.currentValue)
        this.$emit('change', this.currentValue)
        this.dispatch('UFormItem', 'form-blur', this.currentValue)
      }
    },
    /**
     * @description 输入值变更
     */
    handleInput(_e) {
      const value = _e.target.value
      this.currentValue = value
      // 实时校验并更新按钮禁用状态
      this.updateButtonStatus()
      this.dispatch('UFormItem', 'form-change', value)
    },
    /**
     * @description 更新增减按钮的禁用状态
     */
    updateButtonStatus() {
      const numValue = Number(this.currentValue)
      if (isNaN(numValue)) return
      
      // 检查是否达到最小值
      if (this.min !== undefined && numValue <= this.min) {
        this.decreaseForbid = true
      } else {
        this.decreaseForbid = false
      }
      
      // 检查是否达到最大值
      if (this.max !== undefined && numValue >= this.max) {
        this.increaseForbid = true
      } else {
        this.increaseForbid = false
      }
    },
    /**
     * @description 将数值按照四舍五入的方式进行约算，比如5对3约算后是6
     * @param {number} num 需要被约算的数
     * @param {number} base 基数
     */
    _approCalc(num, base) {
      return Math.round(num / base) * base
    },
  },
}
</script>
<style scoped>

.u-input-number {
  position: relative;
  width: 140px;
  height: 36px;
  line-height: 32px
}

.u-input-number-input {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 7px 36px;
  text-align: center;
  box-sizing: border-box;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  outline: 0;
  font-size: 14px
}

.u-input-number-input:focus {
  border-color: #00554a;
  box-shadow: 0 0 4px #00554a
}

.u-input-number-input-disabled {
  cursor: not-allowed;
  background-color: #f5f7fa;
  color: #b2b6be
}

.u-input-number-button {
  box-sizing: border-box;
  position: absolute;
  width: 30px;
  height: calc(100% - 2px);
  text-align: center;
  font-size: 20px;
  margin: 0;
  padding: 0;
  border: none;
  cursor: pointer;
  background-color: #f5f7fa
}

.u-input-number-button:active {
  background-color: rgba(245, 247, 250, .3)
}

.u-input-number-button-left {
  left: 1px;
  top: 1px;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  border-right: 1px solid #dcdfe6
}

.u-input-number-button-right {
  right: 1px;
  top: 1px;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  border-left: 1px solid #dcdfe6
}

.u-input-number-button-disabled {
  cursor: not-allowed;
  color: #b2b6be
}

.u-input-number-size-large {
  height: 40px;
  line-height: 36px
}

.u-input-number-size-small {
  height: 32px;
  line-height: 28px
}

.u-input-number-size-mini {
  height: 28px;
  line-height: 24px
}
</style>
