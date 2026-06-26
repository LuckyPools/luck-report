<template>
  <div class="ai-iframe-container">
    <div
      v-if="!chatVisible"
      class="float-button"
      :class="{ 'is-dragging': isDragging }"
      :style="{ transform: `translate(${panelPosition.x + 870}px, ${panelPosition.y}px)` }"
      @mousedown="onFloatButtonMouseDown"
      @click="onFloatButtonClick"
    >
      <CustomerServiceOutlined />
    </div>

    <div
      v-if="chatVisible"
      class="ai-dialog-wrapper"
      :style="{ transform: `translate(${panelPosition.x}px, ${panelPosition.y}px)` }"
    >
      <div
        class="ai-dialog-header"
        @mousedown="onHeaderMouseDown"
        :style="{ cursor: isDragging ? 'grabbing' : 'grab' }"
      >
        <div class="ai-dialog-title-wrapper">
          <img class="ai-dialog-logo" :src="logoUrl" alt="智能助手" />
          <span class="ai-dialog-title">智能助手</span>
        </div>
        <div class="ai-dialog-actions"></div>
        <button class="ai-dialog-close" @click="toggleChat">×</button>
      </div>

      <div class="chat-panel">
        <!-- 左侧历史对话栏（参考 HiveChat ChatList 样式） -->
        <aside class="chat-sidebar">
          <ChatList
            ref="chatListRef"
            :current-session-id="currentSessionId"
            @select="handleSessionSelect"
            @deleted="handleSessionDeleted"
            @new-chat="handleNewChat"
          />
        </aside>

        <!-- 右侧主聊天区 -->
        <div class="chat-main">
          <ChatHeader @mousedown="onHeaderMouseDown" />

          <div ref="chatBodyRef" class="chat-body" @scroll="throttledHandleScroll">
            <div v-if="messageList.length === 0 && responseStatus === 'done'" class="empty-state">
              <template v-if="showGuideAlert">
                <a-alert
                  message="请先配置 API Key 或添加模型"
                  type="warning"
                  show-icon
                  class="guide-alert"
                />
              </template>
              <template v-else>
                <span class="greeting-emoji">👋</span>
                <h2 class="greeting-text">{{ greetingText }}，欢迎使用 AI 助手</h2>
                <p class="greeting-notice">输入您的问题，开始对话吧</p>
              </template>
            </div>
            <template v-else>
              <MessageItem
                v-for="(msg, idx) in messageList"
                :key="msg.id"
                :message="msg"
                :index="idx"
                :is-consecutive="isConsecutiveMessage(idx)"
                :all-provider-list-by-key="allProviderListByKey"
                @retry="handleRetry"
                @delete="handleDelete"
              />
              <ResponsingMessage
                :response-status="responseStatus"
                :response-message="responseMessage"
                :response-reasoning="responseReasoning"
                :search-status="searchStatus"
                :mcp-tools="mcpTools"
                :provider-id="currentProviderId"
                :all-provider-list-by-key="allProviderListByKey"
                :pending-confirm-tool-call="pendingConfirmToolCall"
                :task-list-manager="taskListManager"
                @confirm-tool="confirmAgentTool"
                @reject-tool="rejectAgentTool"
              />
            </template>
            <ScrollToBottomButton
              :visible="showScrollButton"
              @click="scrollToBottom"
            />
          </div>

          <!-- ask_user 中断提示：Agent 主动询问补充信息，提示用户在下方输入框回复 -->
          <transition name="user-prompt-slide">
            <div v-if="awaitingUserPrompt" class="user-prompt-hint">
              <div class="user-prompt-hint-icon">💬</div>
              <div class="user-prompt-hint-body">
                <div class="user-prompt-hint-label">Agent 在询问：</div>
                <div class="user-prompt-hint-question">{{ awaitingUserPrompt.question }}</div>
              </div>
              <a-button
                v-if="awaitingUserPrompt.options && awaitingUserPrompt.options.length"
                type="link"
                size="small"
                class="user-prompt-hint-toggle"
                @click="showOptions = !showOptions"
              >{{ showOptions ? '收起选项' : '查看选项' }}</a-button>
              <a-button
                type="text"
                size="small"
                class="user-prompt-hint-dismiss"
                title="忽略此问题"
                @click="handleDismissUserPrompt"
              >×</a-button>
            </div>
          </transition>
          <div v-if="awaitingUserPrompt && awaitingUserPrompt.options && awaitingUserPrompt.options.length && showOptions" class="user-prompt-options-bar">
            <a-tag
              v-for="opt in awaitingUserPrompt.options"
              :key="opt"
              class="user-prompt-option-pill"
              @click="fillOption(opt)"
            >{{ opt }}</a-tag>
          </div>

          <InputArea
            :response-status="responseStatus"
            :message-count="messageList.length"
            :search-enable="searchEnable"
            :has-use-mcp="hasUseMcp"
            :has-mcp-selected="hasMcpSelected"
            :mcp-servers="mcpServers"
            :current-model-support-vision="currentModelSupportVision"
            :current-model-support-tool="currentModelSupportTool"
            :history-type="historyType"
            :history-count="historyCount"
            :model-list="modelList"
            :current-model="currentModelInfo"
            :is-pending="isPending"
            @send="handleSend"
            @stop="stopChat"
            @clear="handleClear"
            @clear-memory="handleClearMemory"
            @change-mcp-select="handleChangeMcpSelect"
            @change-history-settings="handleChangeHistorySettings"
            @toggle-search="handleToggleSearch"
            @toggle-deep-think="handleToggleDeepThink"
            @model-change="handleModelChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Alert as AAlert, Button as AButton, Modal, Tag as ATag } from 'ant-design-vue'
