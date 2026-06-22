<template>
  <label
      class="u-checkbox"
    :class="{
    'u-checkbox-checked': checked,
    'u-checkbox-disabled': forbidden,
    [`u-checkbox-${localSize}-border`]: border,
    [`u-checkbox-${localSize}-button`]: button,
    'u-checkbox-checked-button': checked && button
  }"
  >
    <input
        type="checkbox"
        class="u-checkbox-input"
        @click="handleClick"
        :disabled="forbidden"
    />
    <span
        class="u-checkbox-icon"
        :class="{
        'u-checkbox-icon-checked': checked,
        'u-checkbox-icon-indeterminate': indeterminate,
        'u-checkbox-icon-indeterminate-disabled': forbidden && indeterminate,
        'u-checkbox-icon-disabled': forbidden,
        'u-checkbox-icon-checked-disabled': forbidden && checked,
        'u-checkbox-icon-button': button
      }"
    >
    </span>
    <span class="u-checkbox-label">
      <slot></slot>
    </span>
  </label>
</template>

<script>
// 工具函数，用于判断传入的值是否符合条件
import { oneOf } from "../utils";

import Emitter from "../mixins/emitter";

export default {
  name: "UCheckbox",
  mixins: [Emitter],
  data() {
    return {
      checked: false, // 是否被选中
      localDisabled: false, // 是否被禁用，该属性由父级控制
      limitDisabled: false, // 是否因为父级数量限制而被禁用
      button: false, // 是否渲染成按钮样式
      localSize: "medium" // 真实用于渲染的尺寸，由父级同步（避开 prop 警告）
    };
  },
  props: {
    // v-model的值
    value: {
      type: [Boolean, Number, String],
      default: false
    },
    // 不确定状态
    indeterminate: {
      type: Boolean,
      default: false
    },
    // 是否禁用该组件
    disabled: {
      type: Boolean,
      default: false
    },
    // 选中状态下的值，在多选时发挥作用。
    label: {
      type: [Boolean, Number, String],
      default: ""
    },
    // 是否绘制边框
    border: {
      type: Boolean,
      default: false
    },
    // 尺寸
    size: {
      validator(value) {
        return oneOf(value, ["large", "medium", "small", "mini"]);
      },
      type: String,
      default: "medium"
    }
  },
  watch: {
    value: {
      handler(newVal) {
        this.checked = newVal;
      },
      immediate: true
    },
    // 把 prop 同步到内部 data，组组件直接改 localSize 不再触发 prop 警告
    size: {
      handler(newVal) {
        this.localSize = newVal;
      },
      immediate: true
    }
  },
  computed: {
    forbidden() {
      return this.disabled || this.localDisabled || this.limitDisabled;
    }
  },
  mounted() {
    // 通知UCheckboxGroup组件调用on-checkbox-add方法，参数为当前checkbox实例
    this.dispatch("UCheckboxGroup", "on-checkbox-add", this);
  },
  beforeDestroy() {
    // 移除时，调用UCheckboxGroup组件的on-checkbox-remove方法
    this.dispatch("UCheckboxGroup", "on-checkbox-remove", this);
  },
  methods: {
    /**
     * @description 复选框点击事件
     */
    handleClick() {
      this.checked = !this.checked;
      this.$emit("input", this.checked);
      this.$emit("change", this.checked);
      this.dispatch("UCheckboxGroup", "on-checkbox-select", this);
    }
  }
};
</script>
<style scoped>
.u-checkbox {
  box-sizing: border-box;
  display: inline-block;
  cursor: pointer;
  height: 20px;
  font-size: 16px;
  vertical-align: top;
  margin-right: 20px
}

.u-checkbox-input {
  display: none
}

.u-checkbox-icon {
  display: inline-block;
  box-sizing: border-box;
  position: relative;
  top: 2px;
  width: 14px;
  height: 14px;
  border-radius: 2px;
  border: 1px solid #dcdfe6
}

.u-checkbox-icon:after {
  content: "";
  position: absolute;
  box-sizing: border-box;
  width: 7px;
  height: 3px;
  border-top: 1px solid #fff;
  border-right: 1px solid #fff;
  left: 3px;
  top: 3.5px;
  transform: rotate(135deg)
}

.u-checkbox-icon-checked {
  background: #00554a;
  border-color: #00554a
}

.u-checkbox-icon-checked-disabled {
  border-color: #c0c4cc
}

.u-checkbox-icon-checked-disabled:after {
  border-color: #c0c4cc !important
}

.u-checkbox-icon-disabled {
  background-color: #edf2fc
}

.u-checkbox-icon-disabled:after {
  border-color: #edf2fc
}

.u-checkbox-icon-indeterminate {
  background: #00554a;
  border-color: #00554a
}

.u-checkbox-icon-indeterminate:after {
  transform: rotate(0);
  border-right: none;
  width: 8px;
  height: 0;
  left: 2px;
  top: 5.5px;
  border-color: #fff
}

.u-checkbox-icon-indeterminate-disabled {
  background-color: #edf2fc;
  border-color: #c0c4cc
}

.u-checkbox-icon-indeterminate-disabled:after {
  border-color: #c0c4cc !important
}

.u-checkbox-icon-button {
  display: none
}

.u-checkbox-label {
  display: inline-block;
  height: 100%;
  margin-left: 3px
}

.u-checkbox-checked {
  color: #00554a;
  border-color: #00554a !important
}

.u-checkbox-checked-button {
  color: #fff;
  background-color: #00554a !important;
  border-color: #dcdfe6 !important
}

.u-checkbox-disabled {
  cursor: not-allowed;
  color: #c0c4cc
}

.u-checkbox-large-border {
  height: 40px;
  padding: 8px 8px 12px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px
}

.u-checkbox-medium-border {
  height: 36px;
  padding: 6px 8px 10px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px
}

.u-checkbox-small-border {
  height: 32px;
  padding: 4px 8px 8px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px
}

.u-checkbox-mini-border {
  height: 28px;
  padding: 2px 8px 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px
}

.u-checkbox-large-button {
  float: left;
  background-color: #fff;
  height: 40px;
  line-height: 38px;
  padding: 0 15px 0 12px;
  margin: 0;
  border: 1px solid #dcdfe6
}

.u-checkbox-medium-button {
  float: left;
  background-color: #fff;
  height: 36px;
  line-height: 34px;
  padding: 0 15px 0 12px;
  margin: 0;
  border: 1px solid #dcdfe6
}

.u-checkbox-small-button {
  float: left;
  background-color: #fff;
  height: 32px;
  line-height: 30px;
  padding: 0 15px 0 12px;
  margin: 0;
  border: 1px solid #dcdfe6;
  font-size: 14px
}

.u-checkbox-mini-button {
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
