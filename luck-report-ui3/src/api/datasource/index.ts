import request from '@/utils/request'
import type { ResultVO, PageResultVO } from '@/types/api'

/**
 * 数据源类型接口定义
 */
export interface DatasourceType {
  code: number
  typeName: string
  displayName: string
  driverClassName: string
}

/**
 * 数据源接口定义
 */
export interface Datasource {
  id?: number
  name: string
  type: string
  host: string
  port: number
  databaseName: string
  username: string
  password?: string
  connectionUrl?: string
  status?: string
  testStatus?: string
  description?: string
  modelId?: number
  initializedTables?: string
  creatorId?: number
  createTime?: string
  updateTime?: string
}

/**
 * 逻辑外键接口定义
 */
export interface LogicalRelation {
  id?: number
  datasourceId?: number
  sourceTableName: string
  sourceColumnName: string
  targetTableName: string
  targetColumnName: string
  relationType?: string
  description?: string
  isDeleted?: number
  createdTime?: string
  updatedTime?: string
}

/**
 * 数据源分页查询DTO接口定义
 */
export interface DatasourceQueryDTO {
  name?: string
  type?: string
  status?: string
  pageNum: number
  pageSize: number
}

/**
 * 获取数据源类型列表
 * @returns Promise包含数据源类型列表
 */
export async function getDatasourceTypes(): Promise<ResultVO<DatasourceType[]>> {
  const response = await request.get('/datasource/types')
  return response as ResultVO<DatasourceType[]>
}

/**
 * 获取数据源列表
 * @param params 筛选参数（可选）
 * @returns Promise包含数据源列表
 */
export async function getDatasourceList(
  params?: { status?: string; type?: string }
): Promise<ResultVO<Datasource[]>> {
  const response = await request.get('/datasource/list', { params })
  return response as ResultVO<Datasource[]>
}

/**
 * 分页查询数据源列表
 * @param queryDTO 查询条件
 * @returns Promise包含分页结果
 */
export async function queryDatasourceByPage(
  queryDTO: DatasourceQueryDTO
): Promise<PageResultVO<Datasource>> {
  const response = await request.post('/datasource/query/page', queryDTO)
  return response as PageResultVO<Datasource>
}

/**
 * 获取数据源详情
 * @param id 数据源ID
 * @returns Promise包含数据源详情
 */
export async function getDatasourceById(id: number): Promise<ResultVO<Datasource>> {
  const response = await request.get(`/datasource/detail/${id}`)
  return response as ResultVO<Datasource>
}

/**
 * 创建数据源
 * @param data 数据源信息
 * @returns Promise包含创建的数据源
 */
export async function createDatasource(data: Datasource): Promise<ResultVO<Datasource>> {
  const response = await request.post('/datasource/create', data)
  return response as ResultVO<Datasource>
}

/**
 * 更新数据源
 * @param id 数据源ID
 * @param data 数据源信息
 * @returns Promise包含更新的数据源
 */
export async function updateDatasource(
  id: number,
  data: Datasource
): Promise<ResultVO<Datasource>> {
  const response = await request.put(`/datasource/update/${id}`, data)
  return response as ResultVO<Datasource>
}

/**
 * 删除数据源
 * @param id 数据源ID
 * @returns Promise包含删除结果
 */
export async function deleteDatasource(id: number): Promise<ResultVO<string>> {
  const response = await request.del(`/datasource/delete/${id}`)
  return response as ResultVO<string>
}

/**
 * 测试数据源连接
 * @param id 数据源ID
 * @returns Promise包含测试结果
 */
export async function testConnection(id: number): Promise<ResultVO<boolean>> {
  const response = await request.post(`/datasource/test/${id}`)
  return response as ResultVO<boolean>
}

/**
 * 更新数据源状态（启用/禁用）
 * @param id 数据源ID
 * @param status 状态：active/inactive
 * @returns Promise包含操作结果
 */
export async function updateDatasourceStatus(
  id: number,
  status: string
): Promise<ResultVO<string>> {
  const response = await request.post(`/datasource/status/${id}`, null, {
    params: { status }
  })
  return response as ResultVO<string>
}

/**
 * 获取数据源的表列表
 * @param id 数据源ID
 * @returns Promise包含表名列表
 */
export async function getDatasourceTables(id: number): Promise<ResultVO<string[]>> {
  const response = await request.get(`/datasource/${id}/tables`)
  return response as ResultVO<string[]>
}

/**
 * 获取表的字段列表
 * @param id 数据源ID
 * @param tableName 表名
 * @returns Promise包含字段名列表
 */
export async function getTableColumns(
  id: number,
  tableName: string
): Promise<ResultVO<string[]>> {
  const response = await request.get(`/datasource/${id}/tables/${tableName}/columns`)
  return response as ResultVO<string[]>
}

