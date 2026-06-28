import type { ToolDefinition } from './types'
import {
  getDatasources,
  setDatasources,
  addDatasource,
  updateDatasource,
  removeDatasource
} from '@/utils/contextActions'
import {
  loadBuildinDatasources,
  testConnection,
  loadBeanMethods
} from '@/utils/tools'
import { getSchemaPrompt, getBuildinDatasources, searchSchema } from '@/api/datasource'
import {DatasourceSchema, getBuildinDatasourceTemplate, validateDatasource, normalizeDatasource} from './schema'

/**
 * 获取数据源列表工具
 */
export const getDatasourcesTool: ToolDefinition<{
  name?: string;
}> = {
  name: 'get_datasources',
  description: '获取设计器已添加的数据源数据。不传name返回全部数据源列表，传入name返回指定名称的数据源对象。',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '数据源名称，不传则返回全部' }
    },
    required: []
  },
  execute: async ({ name }) => {
    return getDatasources({ name })
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 设置全部数据源工具
 */
export const setDatasourcesTool: ToolDefinition<{
  datasources: any[];
}> = {
  name: 'set_datasources',
  description: '整体替换全部数据源列表。此操作会覆盖现有数据源，请谨慎使用。返回 { success, message } 结构。',
  inputSchema: {
    type: 'object',
    properties: {
      datasources: { type: 'array', items: DatasourceSchema, description: '数据源定义数组' }
    },
    required: ['datasources']
  },
  execute: async ({ datasources }) => {
    for (const datasource of datasources) {
      const error = validateDatasource(datasource)
      if (error) {
        return { success: false, message: `数据校验失败: ${error}` }
      }
    }
    return setDatasources({ datasources })
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 添加数据源工具
 */
export const addDatasourceTool: ToolDefinition<{
  datasource: any;
}> = {
  name: 'add_datasource',
  description: '添加数据源到报表。返回 { success, message } 结构。注意：Agent 仅支持创建 buildin 类型数据源；jdbc/spring 类型数据源需在报表设计器中手动添加。',
  inputSchema: {
    type: 'object',
    properties: {
      datasource: DatasourceSchema
    },
    required: ['datasource']
  },
  execute: async ({ datasource }) => {
    const normalized = normalizeDatasource(datasource)
    if (normalized.type === 'buildin') {
      try {
        const buildinResult: any = await loadBuildinDatasources()
        const buildinNames: string[] = buildinResult?.datasources || []
        if (!buildinNames.includes(normalized.name)) {
          return {
            success: false,
            message: `数据源名称 "${normalized.name}" 不在 buildin 合法名称列表中。合法名称：${buildinNames.join('、') || '(空)'}。请使用 load_buildin_datasources 工具获取合法名称后重试`
          }
        }
      } catch {
        // 拉取失败时不阻断写入：保留 buildin 名称校验由 verify 阶段保证
      }
    }
    return addDatasource({ datasource: normalized })
  },
  readOnly: false,
  requireConfirm: false,
  validate: ({ datasource }) => validateDatasource(datasource)
}

/**
 * 更新数据源工具
 */
export const updateDatasourceTool: ToolDefinition<{
  name: string;
  datasource: any;
}> = {
  name: 'update_datasource',
  description: '按名称更新数据源定义。会完全替换该名称对应的数据源。返回 { success, message } 结构。',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '目标数据源名称' },
      datasource: DatasourceSchema
    },
    required: ['name', 'datasource']
  },
  execute: async ({ name, datasource }) => {
    const error = validateDatasource(datasource)
    if (error) {
      return { success: false, message: `数据校验失败: ${error}` }
    }
    return updateDatasource({ name, datasource })
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 删除数据源工具
 */
export const removeDatasourceTool: ToolDefinition<{
  name: string;
}> = {
  name: 'remove_datasource',
  description: '按名称删除数据源。此操作不可撤销。返回 { success, message } 结构。',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '要删除的数据源名称' }
    },
    required: ['name']
  },
  execute: async ({ name }) => {
    return removeDatasource({ name })
  },
  readOnly: false,
  requireConfirm: true
}

/**
 * 获取Schema提示词工具
 */
