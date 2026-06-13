/** 图执行器调度模块：tick / prepareNextTasks / 触发判定 / 并行执行 / 重试
 *  拆分为模块函数，统一接收 executor 实例，避免 prototype 拆分导致的类型推断断裂 */

import type { NodeDefinition } from '../state-graph.ts'
import type { Task, SkippedNode, TaskResult } from './executor-types.ts'
import { NodeExecutionError, GraphInterrupt } from '../errors.ts'
import { getRetryDelay, defaultRetryOn, runWithConfig } from '../graph-utils.ts'
import type { GraphExecutor } from './graph-executor.ts'
import { applyWrites } from './executor-applier.ts'

/**
 * 执行一个超步：准备任务 → 并行执行 → 应用写入
 * @param executor 图执行器实例，承载状态/Channel/版本号等信息，不可为空
 * @returns 是否还有更多任务；critical 节点失败抛 NodeExecutionError
 */
export async function tick(executor: GraphExecutor): Promise<boolean> {
  const { tasks, skipped } = prepareNextTasks(executor)
  if (tasks.length === 0) return false

  if (skipped.length > 0) {
    console.log(`[DEBUG][graph-executor] skipWhen 命中:`, skipped.map(s => s.nodeId))
  }

  const results = await executeTasks(executor, tasks)
  applyWrites(executor, results)

  for (const result of results) {
    if (result.error) {
      const nodeDef = executor.compiled.params.nodes.get(result.nodeId)
      if (nodeDef?.critical) {
        throw new NodeExecutionError(result.nodeId, result.error)
      }
    }
  }

  return true
}

/**
 * 准备下一批待执行任务：综合 skipWhen / triggers / 边触发 / pendingConditionalTargets 判定
 * @param executor 图执行器实例
 * @returns 待执行任务与被跳过节点列表
 */
export function prepareNextTasks(executor: GraphExecutor): { tasks: Task[]; skipped: SkippedNode[] } {
  const tasks: Task[] = []
  const skipped: SkippedNode[] = []
  const { nodes } = executor.compiled.params

  for (const [nodeId, nodeDef] of nodes) {
    if (nodeDef.skipWhen) {
      const currentState = executor.readState()
      if (nodeDef.skipWhen(currentState)) {
        skipped.push({ nodeId, reason: 'skipWhen' })
        continue
      }
    }

    const wasRouted = executor.pendingConditionalTargets.has(nodeId)
    const triggeredByTriggersOrEdges = isNodeTriggered(executor, nodeId, nodeDef)

    if (!wasRouted && !triggeredByTriggersOrEdges) {
      continue
    }

    console.log(`[DEBUG][graph-executor] ${wasRouted ? '条件边路由' : '调度'}: ${nodeId}`)

    tasks.push({ nodeId, nodeDef, startedAt: Date.now() })
  }

  executor.pendingConditionalTargets.clear()

  return { tasks, skipped }
}

/**
 * 判断节点是否被触发：triggers 任一/全部上游 channel 升版，或被边触发
 * @param executor 图执行器实例
 * @param nodeId 目标节点 id
 * @param nodeDef 目标节点定义
 * @returns 是否触发
 */
function isNodeTriggered(executor: GraphExecutor, nodeId: string, nodeDef: NodeDefinition): boolean {
  // 条件边路由优先
  if (executor.pendingConditionalTargets.has(nodeId)) {
    return true
  }

  const triggers = nodeDef.triggers
  const seen = executor.versionsSeen.get(nodeId)

  if (triggers && triggers.length > 0) {
    const check = (t: string) => {
      const channel = executor.channels.get(t)
      if (!channel || !channel.isAvailable()) return false
      return channel.getVersion() > (seen?.get(t) ?? -1)
    }
    const triggered = nodeDef.triggerMode === 'all'
      ? triggers.every(check)
      : triggers.some(check)
    if (triggered) return true
  }

  return isTriggeredByEdges(executor, nodeId)
}

/**
 * 通过边关系判断节点被触发：任一上游 channel 在本超步升版即触发
 * @param executor 图执行器实例
 * @param nodeId 目标节点 id
 * @returns 是否被边触发
 */
