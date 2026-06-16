/**
 * Agent 上下文管理配置
 * 集中管理对话数量限制、token 数量限制等参数
 * 供 MemoryManager、AgentLoop 等模块引用，替代硬编码值
 *
 * 注意：contextWindowTokens 已移除，改为从当前选中模型的 maxTokens 动态获取，
 * 确保不同模型使用各自的上下文窗口上限
 */

/**
 * 上下文窗口配置
 * 控制自动压缩、token 估算等行为（已移除滑动窗口机制）
 */
export const contextConfig = {
  /** 触发自动摘要压缩的消息条数阈值 */
  compactThreshold: 50,

  /** 压缩后保留的最近消息条数 */
  compactKeepRecent: 10,

  /** 触发自动压缩的 token 占比阈值（0.7 表示上下文占 70% 时触发压缩） */
  autoCompactTokenRatio: 0.7,

  /** 工具结果截断阈值（字符数），0 表示不截断 */
  toolResultMaxChars: 0,

  /** Agent 循环最大轮次，防止无限循环 */
  maxAgentIterations: 15,

  /** 会话持久化有效期（毫秒），默认 24 小时 */
  sessionPersistenceTTL: 24 * 60 * 60 * 1000,

  /** 报表状态缓存有效期（毫秒），默认 5 秒 */
  reportStateCacheTTL: 5000,

  /** 报表快照最大合并区域数 */
  snapshotMaxMergedRegions: 20,

  /** 报表快照最大关键单元格数 */
  snapshotMaxCellValues: 30,

  /** 报表快照最大数据源绑定数 */
  snapshotMaxDataBindings: 10
} as const

/**
 * 配置项类型，方便其他模块做类型推导
 */
export type ContextConfig = typeof contextConfig
