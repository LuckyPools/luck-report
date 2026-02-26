<template>
  <transition :name="disableTransitions ? '' : 'fade'">
    <div
        class="u-tag"
        :class="{
        [`u-tag-${effect}-${type}`]: true,
        [`u-tag-size-${size}`]: true
      }"
        v-if="visible"
    >
      <slot></slot>
      <i
          class="iconfont icon-close u-tag-close"
          @click="handleClose"
          v-if="closeable"
      />
    </div>
  </transition>
</template>

<script>
// 工具函数，用于判断传入的值是否符合条件
import { oneOf } from "../utils";

export default {
  name: "UTag",
  data() {
    return {
      visible: true
    };
  },
  props: {
    size: {
      validator(value) {
        return oneOf(value, ["large", "medium", "small", "mini"]);
      },
      type: String,
      default: "large"
    },
    type: {
      validator(value) {
        return oneOf(value, ["primary", "success", "warning", "text", "error"]);
      },
      type: String,
      default: "primary"
    },
    effect: {
      validator(value) {
        return oneOf(value, ["light", "dark", "plain"]);
      },
      type: String,
      default: "light"
    },
    closeable: {
      type: Boolean,
      default: false
    },
    disableTransitions: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleClose() {
      this.visible = false;
      this.$emit("close");
    }
  }
};
</script>
<style scoped>

.u-tag {
  display: inline-block;
  line-height: 18px;
  padding: 6px 5px;
  height: 18px;
  background-color: #d5fffa;
  color: #00554a;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid #55ffe9
}

.u-tag-close {
  cursor: pointer;
  margin-left: 4px
}

.u-tag-size-medium {
  padding: 4px 5px
}

.u-tag-size-small {
  padding: 2px 5px
}

.u-tag-size-mini {
  padding: 0 5px
}

.u-tag-light-success {
  background-color: #eef8e9;
  border: 1px solid #a3db87;
  color: #67c23a
}

.u-tag-light-warning {
  background-color: #faedda;
  border: 1px solid #f2cd96;
  color: #e6a23c
}

.u-tag-light-text {
  background-color: #edeeee;
  border: 1px solid #c5c7ca;
  color: #909399
}

.u-tag-light-error {
  background-color: #fde3e3;
  border: 1px solid #fbcccc;
  color: #f56c6c
}

.u-tag-dark-primary {
  background-color: #00554a;
  border-color: #00554a;
  color: #fff
}

.u-tag-dark-success {
  background-color: #67c23a;
  border-color: #67c23a;
  color: #fff
}

.u-tag-dark-warning {
  background-color: #e6a23c;
  border-color: #e6a23c;
  color: #fff
}

.u-tag-dark-text {
  background-color: #909399;
  border-color: #909399;
  color: #fff
}

.u-tag-dark-error {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: #fff
}

.u-tag-plain-primary {
  background-color: #fff;
  border-color: #00554a;
  color: #00554a
}

.u-tag-plain-success {
  background-color: #fff;
  border-color: #67c23a;
  color: #67c23a
}

.u-tag-plain-warning {
  background-color: #fff;
  border-color: #e6a23c;
  color: #e6a23c
}

.u-tag-plain-text {
  background-color: #fff;
  border-color: #909399;
  color: #909399
}

.u-tag-plain-error {
  background-color: #fff;
  border-color: #f56c6c;
  color: #f56c6c
}
</style>
