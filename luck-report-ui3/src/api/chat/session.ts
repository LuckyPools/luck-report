/**
 * 会话与消息持久化 API
 * 对接后端 ChatSessionController（合并了会话+消息管理）
 * URL 模式参照 data-agent-management：/sessions/{sessionId}/messages
 *
 * 持久化流程：
 * 1. 前端首次发消息 → POST /sessions 创建会话
 * 2. Agent Loop 运行 → 全程前端内存管理
 * 3. Loop 结束 → POST /sessions/{sessionId}/messages/batch 批量保存
 * 4. 进入旧对话 → GET /sessions/{sessionId}/messages 加载历史
 *
 * 注：baseURL='/api' 已在 utils/request.ts 中配置，调用时不需要再加 /api 前缀
 *
 * 后端统一响应结构：{ code, message, data }
 * utils/request.ts 内部已自动解包 ResultVO.data，
 * 所以这里直接拿到的是业务数据本身，不需要再手动 .data。
 */

import request from '@/utils/request'
import { getUserId } from '@/utils/user'
import type { PageResultVO } from '@/types/api'

/** 消息对象 */
export interface MessageInfo {
  id: number
  sessionId: string
  role: string
  content: string
  messageType: string
  metadata: string | null
  createTime: string
}

/** 批量保存的单条消息格式 */
export interface BatchMessageItem {
  role: string
  content: string
  messageType?: string
  metadata?: string
}

/** 会话信息 */
export interface SessionInfo {
  id: string
  userId?: number
  title: string
  isPinned?: number
  createTime?: string
  updateTime?: string
}

// ==================== 会话管理 ====================

/**
 * 根据用户ID查询会话列表
 *
 * @param userId - 用户ID
 * @returns 会话列表
 */
export async function listSessionsByUser(userId: number): Promise<SessionInfo[]> {
  return request.get<SessionInfo[]>(`/sessions/user/${userId}`)
}

/**
 * 查询当前用户的会话列表
 * 通过 getUserId() 获取当前用户ID，按置顶优先、更新时间倒序
 *
 * @returns 当前用户的会话列表
 */
export async function listSessions(): Promise<SessionInfo[]> {
  return listSessionsByUser(getUserId())
}

/**
 * 分页查询指定用户的会话列表
 *
 * @param userId - 用户ID
 * @param pageNum - 页码，从1开始
 * @param pageSize - 每页数量，默认10
 * @returns 分页结果
 */
export async function listSessionsByUserPage(
  userId: number,
  pageNum: number = 1,
  pageSize: number = 10
): Promise<PageResultVO<SessionInfo>> {
  return request.get<PageResultVO<SessionInfo>>(
    `/sessions/user/${userId}/page?pageNum=${pageNum}&pageSize=${pageSize}`
  )
}

/**
 * 根据会话ID查询会话详情
 *
 * @param sessionId - 会话ID
 * @returns 会话信息
 */
export async function getSession(sessionId: string): Promise<SessionInfo> {
  return request.get<SessionInfo>(`/sessions/${sessionId}`)
}

/**
 * 创建新会话
 * 前端首次发送消息时调用，自动注入当前用户ID
 *
 * @param title - 可选，会话标题
 * @returns 新建的会话对象
 */
export async function createSession(title?: string): Promise<SessionInfo> {
  return request.post<SessionInfo>('/sessions', { title, userId: getUserId() })
}

/**
 * 重命名会话
 *
 * @param sessionId - 会话ID
 * @param title - 新标题
 */
export async function renameSession(sessionId: string, title: string): Promise<void> {
  await request.post<void>(`/sessions/${sessionId}/rename`, { title })
}

/**
 * 置顶或取消置顶会话
 *
 * @param sessionId - 会话ID
 * @param isPinned - 0-否，1-是
 */
export async function pinSession(sessionId: string, isPinned: number): Promise<void> {
  await request.post<void>(`/sessions/${sessionId}/pin`, { isPinned })
}

/**
 * 删除会话（软删除）
 *
 * @param sessionId - 会话ID
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await request.del<void>(`/sessions/${sessionId}`)
}

// ==================== 消息管理 ====================

/**
 * 根据会话ID加载历史消息
 * 前端进入旧对话时调用
 *
 * @param sessionId - 会话ID
 * @returns 消息列表，按创建时间升序
 */
export async function listMessages(sessionId: string): Promise<MessageInfo[]> {
  return request.get<MessageInfo[]>(`/sessions/${sessionId}/messages`)
}

/**
 * 保存单条消息
 *
 * @param sessionId - 会话ID
 * @param role - 角色
 * @param content - 内容
 * @param messageType - 消息类型
 * @param metadata - 元数据
 * @returns 保存后的消息对象
 */
export async function saveMessage(
  sessionId: string,
  role: string,
  content: string,
  messageType?: string,
  metadata?: string
): Promise<MessageInfo> {
  return request.post<MessageInfo>(`/sessions/${sessionId}/messages`, {
    role,
    content,
    messageType,
    metadata
  })
}

/**
 * 批量保存消息
 * Agentic Loop 结束后，前端一次性同步本轮新增的所有消息
 *
 * @param sessionId - 会话ID
 * @param messages - 消息列表
 * @returns 保存成功的消息数量
 */
export async function batchSaveMessages(
  sessionId: string,
  messages: BatchMessageItem[]
): Promise<number> {
  return request.post<number>(`/sessions/${sessionId}/messages/batch`, { messages })
}

/**
 * 删除单条消息
 *
 * @param id - 消息ID
 */
export async function deleteMessage(id: number): Promise<void> {
  await request.get<void>(`/sessions/messages/item/${id}`, undefined, { method: 'DELETE' as any })
}
