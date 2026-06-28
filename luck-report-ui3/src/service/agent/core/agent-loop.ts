/**
 * Agent 核心循环，工作流模式：意图分析 → 选择工作流图 → 图引擎执行 → 事件适配
 */

import type { ToolRegistry } from '../tools/registry'
import type { ToolCall } from '../tools/types'
import type { MemoryManager } from '../memory/memory-manager'
import type { ContextManager } from './context-manager'
import type { ReportSnapshot } from '../memory/types'
import type { TokenUsage } from '@/api/chat'
import type { WorkflowStepRecord } from '../workflow/state.ts'
import type { IntentAnalysisResult } from '../workflow/types'
import type { TaskNode } from '../workflow/task-plan.ts'
import { chatStream, type ContextMessage, type SseToolCall } from '@/api/chat'
import { getIntentAnalysisPrompt, INTENT_ANALYSIS_SCHEMA, buildIntentAnalysisTools, buildIntentToolChoice, INTENT_TOOL_NAME } from '../workflow/intent-prompt'
import { WorkflowRuntime } from '../workflow/runtime.ts'
import { createLLMCaller } from '../workflow/llm-caller.ts'
import { getGraphByIntent } from '../workflow/workflow-graphs.ts'
import { runtimeToContext } from '../workflow/context-annotation.ts'
import { filterActiveErrors } from '../workflow/utils.ts'
import type { StreamEvent } from '../workflow/stream-mode.ts'
import { getReportSchema } from '@/utils/tools'

/**
 * Agent 循环事件类型
 * 循环过程中通过回调向外暴露各种事件，供 UI 层渲染
 */
export type AgentEvent =
  | { type: 'text_delta'; content: string }
  | { type: 'reasoning_delta'; content: string }
  | { type: 'tool_call_start'; toolCall: ToolCall }
  | { type: 'tool_call_confirm'; toolCall: ToolCall }
  | { type: 'tool_call_result'; toolCall: ToolCall }
  | { type: 'token_usage'; usage: TokenUsage }
  | { type: 'user_prompt'; taskId: string; question: string; options?: string[] }
  | { type: 'done'; reason: 'completed' | 'max_iterations' | 'aborted' | 'error' | 'awaiting_user'; error?: string; prompt?: { taskId: string; question: string; options?: string[] } }

/**
 * Agent 循环配置
 */
export interface AgentLoopConfig {
  /** 工具注册表 */
  toolRegistry: ToolRegistry
  /** 记忆管理器 */
  memoryManager: MemoryManager
  /** 上下文管理器 */
  contextManager: ContextManager
  /** 中断信号 */
  signal?: AbortSignal
  /** 工具确认回调，返回 True 表示用户确认执行，False 表示拒绝 */
  onToolConfirm?: (toolCall: ToolCall) => Promise<boolean>
  /** 会话ID，与数据库 chat_session.id 一致，用于后端关联会话上下文 */
  sessionId?: string
  /** 报表快照采集回调，压缩前调用获取当前报表状态 */
  onCaptureSnapshot?: () => Promise<ReportSnapshot | null>
  /** 自动压缩回调，当需要压缩时调用，由上层负责发起 LLM 压缩请求 */
  onAutoCompact?: (memoryManager: MemoryManager) => Promise<void>
  /** 大模型配置ID，用于指定使用哪个大模型 */
  modelId?: number
  /** 工作流模式下每个步骤内 LLM 的最大循环轮次，默认 5 */
  maxIterationsPerStep?: number
  /** 是否启用深度思考，启用后模型会先生成推理过程再生成回复 */
  deepThink?: boolean
  /**
   * @deprecated 自 v2 起 UI 只展示 LLM 规划任务，使用 onTaskPlanChange 替代
   * 保留字段以防外部消费者依赖
   */
  onStepRecordsChange?: (stepRecords: WorkflowStepRecord[], activeStepId?: string) => void
  /**
   * 任务计划变更回调（仅 LLM 规划的具体子任务）
   * 当 validate_plan 完成或 dispatch_task 每次自环时触发，回调拿到最新的 TaskPlan
   * 取代旧 onStepRecordsChange，避免把 LangGraph 主图节点（load_docs / dispatch_task / summary…）渲染到 UI
   */
  onTaskPlanChange?: (plan: TaskNode[], activeNodeId?: string) => void
}

