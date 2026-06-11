/**
 * 工具调用节点（无 LLM）
 * 参照 LangGraph ToolNode 简化模型
 *
 * 与 LLMDecideNode 的区别：
 * - 不调 LLM，直接按配置调单个工具
 * - 适用于"语义确定、必调某工具"的场景（如 read_rows / read_cols）
 * - 根除 LLM 在该节点"用 ReAct 文本格式输出工具调用导致 adapter 不识别"的问题
 *
 * 行为契约：
 * 1. 节点入口处先取 outChannel；若 runtime 没注入该 channel 直接 throw（与 LLMDecideNode 一致）
 * 2. 工具执行成功 → stage 结果到 outChannel + 写 state.resultKey → finish() 让下游触发
 * 3. 工具执行失败 / 抛错 → 不 finish，下游不触发；返回 { errors: [...] }
 * 4. 工具执行期间透传 tool_call / tool_result 事件（与 LLMDecideNode 风格一致）
 *
 * 参数 args 支持两种形态：
 * - 静态值 Record<string, any>：直接传给工具
 * - 派生函数 (state) => Record<string, any>：从当前 state 实时计算
 *   派生模式用于需要"根据上游 state 决定本次工具参数"的场景
 */

import type { IRunnable, RunnableConfig } from './runnable'
import type { WorkflowRuntime } from './runtime'
import type { LastValueAfterFinishChannel } from './channels'
import type { StreamEvent } from './stream-mode'

/**
 * 工具参数形态
 * - 静态对象：直接传给工具
 * - 函数：从 state 派生，调用时实时计算（解决"参数依赖上游 state"场景）
 */
export type ToolCallArgs =
  | Record<string, any>
  | ((state: Record<string, any>) => Record<string, any> | Promise<Record<string, any>>)

/**
 * ToolCallNode 构造选项
 */
export interface ToolCallNodeOptions {
  /** 节点ID（用于事件透传、错误信息、mapped toolCallId），不可为空 */
  nodeId: string
  /** 必调的工具名（对应 ToolRegistry 注册名），不可为空 */
  toolName: string
  /**
   * 工具参数
   * - 静态对象：直接传入
   * - 函数：调用时从 state 派生，state 变化时参数自动跟新
   * 不可为空；无参工具请传 `{}`
   */
  args: ToolCallArgs
  /**
   * 两阶段提交输出 Channel 名称
   * 与 graph.addChannel(name, LastValueAfterFinishChannel) 注册名一致
   * 不可为空
   */
  outChannelName: string
  /**
   * 结果键（可选）
   * - 设置后：把工具返回数据 stage 为 `{ [resultKey]: result }` 并写 state 同名字段
   * - 不设置：按 toolName 作 key，stage 为 `{ [toolName]: result }`
   * 与 LLMDecideNode.resultKey 行为一致，保证下游 triggers 写法不变
   */
  resultKey?: string
}

/**
 * 工具调用节点（无 LLM）
 *
 * 适用场景：
 * - read_rows / read_cols：单一读取工具，语义确定，无需 LLM 决策
 * - 任何"必须调 X 工具、不调就失败"的纯机械步骤
 *
 * 不适用场景：
 * - 多工具二选一（用 LLMDecideNode + requiredToolResultsAny）
 * - 需要根据上下文动态决定参数/工具的（用 LLMDecideNode）
 */
export class ToolCallNode implements IRunnable<Record<string, any>, Record<string, any>> {
  private options: ToolCallNodeOptions

  /**
   * 构造工具调用节点
   * @param options - 节点配置选项，ToolCallNodeOptions，不可为空
   */
  constructor(options: ToolCallNodeOptions) {
    this.options = options
  }

  /**
   * 暴露输出 Channel 名称给图构建层
   * 与 LLMDecideNode.get outChannelName 行为对齐，便于 addNode 通用提取
   * @returns 输出 Channel 名称，string，不可为空
   */
  get outChannelName(): string {
    return this.options.outChannelName
  }

