import type { ToolDefinition } from './types'
import { executeCode } from '@/views/export/iframe-utils'
import {DatasetSchema, getSqlDatasetTemplate, validateDataset} from './schema/index'

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
    return executeCode(`addDataset({datasourceName:'${datasourceName}',dataset:${JSON.stringify(dataset)}})`)
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
    return executeCode(`updateDataset({datasourceName:'${datasourceName}',datasetName:'${datasetName}',dataset:${JSON.stringify(dataset)}})`)
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

