/**
 * 状态通道实现
 * 参照 LangGraph Channel 机制，控制节点间数据传递
 * 只有 Channel 有新值时，下游节点才会被触发
 *
 * 设计规约：
 * - 节点执行失败时不写任何业务 Channel（return {}）
 * - 失败信息统一写入 errors 累加 Channel
 * - stepRecords Channel 无论成败都写入（保证完整执行轨迹）
 */

// ==================== 基类 ====================

/**
 * 状态通道基类
 * 参照 LangGraph BaseChannel 协议，控制节点间数据传递
 * 只有 Channel 有新值时，下游节点才会被触发
 */
export abstract class StateChannel<T> {
  abstract update(values: T[]): boolean
  abstract get(): T | null
  abstract isAvailable(): boolean
  abstract consume(): boolean
  /**
   * 内部版本号只读访问
   * @internal 外部应读 checkpoint.channelVersions，不应直接调用此方法
   */
  abstract getVersion(): number
}

// ==================== LastValueChannel ====================

/**
 * 单值覆盖通道
 * 参照 LangGraph LastValue（last_value.d.ts:8-19）
 *
 * 严格语义：update() 必须 values.length === 1，否则抛 InvalidUpdateError
 * 防止多节点同一步写同一 Channel 产生数据竞争
 * 适用于：datasources、datasets、sqlValidationResult 等单值字段
 */
export class LastValueChannel<T> extends StateChannel<T> {
  private _value: T | null = null
  private _version: number = 0

  update(values: T[]): boolean {
    if (values.length === 0) return false
    if (values.length !== 1) {
      throw new InvalidUpdateError(
        `LastValueChannel 每步只能写入一个值，收到 ${values.length} 个`
      )
    }
    this._value = values[0]
    this._version++
    return true
  }

  get(): T | null { return this._value }
  isAvailable(): boolean { return this._value !== null }
  consume(): boolean { return this._version > 0 }
  getVersion(): number { return this._version }
}

// ==================== AnyValueChannel ====================

/**
 * 取最后一个值的通道
 * 参照 LangGraph AnyValue（any_value.d.ts）
 *
 * 与 LastValue 的区别：多写时取最后一个，不抛错
 * 适用于"多源数据任一即可"场景
 */
export class AnyValueChannel<T> extends StateChannel<T> {
  private _value: T | null = null
  private _version: number = 0

  update(values: T[]): boolean {
    if (values.length === 0) return false
    this._value = values[values.length - 1]
    this._version++
    return true
  }

  get(): T | null { return this._value }
  isAvailable(): boolean { return this._value !== null }
  consume(): boolean { return this._version > 0 }
  getVersion(): number { return this._version }
}

// ==================== BinaryOperatorAggregateChannel ====================

/**
 * reducer 合并通道
 * 参照 LangGraph BinaryOperatorAggregate（binop.d.ts）
 *
 * 每次 update 都用 operator(current, new) 合并
 * 是 LangGraph Annotation 字段 reducer 的底层实现
 * 适用于：searchResults 多源合并、retryCount 累加计数
 */
export class BinaryOperatorAggregateChannel<T> extends StateChannel<T> {
  private _value: T
  private _version: number = 0

  /** P0-5：暴露 operator 供 cloneChannel 使用 */
  readonly _operator: (current: T, update: T) => T
  /** P0-5：暴露 initial 供 cloneChannel 使用 */
  readonly _initialValue: T

  constructor(
    operator: (current: T, update: T) => T,
    initialValue: T
  ) {
    super()
    this._operator = operator
    this._initialValue = initialValue
    this._value = initialValue
  }

  update(values: T[]): boolean {
    if (values.length === 0) return false
    let changed = false
    for (const v of values) {
      const newValue = this._operator(this._value, v)
      if (newValue !== this._value) {
        this._value = newValue
        changed = true
      }
    }
    if (changed) this._version++
    return changed
  }

  get(): T | null { return this._value }
  isAvailable(): boolean { return true }
  consume(): boolean { return this._version > 0 }
  getVersion(): number { return this._version }
}

// ==================== AppendChannel ====================

/**
 * 数组累加通道
 * 参照 LangGraph Topic（topic.d.ts:11-18）
 *
 * 配置项：
 * - unique: true 时去重（Set 语义）
 * - accumulate: false 时跨步不累积（消费后清空）
 */
export class AppendChannel<T> extends StateChannel<T[]> {
  private _values: T[] = []
  private _seen: Set<T> = new Set()
  private _version: number = 0
  private options: { unique: boolean; accumulate: boolean }

  constructor(options: { unique?: boolean; accumulate?: boolean } = {}) {
    super()
    this.options = {
      unique: options.unique ?? false,
      accumulate: options.accumulate ?? true
    }
  }

  /**
   * update 签名统一为 Array<Value | Value[]>
   * 参照 LangGraph Topic.update，支持单值或数组混合
   */
  update(values: Array<T | T[]>): boolean {
    const newItems = values.flat()
    if (newItems.length === 0) return false
    if (this.options.unique) {
      for (const item of newItems) {
        if (!this._seen.has(item)) {
          this._seen.add(item)
          this._values.push(item)
        }
      }
    } else {
      this._values.push(...newItems)
    }
    this._version++
    return true
  }

