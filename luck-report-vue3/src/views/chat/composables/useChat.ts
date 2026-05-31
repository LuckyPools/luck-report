import { ref, onUnmounted } from 'vue'
import type { Message, ResponseStatus, Attachment, HistoryType, SearchStatus, McpToolCall, AgentToolCall } from '../types/chat'
import type { TokenUsage } from '@/api/chat'
import { AgentEngine } from '@/views/agent/composables/useAgent'
import type { AgentEvent } from '@/views/agent/core/agent-loop'
import type { ToolCall } from '@/views/agent/tools/types'

/**
 * 聊天核心逻辑 Hook
 * 管理消息列表、流式响应、发送消息等功能
 * SSE 网络请求通过 api/chat 层发起，本层只负责状态管理和回调处理
 *
 * Agent 集成：
 * - 始终走 AgentEngine.start() 路径（Agentic Loop）
 * - Agent 事件回调中更新 messageList、responseMessage 等响应式状态
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

  /** Agent 引擎实例 */
  const agentEngine = new AgentEngine({
    maxIterations: 10,
    onToolConfirm: async (toolCall: ToolCall) => {
      // 暂停等待用户确认，设置 pendingConfirmToolCall 供 UI 展示确认弹窗
      pendingConfirmToolCall.value = toolCall
      return new Promise<boolean>((resolve) => {
        confirmResolver = resolve
      })
    }
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

    // 从最后一个 break 消息处截断，break 之前的消息不作为上下文
    const breakIndex = messageList.value.findLastIndex(item => item.type === 'break')
    let tmpMessages = breakIndex > -1
        ? messageList.value.slice(breakIndex + 1)
        : messageList.value

    // 过滤掉 error 和 break 类型，只保留有效消息
    let filtered = tmpMessages.filter(item => validMessageType.includes(item.type || 'text'))

    // 根据 historyType 决定发送多少历史消息
    if (historyType.value === 'all') {
      // 发送全部
    } else if (historyType.value === 'none') {
      filtered = []
    } else {
      // count 模式：取最近 N 条消息
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
    // 如果最后一条已经是 break，不重复插入
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
   *
   * @param event - Agent 事件
   */
  const handleAgentEvent = (event: AgentEvent) => {
    switch (event.type) {
      case 'text_delta':
        appendContent(event.content)
        break

      case 'reasoning_delta':
        appendReasoning(event.content)
        break

      case 'tool_call_start': {
        // 先保存当前流式文本为 assistant 消息
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
        // 插入工具调用消息
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
        // 更新工具调用消息状态为 confirming
        const msg = messageList.value.find(
          m => m.agentToolCall?.toolCallId === event.toolCall.toolCallId
        )
        if (msg?.agentToolCall) {
          msg.agentToolCall.status = 'confirming'
        }
        break
      }

      case 'tool_call_result': {
        // 更新工具调用消息的结果和状态
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
        // 保存最后的流式文本
        cancelRaf()
        responseMessage.value = rawContent
        responseReasoning.value = rawReasoning
        if (rawContent || rawReasoning) {
          messageList.value.push(buildAssistantMessage(rawContent, rawReasoning))
        }
        // 重置流式状态
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
   * 同时清空 Agent 记忆
   */
  const clearHistory = () => {
    messageList.value = []
    agentEngine.clearMemory()
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
    getFilteredMessages
  }
}
