<template>
  <div
    class="u-messagebox"
    :class="{ 'u-messagebox-show': visible }"
    :style="{ 'z-index': zIndex }"
  >
    <transition name="messagebox-fade">
      <div class="u-messagebox-wrap" v-show="visible">
        <div class="u-messagebox-title">
          <span>{{ title }}</span>
          <i
            class="u-messagebox-close iconfont icon-close"
            @click="handleClose"
          />
        </div>
        <div class="u-messagebox-prompt" v-if="type === 'prompt'">
          <p v-if="useHTMLString" v-html="message"></p>
          <p v-else>
            <slot>
              {{ message }}
            </slot>
          </p>
          <div class="u-messagebox-input">
            <os-input style="width: 100%" v-model="currentValue" />
          </div>
        </div>
        <div class="u-messagebox-content" v-else>
          <i
            v-show="type === 'confirm'"
            class="u-messagebox-icon iconfont icon-warning"
          />
          <div
            class="u-messagebox-text"
            v-if="useHTMLString"
            v-html="message"
          ></div>
          <div class="u-messagebox-text" v-else>
            <slot>
              {{ message }}
            </slot>
          </div>
        </div>
        <div class="u-messagebox-footer">
          <os-button
            @click="handleCancel"
            v-show="type !== 'alert'"
            type="info"
            style="margin-right: 5px"
            >取消</os-button
          >
          <os-button @click="handleSubmit">确定</os-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import Button from "../button";
import Input from "../input";

export default {
  name: "UMessageBox",
  components: {
    osButton: Button,
    osInput: Input
  },
  data() {
    return {
      zIndex: 20100,
      useHTMLString: false, // 是否使用HTML片段
      currentValue: "", // 输入的内容
      title: "", // 标题
      message: "", // 消息内容
      type: "alert",
      visible: false,
      callback: "", // 点击确定按钮的回调
      resolve: "", // resolve回调
      reject: "" // reject回调
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.currentValue = "";
        this.zIndex = this.$osUI ? this.$osUI.zIndex++ : this.zIndex++;
      }
    }
  },
  mounted() {
    window.addEventListener("keydown", this.handleCloseByEsc);
  },
  methods: {
    /**
     * @description alert的参数
     * @param {object} params 参数
     */
    alert(params) {
      // 参数处理
      const {
        title,
        message,
        type,
        callback,
        resolve,
        reject,
        useHTMLString
      } = params;

      this.type = type;

      this.title = title;
      this.message = message;
      this.useHTMLString = useHTMLString || false;

      this.callback = callback;
      this.resolve = resolve;
      this.reject = reject;

      this.visible = true;
    },
    handleClose() {
      this.visible = false;
    },
    /**
     * @description 确定按钮事件
     */
    handleSubmit() {
      this.visible = false;
      // 是否传了callback函数，若是有就执行，否则执行resolve
      if (typeof this.callback === "function") {
        this.callback(this.currentValue);
      } else {
        this.resolve(this.currentValue);
      }
    },
    /**
     * @description 取消按钮回调
     */
    handleCancel() {
      this.visible = false;
      this.reject();
    },
    /**
     * @description 按键esc关闭当前弹窗
     */
    handleCloseByEsc(event) {
      if (event.keyCode === 27 && this.visible) {
        this.handleClose();
      }
    }
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleCloseByEsc);
  }
};
</script>
<style scoped>

.u-messagebox {
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

.u-messagebox-show {
  background-color: rgba(0, 0, 0, .5);
  visibility: visible
}

.u-messagebox-wrap {
  position: fixed;
  left: calc(50% - 200px);
  top: 35%;
  width: 400px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
  box-sizing: border-box
}

.u-messagebox-title {
  position: relative;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  padding: 10px 15px 10px 10px;
  background-color: #00554a;
  color: #fff;
  font-size: 16px;
  font-weight: 500
}

.u-messagebox-close {
  position: absolute;
  right: 5px;
  width: 20px;
  height: 20px;
  line-height: 20px;
  cursor: pointer;
  color: #fff
}

.u-messagebox-close:hover {
  color: #ddd
}

.u-messagebox-content {
  padding: 15px;
  line-height: 18px;
  min-height: 36px;
  display: flex
}

.u-messagebox-text {
  font-size: 14px;
  word-break: break-all;
}

.u-messagebox-icon {
  position: relative;
  top: -2px;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  margin-right: 10px;
  font-size: 24px;
  color: #e6a23c
}

.u-messagebox-footer {
  padding: 0 15px 15px 15px;
  text-align: right
}

.u-messagebox-prompt {
  padding: 10px 15px
}

.u-messagebox-prompt p {
  line-height: 1.5;
  font-size: 14px;
  margin-bottom: 10px
}
</style>
