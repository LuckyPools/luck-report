<template>
  <div
    class="u-dialog"
    :class="{ 'u-dialog-show': visible }"
    :style="{ 'z-index': zIndex }"
    @click.self="handleClickMask"
  >
    <transition
      name="messagebox-fade"
      @after-enter="$emit('opend')"
      @after-leave="$emit('closed')"
    >
      <div
        class="u-dialog-wrap"
        v-show="visible"
        :style="{ width: width, 'margin-top': top }"
      >
        <!-- 标题区 -->
        <div class="u-dialog-wrap-title">
          <slot name="title">{{ title }}</slot>
          <i
            class="iconfont icon-close u-dialog-wrap-close-btn"
            v-if="showClose"
            @click="handleClose"
          />
        </div>
        <!-- 内容区域 -->
        <div class="u-dialog-wrap-content" v-if="rendered">
          <slot>

          </slot>
        </div>

        <div class="u-dialog-wrap-footer" v-if="$slots.footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: "UDialog",
  data() {
    return {
      // 是否已经渲染，该属性用来控制
      rendered: false
    };
  },
  props: {
    // 是否可见
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: "标题"
    },
    // 是否可以通过按下ESC键来关闭弹窗
    closeOnPressEscape: {
      type: Boolean,
      default: true
    },
    // 弹框的宽度
    width: {
      type: String,
      default: "50%"
    },
    top: {
      type: String,
      default: "15vh"
    },
    // 关闭前的回调
    beforeClose: {
      type: Function
    },
    // 是否将元素挂到body上
    appendToBody: {
      type: Boolean,
      default: true
    },
    // 是否显示关闭按钮
    showClose: {
      type: Boolean,
      default: true
    },
    // 是否允许点击遮罩层关闭弹窗
    closeOnClickModal: {
      type: Boolean,
      default: false
    },
    zIndex: {
      type: Number,
      default: 20000
    },
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.rendered = true;
        this.$emit("open");
        if (this.appendToBody) {
          document.body.appendChild(this.$el);
        }
      } else {
        this.$emit("close");
      }
    }
  },
  mounted() {
    window.addEventListener("keydown", this.handleCloseByEsc);
  },
  methods: {
    handleClickMask() {
      if (this.closeOnClickModal) {
        this.handleClose();
      }
    },
    /**
     * @description 关闭函数,如果存在关闭前回调，则暂停关闭操作。
     */
    handleClose() {
      if (typeof this.beforeClose === "function") {
        this.beforeClose(() => {
          this.$emit("update:visible", false);
          this.$emit("close");
        });
      } else {
        this.$emit("update:visible", false);
        this.$emit("close");
      }
    },
    /**
     * @description 按键esc关闭当前弹窗
     */
    handleCloseByEsc(event) {
      if (event.keyCode === 27 && this.closeOnPressEscape && this.visible) {
        this.handleClose();
      }
    }
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.handleCloseByEsc);
  }
};
</script>
<style scoped>

.u-dialog {
  z-index: 2000;
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0);
  visibility: hidden;
  transition: all .2s
}

.u-dialog-show {
  background-color: rgba(0, 0, 0, .5);
  visibility: visible
}

.u-dialog-wrap {
  width: 50%;
  margin: 15vh auto 0;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
  box-sizing: border-box
}

.u-dialog-wrap-title {
  position: relative;
  padding: 10px;
  line-height: 20px;
  color: #fff;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  background-color: #00554a
}

.u-dialog-wrap-close-btn {
  position: absolute;
  width: 20px;
  height: 20px;
  right: 10px;
  top: 10px;
  line-height: 20px;
  text-align: center;
  cursor: pointer
}

.u-dialog-wrap-content {
  padding: 20px
}

.u-dialog-wrap-footer {
  padding: 20px
}
</style>
