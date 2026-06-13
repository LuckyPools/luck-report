/** LLM 决策节点类骨架 + invoke() 主循环；辅助函数抽到 llm-decide-helpers.ts */

import type { IRunnable, RunnableConfig } from '../runnable.ts'
import type { WorkflowRuntime } from '../runtime.ts'
import type { LastValueAfterFinishChannel } from '../channels.ts'
import * as helpers from './llm-decide-helpers.ts'

/**
 * LLM 决策节点构造选项
 */
export interface LLMDecideNodeOptions {
  /** 允许调用的工具白名单，不可为空 */
  allowedTools: string[]
  /** 必须成功执行的工具列表（AND 语义：全部必须调） */
  requiredToolResults?: string[]
  /** 至少要执行其中一个的工具列表（OR 语义：任一执行成功即可） */
  requiredToolResultsAny?: string[]
  /** 步骤内 LLM 最大循环轮次，默认 5 */
  maxIterations?: number
  /** 步骤描述，供 LLM 理解该步骤的目的 */
  description?: string
  /**
   * 两阶段提交的输出 Channel 名称
   * 节点通过 runtime.getChannel(name) 取得 Channel 实例，确保与图执行器共享同一引用
   */
  outChannelName: string
  /**
   * 节点结果键（可选）
   * 默认：返回 `{ [toolName]: result, ... }`；设置后合并到一个对象下，便于写入同名 state 字段
   */
  resultKey?: string
  /**
   * resultKey 模式下是否按 toolName 分键（默认 false 走展平逻辑）
   * true：避免工具返回的子字段被展平污染 resultKey 顶层
   */
  resultKeyAsObject?: boolean
  /** 节点ID（用于事件透传） */
  nodeId: string
}

/**
 * LLM 决策节点
 * 两阶段提交：内部循环执行工具，所有必需工具成功后 finish() 提交 outChannel
 */
export class LLMDecideNode implements IRunnable<Record<string, any>, Record<string, any>> {
  /** 节点配置选项，构造时确定不变 */
  public options: LLMDecideNodeOptions
  /** 节点内 toolCall 序号自增器，用于把 originalId 改写为 nodeId#runId#seq 命名空间的 mappedId */
  public toolCallCounter = 0
  /** 本次 invoke 使用的 runId 缓存（来自 runtime.runId） */
  public currentRunId: string = ''
  /** LLM 原始 toolCallId → 节点内 mappedId 映射，保证多轮对话 LLM 回放时 id 一致 */
  public toolCallIdMap: Map<string, string> = new Map()

  /**
   * 构造 LLM 决策节点
   */
  constructor(options: LLMDecideNodeOptions) {
    this.options = options
  }

  /** 暴露输出 Channel 名称给图构建层，便于触发/边判定识别节点真实写入的 channel */
  get outChannelName(): string {
    return this.options.outChannelName
  }

