/**
 * 数据集工作流共享节点构造器
 * 供 createDatasetGraph / modifyDatasetGraph 复用
 *
 * 与自建引擎版本的差异：
 * 1. 不再 new LastValueAfterFinishChannel
 * 2. 节点函数返回 Partial<State>，由 LangGraph reducer 合并
 */

import { withInput, runtimeToContext } from '../index.ts'
import { createLLMDecideNode } from '@/views/agent/workflow/nodes/llm-decide-node.ts'
import {
  extractTargetTableNames,
  filterActiveErrors,
  inferDatasetName,
  inferSqlFromResolvedSchema,
  inferTableQuery,
  parseSchemaPromptText,
  readResolvedSchema,
  resolveBuildinDatasource,
  runToolWithEvent
} from '../utils.ts'
import type { CompiledReportGraph } from '../index.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'

/** 1. prepare_schema — 搜索表结构 + 加载 buildin 列表 */
export function buildPrepareSchemaNode() {
  return withInput(async (state: ReportState, _config, runtime) => {
    const stepId = 'prepare_schema'
    const sr: any = { ...(state.searchResults || {}) }
    const userMsg = String(state.userMessage ?? '')
    const query = inferTableQuery(userMsg, state.intent) || userMsg

    if (!sr.search_schema) {
      sr.search_schema = await runToolWithEvent(runtime, stepId, 'search_schema', { query })
    }
    if (!sr.load_buildin_datasources) {
      sr.load_buildin_datasources = await runToolWithEvent(runtime, stepId, 'load_buildin_datasources', {})
    }
    return { searchResults: sr } as ReportStateUpdate
  }, { nodeName: 'prepare_schema' })
}

/** 2. resolve_datasource — 选名 + 反查 + 必要时创建 buildin 数据源 */
export function buildResolveDatasourceNode() {
  return withInput(async (state: ReportState, _config, runtime) => {
    const stepId = 'resolve_datasource'
    const result = await resolveBuildinDatasource(runtime, stepId, state)
    if (result.errors?.length) return { errors: result.errors } as ReportStateUpdate
    return {
      targetDatasourceName: result.targetDatasourceName,
      datasources: result.datasources
    } as ReportStateUpdate
  }, { nodeName: 'resolve_datasource' })
}

/** 3. resolve_table — 取表结构并解析为 ResolvedSchema */
export function buildResolveTableNode() {
  return withInput(async (state: ReportState, _config, runtime) => {
    const stepId = 'resolve_table'
    const dsName = state.targetDatasourceName
    const userMsg = String(state.userMessage ?? '')
    if (!dsName) return { errors: ['resolve_table: 缺少 targetDatasourceName'] } as ReportStateUpdate

    const sr = (state.searchResults as any)?.search_schema
    let tableQuery = extractTargetTableNames(sr, dsName, userMsg, 1)[0]
    if (!tableQuery) tableQuery = inferTableQuery(userMsg, state.intent)

    try {
      const structure = await runToolWithEvent(runtime, stepId, 'get_table_relation', {
        datasourceName: dsName,
        query: tableQuery
      })
      const parsed = parseSchemaPromptText(structure, userMsg, tableQuery)
      if (!parsed.tableName) {
        return { errors: [`resolve_table: 无法解析物理表名 (query=${tableQuery})`] } as ReportStateUpdate
      }
      const resolved = {
        datasourceName: dsName,
        tableName: parsed.tableName,
        tableQuery,
        columns: parsed.columns,
        schemaPrompt: parsed.schemaPrompt,
        tables: [{ tableName: parsed.tableName, structure }]
      }
      return {
        targetTableNames: [parsed.tableName],
        tableStructures: resolved
      } as ReportStateUpdate
    } catch (e: any) {
      return { errors: [`resolve_table: get_table_relation 失败 (${tableQuery}): ${e?.message ?? String(e)}`] } as ReportStateUpdate
    }
  }, { nodeName: 'resolve_table' })
}

/** 4. fetch_dataset_template — 取 SQL 数据集模板 */
export function buildFetchDatasetTemplateNode() {
  return withInput(async (state: ReportState, _config, runtime) => {
    const stepId = 'fetch_dataset_template'
    const template = await runToolWithEvent(runtime, stepId, 'get_dataset_template', {})
    return { datasetTemplate: template } as ReportStateUpdate
  }, { nodeName: 'fetch_dataset_template' })
}

/** 5. resolve_filter_conditions — LLM 解析筛选条件 */
export function buildResolveFilterConditionsNode() {
  return createLLMDecideNode({
    nodeId: 'resolve_filter_conditions',
    allowedTools: ['parse_filter_conditions'],
    requiredToolResults: ['parse_filter_conditions'],
    maxIterations: 1,
    resultKey: 'filterAnalysis',
    description:
      '分析用户需求中是否包含筛选/查询条件。\n' +
      '【判断规则】\n' +
      '1. 用户需求明确提到"添加XX作为查询条件"、"按XX筛选"、"根据XX搜索"、"XX作为参数" → 有筛选条件\n' +
      '   → 提取 columnName（必须是表结构中实际存在的列）、paramName、operator、label\n' +
      '2. 以上都没有 → 无筛选需求\n' +
      '   → 立即调用 parse_filter_conditions({conditions:[]})\n' +
      '【约束】columnName 必须来自表结构，禁止编造；立即调用工具，不要调用其他工具。'
  })
}

