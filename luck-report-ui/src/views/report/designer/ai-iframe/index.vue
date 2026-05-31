<template>
  <div class="ai-iframe-container">
    <div class="ai-dialog-wrapper" v-if="visible">
      <div class="ai-dialog-header">
        <span class="ai-dialog-title">AI 助手</span>
        <button class="ai-dialog-close" @click="handleClose">×</button>
      </div>
      <iframe
        ref="aiFrame"
        :src="iframeSrc"
        class="ai-dialog-iframe"
        allowtransparency="true"
        @load="onIframeLoad"
      ></iframe>
    </div>
    
    <div class="ai-toggle-button" @click="handleToggle" v-if="!visible">
      <span>AI</span>
    </div>
  </div>
</template>

<script>
/**
 * AI 对话框 iframe 组件
 * 用于在设计器页面中嵌入 Vue3 AI 对话框
 * 支持显示/隐藏控制，方便后续移除和隐藏管理
 */
export default {
  name: 'AiIframe',
  props: {
    /**
     * AI 对话框的 URL 地址
     * @type {String}
     * @default 'http://localhost:8996/agent?iframe=true'
     */
    url: {
      type: String,
      default: 'http://localhost:8996/export'
    },
    /**
     * 是否默认显示对话框
     * @type {Boolean}
     * @default false
     */
    defaultVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      visible: this.defaultVisible
    };
  },
  computed: {
    iframeSrc() {
      return this.url;
    }
  },
  methods: {
    /**
     * 切换对话框显示状态
     */
    handleToggle() {
      this.visible = !this.visible;
      this.$emit('toggle', this.visible);
    },
    /**
     * 关闭对话框
     */
    handleClose() {
      this.visible = false;
      this.$emit('close');
    },
    /**
     * iframe 加载完成回调
     */
    onIframeLoad() {
      console.log('AI 对话框 iframe 加载完成');
      this.$emit('load');
    },
    /**
     * 外部调用：显示对话框
     */
    show() {
      this.visible = true;
    },
    /**
     * 外部调用：隐藏对话框
     */
    hide() {
      this.visible = false;
    }
  }
}
</script>

<style scoped>
.ai-iframe-container {
  position: absolute;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
}

.ai-dialog-wrapper {
  width: 420px;
  height: 600px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.ai-dialog-title {
  font-size: 16px;
  font-weight: 600;
}

.ai-dialog-close {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.ai-dialog-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ai-dialog-iframe {
  flex: 1;
  border: none;
  width: 100%;
  background: transparent;
}

.ai-toggle-button {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}

.ai-toggle-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.ai-toggle-button span {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}
</style>
