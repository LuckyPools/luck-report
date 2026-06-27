import { createDefaultRegistry } from '../tools/registry'
import { registerPlannerTool } from '../workflow/task-plan'
import { MemoryManager } from '../memory/memory-manager'
import { ContextManager } from '../core/context-manager'
import { runAgentLoop, type AgentEvent, type AgentLoopConfig } from '../core/agent-loop'
import type { ToolCall } from '../tools/types'
import type { ReportSnapshot, CompactResult } from '../memory/types'
import type { ContextMessage } from '@/api/chat'
import { compactConversation } from '@/api/chat/compact'
import { contextConfig } from '@/config'
import { getReportSchema } from '@/utils/tools'
import { useTaskList } from './useTaskList'

/**
 * Agent 引擎配置，创建 AgentEngine 实例时的配置项
 */
export interface AgentEngineConfig {
  /** 工具确认回调，返回 true 表示用户确认执行，False 表示拒绝 */
  onToolConfirm?: (toolCall: ToolCall) => Promise<boolean>
  /** 会话ID，与数据库 chat_session.id 一致，传递到后端用于关联会话 */
  sessionId?: string
  /** 工作流模式下每个步骤内 LLM 的最大循环轮次，默认 5 */
  maxIterationsPerStep?: number
  /** 是否启用深度思考，启用后模型会先生成推理过程再生成回复 */
  deepThink?: boolean
}

/**
 * Agent 引擎
 * 纯逻辑层，不包含任何 UI 状态（ref、reactive）
 * 供 useChat 等上层调用方使用，通过事件回调通知上层状态变化
 *
 * 工作流程：
 * 1. 上层调用 start() 启动 Agent 循环
 * 2. Agent 循环内部：调 LLM → 解析 tool_use → 执行工具 → 结果喂回 LLM → 重复
 * 3. 每个关键步骤通过 onEvent 回调通知上层
 * 4. 工具确认时通过 onToolConfirm 回调暂停等待
 * 5. 循环结束后通过 onEvent(done) 通知上层
 * 6. 自动压缩：当消息过多时触发 LLM 生成摘要替代早期消息
 * 7. 持久化：循环结束后自动保存会话数据到 localStorage
 *
 * 调用方：useChat.sendMessage() 中判断是否启用 Agent 模式，
 * 如果启用则调用 agentEngine.start() 替代直接调 chatStream
 */
export class AgentEngine {
  /** 工具注册表 */
  readonly toolRegistry = (() => {
    // 关键决策点：构造时同步注册虚拟工具 plan_tasks
    // 让 planner 节点的 LLM 能收到完整 inputSchema，强制走 function calling
    const r = createDefaultRegistry()
    registerPlannerTool(r)
    return r
  })()
  /** 记忆管理器 */
  readonly memoryManager = new MemoryManager()
  /** 上下文管理器 */
  readonly contextManager: ContextManager
  /** 任务列表管理器 */
  private taskListManager = useTaskList()

  /** 工具确认回调 */
  private onToolConfirmFn?: (toolCall: ToolCall) => Promise<boolean>
  /** 会话ID */
  private sessionId?: string
  /** 大模型配置ID，用于指定使用哪个大模型 */
  private modelId?: number
  /** 当前模型的上下文窗口 token 上限 */
  private _maxTokens: number = 128000
  /** 中断控制器 */
  private abortController: AbortController | null = null
  /** 是否正在运行 */
  private _running = false
  /** 是否正在执行异步压缩，防止并发重复触发 */
  private _compacting = false
  /** 工作流模式下每个步骤内 LLM 的最大循环轮次 */
  private maxIterationsPerStep: number
  /** 是否启用深度思考 */
  private deepThink?: boolean

  constructor(config: AgentEngineConfig = {}) {
    this.onToolConfirmFn = config.onToolConfirm
    this.sessionId = config.sessionId
    this.maxIterationsPerStep = config.maxIterationsPerStep ?? 5
    this.deepThink = config.deepThink
    this.contextManager = new ContextManager(this.memoryManager, this.toolRegistry)
  }

