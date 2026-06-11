/**
 * LLM 决策节点
 * 参照 LangGraph 的 ReAct Agent 模式，替换旧引擎的 _llm_decide 步骤
 *
 * 核心改进：
 * 1. 实现 IRunnable 接口，可被 StateGraph 编排
 * 2. 使用 LastValueAfterFinishChannel 两阶段提交，保证原子性
 * 3. 内部循环调用 LLM + 工具，成功时 finish() 提交，失败时不提交
 * 4. 支持 allowedTools 工具白名单
 * 5. 支持 requiredToolResults 必需工具校验
 * 6. 完整透传 step_progress / step_reasoning / tool_call / tool_result 事件
 */

import type { IRunnable, RunnableConfig } from './runnable'
import type { WorkflowRuntime, LLMEvent } from './runtime'
import type { LastValueAfterFinishChannel } from './channels'
import type { StreamEvent, UpdatesEventData } from './stream-mode'
import type { ToolRegistry } from '../../tools/registry'
import type { MemoryManager } from '../../memory/memory-manager'
import type { IntentAnalysisResult } from '../types'

/**
 * LLM 决策节点构造选项
 */
export interface LLMDecideNodeOptions {
  /** 允许调用的工具白名单，string[]，不可为空 */
  allowedTools: string[]
  /** 必须成功执行的工具列表（AND 语义：全部必须调），string[]，可选 */
  requiredToolResults?: string[]
  /**
   * 至少要执行其中一个的工具列表（OR 语义：任一执行成功即可），string[]，可选
   * 典型场景：单写工具场景下用 requiredToolResults 强制调用；当允许"只读"或"只规划"分支时，
   * 可用本字段放宽为"任一工具调用过即视为节点完成"
   */
  requiredToolResultsAny?: string[]
  /** 步骤内 LLM 最大循环轮次，默认 5 */
  maxIterations?: number
  /** 步骤描述，供 LLM 理解该步骤的目的 */
  description?: string
  /**
   * 两阶段提交的输出 Channel 名称，string，不可为空
   * 节点在执行时通过 runtime.getChannel(name) 取得 Channel 实例，
   * 确保节点与图执行器共享同一引用（避免 GraphExecutor.cloneChannel 断链）
   */
  outChannelName: string
  /**
   * 节点结果键（可选）
   * 默认：返回 `{ [toolName]: result, ... }`，按工具名分键
   * 设置后：把所有工具结果合并到一个对象下，返回 `{ [resultKey]: mergedData }`，
   * 便于把数据直接写入同名 state 字段（如 cellsData）
   * 关键：之前 read_cells 节点返回 `{read_cells: ...}`，但下游触发器 `cellsData` 永远收不到数据，
   * 导致 ensure_row_col / modify_and_write_cells 永远不触发，图引擎死等
   */
  resultKey?: string
  /** 节点ID（用于事件透传） */
  nodeId: string
}

/**
 * LLM 决策节点
 *
 * 替换旧引擎的 _llm_decide 步骤，核心区别：
 * - 旧引擎：步骤内 LLM 循环，失败后仅重试整个步骤，不阻断后续
 * - 新节点：内部循环 + 两阶段提交，失败时 outChannel 不提交 → 下游不触发
 *
 * 执行流程：
 * 1. 从 runtime 获取 allowedTools 对应的工具定义
 * 2. 构建 LLM 消息（系统提示 + 用户消息 + 工具描述）
 * 3. 循环调用 LLM，解析工具调用，执行工具
 * 4. 每次工具执行后 stage() 中间结果到 outChannel
 * 5. 所有必需工具执行成功后 finish() 提交
 * 6. 失败时不调用 finish()，outChannel 保持旧值
 */
