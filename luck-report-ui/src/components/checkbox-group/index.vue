<template>
  <div class="u-checkbox-group">
    <slot></slot>
  </div>
</template>

<script>
import Emitter from "@/components/mixins/emitter";
import { oneOf } from "../utils";

export default {
  name: 'UCheckboxGroup',
  mixins: [Emitter],
  data() {
    return {
      options: [], // 选项
    }
  },
  props: {
    // 选中值
    value: {
      type: Array,
      default: () => [],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    // 限制最多选择数量，-1为不限制
    max: {
      type: Number,
      default: -1,
    },
    // 限制最少选择数量，-1为不限制
    min: {
      type: Number,
      default: -1,
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
        this.initValue()
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
    // 监听on-checkbox-add事件，将checkbox实例存到options上
    this.$on('on-checkbox-add', (checkbox) => {
      this.options.push(checkbox)
      this.initValue()
      this.syncOptionsDisable(this.disabled)
      this.syncOptionsButtonStyle(this.button)
      this.syncOptionsSize(this.size)
    })
    // 监听on-checkbox-remove事件，将checkbox实例从options中移除
    this.$on('on-checkbox-remove', (checkbox) => {
      this.options.splice(this.options.indexOf(checkbox), 1)
      this.syncValue()
    })
    // 监听checkbox的选中事件，做value值同步
    this.$on('on-checkbox-select', () => {
      this.syncValue()
    })
  },
  methods: {
    initValue() {
      let that = this;
      this.options.forEach((cell) => {
        if(that.value){
          cell.checked = that.value.find((d) => d === cell.label)
        }
      })
      this.$nextTick(() => {
        this.optionsLimit()
      })
    },
    /**
     * @description value值同步
     */
    syncValue() {
      let currentValue = this.options.reduce((currentArr, cell) => {
        cell.checked && currentArr.push(cell.label)
        return currentArr
      }, [])
      this.$emit('input', currentValue)
      this.$emit("change", currentValue);
      this.dispatch('UFormItem', 'form-change', currentValue)
      this.optionsLimit()
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
     * @description 数量限制操作
     */
    optionsLimit() {
      this.$nextTick(() => {
        this.options.forEach((cell) => {
          cell.limitDisabled = false
        })

        const length = this.value.length
        // 最大值限制
        if (length >= this.max && this.max > -1) {
          this.options.forEach((cell) => {
            if (!cell.checked) {
              cell.limitDisabled = true
            }
          })
        }
        // 最小值限制
        if (length <= this.min && this.min > -1) {
          this.options.forEach((cell) => {
            if (cell.checked) {
              cell.limitDisabled = true
            }
          })
        }
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
.u-checkbox-group {
  //overflow: hidden
}
</style>