/**
 * Agent 核心循环入口
 * 工作流模式：代码驱动步骤顺序，LLM 只负责意图分析和参数生成
 *
 * @param userMessage - 用户输入消息，string，不可为空
 * @param config - 循环配置，AgentLoopConfig，不可为空
 * @param onEvent - 事件回调，用于 UI 层实时渲染，不可为空
 */
export async function runAgentLoop(
  userMessage: string,
  config: AgentLoopConfig,
  onEvent: (event: AgentEvent) => void
): Promise<void> {
  await runWorkflowMode(userMessage, config, onEvent)
}

/**
 * 工作流模式
 * 核心流程：意图分析 → 选择工作流图 → 图引擎执行 → 事件适配
 *
 * @param userMessage - 用户输入消息，string，不可为空
 * @param config - 循环配置，AgentLoopConfig，不可为空
 * @param onEvent - 事件回调，不可为空
 */
async function runWorkflowMode(
  userMessage: string,
  config: AgentLoopConfig,
  onEvent: (event: AgentEvent) => void
): Promise<void> {
  const { toolRegistry, memoryManager, contextManager, signal } = config

  // 将用户消息追加到记忆
  memoryManager.addMessage({ role: 'user', content: userMessage })

  const stepToolCallIdMap = new Map<string, string>()

  try {
    // ==================== 阶段1：意图分析 ====================
    // 保留旧引擎的意图分析逻辑（chatStream + Function Calling）
    let reportState: any = undefined
    try {
      reportState = getReportSchema()
    } catch { /* 获取报表状态失败不阻塞意图分析 */ }

    const intent = await analyzeIntent(userMessage, config, reportState, onEvent)

    // 处理无关意图
    if (intent.intentType === 'irrelevant') {
      onEvent({ type: 'text_delta', content: '我是报表小助手，请咨询我报表相关的问题哦' })
      onEvent({ type: 'done', reason: 'completed' })
      return
    }
    if (intent.intentType === 'create_report') {
      onEvent({ type: 'text_delta', content: '我是报表小助手，请先手动创建一个新报表哦' })
      onEvent({ type: 'done', reason: 'completed' })
      return
    }

    // 输出意图确认消息
    const confirmMsg = buildIntentConfirmMessage(intent)
    onEvent({ type: 'text_delta', content: confirmMsg })

    console.log(`[DEBUG][agent-loop] 阶段1完成 intent=${intent.intentType}`)

    // ==================== 阶段2：选择工作流图 ====================
    // 顶层唯一入口：report_agent（Planner 自主规划 read + write 混排）
    const compiledGraph = getGraphByIntent(intent.intentType)
    console.log(`[DEBUG][agent-loop] 阶段2 查图 intent=${intent.intentType} found=${!!compiledGraph}`)

    if (!compiledGraph) {
      onEvent({ type: 'text_delta', content: `未找到意图类型 "${intent.intentType}" 对应的工作流图` })
      onEvent({ type: 'done', reason: 'error', error: `未找到工作流图: ${intent.intentType}` })
      return
    }

    // ==================== 阶段3：图引擎执行 ====================
    // 创建 WorkflowRuntime
    const llmCaller = createLLMCaller(memoryManager, contextManager)
    const runtime = new WorkflowRuntime({
      toolRegistry,
      memoryManager,
      contextManager,
      llmCaller,
      signal,
      onToolConfirm: config.onToolConfirm,
      sessionId: config.sessionId,
      modelId: config.modelId,
      deepThink: config.deepThink,
      onEvent: (streamEvent: StreamEvent) => {
        // 节点内 emitEvent 发出的事件直接转换为 AgentEvent
        if (streamEvent.mode === 'updates') {
          const data = streamEvent.event as any
          const output = data.output ?? {}
          if (output.type === 'step_progress') {
            onEvent({ type: 'text_delta', content: output.message ?? '' })
          } else if (output.type === 'step_reasoning') {
            onEvent({ type: 'reasoning_delta', content: output.content ?? '' })
          } else if (output.type === 'tool_call') {
            const toolCallId = output.toolCallId || `wf_${data.nodeId}_${output.toolName}`
            stepToolCallIdMap.set(output.toolCallId || data.nodeId, toolCallId)
            onEvent({ type: 'tool_call_start', toolCall: { toolCallId, toolName: output.toolName ?? '', input: output.input, status: 'running' } })
          } else if (output.type === 'tool_result') {
            const toolCallId = output.toolCallId
              ? (stepToolCallIdMap.get(output.toolCallId) || output.toolCallId)
              : (stepToolCallIdMap.get(data.nodeId) || `wf_${data.nodeId}_${output.toolName}`)
            onEvent({ type: 'tool_call_result', toolCall: { toolCallId, toolName: output.toolName ?? '', input: {}, status: output.error ? 'error' : 'done', result: output.result, error: output.error } })
          } else if (output.type === 'user_prompt') {
            onEvent({ type: 'user_prompt', taskId: output.taskId, question: output.question, options: output.options })
          } else if (output.type === 'token_usage') {
            onEvent({ type: 'token_usage', usage: output.usage })
          } else if (data.status === 'failed') {
            onEvent({ type: 'text_delta', content: `  错误: ${data.error ?? '未知错误'}\n` })
          }
        }
      }
    })

    const graphInput = {
      userMessage,
      originalUserMessage: userMessage,
      intent,
      reportState
    }
    console.log(`[DEBUG][agent-loop] 阶段3 流式执行 graphInput=${Object.keys(graphInput).join(',')}`)

    // 流式执行图
    let hasError = false
    let errorMessage = ''

    const stream = await compiledGraph.stream(graphInput, {
      context: runtimeToContext(runtime),
      signal,
      recursionLimit: 25,
      streamMode: 'updates'
    })

    for await (const chunk of stream) {
      // chunk 格式：{ [nodeName]: { ...output } }
      const nodeNames = Object.keys(chunk)
      for (const nodeName of nodeNames) {
        if (nodeName.startsWith('__')) continue
        const output = chunk[nodeName]
        // 检查节点输出中的错误
        if (output?.errors) {
          const childErrors = filterActiveErrors(output.errors)
          if (childErrors.length > 0) {
            hasError = true
            errorMessage = childErrors.join('; ')
          }
        }
        // 任务计划变更：validate_plan / dispatch_task 的 output 里有 state.taskPlan
        // LangGraph streamMode='updates' 下 chunk[nodeName] 就是节点返回的 ReportStateUpdate
        if ((nodeName === 'validate_plan' || nodeName === 'dispatch_task')
            && output?.taskPlan
            && Array.isArray(output.taskPlan)) {
          config.onTaskPlanChange?.(output.taskPlan, nodeName)
        }
      }

      // 将 LangGraph 原始 chunk 转换为 AgentEvent
      const agentEvents = convertChunkToAgentEvents(chunk, stepToolCallIdMap)
      let pendingPrompt: { taskId: string; question: string; options?: string[] } | null = null
      for (const evt of agentEvents) {
        onEvent(evt)
        if (evt.type === 'user_prompt') {
          pendingPrompt = { taskId: evt.taskId, question: evt.question, options: evt.options }
        }
      }
      // ask_user 触发的中断：发完 user_prompt 后立即发 done 事件，让 UI 进入"等待用户输入"态
      // LangGraph 流会在 AskUserInterrupt 抛出时结束，循环自然退出，这里先发 done
      if (pendingPrompt) {
        onEvent({ type: 'done', reason: 'awaiting_user', prompt: pendingPrompt })
        return
      }
    }

    onEvent({ type: 'done', reason: hasError ? 'error' : 'completed', error: hasError ? errorMessage : undefined })

  } catch (err: any) {
    console.error('[DEBUG][agent-loop] 外层 catch:', err.name, err.message)
    if (err.name === 'AbortError') {
      onEvent({ type: 'done', reason: 'aborted' })
    } else if (err?.name === 'AskUserInterrupt' || err?.code === 'ASK_USER') {
      // ask_user 中断：emitEvent 可能因格式不匹配被丢弃，且 AskUserInterrupt 导致 stream 异常退出，
      // for-await 循环中的 pendingPrompt 检查不会执行，因此必须在此处补发 done 事件
      onEvent({
        type: 'done',
        reason: 'awaiting_user',
        prompt: {
          taskId: err.taskId,
          question: err.question,
          options: err.options
        }
      })
    } else {
      onEvent({ type: 'done', reason: 'error', error: err.message })
    }
  } finally {
    // ask_user 跨中断的轮次计数已迁移到 gather-state.ts（按 sessionId 跟踪）
    // ask_user 已升级为 gather_requirements 节点的中断型工具，不再走 dispatcher 路径
    // 因此旧的 cleanupAskUserSeen（按 runId 跟踪）已不再需要，此处移除该清理
    if (memoryManager.needsCompact() && config.onAutoCompact) {
      if (config.onCaptureSnapshot) {
        try {
          const snapshot = await config.onCaptureSnapshot()
          if (snapshot) memoryManager.updateReportSnapshot(snapshot)
        } catch { }
      }
      try {
        await config.onAutoCompact(memoryManager)
      } catch (e) {
        console.warn('[agent-loop] 工作流模式压缩失败:', e)
      }
    }
  }
}

