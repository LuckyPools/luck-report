import request from '@/utils/request'
import type {ResultVO,PageResultVO} from "@/api/type.ts";

/**
 * 模型配置接口定义
 */
export interface ModelConfig {
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
export async function getModelConfigList(): Promise<ResultVO<ModelConfig[]>> {
  const response = await request.get('/model-config/list')
  return response as ResultVO<ModelConfig[]>
}

/**
 * 分页查询模型配置列表
 * @param queryDTO 查询条件
 * @returns Promise包含分页结果
 */
export async function queryModelConfigByPage(
  queryDTO: ModelConfigQueryDTO
): Promise<PageResultVO<ModelConfig>> {
  const response = await request.post('/model-config/query/page', queryDTO)
  return response as PageResultVO<ModelConfig>
}

/**
 * 新增模型配置
 * @param data 模型配置对象
 * @returns Promise包含操作结果
 */
export async function addModelConfig(data: ModelConfig): Promise<ResultVO<string>> {
  const response = await request.post('/model-config/add', data)
  return response as ResultVO<string>
}

/**
 * 更新模型配置
 * @param data 模型配置对象
 * @returns Promise包含操作结果
 */
export async function updateModelConfig(data: ModelConfig): Promise<ResultVO<string>> {
  const response = await request.put('/model-config/update', data)
  return response as ResultVO<string>
}

/**
 * 删除模型配置
 * @param id 配置ID
 * @returns Promise包含操作结果
 */
export async function deleteModelConfig(id: number): Promise<ResultVO<string>> {
  const response = await request.del(`/model-config/${id}`)
  return response as ResultVO<string>
}

/**
 * 激活模型配置
 * @param id 配置ID
 * @returns Promise包含操作结果
 */
export async function activateModelConfig(id: number): Promise<ResultVO<string>> {
  const response = await request.post(`/model-config/activate/${id}`)
  return response as ResultVO<string>
}

/**
 * 禁用模型配置
 * 如果该类型只有一个启用的模型，则不允许禁用
 * @param id 配置ID
 * @returns Promise包含操作结果
 */
export async function deactivateModelConfig(id: number): Promise<ResultVO<string>> {
  const response = await request.post(`/model-config/deactivate/${id}`)
  return response as ResultVO<string>
}

/**
 * 根据模型类型获取所有激活的模型配置列表
 * 用于前端对话框模型选择
 * @param modelType 模型类型(CHAT/EMBEDDING)
 * @returns Promise包含激活的模型配置列表
 */
export async function getActiveModelConfigList(modelType: string): Promise<ResultVO<ModelConfig[]>> {
  const response = await request.get(`/model-config/active-list/${modelType}`)
  return response as ResultVO<ModelConfig[]>
}

/**
 * 检查模型配置是否就绪
 * @returns Promise包含检查结果
 */
export async function checkModelConfigReady(): Promise<ResultVO<ModelCheckResult>> {
  const response = await request.get('/model-config/check-ready')
  return response as ResultVO<ModelCheckResult>
}
