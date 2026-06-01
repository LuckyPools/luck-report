import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Message, ResponseStatus, HistoryType, SearchStatus, McpToolCall } from '@/views/chat/types/chat'
import type { TokenUsage } from '@/api/chat'
import type { ToolCall } from '@/views/agent/tools/types'
import {
  createSession,
  batchSaveMessages,
  listMessages,
  deleteSession as apiDeleteSession,
  deleteMessage as apiDeleteMessage,
  renameSession as apiRenameSession,
  listSessions,
  pinSession as apiPinSession,
  type SessionInfo,
  type BatchMessageItem
} from '@/api/chat/session.ts'

/**
 * 聊天全局状态 Store
 * 统一管理会话列表、当前会话、消息列表等核心数据
 * 所有组件通过 store 读写数据，确保数据源唯一、状态同步
 *
 * 职责划分：
 * - store：数据持有 + 持久化 API 调用
 * - useChat：业务逻辑（Agent 集成、流式响应、消息发送）
 * - 组件：UI 展示 + 事件转发
 */
export const useChatStore = defineStore('chat', () => {
  // ==================== 会话列表 ====================

  /** 会话列表 */
  const sessionList = ref<SessionInfo[]>([])

  /** 会话列表加载状态 */
  const sessionListLoading = ref(false)

  // ==================== 当前会话 ====================

  /** 当前会话ID，null 表示尚未创建会话 */
  const currentSessionId = ref<string | null>(null)

  /** 当前会话信息 */
  const currentSession = ref<SessionInfo | null>(null)

  /** 当前会话的消息列表 */
  const messageList = ref<Message[]>([])

  /** 本轮新增消息的起始索引，用于批量保存时只提交新增部分 */
  let roundStartIndex = 0

  // ==================== 响应状态 ====================

  /** 响应状态 */
  const responseStatus = ref<ResponseStatus>('done')

  /** 当前正在流式输出的响应内容 */
  const responseMessage = ref('')

  /** 当前正在流式输出的推理内容 */
  const responseReasoning = ref('')

  /** 联网搜索开关 */
  const webSearchEnabled = ref(false)

  /** 联网搜索状态 */
  const searchStatus = ref<SearchStatus>('none')

  /** MCP 工具调用记录 */
  const mcpTools = ref<McpToolCall[]>([])

  /** 历史记录类型 */
  const historyType = ref<HistoryType>('count')

  /** 历史记录条数 */
  const historyCount = ref(5)

  /** Agent 待确认的工具调用 */
  const pendingConfirmToolCall = ref<ToolCall | null>(null)

  /** 用户是否正在手动滚动 */
  const isUserScrolling = ref(false)

  // ==================== 计算属性 ====================

  /** 当前会话是否已创建（有 sessionId） */
  const hasActiveSession = computed(() => currentSessionId.value !== null)

  // ==================== 会话列表操作 ====================

  /**
   * 加载会话列表
   * 从后端获取所有会话，按置顶优先、更新时间倒序
   */
  const fetchSessionList = async () => {
    sessionListLoading.value = true
    try {
      sessionList.value = await listSessions()
    } catch (e) {
      console.error('[chatStore] 加载会话列表失败:', e)
      throw e
    } finally {
      sessionListLoading.value = false
    }
  }

  /**
   * 删除会话
   * 调用后端软删除接口，同时从本地列表移除
   * 如果删除的是当前会话，清空消息和会话状态
   *
   * @param sessionId - 会话ID
   */
  const deleteSession = async (sessionId: string) => {
    await apiDeleteSession(sessionId)
    sessionList.value = sessionList.value.filter(s => s.id !== sessionId)
    if (sessionId === currentSessionId.value) {
      clearCurrentSession()
    }
  }

  /**
   * 重命名会话
   * 更新后端标题，同时更新本地列表中的对应项
   *
   * @param sessionId - 会话ID
   * @param title - 新标题
   */
  const renameSession = async (sessionId: string, title: string) => {
    await apiRenameSession(sessionId, title)
    const session = sessionList.value.find(s => s.id === sessionId)
    if (session) {
      session.title = title
    }
    if (sessionId === currentSessionId.value && currentSession.value) {
      currentSession.value.title = title
    }
  }

  /**
   * 置顶或取消置顶会话
   *
   * @param sessionId - 会话ID
   * @param isPinned - 0-取消置顶，1-置顶
   */
  const pinSession = async (sessionId: string, isPinned: number) => {
    await apiPinSession(sessionId, isPinned)
    await fetchSessionList()
  }

  // ==================== 当前会话操作 ====================

  /**
   * 创建新会话
   * 首次发送消息时调用，自动注入当前用户ID
   *
   * @param title - 可选，会话标题
   * @returns 新建的会话对象
   */
  const createNewSession = async (title?: string): Promise<SessionInfo> => {
    const session = await createSession(title)
    currentSessionId.value = session.id
    currentSession.value = session
    roundStartIndex = 0
    await fetchSessionList()
    return session
  }

  /**
   * 加载旧对话
   * 从后端获取会话的历史消息，恢复到 messageList
   *
   * @param sessionId - 要加载的会话ID
   */
  const loadSession = async (sessionId: string) => {
    messageList.value = []
    roundStartIndex = 0

    try {
      const messages = await listMessages(sessionId)
      currentSessionId.value = sessionId

      for (const msg of messages) {
        const message: Message = {
          id: msg.id,
          role: msg.role as Message['role'],
          content: msg.content || '',
          createdAt: new Date(msg.createTime),
          type: (msg.messageType as Message['type']) || 'text'
        }

        if (msg.messageType === 'tool_call' && msg.metadata) {
          try {
            const meta = JSON.parse(msg.metadata)
            message.agentToolCall = {
              toolCallId: meta.toolCallId || '',
              toolName: meta.toolName || '',
              input: meta.input || {},
              status: meta.status || 'done',
              result: meta.result
            }
          } catch {
            // metadata 解析失败时忽略
          }
        }

        messageList.value.push(message)
      }

      roundStartIndex = messageList.value.length
    } catch (e) {
      console.warn('[chatStore] 加载会话历史失败:', e)
      throw e
    }
  }

  /**
   * 清空当前会话状态
   * 重置 sessionId、消息列表等，回到初始状态
   */
  const clearCurrentSession = () => {
    messageList.value = []
    currentSessionId.value = null
    currentSession.value = null
    roundStartIndex = 0
    responseStatus.value = 'done'
    responseMessage.value = ''
    responseReasoning.value = ''
    searchStatus.value = 'none'
    mcpTools.value = []
    pendingConfirmToolCall.value = null
  }

  // ==================== 消息操作 ====================

  /**
   * 删除指定索引的消息
   * 同时调用后端接口删除对应消息记录
   * 如果消息有后端 id（number 类型），则调用删除接口
   *
   * @param index - 消息在 messageList 中的索引
   */
  const deleteMessage = async (index: number) => {
    if (index < 0 || index >= messageList.value.length) return

    const msg = messageList.value[index]

    // 消息 id 为 number 类型时，说明来自后端持久化，需要调接口删除
    if (typeof msg.id === 'number') {
      try {
        await apiDeleteMessage(msg.id as number)
      } catch (e) {
        console.warn('[chatStore] 删除消息接口调用失败:', e)
      }
    }

    messageList.value.splice(index, 1)
  }

  /**
   * 批量保存本轮新增消息到后端
   * 在 Agent Loop 结束后调用
   * 只保存 roundStartIndex 之后的消息
   */
  const persistMessages = async () => {
    if (!currentSessionId.value) {
      console.warn('[chatStore] 无 sessionId，跳过持久化')
      return
    }

    const items: BatchMessageItem[] = []
    for (let i = roundStartIndex; i < messageList.value.length; i++) {
      const msg = messageList.value[i]
      if (msg.type === 'break' || msg.type === 'error') continue

      const item: BatchMessageItem = {
        role: msg.role,
        content: msg.content
      }

      if (msg.type === 'tool_call' && msg.agentToolCall) {
        item.messageType = 'tool_call'
        item.metadata = JSON.stringify({
          toolCallId: msg.agentToolCall.toolCallId,
          toolName: msg.agentToolCall.toolName,
          input: msg.agentToolCall.input,
          status: msg.agentToolCall.status
        })
      } else {
        item.messageType = msg.type || 'text'
      }

      items.push(item)
    }

    if (items.length === 0) {
      console.info('[chatStore] 无新增消息需要保存')
      return
    }

    try {
      console.info(`[chatStore] 保存 ${items.length} 条消息到会话 ${currentSessionId.value}`)
      await batchSaveMessages(currentSessionId.value, items)
      roundStartIndex = messageList.value.length
      console.info('[chatStore] 消息持久化成功')
    } catch (e) {
      console.error('[chatStore] 消息持久化失败:', e)
    }
  }

  /**
   * 根据用户首条消息异步生成会话标题
   * 截取消息前20个字符作为标题，调用后端 rename 接口更新
   *
   * @param sessionId - 会话ID
   * @param firstMessage - 用户首条消息内容
   */
  const generateSessionTitle = (sessionId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 20) + (firstMessage.length > 20 ? '...' : '')
    apiRenameSession(sessionId, title).then(() => {
      // 更新本地列表中的标题
      const session = sessionList.value.find(s => s.id === sessionId)
      if (session) {
        session.title = title
      }
      if (currentSession.value?.id === sessionId) {
        currentSession.value.title = title
      }
    }).catch(e => {
      console.warn('[chatStore] 标题生成失败:', e)
    })
  }

  /**
   * 设置 roundStartIndex
   * 供 useChat 在需要时更新
   *
   * @param index - 新的起始索引
   */
  const setRoundStartIndex = (index: number) => {
    roundStartIndex = index
  }

  /**
   * 获取 roundStartIndex
   * 供 useChat 读取
   *
   * @returns 当前的起始索引
   */
  const getRoundStartIndex = (): number => {
    return roundStartIndex
  }

  return {
    // 会话列表
    sessionList,
    sessionListLoading,
    fetchSessionList,
    deleteSession,
    renameSession,
    pinSession,

    // 当前会话
    currentSessionId,
    currentSession,
    hasActiveSession,
    createNewSession,
    loadSession,
    clearCurrentSession,

    // 消息
    messageList,
    deleteMessage,
    persistMessages,
    generateSessionTitle,
    setRoundStartIndex,
    getRoundStartIndex,

    // 响应状态
    responseStatus,
    responseMessage,
    responseReasoning,
    webSearchEnabled,
    searchStatus,
    mcpTools,
    historyType,
    historyCount,
    pendingConfirmToolCall,
    isUserScrolling
  }
})