// ==================== 意图分析（保留旧逻辑） ====================

/**
 * 意图分析
 * 让 LLM 分析用户输入，输出结构化的意图结果
 * 使用 Function Calling 机制确保 LLM 以结构化 JSON 输出
 *
 * @param userMessage - 用户输入消息，string，不可为空
 * @param config - 循环配置，AgentLoopConfig，不可为空
 * @param reportState - 报表状态快照，any，可选
 * @param onEvent - 事件回调，不可为空
 * @returns 意图分析结果，Promise<IntentAnalysisResult>
 */
async function analyzeIntent(
  userMessage: string,
  config: AgentLoopConfig,
  reportState: any,
  onEvent: (event: AgentEvent) => void
): Promise<IntentAnalysisResult> {
  const intentPrompt = await getIntentAnalysisPrompt()
  const schemaStr = JSON.stringify(INTENT_ANALYSIS_SCHEMA, null, 2)
  const systemContent = '你是Luck-Report报表助手。\n\n' + intentPrompt.replace('{{INTENT_ANALYSIS_SCHEMA}}', schemaStr)

  // 意图分析阶段不注入 contextPrefix：报表是否打开属于"环境信息"，不是"用户意图"，
  // 拼到 user message 开头会让 LLM 把环境当成意图一部分推理，导致模糊输入被强行归入 report_agent。
  // 报表状态由后续 understand_and_plan 节点通过 buildWorkflowStateContext 感知。
  const messages: ContextMessage[] = [
    { role: 'system', content: systemContent },
    { role: 'user', content: userMessage }
  ]

  const tools = buildIntentAnalysisTools()
  const toolChoice = buildIntentToolChoice()

  let toolUseResult: Record<string, any> | null = null
  let responseText = ''
  let reasoningText = ''

  await chatStream(
    '',
    {
      onMessage: (data) => { responseText += data },
      onReasoning: (data) => {
        reasoningText += data
        onEvent({ type: 'reasoning_delta', content: data })
      },
      onTokenUsage: (usage) => {
        onEvent({ type: 'token_usage', usage })
      },
      onToolUse: (toolCall: SseToolCall) => {
        if (toolCall.toolName === INTENT_TOOL_NAME) {
          toolUseResult = toolCall.input
        }
      },
      onDone: () => {},
      onError: (error) => { throw new Error(`意图分析失败: ${error}`) }
    },
    config.signal,
    undefined,
    undefined,
    messages,
    tools,
    config.sessionId,
    config.modelId,
    toolChoice,
    config.deepThink
  )

  // 优先使用 Function Calling 结果，兜底解析文本
  if (toolUseResult) {
    return parseIntentFromObject(toolUseResult)
  }
  return parseIntentJson(responseText)
}