export class LLMDecideNode implements IRunnable<Record<string, any>, Record<string, any>> {
  private options: LLMDecideNodeOptions
  /**
   * 节点内 toolCall 序号自增器
   * 用于把 LLM 返回的 originalId（OpenAI 格式 functions.read_cells:0，跨响应可能重复）
   * 改写为全局唯一的 mappedId（格式：nodeId#runId#seq，跨对话 / 跨节点 / 跨 superstep 全部唯一）
   * 解决：
   *   1) 同节点两次 read_cells 共用 originalId，聊天 UI find() 永远命中首条消息
   *   2) 同一会话第 2 轮对话再次执行 modify_and_write_cells 时，mappedId 与第 1 轮碰撞
   * runId 来自 runtime；每次 invoke 用 config 注入的 runtime.runId（保证主图/子图一致）
   * 关键：仅本节点实例的 invoke() 期间有效；每次 invoke 复位为 0
   */
  private toolCallCounter = 0
  /** 本次 invoke 使用的 runId 缓存（来自 runtime.runId），mapToolCallId 时读取 */
  private currentRunId: string = ''
  /**
   * LLM 原始 toolCallId → 节点内 mappedId 映射
   * 同步 OpenAI 消息历史里的 tool_calls[].id / tool_call_id，
   * 保证多轮对话 LLM 回放时仍能对上号（LLM 校验 id 严格一致）
   */
  private toolCallIdMap: Map<string, string> = new Map()

  /**
   * 构造 LLM 决策节点
   * @param options - 节点配置选项，LLMDecideNodeOptions，不可为空
   */
  constructor(options: LLMDecideNodeOptions) {
    this.options = options
  }

  /**
   * 暴露输出 Channel 名称给图构建层
   * 供 addNode 提取写入 NodeDefinition.outChannelName，便于触发/边判定识别节点真实写入的 channel
   * @returns 输出 Channel 名称，string，不可为空
   */
  get outChannelName(): string {
    return this.options.outChannelName
  }

