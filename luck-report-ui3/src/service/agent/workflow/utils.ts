/**
 * 工作流图通用辅助函数：文档提取 / 命名选取 / 工具调用包装 / 缓存复用
 * 业务节点通过 import { extractDocsMap, runToolWithEvent, ... } from '../utils' 使用
 */

import type { SchemaDTO } from '@/api/datasource'

// 兼容旧版 load_report_doc 返回字符串的兜底分隔
export const DOC_SEPARATOR = /\n*---- 分界线 ----\n*/

/**
 * 从 load_report_doc 工具返回结果中提取 { docName: content } 映射
 * @param result - 工具返回的原始结果
 * @param fallbackNames - 字符串模式的兜底 docName 列表
 * @returns 文档名到内容的映射
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
 * @param result - 工具返回的原始结果
 * @returns 纯文本，多个文档用 DOC_SEPARATOR 分隔
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
 * @param searchResult - 搜索结果
 * @returns 数据源名列表
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
 * @param searchCandidates - 候选名列表
 * @param legalNames - 合法数据源名列表
 * @returns 选中的数据源名，无匹配时返回 null
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
 * 从 search_schema 结果中解析指定数据源下的候选表名
 * 优先使用结构化 schema.table 列表（每项含 name=物理表名）
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

  // 1. 结构化 schema.table 列表（首选）
  const tables = pickedItem?.schema?.table
  if (Array.isArray(tables)) {
    for (const t of tables) {
      if (typeof t === 'string' && t.length > 0) tableNames.push(t)
      else if (t?.name) tableNames.push(String(t.name))
    }
  }

  // 2. 兼容旧字段：顶层 tables / tableName
  if (Array.isArray(pickedItem.tables)) {
    for (const t of pickedItem.tables) {
      if (typeof t === 'string' && t.length > 0) tableNames.push(t)
      else if (t?.name) tableNames.push(String(t.name))
    }
  }
  if (typeof pickedItem.tableName === 'string' && pickedItem.tableName.length > 0) {
    tableNames.push(pickedItem.tableName)
  }

  return pickTargetTableNames(tableNames, userMessage, limit)
}

/** 从用户消息 / 意图推断 get_table_relation 的 query 参数 */
export function inferTableQuery(userMessage: string, intent?: { taskDescription?: string }): string {
  let text = (userMessage || '').trim()
  // 清洗 enriched 前缀：提取【本轮用户回答】中的原始内容
  const answerMatch = text.match(/【本轮用户回答】(.+?)(?:\n|【|$)/)
  if (answerMatch) {
    text = answerMatch[1].trim()
  }
  // 仅当 taskDescription 不含 ask_user 回复轮的偏移描述（如"配置数据源"）时才使用
  const taskDesc = intent?.taskDescription?.trim()
  if (taskDesc && !/配置|数据源|指定/.test(taskDesc)) {
    text = taskDesc
  }
  if (!text) return '用户'
  return text.replace(/^在.*?中/, '').replace(/创建|添加|新增|一个|的|数据集/g, '').trim() || text
}

