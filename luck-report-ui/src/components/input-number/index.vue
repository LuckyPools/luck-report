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
    min() {
      this.syncValueAndButtons(false)
    },
    max() {
      this.syncValueAndButtons(false)
    },
  },
  computed: {
    /** 有效最小值（兼容字符串数字；null/非数字 = 不限制） */
    boundMin() {
      return this.parseBound(this.min)
    },
    /** 有效最大值（兼容字符串数字；null/非数字 = 不限制） */
    boundMax() {
      return this.parseBound(this.max)
    },
  },
  methods: {
    /**
     * 解析上下限：仅有限数字生效；字符串数字会 Number()；null/undefined/非法 → null（不限制）
     * 注意：不能用 `!= null` 后直接比较，null 在 <= 比较里会变成 0
     */
    parseBound(v) {
      if (v === null || v === undefined || v === '') return null
      if (typeof v === 'number') return Number.isFinite(v) ? v : null
      const num = Number(v)
      return Number.isFinite(num) ? num : null
    },
    hasBound(v) {
      return typeof v === 'number' && Number.isFinite(v)
    },
    /**
     * 将当前展示值安全转为数字；空值按 0 参与加减
     */
    toSafeNumber(val) {
      if (val === null || val === undefined || val === '') return 0
      if (typeof val === 'number') return Number.isFinite(val) ? val : 0
      const num = Number(String(val).replace(/[^\d.-]/g, ''))
      return Number.isFinite(num) ? num : 0
    },
    /**
     * @description 数值增加
     */
    handleIncrease() {
      if (this.disabled || this.increaseForbid) return

      const max = this.boundMax
      let next = this.toSafeNumber(this.currentValue) + this.step
      if (this.hasBound(max) && next >= max) {
        next = max
      }
      this.currentValue = next
      this.updateButtonStatus()
      this.$emit('input', this.currentValue)
      this.$emit('change', this.currentValue)
    },
    /**
     * @description 数值减少
     */
    handleDecrease() {
      if (this.disabled || this.decreaseForbid) return

      const min = this.boundMin
      let next = this.toSafeNumber(this.currentValue) - this.step
      if (this.hasBound(min) && next <= min) {
        next = min
      }
      this.currentValue = next
      this.updateButtonStatus()
      this.$emit('input', this.currentValue)
      this.$emit('change', this.currentValue)
    },
    /**
     * 按 min/max 夹紧当前值并刷新按钮状态
     */
    syncValueAndButtons(emitEvent) {
      if (this.currentValue === null || this.currentValue === undefined || this.currentValue === '') {
        this.updateButtonStatus()
        return
      }
      const min = this.boundMin
      const max = this.boundMax
      let num = this.toSafeNumber(this.currentValue)
      if (this.stepStrictly) {
        num = this._approCalc(num, this.step)
      }
      if (this.precision > 0) {
        num = Number(num.toFixed(Math.floor(this.precision)))
      }
      if (this.hasBound(min) && num < min) {
        num = min
      }
      if (this.hasBound(max) && num > max) {
        num = max
      }
      this.currentValue = num
      this.updateButtonStatus()
      if (emitEvent) {
        this.$emit('input', this.currentValue)
        this.$emit('change', this.currentValue)
        this.dispatch('UFormItem', 'form-blur', this.currentValue)
      }
    },
    /**
     * @description 失去焦点时，做下值类型校验
     */
    handleBlur(emitEvent = true) {
      // 清空时必须把 null 写回 v-model，否则父级仍保留旧数字，必填校验会误通过
      if (this.currentValue === null || this.currentValue === undefined || this.currentValue === '') {
        this.currentValue = null
        this.updateButtonStatus()
        if (emitEvent) {
          this.$emit('input', null)
          this.$emit('change', null)
          this.dispatch('UFormItem', 'form-blur', null)
        }
        return
      }
      this.syncValueAndButtons(emitEvent)
    },
    /**
     * @description 输入值变更
     */
    handleInput(_e) {
      const value = _e.target.value
      this.currentValue = value
      // 实时校验并更新按钮禁用状态
      this.updateButtonStatus()
      // 清空时同步父级；输入中的半成品数字仍等 blur 再规范化，避免 type:number 误伤
      if (value === '') {
        this.$emit('input', null)
        this.$emit('change', null)
      }
      this.dispatch('UFormItem', 'form-change', value === '' ? null : value)
    },
    /**
     * @description 更新增减按钮的禁用状态
     */
    updateButtonStatus() {
      const min = this.boundMin
      const max = this.boundMax
      const numValue = this.toSafeNumber(this.currentValue)
      // 空展示时按 0 判断是否还能继续减到负数 min
      const empty = this.currentValue === null || this.currentValue === undefined || this.currentValue === ''
      const valueForBound = empty ? 0 : (typeof this.currentValue === 'number' && Number.isFinite(this.currentValue)
        ? this.currentValue
        : numValue)

      this.decreaseForbid = this.hasBound(min) && valueForBound <= min
      this.increaseForbid = this.hasBound(max) && valueForBound >= max
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
