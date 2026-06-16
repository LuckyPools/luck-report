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
 * - resetGatherRounds 由 collect_plan 节点在"成功提交 TaskPlan"时调用，
 *   即"5 轮/次询问"语义：每轮用户需求都重新享有完整配额
 * - session 切换/销毁时也应调用（callers 自行处理）
 */

const sessionRounds = new Map<string, { rounds: number; history: Array<{ question: string; ts: number }> }>()

/** 获取当前 session 的询问轮次（没记录时返回 0） */
export function getGatherRounds(sessionId: string): number {
  return sessionRounds.get(sessionId)?.rounds ?? 0
}

/** 累加一次询问轮次，返回累加后的值 */
export function markGatherRound(sessionId: string): number {
  const cur = sessionRounds.get(sessionId) ?? { rounds: 0, history: [] }
  cur.rounds += 1
  sessionRounds.set(sessionId, cur)
  return cur.rounds
}

/** 追加一条 ask_user 问题到 session 历史（用于日志/调试） */
export function appendGatherHistory(sessionId: string, question: string): void {
  const cur = sessionRounds.get(sessionId) ?? { rounds: 0, history: [] }
  cur.history.push({ question, ts: Date.now() })
  if (cur.history.length > 50) cur.history.shift()  // 防止无限增长
  sessionRounds.set(sessionId, cur)
}

/** 清理指定 session 的轮次计数（agent-loop finally / session 切换时调用） */
export function resetGatherRounds(sessionId: string): void {
  sessionRounds.delete(sessionId)
}

/** 获取 session 的完整历史（只读） */
export function getGatherHistory(sessionId: string): ReadonlyArray<{ question: string; ts: number }> {
  return sessionRounds.get(sessionId)?.history ?? []
}
