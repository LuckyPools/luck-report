/**
 * 数据集相关子工作流
 * - createDatasetGraph：创建数据集
 * - modifyDatasetGraph：修改数据集
 * - deleteDatasetGraph：删除数据集
 */

import {
  ReportStateGraph,
  LLMDecideNode,
  LastValueAfterFinishChannel,
  defaultRetryOn
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { reportStateSchema } from '../state.ts'
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

/**
 * 给 LLM 决策节点加一层"入口/出口"日志包装（modifyDatasetGraph 等仍使用）
 */
function llmNodeWithLog(inner: LLMDecideNode): LLMDecideNode {
  const originalInvoke = inner.invoke.bind(inner)
  Object.defineProperty(inner, 'invoke', {
    configurable: true,
    writable: true,
    value: async (state: Record<string, any>, config: any) => {
      const nodeId = inner.options.nodeId
      const slim = {
        userMessagePreview: typeof state.userMessage === 'string' ? state.userMessage.slice(0, 80) : undefined,
        intent: state.intent,
        targetDatasourceName: state.targetDatasourceName,
        hasTableStructures: !!state.tableStructures,
        hasDatasetTemplate: !!state.datasetTemplate,
        hasDataset: !!state.dataset,
        errors: state.errors
      }
      console.log(`[dataset-graph] ${nodeId} 入口`, JSON.stringify(slim))
      const result = await originalInvoke(state, config)
      const summary: Record<string, any> = { resultKeys: Object.keys(result ?? {}) }
      if (result.errors) summary.errors = result.errors
      if (result.dataset) {
        const ds: any = result.dataset
        summary.dataset = { name: ds.name, fieldCount: Array.isArray(ds.fields) ? ds.fields.length : 0 }
      }
      console.log(`[dataset-graph] ${nodeId} 出口`, JSON.stringify(summary))
      return result
    }
  })
  return inner
}

// ==================== 创建数据集子工作流 ====================

/**
 * 创建数据集工作流（最小重构 — 确定性代码管道 + 筛选条件 LLM 节点）
 *
 * prepare_schema → resolve_datasource → resolve_table → fetch_dataset_template
 * → resolve_filter_conditions → build_dataset → validate_dataset → add_dataset → confirm_dataset → sync_form_subgraph
 */
export function createDatasetGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true, searchResults: true, datasources: true },
    output: {
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
  })

  const hasPreparedSearch = (state: Record<string, any>) => {
    const sr = state.searchResults || {}
    return !!(sr.search_schema && sr.load_buildin_datasources)
  }

  graph.addNode('prepare_schema', async (state, runtime) => {
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
    console.log(`[dataset-graph] ${stepId} 出口`, JSON.stringify({
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

  graph.addNode('resolve_datasource', async (state, runtime) => {
    const stepId = 'resolve_datasource'
    const result = await resolveBuildinDatasource(runtime, stepId, state)
    console.log(`[dataset-graph] ${stepId} 出口`, JSON.stringify({
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

  graph.addNode('resolve_table', async (state, runtime) => {
    const stepId = 'resolve_table'
    const dsName = state.targetDatasourceName
    const userMsg = String(state.userMessage ?? '')
    if (!dsName) return { errors: ['resolve_table: 缺少 targetDatasourceName'] }

    const sr = (state.searchResults as any)?.search_schema
    let tableQuery = extractTargetTableNames(sr, dsName, userMsg, 1)[0]
    if (!tableQuery) tableQuery = inferTableQuery(userMsg, state.intent)

    console.log(`[dataset-graph] ${stepId} 入口`, JSON.stringify({ dsName, tableQuery }))
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
      console.log(`[dataset-graph] ${stepId} 出口`, JSON.stringify({
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

  graph.addNode('fetch_dataset_template', async (state, runtime) => {
    const stepId = 'fetch_dataset_template'
    const template = await runToolWithEvent(runtime, stepId, 'get_dataset_template', {})
    console.log(`[dataset-graph] ${stepId} 出口`, JSON.stringify({
      templateKeys: template && typeof template === 'object' ? Object.keys(template) : null
    }))
    return { datasetTemplate: template }
  }, {
    triggers: ['tableStructures'],
    triggerMode: 'any',
    metadata: { silent: true, description: '取 SQL 数据集模板' }
  })

  // resolve_filter_conditions：LLM 解析用户需求中的筛选条件和表达式需求
  // 始终运行（不 skipWhen），无筛选需求时 LLM 快速返回空条件，避免 build_dataset 触发时序问题
  const filterAnalysisOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('filter_analysis_out', filterAnalysisOut)
  graph.addNode('resolve_filter_conditions', new LLMDecideNode({
    nodeId: 'resolve_filter_conditions',
    allowedTools: ['parse_filter_conditions'],
    requiredToolResults: ['parse_filter_conditions'],
    maxIterations: 1,
    description:
      '分析用户需求中是否包含筛选/查询条件和表达式需求。\n' +
      '【判断规则】\n' +
      '1. 用户需求明确提到"添加XX作为查询条件"、"按XX筛选"、"根据XX搜索"、"XX作为参数" → 有筛选条件\n' +
      '   → 提取 columnName（必须是表结构中实际存在的列）、paramName、operator、label\n' +
      '2. 用户需求提到"不同XX显示不同数据"、"按XX切换"、"条件不同SQL不同" → 需要表达式\n' +
      '   → 设置 needsExpression=true 并描述 expressionDescription\n' +
      '3. 以上都没有 → 无筛选需求\n' +
      '   → 立即调用 parse_filter_conditions({conditions:[], needsExpression:false})\n' +
      '【约束】columnName 必须来自表结构，禁止编造；立即调用工具，不要调用其他工具。',
    outChannelName: 'filter_analysis_out',
    resultKey: 'filterAnalysis'
  }), {
    triggers: ['datasetTemplate'],
    triggerMode: 'any',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { silent: true, description: '解析筛选条件和表达式需求' }
  })

  graph.addNode('build_dataset', async (state, runtime) => {
    const stepId = 'build_dataset'
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
      needsExpression?: boolean
      expressionDescription?: string
    } | null
    const conditions = filterAnalysis?.conditions ?? []
    const needsExpression = filterAnalysis?.needsExpression ?? false
    const parameters: any[] = []
    let sqlExpression: string | null = null

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

      // 构造表达式：不同条件下执行不同 SQL
      if (needsExpression) {
        const condChecks = conditions
          .map(c => `${c.paramName} != null && ${c.paramName} != ''`)
          .join(' && ')
        const baseSql = inferSqlFromResolvedSchema(resolved) ?? sql
        sqlExpression = `\${if (${condChecks}) { return "${sql.replace(/"/g, '\\"')}" } else { return "${baseSql.replace(/"/g, '\\"')}" }}`
      }
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

    const dataset: Record<string, any> = {
      ...template,
      name: inferDatasetName(String(state.userMessage ?? ''), template),
      sql,
      parameters,
      fields
    }
    if (sqlExpression) {
      dataset.sqlExpression = sqlExpression
    }
    console.log(`[dataset-graph] ${stepId} 出口`, JSON.stringify({
      datasetName: dataset.name,
      fieldCount: fields.length,
      sqlPreview: sql.slice(0, 100),
      paramCount: parameters.length,
      hasExpression: !!sqlExpression
    }))
    return { dataset, fieldsResult: { success: true, fields } }
  }, {
    triggers: ['filterAnalysis'],
    triggerMode: 'any',
    metadata: { silent: true, description: '组装 SQL 数据集对象（含筛选条件和表达式）' }
  })

  graph.addNode('validate_dataset', async (state, runtime) => {
    const stepId = 'validate_dataset'
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
    console.log(`[dataset-graph] ${stepId} 出口`, JSON.stringify({ valid: true }))
    return {
      dataset: result.normalized ?? dataset,
      sqlValidationResult: { success: true, data: result }
    }
  }, {
    triggers: ['dataset'],
    triggerMode: 'any',
    metadata: { silent: true, description: '校验数据集结构 + SQL 预览' }
  })

  graph.addNode('add_dataset', async (state, runtime) => {
    const stepId = 'add_dataset'
    const dsName = state.targetDatasourceName
    const dataset = state.dataset
    if (!dsName || !dataset) return { errors: ['add_dataset: 缺少 datasourceName 或 dataset'] }

    const result: any = await runToolWithEvent(runtime, stepId, 'add_dataset', {
      datasourceName: dsName,
      dataset
    })
    if (result?.success === false) {
      return { errors: [`add_dataset 失败: ${result.message || '未知错误'}`] }
    }
    console.log(`[dataset-graph] ${stepId} 出口`, JSON.stringify({ success: true }))
    return { datasetWriteResult: { success: true, message: result?.message, datasetId: result?.datasetId } }
  }, {
    triggers: ['sqlValidationResult'],
    triggerMode: 'any',
    metadata: { silent: true, description: '写入数据集' }
  })

  graph.addNode('confirm_dataset', async (state, runtime) => {
    const stepId = 'confirm_dataset'
    const dsName = state.targetDatasourceName
    const datasetName = (state.dataset as any)?.name
    if (!dsName || !datasetName) {
      return { errors: ['confirm_dataset: 缺少 datasourceName 或 datasetName'] }
    }
    const result: any = await runToolWithEvent(runtime, stepId, 'get_datasets', { datasourceName: dsName, datasetName })
    const list: any[] = Array.isArray(result) ? result : (Array.isArray(result?.datasets) ? result.datasets : [])
    const found = list.some((d: any) => d?.name === datasetName)
    console.log(`[dataset-graph] ${stepId} 出口`, JSON.stringify({ dsName, datasetName, found }))
    if (!found) {
      // 降级为 warning，不阻断下游 sync_form_subgraph（add_dataset 可能已成功但 get_datasets 有延迟）
      console.warn(`[dataset-graph] ${stepId} 警告: 数据集 ${dsName}/${datasetName} 未在 get_datasets 中找到，可能写入延迟`)
      return { datasets: state.datasets ?? [] }
    }
    return { datasets: list }
  }, {
    triggers: ['datasetWriteResult'],
    triggerMode: 'any',
    metadata: { silent: true, description: '反查确认数据集已写入' }
  })

  graph.addNode('sync_form_subgraph', async (state, runtime) => {
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

  graph.addEdge('__start__', 'prepare_schema')
  graph.addEdge('prepare_schema', 'resolve_datasource')
  graph.addEdge('resolve_datasource', 'resolve_table')
  graph.addEdge('resolve_table', 'fetch_dataset_template')
  graph.addEdge('fetch_dataset_template', 'resolve_filter_conditions')
  graph.addEdge('resolve_filter_conditions', 'build_dataset')
  graph.addEdge('build_dataset', 'validate_dataset')
  graph.addEdge('validate_dataset', 'add_dataset')
  graph.addEdge('add_dataset', 'confirm_dataset')
  graph.addEdge('confirm_dataset', 'sync_form_subgraph')
  graph.addEdge('sync_form_subgraph', '__end__')

  return graph.compile()
}

// ==================== 修改数据集子工作流 ====================

/**
 * 修改数据集工作流
 * 关键点：validate_and_rebuild_fields 在"SQL 未变"时跳过
 */
export function modifyDatasetGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true, datasets: true, searchResults: true },
    output: { datasets: true, searchForm: true }
  })

  graph.addNode('confirm_dataset_exists', async (state, runtime) => {
    const datasets = await runtime?.toolRegistry.executeTool('get_datasets', {})
    return { datasets: Array.isArray(datasets) ? datasets : [datasets] }
  }, {
    triggers: ['__start__'],
    triggerMode: 'all',
    metadata: { silent: true, description: '获取现有数据集对象' }
  })

  const modifyOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('modify_dataset_obj_out', modifyOut)
  graph.addNode('modify_dataset_obj', new LLMDecideNode({
    nodeId: 'modify_dataset_obj',
    allowedTools: ['get_table_relation', 'load_bean_methods', 'get_dataset_template'],
    maxIterations: 3,
    description: '基于获取的数据集对象修改字段，可调用 get_table_relation 或 load_bean_methods 辅助',
    outChannelName: 'modify_dataset_obj_out'
  }), {
    triggers: ['datasets'],
    triggerMode: 'all',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '修改数据集内容' }
  })

  const validateOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('validate_and_rebuild_out', validateOut)
  graph.addNode('validate_and_rebuild_fields', new LLMDecideNode({
    nodeId: 'validate_and_rebuild_fields',
    allowedTools: ['preview_data', 'build_fields'],
    requiredToolResults: ['preview_data', 'build_fields'],
    maxIterations: 3,
    description: '若修改了SQL，调用 preview_data 验证，调用 build_fields 重建字段',
    outChannelName: 'validate_and_rebuild_out'
  }), {
    triggers: ['modify_dataset_obj_out'],
    triggerMode: 'any',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    skipWhen: (state) => state.sqlValidationResult?.data?.sqlChanged === false,
    metadata: { description: '校验SQL并重建字段' }
  })

  const updateOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('update_dataset_out', updateOut)
  graph.addNode('update_dataset', new LLMDecideNode({
    nodeId: 'update_dataset',
    allowedTools: ['update_dataset'],
    requiredToolResults: ['update_dataset'],
    maxIterations: 3,
    description: '调用 update_dataset 写入修改',
    outChannelName: 'update_dataset_out'
  }), {
    triggers: ['validate_and_rebuild_out'],
    triggerMode: 'any',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '写入数据集' }
  })

  const syncFormOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('sync_modified_form_out', syncFormOut)
  graph.addNode('sync_modified_form', new LLMDecideNode({
    nodeId: 'sync_modified_form',
    allowedTools: ['get_search_form', 'set_search_form'],
    maxIterations: 3,
    description: '检查查询表单是否已配置对应筛选组件，缺失则补充',
    outChannelName: 'sync_modified_form_out'
  }), {
    triggers: ['update_dataset_out'],
    triggerMode: 'any',
    metadata: { description: '同步查询表单' }
  })

  graph.addEdge('__start__', 'confirm_dataset_exists')
  graph.addEdge('confirm_dataset_exists', 'modify_dataset_obj')
  graph.addConditionalEdges('modify_dataset_obj', (state) => {
    if (!state.sqlValidationResult?.data?.sqlChanged) {
      return 'update_dataset'
    }
    return 'validate_and_rebuild_fields'
  })
  graph.addEdge('validate_and_rebuild_fields', 'update_dataset')
  graph.addEdge('update_dataset', 'sync_modified_form')
  graph.addEdge('sync_modified_form', '__end__')

  return graph.compile()
}

// ==================== 删除数据集子工作流 ====================

export function deleteDatasetGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true },
    output: { datasets: true }
  })

  graph.addNode('confirm_dataset_exists', async (state, runtime) => {
    const datasets = await runtime?.toolRegistry.executeTool('get_datasets', {})
    return { datasets }
  }, {
    triggers: ['__start__'],
    triggerMode: 'all',
    metadata: { silent: true, description: '确认目标数据集存在' }
  })

  graph.addNode('delete_dataset_obj', async (state, runtime) => {
    const result = await runtime?.toolRegistry.executeTool('remove_dataset', {})
    return { datasets: result }
  }, {
    triggers: ['datasets'],
    triggerMode: 'all',
    metadata: { description: '删除数据集' }
  })

  graph.addEdge('__start__', 'confirm_dataset_exists')
  graph.addEdge('confirm_dataset_exists', 'delete_dataset_obj')
  graph.addEdge('delete_dataset_obj', '__end__')

  return graph.compile()
}
