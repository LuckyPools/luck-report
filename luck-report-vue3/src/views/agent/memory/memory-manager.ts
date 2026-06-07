import type {
  MemoryMessage,
  MidTermMemory,
  LongTermMemory,
  CompactResult,
  ReportSnapshot,
  SessionPersistence,
  ContextWindowConfig
} from './types'
import { contextConfig } from '@/config'

/**
 * 记忆管理器
 * 五层记忆架构，逐层压缩上下文，防止超出大模型上下文窗口：
 *
 * 第1层：工具结果截断 — 立竿见影，减少 50%+ token
 *   addMessage() 时自动截断 tool_result 中过长的内容
 *
 * 第2层：滑动窗口改进 — 防止 tool_calls 链被拆散
 *   getContextMessages() 按完整 Agent 轮次裁剪，不切断 assistant+tool_result 链
 *
 * 第3层：自动摘要压缩 — 根本性解决长对话问题
 *   消息过多时用 LLM 生成摘要替代早期消息
 *
 * 第4层：状态快照 — 压缩后保持报表上下文
 *   压缩时捕获报表状态快照，注入到上下文中
 *
 * 第5层：会话记忆持久化 — 跨会话记忆
 *   会话数据持久化到 localStorage，页面刷新后可恢复
 *
 * 调用者：AgentEngine → runAgentLoop → memoryManager.addMessage() / getContextMessages()
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
    slidingWindowSize: contextConfig.slidingWindowSize,
    compactThreshold: contextConfig.compactThreshold,
    compactKeepRecent: contextConfig.compactKeepRecent,
    autoCompactTokenRatio: contextConfig.autoCompactTokenRatio
  }

  constructor(config?: Partial<ContextWindowConfig>) {
    this.config = { ...MemoryManager.DEFAULT_CONFIG, ...config }
  }

  /**
   * 设置上下文窗口 token 上限
   * 由 AgentEngine 在切换模型时调用，根据当前选中模型的 maxTokens 动态更新
   *
   * @param tokens - 模型的上下文窗口 token 上限
   */
  setContextWindowTokens(tokens: number): void {
    this._contextWindowTokens = tokens
  }

  /**
   * 获取当前上下文窗口 token 上限
   * @returns token 上限值
   */
  getContextWindowTokens(): number {
    return this._contextWindowTokens
  }

  // ==================== 第1层：工具结果截断 ====================

  /**
   * 追加消息到短期记忆
   * 第1层：对 tool_result 类型的消息自动截断过长内容
   * 工具返回的报表数据（如 getReportSchema）通常包含大量 JSON，
   * 截断后可减少 50%+ 的 token 消耗
   *
   * @param message - 记忆消息
   */
  addMessage(message: MemoryMessage): void {
    // 第1层截断已注释：当前截取策略影响工具结果读取体验，待后续优化截断策略后再启用
    // if (message.role === 'tool_result') {
    //   message = this.truncateToolResult(message)
    // }
    this.messages.push(message)
  }

  /**
   * 批量追加消息到短期记忆
   * @param messages - 记忆消息数组
   */
  addMessages(messages: MemoryMessage[]): void {
    // 第1层截断已注释，与 addMessage 保持一致
    this.messages.push(...messages)
  }

  /**
   * 截断过长的工具返回结果
   * 保留 JSON 结构的首尾部分，中间用省略标记替代
   * 同时标记 truncated=true，提示 LLM 该结果不完整
   *
   * @param message - 工具结果消息
   * @returns 截断后的消息
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

  // ==================== 第2层：滑动窗口改进 ====================

  /**
   * 获取用于发送给 LLM 的上下文消息
   * 第2层：按完整 Agent 轮次裁剪，防止 tool_calls 链被拆散
   *
   * Agent 一次循环产生的消息链：assistant(toolCalls) + tool_result* + assistant
   * 如果滑动窗口从中间切断，会导致：
   * - assistant 有 toolCalls 但缺少对应的 tool_result → 大模型报错
   * - tool_result 孤立，没有对应的 assistant toolCalls → 大模型困惑
   *
   * 策略：从窗口起点向前回溯，确保不切断 tool_calls 链
   *
   * @param maxMessages - 最大保留消息条数，默认取配置的 slidingWindowSize
   * @returns 过滤后的上下文消息列表
   */
  getContextMessages(maxMessages?: number): MemoryMessage[] {
    const windowSize = maxMessages ?? this.config.slidingWindowSize
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

    // 滑动窗口裁剪，按完整轮次
    const recentMessages = this.slidingWindowSlice(this.messages, windowSize)
    result.push(...recentMessages)

    return result
  }

  /**
   * 滑动窗口切片，保证不切断 tool_calls 链
   * 从目标起点向前回溯，找到第一个不属于未完成 tool_calls 链的位置
   *
   * @param messages - 完整消息列表
   * @param windowSize - 窗口大小
   * @returns 切片后的消息数组
   */
  private slidingWindowSlice(messages: MemoryMessage[], windowSize: number): MemoryMessage[] {
    if (messages.length <= windowSize) {
      return [...messages]
    }

    let startIndex = messages.length - windowSize

    // 向前回溯，确保不在 tool_calls 链中间切断
    startIndex = this.findSafeCutPoint(messages, startIndex)

    return messages.slice(startIndex)
  }

  /**
   * 找到安全的切割点
   * 从候选起点向前检查，如果该位置处于 tool_calls 链中间，则继续向前
   *
   * tool_calls 链结构：
   *   assistant(toolCalls: [...]) → tool_result → tool_result → ... → assistant(无toolCalls)
   * 切割点必须在链外，即 assistant 消息没有 toolCalls 或已有对应 tool_result
   *
   * @param messages - 消息列表
   * @param candidateIndex - 候选切割起点
   * @returns 安全的切割起点
   */
  private findSafeCutPoint(messages: MemoryMessage[], candidateIndex: number): number {
    let index = candidateIndex

    // 最多向前回溯，防止无限循环
    const maxLookback = contextConfig.maxSlidingWindowLookback
    let lookback = 0

    while (index > 0 && lookback < maxLookback) {
      const msg = messages[index]

      // 情况1：起点是 tool_result，说明它属于前面 assistant 的 tool_calls 链
      // 需要向前找到对应的 assistant 消息
      if (msg.role === 'tool_result') {
        index = this.findAssistantBeforeToolResult(messages, index)
        lookback++
        continue
      }

      // 情况2：起点是 assistant 且有 toolCalls，需要检查后续是否有完整的 tool_result
      if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
        // 检查这个 assistant 的所有 toolCall 是否都有对应的 tool_result
        const hasAllResults = this.hasCompleteToolResults(messages, index)
        if (!hasAllResults) {
          // tool_result 在窗口外，需要把起点前移到 assistant 之前
          index = Math.max(0, index - 1)
          lookback++
          continue
        }
      }

      // 安全切割点：不在 tool_calls 链中间
      break
    }

    return index
  }

  /**
   * 找到 tool_result 之前对应的 assistant 消息位置
   * 从指定位置向前搜索，找到包含 toolCalls 的 assistant 消息
   *
   * @param messages - 消息列表
   * @param toolResultIndex - tool_result 消息的索引
   * @returns 对应 assistant 消息的索引，找不到返回 0
   */
  private findAssistantBeforeToolResult(messages: MemoryMessage[], toolResultIndex: number): number {
    for (let i = toolResultIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].toolCalls && messages[i].toolCalls.length > 0) {
        return i
      }
    }
    return 0
  }

  /**
   * 检查指定 assistant 消息的 tool_calls 是否都有对应的 tool_result
   *
   * @param messages - 消息列表
   * @param assistantIndex - assistant 消息索引
   * @returns 是否所有 toolCall 都有对应的 tool_result
   */
  private hasCompleteToolResults(messages: MemoryMessage[], assistantIndex: number): boolean {
    const assistant = messages[assistantIndex]
    if (!assistant.toolCalls) return true

    const toolCallIds = new Set(assistant.toolCalls.map(tc => tc.id))
    const resultIds = new Set<string>()

    for (let i = assistantIndex + 1; i < messages.length; i++) {
      const msg = messages[i]
      // 遇到下一个 assistant 消息，说明当前链已结束
      if (msg.role === 'assistant') break
      if (msg.role === 'tool_result' && msg.toolCallId) {
        resultIds.add(msg.toolCallId)
      }
    }

    return toolCallIds.size === resultIds.size
  }

  // ==================== 第3层：自动摘要压缩 ====================

  /**
   * 记录关键操作（用于中期记忆）
   * @param operation - 操作描述，如 "设置 A1 单元格值为 '销售报表'"
   */
  recordOperation(operation: string): void {
    this.keyOperations.push(operation)
  }

  /**
   * 压缩对话历史
   * 第3层：当消息过多时，将早期消息压缩为摘要
   * 实际压缩由后台 LLM 完成，前端只负责触发和存储
   *
   * @param compactResult - LLM 生成的压缩结果
   */
  compact(compactResult: CompactResult): void {
    this.summary = compactResult.summary
    this.keyOperations = compactResult.keyOperations
    // 保留最近消息，早期消息已被摘要替代
    // 使用安全切割逻辑，防止截断 tool_calls 链（assistant+tool_result 必须成对出现）
    let kept = this.slidingWindowSlice(this.messages, this.config.compactKeepRecent)
    // 确保保留的消息以 user 角色开头
    // OpenAI 协议要求 system 后必须跟 user，压缩后截断可能以 assistant/tool_result 开头导致 1214 错误
    const firstUserIndex = kept.findIndex(m => m.role === 'user')
    if (firstUserIndex > 0) {
      kept = kept.slice(firstUserIndex)
    }
    this.messages = kept
  }

  /**
   * 判断是否需要压缩
   * 双重判断：消息条数阈值 + 估算 token 占比
   *
   * @returns 是否需要压缩
   */
  needsCompact(): boolean {
    if (this.messages.length > this.config.compactThreshold) {
      return true
    }
    // 估算当前上下文 token 占比
    const estimatedTokens = this.estimateContextTokens()
    const threshold = this._contextWindowTokens * this.config.autoCompactTokenRatio
    return estimatedTokens > threshold
  }

  /**
   * 估算当前上下文的 token 数
   * 粗略估算：中文约 1.5 字符/token，英文约 4 字符/token，混合取 2 字符/token
   *
   * @returns 估算的 token 数
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

  // ==================== 第4层：状态快照 ====================

  /**
   * 更新报表状态快照
   * 压缩前调用，保存当前报表的关键状态信息
   * 压缩后早期消息被摘要替代，但报表结构信息通过快照保留
   *
   * @param snapshot - 报表状态快照
   */
  updateReportSnapshot(snapshot: ReportSnapshot): void {
    this.reportSnapshot = snapshot
  }

  /**
   * 构建快照上下文文本
   * 将报表状态快照格式化为可注入 system prompt 的文本
   * public 访问级别：供 AgentEngine 在压缩时获取快照文本传给后端
   *
   * @returns 格式化的快照描述
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
   * 构建摘要上下文文本
   * 将中期摘要和关键操作格式化为可注入 system prompt 的文本
   * public 访问级别：供外部模块获取摘要文本
   *
   * @returns 格式化的摘要描述
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

  // ==================== 第5层：会话记忆持久化 ====================

  /**
   * 保存会话数据到 localStorage
   * 页面刷新后可通过 restoreSession() 恢复
   * 只在 Agent 循环结束时调用，避免频繁写入
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
   * 从 localStorage 恢复会话数据
   * 页面刷新后调用，恢复之前的对话上下文
   *
   * @param sessionId - 会话ID
   * @returns 是否成功恢复
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
   * @param sessionId - 会话ID
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
   * @param sessionId - 会话ID
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId
  }

  // ==================== 长期记忆 ====================

  /**
   * 加载长期记忆
   * 从 localStorage 读取用户偏好和项目规范
   *
   * @returns 长期记忆内容字符串，用于注入 system prompt
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
   * 保存长期记忆
   * 将用户偏好和项目规范持久化到 localStorage
   *
   * @param data - 长期记忆数据
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
