/**
 * 运行时桥接层：WorkflowRuntime ↔ LangGraph config.context
 *
 * #7 改动后职责简化：
 * - getRuntime：从 config.context 取 WorkflowRuntime 实例（不再 rebuild）
 * - 删除 rebuildRuntime（拆解→重建反模式已消除）
 * - 删除 buildRunnableConfig（未被调用）
 * - 删除 invokeSubgraph（未被调用）
 * - 删除 isLangGraphEngineEnabled（死代码，灰度已废弃）
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph'
import type { WorkflowRuntime } from './runtime.ts'
import type { WorkflowRuntimeContext } from './context-annotation.ts'
import { requireContext } from './context-annotation.ts'

/**
 * 节点内获取 WorkflowRuntime
 * 业务节点统一通过此函数拿到 runtime 实例。
 *
 * #7 改动：config.context 直接是 WorkflowRuntime 实例引用，
 *         无需 rebuildRuntime 重建（forkCounter 等实例状态完整保留）。
 *
 * @param config - LangGraph 节点 config
 * @param nodeName - 节点名（用于错误信息）
 * @returns WorkflowRuntime 实例
 * @throws 当 config.context 缺失时抛错
 */
export function getRuntime(config: LangGraphRunnableConfig, nodeName: string): WorkflowRuntime {
  return requireContext(config, nodeName)
}

// re-export 供 index.ts 统一导出
export { runtimeToContext } from './context-annotation.ts'
export type { WorkflowRuntimeContext } from './context-annotation.ts'
