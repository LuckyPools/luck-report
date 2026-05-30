import type { SearchStatus, McpToolCall } from '@/views/agent/types/chat'

/**
 * 聊天 API 层
 * 封装 SSE 流式请求，将网络通信与业务逻辑解耦
 * useChat 通过回调函数接收流式数据，不直接依赖 fetch 细节
 * 对照 HiveChat 补齐 searchEnabled、attachments、contextMessages、searchStatus、mcpTools 支持
 */

/**
 * SSE 事件回调接口
 * @property onMessage - 收到消息片段时的回调
 * @property onReasoning - 收到推理/深度思考内容片段时的回调
 * @property onTokenUsage - 收到 Token 用量时的回调
 * @property onSearchStatus - 收到联网搜索状态变更时的回调
 * @property onMcpTools - 收到 MCP 工具调用信息时的回调
 * @property onDone - 流式传输完成时的回调
 * @property onError - 收到错误事件时的回调
 */
export interface SseCallbacks {
  onMessage: (data: string) => void
  onReasoning?: (data: string) => void
  onTokenUsage?: (usage: TokenUsage) => void
  onSearchStatus?: (status: SearchStatus) => void
  onMcpTools?: (tools: McpToolCall[]) => void
  onDone: () => void
  onError: (error: string) => void
}

/**
 * Token 用量接口
 */
export interface TokenUsage {
  totalTokens: number
  inputTokens: number
  outputTokens: number
}

/**
 * 消息附件接口
 */
export interface AttachmentPayload {
  /** MIME 类型 */
  mimeType: string
  /** Base64 编码数据 */
  data: string
}

/**
 * 上下文消息接口
 * 用于发送给 API 的历史消息
 */
export interface ContextMessage {
  /** 消息角色 */
  role: 'user' | 'assistant' | 'system'
  /** 消息内容 */
  content: string
}

/**
 * 解析单个 SSE 事件文本块
 * 从 SSE 文本块中提取 event 类型和 data 内容
 *
 * @param text - SSE 事件文本块（由 \n\n 分隔出的完整事件）
 * @returns 解析后的事件对象，包含 type 和 data
 */
const parseSseEvent = (text: string): { type: string; data: string } => {
  let type = 'message'
  let data = ''
  for (const line of text.split('\n')) {
    if (line.startsWith('event:')) {
      type = line.replace('event:', '').trim()
    } else if (line.startsWith('data:')) {
      data = line.replace('data:', '').trim()
    }
  }
  return { type, data }
}

/**
 * 处理单个 SSE 事件的分发
 * 根据 event type 调用对应的回调函数
 *
 * @param type - SSE 事件类型
 * @param data - SSE 事件数据
 * @param callbacks - 回调函数集合
 */
const dispatchSseEvent = (type: string, data: string, callbacks: SseCallbacks) => {
  if (type === 'done') {
    callbacks.onDone()
  } else if (type === 'error') {
    callbacks.onError(data || '请求失败')
  } else if (type === 'message') {
    if (data && data !== '[DONE]') {
      callbacks.onMessage(data)
    }
  } else if (type === 'reasoning_content') {
    if (data && callbacks.onReasoning) {
      callbacks.onReasoning(data)
    }
  } else if (type === 'token_usage') {
    if (data && callbacks.onTokenUsage) {
      try {
        const usage = JSON.parse(data)
        callbacks.onTokenUsage(usage)
      } catch {
        // JSON 解析失败时忽略
      }
    }
  } else if (type === 'search_status') {
    if (data && callbacks.onSearchStatus) {
      const validStatuses: SearchStatus[] = ['none', 'searching', 'error', 'done']
      if (validStatuses.includes(data as SearchStatus)) {
        callbacks.onSearchStatus(data as SearchStatus)
      }
    }
  } else if (type === 'mcp_tools') {
    if (data && callbacks.onMcpTools) {
      try {
        const tools = JSON.parse(data)
        if (Array.isArray(tools)) {
          callbacks.onMcpTools(tools as McpToolCall[])
        }
      } catch {
        // JSON 解析失败时忽略
      }
    }
  }
}

/**
 * 发起 SSE 流式聊天请求
 * 使用 fetch + ReadableStream 读取 SSE 响应
 * 通过回调函数将解析后的事件传递给调用方
 * 支持 message、reasoning_content、token_usage、search_status、mcp_tools 事件类型
 * 对照 HiveChat 补齐 attachments、searchEnabled、contextMessages 参数
 *
 * @param message - 用户输入的消息内容
 * @param callbacks - SSE 事件回调对象
 * @param signal - AbortSignal，用于取消请求
 * @param attachments - 可选，图片附件列表
 * @param searchEnabled - 可选，是否启用联网搜索
 * @param contextMessages - 可选，历史消息上下文列表
 */
export async function chatStream(
  message: string,
  callbacks: SseCallbacks,
  signal?: AbortSignal,
  attachments?: AttachmentPayload[],
  searchEnabled?: boolean,
  contextMessages?: ContextMessage[]
): Promise<void> {
  // 统一使用 POST 请求，以支持 contextMessages 等复杂参数
  const requestBody: Record<string, unknown> = {
    message,
    searchEnabled: searchEnabled || false
  }

  if (attachments && attachments.length > 0) {
    requestBody.attachments = attachments
  }

  if (contextMessages && contextMessages.length > 0) {
    requestBody.contextMessages = contextMessages
  }

  const fetchOptions: RequestInit = {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify(requestBody)
  }

  const url = '/api/chat/stream'

  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('Response body is null')
  }

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const parts = buffer.split('\n\n')
    buffer = parts.pop() || ''

    for (const part of parts) {
      if (!part.trim()) continue
      const { type, data } = parseSseEvent(part)
      dispatchSseEvent(type, data, callbacks)
    }
  }

  if (buffer.trim()) {
    const { type, data } = parseSseEvent(buffer)
    dispatchSseEvent(type, data, callbacks)
  }
}
