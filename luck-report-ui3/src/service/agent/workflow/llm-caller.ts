/**
 * chatStream 适配器
 * 将回调式 chatStream API 包装为 LLMCaller（AsyncGenerator<LLMEvent>）
 * LLM 决策节点通过 runtime.llmCaller 调用，输出与 LangGraph 工具调用解耦
 */

import { chatStream, type ContextMessage, type SseToolCall } from '@/api/chat'
import type { LLMCaller, LLMEvent, LLMCallOptions } from './runtime.ts'
import type { MemoryManager } from '../memory/memory-manager.ts'
import type { ContextManager } from '../core/context-manager.ts'

/**
 * 创建 LLM 调用器
 * 将 chatStream 回调式 API 包装为 AsyncGenerator<LLMEvent>
 *
 * @param memoryManager - 记忆管理器，用于读写消息历史，不可为空
 * @param contextManager - 上下文管理器，用于构建系统提示词，不可为空
 * @returns LLM 调用器函数
 */
export function createLLMCaller(
  memoryManager: MemoryManager,
  contextManager: ContextManager
): LLMCaller {
  return async function* llmCaller(
    messages: any[],
    tools?: any[],
    options?: LLMCallOptions
  ): AsyncGenerator<LLMEvent> {
    // 构建系统提示词
    const systemPrompt = await contextManager.buildSystemPrompt()

    // 合并 system 消息到 API 消息列表
    const apiMessages: ContextMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as ContextMessage['role'],
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        toolCallId: m.tool_call_id,
        toolCalls: m.tool_calls
      }))
    ]

    // 事件队列和信号
    const eventQueue: LLMEvent[] = []
    let resolveWait: (() => void) | null = null
    let done = false
    let hasError = false
    // 关键决策点日志：仅在首个 token 出现时打一次（避免循环高频打日志）
    let tokenStartLogged = false

    /** 将事件放入队列，通知等待者 */
    const pushEvent = (event: LLMEvent) => {
      eventQueue.push(event)
      if (resolveWait) {
        resolveWait()
        resolveWait = null
      }
    }

    /** 等待队列中有事件 */
    const waitForEvent = (): Promise<void> => {
      if (eventQueue.length > 0 || done) return Promise.resolve()
      return new Promise(r => { resolveWait = r })
    }


    // 调用 chatStream
    chatStream(
      '',
      {
        onMessage: (data: string) => {
          if (!tokenStartLogged) {
            tokenStartLogged = true
          }
          pushEvent({ type: 'token', content: data })
        },
        onReasoning: (data: string) => {
          pushEvent({ type: 'reasoning', content: data })
        },
        onTokenUsage: (usage) => {
          pushEvent({ type: 'token_usage', usage })
        },
        onToolUse: (toolCall: SseToolCall) => {
          pushEvent({
            type: 'tool_call',
            toolCallId: toolCall.toolCallId,
            toolName: toolCall.toolName,
            input: toolCall.input
          })
        },
        onDone: () => {
          pushEvent({ type: 'done' })
          done = true
          if (resolveWait) {
            resolveWait()
            resolveWait = null
          }
        },
        onError: (error: string) => {
          pushEvent({ type: 'error', message: error })
          hasError = true
          done = true
          if (resolveWait) {
            resolveWait()
            resolveWait = null
          }
        }
      },
      options?.signal,
      undefined,
      undefined,
      apiMessages,
      tools,
      options?.sessionId,
      options?.modelId,
      undefined,
      options?.deepThink
    )

    // 从队列中 yield 事件
    while (!done || eventQueue.length > 0) {
      if (eventQueue.length > 0) {
        const event = eventQueue.shift()!
        yield event
        // done 事件后停止
        if (event.type === 'done' || event.type === 'error') break
      } else {
        await waitForEvent()
      }
    }
  }
}
