import request from '@/utils/request'

/**
 * 向量检索请求参数
 */
export interface VectorSearchParams {
  /** 搜索关键词 */
  query: string
  /** 向量类型，如 COMPONENT */
  vectorType: string
  /** 返回条数，默认5 */
  topK?: number
  /** 相似度阈值，默认0.5 */
  threshold?: number
  /** 元数据过滤条件，值支持多种类型 */
  metadataFilters?: Record<string, any>
}

/**
 * 向量检索单条结果
 */
export interface VectorSearchResultItem {
  /** 文档ID */
  id: string
  /** 文档内容 */
  content: string
  /** 相似度得分（0~1，越大越相似） */
  score: number
  /** 元数据 */
  metadata: Record<string, any>
}

/**
 * 向量检索接口
 * 调用后端 /vector/search 接口，根据关键词和向量类型检索相关文档
 *
 * @param params - 检索参数，包含 query、vectorType、topK 等
 * @returns 检索结果列表
 */
export async function vectorSearch(params: VectorSearchParams): Promise<VectorSearchResultItem[]> {
  const res: any = await request.post('/vector/search', params)
  if (res.code === 0 && res.data) {
    return res.data.map((item: any) => ({
      id: item.id,
      content: item.content,
      score: item.score,
      metadata: item.metadata
    }))
  }
  throw new Error(res.message || '向量检索失败')
}
