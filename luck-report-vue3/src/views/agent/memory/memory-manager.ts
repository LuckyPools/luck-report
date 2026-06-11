import type {
  MemoryMessage,
  MidTermMemory,
  LongTermMemory,
  CompactResult,
  ReportSnapshot,
  SessionPersistence,
  ContextWindowConfig
} from './types'
import { KnowledgeCache } from './knowledge-cache'
import { contextConfig } from '@/config'

/**
 * 记忆管理器，四层记忆架构，逐层压缩上下文防止超出大模型上下文窗口
 */
export class MemoryManager {
  /** 短期记忆：完整消息历史 */
  private messages: MemoryMessage[] = []

  /** 中期记忆：会话摘要 */
  private summary: string = ''

  /** 关键操作记录 */
  private keyOperations: string[] = []

  /** 第4层：报表状态快照 */
  private reportSnapshot: ReportSnapshot | null = null

  /**
   * 第5层（增强）：会话级知识文档缓存
   */
  private knowledgeCache: KnowledgeCache = new KnowledgeCache()

  /**
   * 暴露知识文档缓存，供 load_docs 节点和 LLMDecideNode 使用
   */
  getKnowledgeCache(): KnowledgeCache {
    return this.knowledgeCache
  }

  /** 第5层：会话ID，用于持久化 key */
  private sessionId: string = ''

  /** 上下文窗口配置 */
  private config: ContextWindowConfig

  /** 上下文窗口 token 上限，从当前选中模型的 maxTokens 动态获取 */
  private _contextWindowTokens: number = 128000

  /** 长期记忆存储 key 前缀 */
  private static STORAGE_KEY = 'report_agent_long_term_memory'

  /** 会话持久化存储 key 前缀 */
  private static SESSION_STORAGE_PREFIX = 'report_agent_session_'

  /** 默认上下文窗口配置，从集中配置文件读取 */
  private static DEFAULT_CONFIG: ContextWindowConfig = {
    toolResultMaxChars: contextConfig.toolResultMaxChars,
    compactThreshold: contextConfig.compactThreshold,
    compactKeepRecent: contextConfig.compactKeepRecent,
    autoCompactTokenRatio: contextConfig.autoCompactTokenRatio
  }

  constructor(config?: Partial<ContextWindowConfig>) {
    this.config = { ...MemoryManager.DEFAULT_CONFIG, ...config }
  }

  /**
   * 设置上下文窗口 token 上限，由 AgentEngine 在切换模型时调用
   */
  setContextWindowTokens(tokens: number): void {
    this._contextWindowTokens = tokens
  }

  /**
   * 获取当前上下文窗口 token 上限
   */
  getContextWindowTokens(): number {
    return this._contextWindowTokens
  }

  // ==================== 第1层：工具结果截断 ====================

  /**
   * 创建记忆快照，用于节点重试前保存当前记忆状态
   */
  snapshot(): number {
    return this.messages.length
  }

  /**
   * 回滚记忆到指定快照位置，用于节点重试时清除上次失败产生的消息
   */
  clearAfter(snapshot: number): void {
    if (snapshot >= 0 && snapshot < this.messages.length) {
      this.messages = this.messages.slice(0, snapshot)
    }
  }

  /**
   * 追加消息到短期记忆，对 tool_result 类型的消息自动截断过长内容
   */
  addMessage(message: MemoryMessage): void {
    this.messages.push(message)
  }

  /**
   * 获取 messages 里所有 load_report_introduce 已加载的文档名集合
   */
  getLoadedDocNames(): Set<string> {
    const result = new Set<string>()
    for (const msg of this.messages) {
      // 兼容两种角色命名：tool_result（自定义）和 tool（OpenAI 协议）
      if ((msg.role === 'tool_result' || msg.role === 'tool') && msg.docRefs) {
        for (const doc of msg.docRefs) result.add(doc)
      }
    }
    return result
  }

  /**
   * 批量追加消息到短期记忆
   */
  addMessages(messages: MemoryMessage[]): void {
    this.messages.push(...messages)
  }

  /**
   * 截断过长的工具返回结果，保留 JSON 结构的首尾部分
   */
  private truncateToolResult(message: MemoryMessage): MemoryMessage {
    const maxChars = this.config.toolResultMaxChars
    if (!message.content || message.content.length <= maxChars) {
      return message
    }

    const headLen = Math.floor(maxChars * 0.6)
    const tailLen = Math.floor(maxChars * 0.3)
    const head = message.content.substring(0, headLen)
    const tail = message.content.substring(message.content.length - tailLen)
    const truncatedContent = `${head}\n\n...[结果已截断，原始长度${message.content.length}字符]...\n\n${tail}`

    return {
      ...message,
      content: truncatedContent,
      truncated: true
    }
  }

  // ==================== 第2层：自动摘要压缩 ====================

