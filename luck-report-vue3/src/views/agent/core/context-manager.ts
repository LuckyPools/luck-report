import { MemoryManager } from '../memory/memory-manager'
import { ToolRegistry } from '../tools/registry'
import { executeCode } from '@/views/export/iframe-utils'

/**
 * 上下文管理器
 * 参考 Claude Code 的上下文注入机制（getSystemPrompt + getUserContext + getSystemContext）
 * 在每次 LLM 调用前，自动注入报表状态、工具说明、记忆等上下文
 *
 * 上下文组装流程：
 * 1. 默认系统提示词（角色定义 + 工具使用说明）
 * 2. 报表当前状态（行列数、合并区域、数据源等）
 * 3. 长期记忆（用户偏好、项目规范）
 */
export class ContextManager {
  private memoryManager: MemoryManager
  private toolRegistry: ToolRegistry
  /** 缓存的报表状态，避免每次请求都重新获取 */
  private cachedReportState: string = ''
  /** 缓存过期时间戳 */
  private cacheExpiry: number = 0
  /** 缓存有效期，默认 5 秒 */
  private static CACHE_TTL = 5000

  constructor(memoryManager: MemoryManager, toolRegistry: ToolRegistry) {
    this.memoryManager = memoryManager
    this.toolRegistry = toolRegistry
  }

  /**
   * 构建系统提示词
   * 由三部分组成：默认提示词 + 报表状态 + 长期记忆
   * 参考 Claude Code 的 getSystemPrompt() + getUserContext() + getSystemContext()
   *
   * @returns 完整的系统提示词
   */
  async buildSystemPrompt(): Promise<string> {
    const parts: string[] = []

    // 1. 默认系统提示词：角色定义 + 工具使用说明
    parts.push(this.getDefaultPrompt())

    // 2. 报表当前状态注入（类似 Claude Code 的 Git 状态注入）
    const reportState = await this.getReportState()
    if (reportState) {
      parts.push(`[当前报表状态]\n${reportState}`)
    }

    // 3. 长期记忆注入（类似 Claude Code 的 CLAUDE.md）
    const longTermMemory = this.memoryManager.loadLongTermMemory()
    if (longTermMemory) {
      parts.push(longTermMemory)
    }

    return parts.join('\n\n')
  }

  /**
   * 使报表状态缓存失效
   * 在工具执行修改报表后调用，确保下次获取最新状态
   */
  invalidateCache(): void {
    this.cacheExpiry = 0
    this.cachedReportState = ''
  }

  /**
   * 默认系统提示词
   * 定义 Agent 角色和能力边界
   */
  private getDefaultPrompt(): string {
    const toolDescriptions = this.toolRegistry.getAll()
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n')

    return `你是一个报表设计助手，帮助用户通过对话操作报表设计器。

你可以使用以下工具来操作报表：
${toolDescriptions}

重要规则：
1. 当用户要求修改报表时，你必须直接调用对应的工具函数来执行操作，绝对不要用文字描述操作步骤或告诉用户"请调用某某工具"
2. 修改报表前，先调用 get_report_schema 了解当前报表结构
3. 修改单元格前，先调用 read_cell 确认当前值
4. 一次只做一个操作，等确认结果后再继续
5. 涉及插入行/列等不可逆操作时，先向用户确认
6. 操作完成后，向用户简要说明做了什么
7. 如果用户的需求不明确，主动询问细节
8. 禁止在回复中输出类似"请调用 xxx 工具"的文字，你应该直接调用工具`
  }

  /**
   * 获取报表当前状态
   * 通过 PostMessage 从设计器获取，带缓存机制
   * 参考 Claude Code 的 getSystemContext() 注入 Git 状态
   *
   * @returns 报表状态描述
   */
  private async getReportState(): Promise<string> {
    const now = Date.now()
    if (this.cachedReportState && now < this.cacheExpiry) {
      return this.cachedReportState
    }

    try {
      const schema = await executeCode('getReportSchema()', '*', 3000)
      this.cachedReportState = typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2)
      this.cacheExpiry = now + ContextManager.CACHE_TTL
      return this.cachedReportState
    } catch {
      return '无法获取报表状态（可能设计器未就绪）'
    }
  }
}
