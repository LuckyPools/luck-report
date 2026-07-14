/**
 * LangGraph 运行时上下文 Annotation
 * 用 Annotation.Root 定义 WorkflowRuntime 的 context schema 类型声明。
 *
 * ===== 设计说明（#7 改动）=====
 * 旧实现：runtimeToContext 把 WorkflowRuntime 实例拆解为普通对象注入 config.context，
 *         节点内再通过 rebuildRuntime 把字段逐个填回 new WorkflowRuntime(...)。
 *         问题：每次节点执行"拆一次建一次"，forkCounter 丢失，runId 派生正则脆弱。
 * 新实现：config.context 直接存 WorkflowRuntime 实例引用（不拆解）。
 *         - runtimeToContext(runtime) => runtime（直接返回）
 *         - getRuntime(config) => config.context as WorkflowRuntime（直接取引用）
 *         - 消除 rebuildRuntime，forkCounter 等实例状态完整保留
 *
 * WorkflowRuntimeAnnotation 的字段定义仅作类型提示和文档，
 * 运行时 context 字段不参与 LangGraph state reducer（context 是透传的）。
 */

import { Annotation } from '@langchain/langgraph'
import type { WorkflowRuntime } from './runtime.ts'

/**
 * WorkflowRuntimeAnnotation
 * 字段与 WorkflowRuntime 公开成员一一对应，用于类型提示。
 * 节点签名：(state, config) => Partial<State>，从 config.context 拿到 runtime 实例
 *
 * 注意：context schema 的字段定义不会在运行时被 LangGraph 调用 reducer，
 * 它仅用于：(1) 类型提示 (2) 文档 (3) context 非空校验的辅助
 */
export const WorkflowRuntimeAnnotation = Annotation.Root({
  /** 工具注册表（节点执行工具调用的核心依赖） */
  toolRegistry: Annotation<any>(),
  /** 记忆管理器（写入 tool_result 时使用） */
  memoryManager: Annotation<any>(),
  /** 上下文管理器 */
  contextManager: Annotation<any>(),
  /** LLM 调用器（包装 chatStream 为 AsyncGenerator） */
  llmCaller: Annotation<any>(),
  /** 中断信号 */
  signal: Annotation<AbortSignal | undefined>(),
  /** 工具确认回调 */
  onToolConfirm: Annotation<((toolCall: any) => Promise<boolean>) | undefined>(),
  /** ask_user 任务触发时的用户输入回调 */
  onUserPrompt: Annotation<((prompt: any) => Promise<string>) | undefined>(),
  /** 流事件发射回调（注意：建议使用 runtime.emitEvent 而非 config.writer，详见 runtime-bridge.ts） */
  onEvent: Annotation<((event: any) => void) | undefined>(),
  /** 会话ID */
  sessionId: Annotation<string | undefined>(),
  /** 大模型配置ID */
  modelId: Annotation<number | undefined>(),
  /** 是否启用深度思考 */
  deepThink: Annotation<boolean | undefined>(),
  /** gather_requirements 阶段最大询问轮次（达到后强制收敛，禁止继续 ask_user） */
  gatherMaxRounds: Annotation<number>(),
  /** 运行ID（fork 自增计数嵌入；用于生成唯一 toolCallId） */
  runId: Annotation<string>()
})

/** 节点从 config.context 拿到的 runtime 字段类型（类型层面声明，运行时为 WorkflowRuntime 实例） */
export type WorkflowRuntimeContext = typeof WorkflowRuntimeAnnotation.State

/**
 * 节点上下文守卫：确保 config.context 非空
 * 业务节点入口统一调用，便于快速定位"忘记传 context"的错误
 *
 * @param config - LangGraph 节点 config，运行时由 LangGraph 注入
 * @param nodeName - 节点名，用于错误信息定位
 * @returns 校验通过的 WorkflowRuntime 实例
 * @throws 当 config.context 缺失时抛错
 */
export function requireContext(config: any, nodeName: string): WorkflowRuntime {
  const ctx = config?.context
  if (!ctx) {
    throw new Error(`[${nodeName}] config.context is missing - 调用 stream/invoke 时必须传 { context: runtime }`)
  }
  // #7 改动：context 直接是 WorkflowRuntime 实例引用，无需 rebuild
  return ctx as WorkflowRuntime
}

/**
 * 把 WorkflowRuntime 实例转为 context 字段
 * #7 改动：直接返回实例引用，不再逐字段拆解。
 * 这样 config.context 就是实例本身，节点内可直接调 runtime.emitEvent() / runtime.fork()，
 * 无需 rebuildRuntime 重建，forkCounter 等实例状态完整保留。
 *
 * @param runtime - WorkflowRuntime 实例，不可为空
 * @returns 同一个实例引用（类型标注为 WorkflowRuntimeContext 以匹配 Annotation 类型）
 */
export function runtimeToContext(runtime: WorkflowRuntime): WorkflowRuntimeContext {
  return runtime as unknown as WorkflowRuntimeContext
}