  /**
   * 获取用于发送给 LLM 的上下文消息，直接返回全部消息 + 摘要注入
   */
  getContextMessages(_maxMessages?: number): MemoryMessage[] {
    const result: MemoryMessage[] = []

    // 将摘要和快照注入为 user 角色
    // GLM API 要求 system 后必须跟 user，压缩后保留的消息可能全是 assistant+tool 对
    // 用 user 角色注入摘要，既提供上下文又满足协议要求
    const contextParts: string[] = []
    if (this.summary) {
      contextParts.push(this.buildSummaryContext())
    }
    if (this.reportSnapshot) {
      contextParts.push(this.buildSnapshotContext())
    }
    if (contextParts.length > 0) {
      result.push({
        role: 'user',
        content: contextParts.join('\n\n')
      })
    }

    // 返回全部消息，不做裁剪
    result.push(...this.messages)

    return result
  }

  /**
   * 记录关键操作（用于中期记忆）
   */
  recordOperation(operation: string): void {
    this.keyOperations.push(operation)
  }

  /**
   * 压缩对话历史，将早期消息压缩为摘要
   */
  compact(compactResult: CompactResult): void {
    this.summary = compactResult.summary
    this.keyOperations = compactResult.keyOperations

    const knowledgeInventory = this.knowledgeCache.exportInventory()
    if (knowledgeInventory) {
      this.summary = this.summary
        ? `${this.summary}\n\n${knowledgeInventory}`
        : knowledgeInventory
    }

    let kept = this.messages.slice(-this.config.compactKeepRecent)
    const firstUserIndex = kept.findIndex(m => m.role === 'user')
    if (firstUserIndex > 0) {
      kept = kept.slice(firstUserIndex)
    }
    this.messages = kept
  }

  /**
   * 判断是否需要压缩，双重判断：消息条数阈值 + 估算 token 占比
   */
  needsCompact(): boolean {
    if (this.messages.length > this.config.compactThreshold) {
      return true
    }
    const estimatedTokens = this.estimateContextTokens()
    const threshold = this._contextWindowTokens * this.config.autoCompactTokenRatio
    return estimatedTokens > threshold
  }

  /**
   * 估算当前上下文的 token 数，粗略估算：中文约 1.5 字符/token，英文约 4 字符/token
   */
  private estimateContextTokens(): number {
    let totalChars = 0
    for (const msg of this.messages) {
      totalChars += msg.content?.length ?? 0
      if (msg.toolCalls) {
        for (const tc of msg.toolCalls) {
          totalChars += tc.function.arguments?.length ?? 0
        }
      }
    }
    if (this.summary) {
      totalChars += this.summary.length
    }
    return Math.ceil(totalChars / 2.0 * 1.2)
  }

  // ==================== 第3层：状态快照 ====================

  /**
   * 更新报表状态快照，压缩前调用保存当前报表的关键状态信息
   */
  updateReportSnapshot(snapshot: ReportSnapshot): void {
    this.reportSnapshot = snapshot
  }

  /**
   * 构建快照上下文文本，将报表状态快照格式化为可注入 system prompt 的文本
   */
  buildSnapshotContext(): string {
    if (!this.reportSnapshot) return ''

    const s = this.reportSnapshot
    const parts: string[] = ['[报表当前状态快照]']
    parts.push(`维度: ${s.dimensions.rows}行 × ${s.dimensions.cols}列`)

    if (s.mergedRegions.length > 0) {
      parts.push(`合并区域: ${s.mergedRegions.map(r =>
        `(${r.startRow},${r.startCol})-(${r.endRow},${r.endCol})`
      ).join(', ')}`)
    }

    const cellEntries = Object.entries(s.cellValues)
    if (cellEntries.length > 0) {
      parts.push(`关键单元格: ${cellEntries.map(([k, v]) => `${k}="${v.length > 20 ? v.substring(0, 20) + '...' : v}"`).join(', ')}`)
    }

    if (s.dataBindings.length > 0) {
      parts.push(`数据源: ${s.dataBindings.join(', ')}`)
    }

    return parts.join('\n')
  }

  /**
   * 构建摘要上下文文本，将中期摘要和关键操作格式化为可注入 system prompt 的文本
   */
  buildSummaryContext(): string {
    const parts: string[] = ['[之前的对话摘要]']
    if (this.summary) {
      parts.push(this.summary)
    }
    if (this.keyOperations.length > 0) {
      parts.push('[关键操作记录]')
      parts.push(this.keyOperations.join('\n'))
    }
    return parts.join('\n')
  }

  // ==================== 第4层：会话记忆持久化 ====================

