/**
 * understand_and_plan 阶段的 ask_user 轮次计数器（跨 run 持久化）
 *
 * 为什么不用 State 字段：
 * - LangGraph 节点 throw AskUserInterrupt 后，节点返回的 state 不会合并
 * - 下次 runAgentLoop 重启，state 全新（state.gatherRounds 会重置为 0）
 * - 轮次检查必须在 LangGraph State 之外，否则限制形同虚设
 *
 * 生命周期：
 * - 按 sessionId 维度计数，key 不存在时返回 0
 * - resetGatherRounds 由 validate_plan 节点在"成功提交 TaskPlan"时调用，
 *   即"5 轮/次询问"语义：每轮用户需求都重新享有完整配额
 * - session 切换/销毁时也应调用（callers 自行处理）
 *
 * #5/#6 改动：
 * - 删除未被读取的 getGatherHistory（只写不读的 history 查询函数）
 * - 增加 session 条目超时自动清理（防止 session 异常退出时内存泄漏）
 *   每次 markGatherRound 时检查并清除超过 30 分钟未活跃的 session
 */

import { logger } from './logger.ts'

const log = logger('gather-state')

/** session 超时阈值：30 分钟无活跃自动清理 */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

interface SessionEntry {
  rounds: number
  history: Array<{ question: string; ts: number }>
  /** 最后活跃时间戳（用于超时清理） */
  lastActiveTs: number
}

const sessionRounds = new Map<string, SessionEntry>()

/**
 * 清理超时的 session 条目（防止内存泄漏）
 * 在 markGatherRound / getGatherRounds 时惰性触发
 */
function cleanupExpiredSessions(): void {
  const now = Date.now()
  for (const [sid, entry] of sessionRounds) {
    if (now - entry.lastActiveTs > SESSION_TIMEOUT_MS) {
      sessionRounds.delete(sid)
      log.debug('清理超时 session:', sid)
    }
  }
}

/** 获取当前 session 的询问轮次（没记录时返回 0） */
export function getGatherRounds(sessionId: string): number {
  cleanupExpiredSessions()
  return sessionRounds.get(sessionId)?.rounds ?? 0
}

/** 累加一次询问轮次，返回累加后的值 */
export function markGatherRound(sessionId: string): number {
  cleanupExpiredSessions()
  const cur = sessionRounds.get(sessionId) ?? { rounds: 0, history: [], lastActiveTs: Date.now() }
  cur.rounds += 1
  cur.lastActiveTs = Date.now()
  sessionRounds.set(sessionId, cur)
  return cur.rounds
}

/** 追加一条 ask_user 问题到 session 历史（仅供调试日志，不再对外暴露查询接口） */
export function appendGatherHistory(sessionId: string, question: string): void {
  const cur = sessionRounds.get(sessionId) ?? { rounds: 0, history: [], lastActiveTs: Date.now() }
  cur.history.push({ question, ts: Date.now() })
  cur.lastActiveTs = Date.now()
  if (cur.history.length > 50) cur.history.shift()  // 防止无限增长
  sessionRounds.set(sessionId, cur)
  log.debug('ask_user 历史:', sessionId, question)
}

/** 清理指定 session 的轮次计数（agent-loop finally / session 切换时调用） */
export function resetGatherRounds(sessionId: string): void {
  sessionRounds.delete(sessionId)
}
