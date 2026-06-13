/**
 * 数据集工作流共享节点构建器
 * createDatasetGraph 与 modifyDatasetGraph 共用的 9 个节点 + 一键组装管道
 */

import {
  ReportStateGraph,
  LLMDecideNode,
  LastValueAfterFinishChannel,
  defaultRetryOn
} from '../index.ts'
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
import { modifyFormGraph } from './form-page-graphs.ts'

// ==================== 公共 input/output 声明 ====================

/** 公共节点的 graph.input 需求 */
export const sharedInputKeys = { userMessage: true, intent: true, searchResults: true, datasources: true }

/** 公共节点的 graph.output 产出 */
export const sharedOutputKeys = {
  datasetWriteResult: true,
  searchForm: true,
  dataset: true,
  targetDatasourceName: true,
  targetTableNames: true,
  tableStructures: true,
  datasetTemplate: true,
  filterAnalysis: true,
  datasources: true,
  errors: true
}

// ==================== 共享节点构建函数 ====================

/** 1. prepare_schema — 搜索表结构 + 加载 buildin 列表 */
export function addPrepareSchemaNode(graph: ReportStateGraph): string {
  const nodeId = 'prepare_schema'

  const hasPreparedSearch = (state: Record<string, any>) => {
    const sr = state.searchResults || {}
    return !!(sr.search_schema && sr.load_buildin_datasources)
  }

  graph.addNode(nodeId, async (state, runtime) => {
    const stepId = nodeId
    const sr: any = { ...(state.searchResults || {}) }
    const userMsg = String(state.userMessage ?? '')
    const query = inferTableQuery(userMsg, state.intent) || userMsg

    if (!sr.search_schema) {
      sr.search_schema = await runToolWithEvent(runtime, stepId, 'search_schema', { query })
    }
    if (!sr.load_buildin_datasources) {
      sr.load_buildin_datasources = await runToolWithEvent(runtime, stepId, 'load_buildin_datasources', {})
    }
    console.log(`[dataset-shared] ${stepId} 出口`, JSON.stringify({
      reused: hasPreparedSearch(state),
      hasSearchSchema: !!sr.search_schema,
      buildinCount: Array.isArray(sr.load_buildin_datasources?.datasources) ? sr.load_buildin_datasources.datasources.length : 0
    }))
    return { searchResults: sr }
  }, {
    triggers: ['__start__'],
    triggerMode: 'all',
    metadata: { silent: true, description: '准备 search_schema + buildin 列表' }
  })

  return nodeId
}

/** 2. resolve_datasource — 选名 + 反查 + 必要时创建 buildin 数据源 */
export function addResolveDatasourceNode(graph: ReportStateGraph): string {
  const nodeId = 'resolve_datasource'

  graph.addNode(nodeId, async (state, runtime) => {
    const stepId = nodeId
    const result = await resolveBuildinDatasource(runtime, stepId, state)
    console.log(`[dataset-shared] ${stepId} 出口`, JSON.stringify({
      targetDatasourceName: result.targetDatasourceName,
      errors: result.errors
    }))
    if (result.errors?.length) return { errors: result.errors }
    return {
      targetDatasourceName: result.targetDatasourceName,
      datasources: result.datasources
    }
  }, {
    triggers: ['searchResults'],
    triggerMode: 'any',
    metadata: { silent: true, description: '选名 + 反查 + 必要时创建 buildin 数据源' }
  })

  return nodeId
}

