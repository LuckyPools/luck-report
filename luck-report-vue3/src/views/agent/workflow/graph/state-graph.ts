/**
 * 图构建器
 * 参照 LangGraph StateGraph 设计
 *
 * 核心改进：
 * 1. 节点间通过 Channel 传递数据，而非直接引用 stepResults
 * 2. 边（Edge）决定执行顺序，条件边支持路由
 * 3. 编译时校验图的完整性（无孤立节点、无断边）
 * 4. 运行时严格按超步执行，上一步 Channel 有值才触发下一步
 */

import type { ConditionalEdgeReturn } from './graph-utils'
import type { RetryPolicy } from './graph-utils'
import type { StateFieldReducer } from './state'
import type { IRunnable } from './runnable'
import {
  StateChannel,
  LastValueChannel,
  AnyValueChannel,
  BinaryOperatorAggregateChannel,
  AppendChannel,
  EphemeralValueChannel,
  LastValueAfterFinishChannel,
  NamedBarrierValue
} from './channels'
import { GraphValidationError } from './errors'

// ==================== 类型定义 ====================

/** 条件边选项 */
export interface ConditionalEdgeOptions {
  /** 路径映射（用于条件跳过等场景） */
  pathMap?: Record<string, string>
  /** 是否允许重试（条件边回退场景） */
  allowRetry?: boolean
}

/** 节点定义 */
export interface NodeDefinition {
  /** 节点执行函数：(state, runtime) => Promise<Partial<State>> */
  fn: (state: any, runtime?: any) => Promise<Record<string, any>>
  /** 触发器：哪些 Channel 有新值时触发此节点 */
  triggers?: string[]
  /** 触发模式：all=全部到位才触发，any=任一到位即触发 */
  triggerMode?: 'all' | 'any'
  /** 节点输入过滤：只看到 state 的哪些字段 */
  input?: Record<string, boolean>
  /** 节点输出过滤：只输出 state 的哪些字段 */
  output?: Record<string, boolean>
  /** 重试策略 */
  retryPolicy?: RetryPolicy
  /** 节点元数据 */
  metadata?: Record<string, any>
  /** 节点级守卫：返回 true 时跳过此节点 */
  skipWhen?: (state: any) => boolean
  /** 业务结果校验器 */
  resultValidator?: (output: any, state: any) => string | undefined
  /** 是否为关键步骤（失败终止整个图） */
  critical?: boolean
  /**
   * 节点的"主输出 Channel"（仅 LLMDecideNode 适用）
   * 节点执行成功后通过两阶段提交（stage + finish）将最终结果写入该 channel
   * 图构建层在 addNode 时提取并落库，用于触发/边判定识别节点真实写入的 channel
   * 与 output 白名单的差异：outChannelName 永远会被写，output 只约束被写入 state 的字段
   */
  outChannelName?: string
}

/** 条件边定义 */
export interface ConditionalEdge {
  /** 源节点 */
  source: string
  /** 条件函数 */
  condition: (state: any) => ConditionalEdgeReturn
  /** 条件边选项 */
  options?: ConditionalEdgeOptions
}

/** 图编译选项 */
export interface CompileOptions {
  /** 节点执行前中断 */
  interruptBefore?: string[]
  /** 节点执行后中断 */
  interruptAfter?: string[]
  /** 递归限制 */
  recursionLimit?: number
}

/** 图 schema 选项 */
export interface GraphSchemaOptions {
  /** 输入字段（哪些字段可以从外部传入） */
  input: Record<string, boolean>
  /** 输出字段（哪些字段作为图执行结果） */
  output: Record<string, boolean>
}

// ==================== 图构建器 ====================

/**
 * 报表工作流图构建器
 * 参照 LangGraph StateGraph 设计
 *
 * 用法：
 * 1. new ReportStateGraph(schema, { input, output })
 * 2. .addNode(name, fn, options) 添加节点
 * 3. .addEdge(from, to) / .addConditionalEdges(src, condition) 添加边
 * 4. .compile() 编译为可执行图
 */
export class ReportStateGraph {
  private nodes: Map<string, NodeDefinition> = new Map()
  private edges: Array<{ from: string; to: string }> = []
  private conditionalEdges: Map<string, ConditionalEdge> = new Map()
  private channels: Map<string, StateChannel<any>> = new Map()
  private stateSchema: Record<string, StateFieldReducer<any>>
  private schemaOptions: GraphSchemaOptions
  private entryPoint: string | null = null

  /**
   * 构造图构建器
   * @param stateSchema - 状态 schema（字段 → reducer 映射），Record<string, StateFieldReducer>，不可为空
   * @param options - 图 schema 选项（input/output 字段声明），GraphSchemaOptions，不可为空
   */
  constructor(
    stateSchema: Record<string, StateFieldReducer<any>>,
    options: GraphSchemaOptions
  ) {
    this.stateSchema = stateSchema
    this.schemaOptions = options
  }