export const getTableRelationTool: ToolDefinition<{
  datasourceId?: number;
  datasourceName?: string;
  query: string;
}> = {
  name: 'get_table_relation',
  description: '【必传校验】获取内置数据源的表字段和表关联信息。\n' +
    '【硬约束】调用本工具**必须**同时传 query **和** datasourceId/datasourceName 之一，缺任一字段会执行失败。\n' +
    '【参数】\n' +
    '- query (必填, string): 待查询的表名，如"用户表"或"user"\n' +
    '- datasourceId (与 datasourceName 二选一, integer): 数据源ID\n' +
    '- datasourceName (与 datasourceId 二选一, string): 数据源名称（字面量），如 "UserDatasource"\n' +
    '【返回】格式化的表结构信息，包括表名、字段、表关联关系等，用于构建SQL数据集。',
  inputSchema: {
    type: 'object',
    properties: {
      datasourceId: {
        type: 'integer',
        description: '数据源ID（与datasourceName二选一），从设计器内置数据源列表中获取'
      },
      datasourceName: {
        type: 'string',
        description: '数据源名称（与datasourceId二选一），设计器内置数据源的名称'
      },
      query: {
        type: 'string',
        description: '待查询的表名，如"用户表"'
      }
    },
    required: ['query'],
    // 硬约束：query 必填 + datasourceId/datasourceName 至少二选一，让 JSON-Schema 校验阶段就拒绝"只 query"的请求
    anyOf: [
      { required: ['datasourceId'] },
      { required: ['datasourceName'] }
    ]
  },
  execute: async ({ datasourceId, datasourceName, query }) => {
    const params: { id?: number; name?: string; query: string } = { query }

    if (datasourceId !== undefined) {
      params.id = datasourceId
    } else if (datasourceName !== undefined) {
      params.name = datasourceName
    } else {
      throw new Error('必须提供 datasourceId 或 datasourceName')
    }

    // request.post 已在拦截器里解包 ResultVO.data，失败时直接 throw，无需再 .code/.data
    return getSchemaPrompt(params)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 获取所有可用的数据源列表工具
 */
export const getAvailableDatasourcesTool: ToolDefinition<{}> = {
  name: 'get_available_datasources',
  description: '获取所有可用的数据源列表（来自Agent后台数据库配置）。返回数据源名称、ID等信息，用于在设计报表时选择使用哪个数据源。',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    const response = await getBuildinDatasources()
    if (response.code === 0) {
      return response.data
    } else {
      throw new Error(response.message || '获取数据源列表失败')
    }
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 跨数据源搜索Schema工具
 */
export const searchSchemaTool: ToolDefinition<{
  query: string;
}> = {
  name: 'search_schema',
  description: '搜索数据源-表结构信息。传入自然语言查询，返回所有匹配的数据源及其表结构信息。当不确定应该使用哪个内置数据源时，调用此工具快速定位包含相关表的数据源。',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '自然语言查询，描述要查找的表或业务概念，如"销售订单"、"库存管理"、"用户信息"'
      }
    },
    required: ['query']
  },
  execute: async ({ query }) => {
    // request.post 已在拦截器里解包 ResultVO.data，失败时直接 throw，无需再 .code/.data
    return searchSchema(query)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 获取内置数据源列表工具
 */
export const loadBuildinDatasourcesTool: ToolDefinition<{}> = {
  name: 'load_buildin_datasources',
  description: '获取Spring内置数据源名称列表。返回的名称是创建buildin类型数据源时唯一合法的名称来源，add_datasource的name必须从此列表中选择，禁止凭空编造名称。',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    return loadBuildinDatasources()
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 测试数据库连接工具
 */
export const testConnectionTool: ToolDefinition<{
  driver: string;
  url: string;
  username?: string;
  password?: string;
}> = {
  name: 'test_connection',
  description: '测试数据库连接是否可用。传入JDBC驱动和连接URL，可选用户名密码，返回连接是否成功。',
  inputSchema: {
    type: 'object',
    properties: {
      driver: { type: 'string', description: 'JDBC驱动类名' },
      url: { type: 'string', description: 'JDBC连接URL' },
      username: { type: 'string', description: '数据库用户名' },
      password: { type: 'string', description: '数据库密码' }
    },
    required: ['driver', 'url']
  },
  execute: async ({ driver, url, username, password }) => {
    return testConnection({ username, password, driver, url })
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 获取 Bean 数据源方法列表工具
 */
export const loadBeanMethodsTool: ToolDefinition<{
  beanId: string;
}> = {
  name: 'load_bean_methods',
  description: '获取指定Spring Bean数据源的方法列表。传入beanId，返回该Bean所有可调用的方法信息，用于配置Spring类型数据集。',
  inputSchema: {
    type: 'object',
    properties: {
      beanId: { type: 'string', description: 'Spring Bean标识' }
    },
    required: ['beanId']
  },
  execute: async ({ beanId }) => {
    return loadBeanMethods({ beanId })
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 数据源操作路由工具
 */
export const selectDatasourceOperationTool: ToolDefinition<{
  operationType: 'create_datasource' | 'modify_datasource' | 'delete_datasource' | 'create_dataset' | 'modify_dataset' | 'delete_dataset';
  datasourceName?: string;
  datasetName?: string;
  description: string;
}> = {
  name: 'select_datasource_operation',
  description: '选择要执行的数据源/数据集操作类型。在分析用户需求后调用此工具，声明具体的操作类型（创建/修改/删除 数据源/数据集），系统将根据选择执行对应的子工作流。注意：create_datasource 会自动升级为 create_datasource_and_dataset（同时创建数据源和数据集）。',
  inputSchema: {
    type: 'object',
    properties: {
      operationType: {
        type: 'string',
        enum: ['create_datasource', 'modify_datasource', 'delete_datasource', 'create_dataset', 'modify_dataset', 'delete_dataset'],
        description: '操作类型：create_datasource=创建数据源（自动升级为创建数据源+数据集）, modify_datasource=修改数据源, delete_datasource=删除数据源, create_dataset=创建数据集, modify_dataset=修改数据集, delete_dataset=删除数据集'
      },
      datasourceName: {
        type: 'string',
        description: '目标数据源名称，创建数据源时可不传'
      },
      datasetName: {
        type: 'string',
        description: '目标数据集名称，仅数据集操作时需要'
      },
      description: {
        type: 'string',
        description: '操作描述，简要说明要做什么'
      }
    },
    required: ['operationType', 'description']
  },
  execute: async (input) => {
    // 路由工具不执行实际操作，直接返回输入参数供步骤结果使用
    return input
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 获取数据源模板工具
 */
export const getDatasourceTemplateTool: ToolDefinition<{
  name?: string;
}> = {
  name: 'get_datasource_template',
  description: `获取符合规范的buildin数据源模板。返回完整的数据源定义模板。
【使用场景】创建buildin数据源前获取初始结构，了解数据源数据规范。
【限制】只允许创建 buildin 类型数据源，jdbc/spring 类型数据源需用户手动配置。`,
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '数据源名称（可选）' }
    },
    required: []
  },
  execute: async ({ name }) => {
    return getBuildinDatasourceTemplate(name)
  },
  readOnly: true,
  requireConfirm: false
}
