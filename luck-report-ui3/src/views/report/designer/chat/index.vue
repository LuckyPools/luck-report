<template>
  <div class="ai-iframe-container">
    <FloatButton
      :visible="chatVisible"
      :is-dragging="isDragging"
      :position-x="panelPosition.x + panelWidth - 50"
      :position-y="panelPosition.y"
      @mousedown="onFloatButtonMouseDown"
      @click="onFloatButtonClick"
    />

    <div
      v-if="chatVisible"
      class="ai-dialog-wrapper"
      :style="{ width: panelWidth + 'px', left: panelPosition.x + 'px', top: panelPosition.y + 'px' }"
    >
      <DialogHeader
        :is-dragging="isDragging"
        @mousedown="onHeaderMouseDown"
        @close="toggleChat"
      />

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
            <div v-if="messagesLoading" class="messages-loading">
              <DotLoading />
            </div>
            <EmptyState
              v-else-if="messageList.length === 0 && responseStatus === 'done'"
              :show-guide-alert="showGuideAlert"
              :quick-questions="quickQuestions"
              @send-question="sendQuickQuestion"
            />
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
                @select-option="selectAskUserOption"
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
import DotLoading from '@/components/dot-loading/index.vue'
import '@/assets/css/common/index.css'
import { useDrag } from './drag.ts'
import { useChat } from './composables/useChat.ts'
import { useModelList } from './composables/useModelList.ts'
import { useGlobalConfig } from './composables/useGlobalConfig.ts'
import { useMcpServer } from './composables/useMcpServer.ts'
import { useScroll } from './composables/useScroll.ts'
import { useChatStore } from '@/store/modules/chat'
import { storeToRefs } from 'pinia'
import ChatHeader from './components/ChatHeader.vue'
import MessageItem from './components/MessageItem.vue'
import ResponsingMessage from './components/ResponsingMessage.vue'
import InputArea from './components/InputArea.vue'
import ScrollToBottomButton from './components/ScrollToBottomButton.vue'
import ChatList from './components/ChatList.vue'
import EmptyState from './components/EmptyState.vue'
import FloatButton from './components/FloatButton.vue'
import DialogHeader from './components/DialogHeader.vue'
import type { Attachment } from './types/chat'

const chatStore = useChatStore()
const { messagesLoading } = storeToRefs(chatStore)

const chatVisible = ref(false)
const chatBodyRef = ref<HTMLElement | null>(null)
const chatListRef = ref<InstanceType<typeof ChatList> | null>(null)
/** 弹窗尺寸：含左侧历史对话栏 240px + 右侧主区 620px = 860 总宽，高度 560 */
const panelWidth = 860
const { isDragging, dragMoved, panelPosition, resetPosition, handleMouseDown } = useDrag(panelWidth, 560, 50, 50)

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

const {
  showScrollButton,
  scrollToBottom,
  throttledHandleScroll
} = useScroll(
  chatBodyRef,
  messageList,
  responseMessage,
  responseStatus,
  setIsUserScrolling,
  isUserScrolling
)

/** 问候语文本，根据时间段动态生成 */
const greetingText = ref('')

/** 快捷问题列表 */
const quickQuestions = [
  { icon: '✨', text: '制作一个用户报表' },
  { icon: '📈', text: '生成一个折线图' },
  { icon: '📋', text: '分析一下报表' }
]

/**
 * 发送快捷问题
 * @param item 快捷问题项
 */
const sendQuickQuestion = (item: { icon: string; text: string }) => {
  const modelId = currentModelInfo.value?.id ? Number(currentModelInfo.value.id) : undefined
  const maxTokens = currentModelInfo.value?.maxTokens
  sendMessage(item.text, undefined, undefined, modelId, maxTokens)
}

/** 是否启用深度思考（影响后续发送消息时是否传入 deepThink 参数） */
const deepThinkEnabled = ref(false)

/**
 * 处理 ask_user 提问中 option 被点击：把选项作为用户回复直接发送
 * 走 sendMessage 完整流程（包含 ask_user 上下文包装），planner 看到回复后会继续执行任务
 *
 * @param option - 被点击的选项文本
 */
const selectAskUserOption = (option: string) => {
  if (!option || responseStatus.value === 'pending') return
  const modelId = currentModelInfo.value?.id ? Number(currentModelInfo.value.id) : undefined
  const maxTokens = currentModelInfo.value?.maxTokens
  sendMessage(option, undefined, undefined, modelId, maxTokens, deepThinkEnabled.value)
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
 * - 当前消息是 assistant（且不是 ask_user 卡片），且下一条也是 assistant → 连续
 * - 当前是最后一条 assistant，且正在等待响应 → 连续（与 ResponsingMessage 之间显示连接线）
 *
 * @param index - 消息索引
 * @returns 是否为连续消息
 */
const isConsecutiveMessage = (index: number): boolean => {
  const item = messageList.value[index]
  if (!item || item.role !== 'assistant') return false
  // ask_user 提问消息有独立卡片样式，不参与连接线
  if (item.type === 'ask_user') return false

  // 当前消息是 assistant，且下一条也是 assistant（非 ask_user 卡片）
  const next = messageList.value[index + 1]
  if (index < messageList.value.length - 1 && next?.role === 'assistant' && next.type !== 'ask_user') {
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
  sendMessage(content, attachments, searchEnabled, modelId, maxTokens, deepThinkEnabled.value)
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
  position: fixed;
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

.chat-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 0;
  position: relative;
  user-select: text;
}

.messages-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
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
</style>
