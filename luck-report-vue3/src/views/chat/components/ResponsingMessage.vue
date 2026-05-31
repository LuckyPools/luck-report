<template>
  <div v-if="responseStatus === 'pending'" class="responsing-message">
    <div class="message-wrapper">
      <a-avatar
        v-if="currentProvider?.providerLogo"
        :src="currentProvider.providerLogo"
        class="assistant-avatar-img"
      />
      <div v-else class="assistant-avatar">
        {{ currentProvider?.providerName?.charAt(0) || 'AI' }}
      </div>
      <div class="message-content">
        <!-- 联网搜索状态 -->
        <div v-if="searchStatus === 'searching'" class="search-status">
          <LoadingOutlined class="search-icon searching" />
          <span class="search-text searching">正在联网搜索...</span>
        </div>
        <div v-else-if="searchStatus === 'error'" class="search-status">
          <CloseCircleOutlined class="search-icon error" />
          <span class="search-text error">搜索出错，请联系管理员检查搜索引擎配置</span>
        </div>
        <div v-else-if="searchStatus === 'done'" class="search-status">
          <CheckCircleOutlined class="search-icon done" />
          <span class="search-text done">搜索完成</span>
        </div>

        <!-- MCP 工具调用详情 -->
        <div v-if="mcpTools && mcpTools.length > 0" class="mcp-tools">
          <details
            v-for="(mcp, mcpIndex) in mcpTools"
            :key="mcpIndex"
            class="mcp-tool-details"
            :open="mcp.status === 'invoking'"
          >
            <summary class="mcp-tool-summary">
              <span class="mcp-tool-title">
                <template v-if="mcp.status === 'invoking'">
                  <RedoOutlined spin class="mcp-loading" />
                  正在调用 {{ mcp.tool.serverName }} 的工具：{{ mcp.tool.name }}
                </template>
                <template v-else>
                  调用 {{ mcp.tool.serverName }} 的工具：{{ mcp.tool.name }}
                </template>
              </span>
              <CheckCircleOutlined v-if="mcp.status === 'done' && !mcp.response?.isError" class="mcp-status success" />
              <CloseCircleOutlined v-else-if="mcp.status === 'done' && mcp.response?.isError" class="mcp-status error" />
            </summary>
            <div class="mcp-tool-content">
              <div class="mcp-section">
                <span class="mcp-label">输入参数：</span>
                <pre class="mcp-code">{{ JSON.stringify(mcp.tool.inputSchema, null, 2) }}</pre>
              </div>
              <div v-if="mcp.response" class="mcp-section">
                <span class="mcp-label">输出结果：</span>
                <pre class="mcp-code">{{ JSON.stringify(mcp.response, null, 2) }}</pre>
              </div>
            </div>
          </details>
        </div>

        <div class="message-bubble">
          <!-- 深度思考区域 -->
          <template v-if="responseReasoning">
            <div class="reasoning-section">
              <div class="reasoning-header">
                <BulbOutlined class="reasoning-icon" />
                <span class="reasoning-label">{{ responseMessage ? '已深度思考' : '正在思考...' }}</span>
              </div>
              <div class="reasoning-body">
                <MarkdownRender :content="responseReasoning" />
              </div>
            </div>
          </template>
          <!-- 等待首字时显示 DotsLoading -->
          <template v-if="!responseMessage && !responseReasoning && searchStatus !== 'searching' && (!mcpTools || mcpTools.length === 0)">
            <DotsLoading />
          </template>
          <!-- 响应消息 -->
          <template v-if="responseMessage">
            <MarkdownRender :content="responseMessage" />
          </template>
        </div>
        <!-- 响应中显示 BallsLoading -->
        <div v-if="responseMessage || responseReasoning" class="balls-wrapper">
          <BallsLoading />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ResponseStatus, SearchStatus, McpToolCall, ModelProvider } from '../types/chat'
import MarkdownRender from './MarkdownRender.vue'
import DotsLoading from './loading/DotsLoading.vue'
import BallsLoading from './loading/BallsLoading.vue'
import {
  BulbOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RedoOutlined
} from '@ant-design/icons-vue'
import { Avatar as AAvatar } from 'ant-design-vue'