/**
 * 从 Function Calling 返回的对象解析意图结果
 * @param obj - Function Calling 返回的参数对象，Record<string, any>，不可为空
 * @returns 意图分析结果，IntentAnalysisResult
 */
function parseIntentFromObject(obj: Record<string, any>): IntentAnalysisResult {
  return {
    intentType: obj.intentType || 'irrelevant',
    needsBusinessKnowledge: obj.needsBusinessKnowledge ?? false,
    needsAgentKnowledge: obj.needsAgentKnowledge ?? false,
    needsSchemaSearch: obj.needsSchemaSearch ?? false,
    requiredDocs: obj.requiredDocs || [],
    taskDescription: obj.taskDescription || ''
  }
}

/**
 * 解析意图分析 JSON
 * @param text - LLM 响应文本，string，不可为空
 * @returns 意图分析结果，IntentAnalysisResult
 */
function parseIntentJson(text: string): IntentAnalysisResult {
  let jsonStr = text.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (jsonMatch) jsonStr = jsonMatch[1].trim()

  try {
    const parsed = JSON.parse(jsonStr)
    return parseIntentFromObject(parsed)
  } catch {
    const firstBrace = jsonStr.indexOf('{')
    const lastBrace = jsonStr.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        const parsed = JSON.parse(jsonStr.substring(firstBrace, lastBrace + 1))
        return parseIntentFromObject(parsed)
      } catch { /* 解析失败，返回默认值 */ }
    }
  }

  return {
    intentType: 'irrelevant',
    needsBusinessKnowledge: false,
    needsAgentKnowledge: false,
    needsSchemaSearch: false,
    requiredDocs: [],
    taskDescription: ''
  }
}

