/**
 * LangGraph 运行时上下文 Annotation
 * 用 Annotation.Root 定义 WorkflowRuntime，作为 StateGraph 构造第二参 contextSchema
 * 节点内通过 config.context 访问
 */

import { Annotation } from '@langchain/langgraph'
import type { WorkflowRuntime } from './runtime.ts'

/**
 * WorkflowRuntimeAnnotation
 * 字段与 WorkflowRuntime 公开成员一一对应
 * 节点签名：(state, config) => Partial<State>，从 config.context 拿到 runtime
 *
 * @example
 * ```ts
 * const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
 *   .addNode('foo', (state, config) => {
 *     const runtime = config.context  // 即 WorkflowRuntime
 *     if (!runtime) throw new Error('config.context missing')
 *     return { /* ... *\/ }
 *   })
 * ```
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
  /** 运行ID（fork 自增计数嵌入；用于生成唯一 toolCallId） */
  runId: Annotation<string>()
})

/** 节点从 config.context 拿到的 runtime 字段类型 */
export type WorkflowRuntimeContext = typeof WorkflowRuntimeAnnotation.State

/**
 * 节点上下文守卫：确保 config.context 非空
 * 业务节点入口统一调用，便于快速定位"忘记传 context"的错误
 * @param config - LangGraph 节点 config，运行时由 LangGraph 注入
 * @param nodeName - 节点名，用于错误信息定位
 * @returns 校验通过的 WorkflowRuntime
 * @throws 当 config.context 缺失时抛错
 */
export function requireContext(config: any, nodeName: string): WorkflowRuntimeContext {
  const ctx = config?.context
  if (!ctx) {
    throw new Error(`[${nodeName}] config.context is missing - 调用 stream/invoke 时必须传 { context: runtime }`)
  }
  return ctx as WorkflowRuntimeContext
}

/** WorkflowRuntime 实例拆出 context 字段（当前实现等价于对象引用，保留便于后续改造） */
export function runtimeToContext(runtime: WorkflowRuntime): WorkflowRuntimeContext {
  return {
    toolRegistry: runtime.toolRegistry,
    memoryManager: runtime.memoryManager,
    contextManager: runtime.contextManager,
    llmCaller: runtime.llmCaller,
    signal: runtime.signal,
    onToolConfirm: runtime.onToolConfirm,
    onEvent: runtime.onEvent,
    sessionId: runtime.sessionId,
    modelId: runtime.modelId,
    runId: runtime.runId
  }
}
