/**
 * 节点包装器：为 LangGraph 节点提供统一的 context 校验、runtime 注入
 * 业务节点定义时统一调用 withInput()，避免每个节点重复写 boilerplate
 * 事件发射统一走 runtime.emitEvent（由各节点直接调用，无壳子函数）
 *
 * #4 改动：删除未被调用的 subgraphNode 函数（实际子图嵌入走 wrapWriteAction / 直接 invoke）
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph'
import { requireContext } from './context-annotation.ts'
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
 * 2. 从 context 取 WorkflowRuntime 实例（#7 改动后直接取引用，不再 rebuild）
 * 3. 把 runtime 挂到全局，让节点内部工具函数（如 runToolWithEvent）能拿到
 *
 * @param fn - 业务节点函数，签名 (state, config, runtime) => Partial<State>
 * @param options - 节点名、是否 silent
 * @returns LangGraph 兼容的节点函数
 *
 * @example
 * ```ts
 * g.addNode('loadDocs', withInput(async (state, config, runtime) => {
 *   const result = await runtime.toolRegistry.executeTool('load_report_doc', { fileNames: docs })
 *   return { searchResults: { docs: result } }
 * }, { nodeName: 'loadDocs' }))
 * ```
 */
export function withInput<S = any, U = any>(
  fn: (state: S, config: LangGraphRunnableConfig, runtime: WorkflowRuntime) => U | Promise<U>,
  options: NodeWrapperOptions
): NodeFunction<S, U> {
  return async (state: S, config: LangGraphRunnableConfig): Promise<U> => {
    // 1. context 校验 + 取 runtime（#7 改动后直接取实例引用）
    const runtime = requireContext(config, options.nodeName)
    // 2. 执行业务
    return await fn(state, config, runtime)
  }
}
