/**
 * 运行时桥接层：WorkflowRuntime ↔ LangGraph config.context
 * 提供：
 * 1. 将 WorkflowRuntime 注入到 LangGraph stream/invoke 的 context 字段
 * 2. 节点内运行时获取 runtime 的统一入口（兼容旧代码的 runtime.x 调用）
 * 3. 子图 fork 时的 context 隔离（避免多次 fork 间 toolCallId 冲突）
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph'
import { WorkflowRuntime } from './runtime.ts'
import type { WorkflowRuntimeContext } from './context-annotation.ts'
import { runtimeToContext } from './context-annotation.ts'

/**
 * 构造 LangGraph invoke/stream 的 config
 * 将 WorkflowRuntime 注入到 config.context，业务节点可通过 config.context 拿到
 * @param runtime - 父运行时，WorkflowRuntime，不可为空
 * @param options - 透传 abortSignal / recursionLimit / configurable
 * @returns LangGraph 兼容的 RunnableConfig
 */
export function buildRunnableConfig(
  runtime: WorkflowRuntime,
  options?: { signal?: AbortSignal; recursionLimit?: number; configurable?: Record<string, any> }
): LangGraphRunnableConfig {
  return {
    context: runtimeToContext(runtime),
    signal: options?.signal ?? runtime.signal,
    recursionLimit: options?.recursionLimit ?? 25,
    configurable: options?.configurable
  } as LangGraphRunnableConfig
}

/**
 * 节点内获取 WorkflowRuntime
 * 业务节点统一通过此函数拿到 runtime，避免直接 (config as any).context 的类型不安全
 * @param config - LangGraph 节点 config
 * @param nodeName - 节点名（用于错误信息）
 * @returns WorkflowRuntime 实例
 * @throws 当 config.context 缺失或类型不符时抛错
 */
export function getRuntime(config: LangGraphRunnableConfig, nodeName: string): WorkflowRuntime {
  const ctx = config.context as WorkflowRuntimeContext | undefined
  if (!ctx) {
    throw new Error(`[${nodeName}] config.context is missing - 调用 stream/invoke 时必须传 { context: runtime }`)
  }
  // 注意：ctx 是 WorkflowRuntimeContext（剥离 this 的字段拷贝）
  // 节点内需要 emitEvent / fork 等带 this 行为的方法时，通过 rebuildRuntime 重建
  return rebuildRuntime(ctx, nodeName)
}

/**
 * 从 WorkflowRuntimeContext 重建 WorkflowRuntime 实例
 * 用 ctx 字段填回 WorkflowRuntime 构造器，并保留 onEvent / runId 等关键成员
 * @param ctx - 上下文对象，WorkflowRuntimeContext，不可为空
 * @param nodeName - 节点名（用于新 runId 前缀）
 * @returns 重建的 WorkflowRuntime 实例
 */
export function rebuildRuntime(ctx: WorkflowRuntimeContext, nodeName: string): WorkflowRuntime {
  // 关键：保留原 ctx.runId（前缀 _n{nodeName}_），便于日志追溯
  const derivedRunId = ctx.runId ? `${ctx.runId}_n${nodeName}` : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  return new WorkflowRuntime({
    toolRegistry: ctx.toolRegistry,
    memoryManager: ctx.memoryManager,
    contextManager: ctx.contextManager,
    llmCaller: ctx.llmCaller,
    signal: ctx.signal,
    onToolConfirm: ctx.onToolConfirm,
    onEvent: ctx.onEvent,
    sessionId: ctx.sessionId,
    modelId: ctx.modelId,
    runId: derivedRunId
  })
}

/**
 * 子图调用桥接：父图节点执行子图.invoke() 时，需要把父图 state + 子图 runtime 传过去
 * 子图期望的入参是 { input: { userMessage, intent, ... }, context: runtimeContext }
 * @param subgraph - 编译后的子图（LangGraph CompiledStateGraph）
 * @param parentState - 父图当前 state
 * @param parentRuntime - 父图 runtime
 * @returns 子图执行结果
 */
export async function invokeSubgraph(
  subgraph: { invoke: (input: any, options?: any) => Promise<any> },
  parentState: Record<string, any>,
  parentRuntime: WorkflowRuntime
): Promise<any> {
  // 关键：子图 fork 派生独立 runId，确保 toolCallId 全局唯一
  const childRuntime = parentRuntime.fork()
  return await subgraph.invoke(parentState, { context: runtimeToContext(childRuntime) })
}

/**
 * 灰度判断：当前是否走 LangGraph 引擎
 * 通过 import.meta.env.VITE_USE_LANGGRAPH_ENGINE 开关
 * @returns true = 走 LangGraph 新图，false = 走自建老图
 */
export function isLangGraphEngineEnabled(): boolean {
  try {
    // Vite 环境变量（构建时内联）
    return (import.meta as any).env?.VITE_USE_LANGGRAPH_ENGINE === 'true'
  } catch {
    return false
  }
}
