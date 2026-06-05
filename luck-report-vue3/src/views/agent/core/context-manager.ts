import { MemoryManager } from '../memory/memory-manager'
import { ToolRegistry } from '../tools/registry'
import { executeCode } from '@/views/export/iframe-utils'
import { loadPromptDocs, PromptDocName } from '@/prompt'
import { contextConfig } from '@/config'

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
  /** 缓存有效期，从集中配置读取 */
  private static CACHE_TTL = contextConfig.reportStateCacheTTL

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

    // 1. 默认系统提示词：角色定义 + 报表说明
    const defaultPrompt = await this.getDefaultPrompt()
    parts.push(defaultPrompt)

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
   * 加载系统角色定义和报表说明文档，用分界线拼接
   */
  private async getDefaultPrompt(): Promise<string> {
    return loadPromptDocs([PromptDocName.SYSTEM])
    // return loadPromptDocs([PromptDocName.SYSTEM, PromptDocName.REPORT_DEFINITION])
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