  /**
   * 添加节点
   * @param name - 节点名称，string，不可为空，需唯一
   * @param fn - 节点执行函数或 IRunnable 实例，不可为空
   * @param options - 节点选项，可选
   * @returns this（支持链式调用）
   */
  addNode(
    name: string,
    fn: ((state: any, runtime?: any) => Promise<Record<string, any>>) | IRunnable<any, any>,
    options?: Partial<NodeDefinition>
  ): this {
    if (this.nodes.has(name)) {
      throw new GraphValidationError(`节点 [${name}] 已存在`)
    }

    // IRunnable 适配为函数签名
    const nodeFn = typeof fn === 'object' && 'invoke' in fn
      ? (state: any, runtime?: any) => fn.invoke(state, { configurable: { runtime } })
      : fn

    // 提取 LLMDecideNode 的 outChannelName，落到 NodeDefinition 供触发/边判定使用
    // 避免运行时反射丢失：IRunnable 包装后原始引用不再可见
    const outChannelName = (fn as any)?.outChannelName as string | undefined

    this.nodes.set(name, {
      fn: nodeFn,
      triggers: options?.triggers,
      triggerMode: options?.triggerMode ?? 'any',
      input: options?.input,
      output: options?.output,
      retryPolicy: options?.retryPolicy,
      metadata: options?.metadata,
      skipWhen: options?.skipWhen,
      resultValidator: options?.resultValidator,
      critical: options?.critical,
      outChannelName
    })

    return this
  }

  /**
   * 添加确定性边
   * @param from - 源节点名称（或节点数组，自动创建 Barrier），string | string[]，不可为空
   * @param to - 目标节点名称，string，不可为空
   * @returns this（支持链式调用）
   */
  addEdge(from: string | string[], to: string): this {
    if (Array.isArray(from)) {
      // 多源 → 单目标：自动创建 NamedBarrierValue Channel
      const barrierName = `__barrier_${from.sort().join('_')}_${to}`
      for (const src of from) {
        this.edges.push({ from: src, to: barrierName })
      }
      this.edges.push({ from: barrierName, to })
      // 注册 Barrier Channel
      this.channels.set(barrierName, new NamedBarrierValue(from))
      return this
    }
    this.edges.push({ from, to })
    return this
  }

  /**
   * 添加条件边
   * @param source - 源节点名称，string，不可为空
   * @param condition - 条件函数，(state) => ConditionalEdgeReturn，不可为空
   * @param options - 条件边选项，可选
   * @returns this（支持链式调用）
   */
  addConditionalEdges(
    source: string,
    condition: (state: any) => ConditionalEdgeReturn,
    options?: ConditionalEdgeOptions
  ): this {
    if (this.conditionalEdges.has(source)) {
      throw new GraphValidationError(`节点 [${source}] 已有条件边，不支持多条条件边`)
    }
    this.conditionalEdges.set(source, { source, condition, options })
    return this
  }

  /**
   * 添加自定义 Channel
   * @param name - Channel 名称，string，不可为空
   * @param channel - Channel 实例，StateChannel，不可为空
   * @returns this（支持链式调用）
   */
  addChannel(name: string, channel: StateChannel<any>): this {
    this.channels.set(name, channel)
    return this
  }

  /**
   * 设置入口点
   * @param nodeName - 入口节点名称，string，不可为空
   * @returns this（支持链式调用）
   */
  setEntryPoint(nodeName: string): this {
    this.entryPoint = nodeName
    return this
  }

  /**
   * 编译图
   * 校验图结构完整性，创建 Channel 实例，返回可执行图
   *
   * @param options - 编译选项，可选
   * @returns 编译后的可执行图，CompiledReportGraph
   * @throws GraphValidationError 图结构校验失败
   */
  compile(options?: CompileOptions): CompiledReportGraph {
    // 1. 校验入口点
    const entryNode = this.entryPoint ?? this.findEntryPoint()
    if (!entryNode) {
      throw new GraphValidationError('图缺少入口点，请通过 __start__ 边或 setEntryPoint 指定')
    }

    // 2. 校验所有边引用的节点都存在
    for (const edge of this.edges) {
      if (edge.from !== '__start__' && !this.nodes.has(edge.from) && !this.channels.has(edge.from)) {
        throw new GraphValidationError(`边引用了不存在的源节点 [${edge.from}]`)
      }
      if (edge.to !== '__end__' && !this.nodes.has(edge.to) && !this.channels.has(edge.to)) {
        throw new GraphValidationError(`边引用了不存在的目标节点 [${edge.to}]`)
      }
    }

    // 3. 校验条件边引用的源节点都存在
    for (const [source] of this.conditionalEdges) {
      if (!this.nodes.has(source)) {
        throw new GraphValidationError(`条件边引用了不存在的源节点 [${source}]`)
      }
    }

    // 4. 创建 Channel 实例（从 stateSchema 自动创建）
    const allChannels = new Map<string, StateChannel<any>>()
    for (const [name, channel] of this.channels) {
      allChannels.set(name, channel)
    }
    for (const [field, reducer] of Object.entries(this.stateSchema)) {
      if (!allChannels.has(field)) {
        allChannels.set(field, this.createChannelFromReducer(field, reducer))
      }
    }
    // 注册 __start__ 和 __end__ Channel
    if (!allChannels.has('__start__')) {
      allChannels.set('__start__', new EphemeralValueChannel())
    }
    if (!allChannels.has('__end__')) {
      allChannels.set('__end__', new EphemeralValueChannel(false))
    }

    // 5. 构建邻接表
    const adjacency = this.buildAdjacency()

    // 6. 返回编译后的图
    return new CompiledReportGraph({
      nodes: new Map(this.nodes),
      edges: [...this.edges],
      conditionalEdges: new Map(this.conditionalEdges),
      channels: allChannels,
      stateSchema: this.stateSchema,
      schemaOptions: this.schemaOptions,
      entryNode,
      adjacency,
      interruptBefore: options?.interruptBefore ?? [],
      interruptAfter: options?.interruptAfter ?? [],
      recursionLimit: options?.recursionLimit ?? 25
    })
  }