import { CustomerServiceOutlined, PlusOutlined } from '@ant-design/icons-vue'
import '@/assets/css/common/index.css'
import { useDrag } from './drag.ts'
import { useChat } from './composables/useChat.ts'
import { useModelList } from './composables/useModelList.ts'
import { useGlobalConfig } from './composables/useGlobalConfig.ts'
import { useMcpServer } from './composables/useMcpServer.ts'
import ChatHeader from './components/ChatHeader.vue'
import MessageItem from './components/MessageItem.vue'
import ResponsingMessage from './components/ResponsingMessage.vue'
import InputArea from './components/InputArea.vue'
import ScrollToBottomButton from './components/ScrollToBottomButton.vue'
import ChatList from './components/ChatList.vue'
import type { Attachment } from './types/chat'
import logoUrl from '@/assets/images/ai/agent-header.png'

const chatVisible = ref(false)
const chatBodyRef = ref<HTMLElement | null>(null)
const chatListRef = ref<InstanceType<typeof ChatList> | null>(null)
/** 弹窗尺寸：含左侧历史对话栏 240px + 右侧主区 680px = 920 总宽，高度 560 */
const { isDragging, dragMoved, panelPosition, resetPosition, handleMouseDown } = useDrag(920, 560, 50, 50)

const {
  messageList,
  responseStatus,
  responseMessage,
  responseReasoning,
  isUserScrolling,
  searchStatus,
  mcpTools,
  historyType,
  historyCount,
  pendingConfirmToolCall,
  awaitingUserPrompt,
  currentSessionId,
  sendMessage,
  stopChat,
  clearHistory,
  addBreak,
  retryMessage,
  deleteMessage,
  setIsUserScrolling,
  setWebSearchEnabled,
  setHistoryType,
  setHistoryCount,
  confirmAgentTool,
  rejectAgentTool,
  dismissUserPrompt,
  loadSession,
  taskListManager
} = useChat()

const {
  modelList,
  currentModelSupportVision,
  currentModelSupportTool,
  allProviderListByKey,
  currentModel: currentModelInfo,
  isPending,
  loadActiveModels,
  setCurrentModelExact
} = useModelList()

const {
  searchEnable
} = useGlobalConfig()

const {
  hasUseMcp,
  hasMcpSelected,
  mcpServers,
  changeMcpServerSelect
} = useMcpServer()

/** 问候语文本，根据时间段动态生成 */
const greetingText = ref('')

/** 是否显示滚动到底部按钮，综合判断滚动位置和响应状态 */
const showScrollButton = ref(false)

/** ask_user 中断提示条：是否展开查看 options */
const showOptions = ref(false)

/** 是否启用深度思考（影响后续发送消息时是否传入 deepThink 参数） */
const deepThinkEnabled = ref(false)

/** 监听 awaitingUserPrompt 变化：进入提问时默认收起 options，离开时清空 */
watch(awaitingUserPrompt, (val) => {
  showOptions.value = false
})