  /**
   * 保存会话数据到 localStorage，页面刷新后可通过 restoreSession() 恢复
   */
  persistSession(): void {
    if (!this.sessionId) return

    try {
      const data: SessionPersistence = {
        sessionId: this.sessionId,
        messages: this.messages,
        summary: this.summary,
        keyOperations: this.keyOperations,
        reportSnapshot: this.reportSnapshot,
        savedAt: Date.now()
      }
      const key = MemoryManager.SESSION_STORAGE_PREFIX + this.sessionId
      localStorage.setItem(key, JSON.stringify(data))
    } catch {
      // localStorage 写入失败时静默处理
    }
  }

  /**
   * 从 localStorage 恢复会话数据，页面刷新后调用恢复之前的对话上下文
   */
  restoreSession(sessionId: string): boolean {
    try {
      const key = MemoryManager.SESSION_STORAGE_PREFIX + sessionId
      const stored = localStorage.getItem(key)
      if (!stored) return false

      const data: SessionPersistence = JSON.parse(stored)
      // 检查数据有效性：sessionId 匹配且未过期
      if (data.sessionId !== sessionId) return false
      if (Date.now() - data.savedAt > contextConfig.sessionPersistenceTTL) {
        this.removeSession(sessionId)
        return false
      }

      this.messages = data.messages || []
      this.summary = data.summary || ''
      this.keyOperations = data.keyOperations || []
      this.reportSnapshot = data.reportSnapshot || null
      this.sessionId = sessionId
      return true
    } catch {
      return false
    }
  }

  /**
   * 删除会话持久化数据
   */
  removeSession(sessionId: string): void {
    try {
      const key = MemoryManager.SESSION_STORAGE_PREFIX + sessionId
      localStorage.removeItem(key)
    } catch {
      // 静默处理
    }
  }

  /**
   * 设置会话ID
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId
  }

  // ==================== 长期记忆 ====================

  /**
   * 加载长期记忆，从 localStorage 读取用户偏好和项目规范
   */
  loadLongTermMemory(): string {
    try {
      const stored = localStorage.getItem(MemoryManager.STORAGE_KEY)
      if (!stored) return ''

      const memory: LongTermMemory = JSON.parse(stored)
      const parts: string[] = []

      if (memory.projectRules?.length) {
        parts.push('[项目规范]\n' + memory.projectRules.join('\n'))
      }
      if (Object.keys(memory.userPreferences || {}).length) {
        parts.push('[用户偏好]\n' + JSON.stringify(memory.userPreferences, null, 2))
      }
      if (Object.keys(memory.operationTemplates || {}).length) {
        parts.push('[常用操作模板]\n' + Object.entries(memory.operationTemplates)
          .map(([name, tpl]) => `- ${name}: ${tpl}`)
          .join('\n'))
      }

      return parts.join('\n\n')
    } catch {
      return ''
    }
  }

  /**
   * 保存长期记忆，将用户偏好和项目规范持久化到 localStorage
   */
  saveLongTermMemory(data: LongTermMemory): void {
    try {
      localStorage.setItem(MemoryManager.STORAGE_KEY, JSON.stringify(data))
    } catch {
      // localStorage 写入失败时静默处理
    }
  }

  /**
   * 更新长期记忆中的项目规范
   * @param rules - 规范条目数组
   */
  updateProjectRules(rules: string[]): void {
    const memory = this.loadLongTermMemoryData()
    memory.projectRules = rules
    this.saveLongTermMemory(memory)
  }

  /**
   * 更新长期记忆中的用户偏好
   * @param preferences - 偏好键值对
   */
  updateUserPreferences(preferences: Record<string, any>): void {
    const memory = this.loadLongTermMemoryData()
    memory.userPreferences = { ...memory.userPreferences, ...preferences }
    this.saveLongTermMemory(memory)
  }

  // ==================== 通用方法 ====================

  /**
   * 获取当前消息总数
   * @returns 消息条数
   */
  getMessageCount(): number {
    return this.messages.length
  }

  /**
   * 获取当前摘要内容
   * @returns 摘要文本
   */
  getSummary(): string {
    return this.summary
  }

  /**
   * 获取关键操作记录
   * @returns 操作记录数组
   */
  getKeyOperations(): string[] {
    return [...this.keyOperations]
  }

  /**
   * 获取报表状态快照
   * @returns 快照数据或 null
   */
  getReportSnapshot(): ReportSnapshot | null {
    return this.reportSnapshot
  }

  /**
   * 清空短期和中期记忆
   * 长期记忆不受影响
   */
  clear(): void {
    this.messages = []
    this.summary = ''
    this.keyOperations = []
    this.reportSnapshot = null
  }

  /**
   * 加载长期记忆原始数据
   * @returns 长期记忆对象
   */
  private loadLongTermMemoryData(): LongTermMemory {
    try {
      const stored = localStorage.getItem(MemoryManager.STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      // 解析失败时返回默认值
    }
    return {
      userPreferences: {},
      projectRules: [],
      operationTemplates: {}
    }
  }
}