  /**
   * 是否正在运行
   */
  get running(): boolean {
    return this._running
  }

  /**
   * 启动 Agent 循环
   * 供 useChat 调用，替代直接调 chatStream
   *
   * @param userMessage - 用户输入消息
   * @param onEvent - 事件回调，通知上层 Agent 循环的各种状态变化
   * @param signal - 可选的中断信号
   * @param modelId - 可选，大模型配置ID，用于指定使用哪个大模型
   * @param maxTokens - 可选，当前模型的上下文窗口 token 上限，用于判断是否超量
   */
  async start(
    userMessage: string,
    onEvent: (event: AgentEvent) => void,
    signal?: AbortSignal,
    modelId?: number,
    maxTokens?: number,
    deepThink?: boolean
  ): Promise<void> {
    if (this._running) return

    // 存储模型ID，供压缩时使用
    this.modelId = modelId

    // 更新上下文窗口 token 上限，用于判断是否需要压缩
    if (maxTokens) {
      this._maxTokens = maxTokens
      this.memoryManager.setContextWindowTokens(maxTokens)
    }

    // 优先使用参数中的 deepThink，否则使用构造时的 deepThink
    const effectiveDeepThink = deepThink !== undefined ? deepThink : this.deepThink

    // 清空上一轮的任务列表，避免新消息显示旧任务进度
    this.taskListManager.clearTasks()

    this._running = true
    this.abortController = signal ? null : new AbortController()
    const effectiveSignal = signal || this.abortController!.signal

    const config: AgentLoopConfig = {
      toolRegistry: this.toolRegistry,
      memoryManager: this.memoryManager,
      contextManager: this.contextManager,
      signal: effectiveSignal,
      onToolConfirm: this.onToolConfirmFn,
      sessionId: this.sessionId,
      onCaptureSnapshot: () => this.captureReportSnapshot(),
      onAutoCompact: (mm) => this.autoCompact(mm),
      modelId,
      maxIterationsPerStep: this.maxIterationsPerStep,
      deepThink: effectiveDeepThink,
      // 通过回调同步步骤记录到任务列表
      onStepRecordsChange: (stepRecords, activeStepId) => this.taskListManager.syncFromWorkflow(stepRecords, activeStepId)
    }

    try {
      await runAgentLoop(userMessage, config, onEvent)
    } finally {
      this._running = false
      this.abortController = null
      // 第5层：循环结束后自动持久化会话
      this.memoryManager.persistSession()
    }
  }

  /**
   * 停止 Agent 运行
   * 中断当前 SSE 请求和工具执行
   */
  stop(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    this._running = false
  }

  /**
   * 清空短期和中期记忆
   * 长期记忆不受影响
   */
  clearMemory(): void {
    this.memoryManager.clear()
  }

  /**
   * 更新会话ID
   * 切换会话或创建新会话时调用，确保后续 Agent 循环使用正确的 sessionId
   *
   * @param sessionId - 新的会话ID，与数据库 chat_session.id 一致
   */
  setSessionId(sessionId: string | null): void {
    this.sessionId = sessionId ?? undefined
    if (sessionId) {
      this.memoryManager.setSessionId(sessionId)
    }
  }

  /**
   * 设置大模型配置ID
   * 切换模型或加载历史对话时调用，确保压缩接口使用正确的模型配置
   *
   * @param modelId - 大模型配置ID
   * @param maxTokens - 可选，当前模型的上下文窗口 token 上限
   */
  setModelId(modelId: number | undefined, maxTokens?: number): void {
    this.modelId = modelId
    if (maxTokens) {
      this._maxTokens = maxTokens
      this.memoryManager.setContextWindowTokens(maxTokens)
    }
  }

