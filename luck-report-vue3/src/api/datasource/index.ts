import request from '@/utils/request'

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
 * API响应接口定义
 */
export interface ApiResponse<T> {
  message: string
  data: T
  success: boolean
}

/**
 * 获取数据源类型列表
 * @returns Promise包含数据源类型列表
 */
export async function getDatasourceTypes(): Promise<ApiResponse<DatasourceType[]>> {
  const response = await request.get('/datasource/types')
  return response as ApiResponse<DatasourceType[]>
}

/**
 * 获取数据源列表
 * @param params 筛选参数（可选）
 * @returns Promise包含数据源列表
 */
export async function getDatasourceList(
  params?: { status?: string; type?: string }
): Promise<ApiResponse<Datasource[]>> {
  const response = await request.get('/datasource/list', { params })
  return response as ApiResponse<Datasource[]>
}

/**
 * 获取数据源详情
 * @param id 数据源ID
 * @returns Promise包含数据源详情
 */
export async function getDatasourceById(id: number): Promise<ApiResponse<Datasource>> {
  const response = await request.get(`/datasource/detail/${id}`)
  return response as ApiResponse<Datasource>
}

/**
 * 创建数据源
 * @param data 数据源信息
 * @returns Promise包含创建的数据源
 */
export async function createDatasource(data: Datasource): Promise<ApiResponse<Datasource>> {
  const response = await request.post('/datasource/create', data)
  return response as ApiResponse<Datasource>
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
): Promise<ApiResponse<Datasource>> {
  const response = await request.put(`/datasource/update/${id}`, data)
  return response as ApiResponse<Datasource>
}

/**
 * 删除数据源
 * @param id 数据源ID
 * @returns Promise包含删除结果
 */
export async function deleteDatasource(id: number): Promise<ApiResponse<void>> {
  const response = await request.del(`/datasource/delete/${id}`)
  return response as ApiResponse<void>
}

/**
 * 测试数据源连接
 * @param id 数据源ID
 * @returns Promise包含测试结果
 */
export async function testConnection(id: number): Promise<ApiResponse<boolean>> {
  const response = await request.post(`/datasource/test/${id}`)
  return response as ApiResponse<boolean>
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
): Promise<ApiResponse<void>> {
  const response = await request.post(`/datasource/status/${id}`, null, {
    params: { status }
  })
  return response as ApiResponse<void>
}

/**
 * 获取数据源的表列表
 * @param id 数据源ID
 * @returns Promise包含表名列表
 */
export async function getDatasourceTables(id: number): Promise<ApiResponse<string[]>> {
  const response = await request.get(`/datasource/${id}/tables`)
  return response as ApiResponse<string[]>
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
): Promise<ApiResponse<string[]>> {
  const response = await request.get(`/datasource/${id}/tables/${tableName}/columns`)
  return response as ApiResponse<string[]>
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
): Promise<ApiResponse<void>> {
  const response = await request.post(`/datasource/${id}/init-schema`, { tables, modelId })
  return response as ApiResponse<void>
}

/**
 * 获取逻辑外键列表
 * @param datasourceId 数据源ID
 * @returns Promise包含逻辑外键列表
 */
export async function getLogicalRelations(
  datasourceId: number
): Promise<ApiResponse<LogicalRelation[]>> {
  const response = await request.get(`/datasource/${datasourceId}/logical-relations`)
  return response as ApiResponse<LogicalRelation[]>
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
): Promise<ApiResponse<LogicalRelation>> {
  const response = await request.post(`/datasource/${datasourceId}/logical-relations`, data)
  return response as ApiResponse<LogicalRelation>
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
): Promise<ApiResponse<LogicalRelation>> {
  const response = await request.put(
    `/datasource/${datasourceId}/logical-relations/${relationId}`,
    data
  )
  return response as ApiResponse<LogicalRelation>
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
): Promise<ApiResponse<void>> {
  const response = await request.del(
    `/datasource/${datasourceId}/logical-relations/${relationId}`
  )
  return response as ApiResponse<void>
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
): Promise<ApiResponse<LogicalRelation[]>> {
  const response = await request.put(
    `/datasource/${datasourceId}/logical-relations`,
    relations
  )
  return response as ApiResponse<LogicalRelation[]>
}
