/**
 * 消息角色类型
 */
export type MessageRole = 'user' | 'assistant' | 'system'

/**
 * 消息类型
 */
/**
 * 消息类型
 */
export type MessageType = 'text' | 'error' | 'break' | 'tool_call'

/**
 * Agent 工具调用状态
 */
export type AgentToolStatus = 'running' | 'confirming' | 'done' | 'error' | 'rejected'

/**
 * Agent 工具调用记录
 * 嵌入到 Message 中展示工具执行过程和结果
 */
export interface AgentToolCall {
  /** 工具调用 ID，对应 LLM 返回的 toolCallId */
  toolCallId: string
  /** 工具名称 */
  toolName: string
  /** 工具输入参数 */
  input: Record<string, any>
  /** 工具执行结果 */
  result?: string
  /** 调用状态 */
  status: AgentToolStatus
  /** 错误信息（status 为 error 时） */
  error?: string
}

/**
 * 错误类型
 * 对应 HiveChat 的错误分类
 */
export type ErrorType = 'TimeoutError' | 'OverQuotaError' | 'InvalidAPIKeyError' | 'NetworkError' | 'UnknownError'

/**
 * 联网搜索状态
 * 对应 HiveChat 的搜索状态展示
 */
export type SearchStatus = 'none' | 'searching' | 'error' | 'done'

/**
 * MCP 工具调用记录
 * 对应 HiveChat 的 MCP 工具调用展示
 */
export interface McpToolCall {
  /** 工具信息 */
  tool: {
    serverName: string
    name: string
    inputSchema: any
  }
  /** 响应结果 */
  response?: {
    isError?: boolean
    [key: string]: any
  }
  /** 调用状态 */
  status: 'invoking' | 'done'
}

export interface Message {
  id: string | number
  role: MessageRole
  content: string
  createdAt: Date
  type?: MessageType
  errorType?: ErrorType
  errorMessage?: string
  /** 推理/深度思考内容，对应 HiveChat 的 reasoningContent */
  reasoningContent?: string
  /** 总 Token 消耗量 */
  totalTokens?: number
  /** 输入 Token 数 */
  inputTokens?: number
  /** 输出 Token 数 */
  outputTokens?: number
  /** 消息附件（图片等），对应 HiveChat 的 attachments */
  attachments?: Attachment[]
  /** 是否启用联网搜索，对应 HiveChat 的 searchEnabled */
  searchEnabled?: boolean
  /** 联网搜索状态 */
  searchStatus?: SearchStatus
  /** MCP 工具调用记录 */
  mcpTools?: McpToolCall[]
  /** Agent 工具调用记录（type 为 tool_call 时必填） */
  agentToolCall?: AgentToolCall
  /** Provider ID，用于显示 Provider Logo */
  providerId?: string
}

/**
 * 消息附件（图片等）
 * 对应 HiveChat AdaptiveTextarea 的 attachments 参数
 */
export interface Attachment {
  /** MIME 类型，如 image/png */
  mimeType: string
  /** Base64 编码的数据 */
  data: string
}

/**
 * 响应状态
 */
export type ResponseStatus = 'done' | 'pending'

/**
 * 聊天状态
 */
export interface ChatState {
  messageList: Message[]
  responseStatus: ResponseStatus
  responseMessage: string
  currentModel: string
  isUserScrolling: boolean
}

/**
 * 历史记录类型
 * 对应 HiveChat chat store 的 historyType
 * - all: 发送所有历史消息
 * - none: 不发送历史消息
 * - count: 发送最近 N 条消息
 */
export type HistoryType = 'all' | 'none' | 'count'

/**
 * 模型提供商
 * 对应 HiveChat LLMModelProvider
 */
export interface ModelProvider {
  /** 提供商 ID */
  id: string
  /** 提供商名称 */
  providerName: string
  /** 提供商 Logo URL */
  providerLogo?: string
  /** API 风格 */
  apiStyle: string
  /** 是否启用 */
  status?: boolean
}

/**
 * AI 模型
 * 对应 HiveChat LLMModel
 */
export interface LLMModel {
  /** 模型 ID */
  id: string
  /** 显示名称 */
  displayName: string
  /** 最大 Token 数 */
  maxTokens?: number
  /** 是否支持视觉/图片理解 */
  supportVision?: boolean
  /** 是否支持工具调用（MCP） */
  supportTool?: boolean
  /** 是否内置图片生成 */
  builtInImageGen?: boolean
  /** 是否内置联网搜索 */
  builtInWebSearch?: boolean
  /** 是否选中显示 */
  selected?: boolean
  /** 模型类型 */
  type?: string
  /** 所属提供商 */
  provider: ModelProvider
}

/**
 * MCP 服务器
 * 对应 HiveChat MCPServer
 */
export interface McpServer {
  /** 服务器名称 */
  name: string
  /** 服务器描述 */
  description?: string
  /** 是否选中 */
  selected?: boolean
}

/**
 * MCP 工具
 * 对应 HiveChat MCPTool
 */
export interface McpTool {
  /** 工具名称 */
  name: string
  /** 所属服务器名称 */
  serverName: string
  /** 工具描述 */
  description?: string
}

/**
 * 快捷键发送模式
 * 对应 HiveChat userSettings 的 messageSendShortcut
 */
export type MessageSendShortcut = 'enter' | 'ctrl_enter'