/** 忽略 ask_user 中断：清空 awaitingUserPrompt，状态切回 done */
const handleDismissUserPrompt = () => {
  showOptions.value = false
  dismissUserPrompt()
}

/** 选中备选项：把选项填入输入框（通过 DOM 找到 textarea 并设值 + 触发 input 事件） */
const fillOption = (opt: string) => {
  const textarea = document.querySelector<HTMLTextAreaElement>('.input-textarea')
  if (!textarea) return
  // 用原生 setter 绕过 Vue 的响应式追踪，确保 input 事件能正确触发 v-model 更新
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  if (nativeSetter) {
    nativeSetter.call(textarea, opt)
  } else {
    textarea.value = opt
  }
  textarea.focus()
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
}

/** 是否显示引导提示（当模型未配置时） */
const showGuideAlert = computed(() => {
  return !isPending.value && Object.keys(allProviderListByKey.value).length === 0
})

/** 当前 Provider ID */
const currentProviderId = computed(() => currentModelInfo.value?.provider?.id)

/**
 * 处理模型选择变化
 * @param modelId 选中的模型ID
 */
const handleModelChange = (modelId: string) => {
  const selectedModel = modelList.value.find(m => m.id === modelId)
  if (selectedModel) {
    setCurrentModelExact(selectedModel.provider.id, modelId)
  }
}

/**
 * 判断指定索引的消息是否为连续消息
 * 对应 HiveChat MessageList.tsx 的 showLine 逻辑：
 * - 当前消息是 assistant，且下一条也是 assistant → 连续
 * - 当前是最后一条 assistant，且正在等待响应 → 连续（与 ResponsingMessage 之间显示连接线）
 *
 * @param index - 消息索引
 * @returns 是否为连续消息
 */
const isConsecutiveMessage = (index: number): boolean => {
  const item = messageList.value[index]
  if (!item || item.role !== 'assistant') return false

  // 当前消息是 assistant，且下一条也是 assistant
  if (index < messageList.value.length - 1 && messageList.value[index + 1]?.role === 'assistant') {
    return true
  }

  // 最后一条 assistant 消息，且正在等待响应
  if (index === messageList.value.length - 1 && responseStatus.value === 'pending') {
    return true
  }

  return false
}

/**
 * 根据当前时间段获取问候语
 * 对应 HiveChat page.tsx 的 getGreeting 函数
 *
 * @returns 问候语文本
 */
const getGreeting = (): string => {
  const currentHour = new Date().getHours()
  if (currentHour >= 5 && currentHour < 12) {
    return '早上好'
  } else if (currentHour >= 12 && currentHour < 14) {
    return '中午好'
  } else if (currentHour >= 14 && currentHour < 18) {
    return '下午好'
  } else {
    return '晚上好'
  }
}

onMounted(() => {
  greetingText.value = getGreeting()
  setWebSearchEnabled(false)
  // 从后台加载激活的模型列表
  loadActiveModels()
})

const toggleChat = () => {
  if (dragMoved.value) return
  chatVisible.value = !chatVisible.value
}

/**
 * 悬浮按钮 mousedown：开始拖动按钮
 * @param e 鼠标事件
 */
const onFloatButtonMouseDown = (e: MouseEvent) => {
  handleMouseDown(e, 'button')
}

/**
 * 悬浮按钮 click：仅在未发生真实拖动时切换弹窗显示
 */
const onFloatButtonClick = () => {
  if (dragMoved.value) return
  chatVisible.value = !chatVisible.value
}

/**
 * 清空对话
 * 对应 HiveChat InputArea 的 handleClearHistory，弹出确认弹窗后清空
 */
const handleClear = () => {
  Modal.confirm({
    title: '确认清空',
    content: '确定要清空所有对话记录吗？清空后不可恢复。',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      clearHistory()
    }
  })
}

/**
 * 清除记忆（插入分隔标记）
 * 对应 HiveChat InputArea 的 handleClearMemory → addBreak()
 * 与清空对话不同，清除记忆只是重置上下文，不删除消息
 */
const handleClearMemory = () => {
  addBreak()
}

/**
 * 选择历史会话
 * 加载选中会话的所有消息
 *
 * @param sessionId - 选中的会话ID
 */
const handleSessionSelect = (sessionId: string) => {
  // 获取当前模型的 ID 和 maxTokens，确保压缩时使用正确的模型配置
  const modelId = currentModelInfo.value?.id ? Number(currentModelInfo.value.id) : undefined
  const maxTokens = currentModelInfo.value?.maxTokens
  loadSession(sessionId, modelId, maxTokens)
}

