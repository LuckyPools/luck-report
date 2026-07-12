/**
 * LLM 决策节点（LangGraph 版本）
 * 两阶段提交 → 直接返回 Partial<State>（LangGraph 通过 Annotation reducer 自动合并）
 * 保留：toolCallIdMap（多轮 LLM 回放时 id 一致）/ requiredToolResults 校验 / resultKey 模式
 * 删除：outChannelName / stage() / finish() / runtime.getChannel()
 */

import { withInput } from '../node-wrapper.ts'
import type { LangGraphRunnableConfig } from '@langchain/langgraph'
import type { WorkflowRuntime } from '../runtime.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'
import { buildWorkflowStateContext } from '../utils.ts'
import { AskUserInterrupt } from '../ask-user-interrupt.ts'

/**
 * LLM 决策节点构造选项
 * 对齐原 LLMDecideNodeOptions，删除 outChannelName（不再需要 outChannel 引用）
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
  /** 步骤描述，供 LLM 理解该步骤的目的；支持动态函数，接收 state 返回描述文本 */
  description?: string | ((state: ReportState) => string)
  /** 节点结果键（可选）
   * 默认：返回 `{ [toolName]: result, ... }`（LangGraph reducer 自动按 key 合并）
   * 设置后合并到一个对象下：{ [resultKey]: accumulated }
   */
  resultKey?: string
  /**
   * 禁用所有工具（LLM 只能生成文本，不调用任何工具）
   * 用于 summary 等纯文本输出节点，避免 LLM 调用工具而非生成文本
   */
  disableTools?: boolean
  /**
   * resultKey 模式下是否按 toolName 分键（默认 false 走展平逻辑）
   * true：避免工具返回的子字段被展平污染 resultKey 顶层
   */
  resultKeyAsObject?: boolean
  /** 节点ID（用于事件透传） */
  nodeId: string
}

/**
 * LLM 决策节点工厂
 * 返回 LangGraph 兼容的节点函数 (state, config) => Partial<State>
 *
 * 与旧 LLMDecideNode 类的行为差异：
 * 1. 不再依赖 runtime.getChannel() 拿 outChannel — LangGraph reducer 直接合并节点返回值
 * 2. 不再调用 outChannel.stage/finish — 节点函数返回值就是 state 更新
 * 3. resultKey 模式：直接合并到 { [resultKey]: accumulated } 返回
 * 4. 必需工具缺失：返回 { errors: [...] }，由 errors 字段的 append reducer 累加
 *
 * @param options - 节点配置
 * @returns LangGraph 节点函数
 *
 * @example
 * ```ts
 * g.addNode('planTasks', createLLMDecideNode({
 *   nodeId: 'plan_tasks',
 *   allowedTools: ['get_datasources'],
 *   requiredToolResults: ['get_datasources'],
 *   maxIterations: 1,
 *   description: '探查数据源列表'
 * }))
 * ```
 */
