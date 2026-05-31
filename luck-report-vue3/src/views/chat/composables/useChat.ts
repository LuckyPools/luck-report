import { ref, onUnmounted } from 'vue'
import type { Message, ResponseStatus, Attachment, HistoryType, SearchStatus, McpToolCall } from '../types/chat'
import type { TokenUsage } from '@/api/chat'
import { AgentEngine } from '@/views/agent/composables/useAgent'
import type { AgentEvent } from '@/views/agent/core/agent-loop'
import type { ToolCall } from '@/views/agent/tools/types'
import {
  createSession,
  batchSaveMessages,
  listMessages,
  deleteSession as apiDeleteSession,
  renameSession as apiRenameSession,
  type SessionInfo,
  type BatchMessageItem
} from '@/api/chat/persistence'

/**
 * 聊天核心逻辑 Hook
 * 管理消息列表、流式响应、发送消息等功能
 * SSE 网络请求通过 api/chat 层发起，本层只负责状态管理和回调处理
 *
 * Agent 集成：
 * - 始终走 AgentEngine.start() 路径（Agentic Loop）
 * - Agent 事件回调中更新 messageList、responseMessage 等响应式状态
 *
 * 持久化集成：
 * - 发送消息时自动创建会话（首次）
 * - Agent Loop 结束后批量保存本轮消息到后端
 * - 支持加载旧对话、切换会话、删除会话
 */