/**
 * 初始化表Schema到向量数据库
 * @param id 数据源ID
 * @param tables 表名列表
 * @param modelId 嵌入模型配置ID
 * @returns Promise包含初始化结果
 */
export async function initTableSchema(
  id: number,
  tables: string[],
  modelId?: number
): Promise<ResultVO<string>> {
  const response = await request.post(`/datasource/${id}/init-schema`, { tables, modelId })
  return response as ResultVO<string>
}

/**
 * 获取逻辑外键列表
 * @param datasourceId 数据源ID
 * @returns Promise包含逻辑外键列表
 */
export async function getLogicalRelations(
  datasourceId: number
): Promise<ResultVO<LogicalRelation[]>> {
  const response = await request.get(`/datasource/${datasourceId}/logical-relations`)
  return response as ResultVO<LogicalRelation[]>
}

/**
 * 添加逻辑外键
 * @param datasourceId 数据源ID
 * @param data 逻辑外键信息
 * @returns Promise包含添加的逻辑外键
 */
export async function addLogicalRelation(
  datasourceId: number,
  data: LogicalRelation
): Promise<ResultVO<LogicalRelation>> {
  const response = await request.post(`/datasource/${datasourceId}/logical-relations`, data)
  return response as ResultVO<LogicalRelation>
}

/**
 * 更新逻辑外键
 * @param datasourceId 数据源ID
 * @param relationId 逻辑外键ID
 * @param data 逻辑外键信息
 * @returns Promise包含更新的逻辑外键
 */
export async function updateLogicalRelation(
  datasourceId: number,
  relationId: number,
  data: LogicalRelation
): Promise<ResultVO<LogicalRelation>> {
  const response = await request.put(
    `/datasource/${datasourceId}/logical-relations/${relationId}`,
    data
  )
  return response as ResultVO<LogicalRelation>
}

/**
 * 删除逻辑外键
 * @param datasourceId 数据源ID
 * @param relationId 逻辑外键ID
 * @returns Promise包含删除结果
 */
export async function deleteLogicalRelation(
  datasourceId: number,
  relationId: number
): Promise<ResultVO<string>> {
  const response = await request.del(
    `/datasource/${datasourceId}/logical-relations/${relationId}`
  )
  return response as ResultVO<string>
}

/**
 * 批量保存逻辑外键（替换现有的所有外键）
 * @param datasourceId 数据源ID
 * @param relations 逻辑外键列表
 * @returns Promise包含保存后的逻辑外键列表
 */
export async function saveLogicalRelations(
  datasourceId: number,
  relations: LogicalRelation[]
): Promise<ResultVO<LogicalRelation[]>> {
  const response = await request.put(
    `/datasource/${datasourceId}/logical-relations`,
    relations
  )
  return response as ResultVO<LogicalRelation[]>
}

/**
 * 获取格式化的Schema提示词文本
 * 通过向量检索召回与查询相关的表结构，合并逻辑外键，生成格式化的提示词
 * 用于Agent构建SQL时获取数据源的表关联关系
 * 支持通过数据源ID或名称查询（二选一）
 *
 * @param params 查询参数，包含id或name，以及query
 * @returns Promise包含格式化后的Schema提示词文本
 */
export async function getSchemaPrompt(
  params: { id?: number; name?: string; query: string }
): Promise<ResultVO<string>> {
  const response = await request.post('/datasource/schema-prompt', null, {
    params
  })
  return response as ResultVO<string>
}

/**
 * 获取内置数据源列表（包含ID和名称）
 * 返回所有注册到Spring容器的BuildinDatasource Bean信息
 * 用于设计器端获取可用的数据源列表
 *
 * @returns Promise包含内置数据源列表
 */
export async function getBuildinDatasources(): Promise<ResultVO<Array<{name: string, id: number}>>> {
  const response = await request.get('/datasource/buildin/list')
  return response as ResultVO<Array<{name: string, id: number}>>
}

/**
 * Schema搜索结果项接口定义
 */
export interface SchemaSearchResult {
  /** 数据源ID */
  datasourceId: number
  /** 数据源名称 */
  datasourceName: string
  /** 数据源类型 */
  datasourceType: string
  /** 匹配的Schema提示词文本 */
  schemaPrompt: string
}

/**
 * 跨数据源搜索Schema
 * 遍历所有active状态的数据源，通过向量检索召回与查询相关的表结构
 * 返回每个匹配数据源的基本信息和格式化的Schema提示词，供Agent快速定位合适的数据源
 *
 * @param query 用户自然语言查询
 * @returns Promise包含搜索结果列表
 */
export async function searchSchema(
  query: string
): Promise<ResultVO<SchemaSearchResult[]>> {
  const response = await request.post('/datasource/search-schema', null, {
    params: { query }
  })
  return response as ResultVO<SchemaSearchResult[]>
}
