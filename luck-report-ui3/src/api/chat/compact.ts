/**
 * 对话压缩 API
 * 调用后端 ChatCompactController 的 /chat/compact 接口
 * 将早期对话消息发送给后端，由 LLM 生成结构化摘要
 * 提示词由前端管理，通过请求体传给后端
 *
 * 后端统一响应结构：{ code, message, data }
 * utils/request.ts 内部已自动解包 ResultVO.data，
 * 所以这里直接拿到的是业务数据本身，不需要再手动 .data。
 */

import type { ContextMessage } from './index'
import type { CompactResult } from '@/service/agent/memory/types'
import { loadPromptDocByEnum } from '@/prompt'
import request from '@/utils/request'

/** 压缩请求体 */
interface CompactRequestBody {
  /** 大模型配置ID，用于指定使用哪个大模型进行对话压缩 */
  modelId?: number
  /** 需要压缩的历史消息列表 */
  messages: ContextMessage[]
  /** 已有的摘要内容（增量压缩时传入） */
  existingSummary?: string
  /** 已有的关键操作记录 */
  existingKeyOperations?: string[]
  /** 报表状态快照文本 */
  reportSnapshot?: string
  /** 压缩对话的系统提示词，由前端管理并传入 */
  compactPrompt?: string
}

/**
 * 调用后端对话压缩接口
 * 将早期对话消息和前端管理的压缩提示词发送给后端 LLM 生成结构化摘要
 *
 * @param messages - 需要压缩的历史消息列表
 * @param existingSummary - 已有的摘要内容（增量压缩时传入）
 * @param existingKeyOperations - 已有的关键操作记录
 * @param reportSnapshot - 报表状态快照文本
 * @param modelId - 大模型配置ID，用于指定使用哪个大模型
 * @returns CompactResult 压缩结果，包含 summary 和 keyOperations
 * @throws 网络错误或后端返回非成功状态时抛出异常
 */
export async function compactConversation(
  messages: ContextMessage[],
  existingSummary?: string,
  existingKeyOperations?: string[],
  reportSnapshot?: string,
  modelId?: number
): Promise<CompactResult> {
  const compactPrompt = await loadPromptDocByEnum('COMPACT')

  const requestBody: CompactRequestBody = {
    messages,
    existingSummary,
    existingKeyOperations,
    reportSnapshot,
    compactPrompt,
    modelId
  }

  return request.post<CompactResult>('/chat/compact', requestBody)
}