/** 3. resolve_table — 取表结构并解析为 ResolvedSchema */
export function addResolveTableNode(graph: ReportStateGraph): string {
  const nodeId = 'resolve_table'

  graph.addNode(nodeId, async (state, runtime) => {
    const stepId = nodeId
    const dsName = state.targetDatasourceName
    const userMsg = String(state.userMessage ?? '')
    if (!dsName) return { errors: ['resolve_table: 缺少 targetDatasourceName'] }

    const sr = (state.searchResults as any)?.search_schema
    let tableQuery = extractTargetTableNames(sr, dsName, userMsg, 1)[0]
    if (!tableQuery) tableQuery = inferTableQuery(userMsg, state.intent)

    console.log(`[dataset-shared] ${stepId} 入口`, JSON.stringify({ dsName, tableQuery }))
    try {
      const structure = await runToolWithEvent(runtime, stepId, 'get_table_relation', {
        datasourceName: dsName,
        query: tableQuery
      })
      const parsed = parseSchemaPromptText(structure, userMsg, tableQuery)
      if (!parsed.tableName) {
        return { errors: [`resolve_table: 无法解析物理表名 (query=${tableQuery})`] }
      }
      const resolved = {
        datasourceName: dsName,
        tableName: parsed.tableName,
        tableQuery,
        columns: parsed.columns,
        schemaPrompt: parsed.schemaPrompt,
        tables: [{ tableName: parsed.tableName, structure }]
      }
      console.log(`[dataset-shared] ${stepId} 出口`, JSON.stringify({
        tableName: parsed.tableName, columnCount: parsed.columns.length
      }))
      return {
        targetTableNames: [parsed.tableName],
        tableStructures: resolved
      }
    } catch (e: any) {
      return { errors: [`resolve_table: get_table_relation 失败 (${tableQuery}): ${e?.message ?? String(e)}`] }
    }
  }, {
    triggers: ['targetDatasourceName'],
    triggerMode: 'any',
    metadata: { silent: true, description: '取表结构并解析为 ResolvedSchema' }
  })

  return nodeId
}

/** 4. fetch_dataset_template — 取 SQL 数据集模板 */
export function addFetchDatasetTemplateNode(graph: ReportStateGraph): string {
  const nodeId = 'fetch_dataset_template'

  graph.addNode(nodeId, async (state, runtime) => {
    const stepId = nodeId
    const template = await runToolWithEvent(runtime, stepId, 'get_dataset_template', {})
    console.log(`[dataset-shared] ${stepId} 出口`, JSON.stringify({
      templateKeys: template && typeof template === 'object' ? Object.keys(template) : null
    }))
    return { datasetTemplate: template }
  }, {
    triggers: ['tableStructures'],
    triggerMode: 'any',
    metadata: { silent: true, description: '取 SQL 数据集模板' }
  })

  return nodeId
}

/** 5. resolve_filter_conditions — LLM 解析筛选条件 */
export function addResolveFilterConditionsNode(graph: ReportStateGraph): string {
  const nodeId = 'resolve_filter_conditions'

  const filterAnalysisOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('filter_analysis_out', filterAnalysisOut)

  graph.addNode(nodeId, new LLMDecideNode({
    nodeId,
    allowedTools: ['parse_filter_conditions'],
    requiredToolResults: ['parse_filter_conditions'],
    maxIterations: 1,
    description:
      '分析用户需求中是否包含筛选/查询条件。\n' +
      '【判断规则】\n' +
      '1. 用户需求明确提到"添加XX作为查询条件"、"按XX筛选"、"根据XX搜索"、"XX作为参数" → 有筛选条件\n' +
      '   → 提取 columnName（必须是表结构中实际存在的列）、paramName、operator、label\n' +
      '2. 以上都没有 → 无筛选需求\n' +
      '   → 立即调用 parse_filter_conditions({conditions:[]})\n' +
      '【约束】columnName 必须来自表结构，禁止编造；立即调用工具，不要调用其他工具。',
    outChannelName: 'filter_analysis_out',
    resultKey: 'filterAnalysis'
  }), {
    triggers: ['datasetTemplate'],
    triggerMode: 'any',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { silent: true, description: '解析筛选条件' }
  })

  return nodeId
}

/**
 * 6. build_dataset — 组装 SQL 数据集对象（含筛选条件和表达式）
 * @param options.preserveName - true 时保留 state.dataset.name（修改模式），false 时从 userMessage 推断（创建模式）
 */
