/**
 * 统一执行接口与 RunnableLambda
 * 参照 LangChain LCEL（LangChain Expression Language）设计
 *
 * IRunnable 是图计算层的基础协议，所有可执行单元（节点、子图、工具包装）都实现此接口
 * RunnableLambda 是纯函数包装器，解决节点间数据结构不匹配问题
 *
 * 注意：RunnableSequence / RunnableParallel / RunnableWithFallbacks 暂不实现
 * - RunnableSequence 用 StateGraph 的边替代
 * - RunnableParallel 用 GraphExecutor 的并行执行替代
 * - RunnableWithFallbacks 用条件边 + try-catch 替代
 */

/**
 * 统一执行接口
 * 所有可编排的执行单元都实现此接口
 *
 * @template Input - 输入类型
 * @template Output - 输出类型
 */
export interface IRunnable<Input, Output> {
  /**
   * 执行运行单元
   * @param input - 输入数据，Input 类型，不可为空
   * @param config - 运行时配置（含 runtime、signal 等），可选
   * @returns 输出数据，Promise<Output>
   */
  invoke(input: Input, config?: RunnableConfig): Promise<Output>
}

/**
 * 运行时配置
 * 通过 config.configurable 注入依赖，参照 LangGraph config 模式
 */
export interface RunnableConfig {
  /** 可配置项（运行时注入的依赖） */
  configurable?: Record<string, any>
  /** 中断信号 */
  signal?: AbortSignal
  /** 递归限制 */
  recursionLimit?: number
  /** 流模式回调 */
  onEvent?: (event: any) => void
}

/**
 * 纯函数包装器
 * 将普通函数包装为 IRunnable，解决节点间数据结构不匹配问题
 *
 * 使用场景：
 * - 节点函数签名与 IRunnable 接口对齐
 * - 数据转换/映射（如从 state 中提取子集传给工具）
 * - 简单线性流程的链式调用（不引入 StateGraph 的复杂度）
 */
export class RunnableLambda<Input, Output> implements IRunnable<Input, Output> {
  private fn: (input: Input, config?: RunnableConfig) => Promise<Output>

  /**
   * 构造 RunnableLambda
   * @param fn - 被包装的纯函数，(input, config) => Promise<Output>，不可为空
   */
  constructor(fn: (input: Input, config?: RunnableConfig) => Promise<Output>) {
    this.fn = fn
  }

  /**
   * 执行被包装的函数
   * @param input - 输入数据，Input 类型，不可为空
   * @param config - 运行时配置，可选
   * @returns 函数执行结果，Promise<Output>
   */
  async invoke(input: Input, config?: RunnableConfig): Promise<Output> {
    return this.fn(input, config)
  }

  /**
   * 静态工厂方法：从同步函数创建 RunnableLambda
   * @param fn - 同步函数，不可为空
   * @returns RunnableLambda 实例
   */
  static from<Input, Output>(
    fn: (input: Input, config?: RunnableConfig) => Output | Promise<Output>
  ): RunnableLambda<Input, Output> {
    return new RunnableLambda(async (input, config) => fn(input, config))
  }
}