  get(): T[] { return this._values }
  isAvailable(): boolean { return true }

  /** accumulate=false 时消费后清空 */
  consume(): boolean {
    if (this.options.accumulate) return this._version > 0
    this._values = []
    this._seen.clear()
    this._version++
    return true
  }

  getVersion(): number { return this._version }
}

// ==================== EphemeralValueChannel ====================

/**
 * 步末清空通道
 * 参照 LangGraph EphemeralValue（ephemeral_value.d.ts:7-9）
 *
 * 核心语义：在节点读取后立即清空（guards against re-read）
 * 适用于：__start__ 触发信号（写入一次，下游消费后清空，避免循环触发）
 */
export class EphemeralValueChannel<T> extends StateChannel<T> {
  private _value: T | null = null
  private _guard: boolean
  private _version: number = 0

  constructor(guard: boolean = true) {
    super()
    this._guard = guard
  }

  update(values: T[]): boolean {
    if (values.length === 0) return false
    this._value = values[0]
    this._version++
    return true
  }

  get(): T | null { return this._value }
  isAvailable(): boolean { return this._value !== null }

  /** 消费后立即清空（防重读） */
  consume(): boolean {
    if (!this._guard) return this._version > 0
    const had = this._value !== null
    this._value = null
    return had
  }

  getVersion(): number { return this._version }
}

// ==================== LastValueAfterFinishChannel ====================

/**
 * 两阶段提交通道
 * 参照 LangGraph LastValueAfterFinish（last_value.d.ts:28-35）
 *
 * 核心语义：
 * - 节点执行期间调用 stage() 保存中间快照（不入版本号）
 * - 节点成功完成时调用 finish()，将 staged value 提交为正式值
 * - 节点失败时不调用 finish()，下游 Channel 仍为旧值/null，自动阻断
 *
 * 适用于 LLM 决策节点内部多次工具调用的原子提交场景
 */
export class LastValueAfterFinishChannel<T> extends StateChannel<T> {
  private _value: T | null = null
  private _stagedValue: T | null = null
  private _version: number = 0

  /** 暂存中间结果（不入版本号，不广播给下游） */
  stage(value: T): void {
    this._stagedValue = value
  }

  /** 节点显式声明完成，将 stagedValue 提交为正式值 */
  finish(): boolean {
    if (this._stagedValue === null) return false
    this._value = this._stagedValue
    this._stagedValue = null
    this._version++
    return true
  }

  update(values: T[]): boolean {
    if (values.length === 0) return false
    this._value = values[values.length - 1]
    this._version++
    return true
  }

  get(): T | null { return this._value }
  isAvailable(): boolean { return this._value !== null }
  consume(): boolean { return this._version > 0 }
  getVersion(): number { return this._version }
}

// ==================== NamedBarrierValue ====================

/**
 * 多 Channel 协同触发通道
 * 参照 LangGraph NamedBarrierValue（named_barrier_value.d.ts:18-30）
 *
 * 核心语义：下游节点必须等待所有命名 Channel 都有新值才能触发
 * 适用于：4 个并行搜索节点全部完成后才触发路由节点
 */
export class NamedBarrierValue extends StateChannel<Record<string, any>> {
  private names: Set<string>
  private seen: Set<string> = new Set()
  private _values: Map<string, any> = new Map()
  private _version: number = 0

  constructor(names: string[]) {
    super()
    this.names = new Set(names)
  }

  /** 暴露被观察节点名称只读访问 */
  getWatchedNodes(): string[] {
    return Array.from(this.names)
  }

  /** _applyWrites 调用此方法，传入已完成的节点名 */
  update(completedNodeIds: string[]): boolean {
    let changed = false
    for (const id of completedNodeIds) {
      if (this.names.has(id) && !this.seen.has(id)) {
        this.seen.add(id)
        this._values.set(id, true)
        changed = true
      }
    }
    if (changed) this._version++
    return changed
  }

  /** 消费后清空 seen，准备下一轮 */
  consume(): boolean {
    const wasAvailable = this.isAvailable()
    this.seen.clear()
    this._values.clear()
    return wasAvailable
  }

  /** 所有被观察节点是否都已完成 */
  isAvailable(): boolean {
    return this.names.size > 0 && this.seen.size === this.names.size
  }

  get(): Record<string, any> {
    const result: Record<string, any> = {}
    for (const name of this.names) {
      result[name] = this._values.get(name) ?? null
    }
    return result
  }

  getVersion(): number { return this._version }
}

// ==================== 错误类型（内联，与 Channel 紧耦合） ====================

/**
 * 无效更新错误
 * 当 Channel 写入违反语义约束时抛出（如 LastValueChannel 收到多个值）
 */
export class InvalidUpdateError extends Error {
  readonly lc_error_code = 'INVALID_CONCURRENT_GRAPH_UPDATE'

  constructor(message: string) {
    super(message)
    this.name = 'InvalidUpdateError'
  }
}
