import type { ToolRegistry } from '../tools/registry'
import type { ToolCall } from '../tools/types'
import type { MemoryManager } from '../memory/memory-manager'
import type { ContextManager } from './context-manager'
import type { ReportSnapshot } from '../memory/types'
import type { TokenUsage } from '@/api/chat'
import type { WorkflowEvent, WorkflowStepRecord } from '../workflow/types'
import { WorkflowEngine, type WorkflowEngineConfig } from '../workflow/workflow-engine'

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
  /**
   * 步骤记录变更回调，用于同步任务进度到前端
   */
  onStepRecordsChange?: (stepRecords: WorkflowStepRecord[], activeStepId?: string) => void
}

/**
 * Agent 核心循环入口
 * 工作流模式：代码驱动步骤顺序，LLM 只负责意图分析和参数生成
 *
 * @param userMessage - 用户输入消息
 * @param config - 循环配置
 * @param onEvent - 事件回调，用于 UI 层实时渲染
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
 * 代码驱动步骤顺序，LLM 只负责意图分析和参数生成
 * 核心流程：意图分析 → 选择工作流模板 → 按步骤执行 → 每步由 LLM 填充参数
 *
 * @param userMessage - 用户输入消息，string，不可为空
 * @param config - 循环配置
 * @param onEvent - 事件回调
 */
async function runWorkflowMode(
  userMessage: string,
  config: AgentLoopConfig,
  onEvent: (event: AgentEvent) => void
): Promise<void> {
  const { toolRegistry, memoryManager, contextManager, signal } = config

  // 将用户消息追加到记忆
  memoryManager.addMessage({ role: 'user', content: userMessage })

  // 创建工作流引擎
  const engineConfig: WorkflowEngineConfig = {
    toolRegistry,
    memoryManager,
    contextManager,
    signal,
    onToolConfirm: config.onToolConfirm,
    sessionId: config.sessionId,
    modelId: config.modelId,
    maxIterationsPerStep: config.maxIterationsPerStep ?? 5,
    onStepRecordsChange: config.onStepRecordsChange
  }

  const engine = new WorkflowEngine(engineConfig)

  // 工作流事件转换为 Agent 事件
  // 记录每个步骤的 toolCallId，确保 tool_call 和 tool_result 使用相同 ID
  const stepToolCallIdMap = new Map<string, string>()

  const workflowEventAdapter = (wfEvent: WorkflowEvent) => {
    switch (wfEvent.type) {
      case 'workflow_start':
        // 工作流开始，无需特殊处理
        break

      case 'step_start':
        // 步骤名称已在任务列表中展示，不再输出到对话
        console.log(`[Workflow] 步骤开始: ${wfEvent.stepName}`)
        break

      case 'step_progress':
        // 步骤进度，转发文本
        onEvent({ type: 'text_delta', content: wfEvent.message })
        break

      case 'step_reasoning':
        // 步骤推理/思考内容，转发为 reasoning_delta
        onEvent({ type: 'reasoning_delta', content: wfEvent.content })
        break

      case 'step_skip':
        // 跳过信息仅打印到控制台，不输出到对话
        console.log(`[Workflow] 步骤跳过: ${wfEvent.reason}`)
        break

      case 'step_complete':
        // 步骤完成
        break

      case 'step_error':
        onEvent({ type: 'text_delta', content: `  错误: ${wfEvent.error}\n` })
        break

      case 'tool_call': {
        // 工具调用，转换为 AgentEvent 的 tool_call_start
        // 优先使用事件携带的 toolCallId，兼容旧逻辑
        const toolCallId = wfEvent.toolCallId || `wf_${wfEvent.stepId}_${wfEvent.toolName}`
        stepToolCallIdMap.set(wfEvent.toolCallId || wfEvent.stepId, toolCallId)
        const toolCall: ToolCall = {
          toolCallId,
          toolName: wfEvent.toolName,
          input: wfEvent.input,
          status: 'running'
        }
        onEvent({ type: 'tool_call_start', toolCall })
        break
      }

      case 'tool_result': {
        // 工具结果，转换为 AgentEvent 的 tool_call_result
        // 优先使用事件携带的 toolCallId，复用 tool_call 阶段的 ID 确保 UI 能匹配更新状态
        const toolCallId = wfEvent.toolCallId
          ? (stepToolCallIdMap.get(wfEvent.toolCallId) || wfEvent.toolCallId)
          : (stepToolCallIdMap.get(wfEvent.stepId) || `wf_${wfEvent.stepId}_${wfEvent.toolName}`)
        const toolCall: ToolCall = {
          toolCallId,
          toolName: wfEvent.toolName,
          input: {},
          status: wfEvent.error ? 'error' : 'done',
          result: wfEvent.result,
          error: wfEvent.error
        }
        onEvent({ type: 'tool_call_result', toolCall })
        break
      }

      case 'llm_call':
      case 'llm_response':
        // LLM 调用/响应事件，暂不处理
        break

      case 'workflow_complete': {
        // 工作流完成
        const result = wfEvent.result
        if (result.error) {
          onEvent({ type: 'text_delta', content: `\n${result.error}` })
        }
        onEvent({ type: 'done', reason: result.success ? 'completed' : 'error', error: result.error })
        break
      }
    }
  }

  try {
    const result = await engine.execute(userMessage, workflowEventAdapter)

    // 工作流执行完毕后，检查是否需要压缩
    if (memoryManager.needsCompact() && config.onAutoCompact) {
      if (config.onCaptureSnapshot) {
        try {
          const snapshot = await config.onCaptureSnapshot()
          if (snapshot) {
            memoryManager.updateReportSnapshot(snapshot)
          }
        } catch {}
      }
      try {
        await config.onAutoCompact(memoryManager)
      } catch (e) {
        console.warn('[agent-loop] 工作流模式压缩失败:', e)
      }
    }

    // 注意：done 事件已由 workflow_complete 事件适配器中发送，此处不再重复发送
    // 仅当 workflow_complete 未触发时（异常情况）兜底发送
  } catch (err: any) {
    if (err.name === 'AbortError') {
      onEvent({ type: 'done', reason: 'aborted' })
    } else {
      onEvent({ type: 'done', reason: 'error', error: err.message })
    }
  }
}
