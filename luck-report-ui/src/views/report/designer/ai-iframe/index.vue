<template>
  <div class="ai-iframe-container">
    <div 
      class="ai-dialog-wrapper" 
      v-if="visible"
      :style="{
        transform: `translate(${panelPosition.x}px, ${panelPosition.y}px)`
      }"
    >
      <div 
        class="ai-dialog-header"
        @mousedown="handleMouseDown"
        :style="{ cursor: isDragging ? 'grabbing' : 'grab' }"
      >
        <span class="ai-dialog-title">AI 助手</span>
        <div class="ai-dialog-actions">
          <button class="ai-dialog-btn" @click="handTest">打印</button>
          <button class="ai-dialog-btn" @click="handInput">输入</button>
        </div>
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
import { agentMethodRegistry, getAgentMethodNames, getAgentMethodArgs } from "@/views/report/designer/ai-iframe/utils";

/**
 * AI 对话框 iframe 组件
 * 用于在设计器页面中嵌入 Vue3 AI 对话框
 * 支持显示/隐藏控制，方便后续移除和隐藏管理
 * 支持通过 postMessage 接收子 iframe 发送的指令并动态执行
 *
 * 方法注册机制：
 * - 所有可供 AI Agent 调用的方法统一在 utils.js 的 agentMethodRegistry 中注册
 * - 本组件不再重复定义方法，executeCodeString 通过注册表自动注入方法到 new Function 执行环境
 * - 新增方法只需在 utils.js 中定义并注册即可，无需修改本组件
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
      default: 'http://localhost:8995/export'
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
      visible: this.defaultVisible,
      // 拖动相关状态
      isDragging: false,
      panelPosition: { x: 0, y: 0 },
      dragStart: { x: 0, y: 0 },
      // 面板尺寸（用于边界检测）
      panelWidth: 420,
      panelHeight: 600
    };
  },
  computed: {
    iframeSrc() {
      return this.url;
    }
  },
  created() {
    this._methodNames = getAgentMethodNames();
    this._methodArgs = getAgentMethodArgs();
  },
  mounted() {
    window.addEventListener('message', this.handleIframeMessage);
    // 拖动事件监听
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('resize', this.handleResize);
    // 初始化面板位置
    this.resetPosition();
  },
  beforeDestroy() {
    window.removeEventListener('message', this.handleIframeMessage);
    // 移除拖动事件监听
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    /**
     * 处理来自子 iframe 的消息
     * 支持两种模式：
     * 1. action + data 模式：直接调用注册表中的方法
     * 2. codeString 模式：使用 new Function 动态执行代码字符串
     * 支持返回结果给子 iframe
     * @param {MessageEvent} event - 消息事件对象
     */
    handleIframeMessage(event) {
      if (!event.data || event.data.type !== 'IFRAME_COMMAND') {
        return;
      }

      const { action, data, codeString, requestId } = event.data;
      const source = event.source;

      if (codeString) {
        this.executeCodeString(codeString, requestId, source);
        return;
      }

      if (agentMethodRegistry[action]) {
        console.log(`[AiIframe] 执行指令: ${action}`, data);
        const result = agentMethodRegistry[action](data);
        if (result && typeof result.then === 'function') {
          result.then(res => {
            if (requestId && source) {
              this.sendResponse(source, requestId, res);
            }
          }).catch(error => {
            if (requestId && source) {
              this.sendResponse(source, requestId, undefined, error.message || '执行失败');
            }
          });
        } else {
          if (requestId && source) {
            this.sendResponse(source, requestId, result);
          }
        }
      } else {
        console.warn(`[AiIframe] 未找到方法: ${action}`);
        if (requestId && source) {
          this.sendResponse(source, requestId, undefined, `未找到方法: ${action}`);
        }
      }
    },

    /**
     * 发送响应结果给子 iframe
     * 对对象类型的 result 进行 JSON 序列化/反序列化，剥离 Vue 响应式属性（如 __ob__），
     * 避免 postMessage 结构化克隆时因循环引用或不可克隆属性抛出 DataCloneError
     * @param {Window} source - 消息来源窗口
     * @param {string} requestId - 请求 ID
     * @param {any} result - 执行结果
     * @param {string} error - 错误信息
     */
    sendResponse(source, requestId, result, error) {
      let serializableResult = result;
      if (result !== null && result !== undefined && typeof result === 'object') {
        try {
          serializableResult = JSON.parse(JSON.stringify(result));
        } catch (e) {
          console.error('[AiIframe] 结果序列化失败:', e);
          serializableResult = { __error: '结果无法序列化', message: e.message };
        }
      }
      const message = {
        type: 'IFRAME_RESPONSE',
        requestId,
        result: serializableResult,
        error,
        timestamp: Date.now()
      };
      source.postMessage(message, '*');
    },

    /**
     * 使用 new Function 执行代码字符串
     * 从 agentMethodRegistry 注册表自动提取方法名和方法引用注入执行环境
     * agent 代码中可直接调用注册表中的任何方法名
     *
     * 支持的代码格式：
     * 1. 单条表达式：readCell({rowIndex:0,colIndex:0})
     * 2. 多语句代码块：writeCell({...}); readCell({...})
     * 3. 带 return 的代码：const r = readCell({...}); return r
     * 4. 用大括号包裹的代码块：{ writeCell({...}); return readCell({...}) }
     *
     * @param {string} codeString - 代码字符串
     * @param {string} requestId - 请求 ID，用于返回结果
     * @param {Window} source - 消息来源窗口
     */
    executeCodeString(codeString, requestId, source) {
      try {
        const trimmed = codeString.trim();

        const wrappedCode = this._wrapCodeString(trimmed);

        const fn = new Function(...this._methodNames, wrappedCode);

        console.log(`[AiIframe] 执行代码: ${codeString}`);
        const result = fn(...this._methodArgs);

        if (result && typeof result.then === 'function') {
          result.then(res => {
            if (requestId && source) {
              this.sendResponse(source, requestId, res);
            }
          }).catch(error => {
            console.error(`[AiIframe] 执行异步代码失败:`, error);
            if (requestId && source) {
              this.sendResponse(source, requestId, undefined, error.message || '执行失败');
            }
          });
        } else {
          if (requestId && source) {
            this.sendResponse(source, requestId, result);
          }
        }
      } catch (error) {
        console.error(`[AiIframe] 执行代码失败:`, error);
        if (requestId && source) {
          this.sendResponse(source, requestId, undefined, error.message);
        }
      }
    },

    /**
     * 将代码字符串包装为可执行的函数体
     * 处理策略：
     * - 已包含 return 语句：原样使用，确保多语句代码块可自行控制返回值
     * - 用大括号包裹的代码块：原样使用，内部自行 return
     * - 单条表达式：自动加 return 前缀
     * - 多语句（含分号/换行）：包装为代码块，最后一条表达式自动 return
     *
     * @param {string} code - 去除首尾空白后的代码字符串
     * @return {string} 包装后的函数体字符串
     */
    _wrapCodeString(code) {
      if (code.startsWith('{')) {
        return code;
      }

      if (/\breturn\b/.test(code)) {
        return code;
      }

      if (!code.includes(';') && !code.includes('\n')) {
        return `return ${code}`;
      }

      const statements = code.split(';').map(s => s.trim()).filter(s => s.length > 0);
      if (statements.length === 0) {
        return 'return undefined';
      }
      if (statements.length === 1) {
        return `return ${statements[0]}`;
      }

      const lastStmt = statements.pop();
      const body = statements.join('; ');
      return `${body}; return ${lastStmt}`;
    },
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
    },

    handTest(){
      console.log(JSON.stringify(this.$store.state.report))
    },

    handInput(){

    },

    // ============ 拖动相关方法 ============

    /**
     * 重置面板位置到默认位置
     * 默认位置为窗口右侧居中
     */
    resetPosition() {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      this.panelPosition = {
        x: windowWidth - this.panelWidth - 50,
        y: (windowHeight - this.panelHeight) / 2
      };
    },

    /**
     * 处理鼠标按下事件
     * 开始拖动并记录起始位置
     * @param {MouseEvent} e - 鼠标事件对象
     */
    handleMouseDown(e) {
      // 只响应 header 区域的拖动
      if (e.target.closest('.ai-dialog-close') || e.target.closest('.ai-dialog-btn')) {
        return;
      }
      this.isDragging = true;
      this.dragStart = {
        x: e.clientX - this.panelPosition.x,
        y: e.clientY - this.panelPosition.y
      };
      e.preventDefault();
    },

    /**
     * 处理鼠标移动事件
     * 更新面板位置，包含边界检测
     * @param {MouseEvent} e - 鼠标事件对象
     */
    handleMouseMove(e) {
      if (!this.isDragging) return;

      const newX = e.clientX - this.dragStart.x;
      const newY = e.clientY - this.dragStart.y;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      this.panelPosition = {
        x: Math.max(0, Math.min(newX, windowWidth - this.panelWidth)),
        y: Math.max(0, Math.min(newY, windowHeight - this.panelHeight))
      };
    },

    /**
     * 处理鼠标松开事件
     * 结束拖动
     */
    handleMouseUp() {
      this.isDragging = false;
    },

    /**
     * 处理窗口大小改变事件
     * 确保面板不会超出窗口边界
     */
    handleResize() {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      this.panelPosition = {
        x: Math.min(this.panelPosition.x, windowWidth - this.panelWidth),
        y: Math.min(this.panelPosition.y, windowHeight - this.panelHeight)
      };
    }
  }
}
</script>

<style scoped>
.ai-iframe-container {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  pointer-events: none;
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
  pointer-events: auto;
  user-select: none;
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

.ai-dialog-actions {
  display: flex;
  gap: 8px;
  margin-left: 12px;
}

.ai-dialog-btn {
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.ai-dialog-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
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