  /**
   * 自动发现入口点（__start__ 边指向的第一个节点）
   * @returns 入口节点名称，string | null
   */
  private findEntryPoint(): string | null {
    for (const edge of this.edges) {
      if (edge.from === '__start__') {
        return edge.to
      }
    }
    return null
  }

  /**
   * 从 reducer 配置创建 Channel 实例
   * @param field - 字段名，string，不可为空
   * @param reducer - reducer 配置，StateFieldReducer，不可为空
   * @returns Channel 实例
   */
  private createChannelFromReducer(field: string, reducer: StateFieldReducer<any>): StateChannel<any> {
    switch (reducer.kind) {
      case 'overwrite':
        return new LastValueChannel()
      case 'binop':
        return new BinaryOperatorAggregateChannel(reducer.operator, reducer.initial)
      case 'append':
        return new AppendChannel({ unique: false, accumulate: true })
      case 'ephemeral':
        return new EphemeralValueChannel()
      default:
        throw new GraphValidationError(`未知的 reducer 类型: ${(reducer as any).kind}`)
    }
  }

  /**
   * 构建邻接表
   * @returns 邻接表 Map<源节点, 目标节点列表>
   */
  private buildAdjacency(): Map<string, string[]> {
    const adj = new Map<string, string[]>()
    for (const edge of this.edges) {
      const targets = adj.get(edge.from) ?? []
      targets.push(edge.to)
      adj.set(edge.from, targets)
    }
    return adj
  }
}

// ==================== 编译后的图 ====================

/** 编译图构造参数 */
export interface CompiledGraphParams {
  nodes: Map<string, NodeDefinition>
  edges: Array<{ from: string; to: string }>
  conditionalEdges: Map<string, ConditionalEdge>
  channels: Map<string, StateChannel<any>>
  stateSchema: Record<string, StateFieldReducer<any>>
  schemaOptions: GraphSchemaOptions
  entryNode: string
  adjacency: Map<string, string[]>
  interruptBefore: string[]
  interruptAfter: string[]
  recursionLimit: number
}

/**
 * 编译后的可执行图
 * 由 ReportStateGraph.compile() 生成，不可手动构造
 *
 * 提供 execute() 和 stream() 两种执行方式
 */
export class CompiledReportGraph {
  readonly params: CompiledGraphParams

  /** @internal 由 ReportStateGraph.compile() 调用 */
  constructor(params: CompiledGraphParams) {
    this.params = params
  }

  /**
   * 执行图（完整运行，返回最终结果）
   * @param input - 初始状态，Record<string, any>，不可为空
   * @param config - 运行时配置，可选
   * @returns 图执行结果
   */
  async execute(
    input: Record<string, any>,
    config?: { configurable?: Record<string, any>; recursionLimit?: number; signal?: AbortSignal }
  ): Promise<GraphExecutionResult> {
    const { GraphExecutor } = await import('./graph-executor')
    const executor = new GraphExecutor(this, config)
    return executor.execute(input)
  }

  /**
   * 流式执行图（逐步 yield 事件）
   * @param input - 初始状态，Record<string, any>，不可为空
   * @param config - 运行时配置，可选
   * @param modes - 流模式列表，默认 ['updates']
   * @returns 异步生成器，逐步产出流事件
   */
  async *stream(
    input: Record<string, any>,
    config?: { configurable?: Record<string, any>; recursionLimit?: number; signal?: AbortSignal },
    modes: string[] = ['updates']
  ): AsyncGenerator<any> {
    const { GraphExecutor } = await import('./graph-executor')
    const executor = new GraphExecutor(this, config)
    yield* executor.stream(input, modes)
  }

  /** 获取节点定义 */
  getNode(name: string): NodeDefinition | undefined {
    return this.params.nodes.get(name)
  }

  /** 获取所有节点名称 */
  getNodeNames(): string[] {
    return Array.from(this.params.nodes.keys())
  }

  /** 获取邻接表 */
  getAdjacency(): Map<string, string[]> {
    return this.params.adjacency
  }
}

/** 图执行结果 */
export interface GraphExecutionResult {
  /** 最终状态 */
  state: Record<string, any>
  /** 步骤执行记录 */
  stepRecords: any[]
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  error?: string
}
