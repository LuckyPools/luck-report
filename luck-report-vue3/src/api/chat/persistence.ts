/**
 * 会话与消息持久化 API
 * 对接后端 ChatSessionController（合并了会话+消息管理）
 * URL 模式参照 data-agent-management：/sessions/{sessionId}/messages
 *
 * 持久化流程：
 * 1. 前端首次发消息 → POST /api/sessions 创建会话
 * 2. Agent Loop 运行 → 全程前端内存管理
 * 3. Loop 结束 → POST /api/sessions/{sessionId}/messages/batch 批量保存
 * 4. 进入旧对话 → GET /api/sessions/{sessionId}/messages 加载历史
 */

import { getUserId } from '@/utils/user'

/** 后端统一响应结构（ResultVO） */
interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/** 会话对象 */
export interface SessionInfo {
  id: string
  title: string
  status: string
  isPinned: number
  userId: number | null
  createTime: string
  updateTime: string
}

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

/**
 * 通用请求封装
 * 统一处理后端 ResultVO 响应格式，提取 data 字段
 * code=0 表示成功，非 0 表示失败
 *
 * @param url - 请求路径（以 /api 开头，Vite 代理会去掉 /api 前缀）
 * @param options - fetch 配置
 * @returns 响应 data 字段
 */
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const json: ApiResponse<T> = await response.json()
  if (json.code !== 0) {
    throw new Error(json.message || '请求失败')
  }
  return json.data
}

// ==================== 会话管理 ====================

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
 * 根据用户ID查询会话列表
 *
 * @param userId - 用户ID
 * @returns 会话列表
 */
export async function listSessionsByUser(userId: number): Promise<SessionInfo[]> {
  return request<SessionInfo[]>(`/api/sessions/user/${userId}`)
}

/**
 * 根据会话ID查询会话详情
 *
 * @param sessionId - 会话ID
 * @returns 会话信息
 */
export async function getSession(sessionId: string): Promise<SessionInfo> {
  return request<SessionInfo>(`/api/sessions/${sessionId}`)
}

/**
 * 创建新会话
 * 前端首次发送消息时调用，自动注入当前用户ID
 *
 * @param title - 可选，会话标题
 * @returns 新建的会话对象
 */
export async function createSession(title?: string): Promise<SessionInfo> {
  return request<SessionInfo>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ title, userId: getUserId() })
  })
}

/**
 * 重命名会话
 *
 * @param sessionId - 会话ID
 * @param title - 新标题
 */
export async function renameSession(sessionId: string, title: string): Promise<void> {
  await request<void>(`/api/sessions/${sessionId}/rename`, {
    method: 'PUT',
    body: JSON.stringify({ title })
  })
}

/**
 * 置顶或取消置顶会话
 *
 * @param sessionId - 会话ID
 * @param isPinned - 0-否，1-是
 */
export async function pinSession(sessionId: string, isPinned: number): Promise<void> {
  await request<void>(`/api/sessions/${sessionId}/pin`, {
    method: 'PUT',
    body: JSON.stringify({ isPinned })
  })
}

/**
 * 删除会话（软删除）
 *
 * @param sessionId - 会话ID
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await request<void>(`/api/sessions/${sessionId}`, {
    method: 'DELETE'
  })
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
  return request<MessageInfo[]>(`/api/sessions/${sessionId}/messages`)
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
  return request<MessageInfo>(`/api/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ role, content, messageType, metadata })
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
  return request<number>(`/api/sessions/${sessionId}/messages/batch`, {
    method: 'POST',
    body: JSON.stringify({ messages })
  })
}

/**
 * 删除单条消息
 *
 * @param id - 消息ID
 */
export async function deleteMessage(id: number): Promise<void> {
  await request<void>(`/api/sessions/messages/item/${id}`, {
    method: 'DELETE'
  })
}
