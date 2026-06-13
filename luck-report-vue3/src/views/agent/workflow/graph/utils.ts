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

const SQL_TYPE_WORDS = new Set([
  'varchar', 'int', 'integer', 'float', 'double', 'decimal', 'datetime', 'date', 'time',
  'boolean', 'text', 'blob', 'bigint', 'smallint', 'tinyint', 'char', 'numeric', 'timestamp'
])

const SCHEMA_NOISE_WORDS = new Set([
  'table', 'primary', 'key', 'foreign', 'keys', 'examples', 'example', 'filter', 'sort',
  'from', 'where', 'select', 'and', 'the', 'null', 'not', 'index', 'unique', 'constraint'
])

/** 表名与用户需求的相关性评分 */
export function scoreTableRelevance(tableName: string, userMessage: string): number {
  const tn = tableName.toLowerCase()
  const msg = userMessage.toLowerCase()
  let score = 0
  if (/用户|user/i.test(msg) && tn.includes('user')) score += 20
  if (/订单|order/i.test(msg) && tn.includes('order')) score += 20
  if (/信息|info/i.test(msg) && (tn.includes('info') || tn.includes('user'))) score += 5
  if (tn.startsWith('sys_')) score += 3
  if (tn.includes('_')) score += 1
  return score
}

/** 判断字符串是否像物理表名（排除字段名、SQL 类型、示例值等噪音） */
export function isPlausibleTableName(name: string): boolean {
  if (!name || typeof name !== 'string') return false
  const trimmed = name.trim()
  if (trimmed.length < 4 || trimmed.length > 64) return false
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmed)) return false
  const lower = trimmed.toLowerCase()
  if (SQL_TYPE_WORDS.has(lower)) return false
  if (SCHEMA_NOISE_WORDS.has(lower)) return false
  if (/^d_[a-z0-9_]+$/i.test(trimmed)) return false
  if (/^[A-Z0-9_]+$/.test(trimmed) && trimmed.length <= 6) return false
  if (!trimmed.includes('_') && !lower.startsWith('sys')) return false
  const likelyColumns = new Set([
    'username', 'password', 'name', 'code', 'remarks', 'salt', 'grade',
    'admin', 'zhangsan', 'guoshuang', 'hunan', 'changsha', 'parent_id', 'dict_id', 'office_id',
    'create_by', 'update_by', 'create_date', 'update_date', 'del_flag', 'parent_ids', 'all_names',
    'dict_code', 'dict_id', 'dict_type'
  ])
  if (likelyColumns.has(lower)) return false
  return true
}

/** 过滤并排序候选表名，默认只保留最相关的 1 个 */
export function pickTargetTableNames(rawNames: string[], userMessage: string, limit = 1): string[] {
  const unique = [...new Set(rawNames.map(n => n.trim()).filter(Boolean))]
  const plausible = unique.filter(isPlausibleTableName)
  return plausible
    .sort((a, b) => scoreTableRelevance(b, userMessage) - scoreTableRelevance(a, userMessage))
    .slice(0, limit)
}

/**
 * 从 search_schema 结果中解析指定数据源下的候选表名（中文名 + 括号内英文名）
 */
export function extractTargetTableNames(
  searchSchema: any,
  pickedName: string,
  userMessage = '',
  limit = 1
): string[] {
  const arr: any[] = searchSchema?.datasources || searchSchema?.results
    || (Array.isArray(searchSchema) ? searchSchema : [])
  const pickedItem = arr.find((it: any) => {
    const name = it?.datasourceName || it?.datasource_name || it?.name || it?.datasource
    return name === pickedName
  })
  const tableNames: string[] = []
  if (!pickedItem) return tableNames

  if (Array.isArray(pickedItem.tables)) {
    for (const t of pickedItem.tables) {
      if (typeof t === 'string' && t.length > 0) tableNames.push(t)
      else if (t?.name) tableNames.push(String(t.name))
    }
  }
  if (typeof pickedItem.tableName === 'string' && pickedItem.tableName.length > 0) {
    tableNames.push(pickedItem.tableName)
  }

  const promptText: string = typeof pickedItem?.schemaPrompt === 'string' ? pickedItem.schemaPrompt : ''
  if (promptText) {
    const re = /表名\s*[:：]\s*([^\n(（]+?)(?:\s*[（(]([^)）]+)[)）])?/g
    let m: RegExpExecArray | null
    while ((m = re.exec(promptText)) !== null) {
      const cn = m[1]?.trim()
      const en = m[2]?.trim()
      if (cn) tableNames.push(cn)
      if (en) tableNames.push(en)
    }
  }
  return pickTargetTableNames(tableNames, userMessage, limit)
}