/**
 * ResponsingMessage 组件
 * 实时响应消息展示，对照 HiveChat ResponsingMessage 补齐所有功能
 * - 等待首字时：DotsLoading 在灰色气泡内
 * - 联网搜索状态：searching / error / done
 * - MCP 工具调用：显示调用中/已完成状态
 * - 推理中：显示"正在思考..." + 推理内容
 * - 推理完成输出中：显示"已深度思考"折叠 + Markdown 渲染内容 + BallsLoading
 */

interface Props {
  responseStatus: ResponseStatus
  responseMessage: string
  responseReasoning?: string
  /** 联网搜索状态 */
  searchStatus?: SearchStatus
  /** MCP 工具调用记录 */
  mcpTools?: McpToolCall[]
  /** Provider ID，用于显示 Provider 头像 */
  providerId?: string
  /** Provider 映射表 */
  allProviderListByKey?: Record<string, ModelProvider>
}

const props = withDefaults(defineProps<Props>(), {
  searchStatus: 'none',
  mcpTools: () => [],
  allProviderListByKey: () => ({})
})

/**
 * 获取当前 Provider 信息
 */
const currentProvider = computed<ModelProvider | undefined>(() => {
  if (!props.providerId || !props.allProviderListByKey) return undefined
  return props.allProviderListByKey[props.providerId]
})
</script>

<style scoped>
.responsing-message {
  padding: 6px 12px;
}

.message-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.assistant-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #3b82f6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 4px;
}

.assistant-avatar-img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid #eee;
  padding: 2px;
  margin-top: 4px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-bubble {
  background-color: #f3f4f6;
  padding: 10px 14px;
  border-radius: 14px;
  color: #374151;
  max-width: 85%;
  word-wrap: break-word;
  margin-top: 2px;
}

.balls-wrapper {
  padding: 4px 14px;
}

/* 联网搜索状态样式 */
.search-status {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  margin-bottom: 8px;
  border-radius: 6px;
  background-color: #f9fafb;
}

.search-icon {
  margin-right: 6px;
}

.search-icon.searching {
  color: #3b82f6;
  animation: spin 1s linear infinite;
}

.search-icon.error {
  color: #ef4444;
}

.search-icon.done {
  color: #22c55e;
}

.search-text {
  font-size: 12px;
}

.search-text.searching {
  color: #3b82f6;
}

.search-text.error {
  color: #ef4444;
}

.search-text.done {
  color: #22c55e;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* MCP 工具调用样式 */
.mcp-tools {
  margin-bottom: 8px;
}

.mcp-tool-details {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 8px;
}

.mcp-tool-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  background-color: #f9fafb;
  border-radius: 6px;
  list-style: none;
}

.mcp-tool-summary:hover {
  background-color: #f3f4f6;
}

.mcp-tool-title {
  font-size: 12px;
  color: #374151;
  display: flex;
  align-items: center;
}

.mcp-loading {
  margin-right: 6px;
  color: #3b82f6;
  animation: spin 1s linear infinite;
}

.mcp-status {
  font-size: 14px;
}

.mcp-status.success {
  color: #22c55e;
}

.mcp-status.error {
  color: #ef4444;
}

.mcp-tool-content {
  padding: 12px;
  border-top: 1px solid #e5e7eb;
}

.mcp-section {
  margin-bottom: 8px;
}

.mcp-section:last-child {
  margin-bottom: 0;
}

.mcp-label {
  font-size: 12px;
  color: #6b7280;
  display: block;
  margin-bottom: 4px;
}

.mcp-code {
  margin: 0;
  padding: 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  font-size: 11px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 深度思考样式 */
.reasoning-section {
  margin-bottom: 12px;
}

.reasoning-header {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 6px;
  background-color: #e5e7eb;
  font-size: 12px;
  color: #374151;
}

.reasoning-icon {
  font-size: 14px;
  color: #f59e0b;
  margin-right: 4px;
}

.reasoning-label {
  font-size: 12px;
  color: #374151;
}

.reasoning-body {
  border-left: 2px solid #e5e7eb;
  padding: 8px 12px;
  margin-top: 8px;
  color: #9ca3af;
  line-height: 1.6;
  font-size: 13px;
}
</style>
