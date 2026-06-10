/**
 * 工作流运行时配置
 * 参照 LangGraph config.configurable 模式
 *
 * WorkflowRuntime 是节点执行时可以访问的运行时上下文，
 * 包含工具注册表、LLM 调用器、事件回调等依赖
 * 通过 GraphExecutor 在节点执行时注入
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
 * LLM 调用器抽象
 * 将 chatStream 的回调式 API 适配为 AsyncGenerator 模式
 *
 * @param messages - 对话消息列表，ContextMessage[]，不可为空
 * @param tools - 工具定义列表，any[]，可选
 * @param options - 调用选项（含 toolChoice、signal 等），LLMCallOptions，可选
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
 * 工作流运行时
 * 节点执行时通过第二个参数 (state, runtime) 访问
 *
 * 设计原则：
 * - 所有外部依赖通过 runtime 注入，节点不直接 import
 * - runtime 由 GraphExecutor 在执行时创建并传入
 * - 适配层负责将现有 ToolRegistry / MemoryManager 等包装为 runtime
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
  /**
   * 本次工作流执行的唯一ID
   * 用于 LLMDecideNode 生成全局唯一的 mapped toolCallId（解决跨对话 / 跨 superstep 的 ID 冲突）
   * 子图 fork 出来的 runtime 会继承父 runtime 的 runId，保证同一逻辑执行流内 ID 一致
   */
  readonly runId: string
  /**
   * Channel 名称 → 实例映射
   * 由 GraphExecutor 在 initialize() 完成后注入，
   * 解决 LLMDecideNode 与 GraphExecutor 之间的 Channel 引用克隆问题
   */
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
   * 仅 GraphExecutor.initialize() 阶段调用一次，
   * 避免每次执行都重新构造 Map
   *
   * @param channels - 当前执行的 Channel 映射（name → instance），Map<string, StateChannel<any>>，不可为空
   */
  setChannelMap(channels: Map<string, StateChannel<any>>): void {
    this.channelMap = channels
  }

  /**
   * 按名称获取当前执行的 Channel 实例
   * 用于 LLMDecideNode 等需要与图 Channel 共享引用的节点
   *
   * @param name - Channel 名称，string，不可为空
   * @returns 对应 Channel 实例；未找到时返回 undefined
   */
  getChannel<T = any>(name: string): StateChannel<T> | undefined {
    return this.channelMap.get(name)
  }

  /**
   * 派生一个独立的子运行时
   * 共享外部依赖（工具注册表、记忆、LLM 调用器、事件回调等），
   * 但 channelMap 独立持有，避免子图 executor.setChannelMap 覆盖父图引用
   *
   * 使用场景：子图节点在主图 executor 内执行时，构造子级 runtime 透传给子图，
   * 子图 setChannelMap 只影响子级 channelMap，父图 runtime 完全不受污染
   *
   * @returns 派生的子运行时，WorkflowRuntime
   */
  fork(): WorkflowRuntime {
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
      // 子 runtime 继承父 runId：同一逻辑执行流内的 LLMDecideNode 必须看到同一个 runId，
      // 否则子图的 mapped toolCallId 会与主图不一致，导致 UI 端 find 不到消息
      runId: this.runId
    })
    // child.channelMap 留空，子图 executor.initialize() 自行注入子图 channels
    return child
  }
}

/**
 * 生成新的 runId
 * 时间戳+随机数 8 位，16 字符内，长度可读且冲突概率可忽略（同一毫秒内几乎不可能重复）
 * 不使用 crypto.randomUUID 以保持环境兼容性
 *
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
  /**
   * 本次工作流执行的唯一ID
   * 不传则自动生成；fork 子 runtime 时必须显式继承父 runtime 的 runId
   */
  runId?: string
}
