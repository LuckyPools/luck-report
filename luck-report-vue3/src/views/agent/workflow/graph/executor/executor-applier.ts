/** 图执行器写入与边处理模块：applyWrites / 失败写入 / Barrier 通知 / 条件边 / 版本追踪 / 步骤记录
 *  拆分为模块函数，统一接收 executor 实例，避免 prototype 拆分导致的类型推断断裂 */

import { LastValueAfterFinishChannel, NamedBarrierValue } from '../channels.ts'
import type { TaskResult } from './executor-types.ts'
import type { GraphExecutor } from './graph-executor.ts'

/**
 * 应用节点输出到 Channel，维护 currentStepWrites 用于本超步边触发判定
 * @param executor 图执行器实例
 * @param results 本超步各任务执行结果
 */
export function applyWrites(executor: GraphExecutor, results: TaskResult[]): void {
  // currentStepWrites 仅反映本超步真实写入，不累积历史
  executor.currentStepWrites.clear()
  const completedNodeIds: string[] = []
  console.log(`[DEBUG][graph-executor] applyWrites superstep=${executor.superstepCount} nodes=${results.map(r => r.nodeId).join(',')}`)

  for (const result of results) {
    const { nodeId, output, error } = result

    if (error) {
      applyFailureWrites(executor, nodeId, error)
      continue
    }

    const nodeDef = executor.compiled.params.nodes.get(nodeId)
    const outputFilter = nodeDef?.output

    // 按 output schema 过滤子图节点全量字段，避免抬高上游 channel version
    let keysToWrite = Object.keys(output ?? {})
    if (outputFilter) {
      const allowed = keysToWrite.filter(k => outputFilter[k] === true)
      const dropped = keysToWrite.filter(k => outputFilter[k] !== true)
      if (dropped.length > 0) {
        console.log(`[DEBUG][graph-executor] ${nodeId} output 过滤 丢弃:`, dropped)
      }
      keysToWrite = allowed
    }

    const writesSet = new Set<string>()

    for (const key of keysToWrite) {
      const value = output[key]
      const channel = executor.channels.get(key)
      if (channel) {
        // LastValueAfterFinishChannel 需要显式 finish()
        if (channel instanceof LastValueAfterFinishChannel) {
          channel.update([value])
          channel.finish()
        } else {
          channel.update([value])
        }
        if (key !== 'stepRecords' && key !== 'errors') {
          writesSet.add(key)
        }
      }
      executor.state[key] = value
    }

    // LLMDecideNode 的 outChannelName 已在节点内 stage()+finish()，此处只纳入 currentStepWrites
    const outChannelName = nodeDef?.outChannelName
    if (outChannelName) {
      writesSet.add(outChannelName)
    }

    executor.currentStepWrites.set(nodeId, writesSet)
    completedNodeIds.push(nodeId)

    updateVersionsSeen(executor, nodeId)
    appendStepRecord(executor, {
      stepId: nodeId,
      stepName: executor.compiled.params.nodes.get(nodeId)?.metadata?.description ?? nodeId,
      status: 'completed',
      duration: result.duration,
      timestamp: Date.now()
    })
    processConditionalEdges(executor, nodeId, output)
  }

  finishAllChannels(executor, completedNodeIds)
}

/**
 * 失败写入：仅写错误 Channel 与步骤记录，更新 versionsSeen
 * @param executor 图执行器实例
 * @param nodeId 失败节点 id
 * @param error 失败异常
 */
function applyFailureWrites(executor: GraphExecutor, nodeId: string, error: Error): void {
  const errorsChannel = executor.channels.get('errors')
  if (errorsChannel) {
    errorsChannel.update([[error.message]])
  }

  appendStepRecord(executor, {
    stepId: nodeId,
    stepName: executor.compiled.params.nodes.get(nodeId)?.metadata?.description ?? nodeId,
    status: 'error',
    error: error.message,
    timestamp: Date.now()
  })

  updateVersionsSeen(executor, nodeId)
}

/**
 * 通知所有 NamedBarrierValue Channel 本轮已完成节点
 * @param executor 图执行器实例
 * @param completedNodeIds 本超步已完成节点 id 列表
 */
function finishAllChannels(executor: GraphExecutor, completedNodeIds: string[]): void {
  if (completedNodeIds.length === 0) return

  for (const [, channel] of executor.channels) {
    if (channel instanceof NamedBarrierValue) {
      channel.update(completedNodeIds)
    }
  }
}

/**
 * 处理条件边：null 终止、'__end__' 写 end channel、字符串目标加入 pendingConditionalTargets
 * @param executor 图执行器实例
 * @param nodeId 当前节点 id
 * @param output 当前节点输出
 */
function processConditionalEdges(executor: GraphExecutor, nodeId: string, output: Record<string, any>): void {
  const condEdge = executor.compiled.params.conditionalEdges.get(nodeId)
  if (!condEdge) return

  const currentState = executor.readState()
  const target = condEdge.condition(currentState)

  if (target === null) return

  if (target === '__end__') {
    const endChannel = executor.channels.get('__end__')
    if (endChannel) endChannel.update([true])
    console.log(`[DEBUG][graph-executor] 条件边终止: ${nodeId} → __end__`)
    return
  }

  if (typeof target === 'string') {
    executor.pendingConditionalTargets.add(target)
    console.log(`[DEBUG][graph-executor] 条件边路由: ${nodeId} → ${target}`)
  }
}

/**
 * 更新指定节点的 versionsSeen：写入所有 channel 的当前版本号
 * @param executor 图执行器实例
 * @param nodeId 目标节点 id
 */
function updateVersionsSeen(executor: GraphExecutor, nodeId: string): void {
  const seen = executor.versionsSeen.get(nodeId)
  if (!seen) return

  for (const [channelName, channel] of executor.channels) {
    seen.set(channelName, channel.getVersion())
  }
}

/**
 * 追加步骤记录到 executor.stepRecords，不走 Channel
 * @param executor 图执行器实例
 * @param record 步骤记录
 */
function appendStepRecord(executor: GraphExecutor, record: any): void {
  executor.stepRecords.push(record)
}