  /**
   * 执行 LLM 决策循环
   * @returns 节点输出的状态更新；必需工具缺失时返回 errors
   */
  async invoke(
    state: Record<string, any>,
    config?: RunnableConfig
  ): Promise<Record<string, any>> {
    const runtime: WorkflowRuntime | undefined = config?.configurable?.runtime
    const nodeId = this.options.nodeId
    const maxIterations = this.options.maxIterations ?? 5

    if (!runtime) {
      throw new Error(`LLMDecideNode [${nodeId}] 缺少 runtime 配置`)
    }

    // 每次 invoke 复位 toolCallCounter 和映射表，seq 从 0 连续递增
    this.toolCallCounter = 0
    this.toolCallIdMap.clear()
    this.currentRunId = runtime.runId

    // 通过 runtime.getChannel() 取得 GraphExecutor 当前持有的 Channel 实例，避免 cloneChannel 断链
    const outChannel = runtime.getChannel<LastValueAfterFinishChannel<Record<string, any>>>(this.options.outChannelName)
    if (!outChannel) {
      const existing = Array.from((runtime as any).channelMap?.keys?.() ?? [])
      console.error(
        `[ERROR][llm-decide-node] 节点 ${nodeId} 找不到输出 Channel [${this.options.outChannelName}]，` +
        `runtime 当前持有的 channel 数=${existing.length}，前若干个:`,
        existing.slice(0, 20)
      )
      throw new Error(
        `LLMDecideNode [${nodeId}] 找不到输出 Channel [${this.options.outChannelName}]，` +
        `请确认已通过 graph.addChannel('${this.options.outChannelName}', ...) 注册`
      )
    }

    const tools = helpers.filterAllowedTools(this, runtime.toolRegistry)
    const messages = helpers.buildMessages(this, state, runtime.memoryManager)

    const toolResults: Record<string, any> = {}
    // resultKey 模式：累计多次工具调用的合并数据，finish 时一次性 stage 给 outChannel
    let accumulatedResult: Record<string, any> | null = null
    let assistantContent = ''
    const hasRequiredTools = (this.options.requiredToolResults?.length ?? 0) > 0
      || (this.options.requiredToolResultsAny?.length ?? 0) > 0
    let iteration = 0

    while (iteration < maxIterations) {
      iteration++

      const llmGen = runtime.llmCaller(messages, tools, {
        signal: runtime.signal,
        sessionId: runtime.sessionId,
        modelId: runtime.modelId
      })

      let hasToolCall = false
      // 记录本轮必需工具是否已满足，满足则提前退出
      let requiredToolsSatisfied = false

      for await (const event of llmGen) {
        switch (event.type) {
          case 'token':
            assistantContent += event.content
            helpers.emitProgress(this, runtime, nodeId, event.content)
            break

          case 'reasoning':
            helpers.emitReasoning(this, runtime, nodeId, event.content)
            break

          case 'tool_call': {
            hasToolCall = true
            const mappedToolCallId = helpers.mapToolCallId(this, event.toolCallId)
            // 高危操作（删除/整表替换/合并）弹窗确认，常规读写不打断
            const toolDef = runtime.toolRegistry.get(event.toolName)
            const needConfirm = toolDef?.requireConfirm === true
            if (needConfirm && runtime.onToolConfirm) {
              const confirmed = await runtime.onToolConfirm({
                toolCallId: mappedToolCallId,
                toolName: event.toolName,
                input: event.input
              })
              if (!confirmed) {
                helpers.emitToolResult(this, runtime, nodeId, mappedToolCallId, event.toolName, null, '用户拒绝执行')
                continue
              }
            }

            helpers.emitToolCall(this, runtime, nodeId, mappedToolCallId, event.toolName, event.input)
            try {
              const result = await runtime.toolRegistry.executeTool(event.toolName, event.input)

              let normalizedResult = result
              if (result == null) {
                const errMsg = `工具 ${event.toolName} 未返回结果（result 为 null/undefined，可能是 iframe 通信丢失或工具实现遗漏 return）`
                normalizedResult = { error: errMsg, success: false, message: errMsg }
                helpers.emitToolResult(this, runtime, nodeId, mappedToolCallId, event.toolName, normalizedResult, errMsg)
              } else if (typeof result === 'object' && result.success === false) {
                const errMsg = result.message || '工具业务执行失败'
                normalizedResult = { error: errMsg, success: false, message: errMsg }
                helpers.emitToolResult(this, runtime, nodeId, mappedToolCallId, event.toolName, normalizedResult, errMsg)
              } else {
                helpers.emitToolResult(this, runtime, nodeId, mappedToolCallId, event.toolName, result)
              }
              toolResults[event.toolName] = normalizedResult

              if (this.options.resultKey) {
                if (!accumulatedResult) accumulatedResult = {}
                if (this.options.resultKeyAsObject) {
                  // 按 toolName 分键，避免工具返回的子字段被展平污染 resultKey 顶层
                  const isFailure = normalizedResult?.success === false
                  if (!isFailure) {
                    accumulatedResult[event.toolName] = normalizedResult
                  }
                } else if (normalizedResult && typeof normalizedResult === 'object' && !Array.isArray(normalizedResult)) {
                  // 展平模式：把工具返回的对象按 key 合并（如 {"1,1": def, "2,2": def}）
                  const isFailure = normalizedResult.success === false
                  if (!isFailure) {
                    Object.assign(accumulatedResult, normalizedResult)
                  }
                } else {
                  accumulatedResult[event.toolName] = normalizedResult
                }
              } else {
                outChannel.stage({ [event.toolName]: normalizedResult })
              }

              // 工具执行后立即检查必需工具是否已满足，业务失败时 checkRequiredTools 视为缺失，给 LLM 重试机会
              const missingNow = helpers.checkRequiredTools(this, toolResults)
              const missingAnyNow = helpers.checkRequiredToolsAny(this, toolResults)
              if (missingNow.length === 0 && missingAnyNow.length === 0) {
                requiredToolsSatisfied = true
              }

              // tool_calls[].id 与 tool_call_id 必须用 mappedId，LLM 校验 id 严格一致
              messages.push({
                role: 'assistant',
                tool_calls: [{
                  id: mappedToolCallId,
                  type: 'function',
                  function: { name: event.toolName, arguments: JSON.stringify(event.input) }
                }]
              })
              messages.push({
                role: 'tool',
                tool_call_id: mappedToolCallId,
                content: JSON.stringify(
                  (normalizedResult && typeof normalizedResult === 'object' && normalizedResult.success === false)
                    ? { error: normalizedResult.error, success: false, message: normalizedResult.message }
                    : normalizedResult
                )
              })
            } catch (err: any) {
              helpers.emitToolResult(this, runtime, nodeId, mappedToolCallId, event.toolName, null, err.message)
              toolResults[event.toolName] = { error: err.message }
              messages.push({
                role: 'tool',
                tool_call_id: mappedToolCallId,
                content: JSON.stringify({ error: err.message })
              })
            }
            break
          }

          case 'done': {
            // LLM 一轮拒调必需工具 → 追加强制 user 消息 → 进入下一轮 while
            // 根因：LLM 在 modify_and_write_* 等节点可能用 ReAct 文本格式输出 tool call
            if (
              !hasToolCall
              && hasRequiredTools
              && iteration < maxIterations
            ) {
              const requiredAny = this.options.requiredToolResultsAny ?? []
              const requiredAll = this.options.requiredToolResults ?? []
              const requiredHint = [
                ...requiredAll.map(t => `必须调: ${t}`),
                ...(requiredAny.length > 0 ? [`必须调任一: ${requiredAny.join(' / ')}`] : [])
              ].join('；')
              messages.push({
                role: 'user',
                content:
                  `【系统强制提示】你刚才没有调用必需工具，本步骤会失败。\n` +
                  `你必须：${requiredHint}。\n` +
                  `请使用 OpenAI 原生 function calling 格式输出 tool_calls，**不要**把工具调用写到文本 content 里（不要用 \`\`\`json {"tool": ...} \`\`\` 这种格式）。\n` +
                  `立即重新调用必需工具。`
              })
              break
            }
            // 满足任一即退出：必需工具已全部完成 / 本轮没调任何工具
            if (requiredToolsSatisfied || !hasToolCall) {
              iteration = maxIterations
            }
            break
          }

          case 'error':
            throw new Error(`LLM 调用失败: ${event.message}`)
        }
      }

      // 双重保险：for-await 结束后再次检查必需工具是否已满足
      if (requiredToolsSatisfied) break
    }

    const missingTools = helpers.checkRequiredTools(this, toolResults)
    const missingAny = helpers.checkRequiredToolsAny(this, toolResults)
    if (missingTools.length > 0 || missingAny.length > 0) {
      // 必需工具缺失，不提交 outChannel，返回空更新
      const reasons = [
        ...missingTools.map(t => `缺少: ${t}`),
        ...missingAny.map(t => `缺少任一: ${t}`)
      ]
      return { errors: [`必需工具未执行: ${reasons.join(', ')}`] }
    }

    if (this.options.resultKey && accumulatedResult) {
      outChannel.stage({ [this.options.resultKey]: accumulatedResult })
    }
    outChannel.finish()

    if (this.options.resultKey) {
      return { [this.options.resultKey]: accumulatedResult ?? {} }
    }
    return toolResults
  }
}
