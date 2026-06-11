/**
 * 工具调用节点（无 LLM），参照 LangGraph ToolNode 简化模型
 */

import type { IRunnable, RunnableConfig } from './runnable'
import type { WorkflowRuntime } from './runtime'
import type { LastValueAfterFinishChannel } from './channels'
import type { StreamEvent } from './stream-mode'

/**
 * 工具参数形态，静态对象直接传给工具，函数从 state 派生
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
 * 工具调用节点（无 LLM），适用于单一读取工具，语义确定，无需 LLM 决策的场景
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
   * @returns 输出 Channel 名称，string，不可为空
   */
  get outChannelName(): string {
    return this.options.outChannelName
  }

  /**
   * 执行单次工具调用
   * @param state - 当前工作流状态，Record<string, any>，不可为空
   * @param config - 运行时配置，可选
   * @returns 节点输出的状态更新，Promise<Record<string, any>>
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

    const outChannel = runtime.getChannel<LastValueAfterFinishChannel<Record<string, any>>>(outChannelName)
    if (!outChannel) {
      throw new Error(
        `ToolCallNode [${nodeId}] 找不到输出 Channel [${outChannelName}]，` +
        `请确认已通过 graph.addChannel('${outChannelName}', ...) 注册`
      )
    }

    const derivedArgs = typeof this.options.args === 'function'
      ? await (this.options.args as (state: Record<string, any>) => Record<string, any> | Promise<Record<string, any>>)(state)
      : this.options.args
    console.log(`[DEBUG][tool-call] [${nodeId}] 开始 工具=${toolName} 参数=${JSON.stringify(derivedArgs)}`)

    const toolCallId = `${nodeId}#${runtime.runId}#0`
    this.emitEvent(runtime, {
      nodeId,
      output: { type: 'tool_call', toolCallId, toolName, input: derivedArgs },
      status: 'running'
    })

    let result: any = null
    let errorMessage: string | null = null
    try {
      result = await runtime.toolRegistry.executeTool(toolName, derivedArgs)
    } catch (e: any) {
      errorMessage = e?.message ?? String(e)
    }

    if (errorMessage) {
      this.emitEvent(runtime, {
        nodeId,
        output: { type: 'tool_result', toolCallId, toolName, result: null, error: errorMessage },
        status: 'failed'
      })
      // [关键决策点] 工具失败：打 ERROR 日志
      console.error(`[ERROR][tool-call] [${nodeId}] 工具 ${toolName} 执行失败: ${errorMessage}`)
      return { errors: [`工具 ${toolName} 执行失败: ${errorMessage}`] }
    }

    this.emitEvent(runtime, {
      nodeId,
      output: { type: 'tool_result', toolCallId, toolName, result },
      status: 'success'
    })
    console.log(`[DEBUG][tool-call] [${nodeId}] 完成 工具=${toolName}`)

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