// ==================== 事件适配 ====================

/**
 * 将 LangGraph stream chunk 转换为 AgentEvent
 * chunk 格式：{ [nodeName]: { ...output } }
 * 节点通过 runtime.emitEvent 发出的事件已由 runtime.onEvent 直接处理
 * 这里只处理节点输出的结构化信息（step_progress / tool_call / tool_result 等）
 *
 * @param chunk - LangGraph stream chunk，Record<string, any>，不可为空
 * @param toolCallIdMap - toolCallId 映射表，Map<string, string>，不可为空
 * @returns Agent 事件数组，AgentEvent[]
 */
function convertChunkToAgentEvents(
  chunk: Record<string, any>,
  toolCallIdMap: Map<string, string>
): AgentEvent[] {
  const results: AgentEvent[] = []

  for (const [nodeName, output] of Object.entries(chunk)) {
    if (nodeName.startsWith('__') || !output || typeof output !== 'object') continue

    // 节点输出中可能包含 emitEvent 发出的事件记录
    // 也可能包含结构化的 step_progress / tool_call / tool_result
    if (output.type === 'step_progress') {
      results.push({ type: 'text_delta', content: output.message ?? '' })
    } else if (output.type === 'step_reasoning') {
      results.push({ type: 'reasoning_delta', content: output.content ?? '' })
    } else if (output.type === 'tool_call') {
      const toolCallId = output.toolCallId || `wf_${nodeName}_${output.toolName}`
      toolCallIdMap.set(output.toolCallId || nodeName, toolCallId)
      results.push({
        type: 'tool_call_start',
        toolCall: {
          toolCallId,
          toolName: output.toolName ?? '',
          input: output.input,
          status: 'running'
        }
      })
    } else if (output.type === 'tool_result') {
      const toolCallId = output.toolCallId
        ? (toolCallIdMap.get(output.toolCallId) || output.toolCallId)
        : (toolCallIdMap.get(nodeName) || `wf_${nodeName}_${output.toolName}`)
      results.push({
        type: 'tool_call_result',
        toolCall: {
          toolCallId,
          toolName: output.toolName ?? '',
          input: {},
          status: output.error ? 'error' : 'done',
          result: output.result,
          error: output.error
        }
      })
    } else if (output.type === 'user_prompt') {
      // ask_user 任务发射的 user_prompt 事件 — 透传给 UI 渲染 question 卡
      results.push({
        type: 'user_prompt',
        taskId: output.taskId,
        question: output.question ?? '',
        options: output.options
      })
    }
  }

  return results
}

// ==================== 辅助方法 ====================

/**
 * 构建意图分析后的用户确认消息
 * 意图阶段不再预测具体动作（避免误判后承诺错误动作），仅简要确认收到需求。
 * 具体动作预告交给 understand_and_plan 节点完成。
 * @param intent - 意图分析结果，IntentAnalysisResult，不可为空
 * @returns 友好的确认消息文本，string
 */
function buildIntentConfirmMessage(intent: IntentAnalysisResult): string {
  if (intent.intentType !== 'report_agent') return ''
  const desc = intent.taskDescription || '您的需求'
  return `好的，我已了解您的需求：${desc}\n请稍候，正在为您规划任务。`
}