/** 从用户消息 / 意图推断 get_table_relation 的 query 参数 */
export function inferTableQuery(userMessage: string, intent?: { taskDescription?: string }): string {
  const text = (intent?.taskDescription || userMessage || '').trim()
  if (!text) return '用户'
  return text.replace(/^在.*?中/, '').replace(/创建|添加|新增|一个|的|数据集/g, '').trim() || text
}

/** 结构化表结构中间态（resolve_table 产出，下游只读此对象） */
export interface ResolvedSchema {
  datasourceName: string
  tableName: string
  tableQuery: string
  columns: string[]
  schemaPrompt: string
}

/** 从 get_table_relation / schemaPrompt 文本解析物理表名与字段 */
export function parseSchemaPromptText(
  structure: any,
  userMessage = '',
  fallbackQuery = ''
): { tableName: string; columns: string[]; schemaPrompt: string } {
  const schemaPrompt = typeof structure === 'string' ? structure : JSON.stringify(structure ?? '')
  let tableName = ''

  const parenMatch = schemaPrompt.match(/表名\s*[:：][^\n(（]*[（(]([^)）]+)[)）]/)
  if (parenMatch?.[1] && isPlausibleTableName(parenMatch[1].trim())) {
    tableName = parenMatch[1].trim()
  }
  if (!tableName) {
    const rawNames: string[] = []
    const re = /表名\s*[:：]\s*([^\n(（]+?)(?:\s*[（(]([^)）]+)[)）])?/g
    let m: RegExpExecArray | null
    while ((m = re.exec(schemaPrompt)) !== null) {
      if (m[2]?.trim()) rawNames.push(m[2].trim())
      if (m[1]?.trim()) rawNames.push(m[1].trim())
    }
    const candidates = [...rawNames]
    if (fallbackQuery && isPlausibleTableName(fallbackQuery)) candidates.unshift(fallbackQuery)
    tableName = pickTargetTableNames(candidates, userMessage, 1)[0] ?? ''
  }
  if (!tableName) {
    const sysMatch = schemaPrompt.match(/\b(sys_[a-z0-9_]+)\b/i)
    if (sysMatch?.[1] && isPlausibleTableName(sysMatch[1])) tableName = sysMatch[1]
  }

  const columns: string[] = []
  const fieldMatch = schemaPrompt.match(/字段\s*[:：]\s*([^\n]+)/)
  if (fieldMatch) {
    for (const f of fieldMatch[1].split(/[,，]/)) {
      const col = f.trim()
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col)) columns.push(col)
    }
  }
  return { tableName, columns, schemaPrompt }
}

/** 从 ResolvedSchema 生成 SQL（优先使用已解析字段） */
export function inferSqlFromResolvedSchema(resolved: ResolvedSchema | null | undefined): string | null {
  if (!resolved?.tableName || !isPlausibleTableName(resolved.tableName)) return null
  if (Array.isArray(resolved.columns) && resolved.columns.length > 0) {
    return `SELECT ${resolved.columns.join(', ')} FROM ${resolved.tableName}`
  }
  return `SELECT * FROM ${resolved.tableName}`
}

/** 从 tableStructures 读取 ResolvedSchema（兼容旧结构） */
export function readResolvedSchema(tableStructures: any): ResolvedSchema | null {
  if (!tableStructures || typeof tableStructures !== 'object') return null
  if (tableStructures.tableName && tableStructures.datasourceName) {
    return tableStructures as ResolvedSchema
  }
  const dsName = tableStructures.datasourceName ?? ''
  const entry = Array.isArray(tableStructures.tables) ? tableStructures.tables[0] : null
  if (!entry) return null
  const parsed = parseSchemaPromptText(entry.structure, '', entry.tableName)
  if (!parsed.tableName) return null
  return {
    datasourceName: dsName,
    tableName: parsed.tableName,
    tableQuery: entry.tableName ?? parsed.tableName,
    columns: parsed.columns,
    schemaPrompt: parsed.schemaPrompt
  }
}

