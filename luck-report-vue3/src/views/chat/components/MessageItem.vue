<template>
  <div class="message-item">
    <!-- Break 消息：上下文清除标记 -->
    <template v-if="message.type === 'break'">
      <div class="break-message">
        <div class="break-line"></div>
        <span class="break-text">上下文已清除</span>
        <div class="break-line"></div>
      </div>
    </template>

    <!-- 用户消息 -->
    <template v-else-if="message.role === 'user'">
      <div class="message-wrapper user-wrapper">
        <div class="user-content">
          <!-- 用户上传的图片 -->
          <div v-if="message.attachments && message.attachments.length > 0" class="user-images">
            <a-image
              v-for="(img, imgIndex) in getUserImages(message.attachments)"
              :key="imgIndex"
              :src="img"
              :width="120"
              :height="120"
              class="user-image"
              :preview="{ mask: false }"
            />
          </div>
          <div class="message-bubble user-bubble">
            <MarkdownRender :content="message.content" />
          </div>
          <div class="action-bar user-action-bar">
            <a-tooltip title="复制">
              <a-button type="text" size="small" @click="handleCopy(message.content)">
                <template #icon><CopyOutlined /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip title="重试">
              <a-button type="text" size="small" @click="emit('retry', index)">
                <template #icon><SyncOutlined /></template>
              </a-button>
            </a-tooltip>
            <a-popconfirm
              title="确认删除"
              description="确定要删除这条消息吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="emit('delete', index)"
            >
              <a-button type="text" size="small">
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </a-popconfirm>
          </div>
        </div>
      </div>
    </template>

    <!-- 错误消息 -->
    <template v-else-if="message.type === 'error'">
      <div class="message-wrapper assistant-wrapper">
        <div class="avatar-column">
          <a-avatar
            v-if="currentProvider?.providerLogo"
            :src="currentProvider.providerLogo"
            class="assistant-avatar-img"
          />
          <div v-else class="assistant-avatar">
            {{ currentProvider?.providerName?.charAt(0) || 'AI' }}
          </div>
        </div>
        <div class="assistant-content">
          <!-- 根据错误类型显示不同的提示 -->
          <a-alert
            v-if="message.errorType === 'TimeoutError'"
            message="请求超时"
            description="API 响应超时，请稍后重试或检查网络连接"
            type="error"
            show-icon
          />
          <a-alert
            v-else-if="message.errorType === 'OverQuotaError'"
            message="超出使用限额"
            description="您的 API 使用额度已用尽，请联系管理员或充值后继续使用"
            type="warning"
            show-icon
          />
          <a-alert
            v-else-if="message.errorType === 'InvalidAPIKeyError'"
            message="API Key 无效"
            description="当前配置的 API Key 无效或已过期，请检查配置"
            type="error"
            show-icon
          />
          <a-alert
            v-else
            :message="message.errorMessage || '发生错误'"
            type="error"
            show-icon
          />
          <div class="action-bar">
            <a-tooltip title="重试">
              <a-button type="text" size="small" @click="emit('retry', index - 1)">
                <template #icon><SyncOutlined /></template>
              </a-button>
            </a-tooltip>
            <a-popconfirm
              title="确认删除"
              description="确定要删除这条消息吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="emit('delete', index)"
            >
              <a-button type="text" size="small">
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </a-popconfirm>
          </div>
        </div>
      </div>
    </template>

    <!-- Agent 工具调用消息 -->
    <template v-else-if="message.type === 'tool_call' && message.agentToolCall">
      <div class="message-wrapper assistant-wrapper">
        <div class="avatar-column">
          <a-avatar
            v-if="currentProvider?.providerLogo"
            :src="currentProvider.providerLogo"
            class="assistant-avatar-img"
          />
          <div v-else class="assistant-avatar">
            {{ currentProvider?.providerName?.charAt(0) || 'AI' }}
          </div>
        </div>
        <div class="assistant-content">
          <div class="agent-tool-call" :class="`tool-status-${message.agentToolCall.status}`">
            <div class="tool-call-header">
              <span class="tool-call-icon">
                <LoadingOutlined v-if="message.agentToolCall.status === 'running'" spin />
                <QuestionCircleOutlined v-else-if="message.agentToolCall.status === 'confirming'" />
                <CheckCircleOutlined v-else-if="message.agentToolCall.status === 'done'" />
                <CloseCircleOutlined v-else-if="message.agentToolCall.status === 'error'" />
                <StopOutlined v-else-if="message.agentToolCall.status === 'rejected'" />
              </span>
              <span class="tool-call-name">{{ message.agentToolCall.toolName }}</span>
              <span class="tool-call-status">
                <template v-if="message.agentToolCall.status === 'running'">执行中...</template>
                <template v-else-if="message.agentToolCall.status === 'confirming'">等待确认</template>
                <template v-else-if="message.agentToolCall.status === 'done'">执行成功</template>
                <template v-else-if="message.agentToolCall.status === 'error'">执行失败</template>
                <template v-else-if="message.agentToolCall.status === 'rejected'">已拒绝</template>
              </span>
            </div>
            <details class="tool-call-details">
              <summary class="tool-call-summary">查看详情</summary>
              <div class="tool-call-body">
                <div class="tool-call-section">
                  <span class="tool-call-label">输入参数：</span>
                  <pre class="tool-call-code">{{ JSON.stringify(message.agentToolCall.input, null, 2) }}</pre>
                </div>
                <div v-if="message.agentToolCall.result" class="tool-call-section">
                  <span class="tool-call-label">执行结果：</span>
                  <pre class="tool-call-code">{{ message.agentToolCall.result }}</pre>
                </div>
                <div v-if="message.agentToolCall.error" class="tool-call-section">
                  <span class="tool-call-label">错误信息：</span>
                  <pre class="tool-call-code error">{{ message.agentToolCall.error }}</pre>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </template>

    <!-- 助手消息 -->
    <template v-else>
      <div class="message-wrapper assistant-wrapper">
        <div class="avatar-column">
          <a-avatar
            v-if="currentProvider?.providerLogo"
            :src="currentProvider.providerLogo"
            class="assistant-avatar-img"
          />
          <div v-else class="assistant-avatar">
            {{ currentProvider?.providerName?.charAt(0) || 'AI' }}
          </div>
          <div v-if="isConsecutive" class="connection-line"></div>
        </div>
        <div class="assistant-content">
          <!-- 联网搜索状态 -->
          <div v-if="message.searchStatus && message.searchStatus !== 'none'" class="search-status">
            <template v-if="message.searchStatus === 'searching'">
              <LoadingOutlined class="search-icon searching" />
              <span class="search-text searching">正在联网搜索...</span>
            </template>
            <template v-else-if="message.searchStatus === 'error'">
              <CloseCircleOutlined class="search-icon error" />
              <span class="search-text error">搜索出错，请联系管理员检查搜索引擎配置</span>
            </template>
            <template v-else-if="message.searchStatus === 'done'">
              <CheckCircleOutlined class="search-icon done" />
              <span class="search-text done">搜索完成</span>
            </template>
          </div>

          <!-- 任务进度展示 -->
          <TaskProgressDisplay 
            v-if="message.taskProgress"
            :tasks="message.taskProgress.tasks"
            :current-workflow-node="message.taskProgress.currentWorkflowNode"
          />

          <div class="message-bubble assistant-bubble">
            <!-- 深度思考折叠区 -->
            <details v-if="message.reasoningContent" :open="true" class="reasoning-details">
              <summary class="reasoning-summary">
                <BulbOutlined class="reasoning-icon" />
                <span class="reasoning-label">已深度思考</span>
                <DownOutlined class="reasoning-arrow" />
              </summary>
              <div class="reasoning-content">
                <MarkdownRender :content="message.reasoningContent" />
              </div>
            </details>
            <MarkdownRender :content="message.content" />
          </div>

          <!-- MCP 工具调用展示 -->
          <div v-if="message.mcpTools && message.mcpTools.length > 0" class="mcp-tools">
            <details
              v-for="(mcp, mcpIndex) in message.mcpTools"
              :key="mcpIndex"
              class="mcp-tool-details"
            >
              <summary class="mcp-tool-summary">
                <span class="mcp-tool-title">
                  调用 {{ mcp.tool.serverName }} 的工具：{{ mcp.tool.name }}
                </span>
                <CheckCircleOutlined v-if="!mcp.response?.isError" class="mcp-status success" />
                <CloseCircleOutlined v-else class="mcp-status error" />
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

          <div class="action-bar">
            <a-tooltip title="复制">
              <a-button type="text" size="small" @click="handleCopy(message.content)">
                <template #icon><CopyOutlined /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip title="重试">
              <a-button type="text" size="small" @click="emit('retry', index - 1)">
                <template #icon><SyncOutlined /></template>
              </a-button>
            </a-tooltip>
            <a-popconfirm
              title="确认删除"
              description="确定要删除这条消息吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="emit('delete', index)"
            >
              <a-button type="text" size="small">
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </a-popconfirm>
            <template v-if="message.totalTokens">
              <span class="token-info">Tokens:{{ message.totalTokens.toLocaleString() }}</span>
              <span class="token-info">↑{{ message.inputTokens?.toLocaleString() }}</span>
              <span class="token-info">↓{{ message.outputTokens?.toLocaleString() }}</span>
            </template>
            <a-tooltip v-else title="未知用量">
              <span class="token-info">Tokens: -</span>
            </a-tooltip>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { message as antMessage, Button as AButton, Tooltip as ATooltip, Popconfirm as APopconfirm, Alert as AAlert, Image as AImage, Avatar as AAvatar } from 'ant-design-vue'