export function addBuildDatasetNode(graph: ReportStateGraph, options?: { preserveName?: boolean }): string {
  const nodeId = 'build_dataset'
  const preserveName = options?.preserveName ?? false

  graph.addNode(nodeId, async (state, runtime) => {
    const stepId = nodeId
    const dsName = state.targetDatasourceName
    const template = state.datasetTemplate as Record<string, any> | null
    const resolved = readResolvedSchema(state.tableStructures)
    if (!dsName) return { errors: ['build_dataset: 缺少 targetDatasourceName'] }
    if (!template) return { errors: ['build_dataset: 缺少 datasetTemplate'] }
    if (!resolved) return { errors: ['build_dataset: 缺少 ResolvedSchema'] }

    let sql = inferSqlFromResolvedSchema(resolved)
    if (!sql) return { errors: ['build_dataset: 无法生成 SQL'] }

    // 读取 LLM 解析出的筛选条件分析结果
    const filterAnalysis = (state as any).filterAnalysis as {
      conditions?: Array<{ columnName: string; paramName: string; operator: string; label: string }>
    } | null
    const conditions = filterAnalysis?.conditions ?? []
    const parameters: any[] = []

    if (conditions.length > 0) {
      // 构建 parameters 数组
      for (const cond of conditions) {
        parameters.push({ name: cond.paramName, type: 'string', defaultValue: '' })
      }

      // 构建 WHERE 子句
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
      sql = `${sql} WHERE ${whereClauses.join(' AND ')}`
    }

    // build_fields 使用不含 WHERE 的基础 SQL（占位符会导致字段解析失败）
    const baseSqlForFields = inferSqlFromResolvedSchema(resolved) ?? sql
    const fieldsResult: any = await runToolWithEvent(runtime, stepId, 'build_fields', {
      sql: baseSqlForFields, type: 'buildin', name: dsName
    })
    if (fieldsResult?.success === false || fieldsResult?.error) {
      return { errors: [`build_fields 失败: ${fieldsResult?.message || fieldsResult?.error}`] }
    }
    const fields = Array.isArray(fieldsResult?.fields) ? fieldsResult.fields : fieldsResult
    if (!Array.isArray(fields) || fields.length === 0) {
      return { errors: ['build_fields 未返回有效 fields'] }
    }

    // 名称策略：修改模式保留原名称，创建模式从 userMessage 推断
    const existingName = preserveName ? (state.dataset as any)?.name : null
    const datasetName = existingName || inferDatasetName(String(state.userMessage ?? ''), template)

    const dataset: Record<string, any> = {
      ...template,
      name: datasetName,
      sql,
      parameters,
      fields
    }
    console.log(`[dataset-shared] ${stepId} 出口`, JSON.stringify({
      datasetName: dataset.name,
      fieldCount: fields.length,
      sqlPreview: sql.slice(0, 100),
      paramCount: parameters.length,
      preserveName
    }))
    return { dataset, fieldsResult: { success: true, fields } }
  }, {
    triggers: ['filterAnalysis'],
    triggerMode: 'any',
    metadata: { silent: true, description: '组装 SQL 数据集对象（含筛选条件）' }
  })

  return nodeId
}

/** 7. validate_dataset — 校验数据集结构 + SQL 预览 */
export function addValidateDatasetNode(graph: ReportStateGraph): string {
  const nodeId = 'validate_dataset'

  graph.addNode(nodeId, async (state, runtime) => {
    const stepId = nodeId
    const dsName = state.targetDatasourceName
    const dataset = state.dataset
    if (!dsName || !dataset) return { errors: ['validate_dataset: 缺少 datasourceName 或 dataset'] }

    const result: any = await runToolWithEvent(runtime, stepId, 'validate_dataset', {
      datasourceName: dsName,
      dataset
    })
    if (!result?.valid) {
      const errs = Array.isArray(result?.errors) ? result.errors : ['validate_dataset 校验未通过']
      return { errors: errs }
    }
    console.log(`[dataset-shared] ${stepId} 出口`, JSON.stringify({ valid: true }))
    return {
      dataset: result.normalized ?? dataset,
      sqlValidationResult: { success: true, data: result }
    }
  }, {
    triggers: ['dataset'],
    triggerMode: 'any',
    metadata: { silent: true, description: '校验数据集结构 + SQL 预览' }
  })

  return nodeId
}

/** 8. confirm_dataset — 反查确认数据集已写入 */
export function addConfirmDatasetNode(graph: ReportStateGraph): string {
  const nodeId = 'confirm_dataset'

  graph.addNode(nodeId, async (state, runtime) => {
    const stepId = nodeId
    const dsName = state.targetDatasourceName
    const datasetName = (state.dataset as any)?.name
    if (!dsName || !datasetName) {
      return { errors: ['confirm_dataset: 缺少 datasourceName 或 datasetName'] }
    }
    const result: any = await runToolWithEvent(runtime, stepId, 'get_datasets', { datasourceName: dsName, datasetName })
    const list: any[] = Array.isArray(result) ? result : (Array.isArray(result?.datasets) ? result.datasets : [])
    const found = list.some((d: any) => d?.name === datasetName)
    console.log(`[dataset-shared] ${stepId} 出口`, JSON.stringify({ dsName, datasetName, found }))
    if (!found) {
      console.warn(`[dataset-shared] ${stepId} 警告: 数据集 ${dsName}/${datasetName} 未在 get_datasets 中找到，可能写入延迟`)
      return { datasets: state.datasets ?? [] }
    }
    return { datasets: list }
  }, {
    triggers: ['datasetWriteResult'],
    triggerMode: 'any',
    metadata: { silent: true, description: '反查确认数据集已写入' }
  })

  return nodeId
}

