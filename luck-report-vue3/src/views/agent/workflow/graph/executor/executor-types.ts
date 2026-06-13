/** 图执行器共享类型定义，scheduler 与 applier 共用 */

import type { NodeDefinition } from '../state-graph.ts'

/** 调度任务定义 */
export interface Task {
  nodeId: string
  nodeDef: NodeDefinition
  startedAt: number
}

/** 跳过的节点记录 */
export interface SkippedNode {
  nodeId: string
  reason: 'skipWhen' | 'not_triggered'
}

/** 任务执行结果 */
export interface TaskResult {
  nodeId: string
  output: Record<string, any>
  error?: Error
  duration: number
}

/** 版本追踪：节点 → (channelName → 已知版本号) */
export type VersionsSeen = Map<string, Map<string, number>>
