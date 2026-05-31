<template>
  <div class="ai-iframe-container">
    <div class="ai-dialog-wrapper" v-if="visible">
      <div class="ai-dialog-header">
        <span class="ai-dialog-title">AI 助手</span>
        <div class="ai-dialog-actions">
          <button class="ai-dialog-btn" @click="handTest">测试</button>
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
import {
  readCellByAgent as readCellByAgentUtil,
  setCellByAgent as setCellByAgentUtil,
  getReportSchema as getReportSchemaUtil,
  mergeCellsByAgent as mergeCellsByAgentUtil,
  setCellStyleByAgent as setCellStyleByAgentUtil,
  insertRowsByAgent as insertRowsByAgentUtil,
  insertColsByAgent as insertColsByAgentUtil
} from "@/views/report/designer/ai-iframe/utils";

/**
 * AI 对话框 iframe 组件
 * 用于在设计器页面中嵌入 Vue3 AI 对话框
 * 支持显示/隐藏控制，方便后续移除和隐藏管理
 * 支持通过 postMessage 接收子 iframe 发送的指令并动态执行
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
      visible: this.defaultVisible
    };
  },
  computed: {
    iframeSrc() {
      return this.url;
    }
  },
  mounted() {
    // 监听来自子 iframe 的消息
    window.addEventListener('message', this.handleIframeMessage);
  },
  beforeDestroy() {
    // 组件销毁时移除消息监听，避免内存泄漏
    window.removeEventListener('message', this.handleIframeMessage);
  },
  methods: {
    /**
     * 处理来自子 iframe 的消息
     * 支持两种模式：
     * 1. action + data 模式：直接调用方法
     * 2. codeString 模式：使用 new Function 动态执行代码字符串
     * 支持返回结果给子 iframe
     * @param {MessageEvent} event - 消息事件对象
     */
    handleIframeMessage(event) {
      // 安全检查：验证消息格式
      if (!event.data || event.data.type !== 'IFRAME_COMMAND') {
        return;
      }

      const { action, data, codeString, requestId } = event.data;
      const source = event.source;

      // 代码字符串模式：使用 new Function 动态执行
      if (codeString) {
        this.executeCodeString(codeString, requestId, source);
        return;
      }

      // 兼容旧格式：直接调用方法
      if (typeof this[action] === 'function') {
        console.log(`[AiIframe] 执行指令: ${action}`, data);
        const result = this[action](data);
        // 如果有 requestId，返回结果
        if (requestId && source) {
          this.sendResponse(source, requestId, result);
        }
      } else {
        console.warn(`[AiIframe] 未找到方法: ${action}`);
        // 返回错误
        if (requestId && source) {
          this.sendResponse(source, requestId, undefined, `未找到方法: ${action}`);
        }
      }
    },

    /**
     * 发送响应结果给子 iframe
     * @param {Window} source - 消息来源窗口
     * @param {string} requestId - 请求 ID
     * @param {any} result - 执行结果
     * @param {string} error - 错误信息
     */
    sendResponse(source, requestId, result, error) {
      const message = {
        type: 'IFRAME_RESPONSE',
        requestId,
        result,
        error,
        timestamp: Date.now()
      };
      source.postMessage(message, '*');
    },

    /**
     * 使用 new Function 执行代码字符串
     * 将组件的所有方法注入执行环境，支持直接调用
     * 支持返回结果给子 iframe
     * @param {string} codeString - 代码字符串，如 "readCellA1()" 或 "setCellA1('value')"
     * @param {string} requestId - 请求 ID，用于返回结果
     * @param {Window} source - 消息来源窗口
     */
    executeCodeString(codeString, requestId, source) {
      try {
        // 创建执行环境，将所有方法注入
        const methodNames = Object.keys(this.$options.methods || {});
        const methodArgs = methodNames.map(name => this[name]);

        // 包装代码字符串，确保返回执行结果
        // 如果代码不是以 return 开头，自动添加 return
        const wrappedCode = codeString.trim().startsWith('return ')
          ? codeString
          : `return ${codeString}`;

        // 构建 new Function 参数：方法名列表 + 包装后的代码字符串
        const fn = new Function(...methodNames, wrappedCode);

        console.log(`[AiIframe] 执行代码: ${codeString}`);
        const result = fn(...methodArgs);

        // 如果有 requestId，返回结果
        if (requestId && source) {
          this.sendResponse(source, requestId, result);
        }
      } catch (error) {
        console.error(`[AiIframe] 执行代码失败:`, error);
        // 返回错误
        if (requestId && source) {
          this.sendResponse(source, requestId, undefined, error.message);
        }
      }
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
    },

    handTest(){

    },

    handInput(){

    },
    /**
     * 读取指定坐标的单元格数据
     * 接收参数对象，由 new Function 动态调用，与 utils.js 签名一致
     *
     * @param {Object} params - 参数对象
     * @param {number} params.rowIndex - 单元格行坐标，从0开始
     * @param {number} params.colIndex - 单元格列坐标，从0开始
     * @return {Object|null} 单元格定义对象
     */
    readCellByAgent({ rowIndex, colIndex }) {
      return readCellByAgentUtil({ rowIndex, colIndex });
    },
    /**
     * 设置指定坐标的单元格数据
     * 接收参数对象，由 new Function 动态调用，与 utils.js 签名一致
     *
     * @param {Object} params - 参数对象
     * @param {number} params.rowIndex - 单元格行坐标，从0开始
     * @param {number} params.colIndex - 单元格列坐标，从0开始
     * @param {string} params.cellValue - 要设置的单元格值
     */
    setCellByAgent({ rowIndex, colIndex, cellValue }) {
      return setCellByAgentUtil({ rowIndex, colIndex, cellValue });
    },
    /**
     * 获取报表整体结构信息
     * 返回行列数、合并单元格区域、非空单元格摘要
     *
     * @return {Object} 报表结构信息
     */
    getReportSchema() {
      return getReportSchemaUtil();
    },
    /**
     * 合并指定区域的单元格
     *
     * @param {Object} params - 参数对象
     * @param {number} params.startRow - 起始行索引
     * @param {number} params.startCol - 起始列索引
     * @param {number} params.endRow - 结束行索引
     * @param {number} params.endCol - 结束列索引
     * @return {Object} 操作结果
     */
    mergeCellsByAgent({ startRow, startCol, endRow, endCol }) {
      return mergeCellsByAgentUtil({ startRow, startCol, endRow, endCol });
    },
    /**
     * 设置单元格样式
     *
     * @param {Object} params - 参数对象
     * @param {number} params.rowIndex - 行索引
     * @param {number} params.colIndex - 列索引
     * @param {string} params.styleType - 样式类型
     * @param {string} params.styleValue - 样式值
     * @return {Object} 操作结果
     */
    setCellStyleByAgent({ rowIndex, colIndex, styleType, styleValue }) {
      return setCellStyleByAgentUtil({ rowIndex, colIndex, styleType, styleValue });
    },
    /**
     * 插入行
     *
     * @param {Object} params - 参数对象
     * @param {number} params.rowIndex - 插入位置行索引
     * @param {number} params.count - 插入行数
     * @return {Object} 操作结果
     */
    insertRowsByAgent({ rowIndex, count }) {
      return insertRowsByAgentUtil({ rowIndex, count });
    },
    /**
     * 插入列
     *
     * @param {Object} params - 参数对象
     * @param {number} params.colIndex - 插入位置列索引
     * @param {number} params.count - 插入列数
     * @return {Object} 操作结果
     */
    insertColsByAgent({ colIndex, count }) {
      return insertColsByAgentUtil({ colIndex, count });
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
