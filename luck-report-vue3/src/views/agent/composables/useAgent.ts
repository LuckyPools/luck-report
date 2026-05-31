import { createDefaultRegistry } from '../tools/registry'
import { MemoryManager } from '../memory/memory-manager'
import { ContextManager } from '../core/context-manager'
import { runAgentLoop, type AgentEvent, type AgentLoopConfig } from '../core/agent-loop'
import type { ToolCall } from '../tools/types'
import type { ContextMessage } from '@/api/chat'

/**
 * Agent 引擎配置
 * 创建 AgentEngine 实例时的配置项
 */
export interface AgentEngineConfig {
  /** 最大循环轮次，默认 10 */
  maxIterations?: number
  /** 工具确认回调，返回 true 表示用户确认执行，False 表示拒绝 */
  onToolConfirm?: (toolCall: ToolCall) => Promise<boolean>
  /** 会话ID，与数据库 chat_session.id 一致，传递到后端用于关联会话 */
  sessionId?: string
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
 *
 * 调用方：useChat.sendMessage() 中判断是否启用 Agent 模式，
 * 如果启用则调用 agentEngine.start() 替代直接调 chatStream
 */
export class AgentEngine {
  /** 工具注册表 */
  readonly toolRegistry = createDefaultRegistry()
  /** 记忆管理器 */
  readonly memoryManager = new MemoryManager()
  /** 上下文管理器 */
  readonly contextManager: ContextManager

  /** 最大循环轮次 */
  private maxIterations: number
  /** 工具确认回调 */
  private onToolConfirmFn?: (toolCall: ToolCall) => Promise<boolean>
  /** 会话ID */
  private sessionId?: string
  /** 中断控制器 */
  private abortController: AbortController | null = null
  /** 是否正在运行 */
  private _running = false

  constructor(config: AgentEngineConfig = {}) {
    this.maxIterations = config.maxIterations ?? 10
    this.onToolConfirmFn = config.onToolConfirm
    this.sessionId = config.sessionId
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
   */
  async start(
    userMessage: string,
    onEvent: (event: AgentEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    if (this._running) return

    this._running = true
    this.abortController = signal ? null : new AbortController()
    const effectiveSignal = signal || this.abortController!.signal

    // 用户消息由 runAgentLoop 内部追加到记忆，此处不再重复添加

    const config: AgentLoopConfig = {
      maxIterations: this.maxIterations,
      toolRegistry: this.toolRegistry,
      memoryManager: this.memoryManager,
      contextManager: this.contextManager,
      signal: effectiveSignal,
      onToolConfirm: this.onToolConfirmFn,
      sessionId: this.sessionId
    }

    try {
      await runAgentLoop(userMessage, config, onEvent)
    } finally {
      this._running = false
      this.abortController = null
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
}