export function createLLMDecideNode(options: LLMDecideNodeOptions) {
  // 实例级状态：每次 invoke 复位（langgraph 会为每次执行创建新的闭包）
  let toolCallCounter = 0
  let currentRunId = ''
  const toolCallIdMap = new Map<string, string>()

  return withInput(async (state: ReportState, _config: LangGraphRunnableConfig, runtime: WorkflowRuntime) => {
    const nodeId = options.nodeId
    const maxIterations = options.maxIterations ?? 5

    // 复位本次执行的 toolCall 状态
    toolCallCounter = 0
    toolCallIdMap.clear()
    currentRunId = runtime.runId

    // disableTools=true 时不给 LLM 任何工具，强制纯文本输出（用于 summary 等节点）
    const tools = options.disableTools ? [] : filterAllowedTools(options, runtime.toolRegistry)
    const messages = buildMessages(options, state, runtime.memoryManager)

    const toolResults: Record<string, any> = {}
    let accumulatedResult: Record<string, any> | null = null
    let assistantContent = ''
    let lastAssistantToolCalls: any[] = []
    const hasRequiredAll = (options.requiredToolResults?.length ?? 0) > 0
    const hasRequiredAny = (options.requiredToolResultsAny?.length ?? 0) > 0
    const hasRequiredTools = hasRequiredAll || hasRequiredAny
    // 关键决策点：首轮是否强制必选工具
    // - requiredToolResults (AND) → 任何时候都强制
    // - requiredToolResultsAny (OR) + forceToolChoiceFirst=true → 仅首轮强制第一个必需工具，
    //   强制 LLM 优先尝试出 plan/写数据；后续轮次放开 toolChoice 让 LLM 自由选 ask_user 等
    const baseToolChoice: any = hasRequiredAll
      ? (options.requiredToolResults!.length === 1
        ? { type: 'function', function: { name: options.requiredToolResults![0] } }
        : 'required')
      : (hasRequiredAny && (options as any).forceToolChoiceFirst
          ? { type: 'function', function: { name: options.requiredToolResultsAny![0] } }
          : undefined)
    let toolChoice: any = baseToolChoice
    let iteration = 0
    // 关键决策点：跟踪必需工具是否曾被调用但返回 error，用于触发"系统强制重试"
    // 之前只有 !hasToolCall 才会重试；thinking 模式下 LLM 经常先发空 input 占位再思考，
    // 导致 hasToolCall=true 但工具拿到 {error:...}，必须再给 LLM 一次带错误 hint 的机会
    let hasToolError = false

    while (iteration < maxIterations) {
      iteration++
      // 关键决策点：首轮过后放开 toolChoice，让 LLM 自由选 ask_user 等
      if (iteration > 1) toolChoice = undefined

      const llmGen = runtime.llmCaller(messages, tools, {
        signal: runtime.signal,
        sessionId: runtime.sessionId,
        modelId: runtime.modelId,
        toolChoice
      })

      let hasToolCall = false
      let requiredToolsSatisfied = false

      for await (const event of llmGen) {
        switch (event.type) {
          case 'token':
            assistantContent += event.content
            runtime.emitEvent({ mode: 'updates', event: { nodeId, output: { type: 'step_progress', message: event.content }, status: 'running' }, timestamp: Date.now() })
            break

          case 'reasoning':
            runtime.emitEvent({ mode: 'updates', event: { nodeId, output: { type: 'step_reasoning', content: event.content }, status: 'running' }, timestamp: Date.now() })
            break

          case 'token_usage':
            runtime.emitEvent({ mode: 'updates', event: { nodeId, output: { type: 'token_usage', usage: event.usage }, status: 'running' }, timestamp: Date.now() })
            break

          case 'tool_call': {
            hasToolCall = true
            const mappedToolCallId = mapToolCallId(nodeId, currentRunId, event.toolCallId, toolCallIdMap, () => toolCallCounter++)
            // #region debug-point planner-no-tool-call
            lastAssistantToolCalls = [{ id: mappedToolCallId, name: event.toolName, input: event.input }]
            // #endregion

            // 高危操作（删除/整表替换/合并）弹窗确认
            const toolDef = runtime.toolRegistry.get(event.toolName)
            const needConfirm = toolDef?.requireConfirm === true
            if (needConfirm && runtime.onToolConfirm) {
              const confirmed = await runtime.onToolConfirm({
                toolCallId: mappedToolCallId,
                toolName: event.toolName,
                input: event.input
              })
              if (!confirmed) {
                runtime.emitEvent({ mode: 'updates', event: { nodeId, output: { type: 'tool_result', toolCallId: mappedToolCallId, toolName: event.toolName, result: null, error: '用户拒绝执行' }, status: 'running' }, timestamp: Date.now() })
                continue
              }
            }

            // 关键决策点：中断型工具（interruptOnCall='ask_user'）
            // - 不调用 execute，直接发 user_prompt 事件 + 抛 AskUserInterrupt
            // - LangGraph stream 异常退出 → agent-loop 捕获 → 转 done(awaiting_user) → UI
            // - gather_requirements 节点限制最大询问轮次；超限不抛中断，给 LLM 一个 error 反馈，强制收敛
            if (toolDef?.interruptOnCall === 'ask_user') {
              const question = String(event.input?.question ?? '').trim()
              if (!question) {
                const errMsg = 'ask_user 工具缺少 question 参数'
                toolResults[event.toolName] = { error: errMsg, success: false, message: errMsg }
                hasToolError = true
                messages.push({
                  role: 'assistant',
                  tool_calls: [{
                    id: mappedToolCallId,
                    type: 'function',
                    function: { name: event.toolName, arguments: (event.input as any)?._rawArguments ?? JSON.stringify(event.input) }
                  }]
                })
                messages.push({
                  role: 'tool',
                  tool_call_id: mappedToolCallId,
                  content: JSON.stringify({ error: errMsg, success: false })
                })
                runtime.emitEvent({ mode: 'updates', event: { nodeId, output: { type: 'tool_result', toolCallId: mappedToolCallId, toolName: event.toolName, result: null, error: errMsg }, status: 'failed' }, timestamp: Date.now() })
                break
              }
              // 关键决策点：轮次检查放在 runtime 的 session 级计数器上，跨 AskUserInterrupt 也能累计
              const { getGatherRounds, markGatherRound, appendGatherHistory } = await import('../gather-state.ts')
              const sessionKey = runtime.sessionId ?? 'default'
              const currentRounds = getGatherRounds(sessionKey)
              const maxRounds = runtime.gatherMaxRounds
              if (currentRounds >= maxRounds) {
                // 关键决策点：超过最大轮次，不再抛中断（避免无限循环）
                // 给 LLM 一个明确的 error 反馈，让它转用 submit_requirements 提交 best-effort 结果
                const errMsg = `已达到最大询问轮次 ${maxRounds}，禁止继续 ask_user。请直接调用 plan_tasks 提交任务计划（必填字段缺失时用合理默认值填充，并在 description 中注明）。`
                toolResults[event.toolName] = { error: errMsg, success: false, message: errMsg }
                hasToolError = true
                messages.push({
                  role: 'assistant',
                  tool_calls: [{
                    id: mappedToolCallId,
                    type: 'function',
                    function: { name: event.toolName, arguments: (event.input as any)?._rawArguments ?? JSON.stringify(event.input) }
                  }]
                })
                messages.push({
                  role: 'tool',
                  tool_call_id: mappedToolCallId,
                  content: JSON.stringify({ error: errMsg, success: false })
                })
                runtime.emitEvent({ mode: 'updates', event: { nodeId, output: { type: 'tool_result', toolCallId: mappedToolCallId, toolName: event.toolName, result: null, error: errMsg }, status: 'failed' }, timestamp: Date.now() })
                break
              }
              // 正常路径：计数 +1 → 追加历史 → 发 user_prompt → 抛 AskUserInterrupt
              markGatherRound(sessionKey)
              appendGatherHistory(sessionKey, question)
              const options = Array.isArray(event.input?.options) ? event.input.options : undefined
              runtime.emitEvent({
                mode: 'updates',
                event: {
                  nodeId,
                  output: { type: 'user_prompt', taskId: event.toolName, question, options },
                  status: 'running'
                },
                timestamp: Date.now()
              })
              throw new AskUserInterrupt(event.toolName, question, options)
            }

            // 关键决策点：校验 LLM 输出的工具名是否在 allowedTools 白名单内
            // LLM 可能幻觉调用不在白名单中的工具（如 write_cells 节点幻觉调 read_cells），
            // 必须拦截并返回错误，否则会以错误参数执行导致死循环
            if (options.allowedTools.length > 0 && !options.allowedTools.includes(event.toolName)) {
              const errMsg = `工具 ${event.toolName} 不在当前步骤的允许列表 [${options.allowedTools.join(', ')}] 中，禁止调用。请只使用允许的工具。`
              toolResults[event.toolName] = { error: errMsg, success: false, message: errMsg }
              hasToolError = true
              messages.push({
                role: 'assistant',
                tool_calls: [{
                  id: mappedToolCallId,
                  type: 'function',
                  // 后端解析失败时 input 是 {_rawArguments, _parseError} 兜底信号
                  // 用 _rawArguments 作为 arguments 让 LLM 看到自己上轮真正输出的内容
                  function: { name: event.toolName, arguments: (event.input as any)?._rawArguments ?? JSON.stringify(event.input) }
                }]
              })
              messages.push({
                role: 'tool',
                tool_call_id: mappedToolCallId,
                content: JSON.stringify({ error: errMsg, success: false, message: errMsg })
              })
              runtime.emitEvent({ mode: 'updates', event: { nodeId, output: { type: 'tool_result', toolCallId: mappedToolCallId, toolName: event.toolName, result: null, error: errMsg }, status: 'failed' }, timestamp: Date.now() })
              break
            }

            runtime.emitEvent({ mode: 'updates', event: { nodeId, output: { type: 'tool_call', toolCallId: mappedToolCallId, toolName: event.toolName, input: event.input }, status: 'running' }, timestamp: Date.now() })
            try {
              const result = await runtime.toolRegistry.executeTool(event.toolName, event.input)

              let normalizedResult = result
              if (result == null) {
                const errMsg = `工具 ${event.toolName} 未返回结果（result 为 null/undefined，可能是 iframe 通信丢失或工具实现遗漏 return）`
                normalizedResult = { error: errMsg, success: false, message: errMsg }
                runtime.emitEvent({ mode: 'updates', event: { nodeId, output: { type: 'tool_result', toolCallId: mappedToolCallId, toolName: event.toolName, result: normalizedResult, error: errMsg }, status: 'running' }, timestamp: Date.now() })
              } else if (typeof result === 'object' && result.success === false) {
                const errMsg = result.message || '工具业务执行失败'
                normalizedResult = { error: errMsg, success: false, message: errMsg }
                runtime.emitEvent({ mode: 'updates', event: { nodeId, output: { type: 'tool_result', toolCallId: mappedToolCallId, toolName: event.toolName, result: normalizedResult, error: errMsg }, status: 'running' }, timestamp: Date.now() })
              } else {
                runtime.emitEvent({ mode: 'updates', event: { nodeId, output: { type: 'tool_result', toolCallId: mappedToolCallId, toolName: event.toolName, result }, status: 'running' }, timestamp: Date.now() })
              }
              toolResults[event.toolName] = normalizedResult

              if (options.resultKey) {
                if (!accumulatedResult) accumulatedResult = {}
                if (options.resultKeyAsObject) {
                  const isFailure = normalizedResult?.success === false
                  if (!isFailure) accumulatedResult[event.toolName] = normalizedResult
                } else if (normalizedResult && typeof normalizedResult === 'object' && !Array.isArray(normalizedResult)) {
                  const isFailure = normalizedResult.success === false
                  if (!isFailure) Object.assign(accumulatedResult, normalizedResult)
                } else {
                  accumulatedResult[event.toolName] = normalizedResult
                }
              }

              // 检查必需工具是否满足
              const missingNow = checkRequiredTools(options, toolResults)
              const missingAnyNow = checkRequiredToolsAny(options, toolResults)
              if (missingNow.length === 0 && missingAnyNow.length === 0) {
                requiredToolsSatisfied = true
              }

              messages.push({
                role: 'assistant',
                tool_calls: [{
                  id: mappedToolCallId,
                  type: 'function',
                  // 后端解析失败时 input 是 {_rawArguments, _parseError} 兜底信号
                  // 用 _rawArguments 作为 arguments 让 LLM 看到自己上轮真正输出的内容
                  function: { name: event.toolName, arguments: (event.input as any)?._rawArguments ?? JSON.stringify(event.input) }
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
              runtime.emitEvent({ mode: 'updates', event: { nodeId, output: { type: 'tool_result', toolCallId: mappedToolCallId, toolName: event.toolName, result: null, error: err.message }, status: 'running' }, timestamp: Date.now() })
              toolResults[event.toolName] = { error: err.message }
              // 关键决策点：catch 路径也要把 error 写进 accumulatedResult，
              // 否则下游节点（planner 的 validate_plan）读 state.taskResults['plan_tasks'] 拿不到任何值，
              // 会报"Planner 未调用 plan_tasks 工具"（误导，实际情况是工具返回了 error）
              if (options.resultKey) {
                if (!accumulatedResult) accumulatedResult = {}
                if (options.resultKeyAsObject) {
                  accumulatedResult[event.toolName] = { error: err.message }
                } else {
                  accumulatedResult[event.toolName] = { error: err.message }
                }
              }
              hasToolError = true
              messages.push({
                role: 'assistant',
                tool_calls: [{
                  id: mappedToolCallId,
                  type: 'function',
                  function: { name: event.toolName, arguments: (event.input as any)?._rawArguments ?? JSON.stringify(event.input) }
                }]
              })
              messages.push({
                role: 'tool',
                tool_call_id: mappedToolCallId,
                content: JSON.stringify({ error: err.message })
              })
            }
            break
          }

          case 'done': {
            // 关键决策点：触发"系统强制重试"的条件从 `!hasToolCall` 扩到 `!hasToolCall || hasToolError`
            // 当 LLM 调了工具但拿到 error（参数非法、抛异常等），必须再给一次带错误 hint 的机会，
            // 否则整个节点会以"必需工具未执行"失败（误导）
            if ((!hasToolCall || hasToolError) && hasRequiredTools && iteration < maxIterations) {
              const requiredAny = options.requiredToolResultsAny ?? []
              const requiredAll = options.requiredToolResults ?? []
              const requiredHint = [
                ...requiredAll.map(t => `必须调: ${t}`),
                ...(requiredAny.length > 0 ? [`必须调任一: ${requiredAny.join(' / ')}`] : [])
              ].join('；')
              // 关键决策点：把工具返回的 error 拼成 hint 喂回给 LLM
              const errorHints = Object.entries(toolResults)
                .filter(([_, r]) => r?.error)
                .map(([name, r]) => `${name}: ${r!.error}`)
                .join('；')
              const errorPart = hasToolError && errorHints
                ? `【上轮错误】${errorHints}\n请按错误信息修正后重新调用。\n`
                : ''
              messages.push({
                role: 'user',
                content:
                  `【系统强制提示】你刚才没有成功调用必需工具，本步骤会失败。\n` +
                  errorPart +
                  `你必须：${requiredHint}。\n` +
                  `请使用 OpenAI 原生 function calling 格式输出 tool_calls，**不要**把工具调用写到文本 content 里（不要用 \`\`\`json {"tool": ...} \`\`\` 这种格式）。\n` +
                  `立即重新调用必需工具。`
              })
              // 重置 hasToolError，避免下一轮 done 仍带同样的 hint 反复重试
              hasToolError = false
              break
            }
            if (requiredToolsSatisfied || (!hasToolCall && !hasToolError)) iteration = maxIterations
            break
          }

          case 'error': {
            // 关键修复：LLM API错误（如Postprocessor error/JSON截断）不再直接抛异常退出，
            // 而是返回错误给LLM让其重试（利用maxIterations循环），最多尝试配置的次数
            hasToolError = true
            const errMsg = `LLM API错误: ${event.message}`
            console.warn(`[llm-decide] node=${nodeId} LLM调用错误: ${errMsg} (iteration=${iteration}/${maxIterations})`)

            // 如果还有剩余迭代次数，让LLM重试；否则抛异常退出
            if (iteration < maxIterations) {
              messages.push({
                role: 'user',
                content: `【系统强制提示】LLM调用发生错误。\n【错误信息】${errMsg}\n请检查输出格式，确保JSON完整闭合后重新调用必需工具。`
              })
              break  // 继续循环，让LLM重试
            }
            // 达到最大迭代次数仍失败，抛异常退出
            throw new Error(`LLM 调用失败（已重试${maxIterations}次）: ${event.message}`)
          }
        }
      }

      if (requiredToolsSatisfied) break
    }

    const missingTools = checkRequiredTools(options, toolResults)
    const missingAny = checkRequiredToolsAny(options, toolResults)
    if (missingTools.length > 0 || missingAny.length > 0) {
      console.warn(`[llm-decide] node=${nodeId} 必需工具未执行: toolResults=${Object.keys(toolResults).join(',')} lastCall=${JSON.stringify(lastAssistantToolCalls)}`)
      const reasons = [
        ...missingTools.map(t => `缺少: ${t}`),
        ...missingAny.map(t => `缺少任一: ${t}`)
      ]
      return { errors: [`必需工具未执行: ${reasons.join(', ')}`] } as ReportStateUpdate
    }

    // 关键：不再 stage/finish outChannel，直接返回 Partial<State>
    if (options.resultKey) {
      return { [options.resultKey]: accumulatedResult ?? {} } as ReportStateUpdate
    }
    return toolResults as ReportStateUpdate
  }, { nodeName: options.nodeId })
}

// ==================== 内部辅助函数 ====================

/**
 * 过滤允许的工具定义
 * @param options - 节点配置
 * @param toolRegistry - 工具注册表
 * @returns 工具定义列表
 */
function filterAllowedTools(options: LLMDecideNodeOptions, toolRegistry: any): any[] {
  const allTools = toolRegistry.getToolDefinitions()
  if (options.allowedTools.length === 0) return allTools
  const matched = allTools.filter((t: any) =>
    options.allowedTools.includes(t.function?.name ?? t.name)
  )
  // 兜底：虚拟工具（如 plan_tasks）未注册到 toolRegistry 时，按 allowedTools 名字注入占位
  // 让 LLM 收到 tool_choice 目标存在，能正确返回 function calling 而非降级为 ```json``` 文本
  if (matched.length === 0) {
    return options.allowedTools.map((name: string) => ({
      type: 'function',
      function: { name, description: `${name}（虚拟工具，由 LLM Decider 注入 schema）`, parameters: { type: 'object' } }
    }))
  }
  return matched
}

/**
 * 构建 LLM 消息列表（历史 + 当前步骤 + 知识块）
 * @param options - 节点配置
 * @param state - 当前状态
 * @param memoryManager - 记忆管理器
 * @returns 消息数组
 */
function buildMessages(options: LLMDecideNodeOptions, state: ReportState, memoryManager: any): any[] {
  const history = memoryManager.getContextMessages()
  const descriptionText = typeof options.description === 'function' ? options.description(state) : options.description
  const stepContext = descriptionText ? `\n\n当前步骤: ${descriptionText}` : ''

  // 知识库内容注入
  const searchResults = state.searchResults
  let knowledgeBlock = ''
  if (searchResults && typeof searchResults === 'object') {
    const docRefs: string[] = Array.isArray((searchResults as any).docRefs) ? (searchResults as any).docRefs : []
    if (docRefs.length > 0) {
      const loadedInMessages = memoryManager.getLoadedDocNames()
      const missingInMessages: string[] = []
      const alreadyLoaded: string[] = []
      for (const doc of docRefs) {
        if (loadedInMessages.has(doc)) alreadyLoaded.push(doc)
        else missingInMessages.push(doc)
      }
      const cache = memoryManager.getKnowledgeCache()
      const contentParts: string[] = []
      if (missingInMessages.length > 0) {
        for (const doc of missingInMessages) {
          const content = cache.get(doc)
          if (content) contentParts.push(`[${doc}]\n${content}`)
          else contentParts.push(`[${doc}]\n（文档未在缓存中）`)
        }
      }
      if (contentParts.length > 0) {
        knowledgeBlock = `\n\n[参考知识]\n以下是已加载的文档/知识库内容，请基于这些内容进行决策，不要凭直觉猜测 API/字段：\n${contentParts.join('\n\n---- 分界线 ----\n')}`
      }
      if (alreadyLoaded.length > 0) {
        const alreadyHint = `\n\n[已加载知识]\n以下文档已通过工具调用注入到对话历史中，请基于工具返回的内容进行决策：${alreadyLoaded.join('、')}`
        knowledgeBlock = knowledgeBlock ? `${knowledgeBlock}${alreadyHint}` : alreadyHint
      }
    }
    // 注入 search_agent_knowledge 的搜索结果
    const agentKnowledge = (searchResults as any).search_agent
    if (agentKnowledge) {
      const agentContent = formatAgentKnowledge(agentKnowledge)
      if (agentContent) {
        const agentBlock = `\n\n[Agent知识库]\n以下是从知识库检索到的报表制作经验和最佳实践，请严格参照执行：\n${agentContent}`
        knowledgeBlock = knowledgeBlock ? `${knowledgeBlock}${agentBlock}` : agentBlock
      }
    }
  }
  const userMessage = state.userMessage + knowledgeBlock + buildWorkflowStateContext(state as any) + stepContext

  return [...history, { role: 'user', content: userMessage }]
}

/**
 * 格式化 search_agent_knowledge 的搜索结果为可注入 LLM 上下文的文本
 * 支持两种格式：数组 [{content, ...}] 或字符串
 */
function formatAgentKnowledge(data: any): string {
  if (!data) return ''
  if (typeof data === 'string') return data
  if (Array.isArray(data)) {
    return data
      .filter((item: any) => item && (item.content || item.text))
      .map((item: any) => item.content || item.text)
      .join('\n\n---- 分界线 ----\n')
  }
  if (typeof data === 'object' && (data.content || data.text)) {
    return data.content || data.text
  }
  return JSON.stringify(data)
}

/**
 * 校验必需工具是否都已执行成功（AND 语义）
 * @param options - 节点配置
 * @param toolResults - 已执行工具结果
 * @returns 缺失工具名列表
 */
function checkRequiredTools(options: LLMDecideNodeOptions, toolResults: Record<string, any>): string[] {
  const required = options.requiredToolResults ?? []
  return required.filter(name => {
    const result = toolResults[name]
    return !result || result.error
  })
}

/**
 * 校验必需工具是否至少执行了一个（OR 语义）
 * @param options - 节点配置
 * @param toolResults - 已执行工具结果
 * @returns 未满足的工具名列表
 */
function checkRequiredToolsAny(options: LLMDecideNodeOptions, toolResults: Record<string, any>): string[] {
  const any = options.requiredToolResultsAny ?? []
  if (any.length === 0) return []
  const hit = any.some(name => {
    const r = toolResults[name]
    return r && !r.error
  })
  return hit ? [] : any
}

/**
 * 将 LLM 原始 toolCallId 改写为 nodeId#runId#seq 命名空间的全局唯一 mappedId
 * @param nodeId - 节点ID
 * @param runId - 运行时 ID
 * @param originalId - LLM 原始 ID
 * @param idMap - 映射表
 * @param nextSeq - 序号自增器
 * @returns 映射后 ID
 */
function mapToolCallId(
  nodeId: string,
  runId: string,
  originalId: string,
  idMap: Map<string, string>,
  nextSeq: () => number
): string {
  const cached = idMap.get(originalId)
  if (cached) return cached
  const mapped = `${nodeId}#${runId}#${nextSeq()}`
  idMap.set(originalId, mapped)
  return mapped
}
