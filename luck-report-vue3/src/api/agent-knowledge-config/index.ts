import request from '@/utils/request'

/**
 * 智能体知识接口定义
 */
export interface AgentKnowledge {
  id?: number
  title: string
  type: string
  question?: string
  content?: string
  enabled?: boolean
  embeddingStatus?: string
  errorMsg?: string
  splitterType?: string
  modelId?: number
  createdTime?: string
  updatedTime?: string
}

/**
 * 智能体知识分页查询DTO接口定义
 */
export interface AgentKnowledgeQueryDTO {
  title?: string
  type?: string
  embeddingStatus?: string
  pageNum: number
  pageSize: number
}

/**
 * 创建智能体知识DTO接口定义
 */
export interface CreateAgentKnowledgeDTO {
  title: string
  type: string
  question?: string
  content?: string
  splitterType?: string
  modelId: number
}

/**
 * 更新智能体知识DTO接口定义
 */
export interface UpdateAgentKnowledgeDTO {
  title?: string
  content?: string
  modelId?: number
}

/**
 * 分页结果接口定义
 */
export interface PageResult<T> {
  data: T[]
  total: number
  pageNum: number
  pageSize: number
  totalPages: number
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
 * 根据ID获取智能体知识详情
 * @param id 智能体知识ID
 * @returns Promise包含智能体知识详情
 */
export async function getAgentKnowledgeById(
  id: number
): Promise<ApiResponse<AgentKnowledge>> {
  const response = await request.get(`/agent-knowledge/detail/${id}`)
  return response as ApiResponse<AgentKnowledge>
}

/**
 * 创建智能体知识
 * @param data 创建智能体知识DTO
 * @param file 上传的文件（可选）
 * @returns Promise包含创建的智能体知识
 */
export async function createAgentKnowledge(
  data: CreateAgentKnowledgeDTO,
  file?: File
): Promise<ApiResponse<AgentKnowledge>> {
  const formData = new FormData()
  formData.append('title', data.title)
  formData.append('type', data.type)
  if (data.question) {
    formData.append('question', data.question)
  }
  if (data.content) {
    formData.append('content', data.content)
  }
  if (data.splitterType) {
    formData.append('splitterType', data.splitterType)
  }
  if (data.modelId) {
    formData.append('modelId', String(data.modelId))
  }
  if (file) {
    formData.append('file', file)
  }
  const response = await request.post('/agent-knowledge/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response as ApiResponse<AgentKnowledge>
}

/**
 * 更新智能体知识
 * @param id 智能体知识ID
 * @param data 更新智能体知识DTO
 * @returns Promise包含更新的智能体知识
 */
export async function updateAgentKnowledge(
  id: number,
  data: UpdateAgentKnowledgeDTO
): Promise<ApiResponse<AgentKnowledge>> {
  const response = await request.put(`/agent-knowledge/update/${id}`, data)
  return response as ApiResponse<AgentKnowledge>
}

/**
 * 设置生效状态
 * @param id 智能体知识ID
 * @param enabled 是否生效
 * @returns Promise包含设置结果
 */
export async function enableKnowledge(
  id: number,
  enabled: boolean
): Promise<ApiResponse<AgentKnowledge>> {
  const response = await request.post(`/agent-knowledge/enable/${id}`, null, {
    params: { enabled }
  })
  return response as ApiResponse<AgentKnowledge>
}

/**
 * 删除智能体知识
 * @param id 智能体知识ID
 * @returns Promise包含删除结果
 */
export async function deleteAgentKnowledge(
  id: number
): Promise<ApiResponse<boolean>> {
  const response = await request.del(`/agent-knowledge/delete/${id}`)
  return response as ApiResponse<boolean>
}

/**
 * 分页查询智能体知识列表
 * @param queryDTO 查询条件
 * @returns Promise包含分页结果
 */
export async function queryAgentKnowledgeByPage(
  queryDTO: AgentKnowledgeQueryDTO
): Promise<ApiResponse<PageResult<AgentKnowledge>>> {
  const response = await request.post('/agent-knowledge/query/page', queryDTO)
  return response as ApiResponse<PageResult<AgentKnowledge>>
}

/**
 * 重试向量化
 * @param id 智能体知识ID
 * @returns Promise包含重试结果
 */
export async function retryEmbedding(
  id: number
): Promise<ApiResponse<boolean>> {
  const response = await request.post(`/agent-knowledge/retry-embedding/${id}`)
  return response as ApiResponse<boolean>
}