  /**
   * 恢复会话记忆
   * 第5层：从 localStorage 恢复之前的对话上下文
   *
   * @param sessionId - 会话ID
   * @returns 是否成功恢复
   */
  restoreSession(sessionId: string): boolean {
    this.sessionId = sessionId
    this.memoryManager.setSessionId(sessionId)
    return this.memoryManager.restoreSession(sessionId)
  }

  /**
   * 删除会话持久化数据
   * @param sessionId - 会话ID
   */
  removeSession(sessionId: string): void {
    this.memoryManager.removeSession(sessionId)
  }

  /**
   * 检查并执行异步压缩
   * 仅在 Agent 循环未运行时触发，用于加载历史对话后清理过长的上下文
   * Agent 循环运行期间由循环内部同步处理压缩，避免并发压缩导致消息状态不一致
   */
  checkAndCompact(): void {
    if (this._running) return

    if (this.memoryManager.needsCompact()) {
      this.captureReportSnapshot().then(snapshot => {
        if (snapshot) {
          this.memoryManager.updateReportSnapshot(snapshot)
        }
      }).catch(() => {})
      this.autoCompact(this.memoryManager).catch(e => {
        console.warn('[AgentEngine] 加载历史对话后压缩失败:', e)
      })
    }
  }

  /**
   * 获取工具定义的 API 格式
   * 用于发送给后台 LLM 的 tools 参数
   * @returns 工具定义数组
   */
  getToolsApiFormat() {
    return this.toolRegistry.toApiFormat()
  }

  /**
   * 获取上下文消息
   * 供 useChat 构建发送给后台的 contextMessages
   *
   * @param maxMessages - 最大保留消息条数
   * @returns 上下文消息列表
   */
  getContextMessages(maxMessages?: number): ContextMessage[] {
    return this.memoryManager.getContextMessages(maxMessages).map(m => ({
      role: m.role as ContextMessage['role'],
      content: m.content,
      toolCallId: m.toolCallId,
      toolName: m.toolName
    }))
  }

  /**
   * 构建系统提示词
   * 供 useChat 注入到请求中
   * @returns 系统提示词
   */
  async buildSystemPrompt(): Promise<string> {
    return this.contextManager.buildSystemPrompt()
  }

  /**
   * 更新项目规范（长期记忆）
   * @param rules - 规范条目数组
   */
  updateProjectRules(rules: string[]): void {
    this.memoryManager.updateProjectRules(rules)
  }

  /**
   * 更新用户偏好（长期记忆）
   * @param preferences - 偏好键值对
   */
  updateUserPreferences(preferences: Record<string, any>): void {
    this.memoryManager.updateUserPreferences(preferences)
  }

  /**
   * 获取任务列表管理器
   * 供外部组件访问任务状态，实现任务进度展示
   * @returns 任务列表管理器实例
   */
  getTaskListManager() {
    return this.taskListManager
  }

  // ==================== 内部方法 ====================

  /**
   * 采集报表状态快照
   * 第4层：压缩前调用，通过 PostMessage 从设计器获取当前报表状态
   * 将完整报表数据精简为快照格式，只保留关键信息
   *
   * @returns 报表状态快照，获取失败返回 null
   */
  private async captureReportSnapshot(): Promise<ReportSnapshot | null> {
    try {
      const schema = getReportSchema()
      if (!schema || typeof schema !== 'object') return null

      const s = schema as any
      const snapshot: ReportSnapshot = {
        dimensions: {
          rows: s.rowCount ?? s.rows ?? 0,
          cols: s.colCount ?? s.cols ?? 0
        },
        mergedRegions: [],
        cellValues: {},
        dataBindings: [],
        timestamp: Date.now()
      }

      if (Array.isArray(s.mergedRegions)) {
        snapshot.mergedRegions = s.mergedRegions.slice(0, contextConfig.snapshotMaxMergedRegions)
      }

      if (typeof s.cells === 'object' && s.cells !== null) {
        const entries = Object.entries(s.cells as Record<string, any>).slice(0, contextConfig.snapshotMaxCellValues)
        for (const [key, cell] of entries) {
          if (cell?.value != null && String(cell.value).trim() !== '') {
            snapshot.cellValues[key] = String(cell.value)
          }
        }
      }

      if (Array.isArray(s.dataBindings)) {
        snapshot.dataBindings = s.dataBindings.slice(0, contextConfig.snapshotMaxDataBindings)
      }

      return snapshot
    } catch {
      return null
    }
  }

