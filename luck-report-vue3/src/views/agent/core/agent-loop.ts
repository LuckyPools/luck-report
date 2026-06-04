import type { ToolRegistry } from '../tools/registry'
import type { ToolCall } from '../tools/types'
import type { MemoryManager } from '../memory/memory-manager'
import type { ContextManager } from './context-manager'
import type { ToolCallInfo, ReportSnapshot } from '../memory/types'
import type { TokenUsage } from '@/api/chat'
import { chatStream, type ContextMessage, type SseToolCall, type ToolCallMessage } from '@/api/chat'

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
  /** 最大循环轮次，防止无限循环，默认 10 */
  maxIterations: number
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
}

/**
 * Agent 核心循环
 * 参考 Claude Code 的 query() Agentic Loop 模式：
 * 用户输入 → 调用 LLM → 解析 tool_use → 执行工具 → 结果喂回 LLM → 重复
 *
 * 工作流程：
 * 1. 构建系统提示词（上下文管理器）
 * 2. 获取历史消息（记忆管理器）
 * 3. SSE 调用后台 LLM，携带工具定义
 * 4. 流式接收响应，解析文本和 tool_use 事件
 * 5. 执行工具调用（通过 PostMessage 操作设计器）
 * 6. 将 tool_result 追加到消息历史
 * 7. 如果有工具调用，继续循环；否则结束
 *
 * OpenAI Function Calling 协议要求：
 * - 请求时携带 tools 参数，大模型通过 tool_calls 返回调用指令
 * - 回传消息历史时，assistant 消息必须包含 tool_calls 信息
 * - tool_result 消息必须使用 role="tool" 并携带 tool_call_id
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
  const { maxIterations, toolRegistry, memoryManager, contextManager, signal } = config
  // 将用户消息追加到记忆（仅在此处追加一次，避免重复）
  memoryManager.addMessage({ role: 'user', content: userMessage })

  // 构建系统提示词
  const systemPrompt = await contextManager.buildSystemPrompt()
  const tools = toolRegistry.toApiFormat()

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    if (signal?.aborted) {
      onEvent({ type: 'done', reason: 'aborted' })
      return
    }

    // 获取上下文消息（摘要 + 最近消息），包含 tool_calls 信息
    const contextMessages = memoryManager.getContextMessages()

    // 构建完整的消息列表：系统提示 + 上下文
    // 注意：不再重复追加用户消息，因为 contextMessages 已包含
    const fullMessages: ContextMessage[] = [
      { role: 'system', content: systemPrompt },
      ...buildApiMessages(contextMessages)
    ]

    // SSE 流式请求，携带工具定义
    let assistantContent = ''
    let reasoningContent = ''
    const toolCalls: ToolCall[] = []
    // 收集原始 tool_calls 信息，用于回传给大模型
    const rawToolCalls: ToolCallInfo[] = []
    let hasError = false
    let errorMessage = ''

    try {
      // Agent 循环中 message 参数传空字符串，
      // 因为用户消息已包含在 fullMessages 中，避免后端重复追加
      await chatStream(
        '',
        {
          onMessage: (data) => {
            assistantContent += data
            onEvent({ type: 'text_delta', content: data })
          },
          onReasoning: (data) => {
            reasoningContent += data
            onEvent({ type: 'reasoning_delta', content: data })
          },
          onToolUse: (sseToolCall: SseToolCall) => {
            const toolCall: ToolCall = {
              toolCallId: sseToolCall.toolCallId,
              toolName: sseToolCall.toolName,
              input: sseToolCall.input,
              status: 'pending'
            }
            toolCalls.push(toolCall)

            // 收集原始 tool_calls 信息，用于回传
            rawToolCalls.push({
              id: sseToolCall.toolCallId,
              type: 'function',
              function: {
                name: sseToolCall.toolName,
                arguments: JSON.stringify(sseToolCall.input)
              }
            })
          },
          onTokenUsage: (usage: TokenUsage) => {
            onEvent({ type: 'token_usage', usage })
          },
          onDone: () => {},
          onError: (error) => {
            hasError = true
            errorMessage = error
          }
        },
        signal,
        undefined,
        undefined,
        fullMessages,
        tools,
        config.sessionId,
        config.modelId
      )
    } catch (err: any) {
      if (err.name === 'AbortError') {
        onEvent({ type: 'done', reason: 'aborted' })
        return
      }
      onEvent({ type: 'done', reason: 'error', error: err.message })
      return
    }

    if (hasError) {
      onEvent({ type: 'done', reason: 'error', error: errorMessage })
      return
    }

    // 将 assistant 消息追加到记忆，携带 tool_calls 信息
    // OpenAI 协议要求：assistant 消息如果调用了工具，
    // 回传时必须包含 tool_calls，否则大模型无法关联 tool_result
    // 过滤规则：如果 content 为空且没有 toolCalls，则不添加（避免产生无意义的空消息）
    if (assistantContent.trim() || rawToolCalls.length > 0) {
      memoryManager.addMessage({
        role: 'assistant',
        content: assistantContent,
        toolCalls: rawToolCalls.length > 0 ? rawToolCalls : undefined
      })
    }

    // 第3/4层：检查是否需要自动压缩（异步执行，不阻塞后续对话）
    // 必须在判断 toolCalls 之前检查，否则纯文本对话（无工具调用）永远不会触发压缩
    // 异步执行：压缩请求耗时较长（调用 LLM），不应阻塞当前对话的继续
    if (memoryManager.needsCompact() && config.onAutoCompact) {
      if (config.onCaptureSnapshot) {
        config.onCaptureSnapshot().then(snapshot => {
          if (snapshot) {
            memoryManager.updateReportSnapshot(snapshot)
          }
        }).catch(() => {})
      }
      config.onAutoCompact(memoryManager).catch(e => {
        console.warn('[agent-loop] 异步压缩失败:', e)
      })
    }

    // 如果没有工具调用，循环结束
    if (toolCalls.length === 0) {
      onEvent({ type: 'done', reason: 'completed' })
      return
    }

    // 执行工具调用
    for (const toolCall of toolCalls) {
      if (signal?.aborted) {
        onEvent({ type: 'done', reason: 'aborted' })
        return
      }

      const tool = toolRegistry.get(toolCall.toolName)

      if (!tool) {
        toolCall.status = 'error'
        toolCall.error = `未找到工具: ${toolCall.toolName}`
        onEvent({ type: 'tool_call_result', toolCall })

        memoryManager.addMessage({
          role: 'tool_result',
          content: JSON.stringify({ error: toolCall.error }),
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName
        })
        continue
      }

      // 参数校验
      const validation = toolRegistry.validateInput(toolCall.toolName, toolCall.input)
      if (!validation.valid) {
        toolCall.status = 'error'
        toolCall.error = `参数校验失败: ${validation.errors.join('; ')}`
        onEvent({ type: 'tool_call_result', toolCall })

        memoryManager.addMessage({
          role: 'tool_result',
          content: JSON.stringify({ error: toolCall.error }),
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName
        })
        continue
      }

      // 需要确认的工具，询问用户
      if (tool.requireConfirm && config.onToolConfirm) {
        toolCall.status = 'confirming'
        onEvent({ type: 'tool_call_confirm', toolCall })

        const confirmed = await config.onToolConfirm(toolCall)
        if (!confirmed) {
          toolCall.status = 'error'
          toolCall.error = '用户拒绝执行'
          onEvent({ type: 'tool_call_result', toolCall })

          memoryManager.addMessage({
            role: 'tool_result',
            content: JSON.stringify({ error: '用户拒绝执行此操作' }),
            toolCallId: toolCall.toolCallId,
            toolName: toolCall.toolName
          })
          continue
        }
      }

      // 执行工具
      toolCall.status = 'running'
      onEvent({ type: 'tool_call_start', toolCall })

      try {
        const result = await tool.execute(toolCall.input)
        toolCall.status = 'done'
        toolCall.result = result

        // 记录关键操作到记忆
        memoryManager.recordOperation(
          `调用 ${toolCall.toolName}(${JSON.stringify(toolCall.input)}) → 成功`
        )

        // 写操作执行后，使报表状态缓存失效
        if (!tool.readOnly) {
          contextManager.invalidateCache()
        }
      } catch (err: any) {
        toolCall.status = 'error'
        toolCall.error = err.message || '工具执行失败'
      }

      onEvent({ type: 'tool_call_result', toolCall })

      // 将工具结果追加到记忆
      memoryManager.addMessage({
        role: 'tool_result',
        content: JSON.stringify(toolCall.result ?? { error: toolCall.error }),
        toolCallId: toolCall.toolCallId,
        toolName: toolCall.toolName
      })
    }

    // 有工具调用，继续循环让 LLM 处理结果
    // 下一轮循环中，LLM 会看到 assistant(含tool_calls) + tool_result 并决定是否继续
  }

  // 达到最大轮次
  onEvent({ type: 'done', reason: 'max_iterations' })
}

/**
 * 将记忆消息转换为 API 请求的消息格式
 * 关键处理：assistant 消息携带 tool_calls 时，
 * 需要展开为 OpenAI 协议要求的格式：
 * - assistant 消息包含 tool_calls 数组
 * - tool_result 消息映射为 role="tool" 并携带 tool_call_id
 *
 * @param messages - 记忆管理器中的消息列表
 * @returns 符合 OpenAI Function Calling 协议的消息数组
 */
function buildApiMessages(messages: import('../memory/types').MemoryMessage[]): ContextMessage[] {
  const result: ContextMessage[] = []

  for (const msg of messages) {
    if (msg.role === 'tool_result') {
      // tool_result 映射为 OpenAI 的 tool 角色
      result.push({
        role: 'tool_result',
        content: msg.content,
        toolCallId: msg.toolCallId,
        toolName: msg.toolName
      })
    } else if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
      // assistant 消息携带 tool_calls 时，需要特殊处理
      // OpenAI 协议要求 assistant 消息同时包含 content 和 tool_calls
      result.push({
        role: 'assistant',
        content: msg.content || '',
        toolCalls: msg.toolCalls as ToolCallMessage[]
      })
    } else {
      result.push({
        role: msg.role as ContextMessage['role'],
        content: msg.content
      })
    }
  }

  return result
}