/**
 * 会话被删除（从 ChatList 中删除）
 * store.deleteSession 已自动从列表移除并清空会话数据
 * 这里额外清理 Agent 记忆状态（Agent 状态不在 store 管辖范围）
 *
 * @param sessionId - 被删除的会话ID
 */
const handleSessionDeleted = (_sessionId: string) => {
  clearHistory()
}

/**
 * 发送消息
 * 将 InputArea 传来的消息、附件、联网搜索参数转发给 useChat
 *
 * @param content - 消息内容
 * @param attachments - 图片附件
 * @param searchEnabled - 是否启用联网搜索
 */
const handleSend = (content: string, attachments?: Attachment[], searchEnabled?: boolean) => {
  // 获取当前模型的 ID（转换为数字类型）和 maxTokens
  const modelId = currentModelInfo.value?.id ? Number(currentModelInfo.value.id) : undefined
  const maxTokens = currentModelInfo.value?.maxTokens
  sendMessage(content, attachments, searchEnabled, modelId, maxTokens)
}

/**
 * InputArea 联网搜索切换事件
 * 同步更新 useChat 的 webSearchEnabled 状态
 *
 * @param enabled - 是否启用联网搜索
 */
const handleToggleSearch = (enabled: boolean) => {
  setWebSearchEnabled(enabled)
}

/**
 * InputArea 深度思考切换事件
 * 更新 deepThinkEnabled 状态，供后续发送消息时使用
 *
 * @param enabled - 是否启用深度思考
 */
const handleToggleDeepThink = (enabled: boolean) => {
  deepThinkEnabled.value = enabled
}

/**
 * ChatHeader mousedown 事件处理
 * 将事件转发给 useDrag 的 handleMouseDown 实现拖动
 * @param e - 鼠标事件对象
 */
const onHeaderMouseDown = (e: MouseEvent) => {
  handleMouseDown(e, 'dialog')
}

/**
 * 重试消息
 * 删除指定索引及之后的消息，重新发送
 * @param index - 用户消息的索引
 */
const handleRetry = (index: number) => {
  retryMessage(index)
}

/**
 * 删除指定索引的消息
 * @param index - 消息索引
 */
const handleDelete = (index: number) => {
  deleteMessage(index)
}

/**
 * 处理 MCP 服务器选中状态变更
 * @param name - 服务器名称
 * @param selected - 是否选中
 */
const handleChangeMcpSelect = (name: string, selected: boolean) => {
  changeMcpServerSelect(name, selected)
}

/**
 * 处理历史消息设置变更
 * @param type - 历史消息类型
 * @param count - 历史消息条数
 */
const handleChangeHistorySettings = (type: string, count: number) => {
  setHistoryType(type as 'all' | 'none' | 'count')
  setHistoryCount(count)
}

/**
 * 新对话
 * 清空当前对话，回到初始状态，并刷新左侧历史对话列表
 */
const handleNewChat = () => {
  clearHistory()
  chatListRef.value?.refresh()
}

/**
 * 滚动到底部
 * 平滑滚动聊天区域到最底部
 */
const scrollToBottom = () => {
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTo({
      top: chatBodyRef.value.scrollHeight,
      behavior: 'smooth'
    })
    setIsUserScrolling(false)
    showScrollButton.value = false
  }
}

/**
 * 处理滚动事件（节流版本）
 * 判断用户是否手动上滚，综合判断滚动到底部按钮的显示
 * 对应 HiveChat MessageList.tsx 的 handleScroll 逻辑：
 * - 距底部不超过 20px 视为"接近底部"
 * - 内容不足以滚动时不显示按钮
 * - AI 回复中不显示按钮
 */
const handleScrollRaw = () => {
  const el = chatBodyRef.value
  if (!el) return

  const isNearBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 20
  const shouldShowButton = !isNearBottom
    && el.scrollHeight > el.clientHeight + 50
    && responseStatus.value !== 'pending'

  setIsUserScrolling(!isNearBottom)
  showScrollButton.value = shouldShowButton
}

/** 节流滚动处理，100ms 间隔 */
let scrollThrottleTimer: ReturnType<typeof setTimeout> | null = null
const throttledHandleScroll = () => {
  if (scrollThrottleTimer) return
  scrollThrottleTimer = setTimeout(() => {
    handleScrollRaw()
    scrollThrottleTimer = null
  }, 100)
}

