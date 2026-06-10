/**
 * 图计算工具集：Send、Command、interrupt、RetryPolicy
 * 参照 LangGraph 的 Send/Command/interrupt/RetryPolicy 机制
 */

import { GraphInterrupt } from './errors'

// ==================== Send ====================

/**
 * 动态 fan-out 指令
 * 参照 LangGraph Send 类
 *
 * 节点可以返回 Send[] 来动态生成并行任务，
 * 而不必在编译时确定所有边
 *
 * 使用场景：根据搜索结果数量动态创建 N 个并行处理节点
 */
export class Send {
  /** 目标节点名称 */
  readonly node: string
  /** 传给目标节点的输入 */
  readonly input: Record<string, any>

  /**
   * 构造 Send 指令
   * @param node - 目标节点名称，string，不可为空
   * @param input - 传给目标节点的输入，Record<string, any>，不可为空
   */
  constructor(node: string, input: Record<string, any>) {
    this.node = node
    this.input = input
  }
}

// ==================== Command ====================

/**
 * 原子操作指令
 * 参照 LangGraph Command 类
 *
 * 节点可以返回 Command 来同时执行状态更新 + 路由跳转，
 * 保证两者原子性（不会出现更新了状态但没跳转的情况）
 *
 * 使用场景：条件边回退（如 SQL 校验失败回到 prepare_sql）
 */
export class Command {
  /** 路由目标节点 */
  readonly goto: string | string[]
  /** 状态更新 */
  readonly update: Record<string, any>

  /**
   * 构造 Command 指令
   * @param options - 命令选项
   * @param options.goto - 路由目标节点名称（或数组），string | string[]，不可为空
   * @param options.update - 状态更新，Record<string, any>，可选
   */
  constructor(options: { goto: string | string[]; update?: Record<string, any> }) {
    this.goto = options.goto
    this.update = options.update ?? {}
  }
}

/** 条件边返回值类型：目标节点名 / Command / Send / null（终止） */
export type ConditionalEdgeReturn = string | Command | Send | null

// ==================== interrupt ====================

/**
 * 请求作用域隔离存储，供 interrupt() 安全获取当前请求 config。因浏览器无 AsyncLocalStorage 且为单线程，用模块级栈模拟。
 * 采用栈结构而非单变量，以支持 retry/条件边回退等嵌套场景下外层 config 的正确恢复。
 */
const configStack: interruptConfig[] = []

/** interrupt 依赖的配置 */
interface interruptConfig {
  /** 当前节点配置 */
  configurable?: Record<string, any>
  /** P0-3：恢复时传入的值，由 GraphExecutor 在恢复执行时设置 */
  __pregel_resume?: any[]
}

/** 中断请求计数器，用于生成 resume 值的索引 */
let interruptCounter = 0

/**
 * 人机中断函数
 * 参照 LangGraph interrupt()
 *
 * 节点调用此函数暂停执行，等待外部确认后恢复
 * 不是错误，是一种控制流机制
 *
 * P0-3 修正：从当前作用域读取 __pregel_resume
 * - 首次执行时 __pregel_resume 不存在 → 抛出 GraphInterrupt
 * - 恢复执行时 __pregel_resume 存在 → 返回对应的恢复值
 *
 * @param value - 中断时传递给外部的值（如确认提示信息），any，可选
 * @returns 恢复时外部传入的值
 * @throws GraphInterrupt 首次执行时始终抛出，由 GraphExecutor 捕获处理
 */
export function interrupt(value?: any): any {
  // 从浏览器端模拟的栈中读取当前作用域 config
  const store = getCurrentConfig()
  // 恢复场景：已有 resume 值，直接返回
  if (store?.__pregel_resume && store.__pregel_resume.length > 0) {
    const idx = interruptCounter
    interruptCounter++
    if (idx < store.__pregel_resume.length) {
      return store.__pregel_resume[idx]
    }
  }
  // 首次执行：抛出中断
  throw new GraphInterrupt(value)
}

