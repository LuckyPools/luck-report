/**
 * 数据集工作流共享节点构造器
 * 供 createDatasetGraph / modifyDatasetGraph 复用
 *
 * 与自建引擎版本的差异：
 * 1. 不再 new LastValueAfterFinishChannel
 * 2. 节点函数返回 Partial<State>，由 LangGraph reducer 合并
 */

import { withInput } from '../index.ts'
import { createLLMDecideNode } from '@/service/agent/workflow/nodes/llm-decide-node.ts'
import {
  extractTargetTableNames,
  filterActiveErrors,
  inferTableQuery,
  resolveBuildinDatasource,
  runToolWithEvent
} from '../utils.ts'
import type { SchemaDTO, TableDTO } from '@/api/datasource'
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
    // 优先用 originalUserMessage（不含 ask_user enriched 前缀）推断表名，避免 enriched 内容干扰
    // 不传 intent 给 inferTableQuery：ask_user 回复轮 intent.taskDescription 会偏离原始需求
    // （如变成"配置报表数据源为 xxx"而非"用户信息"），导致推断不出物理表名
    const userMsg = String(state.originalUserMessage ?? state.userMessage ?? '')
    if (!dsName) return { errors: ['resolve_table: 缺少 targetDatasourceName'] } as ReportStateUpdate

    const sr = (state.searchResults as any)?.search_schema
    let tableQuery = extractTargetTableNames(sr, dsName, userMsg, 1)[0]
    if (!tableQuery) tableQuery = inferTableQuery(userMsg)

    try {
      const structure: SchemaDTO = await runToolWithEvent(runtime, stepId, 'get_table_relation', {
        datasourceName: dsName,
        query: tableQuery
      })
      const firstTable: TableDTO | undefined = structure?.table?.[0]
      const tableName = firstTable?.name
      if (!tableName) {
        return { errors: [`resolve_table: 无法解析物理表名 (query=${tableQuery})`] } as ReportStateUpdate
      }
      const columns: string[] = Array.isArray(firstTable?.column)
        ? firstTable!.column
            .map((c) => c?.name)
            .filter((n): n is string => typeof n === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(n))
        : []
      const resolved = {
        datasourceName: dsName,
        tableName,
        tableQuery,
        columns,
        schema: structure,
        tables: [{ tableName, structure }]
      }
      return {
        targetTableNames: [tableName],
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
      '【约束】columnName 必须来自表结构，禁止编造；立即调用 parse_filter_conditions。'
  })
}

/** 6. build_dataset — LLM 驱动的 dataset 组装（可调用 load_report_doc 查文档） */
export function buildBuildDatasetNode(options?: { preserveName?: boolean }) {
  const preserveName = options?.preserveName ?? false
  const stepId = 'build_dataset'
  // LLM Decider 节点：让 LLM 组装 dataset，可调用 load_report_doc 查文档、commit_dataset 提交
  const llmNode = createLLMDecideNode({
    nodeId: stepId,
    allowedTools: ['load_report_doc', 'commit_dataset'],
    requiredToolResults: ['commit_dataset'],
    maxIterations: 4,
    resultKey: 'dataset',
    resultKeyAsObject: true,
    description:
      '本步骤负责组装数据集对象。state 中已包含 targetDatasourceName、tableStructures（已解析的表结构）、datasetTemplate、filterAnalysis 等上下文。\n' +
      '【必须做】\n' +
      '1. 基于 tableStructures 中的 tableName/columns 生成 baseSql（SELECT columns FROM tableName 形式）\n' +
      '2. 若 filterAnalysis.conditions 非空，根据 operator 拼出 WHERE 子句，并构造 parameters 数组\n' +
      '3. **必须**调用 commit_dataset 工具提交最终 dataset 对象，dataset 至少包含：name（preserveName=true 时用 state.dataset.name）、sql、fields（数组，可从 tableStructures.columns 映射得到 [{name,type,label}]）、parameters\n' +
      '【命名约束】dataset.name 必须使用英文名称（只允许英文/数字/下划线，且以英文开头），如 user_order、product_list，禁止使用中文名称！可基于 tableName 或用户需求语义推导英文名。\n' +
      '【可选】如对字段格式/数据集规范不确定，可调 load_report_doc 查询 DATASOURCE_DATASET 文档。\n' +
      '写入由后续 validate_dataset → write_dataset 节点完成。\n' +
      '【保留原名】preserveName=true 时，dataset.name 必须使用 state.dataset 已有的 name。'
  })
  return withInput(async (state: ReportState, _config, runtime) => {
    // guard：上游节点未完成时直接报错
    console.log(`[build_dataset] 进入节点, targetDatasourceName=${state.targetDatasourceName}, hasTemplate=${!!state.datasetTemplate}, hasTableStructures=${!!state.tableStructures}`)
    if (!state.targetDatasourceName) return { errors: ['build_dataset: 缺少 targetDatasourceName'] } as ReportStateUpdate
    if (!state.datasetTemplate) return { errors: ['build_dataset: 缺少 datasetTemplate'] } as ReportStateUpdate
    if (!state.tableStructures) return { errors: ['build_dataset: 缺少 tableStructures'] } as ReportStateUpdate
    // 透传 preserveName 信息到 LLM（通过 state.taskParams 已经走通了；此处仅做 early-return 守卫）
    void preserveName

    // llmNode 自身已 withInput 包装，传 (state, config) 即可，runtime 由其内部从 config.context 重建
    void runtime
    const result: any = await (llmNode as any)(state, _config as any)
    // LLM Decider 返回 { dataset: { commit_dataset: {...}, load_report_doc?: {...} } }
    const commitResult = result?.dataset?.commit_dataset
    if (!commitResult || !commitResult.dataset) {
      return { errors: ['build_dataset: LLM 未通过 commit_dataset 工具提交数据集'] } as ReportStateUpdate
    }
    const dataset = commitResult.dataset
    return {
      dataset,
      fieldsResult: { success: true, fields: dataset.fields ?? [] }
    } as ReportStateUpdate
  }, { nodeName: stepId })
}

/** 7. validate_dataset — 校验数据集结构 + SQL 预览 + 重名校验 */
export function buildValidateDatasetNode() {
  return withInput(async (state: ReportState, _config, runtime) => {
    const stepId = 'validate_dataset'
    console.log(`[validate_dataset] 进入节点, dsName=${state.targetDatasourceName}, hasDataset=${!!state.dataset}`)
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

    // 重名校验：create 模式必须检查；modify 模式仅在名称改变时检查
    const newName = (result.normalized ?? dataset)?.name as string | undefined
    const oldName = state.intent?.targetDatasetName || state.intent?.datasetName
    if (newName) {
      // 判断是否需要检查重名：create 模式（无 oldName）或名称改变
      const needCheckDuplicate = !oldName || newName !== oldName
      if (needCheckDuplicate) {
        const existingDatasets = state.datasets || []
        const duplicate = existingDatasets.find((d: any) => d?.name === newName)
        if (duplicate) {
          return { errors: [`数据集名称 "${newName}" 已存在，请使用其他名称`] } as ReportStateUpdate
        }
      }
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
    console.log(`[confirm_dataset] 进入节点, dsName=${dsName}, datasetName=${datasetName}`)
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