import {
  CopyOutlined,
  SyncOutlined,
  DeleteOutlined,
  DownOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  StopOutlined
} from '@ant-design/icons-vue'
import type { Message, Attachment, ModelProvider } from '../types/chat'
import MarkdownRender from './MarkdownRender.vue'
import TaskProgressDisplay from './TaskProgressDisplay.vue'

/**
 * MessageItem 组件
 * 单条历史消息展示，对照 HiveChat MessageItem 补齐所有功能
 * - 用户消息：右对齐灰色气泡 + 图片展示 + Markdown 渲染 + 复制/重试/删除操作
 * - 助手消息：AI头像 + 联网搜索状态 + 深度思考折叠区 + MCP工具调用 + 复制/重试/删除/Token用量
 * - 错误消息：AI头像 + 根据错误类型显示不同提示 + 删除操作
 * - Break 消息：上下文清除分隔线
 * 操作按钮 hover 时可见，参考 HiveChat 的 group-hover:visible 交互
 */

interface Props {
  message: Message
  index: number
  /** 是否连续消息（当前消息与上一条消息角色相同） */
  isConsecutive?: boolean
  /** Provider 映射表，用于显示 Provider 头像 */
  allProviderListByKey?: Record<string, ModelProvider>
}

interface Emits {
  (e: 'retry', index: number): void
  (e: 'delete', index: number): void
}

