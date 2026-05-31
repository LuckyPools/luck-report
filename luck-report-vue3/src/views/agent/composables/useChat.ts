import { ref, onUnmounted } from 'vue'
import type { Message, ResponseStatus, Attachment, HistoryType, SearchStatus, McpToolCall } from '../types/chat'
import type { TokenUsage, ToolCallData } from '@/api/chat'
import { chatStream, sendToolResult } from '@/api/chat'

/**
 * 聊天核心逻辑 Hook
 * 管理消息列表、流式响应、发送消息等功能
 * SSE 网络请求通过 api/chat 层发起，本层只负责状态管理和回调处理
 * 支持工具调用：接收 tool_call 事件，执行工具，将结果发回后端
 */
export function useChat() {
  const messageList = ref<Message[]>([])
  const responseStatus = ref<ResponseStatus>('done')
  const responseMessage = ref('')
  const responseReasoning = ref('')
  const isUserScrolling = ref(false)

  /** 会话ID，用于多轮对话和工具调用结果关联 */
  const sessionId = ref<string>('')

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
   * 处理工具调用事件
   * 接收后端发送的 tool_call 事件，执行工具并将结果发回后端
   * 注意：后端工具会阻塞等待前端结果，所以只需要发送结果，不需要等待新的 SSE 流
   *
   * @param toolData - 工具调用数据
   */
  const handleToolCall = async (toolData: ToolCallData) => {
    console.log('[useChat] 收到工具调用:', toolData)

    try {
      // 使用 JSON.stringify 将参数对象转为代码字符串，new Function 执行时会自动解析为对象
      const codeString = `${toolData.name}(${JSON.stringify(toolData.args)})`
      console.log('[useChat] 构建工具代码:', codeString)

      // 通过 postMessage 执行工具
      const result = await executeToolCode(codeString)
      console.log('[useChat] 工具执行结果:', result)

      // 将结果发送回后端（后端工具正在等待这个结果）
      if (sessionId.value) {
        await sendToolResultSimple(sessionId.value, toolData.callId, toolData.name, result)
        console.log('[useChat] 工具结果已发送，后端将继续处理')
      }
    } catch (error) {
      console.error('[useChat] 工具执行失败:', error)
    }
  }

  /**
   * 发送工具执行结果到后端（简化版，不等待 SSE 流）
   * 后端工具会阻塞等待这个结果，发送后原来的 SSE 流会继续
   *
   * @param sessionId - 会话ID
   * @param callId - 工具调用ID
   * @param toolName - 工具名称
   * @param result - 工具执行结果
   */
  const sendToolResultSimple = async (
    sessionId: string,
    callId: string,
    toolName: string,
    result: unknown
  ): Promise<void> => {
    const requestBody = {
      sessionId,
      callId,
      toolName,
      result,
      success: true
    }

    const response = await fetch('/api/chat/tool-result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`发送工具结果失败: ${response.status}`)
    }
  }

  /**
   * 执行工具代码
   * 通过 postMessage 与父窗口通信，执行报表工具
   *
   * @param codeString - 工具代码字符串
   * @returns 工具执行结果
   */
  const executeToolCode = (codeString: string): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      // 检查是否在 iframe 中
      if (!window.parent || window.parent === window) {
        // 不在 iframe 中，尝试直接调用全局方法
        if (typeof (window as unknown as Record<string, unknown>)[codeString.split('(')[0]] === 'function') {
          try {
            const result = eval(codeString)
            resolve(result)
          } catch (e) {
            reject(e)
          }
        } else {
          resolve(null)
        }
        return
      }

      const requestId = `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler)
        reject(new Error(`工具执行超时: ${codeString}`))
      }, 5000)

      const handler = (event: MessageEvent) => {
        if (!event.data || event.data.type !== 'IFRAME_RESPONSE') return
        if (event.data.requestId !== requestId) return

        clearTimeout(timeout)
        window.removeEventListener('message', handler)

        if (event.data.error) {
          reject(new Error(event.data.error))
        } else {
          resolve(event.data.result)
        }
      }

      window.addEventListener('message', handler)

      window.parent.postMessage({
        type: 'IFRAME_COMMAND',
        action: codeString.split('(')[0],
        codeString,
        requestId,
        timestamp: Date.now()
      }, '*')
    })
  }

  /**
   * 发送消息
   * 构建用户消息并通过 api/chat 层发起 SSE 流式请求
   * 支持工具调用：接收 tool_call 事件，执行工具，将结果发回后端
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

    abortController = new AbortController()

    try {
      await chatStream(
        content.trim(),
        {
          onMessage: (data: string) => {
            appendContent(data)
          },
          onReasoning: (data: string) => {
            appendReasoning(data)
          },
          onTokenUsage: (usage: TokenUsage) => {
            updateTokenUsage(usage)
          },
          onSearchStatus: (status: SearchStatus) => {
            searchStatus.value = status
          },
          onMcpTools: (tools: McpToolCall[]) => {
            mcpTools.value = tools
          },
          onSession: (id: string) => {
            sessionId.value = id
            console.log('[useChat] 收到会话ID:', id)
          },
          onToolCall: (toolData: ToolCallData) => {
            handleToolCall(toolData)
          },
          onDone: () => {
            // 无需额外处理，finally 中统一保存消息
          },
          onError: (error: string) => {
            throw new Error(error)
          }
        },
        abortController.signal,
        attachments,
        searchEnabled,
        undefined,
        sessionId.value || undefined
      )

      cancelRaf()
      responseMessage.value = rawContent
      responseReasoning.value = rawReasoning

      if (rawContent || rawReasoning) {
        const assistantMessage: Message = {
          id: Date.now(),
          role: 'assistant',
          content: rawContent,
          createdAt: new Date(),
          type: 'text',
          reasoningContent: rawReasoning || undefined,
          totalTokens: (tokenUsage as TokenUsage | undefined)?.totalTokens,
          inputTokens: (tokenUsage as TokenUsage | undefined)?.inputTokens,
          outputTokens: (tokenUsage as TokenUsage | undefined)?.outputTokens,
          searchStatus: searchStatus.value !== 'none' ? searchStatus.value : undefined,
          mcpTools: mcpTools.value.length > 0 ? [...mcpTools.value] : undefined
        }
        messageList.value.push(assistantMessage)
      }
    } catch (error: unknown) {
      const err = error as Error
      if (err.name === 'AbortError') {
        cancelRaf()
        responseMessage.value = rawContent
        responseReasoning.value = rawReasoning
        if (rawContent || rawReasoning) {
          const partialMessage: Message = {
            id: Date.now(),
            role: 'assistant',
            content: rawContent,
            createdAt: new Date(),
            type: 'text',
            reasoningContent: rawReasoning || undefined,
            totalTokens: (tokenUsage as TokenUsage | undefined)?.totalTokens,
            inputTokens: (tokenUsage as TokenUsage | undefined)?.inputTokens,
            outputTokens: (tokenUsage as TokenUsage | undefined)?.outputTokens,
            searchStatus: searchStatus.value !== 'none' ? searchStatus.value : undefined,
            mcpTools: mcpTools.value.length > 0 ? [...mcpTools.value] : undefined
          }
          messageList.value.push(partialMessage)
        }
      } else {
        const errorMessage: Message = {
          id: Date.now(),
          role: 'assistant',
          content: err.message || '请求失败',
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
   * 停止对话
   * 中断当前 SSE 请求，已接收的内容会在 catch(AbortError) 中保存到消息列表
   */
  const stopChat = () => {
    if (abortController) {
      abortController.abort()
    }
  }

  /**
   * 清空历史
   */
  const clearHistory = () => {
    messageList.value = []
    sessionId.value = ''
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
    messageList.value = messageList.value.slice(0, index)

    sendMessage(content, attachments, searchEnabled)
  }

  /**
   * 删除指定索引的消息
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

  onUnmounted(() => {
    cancelRaf()
    if (abortController) {
      abortController.abort()
    }
  })

  return {
    messageList,
    responseStatus,
    responseMessage,
    responseReasoning,
    isUserScrolling,
    sessionId,
    webSearchEnabled,
    searchStatus,
    mcpTools,
    historyType,
    historyCount,
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
    getFilteredMessages
  }
}
