/**
 * Agent 核心循环
 * 工作流模式：意图分析 → 选择工作流图 → 图引擎执行 → 事件适配
 *
 * 重构改进：
 * 1. 用 StateGraph + Channel 门控替换旧 WorkflowEngine
 * 2. 节点失败不写业务 Channel → 下游不触发（解决步骤跳过问题）
 * 3. LLMDecideNode 两阶段提交（解决 LLM 循环内多次工具调用的原子性问题）
 * 4. 意图分析逻辑保留旧实现（chatStream + Function Calling）
 */

import type { ToolRegistry } from '../tools/registry'
import type { ToolCall } from '../tools/types'
import type { MemoryManager } from '../memory/memory-manager'
import type { ContextManager } from './context-manager'
import type { ReportSnapshot } from '../memory/types'
import type { TokenUsage } from '@/api/chat'
import type { WorkflowStepRecord } from '../workflow/types'
import type { IntentAnalysisResult } from '../workflow/types'
import { chatStream, type ContextMessage, type SseToolCall } from '@/api/chat'
import { getIntentAnalysisPrompt, INTENT_ANALYSIS_SCHEMA, buildIntentAnalysisTools, buildIntentToolChoice, INTENT_TOOL_NAME } from '../workflow/intent-prompt'
import { WorkflowRuntime, type LLMCaller } from '../workflow/graph/runtime'
import { createLLMCaller } from '../workflow/graph/llm-caller-adapter'
import { getGraphByIntent } from '../workflow/graph/workflow-graphs'
import { compileLegacyWorkflow } from '../workflow/graph/legacy-adapter'
import { convertStreamEvent } from '../workflow/graph/event-compat'
import { getWorkflowByIntent, getSubworkflowByType } from '../workflow/workflow-definitions'
import type { StreamEvent } from '../workflow/graph/stream-mode'

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
  | { type: 'done'; reason: 'completed' | 'max_iterations' | 'aborted' | 'error'; error?: string }

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
  /** 步骤记录变更回调，用于同步任务进度到前端 */
  onStepRecordsChange?: (stepRecords: WorkflowStepRecord[], activeStepId?: string) => void
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

  // 步骤记录（兼容旧 UI）
  const stepRecords: WorkflowStepRecord[] = []
  const stepToolCallIdMap = new Map<string, string>()

  try {
    // ==================== 阶段1：意图分析 ====================
    // 保留旧引擎的意图分析逻辑（chatStream + Function Calling）
    stepRecords.push({ stepId: 'intent_analysis', stepName: '分析用户意图', status: 'in_progress', retryCount: 0 })
    config.onStepRecordsChange?.([...stepRecords], 'intent_analysis')

    let reportState: any = undefined
    try {
      const { executeCode } = await import('@/views/export/iframe-utils')
      reportState = await executeCode('getReportSchema()', '*', 3000)
    } catch { /* 获取报表状态失败不阻塞意图分析 */ }

    const intent = await analyzeIntent(userMessage, config, reportState, onEvent)

    // 更新意图分析步骤状态
    const intentRecord = stepRecords.find(r => r.stepId === 'intent_analysis')
    if (intentRecord) intentRecord.status = 'completed'

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
    // 优先使用新图引擎，找不到时回退到旧引擎的适配层
    const compiledGraph = getGraphByIntent(intent.intentType)
    console.log(`[DEBUG][agent-loop] 阶段2 查图 intent=${intent.intentType} found=${!!compiledGraph}`)
    const useNewEngine = !!compiledGraph

    if (!useNewEngine) {
      // 回退：用旧 WorkflowDefinition 编译为 CompiledReportGraph
      const workflow = getWorkflowByIntent(intent.intentType)
      if (!workflow) {
        onEvent({ type: 'text_delta', content: `未找到意图类型 "${intent.intentType}" 对应的工作流` })
        onEvent({ type: 'done', reason: 'error', error: `未找到工作流: ${intent.intentType}` })
        return
      }
      // 用适配层将旧定义编译为新图
      await executeWithLegacyAdapter(workflow, intent, userMessage, config, stepRecords, onEvent)
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
      onEvent: (streamEvent: StreamEvent) => {
        // 新架构事件 → 旧版 AgentEvent 适配
        const agentEvents = convertStreamEventToAgentEvent(streamEvent, stepToolCallIdMap)
        for (const evt of agentEvents) {
          onEvent(evt)
        }
      }
    })

    // 构建图输入
    const graphInput = {
      userMessage,
      intent,
      reportState
    }
    console.log(`[DEBUG][agent-loop] 阶段3 流式执行 graphInput=${Object.keys(graphInput).join(',')}`)

    // 预初始化步骤记录（从图中提取节点列表）
    // [修复] 评估每个节点的 skipWhen，命中的节点不放入 stepRecords。
    // 这些节点（如 modify_report 场景下的 search_business）在本意图下根本不会执行，
    // 不应在 UI 上显示为"灰色未跑"的步骤，干扰用户对真实执行计划的判断。
    const nodeNames = compiledGraph!.getNodeNames()
    for (const nodeName of nodeNames) {
      if (nodeName.startsWith('__')) continue
      const nodeDef = compiledGraph!.getNode(nodeName)
      if (nodeDef?.skipWhen && nodeDef.skipWhen(graphInput)) {
        continue
      }
      stepRecords.push({
        stepId: nodeName,
        stepName: nodeDef?.metadata?.description ?? nodeName,
        status: 'pending',
        retryCount: 0
      })
    }
    config.onStepRecordsChange?.([...stepRecords])

    // 流式执行图
    let hasError = false
    let errorMessage = ''

    for await (const streamEvent of compiledGraph!.stream(graphInput, {
      configurable: { runtime },
      signal,
      recursionLimit: 25
    })) {
      // 更新步骤记录状态
      if (streamEvent.mode === 'updates') {
        const data = streamEvent.event as any
        const record = stepRecords.find(r => r.stepId === data.nodeId)
        if (record) {
          if (data.status === 'running' && record.status === 'pending') {
            record.status = 'in_progress'
          } else if (data.status === 'success') {
            record.status = 'completed'
          } else if (data.status === 'failed') {
            record.status = 'error'
            record.error = data.error
            hasError = true
            errorMessage = data.error ?? ''
          } else if (data.status === 'skipped') {
            record.status = 'cancelled'
          }
        }
        config.onStepRecordsChange?.([...stepRecords], data.nodeId)
      }

      // 事件适配
      const agentEvents = convertStreamEventToAgentEvent(streamEvent, stepToolCallIdMap)
      for (const evt of agentEvents) {
        onEvent(evt)
      }
    }

    // 执行完成
    onEvent({ type: 'done', reason: hasError ? 'error' : 'completed', error: hasError ? errorMessage : undefined })

  } catch (err: any) {
    console.error('[DEBUG][agent-loop] 外层 catch:', err.name, err.message)
    if (err.name === 'AbortError') {
      onEvent({ type: 'done', reason: 'aborted' })
    } else {
      onEvent({ type: 'done', reason: 'error', error: err.message })
    }
  } finally {
    // 工作流执行完毕后，检查是否需要压缩
    if (memoryManager.needsCompact() && config.onAutoCompact) {
      if (config.onCaptureSnapshot) {
        try {
          const snapshot = await config.onCaptureSnapshot()
          if (snapshot) memoryManager.updateReportSnapshot(snapshot)
        } catch { /* 忽略快照采集失败 */ }
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

  const reportExists = !!reportState
  const contextPrefix = reportExists ? '[当前报表状态：已有打开的报表]' : '[当前报表状态：没有打开的报表]'
  const contextUserMessage = `${contextPrefix}\n${userMessage}`

  const messages: ContextMessage[] = [
    { role: 'system', content: systemContent },
    { role: 'user', content: contextUserMessage }
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
    toolChoice
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
    needsDatasourceOperation: obj.needsDatasourceOperation ?? false,
    needsCellOperation: obj.needsCellOperation ?? false,
    needsFormOperation: obj.needsFormOperation ?? false,
    needsPageConfigOperation: obj.needsPageConfigOperation ?? false,
    needsRowColOperation: obj.needsRowColOperation ?? false,
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
    // 提取 JSON 片段
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
    needsDatasourceOperation: false,
    needsCellOperation: false,
    needsFormOperation: false,
    needsPageConfigOperation: false,
    needsRowColOperation: false,
    needsBusinessKnowledge: false,
    needsAgentKnowledge: false,
    needsSchemaSearch: false,
    requiredDocs: [],
    taskDescription: ''
  }
}

// ==================== 旧引擎适配路径 ====================

/**
 * 使用旧 WorkflowDefinition 适配层执行
 * 当新图引擎尚未覆盖的工作流，回退到旧定义 + 适配层
 *
 * @param workflow - 旧版工作流定义，WorkflowDefinition，不可为空
 * @param intent - 意图分析结果，IntentAnalysisResult，不可为空
 * @param userMessage - 用户输入消息，string，不可为空
 * @param config - 循环配置，AgentLoopConfig，不可为空
 * @param stepRecords - 步骤记录，WorkflowStepRecord[]，不可为空
 * @param onEvent - 事件回调，不可为空
 */
async function executeWithLegacyAdapter(
  workflow: any,
  intent: IntentAnalysisResult,
  userMessage: string,
  config: AgentLoopConfig,
  stepRecords: WorkflowStepRecord[],
  onEvent: (event: AgentEvent) => void
): Promise<void> {
  // 用适配层编译旧定义为新图
  const subworkflows: Record<string, any> = {}
  for (const [key, fn] of Object.entries(getSubworkflowByType as any)) {
    if (typeof fn === 'function') {
      const def = fn()
      if (def) subworkflows[key] = def
    }
  }

  const compiledGraph = compileLegacyWorkflow(workflow, subworkflows)

  const llmCaller = createLLMCaller(config.memoryManager, config.contextManager)
  const runtime = new WorkflowRuntime({
    toolRegistry: config.toolRegistry,
    memoryManager: config.memoryManager,
    contextManager: config.contextManager,
    llmCaller,
    signal: config.signal,
    onToolConfirm: config.onToolConfirm,
    sessionId: config.sessionId,
    modelId: config.modelId,
    onEvent: (streamEvent: StreamEvent) => {
      const agentEvents = convertStreamEventToAgentEvent(streamEvent, new Map())
      for (const evt of agentEvents) {
        onEvent(evt)
      }
    }
  })

  const graphInput = { userMessage, intent }
  const stepToolCallIdMap = new Map<string, string>()
  let hasError = false
  let errorMessage = ''

  for await (const streamEvent of compiledGraph.stream(graphInput, {
    configurable: { runtime },
    signal: config.signal,
    recursionLimit: 25
  })) {
    const agentEvents = convertStreamEventToAgentEvent(streamEvent, stepToolCallIdMap)
    for (const evt of agentEvents) {
      onEvent(evt)
    }
  }

  onEvent({ type: 'done', reason: hasError ? 'error' : 'completed', error: hasError ? errorMessage : undefined })
}

// ==================== 事件适配 ====================

/**
 * 将新架构 StreamEvent 转换为 AgentEvent
 * @param streamEvent - 新架构流事件，StreamEvent，不可为空
 * @param toolCallIdMap - toolCallId 映射表，Map<string, string>，不可为空
 * @returns Agent 事件数组，AgentEvent[]
 */
function convertStreamEventToAgentEvent(
  streamEvent: StreamEvent,
  toolCallIdMap: Map<string, string>
): AgentEvent[] {
  const results: AgentEvent[] = []

  if (streamEvent.mode === 'updates') {
    const data = streamEvent.event as any
    const output = data.output ?? {}

    // 根据输出中的 type 字段判断事件类型
    if (output.type === 'step_progress') {
      results.push({ type: 'text_delta', content: output.message ?? '' })
    } else if (output.type === 'step_reasoning') {
      results.push({ type: 'reasoning_delta', content: output.content ?? '' })
    } else if (output.type === 'tool_call') {
      const toolCallId = output.toolCallId || `wf_${data.nodeId}_${output.toolName}`
      toolCallIdMap.set(output.toolCallId || data.nodeId, toolCallId)
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
        : (toolCallIdMap.get(data.nodeId) || `wf_${data.nodeId}_${output.toolName}`)
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
    } else if (data.status === 'failed') {
      results.push({ type: 'text_delta', content: `  错误: ${data.error ?? '未知错误'}\n` })
    }
  }

  return results
}

// ==================== 辅助方法 ====================

/**
 * 构建意图分析后的用户确认消息
 * @param intent - 意图分析结果，IntentAnalysisResult，不可为空
 * @returns 友好的确认消息文本，string
 */
function buildIntentConfirmMessage(intent: IntentAnalysisResult): string {
  const parts: string[] = []
  const desc = intent.taskDescription || '您的需求'

  if (intent.intentType === 'modify_report') {
    parts.push(`好的，我已了解您的需求：${desc}`)
    const actions: string[] = []
    if (intent.needsDatasourceOperation) actions.push('配置数据源')
    if (intent.needsCellOperation) actions.push('修改单元格')
    if (intent.needsFormOperation) actions.push('配置查询表单')
    if (intent.needsRowColOperation) actions.push('调整行列结构')
    if (intent.needsPageConfigOperation) actions.push('调整页面配置')
    if (actions.length > 0) {
      parts.push(`接下来我将为您${actions.join('、')}，请稍候。`)
    }
  } else if (intent.intentType === 'analyze_report') {
    parts.push(`好的，我来帮您分析：${desc}`)
  }

  return parts.join('')
}
