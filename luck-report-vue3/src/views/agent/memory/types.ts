/**
 * 记忆系统类型定义
 * 五层记忆架构：
 *   第1层：工具结果截断（减少 50%+ token）
 *   第2层：滑动窗口改进（防止 tool_calls 链被拆散）
 *   第3层：自动摘要压缩（根本性解决长对话问题）
 *   第4层：状态快照（压缩后保持报表上下文）
 *   第5层：会话记忆持久化（跨会话记忆）
 * 参考 Claude Code 的 Session Memory + Compact + CLAUDE.md 机制
 */

/**
 * 短期记忆：当前会话的消息历史
 * 直接存储在内存中，会话结束即消失
 */
export interface ShortTermMemory {
  /** 消息历史列表 */
  messages: MemoryMessage[]
}

/**
 * 记忆消息条目
 * 简化版的消息结构，只保留 Agent 循环所需的核心字段
 * 扩展支持 tool_calls：OpenAI Function Calling 协议要求
 * assistant 消息携带 tool_calls 时，回传给大模型必须包含此信息
 */
export interface MemoryMessage {
  /** 消息角色 */
  role: 'user' | 'assistant' | 'system' | 'tool_result'
  /** 消息内容 */
  content: string
  /** 关联的工具调用 ID（仅 tool_result 类型需要） */
  toolCallId?: string
  /** 关联的工具名称（仅 tool_result 类型需要） */
  toolName?: string
  /**
   * assistant 消息携带的工具调用列表
   * OpenAI Function Calling 协议要求：当 assistant 调用了工具，
   * 回传消息历史时必须包含完整的 tool_calls 信息，
   * 否则大模型无法关联后续的 tool_result 消息
   */
  toolCalls?: ToolCallInfo[]
  /** 标记该消息是否已被截断，用于提示 LLM 结果不完整 */
  truncated?: boolean
}

/**
 * 工具调用信息
 * 对应 OpenAI 响应中 choices[0].message.tool_calls 的单个元素
 */
export interface ToolCallInfo {
  /** 工具调用唯一 ID，由大模型生成 */
  id: string
  /** 工具类型，固定为 "function" */
  type: string
  /** 函数调用信息 */
  function: {
    /** 函数名称 */
    name: string
    /** 函数调用参数 JSON 字符串 */
    arguments: string
  }
}

/**
 * 中期记忆：会话摘要
 * 当对话过长时，用 LLM 生成摘要替代早期消息
 * 参考 Claude Code 的 compactConversation()
 */
export interface MidTermMemory {
  /** 摘要内容 */
  summary: string
  /** 关键操作记录（如修改了哪些单元格） */
  keyOperations: string[]
  /** 生成摘要时的消息条数，用于判断增量 */
  messageCountAtSummary: number
}

/**
 * 长期记忆：用户偏好和项目规范
 * 持久化到 localStorage，跨会话保留
 * 参考 Claude Code 的 CLAUDE.md 机制
 */
export interface LongTermMemory {
  /** 用户偏好（如默认字体、配色方案） */
  userPreferences: Record<string, any>
  /** 报表设计规范（类似 CLAUDE.md，用户自定义的规则） */
  projectRules: string[]
  /** 常用操作模板（如"标题样式"对应一组样式操作） */
  operationTemplates: Record<string, string>
}

/**
 * 记忆压缩请求
 * 当需要压缩时，发送给后台 LLM 生成摘要
 */
export interface CompactRequest {
  /** 需要压缩的消息列表 */
  messages: MemoryMessage[]
  /** 现有摘要（增量压缩时使用） */
  existingSummary?: string
  /** 现有关键操作记录 */
  existingKeyOperations?: string[]
}

/**
 * 记忆压缩结果
 * LLM 返回的摘要和关键操作
 */
export interface CompactResult {
  /** 新的摘要内容 */
  summary: string
  /** 更新后的关键操作列表 */
  keyOperations: string[]
}

/**
 * 报表状态快照
 * 压缩后注入到上下文中，保持报表上下文不丢失
 */
export interface ReportSnapshot {
  /** 行列数 */
  dimensions: { rows: number; cols: number }
  /** 合并单元格区域列表 */
  mergedRegions: Array<{ startRow: number; startCol: number; endRow: number; endCol: number }>
  /** 非空单元格摘要（坐标 → 值），只保留关键单元格 */
  cellValues: Record<string, string>
  /** 数据源绑定信息 */
  dataBindings: string[]
  /** 快照生成时间戳 */
  timestamp: number
}

/**
 * 会话记忆持久化数据
 * 存储到 localStorage，跨页面刷新保留
 */
export interface SessionPersistence {
  /** 会话ID */
  sessionId: string
  /** 短期消息历史（序列化后的 MemoryMessage[]） */
  messages: MemoryMessage[]
  /** 中期摘要 */
  summary: string
  /** 关键操作记录 */
  keyOperations: string[]
  /** 报表状态快照 */
  reportSnapshot: ReportSnapshot | null
  /** 持久化时间戳 */
  savedAt: number
}

/**
 * 上下文窗口配置
 * 控制各层策略的触发阈值
 * 注意：contextWindowTokens 已移除，改为从当前选中模型的 maxTokens 动态获取
 * 注意：已移除滑动窗口相关字段，改用纯压缩机制
 */
export interface ContextWindowConfig {
  /** 工具结果截断阈值（字符数），默认 2000 */
  toolResultMaxChars: number
  /** 触发自动摘要压缩的消息条数阈值，默认 40 */
  compactThreshold: number
  /** 压缩后保留的最近消息条数，默认 10 */
  compactKeepRecent: number
  /** 触发自动压缩的 token 占比阈值，默认 0.7 */
  autoCompactTokenRatio: number
}