/**
 * 获取当前请求作用域的配置
 * 从模块级栈顶读取最近一次 runWithConfig 注入的 config
 * @internal 仅供 GraphExecutor 内部使用
 * @returns 当前请求的配置，interruptConfig | undefined
 */
export function getCurrentConfig(): interruptConfig | undefined {
  return configStack[configStack.length - 1]
}

/**
 * 重置中断计数器
 * 每次图执行开始时调用，确保 interrupt() 的索引从 0 开始
 * @internal 仅供 GraphExecutor 内部使用
 */
export function resetInterruptCounter(): void {
  interruptCounter = 0
}

/**
 * 在指定作用域内运行函数
 * 将 config 压入模块级栈顶 → 执行 fn → 无论成功或抛错都从栈顶弹出
 *
 * 为什么用 Promise.resolve().then(fn).finally(pop)：
 * - 保证 pop 一定发生在 fn 返回的 Promise 链尾
 * - 即便 fn 同步抛错，finally 也会执行，不会污染栈
 * - 与 Node AsyncLocalStorage.run 的"作用域结束自动还原"语义对齐
 *
 * @internal 仅供 GraphExecutor 内部使用
 * @param config - 请求配置，interruptConfig，不可为空
 * @param fn - 要运行的函数，() => Promise<T>，不可为空
 * @returns 函数执行结果，Promise<T>
 */
export function runWithConfig<T>(config: interruptConfig, fn: () => Promise<T>): Promise<T> {
  configStack.push(config)
  // 使用链式调用，确保 pop 始终执行
  return Promise.resolve()
    .then(() => fn())
    .finally(() => {
      configStack.pop()
    })
}

// ==================== RetryPolicy ====================

/**
 * 节点级重试策略
 * 参照 LangGraph RetryPolicy
 *
 * 与旧引擎 maxRetries 的区别：
 * - 支持 retryOn 过滤（只有特定异常才重试）
 * - 支持指数退避（避免频繁重试）
 * - 支持 clearMemoryOnRetry（重试时清空 LLM 记忆）
 */
export interface RetryPolicy {
  /** 最大尝试次数（含首次执行），默认 3 */
  maxAttempts: number
  /** 初始重试间隔（毫秒），默认 500 */
  initialInterval?: number
  /** 退避倍数，默认 2 */
  backoffFactor?: number
  /** 最大重试间隔（毫秒），默认 10000 */
  maxInterval?: number
  /**
   * 判断异常是否值得重试
   * @param error - 捕获的异常，Error，不可为空
   * @returns true 表示重试，false 表示直接失败
   */
  retryOn?: (error: Error) => boolean
  /**
   * 重试时是否清空 LLM 记忆
   * 默认 true：重试时 LLM 不应看到上次失败的工具结果
   */
  clearMemoryOnRetry?: boolean
  /**
   * 重试是否计入 recursionLimit
   * 默认 true：防止无限重试耗尽递归限制
   */
  countAsStep?: boolean
}

/**
 * 默认重试判断：网络错误和超时才重试
 * @param error - 捕获的异常，Error，不可为空
 * @returns true 表示值得重试
 */
export function defaultRetryOn(error: Error): boolean {
  const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'ECONNRESET', 'ETIMEDOUT']
  return retryableCodes.some(code =>
    error.message.includes(code) || (error as any).code === code
  )
}

/**
 * 计算重试等待时间（指数退避）
 * @param attempt - 当前重试次数（从 0 开始），number，不可为空
 * @param policy - 重试策略，RetryPolicy，不可为空
 * @returns 等待时间（毫秒），number
 */
export function getRetryDelay(attempt: number, policy: RetryPolicy): number {
  const initial = policy.initialInterval ?? 500
  const factor = policy.backoffFactor ?? 2
  const max = policy.maxInterval ?? 10000
  const delay = Math.min(initial * Math.pow(factor, attempt), max)
  // 加入随机抖动，避免多个重试同时发起
  return delay * (0.5 + Math.random() * 0.5)
}
