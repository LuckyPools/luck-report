/** 图执行器核心：类定义 + 公共方法（execute/stream）+ 状态读写工具
 *  调度与写入分别拆到 executor-scheduler.ts / executor-applier.ts，以模块函数形式对外提供 */

import type { CompiledReportGraph, GraphExecutionResult } from '../state-graph.ts'
import type { NodeDefinition } from '../state-graph.ts'
import type { StateChannel } from '../channels.ts'
import type { StreamEvent } from '../stream-mode.ts'
import type { WorkflowRuntime } from '../runtime.ts'
import type { Task, SkippedNode, TaskResult, VersionsSeen } from './executor-types.ts'
import {
  LastValueChannel,
  AnyValueChannel,
  BinaryOperatorAggregateChannel,
  AppendChannel,
  EphemeralValueChannel,
  LastValueAfterFinishChannel,
  NamedBarrierValue
} from '../channels.ts'
import { GraphRecursionError, GraphInterrupt } from '../errors.ts'
import { resetInterruptCounter } from '../graph-utils.ts'
import { tick, prepareNextTasks, executeTasks } from './executor-scheduler.ts'
import { applyWrites } from './executor-applier.ts'

export type { Task, SkippedNode, TaskResult, VersionsSeen } from './executor-types.ts'

/**
 * 图执行器，参照 LangGraph PregelLoop，实现超步执行模型
 */
export class GraphExecutor {
  /** 已编译的图（只读） */
  public compiled: CompiledReportGraph
  /** 执行配置（configurable.runtime / recursionLimit / signal） */
  public config: {
    configurable?: Record<string, any>
    recursionLimit?: number
    signal?: AbortSignal
  }
  /** 工作流运行时（跨节点传递） */
  public runtime: WorkflowRuntime | undefined

  /** 节点外的全局 state（不通过 Channel 传递的字段） */
  public state: Record<string, any> = {}
  /** 本次执行的 Channel 映射 */
  public channels: Map<string, StateChannel<any>> = new Map()
  /** 节点 → 各 channel 已知版本 */
  public versionsSeen: VersionsSeen = new Map()
  /** 步骤记录累计 */
  public stepRecords: any[] = []
  /** 当前超步各节点真实写入的 channel 集合（用于下一轮边触发判定） */
  public currentStepWrites: Map<string, Set<string>> = new Map()
  /** 超步计数 */
  public superstepCount: number = 0
  /** 待路由的条件边目标节点（下一轮优先触发） */
  public pendingConditionalTargets: Set<string> = new Set()

  /**
   * 构造图执行器
   * @param compiled 已编译的图，不可为空
   * @param config 执行配置，可选
   */
  constructor(
    compiled: CompiledReportGraph,
    config?: { configurable?: Record<string, any>; recursionLimit?: number; signal?: AbortSignal }
  ) {
    this.compiled = compiled
    this.config = config ?? {}
    this.runtime = this.config.configurable?.runtime
  }

  /**
   * 执行图（完整运行），recursionLimit 默认 25
   * @returns 执行结果，包含最终 state / stepRecords / success / error
   */
  async execute(input: Record<string, any>): Promise<GraphExecutionResult> {
    this.initialize(input)

    const recursionLimit = this.config.recursionLimit ?? this.compiled.params.recursionLimit ?? 25

    try {
      while (this.superstepCount < recursionLimit) {
        if (this.config.signal?.aborted) {
          return this.buildResult(false, '用户中断执行')
        }

        const hasMore = await tick(this)
        if (!hasMore) break

        this.superstepCount++
      }

      if (this.superstepCount >= recursionLimit) {
        throw new GraphRecursionError(`图执行超过递归限制 ${recursionLimit}`)
      }

      return this.buildResult(true)
    } catch (err: any) {
      if (err instanceof GraphInterrupt) {
        return this.buildResult(false, '等待用户确认')
      }
      return this.buildResult(false, err.message)
    }
  }

  /**
   * 流式执行图（逐步 yield 事件），modes 默认 ['updates']
   */
  async *stream(input: Record<string, any>, modes: string[] = ['updates']): AsyncGenerator<StreamEvent> {
    console.log('[DEBUG][graph-executor] stream 开始 keys:', Object.keys(input || {}))
    this.initialize(input)

    const recursionLimit = this.config.recursionLimit ?? this.compiled.params.recursionLimit ?? 25

    try {
      while (this.superstepCount < recursionLimit) {
        if (this.config.signal?.aborted) break

        const { tasks, skipped } = prepareNextTasks(this)
        if (tasks.length === 0 && skipped.length === 0) break

        if (modes.includes('updates')) {
          for (const skip of skipped) {
            yield {
              mode: 'updates',
              event: {
                nodeId: skip.nodeId,
                output: {},
                status: 'skipped',
                error: `节点因 ${skip.reason} 被跳过`
              },
              timestamp: Date.now()
            }
          }
        }

        // 没有可执行任务但有跳过节点时，继续下一轮
        if (tasks.length === 0) break

        if (modes.includes('debug')) {
          yield {
            mode: 'debug',
            event: { type: 'superstep_start', message: `超步 ${this.superstepCount}`, data: { taskCount: tasks.length } },
            timestamp: Date.now()
          }
        }

        const results = await executeTasks(this, tasks)
        applyWrites(this, results)

        // 检查 critical 节点失败，命中则终止流
        let criticalError: string | null = null
        for (const result of results) {
          if (result.error) {
            const nodeDef = this.compiled.params.nodes.get(result.nodeId)
            if (nodeDef?.critical) {
              criticalError = `关键节点 [${result.nodeId}] 执行失败，终止工作流: ${result.error.message}`
              break
            }
          }
        }

        if (modes.includes('updates')) {
          for (const result of results) {
            yield {
              mode: 'updates',
              event: {
                nodeId: result.nodeId,
                output: result.output,
                status: result.error ? 'failed' : 'success',
                error: result.error?.message
              },
              timestamp: Date.now()
            }
          }
        }

        if (criticalError) {
          yield {
            mode: 'updates',
            event: { nodeId: '__graph__', output: {}, status: 'failed', error: criticalError },
            timestamp: Date.now()
          }
          break
        }

        if (modes.includes('values')) {
          yield {
            mode: 'values',
            event: { state: this.readState() },
            timestamp: Date.now()
          }
        }

        this.superstepCount++
      }
    } catch (err: any) {
      // yield __graph__ 失败事件，确保 event-compat 层能收到终止信号
      yield {
        mode: 'updates',
        event: { nodeId: '__graph__', output: {}, status: 'failed', error: err.message },
        timestamp: Date.now()
      }
      if (modes.includes('debug')) {
        yield {
          mode: 'debug',
          event: { type: 'superstep_end', message: `执行异常: ${err.message}` },
          timestamp: Date.now()
        }
      }
    }
  }

