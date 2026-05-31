import type { MemoryMessage, MidTermMemory, LongTermMemory, CompactResult } from './types'

/**
 * 记忆管理器
 * 管理三层记忆：短期（消息历史）、中期（摘要）、长期（偏好/规范）
 * 参考 Claude Code 的 Session Memory + Compact 机制
 *
 * 工作流程：
 * 1. 短期记忆：每轮对话追加消息，直接存储在内存
 * 2. 中期记忆：消息过多时触发压缩，将早期消息替换为摘要
 * 3. 长期记忆：用户偏好和项目规范持久化到 localStorage
 */
export class MemoryManager {
  /** 短期记忆：完整消息历史 */
  private messages: MemoryMessage[] = []

  /** 中期记忆：会话摘要 */
  private summary: string = ''

  /** 关键操作记录 */
  private keyOperations: string[] = []

  /** 长期记忆存储 key */
  private static STORAGE_KEY = 'report_agent_long_term_memory'

  /**
   * 追加消息到短期记忆
   * @param message - 记忆消息
   */
  addMessage(message: MemoryMessage): void {
    this.messages.push(message)
  }

  /**
   * 批量追加消息到短期记忆
   * @param messages - 记忆消息数组
   */
  addMessages(messages: MemoryMessage[]): void {
    this.messages.push(...messages)
  }

  /**
   * 记录关键操作（用于中期记忆）
   * @param operation - 操作描述，如 "设置 A1 单元格值为 '销售报表'"
   */
  recordOperation(operation: string): void {
    this.keyOperations.push(operation)
  }

  /**
   * 获取用于发送给 LLM 的上下文消息
   * 策略：摘要 + 最近 N 条消息
   * 参考 Claude Code 的 compact 策略：旧消息压缩为摘要，保留近期消息
   *
   * @param maxMessages - 最大保留消息条数，默认 20
   * @returns 过滤后的上下文消息列表
   */
  getContextMessages(maxMessages: number = 20): MemoryMessage[] {
    const result: MemoryMessage[] = []

    if (this.summary) {
      result.push({
        role: 'system',
        content: `[之前的对话摘要]\n${this.summary}\n[关键操作记录]\n${this.keyOperations.join('\n')}`
      })
    }

    const recentMessages = this.messages.slice(-maxMessages)
    result.push(...recentMessages)

    return result
  }

  /**
   * 压缩对话历史
   * 当消息过多时，将早期消息压缩为摘要
   * 参考 Claude Code 的 compactConversation()
   * 实际压缩由后台 LLM 完成，前端只负责触发和存储
   *
   * @param compactResult - LLM 生成的压缩结果
   */
  compact(compactResult: CompactResult): void {
    this.summary = compactResult.summary
    this.keyOperations = compactResult.keyOperations
    // 保留最近 10 条消息，早期消息已被摘要替代
    this.messages = this.messages.slice(-10)
  }

  /**
   * 判断是否需要压缩
   * 简单策略：消息条数超过阈值
   *
   * @param threshold - 消息条数阈值，默认 40
   * @returns 是否需要压缩
   */
  needsCompact(threshold: number = 40): boolean {
    return this.messages.length > threshold
  }

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

  /**
   * 清空短期和中期记忆
   * 长期记忆不受影响
   */
  clear(): void {
    this.messages = []
    this.summary = ''
    this.keyOperations = []
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
