/**
 * 流事件定义（参照 LangGraph StreamMode）
 * 工作流执行节点通过 runtime.emitEvent 发出 StreamEvent，由 agent-loop 转换为 AgentEvent
 * 业务侧只关心 mode + event 输出结构，UpdatesEventData 是唯一被引用的细分类型
 */

/**
 * 流模式类型，控制工作流执行过程中 yield 的事件粒度
 */
export type StreamMode =
  | 'values'    /** 每步 yield 完整 state 快照 */
  | 'updates'   /** 每步 yield 节点输出的增量更新 { nodeId, output } */
  | 'messages'  /** yield LLM 消息粒度事件（token/tool_call/tool_result） */
  | 'debug'     /** yield 调试信息（超步开始/结束、任务调度、Channel 写入等） */
  | 'custom'    /** 自定义事件（由节点通过 runtime.emitEvent 发出） */

/**
 * updates 模式事件数据：节点增量输出
 * 业务侧用 output.type 区分 step_progress / step_reasoning / tool_call / tool_result
 */
export interface UpdatesEventData {
  /** 产出更新的节点ID */
  nodeId: string
  /** 节点输出的 Partial<State> */
  output: Record<string, any>
  /** 节点执行状态 */
  status: 'running' | 'success' | 'failed' | 'skipped'
  /** 错误信息（status=failed 时） */
  error?: string
}

/**
 * 流事件包装：业务侧用 mode 区分，用 event 输出透传各模式的具体数据结构
 */
export interface StreamEvent {
  /** 产生事件的模式 */
  mode: StreamMode
  /** 事件数据，结构随 mode 变化（updates 模式用 UpdatesEventData，其余模式透传对象） */
  event: UpdatesEventData | Record<string, any>
  /** 时间戳（毫秒） */
  timestamp: number
}