  /**
   * 初始化执行状态：克隆 Channel、注入 input、为每个节点预填 versionsSeen
   */
  initialize(input: Record<string, any>): void {
    resetInterruptCounter()

    for (const [name, channel] of this.compiled.params.channels) {
      this.channels.set(name, this.cloneChannel(channel))
    }

    if (this.runtime?.setChannelMap) {
      this.runtime.setChannelMap(this.channels)
      console.log(`[DEBUG][graph-executor] initialize channels=${this.channels.size}`)
    }

    for (const [key, value] of Object.entries(input)) {
      const channel = this.channels.get(key)
      if (channel) {
        channel.update([value])
      } else {
        this.state[key] = value
      }
    }

    const startChannel = this.channels.get('__start__')

    for (const [nodeName, nodeDef] of this.compiled.params.nodes) {
      const seenMap = new Map<string, number>()
      for (const triggerName of nodeDef.triggers ?? []) {
        const ch = this.channels.get(triggerName)
        if (ch) {
          seenMap.set(triggerName, ch.getVersion())
        } else {
          seenMap.set(triggerName, -1)
        }
      }
      const incomingEdges = this.compiled.params.edges.filter(e => e.to === nodeName)
      for (const edge of incomingEdges) {
        if (edge.from === '__start__' && startChannel) {
          seenMap.set('__start__', startChannel.getVersion())
        } else {
          for (const chName of this.getChannelsWrittenByNode(edge.from)) {
            const ch = this.channels.get(chName)
            if (ch && !seenMap.has(chName)) {
              seenMap.set(chName, ch.getVersion())
            }
          }
        }
      }
      this.versionsSeen.set(nodeName, seenMap)
    }

    if (startChannel) {
      startChannel.update([input])
    }
  }

  /**
   * 读取当前完整状态快照：合并 this.state 与所有可用 Channel 值（排除系统/Barrier channel）
   */
  readState(): Record<string, any> {
    const state: Record<string, any> = { ...this.state }
    for (const [key, channel] of this.channels) {
      if (channel.isAvailable() && key !== '__start__' && key !== '__end__' && !key.startsWith('__barrier_')) {
        const value = channel.get()
        if (value !== null) {
          state[key] = value
        }
      }
    }
    return state
  }

  /**
   * 读取节点输入（按 nodeDef.input 白名单过滤）
   */
  readNodeInput(nodeDef: NodeDefinition): Record<string, any> {
    const fullState = this.readState()
    if (!nodeDef.input) return fullState

    const filtered: Record<string, any> = {}
    for (const [key, included] of Object.entries(nodeDef.input)) {
      if (included && key in fullState) {
        filtered[key] = fullState[key]
      }
    }
    return filtered
  }

  /**
   * 获取节点真实写入的 Channel 列表（output 白名单 + outChannelName），用于预填 versionsSeen
   */
  getChannelsWrittenByNode(nodeId: string): string[] {
    const nodeDef = this.compiled.params.nodes.get(nodeId)
    if (!nodeDef) return []

    const result = new Set<string>()
    if (nodeDef.output) {
      for (const [k, v] of Object.entries(nodeDef.output)) {
        if (v === true) result.add(k)
      }
    }
    if (nodeDef.outChannelName) {
      result.add(nodeDef.outChannelName)
    }
    return Array.from(result)
  }

  /**
   * 克隆 Channel 实例（每次执行独立）；初始值由 stateSchema.initial 提供
   */
  cloneChannel(channel: StateChannel<any>): StateChannel<any> {
    if (channel instanceof LastValueChannel) return new LastValueChannel()
    if (channel instanceof AnyValueChannel) return new AnyValueChannel()
    if (channel instanceof BinaryOperatorAggregateChannel) {
      // 重新构造以避免多次执行间状态串台
      return new BinaryOperatorAggregateChannel(channel._operator, channel._initialValue)
    }
    if (channel instanceof AppendChannel) return new AppendChannel()
    if (channel instanceof EphemeralValueChannel) return new EphemeralValueChannel()
    if (channel instanceof LastValueAfterFinishChannel) return new LastValueAfterFinishChannel()
    if (channel instanceof NamedBarrierValue) {
      return new NamedBarrierValue((channel as NamedBarrierValue).getWatchedNodes())
    }
    return channel
  }

  /**
   * 构建执行结果：合并 state + stepRecords + success/error
   */
  buildResult(success: boolean, error?: string): GraphExecutionResult {
    return {
      state: this.readState(),
      stepRecords: this.stepRecords,
      success,
      error
    }
  }
}