function isTriggeredByEdges(executor: GraphExecutor, nodeId: string): boolean {
  const { edges } = executor.compiled.params
  const seen = executor.versionsSeen.get(nodeId)
  const incomingEdges = edges.filter(e => e.to === nodeId)
  if (incomingEdges.length === 0) return false

  return incomingEdges.some(e => {
    if (e.from === '__start__') {
      const startChannel = executor.channels.get('__start__')
      if (!startChannel || !startChannel.isAvailable()) return false
      return startChannel.getVersion() > (seen?.get('__start__') ?? -1)
    }
    // Barrier 边：上游全部完成时 channel 才升版
    if (e.from.startsWith('__barrier_')) {
      const barrierChannel = executor.channels.get(e.from)
      if (!barrierChannel || !barrierChannel.isAvailable()) return false
      return barrierChannel.getVersion() > (seen?.get(e.from) ?? -1)
    }
    // 普通节点：仅看 currentStepWrites，排除 stepRecords/errors 防死循环
    const upstreamWrites = executor.currentStepWrites.get(e.from)
    if (!upstreamWrites || upstreamWrites.size === 0) return false
    for (const ch of upstreamWrites) {
      if (ch === 'stepRecords' || ch === 'errors') continue
      const channel = executor.channels.get(ch)
      if (!channel || !channel.isAvailable()) continue
      if (channel.getVersion() > (seen?.get(ch) ?? -1)) return true
    }
    return false
  })
}

/**
 * 超步内并行执行一批任务，失败转为 TaskResult.error 不抛出
 * @param executor 图执行器实例
 * @param tasks 待执行任务列表
 * @returns 任务结果列表（成功/失败均包含）
 */
export async function executeTasks(executor: GraphExecutor, tasks: Task[]): Promise<TaskResult[]> {
  const results = await Promise.allSettled(
    tasks.map(task => executeTaskWithRetry(executor, task))
  )

  return results.map((result, i) => {
    const task = tasks[i]!
    if (result.status === 'fulfilled') {
      return result.value
    }
    return {
      nodeId: task.nodeId,
      output: {},
      error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
      duration: Date.now() - task.startedAt
    }
  })
}

/**
 * 带重试的任务执行：处理 interruptBefore/After、resultValidator、记忆快照回滚
 * @param executor 图执行器实例
 * @param task 单个调度任务
 * @returns 单任务执行结果
 */
async function executeTaskWithRetry(executor: GraphExecutor, task: Task): Promise<TaskResult> {
  const { nodeId, nodeDef } = task
  const policy = nodeDef.retryPolicy
  const maxAttempts = policy?.maxAttempts ?? 1
  const startedAt = Date.now()

  let lastError: Error | undefined
  let memorySnapshot: number | undefined

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (executor.runtime?.memoryManager && policy?.clearMemoryOnRetry !== false) {
        memorySnapshot = executor.runtime.memoryManager.snapshot()
      }

      if (executor.compiled.params.interruptBefore.includes(nodeId)) {
        throw new GraphInterrupt(`中断: ${nodeId} 执行前`)
      }

      const nodeInput = executor.readNodeInput(nodeDef)

      const output = await runWithConfig(
        { configurable: executor.config.configurable },
        () => nodeDef.fn(nodeInput, executor.runtime)
      )

      if (nodeDef.resultValidator) {
        const validationError = nodeDef.resultValidator(output, executor.readState())
        if (validationError) {
          throw new Error(validationError)
        }
      }

      if (executor.compiled.params.interruptAfter.includes(nodeId)) {
        throw new GraphInterrupt(`中断: ${nodeId} 执行后`)
      }

      return {
        nodeId,
        output: output ?? {},
        duration: Date.now() - startedAt
      }
    } catch (err: any) {
      lastError = err

      if (err instanceof GraphInterrupt) {
        throw err
      }

      if (policy?.retryOn && !policy.retryOn(err)) {
        break
      }
      if (!policy?.retryOn && !defaultRetryOn(err) && attempt > 0) {
        break
      }

      // 重试前回滚记忆到快照位置
      if (memorySnapshot !== undefined && executor.runtime?.memoryManager) {
        executor.runtime.memoryManager.clearAfter(memorySnapshot)
      }

      if (attempt < maxAttempts - 1 && policy) {
        const delay = getRetryDelay(attempt, policy)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }

  return {
    nodeId,
    output: {},
    error: lastError ?? new Error('未知错误'),
    duration: Date.now() - task.startedAt
  }
}
