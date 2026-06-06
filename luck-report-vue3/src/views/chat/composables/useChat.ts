import type { Message, Attachment, HistoryType } from '../types/chat'
import type { TokenUsage } from '@/api/chat'
import { AgentEngine } from '@/views/agent/composables/useAgent'
import type { AgentEvent } from '@/views/agent/core/agent-loop'
import type { ToolCall } from '@/views/agent/tools/types'
import { useChatStore } from '@/stores/chat'
import { contextConfig } from '@/config'
import { storeToRefs } from 'pinia'

/**
 * 聊天核心逻辑 Hook
 * 负责消息发送、流式响应、Agent 集成等业务逻辑
 * 数据层委托给 chatStore（Pinia），确保跨组件数据同步
 *
 * 职责划分：
 * - chatStore：数据持有 + 持久化 API 调用
 * - useChat：Agent 集成 + 流式响应处理 + 消息发送业务逻辑
 */
export function useChat() {
  const store = useChatStore()
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
    currentSessionId
  } = storeToRefs(store)

  /** Agent 引擎实例 */
  const agentEngine = new AgentEngine({
    maxIterations: contextConfig.maxAgentIterations,
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
   * Agent 循环中可能有多轮 LLM 调用，每轮返回独立的 usage，需要累加
   *
   * @param usage - Token 用量数据
   */
  const updateTokenUsage = (usage: TokenUsage) => {
    if (!tokenUsage) {
      tokenUsage = { totalTokens: 0, inputTokens: 0, outputTokens: 0 }
    }
    tokenUsage.totalTokens += usage.totalTokens || 0
    tokenUsage.inputTokens += usage.inputTokens || 0
    tokenUsage.outputTokens += usage.outputTokens || 0
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

      case 'token_usage': {
        updateTokenUsage(event.usage)
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

        // Agent Loop 结束后批量保存消息到后端（异步执行，不阻塞后续对话）
        store.persistMessages().catch(e => {
          console.warn('[useChat] 消息持久化失败:', e)
        })
        break
      }
    }
  }

  /**
   * Agent 模式下的发送消息
   * 通过 AgentEngine 启动 Agentic Loop，替代直接调 chatStream
   *
   * @param content - 用户输入消息
   * @param modelId - 可选，大模型配置ID，用于指定使用哪个大模型
   */
  const sendMessageViaAgent = async (content: string, modelId?: number) => {
    abortController = new AbortController()

    try {
      await agentEngine.start(content, handleAgentEvent, abortController.signal, modelId)
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
   * @param modelId - 可选，大模型配置ID，用于指定使用哪个大模型
   */
  const sendMessage = async (
      content: string,
      attachments?: Attachment[],
      searchEnabled?: boolean,
      modelId?: number
  ) => {
    if (!content.trim() || responseStatus.value === 'pending') return

    // 首次发送消息时自动创建会话
    if (!currentSessionId.value) {
      try {
        console.info('[sendMessage] 馆次发消息，创建会话...')
        const session = await store.createNewSession()
        agentEngine.setSessionId(session.id)
        console.info('[sendMessage] 会话创建成功:', session.id)

        store.generateSessionTitle(session.id, content.trim())
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

    await sendMessageViaAgent(content.trim(), modelId)
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
   * 同时清空 Agent 记忆和持久化数据，重置会话状态
   */
  const clearHistory = () => {
    if (currentSessionId.value) {
      agentEngine.removeSession(currentSessionId.value)
    }
    store.clearCurrentSession()
    agentEngine.clearMemory()
    agentEngine.setSessionId(null)
  }

  /**
   * 加载旧对话
   * 从后端获取会话的历史消息，恢复到前端 messageList 和 Agent 记忆
   * 优先尝试从 localStorage 恢复 Agent 记忆（第5层），失败则从消息列表重建
   *
   * @param sessionId - 要加载的会话ID
   * @param modelId - 可选，当前选中的大模型配置ID，用于压缩时使用正确的模型
   */
  const loadSession = async (sessionId: string, modelId?: number) => {
    // 切换前先保存当前会话（异步执行，不阻塞会话切换）
    if (currentSessionId.value && store.getRoundStartIndex() < messageList.value.length) {
      store.persistMessages().catch(e => {
        console.warn('[useChat] 切换会话前持久化失败:', e)
      })
    }

    // 清空 Agent 状态
    agentEngine.clearMemory()
    agentEngine.setSessionId(sessionId)
    // 设置模型ID，确保压缩时使用正确的模型配置
    agentEngine.setModelId(modelId)

    // 通过 store 加载会话数据
    await store.loadSession(sessionId)

    // 第5层：优先尝试从 localStorage 恢复 Agent 记忆
    const restored = agentEngine.restoreSession(sessionId)
    if (!restored) {
      // 恢复失败，从消息列表重建记忆
      // 需要正确还原 tool_call 和 tool_result 的关联关系，
      // 否则 OpenAI Function Calling 协议不完整，大模型无法关联 tool_result
      for (const msg of messageList.value) {
        if (msg.type === 'tool_call' && msg.agentToolCall) {
          // 工具调用结果消息：映射为 tool_result 角色，携带 toolCallId 和 toolName
          agentEngine.memoryManager.addMessage({
            role: 'tool_result',
            content: msg.content || '',
            toolCallId: msg.agentToolCall.toolCallId,
            toolName: msg.agentToolCall.toolName
          })
        } else if (msg.role === 'assistant' && msg.agentToolCall) {
          // assistant 消息携带工具调用：需要保留 toolCalls 信息
          // OpenAI 协议要求回传 assistant 消息时包含 tool_calls
          agentEngine.memoryManager.addMessage({
            role: 'assistant',
            content: msg.content || '',
            toolCalls: [{
              id: msg.agentToolCall.toolCallId,
              type: 'function',
              function: {
                name: msg.agentToolCall.toolName,
                arguments: JSON.stringify(msg.agentToolCall.input || {})
              }
            }]
          })
        } else {
          agentEngine.memoryManager.addMessage({
            role: msg.role as 'user' | 'assistant' | 'system' | 'tool_result',
            content: msg.content || ''
          })
        }
      }
    }

    // 加载历史对话后立即检查是否需要压缩
    // 避免历史消息已超过阈值但需等3轮新对话才触发压缩的问题
    agentEngine.checkAndCompact()
  }

  /**
   * 删除当前会话
   * 通过 store 统一删除（自动从列表移除 + 清空会话数据）
   * 额外清理 Agent 记忆状态和持久化数据
   */
  const removeCurrentSession = async () => {
    if (currentSessionId.value) {
      agentEngine.removeSession(currentSessionId.value)
      try {
        await store.deleteSession(currentSessionId.value)
      } catch (e) {
        console.warn('删除会话失败:', e)
      }
    }
    // store.deleteSession 已清空会话数据，这里只清理 Agent 状态
    agentEngine.clearMemory()
    agentEngine.setSessionId(null)
  }

  /**
   * 重试消息
   * 删除指定索引及之后的消息，重新发送该索引处的用户消息
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
    messageList.value.splice(index)

    sendMessage(content, attachments, searchEnabled)
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
    store.webSearchEnabled = value
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

  return {
    // 从 storeToRefs 解构出的 ref，保持 .value 访问方式
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

    // 业务方法
    sendMessage,
    stopChat,
    clearHistory,
    addBreak,
    retryMessage,
    deleteMessage: store.deleteMessage,
    setIsUserScrolling,
    setWebSearchEnabled,
    setHistoryType,
    setHistoryCount,
    confirmAgentTool,
    rejectAgentTool,
    removeCurrentSession,
    loadSession,
    getFilteredMessages,

    // 任务列表管理器
    taskListManager: agentEngine.getTaskListManager()
  }
}