/** 结构化表结构中间态（resolve_table 产出，下游只读此对象） */
export interface ResolvedSchema {
  datasourceName: string
  tableName: string
  tableQuery: string
  columns: string[]
  /** 完整结构化 SchemaDTO，供 LLM 消费或后续解析 */
  schema?: SchemaDTO
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
  const resolved = resolveFromStructure(entry?.structure, entry?.tableName)
  if (!resolved) return null
  return {
    datasourceName: dsName,
    tableName: resolved.tableName,
    tableQuery: entry.tableName ?? resolved.tableName,
    columns: resolved.columns,
    schema: resolved.schema
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
  const resolvedEntry = resolveFromStructure(entry?.structure, entry?.tableName)
  if (!resolvedEntry) return null
  return inferSqlFromResolvedSchema({
    datasourceName: tableStructures.datasourceName ?? '',
    tableName: resolvedEntry.tableName,
    tableQuery: entry?.tableName ?? resolvedEntry.tableName,
    columns: resolvedEntry.columns,
    schema: resolvedEntry.schema
  })
}

/** 从 ResolvedSchema 生成 SQL（优先使用已解析字段） */
export function inferSqlFromResolvedSchema(resolved: ResolvedSchema | null | undefined): string | null {
  if (!resolved?.tableName || !isPlausibleTableName(resolved.tableName)) return null
  if (Array.isArray(resolved.columns) && resolved.columns.length > 0) {
    return `SELECT ${resolved.columns.join(', ')} FROM ${resolved.tableName}`
  }
  return `SELECT * FROM ${resolved.tableName}`
}

/**
 * 从 getTableRelations 返回的 SchemaDTO 解析物理表名与字段
 * 优先取 tables[0].name 与 tables[0].column[].name
 */
function resolveFromStructure(
  structure: any,
  fallbackTableName = ''
): { tableName: string; columns: string[]; schema?: SchemaDTO } | null {
  if (!structure || typeof structure !== 'object') return null
  const schema = structure as SchemaDTO
  const firstTable = Array.isArray(schema.table) ? schema.table[0] : null
  const tableName = firstTable?.name || fallbackTableName
  if (!tableName || !isPlausibleTableName(tableName)) return null
  const columns: string[] = []
  if (Array.isArray(firstTable?.column)) {
    for (const c of firstTable.column) {
      if (c?.name && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(String(c.name))) {
        columns.push(String(c.name))
      }
    }
  }
  return { tableName, columns, schema }
}

/**
 * 确定性找/建 buildin 数据源
 * 优先使用 taskParams.datasourceName（planner 已指定的数据源名），仅当未指定时才自动搜索匹配
 * @param runtime - 工作流运行时
 * @param stepId - 节点ID，用于事件关联
 * @param state - 工作流状态
 * @returns 目标数据源名 / 合并后的数据源列表 / 错误列表
 */
export async function resolveBuildinDatasource(
  runtime: any,
  stepId: string,
  state: Record<string, any>
): Promise<{ targetDatasourceName?: string; datasources?: any[]; errors?: string[] }> {
  // 1. 先查当前报表已有的数据源
  const existing: any = await runToolWithEvent(runtime, stepId, 'get_datasources', {})
  const dsList: any[] = Array.isArray(existing) ? existing : (Array.isArray(existing?.datasources) ? existing.datasources : [])

  // 2. 优先使用 planner 已指定的 datasourceName
  const specifiedName = state.taskParams?.datasourceName || state.targetDatasourceName
  if (specifiedName) {
    const found = dsList.find((d: any) => d?.name === specifiedName)
    if (found) {
      console.log(`[resolveBuildinDatasource] 使用已指定的数据源: ${specifiedName}`)
      return { targetDatasourceName: specifiedName, datasources: dsList }
    }
    // 指定了名称但报表中不存在，尝试从 buildin 模板创建
    const sr: any = state.searchResults || {}
    const legalNames: string[] = Array.isArray(sr.load_buildin_datasources?.datasources)
      ? sr.load_buildin_datasources.datasources : []
    if (legalNames.includes(specifiedName)) {
      const template: any = await runToolWithEvent(runtime, stepId, 'get_datasource_template', { name: specifiedName })
      if (template && !template.error && template.type === 'buildin') {
        const addResult: any = await runToolWithEvent(runtime, stepId, 'add_datasource', { datasource: template })
        if (addResult?.success === false) {
          return { errors: [`添加数据源失败: ${addResult.message || '未知错误'}`] }
        }
        const newDs = { name: template.name, type: template.type, datasets: Array.isArray(template.datasets) ? template.datasets : [] }
        const merged = dsList.some((d: any) => d?.name === newDs.name) ? dsList : [...dsList, newDs]
        return { targetDatasourceName: specifiedName, datasources: merged }
      }
    }
    // 非 buildin 类型或模板获取失败，但仍返回指定名称（可能是 jdbc/spring 类型，已由其他方式添加）
    console.log(`[resolveBuildinDatasource] 指定的数据源 ${specifiedName} 不在报表中且非 buildin，仍使用该名称`)
    return { targetDatasourceName: specifiedName, datasources: dsList }
  }

  // 3. 未指定数据源名称时，自动搜索匹配
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
  // 注入报表状态：让 understand_and_plan 等规划类节点感知"是否有打开的报表"，
  // 用于消歧 report_agent / create_report（仅作辅助信息，不影响意图阶段的相关性判定）
  if (state.reportState) {
    parts.push('reportState: 已有打开的报表')
  } else {
    parts.push('reportState: 没有打开的报表（如需新建报表请明确告知）')
  }
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
  // 注入当前任务的参数（dispatcher 传入的 taskParams，子图 LLM 可据此了解任务意图）
  if (state.taskParams && typeof state.taskParams === 'object' && Object.keys(state.taskParams).length > 0) {
    parts.push(`taskParams(当前任务参数): ${JSON.stringify(state.taskParams)}`)
  }
  // 关键决策点：注入 understand_and_plan 阶段确认的任务计划
  if (Array.isArray(state.taskPlan) && state.taskPlan.length > 0) {
    parts.push(`taskPlan(任务计划): ${JSON.stringify(state.taskPlan.map(t => ({ id: t.id, action: t.action, status: t.status })))}`)
  }
  // 关键决策点：注入已问过的 ask_user 问题（避免 planner 重复规划同问题）
  // 注意：ask_user 中断时 state 整体丢失，所以这个字段仅在**单次 workflow run 内**有效
  // 跨 run 的防重靠 useChat 的 enrichedContent + PLANNER_DESCRIPTION【回复识别】规则
  if (Array.isArray(state.askedQuestions) && state.askedQuestions.length > 0) {
    const list = state.askedQuestions.map(a => `  - ${a.taskId}: ${a.question}`).join('\n')
    parts.push(`已问过的问题（不要再问这些）：\n${list}`)
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
 * 统一生成 toolCallId：避免各节点/工具类各自拼接不同格式
 * 格式：{runId_prefix}_{stepId}_{toolName}_{timestamp}_{rand4}
 * - runId_prefix：runtime.runId 前 8 位（跨 run 区分）
 * - stepId：节点ID
 * - toolName：工具名
 * - 后缀：时间戳 + 4 位随机
 *
 * @param stepId - 节点ID，不可为空
 * @param toolName - 工具名，不可为空
 * @param runId - runtime.runId，可选（无则只保 4 段）
 * @returns 工具调用ID
 */
export function buildToolCallId(stepId: string, toolName: string, runId?: string): string {
  const rand = Math.random().toString(36).slice(2, 6)
  const prefix = runId ? `${runId.slice(0, 8)}_` : ''
  return `${prefix}${stepId}_${toolName}_${Date.now()}_${rand}`
}

/**
 * 通用工具调用包装：发"工具调用"事件 → 执行 → 发"工具结果"事件
 * @param runtime - 工作流运行时
 * @param stepId - 节点ID（事件关联用）
 * @param toolName - 工具名
 * @param input - 工具入参
 * @returns 工具返回结果
 */
export async function runToolWithEvent<T>(runtime: any, stepId: string, toolName: string, input: any): Promise<T> {
  const toolCallId = buildToolCallId(stepId, toolName, runtime?.runId)
  runtime?.emitEvent({
    mode: 'updates',
    event: { nodeId: stepId, output: { type: 'tool_call', toolCallId, toolName, input }, status: 'running' },
    timestamp: Date.now()
  })
  try {
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
  } catch (err: any) {
    // 关键决策点：工具执行失败时必须发 tool_result(failed) 事件，否则 UI 卡在"执行中..."
    // 错误信息封装成 { success: false, message } 供上层 nodes 解析
    const errPayload = { success: false, message: err?.message ?? String(err), error: err }
    runtime?.emitEvent({
      mode: 'updates',
      event: {
        nodeId: stepId,
        output: { type: 'tool_result', toolCallId, toolName, result: errPayload, error: errPayload },
        status: 'failed'
      },
      timestamp: Date.now()
    })
    throw err
  }
}
