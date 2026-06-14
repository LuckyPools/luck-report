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
  /** 步骤描述，供 LLM 理解该步骤的目的 */
  description?: string
  /**
   * 节点结果键（可选）
   * 默认：返回 `{ [toolName]: result, ... }`（LangGraph reducer 自动按 key 合并）
   * 设置后合并到一个对象下：{ [resultKey]: accumulated }
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

    const tools = filterAllowedTools(options, runtime.toolRegistry)
    const messages = buildMessages(options, state, runtime.memoryManager)

    const toolResults: Record<string, any> = {}
    let accumulatedResult: Record<string, any> | null = null
    let assistantContent = ''
    const hasRequiredTools = (options.requiredToolResults?.length ?? 0) > 0
      || (options.requiredToolResultsAny?.length ?? 0) > 0
    let iteration = 0

    while (iteration < maxIterations) {
      iteration++

      const llmGen = runtime.llmCaller(messages, tools, {
        signal: runtime.signal,
        sessionId: runtime.sessionId,
        modelId: runtime.modelId
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

          case 'tool_call': {
            hasToolCall = true
            const mappedToolCallId = mapToolCallId(nodeId, currentRunId, event.toolCallId, toolCallIdMap, () => toolCallCounter++)

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
              runtime.emitEvent({ mode: 'updates', event: { nodeId, output: { type: 'tool_result', toolCallId: mappedToolCallId, toolName: event.toolName, result: null, error: err.message }, status: 'running' }, timestamp: Date.now() })
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
            if (!hasToolCall && hasRequiredTools && iteration < maxIterations) {
              const requiredAny = options.requiredToolResultsAny ?? []
              const requiredAll = options.requiredToolResults ?? []
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
            if (requiredToolsSatisfied || !hasToolCall) iteration = maxIterations
            break
          }

          case 'error':
            throw new Error(`LLM 调用失败: ${event.message}`)
        }
      }

      if (requiredToolsSatisfied) break
    }

    const missingTools = checkRequiredTools(options, toolResults)
    const missingAny = checkRequiredToolsAny(options, toolResults)
    if (missingTools.length > 0 || missingAny.length > 0) {
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
  return allTools.filter((t: any) =>
    options.allowedTools.includes(t.function?.name ?? t.name)
  )
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
  const stepContext = options.description ? `\n\n当前步骤: ${options.description}` : ''

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
  }
  const userMessage = state.userMessage + knowledgeBlock + buildWorkflowStateContext(state as any) + stepContext

  return [...history, { role: 'user', content: userMessage }]
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