  /**
   * 执行 LLM 决策循环
   * @param state - 当前工作流状态，Record<string, any>，不可为空
   * @param config - 运行时配置，RunnableConfig，可选
   * @returns 节点输出的状态更新，Promise<Record<string, any>>
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

    // P-A 修复：每次 invoke 复位 toolCallCounter 和映射表
    // 单次 invoke 可能经历多轮 LLM 调用，每轮会产生新的 tool_call；
    // 复位保证同节点同次执行的 toolCall 序号从 0 连续递增
    this.toolCallCounter = 0
    this.toolCallIdMap.clear()
    // 记录本次 invoke 的 runId（来自 runtime），mapToolCallId 用它生成全局唯一 ID
    // 关键：runtime.runId 由子 runtime.fork() 继承，所以主图 / 子图看到的 runId 一定一致
    this.currentRunId = runtime.runId

    // P0-6：按名称从 runtime 取得两阶段提交 Channel
    // 关键：GraphExecutor.initialize() 会 cloneChannel（克隆出新实例），
    // 若 LLMDecideNode 直接持有构建期引用，调 finish() 时修改的是旧实例，
    // 下游触发判断读到的是新实例 → 引用断裂 → 节点完成后下游永远不触发
    // 通过 runtime.getChannel() 取得的是 GraphExecutor 当前执行的 Channel 实例，
    // 节点写入与下游读取共享同一引用
    const outChannel = runtime.getChannel<LastValueAfterFinishChannel<Record<string, any>>>(this.options.outChannelName)
    if (!outChannel) {
      // [诊断] 列出 runtime 中实际存在的 channel 名称，便于快速定位：
      // 1) 节点 outChannelName 拼错
      // 2) 子图未 fork runtime，污染了主图 channelMap
      const existing = Array.from(
        (runtime as any).channelMap?.keys?.() ?? []
      )
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

    // 1. 获取允许的工具定义
    const tools = this.filterAllowedTools(runtime.toolRegistry)

    // 2. 构建 LLM 消息
    const messages = this.buildMessages(state, runtime.memoryManager)

    // 3. LLM 循环
    const toolResults: Record<string, any> = {}
    // [修复] resultKey 模式下，累计多次工具调用的合并数据
    // 仅在最后 finish 时一次性 stage 给 outChannel + 写 state，避免中间 stage 覆盖
    let accumulatedResult: Record<string, any> | null = null
    // [诊断] 累积 LLM 文本回复（仅 token 事件拼接），用于"未调工具"关键决策点日志排查
    // 不在循环内打印，仅在节点退出或 LLM 一轮空响应时按需打，避免高频日志
    let assistantContent = ''
    // [诊断] 是否设了必需工具要求：仅当 true 时，未调任何工具才算异常，才打 WARN
    // plan_tasks 等未设必需工具的节点 LLM 不调工具是正常的，不打 WARN 避免噪音
    const hasRequiredTools = (this.options.requiredToolResults?.length ?? 0) > 0
      || (this.options.requiredToolResultsAny?.length ?? 0) > 0
    let iteration = 0

    console.log(`[DEBUG][llm-decide] [${nodeId}] 开始 allowedTools=${JSON.stringify(this.options.allowedTools)}`)

    while (iteration < maxIterations) {
      iteration++

      // 调用 LLM
      const llmGen = runtime.llmCaller(messages, tools, {
        signal: runtime.signal,
        sessionId: runtime.sessionId,
        modelId: runtime.modelId
      })

      let hasToolCall = false
      // [修复] 记录本轮是否有必需工具成功执行，用于决定是否提前退出循环
      let requiredToolsSatisfied = false

      for await (const event of llmGen) {
        switch (event.type) {
          case 'token':
            // [诊断] 仅累积 LLM 文本回复，不在每 token 打日志
            assistantContent += event.content
            this.emitProgress(runtime, nodeId, event.content)
            break

          case 'reasoning':
            this.emitReasoning(runtime, nodeId, event.content)
            break

          case 'tool_call': {
            hasToolCall = true
            // P-A 修复：把 LLM 原始 toolCallId 改写为全局唯一 mappedId
            // 根因：OpenAI 格式 functions.read_cells:0 跨响应复用，导致聊天 UI 同 id 重复
            // 解决：${nodeId}#${runId}#${seq} 命名空间隔离，工具调用 / 工具结果 / 消息历史三处统一
            const mappedToolCallId = this.mapToolCallId(event.toolCallId)
            console.log(`[DEBUG][llm-decide] [${nodeId}] tool_call ${event.toolName} (${event.toolCallId}→${mappedToolCallId})`)
            // 工具确认：仅对高危操作（删除/整表替换/合并）弹窗，常规读写不打断用户
            // 关键：之前无条件弹确认，导致每次写单元格都要用户点一下，体验极差
            const toolDef = runtime.toolRegistry.get(event.toolName)
            const needConfirm = toolDef?.requireConfirm === true
            if (needConfirm && runtime.onToolConfirm) {
              const confirmed = await runtime.onToolConfirm({
                toolCallId: mappedToolCallId,
                toolName: event.toolName,
                input: event.input
              })
              if (!confirmed) {
                this.emitToolResult(runtime, nodeId, mappedToolCallId, event.toolName, null, '用户拒绝执行')
                continue
              }
            }

            // 执行工具
            this.emitToolCall(runtime, nodeId, mappedToolCallId, event.toolName, event.input)
            try {
              const result = await runtime.toolRegistry.executeTool(event.toolName, event.input)

              // [Plan A 修复] 业务失败归一：工具返回 {success:false, message, data} 时，
              // 必须把 toolResults 中的值改写成 {error:message} 形态，
              // 让 checkRequiredTools 的 `!result || result.error` 判定能正确识别为失败，
              // 避免"工具业务失败但被节点误判为成功、整步直接 finish、不再重试"的 BUG
              // 根因：原逻辑只把 throw 路径的失败用 {error} 形态存，业务失败被原样保留 success:false，
              //       checkRequiredTools 看到的是非 falsy 且无 error 属性 → 误判为成功
              let normalizedResult = result
              if (result && typeof result === 'object' && result.success === false) {
                const errMsg = result.message || '工具业务执行失败'
                // [关键决策点] 业务失败 → 关键日志，便于排查"为什么任务没重试"
                console.warn(
                  `[WARN][llm-decide] [${nodeId}] 工具 ${event.toolName} 业务失败: ${errMsg}`
                )
                normalizedResult = { error: errMsg, success: false, message: errMsg }
                // 同步发射到事件流，让 UI 也能看到失败态（之前用 null result 会被误以为成功）
                this.emitToolResult(runtime, nodeId, mappedToolCallId, event.toolName, normalizedResult, errMsg)
              } else {
                this.emitToolResult(runtime, nodeId, mappedToolCallId, event.toolName, result)
              }
              toolResults[event.toolName] = normalizedResult

              // 暂存中间结果到 outChannel（不入版本号）
              // [修复] 设置 resultKey 时，把每次工具结果合并暂存，
              // 避免多工具调用相互覆盖；finish 时再统一 stage 给同名 state Channel
              if (this.options.resultKey) {
                if (!accumulatedResult) accumulatedResult = {}
                if (normalizedResult && typeof normalizedResult === 'object' && !Array.isArray(normalizedResult)) {
                  // 把工具返回的对象按 key 合并（如 {"1,1": def, "2,2": def}）
                  // 业务失败时 resultKey 模式下不合并到 accumulatedResult，避免污染下游
                  if (normalizedResult.success !== false) {
                    Object.assign(accumulatedResult, normalizedResult)
                  }
                } else {
                  // 标量/数组型结果，按 toolName 放二级键
                  accumulatedResult[event.toolName] = normalizedResult
                }
              } else {
                outChannel.stage({ [event.toolName]: normalizedResult })
              }

              // [修复] 工具执行后（无论成功或业务失败），立即检查必需工具是否已全部满足
              // 满足则标记提前退出，避免 LLM 在后续轮次重复调用已成功的工具
              // [Plan A 修复] 业务失败时 checkRequiredTools 现在会识别为缺失，requiredToolsSatisfied 不会置 true，
              //               LLM 就有机会在同一节点的下一次 iteration 重试该工具
              const missingNow = this.checkRequiredTools(toolResults)
              const missingAnyNow = this.checkRequiredToolsAny(toolResults)
              if (missingNow.length === 0 && missingAnyNow.length === 0) {
                requiredToolsSatisfied = true
                // [决策点] 必需工具全部命中，提前退出标志
                console.log(`[DEBUG][llm-decide] [${nodeId}] 必需工具全部满足，提前退出 (工具 ${event.toolName} 完成，缺=${JSON.stringify(missingNow)})`)
              } else {
                console.log(`[DEBUG][llm-decide] [${nodeId}] 工具 ${event.toolName} 完成，缺=${JSON.stringify(missingNow)}/缺任一=${JSON.stringify(missingAnyNow)}`)
              }

              // 将工具结果追加到消息，供下一轮 LLM 参考
              // P-A 修复：tool_calls[].id 与 tool_call_id 必须用 mappedId
              // LLM 严格校验 id 一致（assistant.tool_calls[i].id === tool.tool_call_id），
              // 用原 id 会让第二轮 LLM 回放校验失败
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
                // [Plan A 修复] 业务失败时把 {error, message} 都塞给 LLM，让 LLM 看到具体失败原因用于重试决策
                content: JSON.stringify(
                  normalizedResult.success === false
                    ? { error: normalizedResult.error, success: false, message: normalizedResult.message }
                    : normalizedResult
                )
              })
            } catch (err: any) {
              this.emitToolResult(runtime, nodeId, mappedToolCallId, event.toolName, null, err.message)
              toolResults[event.toolName] = { error: err.message }
              // 工具执行失败，追加错误信息到消息
              messages.push({
                role: 'tool',
                tool_call_id: mappedToolCallId,
                content: JSON.stringify({ error: err.message })
              })
            }
            break
          }

          case 'done':
            // [关键决策点] LLM 一轮没调任何工具但有必需工具要求 → 节点会失败
            // 打 WARN 日志打印 LLM 实际回复，便于排查"为什么 LLM 决定不调工具"
            // 仅在 hasRequiredTools=true 时打，避免 plan_tasks 等非必需节点产生噪音
            if (!hasToolCall && hasRequiredTools) {
              const preview = assistantContent.length > 500
                ? assistantContent.slice(0, 500) + '...(已截断)'
                : assistantContent
              console.warn(
                `[WARN][llm-decide] [${nodeId}] LLM 轮次未调任何工具 ` +
                `必需=${JSON.stringify(this.options.requiredToolResults)}/缺任一=${JSON.stringify(this.options.requiredToolResultsAny)} ` +
                `LLM回复="${preview}"`
              )
            }
            // [加固 C] retry 兜底：LLM 一轮拒调必需工具 → 追加强制 user 消息 → 进入下一轮 while
            // 根因：LLM 在 modify_and_write_* 等节点可能用 ReAct 文本格式输出 tool call，
            //       本节点 adapter 只识别 native function calling，导致 LLM 实际有调用意图但被丢弃
            //       retry 时通过 user 消息明确告诉 LLM 必须用 native 格式 + 必须调哪些工具
            // 边界：仅在 hasRequiredTools && !hasToolCall && 还有重试余量时追加
            //       iteration 已被顶部自增，此时 iteration === maxIterations 表示已用尽所有重试
            if (
              !hasToolCall
              && hasRequiredTools
              && iteration < maxIterations
            ) {
              // [关键决策点] 状态变化：进入 retry 阶段
              console.warn(
                `[WARN][llm-decide] [${nodeId}] 第${iteration}轮未调必需工具，追加系统强制消息进入第${iteration + 1}轮重试`
              )
              // 构造强制 user 消息：明确列必需工具 + 强调 native function calling 格式
              // 用 user 角色而非 system 角色，避免 LLM 把 system 当默认值而忽略
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
              // [关键] 不设置 iteration = maxIterations，让 while 自然进入下一轮
              // while 顶部 iteration++ 继续推进，maxIterations 兜底防无限循环
              break
            }
            // [修复] 三重退出条件（满足任一即退出）：
            // 1. 必需工具已全部完成 → 不再给 LLM 机会重复调用已成功的工具
            // 2. LLM 本轮没有调用任何工具 → 说明 LLM 认为任务结束
            // 3. （隐含）iteration 达到 maxIterations → while 条件自动退出
            if (requiredToolsSatisfied || !hasToolCall) {
              iteration = maxIterations // 退出 while
            }
            break

          case 'error':
            throw new Error(`LLM 调用失败: ${event.message}`)
        }
      }

      // [修复] 双重保险：for-await 结束后再次检查必需工具是否已满足
      // 处理 LLM 在本轮调用了必需工具但没有发出 done 事件的边缘情况
      if (requiredToolsSatisfied) break
    }

    console.log(`[DEBUG][llm-decide] [${nodeId}] 循环结束 共${iteration}轮 keys=${JSON.stringify(Object.keys(toolResults))}`)

    // [关键决策点] 节点退出时若 LLM 一次工具都没调且设了必需工具要求 → 必失败
    // 兜底 WARN：打印完整 LLM 文本回复（限长），便于排查"为什么 LLM 决定不调任何工具"
    // 配合上面 done 分支的 WARN，双重保障：单轮未调 + 节点退出未调
    if (Object.keys(toolResults).length === 0 && hasRequiredTools) {
      const preview = assistantContent.length > 1000
        ? assistantContent.slice(0, 1000) + '...(已截断)'
        : assistantContent
      console.warn(
        `[WARN][llm-decide] [${nodeId}] 节点退出未调任何必需工具 ` +
        `必需=${JSON.stringify(this.options.requiredToolResults)}/缺任一=${JSON.stringify(this.options.requiredToolResultsAny)} ` +
        `LLM完整回复="${preview}"`
      )
    }

    // 4. 校验必需工具
    // [修复] 同时校验 AND 语义（requiredToolResults 全部必须）和 OR 语义（requiredToolResultsAny 任一即可）
    const missingTools = this.checkRequiredTools(toolResults)
    const missingAny = this.checkRequiredToolsAny(toolResults)
    if (missingTools.length > 0 || missingAny.length > 0) {
      // 必需工具缺失，不提交 outChannel，返回空更新
      // 关键：之前即使 LLM 不调 read_cells 也走 finish 路径，cellsData 永远空，下游永远不触发
      const reasons = [
        ...missingTools.map(t => `缺少: ${t}`),
        ...missingAny.map(t => `缺少任一: ${t}`)
      ]
      return { errors: [`必需工具未执行: ${reasons.join(', ')}`] }
    }

    // 5. 所有必需工具执行成功，提交 outChannel
    // [修复] resultKey 模式：把累计数据 stage 到 outChannel 并通过返回值写到同名 state Channel
    if (this.options.resultKey && accumulatedResult) {
      outChannel.stage({ [this.options.resultKey]: accumulatedResult })
    }
    outChannel.finish()

    // 6. 返回工具结果作为状态更新
    // [修复] resultKey 模式：返回单 key 对象，让 applyWrites 把数据写入 state.cellsData 等目标字段
    if (this.options.resultKey) {
      return { [this.options.resultKey]: accumulatedResult ?? {} }
    }
    return toolResults
  }

  /**
   * 过滤允许的工具定义
   * @param toolRegistry - 工具注册表，ToolRegistry，不可为空
   * @returns 过滤后的工具定义列表
   */
  private filterAllowedTools(toolRegistry: ToolRegistry): any[] {
    const allTools = toolRegistry.getToolDefinitions()
    if (this.options.allowedTools.length === 0) return allTools
    return allTools.filter((t: any) =>
      this.options.allowedTools.includes(t.function?.name ?? t.name)
    )
  }