/** 从 tableStructures 推断 SQL（优先 ResolvedSchema） */
export function inferSqlFromTableStructures(tableStructures: any, userMessage = ''): string | null {
  const resolved = readResolvedSchema(tableStructures)
  if (resolved) return inferSqlFromResolvedSchema(resolved)

  const tables = tableStructures?.tables
  if (!Array.isArray(tables) || tables.length === 0) return null
  const ranked = [...tables]
    .filter((t: any) => t?.structure && !t?.error)
    .sort((a: any, b: any) =>
      scoreTableRelevance(String(b?.tableName ?? ''), userMessage)
      - scoreTableRelevance(String(a?.tableName ?? ''), userMessage)
    )
  const entry = ranked[0] ?? tables[0]
  const parsed = parseSchemaPromptText(entry?.structure, userMessage, entry?.tableName)
  if (!parsed.tableName) return null
  return inferSqlFromResolvedSchema({
    datasourceName: tableStructures.datasourceName ?? '',
    tableName: parsed.tableName,
    tableQuery: entry?.tableName ?? parsed.tableName,
    columns: parsed.columns,
    schemaPrompt: parsed.schemaPrompt
  })
}

/** 确定性找/建 buildin 数据源 */
export async function resolveBuildinDatasource(
  runtime: any,
  stepId: string,
  state: Record<string, any>
): Promise<{ targetDatasourceName?: string; datasources?: any[]; errors?: string[] }> {
  const sr: any = state.searchResults || {}
  const legalNames: string[] = Array.isArray(sr.load_buildin_datasources?.datasources)
    ? sr.load_buildin_datasources.datasources : []
  if (legalNames.length === 0) {
    return { errors: ['未获取到合法的 buildin 数据源列表'] }
  }

  const pickedName = pickDatasourceName(extractSearchCandidates(sr.search_schema), legalNames)
    ?? pickDatasourceName(legalNames, legalNames)
  if (!pickedName) {
    return { errors: ['未找到与用户需求匹配的内置数据源，jdbc/spring 类型需在报表设计器中手动添加'] }
  }

  const existing: any = await runToolWithEvent(runtime, stepId, 'get_datasources', {})
  const dsList: any[] = Array.isArray(existing) ? existing : (Array.isArray(existing?.datasources) ? existing.datasources : [])
  if (dsList.some((d: any) => d?.name === pickedName)) {
    return { targetDatasourceName: pickedName, datasources: dsList }
  }

  const template: any = await runToolWithEvent(runtime, stepId, 'get_datasource_template', { name: pickedName })
  if (!template || template.error || template.type !== 'buildin') {
    return { errors: [`获取数据源模板失败: ${pickedName}`] }
  }
  const addResult: any = await runToolWithEvent(runtime, stepId, 'add_datasource', { datasource: template })
  if (addResult?.success === false) {
    return { errors: [`添加数据源失败: ${addResult.message || '未知错误'}`] }
  }
  const newDs = {
    name: template.name,
    type: template.type,
    datasets: Array.isArray(template.datasets) ? template.datasets : []
  }
  const previous = Array.isArray(state.datasources) ? state.datasources : []
  const merged = previous.some((d: any) => d?.name === newDs.name) ? previous : [...previous, newDs]
  return { targetDatasourceName: pickedName, datasources: merged }
}

/** 推断 SQL 数据集名称 */
export function inferDatasetName(userMessage: string, template: any): string {
  if (typeof template?.name === 'string' && template.name.length > 0 && template.name !== 'datasetName') {
    return template.name
  }
  if (/用户/.test(userMessage)) return 'userInfoDataset'
  return 'newDataset'
}

/** 为 LLM 节点注入已就绪的工作流 state（避免 LLM 编造 default_datasource 等） */
export function buildWorkflowStateContext(state: Record<string, any>): string {
  const parts: string[] = []
  if (state.targetDatasourceName) {
    parts.push(`targetDatasourceName: ${JSON.stringify(state.targetDatasourceName)}`)
  }
  if (Array.isArray(state.targetTableNames) && state.targetTableNames.length > 0) {
    parts.push(`targetTableNames: ${JSON.stringify(state.targetTableNames)}`)
  }
  if (state.tableStructures) {
    parts.push(`tableStructures: ${JSON.stringify(state.tableStructures)}`)
  }
  if (state.datasetTemplate) {
    parts.push(`datasetTemplate: ${JSON.stringify(state.datasetTemplate)}`)
  }
  if (state.dataset) {
    parts.push(`dataset: ${JSON.stringify(state.dataset)}`)
  }
  if (parts.length === 0) return ''
  return `\n\n[工作流状态 — 以下值已就绪，必须直接使用，禁止编造]\n${parts.join('\n')}`
}

/** 过滤 append reducer 产生的 null/undefined 等无效错误项 */
export function filterActiveErrors(errors: unknown): string[] {
  if (!Array.isArray(errors)) return []
  return errors.filter((e): e is string => typeof e === 'string' && e.length > 0)
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
