/**
 * 图执行器
 * 参照 LangGraph Pregel 超步模型
 *
 * 核心机制：
 * 1. tick()：单步执行循环（准备任务 → 执行任务 → 应用写入 → 检查是否需要下一步）
 * 2. prepareNextTasks()：只有当上游 Channel 有新版本数据时，下游节点才会被调度
 * 3. applyWrites()：节点输出必须成功写入 Channel，下游才能读取
 * 4. versionsSeen：跟踪每个节点对每个 Channel 看到的版本号，防止重入
 * 5. 失败不写业务 Channel：节点失败时 return {}，下游不触发
 */

import type { CompiledReportGraph, GraphExecutionResult } from './state-graph'
import type { NodeDefinition, ConditionalEdge } from './state-graph'
import type { StateChannel } from './channels'
import type { RetryPolicy } from './graph-utils'
import type { StreamEvent } from './stream-mode'
import type { WorkflowRuntime } from './runtime'
import {
  LastValueChannel,
  AnyValueChannel,
  BinaryOperatorAggregateChannel,
  AppendChannel,
  EphemeralValueChannel,
  LastValueAfterFinishChannel,
  NamedBarrierValue
} from './channels'
import { GraphRecursionError, NodeExecutionError, GraphInterrupt } from './errors'
import { getRetryDelay, defaultRetryOn, runWithConfig, resetInterruptCounter } from './graph-utils'

/** 任务定义 */
interface Task {
  nodeId: string
  nodeDef: NodeDefinition
  startedAt: number
}

/** P2-2：跳过的节点记录 */
interface SkippedNode {
  nodeId: string
  reason: 'skipWhen' | 'not_triggered'
}

/** 任务执行结果 */
interface TaskResult {
  nodeId: string
  output: Record<string, any>
  error?: Error
  duration: number
}

/** 版本追踪 */
type VersionsSeen = Map<string, Map<string, number>>

/**
 * 图执行器
 * 参照 LangGraph PregelLoop，实现超步执行模型
 */
export class GraphExecutor {
  private compiled: CompiledReportGraph
  private config: {
    configurable?: Record<string, any>
    recursionLimit?: number
    signal?: AbortSignal
  }
  private runtime: WorkflowRuntime | undefined

  /** 全局状态 */
  private state: Record<string, any> = {}
  /** Channel 实例（编译时创建，运行时读写） */
  private channels: Map<string, StateChannel<any>> = new Map()
  /** 版本追踪：每个节点对每个 Channel 看到的版本号 */
  private versionsSeen: VersionsSeen = new Map()
  /** 步骤执行记录 */
  private stepRecords: any[] = []
  /**
   * 上一超步的"节点→写入 channel 集合"映射
   * 仅记录真实写入（通过 applyWrites 收集），不含 stepRecords / errors 等系统/追踪 channel
   * 用于 isTriggeredByEdges 判定边触发：
   *   边 (A -> B) 触发 ⇔ ∃ channel C ∈ currentStepWrites[A] 且 C.version > B.seen[C]
   * 关键：与 LangGraph pregel._prepare_next_tasks 的"task.writes"语义对齐
   */
  private currentStepWrites: Map<string, Set<string>> = new Map()
  /** 超步计数 */
  private superstepCount: number = 0
  /**
   * 条件边路由目标集合
   * 上一轮 applyWrites 阶段 processConditionalEdges 把命中的目标节点加入此集合，
   * 下一轮 prepareNextTasks 通过 isNodeTriggered 把这些节点作为触发条件之一调度
   * 解决：原实现把"目标节点名"当 channel 名去 this.channels.get(target)，
   *       找不到就静默不更新，导致条件边路由断开
   */
  private pendingConditionalTargets: Set<string> = new Set()

