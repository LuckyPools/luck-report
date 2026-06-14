/**
 * 工具调用节点（无 LLM，LangGraph 版本）
 * 直接返回 Partial<State>，由 LangGraph reducer 合并
 * 删除：outChannelName / stage() / finish() / runtime.getChannel()
 */

import { withInput } from '../node-wrapper.ts'
import type { WorkflowRuntime } from '../runtime.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'

/**
 * 工具参数形态：静态对象或从 state 派生的函数
 */
export type ToolCallArgs =
  | Record<string, any>
  | ((state: ReportState) => Record<string, any> | Promise<Record<string, any>>)

/**
 * ToolCallNode 构造选项
 */
export interface ToolCallNodeOptions {
  /** 节点ID（用于事件透传、错误信息），不可为空 */
  nodeId: string
  /** 必调的工具名，不可为空 */
  toolName: string
  /**
   * 工具参数：静态对象或从 state 派生的函数
   * 不可为空；无参工具请传 `{}`
   */
  args: ToolCallArgs
  /**
   * 结果键（可选）
   * - 设置后：把工具返回数据写入 `{ [resultKey]: result }`
   * - 不设置：按 toolName 作 key，写入 `{ [toolName]: result }`
   */
  resultKey?: string
}

/**
 * 工具调用节点工厂（无 LLM），适用于语义确定的单一读取工具
 * @param options - 节点配置
 * @returns LangGraph 节点函数
 *
 * @example
 * ```ts
 * g.addNode('loadDatasets', createToolCallNode({
 *   nodeId: 'load_datasets',
 *   toolName: 'get_datasets',
 *   args: {}
 * }))
 * ```
 */
export function createToolCallNode(options: ToolCallNodeOptions) {
  return withInput(async (state: ReportState, _config: any, runtime: WorkflowRuntime) => {
    const { nodeId, toolName, resultKey } = options

    // 派生参数
    const derivedArgs = typeof options.args === 'function'
      ? await (options.args as (state: ReportState) => Record<string, any> | Promise<Record<string, any>>)(state)
      : options.args

    // 关键决策点：状态变化时打日志（不在循环内打）
    console.log(`[DEBUG][tool-call] [${nodeId}] 开始 工具=${toolName} 参数=${JSON.stringify(derivedArgs)}`)

    const toolCallId = `${nodeId}#${runtime.runId}#0`
    runtime.emitEvent({
      mode: 'updates',
      event: { nodeId, output: { type: 'tool_call', toolCallId, toolName, input: derivedArgs }, status: 'running' },
      timestamp: Date.now()
    })

    let result: any = null
    let errorMessage: string | null = null
    try {
      result = await runtime.toolRegistry.executeTool(toolName, derivedArgs)
    } catch (e: any) {
      errorMessage = e?.message ?? String(e)
    }

    if (errorMessage) {
      runtime.emitEvent({
        mode: 'updates',
        event: { nodeId, output: { type: 'tool_result', toolCallId, toolName, result: null, error: errorMessage }, status: 'failed' },
        timestamp: Date.now()
      })
      console.error(`[ERROR][tool-call] [${nodeId}] 工具 ${toolName} 执行失败: ${errorMessage}`)
      return { errors: [`工具 ${toolName} 执行失败: ${errorMessage}`] } as ReportStateUpdate
    }

    runtime.emitEvent({
      mode: 'updates',
      event: { nodeId, output: { type: 'tool_result', toolCallId, toolName, result }, status: 'success' },
      timestamp: Date.now()
    })
    console.log(`[DEBUG][tool-call] [${nodeId}] 完成 工具=${toolName}`)

    return (resultKey
      ? { [resultKey]: result }
      : { [toolName]: result }) as ReportStateUpdate
  }, { nodeName: options.nodeId })
}