  /**
   * 构建 LLM 消息列表
   * @param state - 当前状态，Record<string, any>，不可为空
   * @param memoryManager - 记忆管理器，MemoryManager，不可为空
   * @returns 消息列表
   */
  private buildMessages(state: Record<string, any>, memoryManager: MemoryManager): any[] {
    // [修复] MemoryManager 没有 getMessages()，正确方法名是 getContextMessages()
    // getContextMessages() 会自动注入 summary + reportSnapshot，再返回历史消息
    const history = memoryManager.getContextMessages()
    // 在历史消息末尾追加当前步骤的上下文
    const stepContext = this.options.description
      ? `\n\n当前步骤: ${this.options.description}`
      : ''
    // [增强] 知识库内容注入：基于会话级缓存 + docRefs 判断
    // 策略：
    //   1) 拿 state.searchResults.docRefs（load_docs 节点写入的文档名列表）
    //   2) 对每个 docName 检查 messages 是否已有 tool_result 注入
    //      - 已有 → 不再重复拼，knowledgeBlock 提示"已加载"
    //      - 未有 → 从 cache 读全文注入（首次或 cache 命中但 messages 被压缩掉的情况）
    // 收益：避免 messages 里 tool_result 全文 + knowledgeBlock 全文 的双重塞入
    const searchResults = state.searchResults
    let knowledgeBlock = ''
    if (searchResults && typeof searchResults === 'object') {
      const docRefs: string[] = Array.isArray(searchResults.docRefs) ? searchResults.docRefs : []
      if (docRefs.length > 0) {
        const loadedInMessages = memoryManager.getLoadedDocNames()
        const missingInMessages: string[] = []
        const alreadyLoaded: string[] = []
        for (const doc of docRefs) {
          if (loadedInMessages.has(doc)) {
            alreadyLoaded.push(doc)
          } else {
            missingInMessages.push(doc)
          }
        }
        // 关键：只有在 messages 没存该 doc 的 tool_result 时，才从 cache 注入全文
        // 避免 messages 和 knowledgeBlock 双重塞入
        const cache = memoryManager.getKnowledgeCache()
        const contentParts: string[] = []
        if (missingInMessages.length > 0) {
          for (const doc of missingInMessages) {
            const content = cache.get(doc)
            if (content) {
              contentParts.push(`[${doc}]\n${content}`)
            } else {
              // cache 也没命中（说明 load_docs 没走过、或被清了）→ 提示 LLM 知识缺失
              contentParts.push(`[${doc}]\n（文档未在缓存中）`)
            }
          }
        }
        if (contentParts.length > 0) {
          knowledgeBlock = `\n\n[参考知识]\n以下是已加载的文档/知识库内容，请基于这些内容进行决策，不要凭直觉猜测 API/字段：\n${contentParts.join('\n\n---- 分界线 ----\n')}`
        }
        if (alreadyLoaded.length > 0) {
          // messages 已有 tool_result 注入，knowledgeBlock 拼"已加载"提示，避免重复塞全文
          const alreadyHint = `\n\n[已加载知识]\n以下文档已通过工具调用注入到对话历史中，请基于工具返回的内容进行决策：${alreadyLoaded.join('、')}`
          knowledgeBlock = knowledgeBlock ? `${knowledgeBlock}${alreadyHint}` : alreadyHint
        }
      }
    }
    const userMessage = state.userMessage + knowledgeBlock + stepContext

    return [
      ...history,
      { role: 'user', content: userMessage }
    ]
  }

