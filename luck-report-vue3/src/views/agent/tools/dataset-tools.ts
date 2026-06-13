import type { ToolDefinition } from './types'
import { executeCode } from '@/views/export/iframe-utils'
import {DatasetSchema, getSqlDatasetTemplate, normalizeDataset, validateDataset} from './schema/index'

/**
 * 获取数据集工具
 */
export const getDatasetsTool: ToolDefinition<{
  datasourceName?: string;
  datasetName?: string;
}> = {
  name: 'get_datasets',
  description: '获取数据集数据。不传参数返回所有数据集；传datasourceName返回该数据源下的数据集；同时传datasourceName和datasetName返回指定数据集。',
  inputSchema: {
    type: 'object',
    properties: {
      datasourceName: { type: 'string', description: '数据源名称' },
      datasetName: { type: 'string', description: '数据集名称，需配合datasourceName使用' }
    },
    required: []
  },
  execute: async ({ datasourceName, datasetName }) => {
    const args: string[] = []
    if (datasourceName !== undefined) {
      args.push(`datasourceName:'${datasourceName}'`)
    }
    if (datasetName !== undefined) {
      args.push(`datasetName:'${datasetName}'`)
    }
    return executeCode(`getDatasets({${args.join(',')}})`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 添加数据集工具
 */
export const addDatasetTool: ToolDefinition<{
  datasourceName: string;
  dataset: any;
}> = {
  name: 'add_dataset',
  description: `向指定数据源下添加一个新的数据集。返回 { success, message } 结构。
【数据规范】dataset 必须包含 name/sql/fields，fields 必须通过 build_fields 工具生成。。`,
  inputSchema: {
    type: 'object',
    properties: {
      datasourceName: { type: 'string', description: '目标数据源名称' },
      dataset: DatasetSchema
    },
    required: ['datasourceName', 'dataset']
  },
  execute: async ({ datasourceName, dataset }) => {
    // 关键决策点：写入前用 normalizeDataset 补齐 LLM 容易遗漏的字段（parameters/fields），避免写入失败
    const normalized = normalizeDataset(dataset)
    return executeCode(`addDataset({datasourceName:'${datasourceName}',dataset:${JSON.stringify(normalized)}})`)
  },
  readOnly: false,
  requireConfirm: false,
  validate: ({ dataset }) => validateDataset(dataset)
}

/**
 * 更新数据集工具
 */
export const updateDatasetTool: ToolDefinition<{
  datasourceName: string;
  datasetName: string;
  dataset: any;
}> = {
  name: 'update_dataset',
  description: `按数据源名称和数据集名称匹配更新数据集定义。会完全替换该数据集。返回 { success, message } 结构。
【数据规范】dataset 必须包含 name/sql/fields，fields 必须通过 build_fields 工具生成。`,
  inputSchema: {
    type: 'object',
    properties: {
      datasourceName: { type: 'string', description: '目标数据源名称' },
      datasetName: { type: 'string', description: '目标数据集名称' },
      dataset: DatasetSchema
    },
    required: ['datasourceName', 'datasetName', 'dataset']
  },
  execute: async ({ datasourceName, datasetName, dataset }) => {
    // 关键决策点：写入前用 normalizeDataset 补齐字段，与 add_dataset 保持一致
    const normalized = normalizeDataset(dataset)
    return executeCode(`updateDataset({datasourceName:'${datasourceName}',datasetName:'${datasetName}',dataset:${JSON.stringify(normalized)}})`)
  },
  readOnly: false,
  requireConfirm: false,
  validate: ({ dataset }) => validateDataset(dataset)
}

/**
 * 删除数据集工具
 */
export const removeDatasetTool: ToolDefinition<{
  datasourceName: string;
  datasetName: string;
}> = {
  name: 'remove_dataset',
  description: `按数据源名称和数据集名称删除数据集。此操作不可撤销，请谨慎使用。返回 { success: true/false, message: '...' } 结构，success=true 表示成功，message 包含详细信息。`,
  inputSchema: {
    type: 'object',
    properties: {
      datasourceName: { type: 'string', description: '目标数据源名称' },
      datasetName: { type: 'string', description: '要删除的数据集名称' }
    },
    required: ['datasourceName', 'datasetName']
  },
  execute: async ({ datasourceName, datasetName }) => {
    return executeCode(`removeDataset({datasourceName:'${datasourceName}',datasetName:'${datasetName}'})`)
  },
  readOnly: false,
  requireConfirm: true
}

/**
 * 数据集预览数据工具
 */
export const previewDataTool: ToolDefinition<{
  sql: string;
  type: string;
  parameters?: any[];
  username?: string;
  password?: string;
  driver?: string;
  url?: string;
  name?: string;
}> = {
  name: 'preview_data',
  description: '验证数据集SQL是否可正确执行。修改或添加数据集前验证数据集是否合法，根据SQL和数据源类型执行预览查询，仅返回执行结果（1表示成功，0表示失败）。type为jdbc时需提供username/password/driver/url，type为buildin时需提供name。',
  inputSchema: {
    type: 'object',
    properties: {
      sql: { type: 'string', description: 'SQL语句' },
      type: { type: 'string', description: '数据源类型：jdbc 或 buildin' },
      parameters: { type: 'array', description: 'SQL参数列表' },
      username: { type: 'string', description: 'JDBC用户名（type=jdbc时）' },
      password: { type: 'string', description: 'JDBC密码（type=jdbc时）' },
      driver: { type: 'string', description: 'JDBC驱动类名（type=jdbc时）' },
      url: { type: 'string', description: 'JDBC连接URL（type=jdbc时）' },
      name: { type: 'string', description: '内置数据源名称（type=buildin时）' }
    },
    required: ['sql', 'type']
  },
  execute: async ({ sql, type, parameters, username, password, driver, url, name }) => {
    const args: string[] = [`sql:'${sql.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`, `type:'${type}'`]
    if (parameters) args.push(`parameters:${JSON.stringify(parameters)}`)
    if (username) args.push(`username:'${username}'`)
    if (password) args.push(`password:'${password}'`)
    if (driver) args.push(`driver:'${driver}'`)
    if (url) args.push(`url:'${url}'`)
    if (name) args.push(`name:'${name}'`)
    return executeCode(`previewData({${args.join(',')}})`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 构建数据集字段工具
 */
export const buildFieldsTool: ToolDefinition<{
  sql: string;
  type: string;
  parameters?: any[];
  username?: string;
  password?: string;
  driver?: string;
  url?: string;
  name?: string;
}> = {
  name: 'build_fields',
  description: '根据SQL和数据源信息构建数据集字段列表。返回字段名和类型信息，用于配置数据集时自动解析字段。type为jdbc时需提供username/password/driver/url，type为buildin时需提供name。',
  inputSchema: {
    type: 'object',
    properties: {
      sql: { type: 'string', description: 'SQL语句' },
      type: { type: 'string', description: '数据源类型：jdbc 或 buildin' },
      parameters: { type: 'array', description: 'SQL参数列表' },
      username: { type: 'string', description: 'JDBC用户名（type=jdbc时）' },
      password: { type: 'string', description: 'JDBC密码（type=jdbc时）' },
      driver: { type: 'string', description: 'JDBC驱动类名（type=jdbc时）' },
      url: { type: 'string', description: 'JDBC连接URL（type=jdbc时）' },
      name: { type: 'string', description: '内置数据源名称（type=buildin时）' }
    },
    required: ['sql', 'type']
  },
  execute: async ({ sql, type, parameters, username, password, driver, url, name }) => {
    const args: string[] = [`sql:'${sql.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`, `type:'${type}'`]
    if (parameters) args.push(`parameters:${JSON.stringify(parameters)}`)
    if (username) args.push(`username:'${username}'`)
    if (password) args.push(`password:'${password}'`)
    if (driver) args.push(`driver:'${driver}'`)
    if (url) args.push(`url:'${url}'`)
    if (name) args.push(`name:'${name}'`)
    return executeCode(`buildFields({${args.join(',')}})`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 获取数据集模板工具
 */
export const getDatasetTemplateTool: ToolDefinition<{
  name?: string;
  sql?: string;
}> = {
  name: 'get_dataset_template',
  description: `获取符合规范的SQL数据集模板。返回完整的数据集定义模板，包含所有必填字段。
【参数】name: 数据集名称（可选）；sql: SQL语句（可选）。
【重要】fields 必须通过 build_fields 工具生成，禁止自行编造；dataset 参数必须是JSON对象。`,
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '数据集名称（可选）' },
      sql: { type: 'string', description: 'SQL语句（可选）' }
    },
    required: []
  },
  execute: async ({ name, sql }) => {
    return getSqlDatasetTemplate(name, sql)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 校验数据集工具：结构校验（validateDataset）+ SQL 预览（preview_data 联动）
 * 返回 { valid: boolean, errors: string[], normalized: object, preview: any } 结构
 */
export const validateDatasetTool: ToolDefinition<{
  datasourceName: string;
  dataset: any;
}> = {
  name: 'validate_dataset',
  description: `校验数据集对象是否合法，串联"结构校验 + SQL 预览"两步。
【必传】datasourceName: 目标 buildin 数据源名称；dataset: 待校验的数据集对象。
【返回】{ valid, errors, normalized, preview }：valid=true 表示通过；errors 为错误信息列表；normalized 为 normalizeDataset 规范化后的对象；preview 为 preview_data 工具的执行结果。
【强制】add_dataset 前必须调用本工具；preview_data 的 name 参数使用 datasourceName。`,
  inputSchema: {
    type: 'object',
    properties: {
      datasourceName: { type: 'string', description: '目标 buildin 数据源名称' },
      dataset: DatasetSchema
    },
    required: ['datasourceName', 'dataset']
  },
  execute: async ({ datasourceName, dataset }) => {
    // 步骤1：规范化数据集
    const normalized = normalizeDataset(dataset)
    // 步骤2：结构校验
    const structureError = validateDataset(normalized)
    const structureErrors: string[] = structureError ? structureError.split('\n').filter(Boolean) : []
    // 步骤3：SQL 预览（结构校验通过后再调，避免无效预览）
    let preview: any = null
    let previewError: string | null = null
    if (structureErrors.length === 0 && normalized.sql) {
      const args: string[] = [
        `sql:'${String(normalized.sql).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`,
        `type:'buildin'`,
        `name:'${datasourceName}'`
      ]
      if (Array.isArray(normalized.parameters) && normalized.parameters.length > 0) {
        args.push(`parameters:${JSON.stringify(normalized.parameters)}`)
      }
      try {
        preview = await executeCode(`previewData({${args.join(',')}})`)
      } catch (e: any) {
        previewError = e?.message ?? String(e)
      }
    }
    // 步骤4：汇总
    const allErrors: string[] = [...structureErrors]
    if (previewError) allErrors.push(`preview_data 执行异常: ${previewError}`)
    if (preview && preview.success === false) {
      allErrors.push(`preview_data 校验失败: ${preview.message || JSON.stringify(preview)}`)
    }
    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      normalized,
      preview
    }
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 解析筛选条件工具：LLM 将用户需求中的筛选/查询条件解析为结构化对象，透传返回
 * 供 resolve_filter_conditions LLM 节点调用，输出供 build_dataset 节点注入 SQL WHERE 子句和 parameters
 */
export const parseFilterConditionsTool: ToolDefinition<{
  conditions: Array<{
    columnName: string
    paramName: string
    operator: string
    label: string
  }>
}> = {
  name: 'parse_filter_conditions',
  description: `解析用户需求中的筛选/查询条件，输出结构化的条件列表。
【使用场景】当用户需求包含"添加XX作为查询条件"、"按XX筛选"、"根据XX搜索"等语义时调用。
【conditions】筛选条件数组：
  - columnName：数据库列名，必须来自表结构中实际存在的列
  - paramName：数据集参数名（用于 SQL 占位符 :paramName 和 parameters 数组），建议与 columnName 一致
  - operator：SQL 操作符，可选 LIKE / = / >= / <= / IN / BETWEEN，字符串模糊匹配用 LIKE
  - label：中文标签，用于查询表单的显示名称`,
  inputSchema: {
    type: 'object',
    properties: {
      conditions: {
        type: 'array',
        description: '筛选条件列表',
        items: {
          type: 'object',
          properties: {
            columnName: { type: 'string', description: '数据库列名，必须是表结构中实际存在的列' },
            paramName: { type: 'string', description: '数据集参数名，建议与 columnName 一致' },
            operator: { type: 'string', enum: ['LIKE', '=', '>=', '<=', 'IN', 'BETWEEN'], description: 'SQL 操作符' },
            label: { type: 'string', description: '中文标签，用于查询表单显示' }
          },
          required: ['columnName', 'paramName', 'operator', 'label']
        }
      }
    },
    required: ['conditions']
  },
  execute: async (input) => {
    // 透传：LLM 的结构化输出直接作为工具返回值，供节点写入 state
    return {
      conditions: Array.isArray(input.conditions) ? input.conditions : []
    }
  },
  readOnly: true,
  requireConfirm: false
}