/**
 * 防抖自动滚动到底部
 * 对应 HiveChat MessageList.tsx 的 debouncedScrollToBottom
 * 仅在用户未手动上滚时自动滚动
 */
let autoScrollTimer: ReturnType<typeof setTimeout> | null = null
const debouncedAutoScroll = () => {
  if (autoScrollTimer) clearTimeout(autoScrollTimer)
  autoScrollTimer = setTimeout(() => {
    if (!isUserScrolling.value && chatBodyRef.value) {
      requestAnimationFrame(() => {
        if (chatBodyRef.value) {
          chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
        }
      })
    }
  }, 50)
}

watch(
  () => [messageList.value.length, responseMessage.value],
  () => {
    debouncedAutoScroll()
  }
)

onUnmounted(() => {
  if (scrollThrottleTimer) clearTimeout(scrollThrottleTimer)
  if (autoScrollTimer) clearTimeout(autoScrollTimer)
})
</script>

<style scoped>
.ai-iframe-container {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.float-button {
  position: fixed;
  top: 0;
  left: 0;
  width: 50px;
  height: 50px;
  background-color: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: background-color 0.3s;
  user-select: none;
  touch-action: none;
}

.float-button.is-dragging {
  cursor: grabbing;
}

.ai-dialog-wrapper {
  width: 920px;
  height: 560px;
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
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: #fff;
  flex-shrink: 0;
}

.ai-dialog-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-dialog-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
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

.ai-dialog-close {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background 0.2s;
  line-height: 1;
  padding: 0;
  font-family: Arial, sans-serif;
}

.ai-dialog-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chat-panel {
  flex: 1;
  min-height: 0;
  background-color: #fff;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

/* 左侧历史对话栏 */
.chat-sidebar {
  width: 240px;
  flex-shrink: 0;
  height: 100%;
  min-height: 0;
  border-right: 1px solid #e5e7eb;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 右侧主聊天区 */
.chat-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.float-button:hover {
  background-color: var(--color-primary-hover);
}

.float-button :deep(.anticon) {
  font-size: 24px;
  color: #fff;
}

.chat-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 0;
  position: relative;
  user-select: text;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  padding: 0 24px;
}

.greeting-emoji {
  font-size: 32px;
}

.greeting-text {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0;
  text-align: center;
}

.greeting-notice {
  color: #9ca3af;
  font-size: 14px;
  margin: 0;
}

.guide-alert {
  width: 100%;
  max-width: 300px;
}

.chat-body::-webkit-scrollbar {
  width: 4px;
}

.chat-body::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 2px;
}

.chat-body::-webkit-scrollbar-track {
  background: transparent;
}

.user-prompt-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin: 8px 12px 0;
  background: linear-gradient(135deg, #fff7e6 0%, #fff1d6 100%);
  border: 1px solid #ffd591;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(255, 159, 67, 0.08);
}
.user-prompt-hint-icon {
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
}
.user-prompt-hint-body {
  flex: 1;
  min-width: 0;
}
.user-prompt-hint-label {
  font-size: 12px;
  color: #d48806;
  font-weight: 500;
  margin-bottom: 2px;
}
.user-prompt-hint-question {
  font-size: 13px;
  line-height: 1.5;
  color: #5c2e00;
  word-break: break-word;
}
.user-prompt-hint-toggle,
.user-prompt-hint-dismiss {
  flex-shrink: 0;
  padding: 0 6px;
  height: 24px;
  font-size: 12px;
}
.user-prompt-hint-dismiss {
  color: #999;
  font-size: 18px;
  line-height: 1;
}
.user-prompt-hint-dismiss:hover {
  color: #666;
}

.user-prompt-options-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 14px 0;
  margin: 0 12px;
}
.user-prompt-option-pill {
  cursor: pointer;
  padding: 2px 10px;
  border-radius: 12px;
  background: #fafafa;
  border-color: #d9d9d9;
  font-size: 12px;
  transition: all 0.15s;
}
.user-prompt-option-pill:hover {
  color: #fa8c16;
  border-color: #ffd591;
  background: #fff7e6;
}

.user-prompt-slide-enter-active,
.user-prompt-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.user-prompt-slide-enter-from,
.user-prompt-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