/** 6. build_dataset — 组装 SQL 数据集对象 */
export function buildBuildDatasetNode(options?: { preserveName?: boolean }) {
  const preserveName = options?.preserveName ?? false
  return withInput(async (state: ReportState, _config, runtime) => {
    const stepId = 'build_dataset'
    const dsName = state.targetDatasourceName
    const template = state.datasetTemplate as Record<string, any> | null
    const resolved = readResolvedSchema(state.tableStructures)
    if (!dsName) return { errors: ['build_dataset: 缺少 targetDatasourceName'] } as ReportStateUpdate
    if (!template) return { errors: ['build_dataset: 缺少 datasetTemplate'] } as ReportStateUpdate
    if (!resolved) return { errors: ['build_dataset: 缺少 ResolvedSchema'] } as ReportStateUpdate

    const baseSql = inferSqlFromResolvedSchema(resolved)
    if (!baseSql) return { errors: ['build_dataset: 无法生成 SQL'] } as ReportStateUpdate

    let sql = baseSql
    const filterAnalysis = (state as any).filterAnalysis as {
      conditions?: Array<{ columnName: string; paramName: string; operator: string; label: string }>
    } | null
    const conditions = filterAnalysis?.conditions ?? []
    const parameters: any[] = []

    if (conditions.length > 0) {
      for (const cond of conditions) {
        parameters.push({ name: cond.paramName, type: 'string', defaultValue: '' })
      }
      const whereClauses = conditions.map(cond => {
        const col = cond.columnName
        const param = `:${cond.paramName}`
        switch (cond.operator) {
          case 'LIKE':
            return `${col} LIKE CONCAT('%', ${param}, '%')`
          case '>=':
          case '<=':
          case '=':
            return `${col} ${cond.operator} ${param}`
          case 'IN':
            return `${col} IN (${param})`
          case 'BETWEEN':
            return `${col} BETWEEN ${param}`
          default:
            return `${col} LIKE CONCAT('%', ${param}, '%')`
        }
      })
      sql = `${baseSql} WHERE ${whereClauses.join(' AND ')}`
    }

    // build_fields 使用不含 WHERE 的基础 SQL（占位符会导致字段解析失败）
    const fieldsResult: any = await runToolWithEvent(runtime, stepId, 'build_fields', {
      sql: baseSql, type: 'buildin', name: dsName
    })
    if (fieldsResult?.success === false || fieldsResult?.error) {
      return { errors: [`build_fields 失败: ${fieldsResult?.message || fieldsResult?.error}`] } as ReportStateUpdate
    }
    const fields = Array.isArray(fieldsResult?.fields) ? fieldsResult.fields : fieldsResult
    if (!Array.isArray(fields) || fields.length === 0) {
      return { errors: ['build_fields 未返回有效 fields'] } as ReportStateUpdate
    }

    const existingName = preserveName ? (state.dataset as any)?.name : null
    const datasetName = existingName || inferDatasetName(String(state.userMessage ?? ''), template)

    const dataset: Record<string, any> = {
      ...template,
      name: datasetName,
      sql,
      parameters,
      fields
    }
    return { dataset, fieldsResult: { success: true, fields } } as ReportStateUpdate
  }, { nodeName: 'build_dataset' })
}

/** 7. validate_dataset — 校验数据集结构 + SQL 预览 */
export function buildValidateDatasetNode() {
  return withInput(async (state: ReportState, _config, runtime) => {
    const stepId = 'validate_dataset'
    const dsName = state.targetDatasourceName
    const dataset = state.dataset
    if (!dsName || !dataset) return { errors: ['validate_dataset: 缺少 datasourceName 或 dataset'] } as ReportStateUpdate

    const result: any = await runToolWithEvent(runtime, stepId, 'validate_dataset', {
      datasourceName: dsName,
      dataset
    })
    if (!result?.valid) {
      const errs = Array.isArray(result?.errors) ? result.errors : ['validate_dataset 校验未通过']
      return { errors: errs } as ReportStateUpdate
    }
    return {
      dataset: result.normalized ?? dataset,
      sqlValidationResult: { success: true, data: result }
    } as ReportStateUpdate
  }, { nodeName: 'validate_dataset' })
}

/** 8. confirm_dataset — 反查确认数据集已写入 */
export function buildConfirmDatasetNode() {
  return withInput(async (state: ReportState, _config, runtime) => {
    const stepId = 'confirm_dataset'
    const dsName = state.targetDatasourceName
    const datasetName = (state.dataset as any)?.name
    if (!dsName || !datasetName) {
      return { errors: ['confirm_dataset: 缺少 datasourceName 或 datasetName'] } as ReportStateUpdate
    }
    const result: any = await runToolWithEvent(runtime, stepId, 'get_datasets', { datasourceName: dsName, datasetName })
    const list: any[] = Array.isArray(result) ? result : (Array.isArray(result?.datasets) ? result.datasets : [])
    const found = list.some((d: any) => d?.name === datasetName)
    if (!found) {
      return { datasets: state.datasets ?? [] } as ReportStateUpdate
    }
    return { datasets: list } as ReportStateUpdate
  }, { nodeName: 'confirm_dataset' })
}

/** 9. sync_form_subgraph — 同步查询表单子流程（仅在有查询条件时执行） */
export function buildSyncFormSubgraphNode(formGraphFactory: () => CompiledReportGraph) {
  return withInput(async (state: ReportState, _config, runtime) => {
    // 跨子图执行：通过工厂新建子图并 execute
    const subGraph = formGraphFactory()
    const childRuntime = runtime?.fork?.()
    const result = await subGraph.invoke(state as Record<string, any>, {
      context: runtimeToContext(childRuntime ?? runtime)
    })
    const childErrors = filterActiveErrors((result as any).errors)
    const output: Record<string, any> = { searchForm: (result as any).searchForm }
    if (childErrors.length > 0) output.errors = childErrors
    return output as ReportStateUpdate
  }, { nodeName: 'sync_form_subgraph' })
}
