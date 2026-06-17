/**
 * 模型配置相关 API
 *
 * 后端统一响应结构：{ code, message, data }
 * utils/request.ts 已自动解包 ResultVO.data，这里直接拿到的是业务数据本身。
 */
import request from '@/utils/request'
import type { PageResultVO } from '@/types/api'

/**
 * 模型配置接口定义
 */
export interface Index {
  id?: number
  provider: string
  apiKey: string
  baseUrl: string
  modelName: string
  configName?: string
  sort?: number
  modelType: string
  completionsPath?: string
  embeddingsPath?: string
  temperature?: number
  maxTokens?: number
  isActive?: boolean
  proxyEnabled?: boolean
  proxyHost?: string
  proxyPort?: number
  proxyUsername?: string
  proxyPassword?: string
}

/**
 * 模型检查结果接口定义
 */
export interface ModelCheckResult {
  chatModelReady: boolean
  embeddingModelReady: boolean
  ready: boolean
}

/**
 * 模型配置分页查询DTO接口定义
 */
export interface ModelConfigQueryDTO {
  configName?: string
  modelType?: string
  isActive?: boolean
  pageNum: number
  pageSize: number
}

/**
 * 获取模型配置列表
 * @returns Promise包含模型配置列表
 */
export async function getModelConfigList(): Promise<Index[]> {
  return request.get<Index[]>('/model-config/list')
}

/**
 * 分页查询模型配置列表
 * @param queryDTO 查询条件
 * @returns Promise包含分页结果
 */
export async function queryModelConfigByPage(
  queryDTO: ModelConfigQueryDTO
): Promise<PageResultVO<Index>> {
  return request.post<PageResultVO<Index>>('/model-config/query/page', queryDTO)
}

/**
 * 新增模型配置
 * @param data 模型配置对象
 * @returns Promise包含操作结果
 */
export async function addModelConfig(data: Index): Promise<string> {
  return request.post<string>('/model-config/add', data)
}

/**
 * 更新模型配置
 * @param data 模型配置对象
 * @returns Promise包含操作结果
 */
export async function updateModelConfig(data: Index): Promise<string> {
  return request.put<string>('/model-config/update', data)
}

/**
 * 删除模型配置
 * @param id 配置ID
 * @returns Promise包含操作结果
 */
export async function deleteModelConfig(id: number): Promise<string> {
  return request.del<string>(`/model-config/${id}`)
}

/**
 * 激活模型配置
 * @param id 配置ID
 * @returns Promise包含操作结果
 */
export async function activateModelConfig(id: number): Promise<string> {
  return request.post<string>(`/model-config/activate/${id}`)
}

/**
 * 禁用模型配置
 * 如果该类型只有一个启用的模型，则不允许禁用
 * @param id 配置ID
 * @returns Promise包含操作结果
 */
export async function deactivateModelConfig(id: number): Promise<string> {
  return request.post<string>(`/model-config/deactivate/${id}`)
}

/**
 * 根据模型类型获取所有激活的模型配置列表
 * 用于前端对话框模型选择
 * @param modelType 模型类型(CHAT/EMBEDDING)
 * @returns Promise包含激活的模型配置列表
 */
export async function getActiveModelConfigList(modelType: string): Promise<Index[]> {
  return request.get<Index[]>(`/model-config/active-list/${modelType}`)
}

/**
 * 检查模型配置是否就绪
 * @returns Promise包含检查结果
 */
export async function checkModelConfigReady(): Promise<ModelCheckResult> {
  return request.get<ModelCheckResult>('/model-config/check-ready')
}
