<template>
  <button
    class="u-button"
    v-bind="$attrs"
    :type="nativeType"
    :disabled="disabled || loading"
    :class="{
      [`u-button-${type}`]: true,
      [`u-button-${type}-disabled`]: disabled,
      [`u-button-size-${size}`]: true,
      [`u-button-size-${size}-round`]: round,
      [`u-button-size-${size}-circle`]: circle,
      [`u-button-loading-layer`]: loading
    }"
    @click="handleClick"
  >
    <i
      class="iconfont icon-loading"
      :class="{ [`u-button-loading`]: true }"
      v-if="loading"
    />
    <i :class="['iconfont', `${icon}`]" v-if="!loading && icon"></i>
    <slot></slot>
  </button>
</template>

<script>
// 工具函数，用于判断传入的值是否符合条件
import { oneOf } from "../utils";

export default {
  name: "UButton",
  inheritAttrs: false,
  data() {
    return {};
  },
  props: {
    nativeType: {
      type: String,
      default: 'button',
      validator(value) {
        return oneOf(value, ['button', 'submit', 'reset']);
      }
    },
    type: {
      validator(value) {
        return oneOf(value, [
          "primary",
          "info",
          "success",
          "warning",
          "text",
          "error"
        ]);
      },
      type: String,
      default: "primary"
    },
    disabled: {
      type: Boolean,
      default: false
    },
    size: {
      validator(value) {
        return oneOf(value, ["large", "medium", "small", "mini"]);
      },
      type: String,
      default: "medium"
    },
    // 图标
    icon: {
      type: String
    },
    // 圆角按钮
    round: {
      type: Boolean,
      default: false
    },
    // 圆形按钮
    circle: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleClick(event) {
      this.$emit("click", event);
    }
  }
};
</script>
<style scoped>
.u-button {
  height: 36px;
  font-size: 14px;
  position: relative;
  color: #fff;
  border-radius: 4px;
  outline: 0;
  border: 1px solid transparent;
  padding: 0 10px;
  cursor: pointer
}

.u-button-primary {
  background-color: #00554a;
  border-color: #00554a
}

.u-button-primary:focus,
.u-button-primary:hover {
  background-color: rgba(0, 85, 74, .7);
  border-color: rgba(0, 85, 74, .7)
}

.u-button-primary:active {
  background-color: rgba(0, 85, 74, .9);
  border-color: rgba(0, 85, 74, .9)
}

.u-button-primary-disabled {
  cursor: not-allowed;
  background-color: rgba(0, 85, 74, .5);
  border-color: rgba(0, 85, 74, .5)
}

.u-button-primary-disabled:active,
.u-button-primary-disabled:focus,
.u-button-primary-disabled:hover {
  background-color: rgba(0, 85, 74, .5);
  border-color: rgba(0, 85, 74, .5)
}

.u-button-info {
  background-color: #fff;
  border-color: #ddd;
  color: #5e6d82
}

.u-button-info:focus,
.u-button-info:hover {
  color: rgba(0, 85, 74, .5);
  border-color: rgba(0, 85, 74, .5)
}

.u-button-info:active {
  color: #00554a
}

.u-button-info-disabled {
  cursor: not-allowed;
  color: rgba(94, 109, 130, .5)
}

.u-button-info-disabled:active,
.u-button-info-disabled:focus,
.u-button-info-disabled:hover {
  color: rgba(94, 109, 130, .5)
}

.u-button-success {
  background-color: #67c23a;
  border-color: #67c23a
}

.u-button-success:focus,
.u-button-success:hover {
  background-color: rgba(103, 194, 58, .7)
}

.u-button-success:active {
  background-color: rgba(103, 194, 58, .9)
}

.u-button-success-disabled {
  cursor: not-allowed;
  background-color: rgba(103, 194, 58, .5);
  border-color: rgba(103, 194, 58, .5)
}

.u-button-success-disabled:active,
.u-button-success-disabled:focus,
.u-button-success-disabled:hover {
  background-color: rgba(103, 194, 58, .5);
  border-color: rgba(103, 194, 58, .5)
}

.u-button-warning {
  background-color: #e6a23c;
  border-color: #e6a23c
}

.u-button-warning:focus,
.u-button-warning:hover {
  background-color: rgba(230, 162, 60, .7)
}

.u-button-warning:active {
  background-color: rgba(230, 162, 60, .9)
}

.u-button-warning-disabled {
  cursor: not-allowed;
  background-color: rgba(230, 162, 60, .5);
  border-color: rgba(230, 162, 60, .5)
}

.u-button-warning-disabled:active,
.u-button-warning-disabled:focus,
.u-button-warning-disabled:hover {
  background-color: rgba(230, 162, 60, .5);
  border-color: rgba(230, 162, 60, .5)
}

.u-button-text {
  background-color: #fff;
  border-color: #fff;
  color: #00554a
}

.u-button-text:focus,
.u-button-text:hover {
  color: rgba(0, 85, 74, .7)
}

.u-button-text:active {
  color: rgba(0, 85, 74, .9)
}

.u-button-text-disabled {
  cursor: not-allowed;
  color: rgba(0, 85, 74, .5)
}

.u-button-text-disabled:active,
.u-button-text-disabled:focus,
.u-button-text-disabled:hover {
  color: rgba(0, 85, 74, .5)
}

.u-button-error {
  background-color: #f56c6c;
  border-color: #f56c6c
}

.u-button-error:focus,
.u-button-error:hover {
  background-color: rgba(245, 108, 108, .7)
}

.u-button-error:active {
  background-color: rgba(245, 108, 108, .9)
}

.u-button-error-disabled {
  cursor: not-allowed;
  background-color: rgba(245, 108, 108, .5);
  border-color: rgba(245, 108, 108, .5)
}

.u-button-error-disabled:active,
.u-button-error-disabled:focus,
.u-button-error-disabled:hover {
  background-color: rgba(245, 108, 108, .5);
  border-color: rgba(245, 108, 108, .5)
}

.u-button-size-large {
  height: 40px;
  line-height: 40px
}

.u-button-size-large-round {
  border-radius: 20px
}

.u-button-size-large-circle {
  min-width: 40px;
  border-radius: 50%
}

.u-button-size-medium {
  height: 36px;
  line-height: 36px
}

.u-button-size-medium-round {
  border-radius: 18px
}

.u-button-size-medium-circle {
  min-width: 36px;
  border-radius: 50%
}

.u-button-size-small {
  height: 32px;
  line-height: 32px;
  font-size: 13px
}

.u-button-size-small-round {
  border-radius: 16px
}

.u-button-size-small-circle {
  padding: 0 5px;
  min-width: 32px;
  border-radius: 50%
}

.u-button-size-mini {
  height: 28px;
  line-height: 28px;
  font-size: 13px
}

.u-button-size-mini-round {
  border-radius: 14px
}

.u-button-size-mini-circle {
  padding: 0 5px;
  min-width: 28px;
  border-radius: 50%
}

.u-button-loading {
  display: inline-block;
  animation: loading 2s linear infinite
}
</style>