/** 9. sync_form_subgraph — 同步查询表单子流程（仅在有查询条件时执行） */
export function addSyncFormSubgraphNode(graph: ReportStateGraph): string {
  const nodeId = 'sync_form_subgraph'

  graph.addNode(nodeId, async (state, runtime) => {
    const subGraph = modifyFormGraph()
    const childRuntime = runtime?.fork()
    const result = await subGraph.execute(state, { configurable: { runtime: childRuntime } })
    const childErrors = filterActiveErrors(result.state.errors)
    const output: Record<string, any> = { searchForm: result.state.searchForm }
    if (childErrors.length > 0) output.errors = childErrors
    return output
  }, {
    triggers: ['datasets'],
    triggerMode: 'any',
    skipWhen: (state) => {
      const params = (state.dataset as any)?.parameters
      return !Array.isArray(params) || params.length === 0
    },
    input: { datasets: true, intent: true, userMessage: true, searchResults: true, dataset: true },
    output: { searchForm: true, errors: true },
    metadata: { description: '同步查询表单子流程（仅在有查询条件时执行）' }
  })

  return nodeId
}

// ==================== 公共管道一键组装 ====================

/** 公共节点 ID 常量（供连边使用） */
export const SHARED_NODE_IDS = {
  prepareSchema: 'prepare_schema',
  resolveDatasource: 'resolve_datasource',
  resolveTable: 'resolve_table',
  fetchTemplate: 'fetch_dataset_template',
  resolveFilters: 'resolve_filter_conditions',
  buildDataset: 'build_dataset',
  validateDataset: 'validate_dataset',
  confirmDataset: 'confirm_dataset',
  syncForm: 'sync_form_subgraph'
} as const

/**
 * 一键添加所有公共节点 + 连边
 *
 * @param graph - 图构建器实例
 * @param writeNodeId - 写入节点名称（'add_dataset' 或 'update_dataset'）
 *   该节点必须由调用方在调用本函数之前通过 graph.addNode 添加到图上
 *   本函数会在 validate_dataset → writeNode → confirm_dataset 之间自动连边
 * @param options.preserveName - 是否保留现有数据集名称
 *
 * 完整边序：
 *   prepare_schema → resolve_datasource → resolve_table → fetch_dataset_template
 *   → resolve_filter_conditions → build_dataset → validate_dataset
 *   → {writeNodeId} → confirm_dataset → sync_form_subgraph
 */
export function addSharedDatasetPipeline(
  graph: ReportStateGraph,
  writeNodeId: string,
  options?: { preserveName?: boolean }
): void {
  // 添加所有公共节点
  addPrepareSchemaNode(graph)
  addResolveDatasourceNode(graph)
  addResolveTableNode(graph)
  addFetchDatasetTemplateNode(graph)
  addResolveFilterConditionsNode(graph)
  addBuildDatasetNode(graph, { preserveName: options?.preserveName })
  addValidateDatasetNode(graph)
  addConfirmDatasetNode(graph)
  addSyncFormSubgraphNode(graph)

  // 链式连边：前半段（prepare → validate）
  graph.addEdge('prepare_schema', 'resolve_datasource')
  graph.addEdge('resolve_datasource', 'resolve_table')
  graph.addEdge('resolve_table', 'fetch_dataset_template')
  graph.addEdge('fetch_dataset_template', 'resolve_filter_conditions')
  graph.addEdge('resolve_filter_conditions', 'build_dataset')
  graph.addEdge('build_dataset', 'validate_dataset')
  // 链式连边：写入节点（由调用方提供）
  graph.addEdge('validate_dataset', writeNodeId)
  graph.addEdge(writeNodeId, 'confirm_dataset')
  // 链式连边：后半段（confirm → sync）
  graph.addEdge('confirm_dataset', 'sync_form_subgraph')
}