const props = withDefaults(defineProps<Props>(), {
  isConsecutive: false,
  allProviderListByKey: () => ({})
})

const emit = defineEmits<Emits>()

/**
 * 获取当前消息的 Provider 信息
 * 根据 providerId 从 allProviderListByKey 获取
 */
const currentProvider = computed<ModelProvider | undefined>(() => {
  if (!props.message.providerId || !props.allProviderListByKey) return undefined
  return props.allProviderListByKey[props.message.providerId]
})

/**
 * 复制文本到剪贴板
 * @param text - 需要复制的文本内容
 */
const handleCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    antMessage.success('复制成功')
  } catch {
    antMessage.error('复制失败')
  }
}

/**
 * 从附件中提取图片 URL 列表
 * @param attachments - 附件列表
 * @returns 图片 URL 数组
 */
const getUserImages = (attachments: Attachment[]): string[] => {
  return attachments
    .filter(att => att.mimeType.startsWith('image/'))
    .map(att => `data:${att.mimeType};base64,${att.data}`)
}
</script>

<style scoped>
.message-item {
  padding: 6px 12px;
}

.message-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.user-wrapper {
  justify-content: flex-end;
}

.assistant-wrapper {
  justify-content: flex-start;
}

.avatar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
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
  margin-top: 4px;
}

.assistant-avatar-img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid #eee;
  padding: 2px;
  margin-top: 4px;
}

.connection-line {
  flex: 1;
  border-left: 1px dashed #d1d5db;
  margin: 4px 0;
  min-height: 8px;
}

