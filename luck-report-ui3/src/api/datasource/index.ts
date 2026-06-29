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
 * 外键关系（sourceTable.sourceColumn 关联 targetTable.targetColumn）
 * LLM 可直接读取，组合 SchemaDTO.table 推断 JOIN 条件
 */
export interface ForeignKeyDTO {
  sourceTable: string
  sourceColumn: string
  targetTable: string
  targetColumn: string
}

/**
 * 字段结构（name/type/description/data/enumeration/range/mapping）
 * LLM 可读取 name 写 SQL、读 description 理解字段含义、读 data/mapping 推断枚举值
 */
export interface ColumnDTO {
  name: string
  description: string
  type: string
  /** 示例数据 */
  data?: string[]
  /** 枚举标记（0-非枚举，1-枚举） */
  enumeration?: number
  /** 值范围描述 */
  range?: string
  /** 状态码→状态名映射 */
  mapping?: Record<string, string>
}

/**
 * 表结构（name/description/column/primaryKeys）
 * LLM 读取 name 用于 FROM/JOIN，读取 column 列表用于 SELECT/WHERE
 */
export interface TableDTO {
  name: string
  description: string
  column: ColumnDTO[]
  primaryKeys?: string[]
}

/**
 * Schema 结构（name=数据库名 / description / tableCount / table / foreignKeys）
 * 直接序列化给 LLM 消费；前端代码也可读取 table/foreignKeys 做后续处理
 */
export interface SchemaDTO {
  name: string
  description?: string
  tableCount: number
  table: TableDTO[]
  foreignKeys: ForeignKeyDTO[]
}

/**
 * 获取与查询相关的表结构信息（结构化 SchemaDTO）
 * 替换原 getSchemaPrompt（String 提示词），返回结构化数据由前端/Agent 转发给 LLM
 */
export async function getTableRelations(
  params: { id?: number; name?: string; query: string }
): Promise<SchemaDTO> {
  return request.post<SchemaDTO>('/datasource/table-relations', null, {
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
 * schema 字段为结构化 SchemaDTO，替换原 schemaPrompt 字符串
 */
export interface SchemaSearchResult {
  /** 数据源ID */
  datasourceId: number
  /** 数据源名称 */
  datasourceName: string
  /** 数据源类型 */
  datasourceType: string
  /** 命中的Schema结构（含表结构、字段、外键） */
  schema: SchemaDTO
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