  /**
   * 校验必需工具是否都已执行成功（AND 语义）
   * @param toolResults - 工具执行结果，Record<string, any>，不可为空
   * @returns 缺失的工具名称列表
   */
  private checkRequiredTools(toolResults: Record<string, any>): string[] {
    const required = this.options.requiredToolResults ?? []
    return required.filter(name => {
      const result = toolResults[name]
      return !result || result.error
    })
  }

  /**
   * 校验必需工具是否至少执行了一个（OR 语义）
   * @param toolResults - 工具执行结果，Record<string, any>，不可为空
   * @returns 该组整体缺失时的工具列表（任一未命中即整组算缺失），空数组表示已命中
   */
  private checkRequiredToolsAny(toolResults: Record<string, any>): string[] {
    const any = this.options.requiredToolResultsAny ?? []
    if (any.length === 0) return []
    const hit = any.some(name => {
      const r = toolResults[name]
      return r && !r.error
    })
    return hit ? [] : any
  }

  /** 发射步骤进度事件 */
  private emitProgress(runtime: WorkflowRuntime, stepId: string, content: string): void {
    runtime.emitEvent({
      mode: 'updates',
      event: { nodeId: stepId, output: { type: 'step_progress', message: content }, status: 'running' },
      timestamp: Date.now()
    })
  }

