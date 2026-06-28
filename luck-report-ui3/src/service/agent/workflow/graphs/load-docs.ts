/**
 * 加载文档节点（公共）
 * 报表主工作流入口节点，调 load_report_doc 加载 intent.requiredDocs
 * 行为：
 * 1. 缓存命中时（searchResults.docRefs 已包含全部 requiredDocs）跳过工具调用，发"已跳过"事件
 * 2. 缺失时调工具加载，结果写 knowledge cache（跨 turn 复用）+ 写 tool_result 到 messages
 * 3. 写 searchResults.docRefs 到 state，标识本轮已加载的文档集合
 */

import { withInput } from '../node-wrapper.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'
import { buildToolCallId, extractDocsMap, formatDocsAsText } from '../utils.ts'

/**
 * 构建 load_docs 节点
 * @returns LangGraph 节点函数
 */
export function buildLoadDocsNode() {
  return withInput(async (state: ReportState, _config, runtime) => {
    const stepId = 'load_docs'
    const docs = (state.intent?.requiredDocs as string[] | undefined) ?? []
    // 缓存命中：state.searchResults.docRefs 已记录本轮已加载的文档
    const docRefs: string[] = Array.isArray((state.searchResults as any)?.docRefs)
      ? (state.searchResults as any).docRefs
      : []
    const loadedSet = new Set<string>(docRefs)
    const missingDocs = docs.filter((d: string) => !loadedSet.has(d))

    // 全量命中 → 跳过工具调用（仅发"已跳过"事件）
    if (missingDocs.length === 0) {
      const skipCallId = buildToolCallId(stepId, 'load_report_doc_skip', runtime.runId)
      runtime.emitEvent({ mode: 'updates', event: { nodeId: stepId, output: { type: 'tool_call', toolCallId: skipCallId, toolName: 'load_report_doc', input: { fileNames: docs } }, status: 'running' }, timestamp: Date.now() })
      runtime.emitEvent({ mode: 'updates', event: { nodeId: stepId, output: { type: 'tool_result', toolCallId: skipCallId, toolName: 'load_report_doc', result: '已命中跨 turn 文档缓存，本次跳过加载' }, status: 'success' }, timestamp: Date.now() })
      return { searchResults: { docRefs: docs } } as ReportStateUpdate
    }

    // 缺失加载：调工具 → 写缓存 → 写 messages
    const toolCallId = buildToolCallId(stepId, 'load_report_doc', runtime.runId)
    runtime.emitEvent({ mode: 'updates', event: { nodeId: stepId, output: { type: 'tool_call', toolCallId, toolName: 'load_report_doc', input: { fileNames: missingDocs } }, status: 'running' }, timestamp: Date.now() })
    const result = await runtime.toolRegistry.executeTool('load_report_doc', { fileNames: missingDocs })
    runtime.emitEvent({ mode: 'updates', event: { nodeId: stepId, output: { type: 'tool_result', toolCallId, toolName: 'load_report_doc', result: formatDocsAsText(result) }, status: result ? 'success' : 'failed' }, timestamp: Date.now() })

    // 写缓存：把工具返回内容存到 cache，跨 turn 复用
    if (runtime.memoryManager && result) {
      const docsMap = extractDocsMap(result, missingDocs)
      if (docsMap && Object.keys(docsMap).length > 0) {
        runtime.memoryManager.getKnowledgeCache().putBatch(docsMap)
      }
    }

    // 写 tool_result 到 messages（仅缺失部分，首次加载时）
    if (runtime.memoryManager && missingDocs.length > 0) {
      runtime.memoryManager.addMessage({
        role: 'tool_result',
        toolCallId,
        toolName: 'load_report_doc',
        content: formatDocsAsText(result),
        docRefs: [...missingDocs]
      })
    }

    return { searchResults: { docRefs: docs } } as ReportStateUpdate
  }, { nodeName: 'load_docs' })
}
