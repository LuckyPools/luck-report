/**
 * 节点包装器：为 LangGraph 节点提供统一的 context 校验、runtime 注入
 * 业务节点定义时统一调用 withInput()，避免每个节点重复写 boilerplate
 * 事件发射统一走 runtime.emitEvent（由各节点直接调用，无壳子函数）
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph'
import { requireContext } from './context-annotation.ts'
import { getRuntime } from './runtime-bridge.ts'
import { runtimeToContext } from './context-annotation.ts'
import type { WorkflowRuntime } from './runtime.ts'

/** 节点函数类型（LangGraph 节点标准签名） */
export type NodeFunction<S = any, U = any> = (state: S, config: LangGraphRunnableConfig) => U | Promise<U>

/** 节点包装选项 */
export interface NodeWrapperOptions {
  /** 节点名（用于错误信息、runId 派生） */
  nodeName: string
  /** 是否 silent（不发射 updates 事件） */
  silent?: boolean
}

/**
 * 节点包装高阶函数
 * 自动完成：
 * 1. config.context 非空校验（缺失时抛清晰错误）
 * 2. 从 context 重建 WorkflowRuntime 实例（拿到 emitEvent / fork 等带 this 的方法）
 * 3. 把 runtime 挂到全局，让节点内部工具函数（如 runToolWithEvent）能拿到
 *
 * @param fn - 业务节点函数，签名 (state, config, runtime) => Partial<State>
 * @param options - 节点名、是否 silent
 * @returns LangGraph 兼容的节点函数
 *
 * @example
 * ```ts
 * g.addNode('loadDocs', withInput(async (state, config, runtime) => {
 *   const result = await runtime.toolRegistry.executeTool('load_report_introduce', { fileNames: docs })
 *   return { searchResults: { docs: result } }
 * }, { nodeName: 'loadDocs' }))
 * ```
 */
export function withInput<S = any, U = any>(
  fn: (state: S, config: LangGraphRunnableConfig, runtime: WorkflowRuntime) => U | Promise<U>,
  options: NodeWrapperOptions
): NodeFunction<S, U> {
  return async (state: S, config: LangGraphRunnableConfig): Promise<U> => {
    // 1. context 校验
    requireContext(config, options.nodeName)
    // 2. 重建 runtime（拿到 emitEvent / fork 等方法）
    const runtime = getRuntime(config, options.nodeName)
    // 3. 执行业务
    return await fn(state, config, runtime)
  }
}

/**
 * 子图节点包装：把 LangGraph 子图作为父图的一个节点嵌入
 * 处理：1. fork 派生独立 runtime；2. 子图返回结果映射到父图 state
 *
 * @param subgraphFactory - 子图工厂函数（返回 CompiledReportGraph）
 * @param outputMapper - 把子图 state 映射到父图 state 更新
 * @param options - 节点名
 * @returns 父图节点函数
 */
export function subgraphNode<S = any, U = any>(
  subgraphFactory: () => { invoke: (input: any, options?: any) => Promise<any> },
  outputMapper: (subState: any, parentState: S) => U,
  options: NodeWrapperOptions
): NodeFunction<S, U> {
  return withInput(async (state, _config, runtime) => {
    const subgraph = subgraphFactory()
    const childRuntime = runtime.fork()
    const result = await subgraph.invoke(state as any, {
      context: runtimeToContext(childRuntime)
    })
    return outputMapper(result, state)
  }, options)
}