  /** 发射推理内容事件 */
  private emitReasoning(runtime: WorkflowRuntime, stepId: string, content: string): void {
    runtime.emitEvent({
      mode: 'updates',
      event: { nodeId: stepId, output: { type: 'step_reasoning', content }, status: 'running' },
      timestamp: Date.now()
    })
  }

  /** 发射工具调用事件 */
  private emitToolCall(runtime: WorkflowRuntime, stepId: string, toolCallId: string, toolName: string, input: any): void {
    runtime.emitEvent({
      mode: 'updates',
      event: { nodeId: stepId, output: { type: 'tool_call', toolCallId, toolName, input }, status: 'running' },
      timestamp: Date.now()
    })
  }

  /** 发射工具结果事件 */
  private emitToolResult(runtime: WorkflowRuntime, stepId: string, toolCallId: string, toolName: string, result: any, error?: string): void {
    runtime.emitEvent({
      mode: 'updates',
      event: { nodeId: stepId, output: { type: 'tool_result', toolCallId, toolName, result, error }, status: 'running' },
      timestamp: Date.now()
    })
  }

  /**
   * P-A 修复：将 LLM 原始 toolCallId 改写为全局唯一 mappedId
   * 命名空间格式：${nodeId}#${runId}#${seq}，例如 read_cells#abc123_xyz#0
   * runId 由 WorkflowRuntime 注入，保证主图/子图/多次 invoke 不会撞 key
   * 保证：同节点多次 invoke / 不同节点并发 / OpenAI 跨响应同名 id 都不会在 UI 侧撞 key
   * @param originalId - LLM 返回的原始 toolCallId，string，不可为空
   * @returns 全局唯一 mappedId，string，不可为空
   */
  private mapToolCallId(originalId: string): string {
    const cached = this.toolCallIdMap.get(originalId)
    if (cached) return cached
    // 全局唯一：nodeId#runId#seq，跨 invoke / 跨对话 / 跨 superstep 不会碰撞
    // seq 每次 invoke 复位为 0 仍然可读（同一个节点内从 0 递增）
    const mapped = `${this.options.nodeId}#${this.currentRunId}#${this.toolCallCounter++}`
    this.toolCallIdMap.set(originalId, mapped)
    return mapped
  }
}
