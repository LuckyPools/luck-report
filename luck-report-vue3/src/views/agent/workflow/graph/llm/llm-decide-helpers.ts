/** LLM 决策节点辅助函数：工具过滤 / 消息构建 / 必需工具校验 / 事件发射 / ID 映射，传入 self 实例避免类体积过大 */

import type { WorkflowRuntime } from '../runtime.ts'
import type { ToolRegistry } from '../../../tools/registry.ts'
import type { MemoryManager } from '../../../memory/memory-manager.ts'
import type { LLMDecideNode } from './llm-decide-node.ts'

/**
 * 过滤允许的工具定义
 */
export function filterAllowedTools(self: LLMDecideNode, toolRegistry: ToolRegistry): any[] {
  const allTools = toolRegistry.getToolDefinitions()
  if (self.options.allowedTools.length === 0) return allTools
  return allTools.filter((t: any) =>
    self.options.allowedTools.includes(t.function?.name ?? t.name)
  )
}

/**
 * 构建 LLM 消息列表（历史 + 当前步骤 + 知识块）
 */
export function buildMessages(
  self: LLMDecideNode,
  state: Record<string, any>,
  memoryManager: MemoryManager
): any[] {
  const history = memoryManager.getContextMessages()
  const stepContext = self.options.description
    ? `\n\n当前步骤: ${self.options.description}`
    : ''

  // 知识库内容注入：避免 messages 里 tool_result 全文与 knowledgeBlock 全文双重塞入
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
      const cache = memoryManager.getKnowledgeCache()
      const contentParts: string[] = []
      if (missingInMessages.length > 0) {
        for (const doc of missingInMessages) {
          const content = cache.get(doc)
          if (content) {
            contentParts.push(`[${doc}]\n${content}`)
          } else {
            contentParts.push(`[${doc}]\n（文档未在缓存中）`)
          }
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
  const userMessage = state.userMessage + knowledgeBlock + stepContext

  return [
    ...history,
    { role: 'user', content: userMessage }
  ]
}

/**
 * 校验必需工具是否都已执行成功（AND 语义）
 */
export function checkRequiredTools(self: LLMDecideNode, toolResults: Record<string, any>): string[] {
  const required = self.options.requiredToolResults ?? []
  return required.filter(name => {
    const result = toolResults[name]
    return !result || result.error
  })
}

/**
 * 校验必需工具是否至少执行了一个（OR 语义）
 */
export function checkRequiredToolsAny(self: LLMDecideNode, toolResults: Record<string, any>): string[] {
  const any = self.options.requiredToolResultsAny ?? []
  if (any.length === 0) return []
  const hit = any.some(name => {
    const r = toolResults[name]
    return r && !r.error
  })
  return hit ? [] : any
}

/**
 * 发射步骤进度事件
 */
export function emitProgress(
  self: LLMDecideNode,
  runtime: WorkflowRuntime,
  stepId: string,
  content: string
): void {
  runtime.emitEvent({
    mode: 'updates',
    event: { nodeId: stepId, output: { type: 'step_progress', message: content }, status: 'running' },
    timestamp: Date.now()
  })
}

/**
 * 发射推理内容事件
 */
export function emitReasoning(
  self: LLMDecideNode,
  runtime: WorkflowRuntime,
  stepId: string,
  content: string
): void {
  runtime.emitEvent({
    mode: 'updates',
    event: { nodeId: stepId, output: { type: 'step_reasoning', content }, status: 'running' },
    timestamp: Date.now()
  })
}

/**
 * 发射工具调用事件
 */
export function emitToolCall(
  self: LLMDecideNode,
  runtime: WorkflowRuntime,
  stepId: string,
  toolCallId: string,
  toolName: string,
  input: any
): void {
  runtime.emitEvent({
    mode: 'updates',
    event: { nodeId: stepId, output: { type: 'tool_call', toolCallId, toolName, input }, status: 'running' },
    timestamp: Date.now()
  })
}

/**
 * 发射工具结果事件
 */
export function emitToolResult(
  self: LLMDecideNode,
  runtime: WorkflowRuntime,
  stepId: string,
  toolCallId: string,
  toolName: string,
  result: any,
  error?: string
): void {
  runtime.emitEvent({
    mode: 'updates',
    event: { nodeId: stepId, output: { type: 'tool_result', toolCallId, toolName, result, error }, status: 'running' },
    timestamp: Date.now()
  })
}

/**
 * 将 LLM 原始 toolCallId 改写为 nodeId#runId#seq 命名空间的全局唯一 mappedId
 */
export function mapToolCallId(self: LLMDecideNode, originalId: string): string {
  const inner = self as any
  const cached = inner.toolCallIdMap.get(originalId)
  if (cached) return cached
  const mapped = `${inner.options.nodeId}#${inner.currentRunId}#${inner.toolCallCounter++}`
  inner.toolCallIdMap.set(originalId, mapped)
  return mapped
}