  /**
   * 自动压缩实现
   * 第3层：当消息过多时，调用后端 LLM 压缩接口生成结构化摘要
   * LLM 压缩失败时自动降级为规则压缩兜底
   *
   * @param mm - 记忆管理器实例
   */
  private async autoCompact(mm: MemoryManager): Promise<void> {
    if (this._compacting) {
      return
    }
    this._compacting = true

    try {
      const allMessages = mm.getContextMessages(999)
      const keepRecent = contextConfig.compactKeepRecent
      const oldMessages = allMessages.length > keepRecent
        ? allMessages.slice(0, allMessages.length - keepRecent)
        : []

      if (oldMessages.length === 0) return

      const apiMessages: ContextMessage[] = oldMessages.map(msg => {
        if (msg.role === 'tool_result') {
          return {
            role: 'tool_result' as const,
            content: msg.content,
            toolCallId: msg.toolCallId,
            toolName: msg.toolName
          }
        }
        if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
          return {
            role: 'assistant' as const,
            content: msg.content || '',
            toolCalls: msg.toolCalls as ContextMessage['toolCalls']
          }
        }
        return {
          role: msg.role as ContextMessage['role'],
          content: msg.content
        }
      })

      const snapshot = mm.getReportSnapshot()
      const snapshotText = snapshot ? mm.buildSnapshotContext() : undefined

      const result: CompactResult = await compactConversation(
        apiMessages,
        mm.getSummary() || undefined,
        mm.getKeyOperations().length > 0 ? mm.getKeyOperations() : undefined,
        snapshotText,
        this.modelId
      )

      mm.compact(result)
    } catch (e) {
      console.warn('[autoCompact] LLM 压缩失败，降级为规则压缩:', e)
      this.fallbackCompact(mm)
    } finally {
      this._compacting = false
    }
  }

  /**
   * 规则压缩兜底方案
   * 当 LLM 压缩接口调用失败时，使用简单的规则提取关键信息
   *
   * @param mm - 记忆管理器实例
   */
  private fallbackCompact(mm: MemoryManager): void {
    const allMessages = mm.getContextMessages(999)
    const keepRecent = contextConfig.compactKeepRecent
    const oldMessages = allMessages.length > keepRecent
      ? allMessages.slice(0, allMessages.length - keepRecent)
      : []

    if (oldMessages.length === 0) return

    const summaryParts: string[] = []
    const operationParts: string[] = []

    for (const msg of oldMessages) {
      if (msg.role === 'user' && msg.content) {
        summaryParts.push(`用户: ${msg.content.substring(0, 100)}`)
      } else if (msg.role === 'assistant' && msg.content) {
        summaryParts.push(`助手: ${msg.content.substring(0, 100)}`)
      } else if (msg.role === 'tool_result' && msg.toolName) {
        operationParts.push(`${msg.toolName}: ${msg.truncated ? '(结果已截断)' : msg.content.substring(0, 80)}`)
      }
    }

    const existingSummary = mm.getSummary()
    const newSummary = existingSummary
      ? `${existingSummary}\n\n[后续摘要]\n${summaryParts.join('\n')}`
      : summaryParts.join('\n')

    const existingOps = mm.getKeyOperations()
    const newOps = [...existingOps, ...operationParts]

    mm.compact({
      summary: newSummary,
      keyOperations: newOps
    })
  }
}