  /**
   * 构造图执行器
   * @param compiled - 编译后的图，CompiledReportGraph，不可为空
   * @param config - 运行时配置，可选
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
   * 执行图（完整运行）
   * @param input - 初始状态，Record<string, any>，不可为空
   * @returns 图执行结果，Promise<GraphExecutionResult>
   */
  async execute(input: Record<string, any>): Promise<GraphExecutionResult> {
    this.initialize(input)

    const recursionLimit = this.config.recursionLimit ?? this.compiled.params.recursionLimit ?? 25

    try {
      while (this.superstepCount < recursionLimit) {
        // 检查中断信号
        if (this.config.signal?.aborted) {
          return this.buildResult(false, '用户中断执行')
        }

        // 执行一个超步
        const hasMore = await this.tick()
        if (!hasMore) break

        this.superstepCount++
      }

      if (this.superstepCount >= recursionLimit) {
        throw new GraphRecursionError(`图执行超过递归限制 ${recursionLimit}`)
      }

      return this.buildResult(true)
    } catch (err: any) {
      if (err instanceof GraphInterrupt) {
        // 人机中断，不是错误，返回当前状态
        return this.buildResult(false, '等待用户确认')
      }
      return this.buildResult(false, err.message)
    }
  }

  /**
   * 流式执行图（逐步 yield 事件）
   * @param input - 初始状态，Record<string, any>，不可为空
   * @param modes - 流模式列表，string[]，不可为空
   * @returns 异步生成器，逐步产出流事件
   */
  async *stream(input: Record<string, any>, modes: string[] = ['updates']): AsyncGenerator<StreamEvent> {
    console.log('[DEBUG][graph-executor] stream 开始 keys:', Object.keys(input || {}))
    this.initialize(input)

    const recursionLimit = this.config.recursionLimit ?? this.compiled.params.recursionLimit ?? 25

    try {
      while (this.superstepCount < recursionLimit) {
        if (this.config.signal?.aborted) break

        // 准备任务
        const { tasks, skipped } = this.prepareNextTasks()
        if (tasks.length === 0 && skipped.length === 0) break

        // P2-2：yield 跳过事件
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

        // yield 调试事件
        if (modes.includes('debug')) {
          yield {
            mode: 'debug',
            event: { type: 'superstep_start', message: `超步 ${this.superstepCount}`, data: { taskCount: tasks.length } },
            timestamp: Date.now()
          }
        }

        // 执行任务
        const results = await this.executeTasks(tasks)

        // 应用写入
        this.applyWrites(results)

        // P0-1：检查是否有 critical 节点失败，终止流
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

        // yield 更新事件
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

        // critical 失败终止
        if (criticalError) {
          yield {
            mode: 'updates',
            event: { nodeId: '__graph__', output: {}, status: 'failed', error: criticalError },
            timestamp: Date.now()
          }
          break
        }

        // yield 完整状态快照
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
   * 初始化执行状态
   * @param input - 初始状态，Record<string, any>，不可为空
   */
  private initialize(input: Record<string, any>): void {
    // 重置中断计数器
    resetInterruptCounter()

    // 克隆 Channel 实例（每次执行独立）
    for (const [name, channel] of this.compiled.params.channels) {
      this.channels.set(name, this.cloneChannel(channel))
    }

    // P0-6：把当前执行的 Channel 映射注入到 runtime
    // 解决 LLMDecideNode 持有构建期引用 → cloneChannel 后引用断裂的问题
    // 必须放在 cloneChannel 之后，确保节点通过 runtime.getChannel() 拿到的是执行期实例
    if (this.runtime?.setChannelMap) {
      this.runtime.setChannelMap(this.channels)
      // [诊断] 状态变化：channelMap 被覆写，立即打印 channel 数 + plan_tasks_out 是否存在
      // 单次 execute 最多打 2-3 次（主图 1 次 + 子图 N 次），不构成高频日志
      console.log(`[DEBUG][graph-executor] initialize channels=${this.channels.size}`)
    }

    // 写入初始状态到 Channel
    for (const [key, value] of Object.entries(input)) {
      const channel = this.channels.get(key)
      if (channel) {
        channel.update([value])
      } else {
        // 没有 Channel 的字段直接存到 state
        this.state[key] = value
      }
    }

    // P1-5：取 __start__ Channel 引用
    // 注意：必须在版本追踪初始化之前取引用，但 update() 调用放在版本初始化之后
    // 原因：__start__ 节点的 seenVersion 应为 0（即 update 之前的版本），
    //      然后 update() 把它升到 1，触发判断 `1 > 0 = true` 才会真正触发这些节点
    const startChannel = this.channels.get('__start__')

    // 初始化版本追踪（必须在 startChannel.update 之前）
    // [修复] 旧实现用 new Map() 初始化，seenVersion 默认 -1，
    //       但 binop/append 等带 initial 值的 Channel 启动时 version=0，
    //       触发判断 `0 > -1 = true` 会让节点在第一次写之前就误触发。
    //       修复：把每个节点对其 trigger Channel 的 seenVersion
    //       预置为 Channel 当前版本号（即"已见过"），后续真正写入时 version++ 才会触发。
    for (const [nodeName, nodeDef] of this.compiled.params.nodes) {
      const seenMap = new Map<string, number>()
      for (const triggerName of nodeDef.triggers ?? []) {
        const ch = this.channels.get(triggerName)
        if (ch) {
          seenMap.set(triggerName, ch.getVersion())
        } else {
          // Channel 不存在时退回到 -1 行为（保留旧逻辑的容错）
          seenMap.set(triggerName, -1)
        }
      }
      // 边触发（__start__ + 上游 Channel）也需要预置版本
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

    // P1-5：触发 __start__ Channel，写入初始 state 而非 true
    // __start__ 是 EphemeralValueChannel，写入后下游节点可通过版本号检测到触发
    // 必须在版本追踪初始化之后调用，否则 __start__ trigger 节点的 seenVersion 会读到更新后的 version（1）而非 0
    if (startChannel) {
      startChannel.update([input])
    }
  }

  /**
   * 执行一个超步
   * P0-1 修正：critical 节点失败时终止整个图
   * superstepCount 仅在 execute() 的 while 循环里自增一次，避免与历史实现双增导致日志 superstep 跳号
   * @returns 是否还有更多任务需要执行，boolean
   * @throws NodeExecutionError critical 节点失败时抛出
   */
  private async tick(): Promise<boolean> {
    const { tasks, skipped } = this.prepareNextTasks()
    if (tasks.length === 0) return false

    // P2-2：记录跳过节点的步骤记录
    // [修复] skipWhen 跳过的节点 = 当前意图下根本不会执行（如 modify_report 场景下的 search_business）。
    // 把它们以 'cancelled' 状态写入 stepRecords 会让 UI 渲染出"灰色未跑"的步骤，干扰用户对真实执行计划的判断。
    // 这里不再写入，让 UI 只展示真正执行过的节点。
    if (skipped.length > 0) {
      console.log(`[DEBUG][graph-executor] skipWhen 命中:`, skipped.map(s => s.nodeId))
    }

    const results = await this.executeTasks(tasks)
    this.applyWrites(results)

    // P0-1：检查是否有 critical 节点失败
    for (const result of results) {
      if (result.error) {
        const nodeDef = this.compiled.params.nodes.get(result.nodeId)
        if (nodeDef?.critical) {
          throw new NodeExecutionError(
            `关键节点 [${result.nodeId}] 执行失败，终止工作流: ${result.error.message}`
          )
        }
      }
    }

    return true
  }

  /**
   * 准备下一批待执行的任务
   * 参照 LangGraph _prepareNextTasks：只有当上游 Channel 有新版本数据时，下游节点才会被调度
   * P2-2：同时返回被 skipWhen 跳过的节点列表
   * @returns 待执行任务列表和跳过节点列表
   */
  private prepareNextTasks(): { tasks: Task[]; skipped: SkippedNode[] } {
    const tasks: Task[] = []
    const skipped: SkippedNode[] = []
    const { nodes, edges, conditionalEdges, adjacency } = this.compiled.params

    for (const [nodeId, nodeDef] of nodes) {
      // 1. 检查 skipWhen
      if (nodeDef.skipWhen) {
        const currentState = this.readState()
        if (nodeDef.skipWhen(currentState)) {
          // P2-2：记录跳过事件
          skipped.push({ nodeId, reason: 'skipWhen' })
          continue
        }
      }

      // 2. 检查是否被触发（P1-2：已内含版本判断，不再需要 hasSeenCurrentVersions）
      const wasRouted = this.pendingConditionalTargets.has(nodeId)
      const triggeredByTriggersOrEdges = this.isNodeTriggered(nodeId, nodeDef)

      if (!wasRouted && !triggeredByTriggersOrEdges) {
        continue
      }

      console.log(`[DEBUG][graph-executor] ${wasRouted ? '条件边路由' : '调度'}: ${nodeId}`)

      tasks.push({ nodeId, nodeDef, startedAt: Date.now() })
    }

    // [修复] 条件边路由集合在本轮消费后清空，避免污染下一超步
    // 清空后 isNodeTriggered 中此集合检查自动失效，节点回归正常 channel 触发判断
    this.pendingConditionalTargets.clear()

    return { tasks, skipped }
  }

  /**
   * 判断节点是否被触发
   * P1-2 修正：统一版本判断逻辑，不再依赖外部 hasSeenCurrentVersions
   * 只有 Channel 有新版本数据（version > seenVersion）时才认为被触发
   *
   * @param nodeId - 节点ID，string，不可为空
   * @param nodeDef - 节点定义，NodeDefinition，不可为空
   * @returns 是否被触发，boolean
   */
  private isNodeTriggered(nodeId: string, nodeDef: NodeDefinition): boolean {
    // [修复] 条件边路由优先：上一轮 processConditionalEdges 把目标加入此集合，
    // 只要在本集合内就认为被触发，不再依赖“伪 channel” update 这种走不通的旧路
    if (this.pendingConditionalTargets.has(nodeId)) {
      return true
    }
  
    const triggers = nodeDef.triggers
    const seen = this.versionsSeen.get(nodeId)
  
    // 1) triggers 触发判断（不直接 return，下面继续看边）
    let triggeredByTriggers = false
    if (triggers && triggers.length > 0) {
      const check = (t: string) => {
        const channel = this.channels.get(t)
        if (!channel || !channel.isAvailable()) return false
        // P1-2：严格版本判断，只有 version > seenVersion 才算新数据
        return channel.getVersion() > (seen?.get(t) ?? -1)
      }
      triggeredByTriggers = nodeDef.triggerMode === 'all'
        ? triggers.every(check)
        : triggers.some(check)
      if (triggeredByTriggers) return true
    }
  
    // 2) 边触发判断
    return this.isTriggeredByEdges(nodeId)
  }

  /**
   * 通过边关系判断节点是否被触发
   * 参照 LangGraph pregel._prepare_next_tasks：
   * 边 (A -> B) 触发 ⇔ A 在上一超步真实写入了某些 channel C，且 C 的当前版本 > B 已见的 C 版本
   * 旧实现用 getChannelsWrittenByNode 返回"所有非系统 channel"，导致 stepRecords 这类
   * 每超步必升版的 channel 把边触发判定污染成永远 true，引发死循环
   * @param nodeId - 节点ID，string，不可为空
   * @returns 是否被触发，boolean
   */
  private isTriggeredByEdges(nodeId: string): boolean {
    const { edges } = this.compiled.params
    const seen = this.versionsSeen.get(nodeId)
    // 查找所有指向此节点的边
    const incomingEdges = edges.filter(e => e.to === nodeId)
    if (incomingEdges.length === 0) return false

    // 任一上游节点的输出 Channel 有新版本数据即触发
    return incomingEdges.some(e => {
      if (e.from === '__start__') {
        const startChannel = this.channels.get('__start__')
        if (!startChannel || !startChannel.isAvailable()) return false
        return startChannel.getVersion() > (seen?.get('__start__') ?? -1)
      }
      // Barrier 边（addEdge([a,b], target) 产生 __barrier_xxx_yyy 节点）
      // 直接检查 NamedBarrierValue channel 的版本号：上游全部完成时它才升版
      if (e.from.startsWith('__barrier_')) {
        const barrierChannel = this.channels.get(e.from)
        if (!barrierChannel || !barrierChannel.isAvailable()) return false
        return barrierChannel.getVersion() > (seen?.get(e.from) ?? -1)
      }
      // 普通节点：只看它在上一超步真实写入过的 channel 集合（currentStepWrites）
      // 排除 stepRecords / errors 这类系统/追踪 channel，避免死循环
      const upstreamWrites = this.currentStepWrites.get(e.from)
      if (!upstreamWrites || upstreamWrites.size === 0) return false
      for (const ch of upstreamWrites) {
        // 防御：即便 currentStepWrites 中混入，也再过滤一次
        if (ch === 'stepRecords' || ch === 'errors') continue
        const channel = this.channels.get(ch)
        if (!channel || !channel.isAvailable()) continue
        if (channel.getVersion() > (seen?.get(ch) ?? -1)) return true
      }
      return false
    })
  }

  /**
   * 执行一批任务（超步内并行）
   * @param tasks - 任务列表，Task[]，不可为空
   * @returns 任务执行结果列表，TaskResult[]
   */
  private async executeTasks(tasks: Task[]): Promise<TaskResult[]> {
    const results = await Promise.allSettled(
      tasks.map(task => this.executeTaskWithRetry(task))
    )

    return results.map((result, i) => {
      const task = tasks[i]
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
   * 带重试的任务执行
   * @param task - 任务定义，Task，不可为空
   * @returns 任务执行结果，Promise<TaskResult>
   */
  private async executeTaskWithRetry(task: Task): Promise<TaskResult> {
    const { nodeId, nodeDef } = task
    const policy = nodeDef.retryPolicy
    const maxAttempts = policy?.maxAttempts ?? 1
    const startedAt = Date.now()

    let lastError: Error | undefined
    let memorySnapshot: number | undefined

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // P0-4：重试前保存记忆快照（首次执行前也保存，用于失败回滚）
        if (this.runtime?.memoryManager && policy?.clearMemoryOnRetry !== false) {
          memorySnapshot = this.runtime.memoryManager.snapshot()
        }

        // 检查 interruptBefore
        if (this.compiled.params.interruptBefore.includes(nodeId)) {
          throw new GraphInterrupt(`中断: ${nodeId} 执行前`)
        }

        // 读取节点输入（根据 input schema 过滤）
        const nodeInput = this.readNodeInput(nodeDef)

        // 在请求作用域内执行节点函数
        const output = await runWithConfig(
          { configurable: this.config.configurable },
          () => nodeDef.fn(nodeInput, this.runtime)
        )

        // 业务结果校验
        if (nodeDef.resultValidator) {
          const validationError = nodeDef.resultValidator(output, this.readState())
          if (validationError) {
            throw new Error(validationError)
          }
        }

        // 检查 interruptAfter
        if (this.compiled.params.interruptAfter.includes(nodeId)) {
          throw new GraphInterrupt(`中断: ${nodeId} 执行后`)
        }

        return {
          nodeId,
          output: output ?? {},
          duration: Date.now() - startedAt
        }
      } catch (err: any) {
        lastError = err

        // GraphInterrupt 不重试
        if (err instanceof GraphInterrupt) {
          throw err
        }

        // 判断是否值得重试
        if (policy?.retryOn && !policy.retryOn(err)) {
          break
        }
        if (!policy?.retryOn && !defaultRetryOn(err) && attempt > 0) {
          break
        }

        // P0-4：重试前回滚记忆到快照位置，清除失败产生的工具结果
        if (memorySnapshot !== undefined && this.runtime?.memoryManager) {
          this.runtime.memoryManager.clearAfter(memorySnapshot)
        }

        // 等待退避时间
        if (attempt < maxAttempts - 1 && policy) {
          const delay = getRetryDelay(attempt, policy)
          await new Promise(r => setTimeout(r, delay))
        }
      }
    }

    // 所有重试耗尽
    return {
      nodeId,
      output: {},
      error: lastError ?? new Error('未知错误'),
      duration: Date.now() - startedAt
    }
  }

  /**
   * 应用写入：将节点输出写入 Channel
   * 同时维护 currentStepWrites：记录本超步"哪个节点写入了哪些 channel"
   * isTriggeredByEdges 下一轮用它来判定边触发（替代旧的"返回所有非系统 channel"实现）
   * @param results - 任务执行结果列表，TaskResult[]，不可为空
   */
  private applyWrites(results: TaskResult[]): void {
    // 每轮重写：currentStepWrites 只反映"上一超步"真实写入，不累积历史
    this.currentStepWrites.clear()
    const completedNodeIds: string[] = []
    console.log(`[DEBUG][graph-executor] applyWrites superstep=${this.superstepCount} nodes=${results.map(r => r.nodeId).join(',')}`)

    for (const result of results) {
      const { nodeId, output, error } = result

      if (error) {
        // 失败：不写业务 Channel，但写轨迹 Channel 和错误 Channel
        this.applyFailureWrites(nodeId, error)
        continue
      }

      const nodeDef = this.compiled.params.nodes.get(nodeId)
      const outputFilter = nodeDef?.output

      // [修复] 子图节点返回 result.state 含全量字段（searchResults/datasources/datasets 等），
      // 若全量回写到主图 channels，会抬高上游 channel version，触发已被消费过的上游节点重跑
      // （典型症状：plan_tasks 在 modify_cell_subgraph 之后被二次触发，但此时 runtime.channelMap
      //   又被子图覆盖，导致 LLMDecideNode 找不到自己的 outChannel 抛错）
      // 解决：若节点声明了 output schema，仅写白名单字段；未声明则保持全量写（兼容普通 LLMDecideNode）
      let keysToWrite = Object.keys(output ?? {})
      if (outputFilter) {
        const allowed = keysToWrite.filter(k => outputFilter[k] === true)
        const dropped = keysToWrite.filter(k => outputFilter[k] !== true)
        if (dropped.length > 0) {
          console.log(`[DEBUG][graph-executor] ${nodeId} output 过滤 丢弃:`, dropped)
        }
        keysToWrite = allowed
      }

      // 收集本节点真实写入的 channel 集合（不含 stepRecords/errors 等系统/追踪 channel）
      const writesSet = new Set<string>()

      // 成功：将过滤后的输出写入对应 Channel
      for (const key of keysToWrite) {
        const value = output[key]
        const channel = this.channels.get(key)
        if (channel) {
          // LastValueAfterFinishChannel 需要显式 finish()
          if (channel instanceof LastValueAfterFinishChannel) {
            channel.update([value])
            channel.finish()
          } else {
            channel.update([value])
          }
          // 排除 stepRecords / errors 这类系统/追踪 channel 不参与边触发判定
          if (key !== 'stepRecords' && key !== 'errors') {
            writesSet.add(key)
          }
        }
        // 同时更新 state（供 readState 使用）
        this.state[key] = value
      }

      // LLMDecideNode 的 outChannelName：节点 invoke() 内部已通过 stage()+finish() 写入
      // 这里不重复写 channel，但要纳入 currentStepWrites 供下游边判定识别
      const outChannelName = nodeDef?.outChannelName
      if (outChannelName) {
        writesSet.add(outChannelName)
      }

      this.currentStepWrites.set(nodeId, writesSet)

      // 记录已完成节点
      completedNodeIds.push(nodeId)

      // 更新版本追踪
      this.updateVersionsSeen(nodeId)

      // 写入步骤记录
      this.appendStepRecord({
        stepId: nodeId,
        stepName: this.compiled.params.nodes.get(nodeId)?.metadata?.description ?? nodeId,
        status: 'completed',
        duration: result.duration,
        timestamp: Date.now()
      })

      // 处理条件边
      this.processConditionalEdges(nodeId, output)
    }

    // P1-3：通知所有 NamedBarrierValue Channel 已完成的节点
    // addEdge([nodes], target) 创建的 Barrier 依赖上游节点全部完成才触发下游
    this.finishAllChannels(completedNodeIds)
  }

  /**
   * 应用失败写入：不写业务 Channel，但写轨迹和错误 Channel
   * @param nodeId - 节点ID，string，不可为空
   * @param error - 错误，Error，不可为空
   */
  private applyFailureWrites(nodeId: string, error: Error): void {
    // 写入错误 Channel
    const errorsChannel = this.channels.get('errors')
    if (errorsChannel) {
      errorsChannel.update([[error.message]])
    }

    // 写入步骤记录（无论成败都写）
    this.appendStepRecord({
      stepId: nodeId,
      stepName: this.compiled.params.nodes.get(nodeId)?.metadata?.description ?? nodeId,
      status: 'error',
      error: error.message,
      timestamp: Date.now()
    })

    // 更新版本追踪（即使失败也要更新，防止重入）
    this.updateVersionsSeen(nodeId)
  }

  /**
   * P1-3：通知所有 NamedBarrierValue Channel 已完成的节点
   * addEdge([nodes], target) 创建的 Barrier 依赖上游节点全部完成才触发下游
   * 每次超步结束后调用，将成功完成的节点 ID 喂入所有 Barrier Channel
   *
   * @param completedNodeIds - 本轮成功完成的节点 ID 列表，string[]，不可为空
   */
  private finishAllChannels(completedNodeIds: string[]): void {
    if (completedNodeIds.length === 0) return

    for (const [name, channel] of this.channels) {
      if (channel instanceof NamedBarrierValue) {
        channel.update(completedNodeIds)
      }
    }
  }

  /**
   * 处理条件边
   * @param nodeId - 源节点ID，string，不可为空
   * @param output - 节点输出，Record<string, any>，不可为空
   */
  private processConditionalEdges(nodeId: string, output: Record<string, any>): void {
    const condEdge = this.compiled.params.conditionalEdges.get(nodeId)
    if (!condEdge) return

    const currentState = this.readState()
    const target = condEdge.condition(currentState)

    if (target === null) {
      // null 表示终止
      return
    }

    if (target === '__end__') {
      // 终止信号：写 __end__ channel，下游 prepareNextTasks 看到已终止不再调度新节点
      const endChannel = this.channels.get('__end__')
      if (endChannel) endChannel.update([true])
      console.log(`[DEBUG][graph-executor] 条件边终止: ${nodeId} → __end__`)
      return
    }
    
    if (typeof target === 'string') {
      // [修复] 原实现把“目标节点名”当 channel 名去 this.channels.get(target)，
      // 找不到就静默不更新，导致条件边路由（plan_tasks → modify_cell_subgraph 等）整条断开，
      // 全部依赖节点自带 triggers “侥幸”跑通
      // 新实现：把目标加入 pendingConditionalTargets，下一轮 isNodeTriggered 把它作为触发条件之一
      this.pendingConditionalTargets.add(target)
      console.log(`[DEBUG][graph-executor] 条件边路由: ${nodeId} → ${target}`)
    }
    // Command 和 Send 的处理在后续迭代中完善
  }

  /**
   * 读取节点输入（根据 input schema 过滤）
   * @param nodeDef - 节点定义，NodeDefinition，不可为空
   * @returns 过滤后的状态子集，Record<string, any>
   */
  private readNodeInput(nodeDef: NodeDefinition): Record<string, any> {
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
   * 读取当前完整状态
   * @returns 当前状态快照，Record<string, any>
   */
  private readState(): Record<string, any> {
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
   * 更新版本追踪
   * @param nodeId - 节点ID，string，不可为空
   */
  private updateVersionsSeen(nodeId: string): void {
    const seen = this.versionsSeen.get(nodeId)
    if (!seen) return

    for (const [channelName, channel] of this.channels) {
      seen.set(channelName, channel.getVersion())
    }
  }

  /**
   * 获取节点真实写入的 Channel 列表
   * 用于 initialize() 预填 versionsSeen，保证节点首次执行时 seen 与 channel.getVersion() 对齐
   * 判定依据（按优先级合并）：
   *   1. nodeDef.output 白名单：声明了就一定写（最准确）
   *   2. nodeDef.outChannelName：LLMDecideNode 的主输出 channel
   *   3. 节点返回值的 keys：函数节点实际写入的 key（运行时才能确定，无法在 initialize 阶段获得）
   *      → 兜底：声明的 output 白名单 + outChannelName 已能覆盖 99% 场景
   * 关键：旧的"返回所有非系统 channel"实现把 stepRecords 这类不归本节点管的 channel 错算进来
   *      → initialize 后 seen[stepRecords] 被设为大版本号，下游边触发条件永远成立 → 死循环
   * @param nodeId - 节点ID，string，不可为空
   * @returns Channel 名称列表，string[]
   */
  private getChannelsWrittenByNode(nodeId: string): string[] {
    const nodeDef = this.compiled.params.nodes.get(nodeId)
    if (!nodeDef) return []

    const result = new Set<string>()

    // 1) 声明的 output 白名单
    if (nodeDef.output) {
      for (const [k, v] of Object.entries(nodeDef.output)) {
        if (v === true) result.add(k)
      }
    }

    // 2) LLMDecideNode 的主输出 channel
    if (nodeDef.outChannelName) {
      result.add(nodeDef.outChannelName)
    }

    return Array.from(result)
  }

  /**
   * 获取指向节点的入边对应的 Channel
   * @param nodeId - 节点ID，string，不可为空
   * @returns Channel 名称列表，string[]
   */
  private getIncomingChannels(nodeId: string): string[] {
    const { edges } = this.compiled.params
    const incoming = edges.filter(e => e.to === nodeId)
    return incoming.map(e => e.from === '__start__' ? '__start__' : e.from)
  }

  /**
   * 追加步骤记录
   * @param record - 步骤记录，不可为空
   */
  private appendStepRecord(record: any): void {
    this.stepRecords.push(record)
    // [修复] stepRecords 不再走 Channel：它是图内部的执行轨迹，与业务状态无关
    // 历史实现把它当成普通 channel，每超步 update 升版会被边触发判定误用 → 死循环
    // UI 只读 this.stepRecords 即可
  }

  /**
   * 克隆 Channel 实例（每次执行独立）
   * @param channel - 原始 Channel，StateChannel，不可为空
   * @returns 克隆后的 Channel，StateChannel
   */
  private cloneChannel(channel: StateChannel<any>): StateChannel<any> {
    // Channel 不可直接克隆，返回同类型的新实例
    // 初始值由 stateSchema 的 initial 字段提供
    if (channel instanceof LastValueChannel) return new LastValueChannel()
    if (channel instanceof AnyValueChannel) return new AnyValueChannel()
    if (channel instanceof BinaryOperatorAggregateChannel) {
      // P0-5：用 operator 和 initial 重新构造，避免多次执行间状态串台
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
   * 构建执行结果
   * @param success - 是否成功，boolean，不可为空
   * @param error - 错误信息，string，可选
   * @returns 图执行结果，GraphExecutionResult
   */
  private buildResult(success: boolean, error?: string): GraphExecutionResult {
    return {
      state: this.readState(),
      stepRecords: this.stepRecords,
      success,
      error
    }
  }
}
