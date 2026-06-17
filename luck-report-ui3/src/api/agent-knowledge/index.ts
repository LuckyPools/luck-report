/**
 * 智能体知识相关 API
 *
 * 后端统一响应结构：{ code, message, data }
 * utils/request.ts 已自动解包 ResultVO.data，这里直接拿到的是业务数据本身。
 */
import request from '@/utils/request'
import type { PageResultVO } from '@/types/api'

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
 * 根据ID获取智能体知识详情
 * @param id 智能体知识ID
 * @returns Promise包含智能体知识详情
 */
export async function getAgentKnowledgeById(
  id: number
): Promise<AgentKnowledge> {
  return request.get<AgentKnowledge>(`/agent-knowledge/detail/${id}`)
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
): Promise<AgentKnowledge> {
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
  return request.post<AgentKnowledge>('/agent-knowledge/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
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
): Promise<AgentKnowledge> {
  return request.put<AgentKnowledge>(`/agent-knowledge/update/${id}`, data)
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
): Promise<AgentKnowledge> {
  return request.post<AgentKnowledge>(`/agent-knowledge/enable/${id}`, null, {
    params: { enabled }
  })
}

/**
 * 删除智能体知识
 * @param id 智能体知识ID
 * @returns Promise包含删除结果
 */
export async function deleteAgentKnowledge(
  id: number
): Promise<boolean> {
  return request.del<boolean>(`/agent-knowledge/delete/${id}`)
}

/**
 * 分页查询智能体知识列表
 * @param queryDTO 查询条件
 * @returns Promise包含分页结果
 */
export async function queryAgentKnowledgeByPage(
  queryDTO: AgentKnowledgeQueryDTO
): Promise<PageResultVO<AgentKnowledge>> {
  return request.post<PageResultVO<AgentKnowledge>>('/agent-knowledge/query/page', queryDTO)
}

/**
 * 重试向量化
 * @param id 智能体知识ID
 * @returns Promise包含重试结果
 */
export async function retryEmbedding(
  id: number
): Promise<boolean> {
  return request.post<boolean>(`/agent-knowledge/retry-embedding/${id}`)
}