.user-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.assistant-content {
  display: flex;
  flex-direction: column;
  max-width: 85%;
  min-width: 0;
}

.user-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.user-image {
  border-radius: 8px;
  object-fit: cover;
}

.message-bubble {
  word-wrap: break-word;
}

.user-bubble {
  background-color: #f3f4f6;
  color: #374151;
  padding: 10px 14px;
  border-radius: 14px;
  max-width: 85%;
}

.assistant-bubble {
  background-color: #f3f4f6;
  padding: 10px 14px;
  border-radius: 14px;
  color: #374151;
  margin-top: 2px;
}

.action-bar {
  display: flex;
  align-items: center;
  padding: 2px 4px;
  gap: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-item:hover .action-bar {
  opacity: 1;
}

.user-action-bar {
  justify-content: flex-end;
}

.action-bar :deep(.ant-btn) {
  color: #9ca3af;
}

.action-bar :deep(.ant-btn:hover) {
  color: #6b7280;
}

.token-info {
  font-size: 12px;
  color: #9ca3af;
  margin-left: 6px;
}

/* Break 消息样式 */
.break-message {
  display: flex;
  align-items: center;
  margin: 24px 0;
}

.break-line {
  flex: 1;
  height: 1px;
  background-color: #e5e7eb;
}

.break-text {
  padding: 0 12px;
  font-size: 12px;
  color: #9ca3af;
  background-color: #fff;
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

/* 深度思考样式 */
.reasoning-details {
  margin-bottom: 12px;
}

.reasoning-summary {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 6px;
  background-color: #e5e7eb;
  cursor: pointer;
  font-size: 12px;
  color: #374151;
  list-style: none;
}

.reasoning-summary:hover {
  background-color: #d1d5db;
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

.reasoning-arrow {
  margin-left: auto;
  font-size: 10px;
  color: #9ca3af;
  transition: transform 0.2s;
}

.reasoning-details[open] .reasoning-arrow {
  transform: rotate(180deg);
}

.reasoning-content {
  border-left: 2px solid #e5e7eb;
  padding: 8px 12px;
  margin-top: 8px;
  color: #9ca3af;
  line-height: 1.6;
  font-size: 13px;
}

/* MCP 工具调用样式 */
.mcp-tools {
  margin-top: 8px;
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

/* Agent 工具调用样式 */
.agent-tool-call {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.agent-tool-call.tool-status-running {
  border-color: #3b82f6;
}

.agent-tool-call.tool-status-confirming {
  border-color: #f59e0b;
}

.agent-tool-call.tool-status-done {
  border-color: #22c55e;
}

.agent-tool-call.tool-status-error {
  border-color: #ef4444;
}

.agent-tool-call.tool-status-rejected {
  border-color: #9ca3af;
}

.tool-call-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: #f9fafb;
}

.tool-call-icon {
  font-size: 14px;
}

.tool-call-icon :deep(.anticon) {
  font-size: 14px;
}

.tool-status-running .tool-call-icon {
  color: #3b82f6;
}

.tool-status-confirming .tool-call-icon {
  color: #f59e0b;
}

.tool-status-done .tool-call-icon {
  color: #22c55e;
}

.tool-status-error .tool-call-icon {
  color: #ef4444;
}

.tool-status-rejected .tool-call-icon {
  color: #9ca3af;
}

.tool-call-name {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.tool-call-status {
  font-size: 12px;
  color: #6b7280;
  margin-left: auto;
}

.tool-call-details {
  border-top: 1px solid #e5e7eb;
}

.tool-call-summary {
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
  color: #6b7280;
  list-style: none;
}

.tool-call-summary:hover {
  background-color: #f3f4f6;
}

.tool-call-body {
  padding: 8px 12px;
}

.tool-call-section {
  margin-bottom: 8px;
}

.tool-call-section:last-child {
  margin-bottom: 0;
}

.tool-call-label {
  font-size: 12px;
  color: #6b7280;
  display: block;
  margin-bottom: 4px;
}

.tool-call-code {
  margin: 0;
  padding: 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  font-size: 11px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.tool-call-code.error {
  color: #ef4444;
  background-color: #fef2f2;
}
</style>