export function useChat() {
  const messageList = ref<Message[]>([])
  const responseStatus = ref<ResponseStatus>('done')
  const responseMessage = ref('')
  const responseReasoning = ref('')
  const isUserScrolling = ref(false)

  /** 联网搜索开关，对应 HiveChat chat store 的 webSearchEnabled */
  const webSearchEnabled = ref(false)

  /** 联网搜索状态，对应 HiveChat 的搜索状态展示 */
  const searchStatus = ref<SearchStatus>('none')

  /** MCP 工具调用记录，对应 HiveChat 的 MCP 工具调用展示 */
  const mcpTools = ref<McpToolCall[]>([])

  /** 历史记录类型，对应 HiveChat chat store 的 historyType */
  const historyType = ref<HistoryType>('count')

  /** 历史记录条数，对应 HiveChat chat store 的 historyCount */
  const historyCount = ref(5)

  /** Agent 待确认的工具调用 */
  const pendingConfirmToolCall = ref<ToolCall | null>(null)

  /** 当前会话ID，null 表示尚未创建会话 */
  const currentSessionId = ref<string | null>(null)

  /** 当前会话信息 */
  const currentSession = ref<SessionInfo | null>(null)

  /** Agent 引擎实例 */
  const agentEngine = new AgentEngine({
    maxIterations: 10,
    onToolConfirm: async (toolCall: ToolCall) => {
      pendingConfirmToolCall.value = toolCall
      return new Promise<boolean>((resolve) => {
        confirmResolver = resolve
      })
    },
    sessionId: currentSessionId.value ?? undefined
  })

  /** 工具确认回调的 resolve 函数 */
  let confirmResolver: ((value: boolean) => void) | null = null

  let abortController: AbortController | null = null
  let rawContent = ''
  let rawReasoning = ''
  let tokenUsage: TokenUsage | undefined
  let rafId: number | null = null

  /** 本轮新增消息的起始索引，用于批量保存时只提交新增部分 */
  let roundStartIndex = 0

  /**
   * 使用 requestAnimationFrame 节流更新响应消息
   * 限制 DOM 更新频率为 60fps，避免高频 SSE 数据导致卡顿
   *
   * @param chunk - 新增的响应内容片段
   */
  const appendContent = (chunk: string) => {
    rawContent += chunk
    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        responseMessage.value = rawContent
        responseReasoning.value = rawReasoning
        rafId = null
      })
    }
  }

  /**
   * 追加推理/深度思考内容
   *
   * @param chunk - 新增的推理内容片段
   */
  const appendReasoning = (chunk: string) => {
    rawReasoning += chunk
    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        responseMessage.value = rawContent
        responseReasoning.value = rawReasoning
        rafId = null
      })
    }
  }

  /**
   * 更新 Token 用量
   *
   * @param usage - Token 用量数据
   */
  const updateTokenUsage = (usage: TokenUsage) => {
    tokenUsage = usage
  }

  /**
   * 取消待执行的 requestAnimationFrame 回调
   */
  const cancelRaf = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  /**
   * 根据历史记录设置和 break 标记过滤消息列表
   * 对应 HiveChat useChat 的 prepareMessage 逻辑：
   * 1. 从最后一个 break 消息开始截取
   * 2. 过滤掉 error 和 break 类型的消息
   * 3. 根据 historyType/historyCount 截取
   *
   * @returns 过滤后可用于发送给 API 的消息列表
   */
  const getFilteredMessages = (): Message[] => {
    const validMessageType = ['text', 'image']

    const breakIndex = messageList.value.findLastIndex(item => item.type === 'break')
    let tmpMessages = breakIndex > -1
        ? messageList.value.slice(breakIndex + 1)
        : messageList.value

    let filtered = tmpMessages.filter(item => validMessageType.includes(item.type || 'text'))

    if (historyType.value === 'all') {
      // 发送全部
    } else if (historyType.value === 'none') {
      filtered = []
    } else {
      if (historyCount.value < filtered.length) {
        filtered = filtered.slice(-historyCount.value)
      }
    }

    return filtered
  }

  /**
   * 插入上下文分隔标记
   * 对应 HiveChat useChat 的 addBreak 逻辑
   * 不删除任何历史消息，仅插入一条 type='break' 的消息
   * AI 在处理后续消息时会忽略 break 之前的所有内容
   */
  const addBreak = () => {
    if (messageList.value.length > 0 && messageList.value.at(-1)?.type === 'break') {
      return
    }
    const breakMessage: Message = {
      id: Date.now(),
      role: 'system',
      content: '上下文已清除',
      createdAt: new Date(),
      type: 'break'
    }
    messageList.value.push(breakMessage)
  }

  /**
   * 构建 assistant 消息对象
   * 提取公共逻辑，普通模式和 Agent 模式共用
   *
   * @param content - 消息文本内容
   * @param reasoning - 推理内容
   * @param extra - 额外字段
   * @returns Message 对象
   */
  const buildAssistantMessage = (
    content: string,
    reasoning?: string,
    extra?: Partial<Message>
  ): Message => ({
    id: Date.now(),
    role: 'assistant',
    content,
    createdAt: new Date(),
    type: 'text',
    reasoningContent: reasoning || undefined,
    totalTokens: (tokenUsage as TokenUsage | undefined)?.totalTokens,
    inputTokens: (tokenUsage as TokenUsage | undefined)?.inputTokens,
    outputTokens: (tokenUsage as TokenUsage | undefined)?.outputTokens,
    searchStatus: searchStatus.value !== 'none' ? searchStatus.value : undefined,
    mcpTools: mcpTools.value.length > 0 ? [...mcpTools.value] : undefined,
    ...extra
  })

  /**
   * 将前端 Message 列表转换为后端批量保存格式
   * 只转换 roundStartIndex 之后的消息（本轮新增部分）
   *
   * @returns 批量保存消息数组
   */
  const buildBatchMessages = (): BatchMessageItem[] => {
    const items: BatchMessageItem[] = []
    for (let i = roundStartIndex; i < messageList.value.length; i++) {
      const msg = messageList.value[i]
      // 跳过 break 和 error 类型，后端不需要存储
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
    return items
  }

  /**
   * 批量保存本轮新增消息到后端
   * 在 Agent Loop 结束后调用（方案A：Loop 结束后批量存）
   * 保存失败时打印详细错误，便于排查，但不影响前端正常使用
   */
  const persistMessages = async () => {
    if (!currentSessionId.value) {
      console.warn('[persistMessages] 无 sessionId，跳过持久化')
      return
    }

    const items = buildBatchMessages()
    if (items.length === 0) {
      console.info('[persistMessages] 无新增消息需要保存')
      return
    }

    try {
      console.info(`[persistMessages] 保存 ${items.length} 条消息到会话 ${currentSessionId.value}`)
      await batchSaveMessages(currentSessionId.value, items)
      roundStartIndex = messageList.value.length
      console.info('[persistMessages] 消息持久化成功')
    } catch (e) {
      console.error('[persistMessages] 消息持久化失败:', e)
    }
  }

  /**
   * 处理 Agent 循环事件
   * 将 AgentEvent 转换为 messageList 中的 Message 和响应式状态更新
   * 声明为 async 以支持 await persistMessages()
   *
   * @param event - Agent 事件
   */
  const handleAgentEvent = async (event: AgentEvent) => {
    switch (event.type) {
      case 'text_delta':
        appendContent(event.content)
        break

      case 'reasoning_delta':
        appendReasoning(event.content)
        break

      case 'tool_call_start': {
        cancelRaf()
        responseMessage.value = rawContent
        responseReasoning.value = rawReasoning
        if (rawContent || rawReasoning) {
          messageList.value.push(buildAssistantMessage(rawContent, rawReasoning))
          rawContent = ''
          rawReasoning = ''
          responseMessage.value = ''
          responseReasoning.value = ''
        }
        const toolCallMsg: Message = {
          id: Date.now(),
          role: 'assistant',
          content: '',
          createdAt: new Date(),
          type: 'tool_call',
          agentToolCall: {
            toolCallId: event.toolCall.toolCallId,
            toolName: event.toolCall.toolName,
            input: event.toolCall.input,
            status: 'running'
          }
        }
        messageList.value.push(toolCallMsg)
        break
      }

      case 'tool_call_confirm': {
        const msg = messageList.value.find(
          m => m.agentToolCall?.toolCallId === event.toolCall.toolCallId
        )
        if (msg?.agentToolCall) {
          msg.agentToolCall.status = 'confirming'
        }
        break
      }

      case 'tool_call_result': {
        const toolMsg = messageList.value.find(
          m => m.agentToolCall?.toolCallId === event.toolCall.toolCallId
        )
        if (toolMsg?.agentToolCall) {
          toolMsg.agentToolCall.result = event.toolCall.result
          toolMsg.agentToolCall.status = event.toolCall.status === 'done' ? 'done' : 'error'
          toolMsg.agentToolCall.error = event.toolCall.error
        }
        break
      }

      case 'done': {
        cancelRaf()
        responseMessage.value = rawContent
        responseReasoning.value = rawReasoning
        if (rawContent || rawReasoning) {
          messageList.value.push(buildAssistantMessage(rawContent, rawReasoning))
        }
        rawContent = ''
        rawReasoning = ''
        responseMessage.value = ''
        responseReasoning.value = ''
        responseStatus.value = 'done'
        abortController = null

        if (event.reason === 'error') {
          const errorMessage: Message = {
            id: Date.now(),
            role: 'assistant',
            content: event.error || 'Agent 运行出错',
            createdAt: new Date(),
            type: 'error',
            errorType: 'NetworkError',
            errorMessage: event.error
          }
          messageList.value.push(errorMessage)
        }

        // Agent Loop 结束后批量保存消息到后端（必须 await 确保持久化完成）
        await persistMessages()
        break
      }
    }
  }

  /**
   * Agent 模式下的发送消息
   * 通过 AgentEngine 启动 Agentic Loop，替代直接调 chatStream
   *
   * @param content - 用户输入消息
   */
  const sendMessageViaAgent = async (content: string) => {
    abortController = new AbortController()

    try {
      await agentEngine.start(content, handleAgentEvent, abortController.signal)
    } catch (error: unknown) {
      const err = error as Error
      if (err.name === 'AbortError') {
        cancelRaf()
        responseMessage.value = rawContent
        responseReasoning.value = rawReasoning
        if (rawContent || rawReasoning) {
          messageList.value.push(buildAssistantMessage(rawContent, rawReasoning))
        }
      } else {
        const errorMessage: Message = {
          id: Date.now(),
          role: 'assistant',
          content: err.message || 'Agent 请求失败',
          createdAt: new Date(),
          type: 'error',
          errorType: 'NetworkError',
          errorMessage: err.message
        }
        messageList.value.push(errorMessage)
      }
    } finally {
      responseStatus.value = 'done'
      responseMessage.value = ''
      responseReasoning.value = ''
      rawContent = ''
      rawReasoning = ''
      tokenUsage = undefined
      searchStatus.value = 'none'
      mcpTools.value = []
      abortController = null
    }
  }

  /**
   * 发送消息
   * 通过 AgentEngine 启动 Agentic Loop，LLM 可调用工具操作报表
   * 首次发送时自动创建会话，Loop 结束后批量保存消息
   *
   * @param content - 用户输入的消息内容
   * @param attachments - 可选，图片附件列表
   * @param searchEnabled - 可选，是否启用联网搜索
   */
  const sendMessage = async (
      content: string,
      attachments?: Attachment[],
      searchEnabled?: boolean
  ) => {
    if (!content.trim() || responseStatus.value === 'pending') return

    // 首次发送消息时自动创建会话
    if (!currentSessionId.value) {
      try {
        console.info('[sendMessage] 首次发消息，创建会话...')
        const session = await createSession()
        currentSessionId.value = session.id
        currentSession.value = session
        agentEngine.setSessionId(session.id)
        console.info('[sendMessage] 会话创建成功:', session.id)

        generateSessionTitle(session.id, content.trim())
      } catch (e) {
        console.error('[sendMessage] 创建会话失败，消息仅存于前端内存:', e)
      }
    }

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: content.trim(),
      createdAt: new Date(),
      type: 'text',
      attachments,
      searchEnabled
    }

    messageList.value.push(userMessage)
    responseStatus.value = 'pending'
    responseMessage.value = ''
    responseReasoning.value = ''
    rawContent = ''
    rawReasoning = ''
    tokenUsage = undefined
    searchStatus.value = 'none'
    mcpTools.value = []
    pendingConfirmToolCall.value = null

    await sendMessageViaAgent(content.trim())
  }

  /**
   * 停止对话
   * 中断当前 SSE 请求和 AgentEngine，已接收的内容会在 catch(AbortError) 中保存到消息列表
   */
  const stopChat = () => {
    agentEngine.stop()
    if (abortController) {
      abortController.abort()
    }
  }

  /**
   * 清空历史
   * 同时清空 Agent 记忆，重置会话状态
   */
  const clearHistory = () => {
    messageList.value = []
    agentEngine.clearMemory()
    agentEngine.setSessionId(null)
    currentSessionId.value = null
    currentSession.value = null
    roundStartIndex = 0
  }

  /**
   * 加载旧对话
   * 从后端获取会话的历史消息，恢复到前端 messageList 和 Agent 记忆
   *
   * @param sessionId - 要加载的会话ID
   */
  const loadSession = async (sessionId: string) => {
    // 切换前先保存当前会话
    if (currentSessionId.value && roundStartIndex < messageList.value.length) {
      await persistMessages()
    }

    // 清空当前状态
    messageList.value = []
    agentEngine.clearMemory()
    agentEngine.setSessionId(sessionId)
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

        // 恢复工具调用信息
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

        // 同步到 Agent 记忆，确保后续对话上下文完整
        agentEngine.memoryManager.addMessage({
          role: msg.role as 'user' | 'assistant' | 'system' | 'tool_result',
          content: msg.content || '',
          toolCallId: msg.messageType === 'tool_call' ? undefined : undefined
        })
      }

      // 已加载的消息不需要再批量保存
      roundStartIndex = messageList.value.length
    } catch (e) {
      console.warn('加载会话历史失败:', e)
    }
  }

  /**
   * 删除当前会话
   * 调用后端接口软删除，同时清空前端状态
   */
  const removeCurrentSession = async () => {
    if (currentSessionId.value) {
      try {
        await apiDeleteSession(currentSessionId.value)
      } catch (e) {
        console.warn('删除会话失败:', e)
      }
    }
    clearHistory()
  }

  /**
   * 根据用户首条消息异步生成会话标题
   * 截取消息前20个字符作为标题，调用后端 rename 接口更新
   * 异步执行不阻塞对话流程，失败时静默处理
   *
   * @param sessionId - 会话ID
   * @param firstMessage - 用户首条消息内容
   */
  const generateSessionTitle = (sessionId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 20) + (firstMessage.length > 20 ? '...' : '')
    apiRenameSession(sessionId, title).catch(e => {
      console.warn('[generateSessionTitle] 标题生成失败:', e)
    })
  }

  /**
   * 重试消息
   * 删除指定索引及之后的消息，重新发送该索引处的用户消息
   * 对应 HiveChat 的 retryMessage 逻辑
   *
   * @param index - 消息索引（用户消息的索引）
   */
  const retryMessage = (index: number) => {
    if (index < 0 || index >= messageList.value.length) return

    const targetMessage = messageList.value[index]
    if (!targetMessage || targetMessage.role !== 'user') return

    const content = targetMessage.content
    const attachments = targetMessage.attachments
    const searchEnabled = targetMessage.searchEnabled
    messageList.value = messageList.value.slice(0, index)

    sendMessage(content, attachments, searchEnabled)
  }

  /**
   * 删除指定索引的消息
   * 对应 HiveChat 的 deleteMessage 逻辑
   *
   * @param index - 消息索引
   */
  const deleteMessage = (index: number) => {
    if (index < 0 || index >= messageList.value.length) return
    messageList.value.splice(index, 1)
  }

  /**
   * 设置用户滚动状态
   * @param value - 是否正在手动滚动
   */
  const setIsUserScrolling = (value: boolean) => {
    isUserScrolling.value = value
  }

  /**
   * 设置联网搜索开关
   * @param value - 是否启用联网搜索
   */
  const setWebSearchEnabled = (value: boolean) => {
    webSearchEnabled.value = value
  }

  /**
   * 设置历史记录类型
   * @param type - 历史记录类型
   */
  const setHistoryType = (type: HistoryType) => {
    historyType.value = type
  }

  /**
   * 设置历史记录条数
   * @param count - 条数
   */
  const setHistoryCount = (count: number) => {
    historyCount.value = count
  }

  /**
   * 确认执行 Agent 工具调用
   * 用户确认后，Agent 循环继续执行
   */
  const confirmAgentTool = () => {
    if (confirmResolver) {
      confirmResolver(true)
      confirmResolver = null
    }
    pendingConfirmToolCall.value = null
  }

  /**
   * 拒绝执行 Agent 工具调用
   * 用户拒绝后，Agent 循环将工具结果标记为拒绝
   */
  const rejectAgentTool = () => {
    if (confirmResolver) {
      confirmResolver(false)
      confirmResolver = null
    }
    pendingConfirmToolCall.value = null
  }

  /**
   * 更新 Agent 项目规范（长期记忆）
   * @param rules - 规范条目数组
   */
  const updateProjectRules = (rules: string[]) => {
    agentEngine.updateProjectRules(rules)
  }

  /**
   * 更新 Agent 用户偏好（长期记忆）
   * @param preferences - 偏好键值对
   */
  const updateUserPreferences = (preferences: Record<string, any>) => {
    agentEngine.updateUserPreferences(preferences)
  }

  onUnmounted(() => {
    cancelRaf()
    if (abortController) {
      abortController.abort()
    }
    agentEngine.stop()
  })

  return {
    messageList,
    responseStatus,
    responseMessage,
    responseReasoning,
    isUserScrolling,
    webSearchEnabled,
    searchStatus,
    mcpTools,
    historyType,
    historyCount,
    pendingConfirmToolCall,
    currentSessionId,
    currentSession,
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
    updateProjectRules,
    updateUserPreferences,
    getFilteredMessages,
    loadSession,
    removeCurrentSession
  }
}