  /**
   * 执行单次工具调用
   * @param state - 当前工作流状态，Record<string, any>，不可为空
   * @param config - 运行时配置（含 runtime / signal），可选
   * @returns 节点输出的状态更新，Promise<Record<string, any>>
   *   - 成功：`{ [resultKey|taskName]: result }`
   *   - 失败：`{ errors: [...] }`
   */
  async invoke(
    state: Record<string, any>,
    config?: RunnableConfig
  ): Promise<Record<string, any>> {
    const runtime: WorkflowRuntime | undefined = config?.configurable?.runtime
    const { nodeId, toolName, outChannelName, resultKey } = this.options

    if (!runtime) {
      throw new Error(`ToolCallNode [${nodeId}] 缺少 runtime 配置`)
    }

    // [关键] 与 LLMDecideNode 一致：取 GraphExecutor 当前执行的 Channel 实例
    // 避免构建期引用与执行期实例不一致导致 finish 提交失败
    const outChannel = runtime.getChannel<LastValueAfterFinishChannel<Record<string, any>>>(outChannelName)
    if (!outChannel) {
      throw new Error(
        `ToolCallNode [${nodeId}] 找不到输出 Channel [${outChannelName}]，` +
        `请确认已通过 graph.addChannel('${outChannelName}', ...) 注册`
      )
    }

    // [状态变化] 节点开始：打 DEBUG 日志，便于排查"哪个工具被调、参数是什么"
    // 关键决策点：工具调用入口，集中打一次避免循环高频
    const derivedArgs = typeof this.options.args === 'function'
      ? await (this.options.args as (state: Record<string, any>) => Record<string, any> | Promise<Record<string, any>>)(state)
      : this.options.args
    console.log(`[DEBUG][tool-call] [${nodeId}] 开始 工具=${toolName} 参数=${JSON.stringify(derivedArgs)}`)

    // 透传 tool_call 事件：与 LLMDecideNode 风格对齐，前端 UI 看到一致的"调用工具"标记
    const toolCallId = `${nodeId}#${runtime.runId}#0`
    this.emitEvent(runtime, {
      nodeId,
      output: { type: 'tool_call', toolCallId, toolName, input: derivedArgs },
      status: 'running'
    })

    // 执行工具
    let result: any = null
    let errorMessage: string | null = null
    try {
      result = await runtime.toolRegistry.executeTool(toolName, derivedArgs)
    } catch (e: any) {
      errorMessage = e?.message ?? String(e)
    }

    // 工具失败：不 finish outChannel、不写 state 业务字段
    // 关键：与 LLMDecideNode 行为一致，失败时下游 triggers 不命中，自动阻断后续节点
    if (errorMessage) {
      // 透传 tool_result 失败事件，便于前端展示
      this.emitEvent(runtime, {
        nodeId,
        output: { type: 'tool_result', toolCallId, toolName, result: null, error: errorMessage },
        status: 'failed'
      })
      // [关键决策点] 工具失败：打 ERROR 日志
      console.error(`[ERROR][tool-call] [${nodeId}] 工具 ${toolName} 执行失败: ${errorMessage}`)
      return { errors: [`工具 ${toolName} 执行失败: ${errorMessage}`] }
    }

    // 透传 tool_result 成功事件
    this.emitEvent(runtime, {
      nodeId,
      output: { type: 'tool_result', toolCallId, toolName, result },
      status: 'success'
    })
    console.log(`[DEBUG][tool-call] [${nodeId}] 完成 工具=${toolName}`)

    // 成功：stage 到 outChannel + 写 state
    // [对齐 LLMDecideNode.resultKey 模式] 设置 resultKey 时用 resultKey 作键，否则用 toolName
    const stagePayload: Record<string, any> = resultKey
      ? { [resultKey]: result }
      : { [toolName]: result }
    outChannel.stage(stagePayload)
    outChannel.finish()
    return stagePayload
  }

  /**
   * 发射流事件
   * @param runtime - 工作流运行时，WorkflowRuntime，不可为空
   * @param event - 流事件，StreamEvent，不可为空
   */
  private emitEvent(runtime: WorkflowRuntime, event: StreamEvent): void {
    runtime.emitEvent(event)
  }
}
