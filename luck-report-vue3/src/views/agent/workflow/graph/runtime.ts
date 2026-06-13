/**
 * 工作流运行时配置，参照 LangGraph config.configurable 模式
 */

import type { ToolRegistry } from '../../tools/registry'
import type { MemoryManager } from '../../memory/memory-manager'
import type { ContextManager } from '../../core/context-manager'
import type { StateChannel } from './channels'
import type { StreamEvent } from './stream-mode'

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
 * @param messages - 对话消息列表，ContextMessage[]，不可为空
 * @param tools - 工具定义列表，any[]，可选
 * @param options - 调用选项，LLMCallOptions，可选
 * @returns LLM 事件异步生成器，AsyncGenerator<LLMEvent>
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
}

/**
 * 工作流运行时，节点执行时通过第二个参数 (state, runtime) 访问
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
  /** 事件发射器 */
  readonly onEvent?: (event: StreamEvent) => void
  /** 会话ID */
  readonly sessionId?: string
  /** 大模型配置ID */
  readonly modelId?: number
  readonly runId: string
  /** fork 自增计数器，每次 fork() 递增，嵌入子 runId 确保 toolCallId 全局唯一 */
  private forkCounter: number = 0
  private channelMap: Map<string, StateChannel<any>> = new Map()

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
    this.onEvent = options.onEvent
    this.sessionId = options.sessionId
    this.modelId = options.modelId
    this.runId = options.runId ?? generateRunId()
  }

  /**
   * 发射流事件
   * @param event - 流事件，StreamEvent，不可为空
   */
  emitEvent(event: StreamEvent): void {
    this.onEvent?.(event)
  }

  /**
   * 注入当前执行的 Channel 映射
   * @param channels - 当前执行的 Channel 映射，Map<string, StateChannel<any>>，不可为空
   */
  setChannelMap(channels: Map<string, StateChannel<any>>): void {
    this.channelMap = channels
  }

  /**
   * 按名称获取当前执行的 Channel 实例
   * @param name - Channel 名称，string，不可为空
   * @returns 对应 Channel 实例；未找到时返回 undefined
   */
  getChannel<T = any>(name: string): StateChannel<T> | undefined {
    return this.channelMap.get(name)
  }

  /**
   * 派生一个独立的子运行时
   * fork 自增计数器并嵌入 runId，确保子图 toolCallId 全局唯一，避免多次 fork 间 ID 冲突
   * @returns 派生的子运行时，WorkflowRuntime
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
      runId: `${this.runId}_f${this.forkCounter}`
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
  onEvent?: (event: StreamEvent) => void
  sessionId?: string
  modelId?: number
  runId?: string
}
