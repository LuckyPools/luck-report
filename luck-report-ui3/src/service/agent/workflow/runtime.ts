/**
 * 工作流运行时（LangGraph 节点共享的上下文对象）
 * 节点签名 (state, config, runtime) 中第三个参数即此对象
 * 内置事件总线、fork 派生、LLM / 工具 / 记忆三大能力
 */

import type { ToolRegistry } from '../tools/registry.ts'
import type { MemoryManager } from '../memory/memory-manager.ts'
import type { ContextManager } from '../core/context-manager.ts'
import type { StreamEvent } from './stream-mode.ts'

/**
 * LLM 调用事件
 * llmCaller 返回的异步生成器产出的事件类型
 */
export type LLMEvent =
  | { type: 'token'; content: string }
  | { type: 'reasoning'; content: string }
  | { type: 'tool_call'; toolCallId: string; toolName: string; input: Record<string, any> }
  | { type: 'tool_result'; toolCallId: string; toolName: string; result: any; error?: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

/**
 * LLM 调用器抽象，将 chatStream 的回调式 API 适配为 AsyncGenerator 模式
 * @param messages - 对话消息列表，不可为空
 * @param tools - 工具定义列表，可选
 * @param options - 调用选项，可选
 * @returns LLM 事件异步生成器
 */
export type LLMCaller = (
  messages: any[],
  tools?: any[],
  options?: LLMCallOptions
) => AsyncGenerator<LLMEvent>

/**
 * LLM 调用选项
 */
export interface LLMCallOptions {
  /** 强制调用指定工具（Function Calling 模式） */
  toolChoice?: any
  /** 中断信号 */
  signal?: AbortSignal
  /** 会话ID */
  sessionId?: string
  /** 大模型配置ID */
  modelId?: number
  /** 是否启用深度思考 */
  deepThink?: boolean
}

/**
 * 工作流运行时，节点执行时通过第三个参数 (state, config, runtime) 访问
 */
export class WorkflowRuntime {
  /** 工具注册表 */
  readonly toolRegistry: ToolRegistry
  /** 记忆管理器 */
  readonly memoryManager: MemoryManager
  /** 上下文管理器 */
  readonly contextManager: ContextManager
  /** LLM 调用器（包装 chatStream 为 AsyncGenerator） */
  readonly llmCaller: LLMCaller
  /** 中断信号 */
  readonly signal?: AbortSignal
  /** 工具确认回调 */
  readonly onToolConfirm?: (toolCall: any) => Promise<boolean>
  /** 用户输入回调（ask_user 任务用）— 收到 question/options 后阻塞等待用户回复 */
  readonly onUserPrompt?: (prompt: UserPrompt) => Promise<string>
  /** 事件回调（节点通过 emitEvent 间接调用） */
  readonly onEvent?: (event: StreamEvent) => void
  /** 会话ID */
  readonly sessionId?: string
  /** 大模型配置ID */
  readonly modelId?: number
  /** 是否启用深度思考 */
  readonly deepThink?: boolean
  /** 当前执行 ID（fork 时子 runtime 继承并扩展） */
  readonly runId: string
  /** gather_requirements 阶段最大询问轮次（达到后强制收敛，禁止继续 ask_user） */
  readonly gatherMaxRounds: number
  /** fork 自增计数器，每次 fork() 递增，嵌入子 runId 确保 toolCallId 全局唯一 */
  private forkCounter: number = 0

  /**
   * 构造工作流运行时
   * @param options - 运行时配置选项；若不传 runId 则自动生成（fork 时子 runtime 必须显式继承）
   */
  constructor(options: WorkflowRuntimeOptions) {
    this.toolRegistry = options.toolRegistry
    this.memoryManager = options.memoryManager
    this.contextManager = options.contextManager
    this.llmCaller = options.llmCaller
    this.signal = options.signal
    this.onToolConfirm = options.onToolConfirm
    this.onUserPrompt = options.onUserPrompt
    this.onEvent = options.onEvent
    this.sessionId = options.sessionId
    this.modelId = options.modelId
    this.deepThink = options.deepThink
    this.runId = options.runId ?? generateRunId()
    this.gatherMaxRounds = options.gatherMaxRounds ?? 5
  }

  /**
   * 发射流事件（节点内统一入口）
   * @param event - 流事件，不可为空
   */
  emitEvent(event: StreamEvent): void {
    this.onEvent?.(event)
  }

  /**
   * 派生一个独立的子运行时
   * fork 自增计数器并嵌入 runId，确保子图 toolCallId 全局唯一，避免多次 fork 间 ID 冲突
   * @returns 派生的子运行时
   */
  fork(): WorkflowRuntime {
    this.forkCounter++
    const child = new WorkflowRuntime({
      toolRegistry: this.toolRegistry,
      memoryManager: this.memoryManager,
      contextManager: this.contextManager,
      llmCaller: this.llmCaller,
      signal: this.signal,
      onToolConfirm: this.onToolConfirm,
      onEvent: this.onEvent,
      sessionId: this.sessionId,
      modelId: this.modelId,
      deepThink: this.deepThink,
      runId: `${this.runId}_f${this.forkCounter}`,
      gatherMaxRounds: this.gatherMaxRounds
    })
    return child
  }
}

/**
 * 生成新的 runId
 * @returns runId 字符串
 */
export function generateRunId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 工作流运行时构造选项
 */
export interface WorkflowRuntimeOptions {
  toolRegistry: ToolRegistry
  memoryManager: MemoryManager
  contextManager: ContextManager
  llmCaller: LLMCaller
  signal?: AbortSignal
  onToolConfirm?: (toolCall: any) => Promise<boolean>
  /** ask_user 任务触发时调用，返回用户输入文本；未提供时 ask_user 任务会失败并提示"agent 未配置用户输入通道" */
  onUserPrompt?: (prompt: UserPrompt) => Promise<string>
  onEvent?: (event: StreamEvent) => void
  sessionId?: string
  modelId?: number
  runId?: string
  /** gather_requirements 阶段最大询问轮次，默认 5 */
  gatherMaxRounds?: number
  /** 是否启用深度思考 */
  deepThink?: boolean
}

/**
 * ask_user 任务的回调入参
 */
export interface UserPrompt {
  /** 任务 ID（TaskPlan 中的 id） */
  taskId: string
  /** 提问文本 */
  question: string
  /** 可选项列表（多选一时用；空数组表示自由输入） */
  options?: string[]
}
