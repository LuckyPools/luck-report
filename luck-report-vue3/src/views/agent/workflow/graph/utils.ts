/** 工作流图通用辅助函数：文档提取 / 命名选取 / 工具调用包装 / 缓存复用 */

// 兼容旧版 load_report_introduce 返回字符串的兜底分隔
export const DOC_SEPARATOR = /\n*---- 分界线 ----\n*/

/**
 * 从 load_report_introduce 工具返回结果中提取 { docName: content } 映射
 */
export function extractDocsMap(result: any, fallbackNames?: string[]): Record<string, string> {
  if (!result) return {}
  if (typeof result === 'object' && result.docs && typeof result.docs === 'object') {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(result.docs)) {
      if (typeof v === 'string' && v.length > 0) out[k] = v
    }
    return out
  }
  if (typeof result === 'string' && fallbackNames && fallbackNames.length > 0) {
    const parts = result.split(DOC_SEPARATOR)
    const out: Record<string, string> = {}
    fallbackNames.forEach((name, i) => {
      out[name] = parts[i] ?? result
    })
    return out
  }
  return {}
}

/**
 * 把工具返回值规范化为 LLM/UI 友好的纯文本
 */
export function formatDocsAsText(result: any): string {
  if (!result) return ''
  if (typeof result === 'object' && result.docs && typeof result.docs === 'object') {
    return Object.entries(result.docs)
      .filter(([, v]) => typeof v === 'string' && v.length > 0)
      .map(([name, content]) => `[${name}]\n${content}`)
      .join('\n\n---- 分界线 ----\n')
  }
  if (typeof result === 'string') return result
  return ''
}

/**
 * 从 search_schema 工具返回结果中提取候选数据源名
 */
export function extractSearchCandidates(searchResult: any): string[] {
  if (!searchResult) return []
  const arr: any[] = searchResult?.datasources || searchResult?.results
    || (Array.isArray(searchResult) ? searchResult : [])
  const names: string[] = []
  for (const item of arr) {
    const name = item?.datasourceName || item?.datasource_name || item?.name || item?.datasource
    if (typeof name === 'string' && name.length > 0) names.push(name)
  }
  return names
}

/**
 * 从候选名 + 合法 buildin 列表中确定性选一个数据源名（绕开 LLM 幻觉）
 * 无交集时返回 null，由调用方决定如何处理（提示用户、终止或回退）
 */
export function pickDatasourceName(searchCandidates: string[], legalNames: string[]): string | null {
  if (legalNames.length === 0) return null
  for (const candidate of searchCandidates) {
    if (legalNames.includes(candidate)) return candidate
  }
  return null
}

/**
 * 通用工具调用包装：发"工具调用"事件 → 执行 → 发"工具结果"事件
 */
export async function runToolWithEvent<T>(runtime: any, stepId: string, toolName: string, input: any): Promise<T> {
  const toolCallId = `${stepId}_${toolName}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  runtime?.emitEvent({
    mode: 'updates',
    event: { nodeId: stepId, output: { type: 'tool_call', toolCallId, toolName, input }, status: 'running' },
    timestamp: Date.now()
  })
  const result = await runtime?.toolRegistry.executeTool(toolName, input)
  runtime?.emitEvent({
    mode: 'updates',
    event: {
      nodeId: stepId,
      output: { type: 'tool_result', toolCallId, toolName, result },
      status: result !== null && result !== undefined ? 'success' : 'failed'
    },
    timestamp: Date.now()
  })
  return result as T
}
