import request from '@/utils/request'

/**
 * 业务知识接口定义
 */
export interface BusinessKnowledge {
  id?: number
  businessTerm: string
  description: string
  synonyms?: string
  enabled?: boolean
  modelId: number
  createdTime?: string
  updatedTime?: string
  embeddingStatus?: string
  errorMsg?: string
}

/**
 * 创建业务知识DTO接口定义
 */
export interface CreateBusinessKnowledgeDTO {
  businessTerm: string
  description: string
  synonyms?: string
  enabled?: boolean
  modelId: number
}

/**
 * 更新业务知识DTO接口定义
 */
export interface UpdateBusinessKnowledgeDTO {
  businessTerm: string
  description: string
  synonyms?: string
  modelId: number
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
 * 获取业务知识列表
 * @param keyword 搜索关键词（可选）
 * @returns Promise包含业务知识列表
 */
export async function getBusinessKnowledgeList(
  keyword?: string
): Promise<ApiResponse<BusinessKnowledge[]>> {
  const params: any = {}
  if (keyword) {
    params.keyword = keyword
  }
  const response = await request.get('/business-knowledge/list', { params })
  return response as ApiResponse<BusinessKnowledge[]>
}

/**
 * 根据ID获取业务知识详情
 * @param id 业务知识ID
 * @returns Promise包含业务知识详情
 */
export async function getBusinessKnowledgeById(
  id: number
): Promise<ApiResponse<BusinessKnowledge>> {
  const response = await request.get(`/business-knowledge/detail/${id}`)
  return response as ApiResponse<BusinessKnowledge>
}

/**
 * 创建业务知识
 * @param data 创建业务知识DTO
 * @returns Promise包含创建的业务知识
 */
export async function createBusinessKnowledge(
  data: CreateBusinessKnowledgeDTO
): Promise<ApiResponse<BusinessKnowledge>> {
  const response = await request.post('/business-knowledge/create', data)
  return response as ApiResponse<BusinessKnowledge>
}

/**
 * 更新业务知识
 * @param id 业务知识ID
 * @param data 更新业务知识DTO
 * @returns Promise包含更新的业务知识
 */
export async function updateBusinessKnowledge(
  id: number,
  data: UpdateBusinessKnowledgeDTO
): Promise<ApiResponse<BusinessKnowledge>> {
  const response = await request.put(`/business-knowledge/update/${id}`, data)
  return response as ApiResponse<BusinessKnowledge>
}

/**
 * 删除业务知识
 * @param id 业务知识ID
 * @returns Promise包含删除结果
 */
export async function deleteBusinessKnowledge(
  id: number
): Promise<ApiResponse<boolean>> {
  const response = await request.del(`/business-knowledge/delete/${id}`)
  return response as ApiResponse<boolean>
}

/**
 * 设置生效状态
 * @param id 业务知识ID
 * @param enabled 是否生效
 * @returns Promise包含设置结果
 */
export async function enableKnowledge(
  id: number,
  enabled: boolean
): Promise<ApiResponse<boolean>> {
  const response = await request.post(`/business-knowledge/enable/${id}`, null, {
    params: { enabled }
  })
  return response as ApiResponse<boolean>
}

/**
 * 刷新向量存储
 * 将所有召回的业务知识重新同步到向量库
 * @returns Promise包含刷新结果
 */
export async function refreshVectorStore(
): Promise<ApiResponse<boolean>> {
  const response = await request.post('/business-knowledge/refresh-vector-store')
  return response as ApiResponse<boolean>
}

/**
 * 重试向量化
 * 对失败的业务知识重新进行向量化
 * @param id 业务知识ID
 * @returns Promise包含重试结果
 */
export async function retryEmbedding(
  id: number
): Promise<ApiResponse<boolean>> {
  const response = await request.post(`/business-knowledge/retry-embedding/${id}`)
  return response as ApiResponse<boolean>
}