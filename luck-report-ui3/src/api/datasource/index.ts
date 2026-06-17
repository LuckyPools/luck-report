import request from '@/utils/request'
import type { PageResultVO } from '@/types/api'

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
 *
 * 注：utils/request.ts 已自动解包 ResultVO.data，这里直接返回业务数据。
 */
export async function getDatasourceTypes(): Promise<DatasourceType[]> {
  return request.get<DatasourceType[]>('/datasource/types')
}

/**
 * 获取数据源列表
 */
export async function getDatasourceList(
  params?: { status?: string; type?: string }
): Promise<Datasource[]> {
  return request.get<Datasource[]>('/datasource/list', { params })
}

/**
 * 分页查询数据源列表
 */
export async function queryDatasourceByPage(
  queryDTO: DatasourceQueryDTO
): Promise<PageResultVO<Datasource>> {
  return request.post<PageResultVO<Datasource>>('/datasource/query/page', queryDTO)
}

/**
 * 获取数据源详情
 */
export async function getDatasourceById(id: number): Promise<Datasource> {
  return request.get<Datasource>(`/datasource/detail/${id}`)
}

/**
 * 创建数据源
 */
export async function createDatasource(data: Datasource): Promise<Datasource> {
  return request.post<Datasource>('/datasource/create', data)
}

/**
 * 更新数据源
 */
export async function updateDatasource(
  id: number,
  data: Datasource
): Promise<Datasource> {
  return request.put<Datasource>(`/datasource/update/${id}`, data)
}

/**
 * 删除数据源
 */
export async function deleteDatasource(id: number): Promise<string> {
  return request.del<string>(`/datasource/delete/${id}`)
}

/**
 * 测试数据源连接
 */
export async function testConnection(id: number): Promise<boolean> {
  return request.post<boolean>(`/datasource/test/${id}`)
}

/**
 * 更新数据源状态（启用/禁用）
 */
export async function updateDatasourceStatus(
  id: number,
  status: string
): Promise<string> {
  return request.post<string>(`/datasource/status/${id}`, null, {
    params: { status }
  })
}

/**
 * 获取数据源的表列表
 */
export async function getDatasourceTables(id: number): Promise<string[]> {
  return request.get<string[]>(`/datasource/${id}/tables`)
}

/**
 * 获取表的字段列表
 */
export async function getTableColumns(
  id: number,
  tableName: string
): Promise<string[]> {
  return request.get<string[]>(`/datasource/${id}/tables/${tableName}/columns`)
}

/**
 * 初始化表Schema到向量数据库
 */
export async function initTableSchema(
  id: number,
  tables: string[],
  modelId?: number
): Promise<string> {
  return request.post<string>(`/datasource/${id}/init-schema`, { tables, modelId })
}

/**
 * 获取逻辑外键列表
 */
export async function getLogicalRelations(
  datasourceId: number
): Promise<LogicalRelation[]> {
  return request.get<LogicalRelation[]>(`/datasource/${datasourceId}/logical-relations`)
}

/**
 * 添加逻辑外键
 */
export async function addLogicalRelation(
  datasourceId: number,
  data: LogicalRelation
): Promise<LogicalRelation> {
  return request.post<LogicalRelation>(`/datasource/${datasourceId}/logical-relations`, data)
}

/**
 * 更新逻辑外键
 */
export async function updateLogicalRelation(
  datasourceId: number,
  relationId: number,
  data: LogicalRelation
): Promise<LogicalRelation> {
  return request.put<LogicalRelation>(
    `/datasource/${datasourceId}/logical-relations/${relationId}`,
    data
  )
}

/**
 * 删除逻辑外键
 */
export async function deleteLogicalRelation(
  datasourceId: number,
  relationId: number
): Promise<string> {
  return request.del<string>(`/datasource/${datasourceId}/logical-relations/${relationId}`)
}

/**
 * 批量保存逻辑外键（替换现有的所有外键）
 */
export async function saveLogicalRelations(
  datasourceId: number,
  relations: LogicalRelation[]
): Promise<LogicalRelation[]> {
  return request.put<LogicalRelation[]>(`/datasource/${datasourceId}/logical-relations`, relations)
}

/**
 * 获取格式化的Schema提示词文本
 */
export async function getSchemaPrompt(
  params: { id?: number; name?: string; query: string }
): Promise<string> {
  return request.post<string>('/datasource/schema-prompt', null, {
    params
  })
}

/**
 * 获取内置数据源列表（包含ID和名称）
 */
export async function getBuildinDatasources(): Promise<Array<{name: string, id: number}>> {
  return request.get<Array<{name: string, id: number}>>('/datasource/buildin/list')
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
 */
export async function searchSchema(
  query: string
): Promise<SchemaSearchResult[]> {
  return request.post<SchemaSearchResult[]>('/datasource/search-schema', null, {
    params: { query }
  })
}
