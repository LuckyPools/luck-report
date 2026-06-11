/**
 * 流模式定义，参照 LangGraph StreamMode，定义工作流执行过程中的事件输出模式
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
 * 流事件包装，所有流式输出统一包装为此结构，适配层根据 mode 转换为旧版 WorkflowEvent
 */
export interface StreamEvent {
  /** 产生事件的模式 */
  mode: StreamMode
  /** 事件数据，结构随 mode 变化 */
  event: StreamEventData
  /** 时间戳 */
  timestamp: number
}

/**
 * 流事件数据联合类型，不同 StreamMode 对应不同的事件数据结构
 */
export type StreamEventData =
  | ValuesEventData
  | UpdatesEventData
  | MessagesEventData
  | DebugEventData
  | CustomEventData

/** values 模式事件数据：完整 state 快照 */
export interface ValuesEventData {
  /** 当前完整状态 */
  state: Record<string, any>
}

/** updates 模式事件数据：节点增量输出 */
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

/** messages 模式事件数据：LLM 消息粒度 */
export interface MessagesEventData {
  /** 消息类型 */
  type: 'token' | 'tool_call' | 'tool_result' | 'reasoning'
  /** 步骤ID */
  stepId: string
  /** 消息内容 */
  content: any
}

/** debug 模式事件数据：调试信息 */
export interface DebugEventData {
  /** 调试事件类型 */
  type: 'superstep_start' | 'superstep_end' | 'task_scheduled' | 'task_start' |
        'task_end' | 'channel_write' | 'node_triggered' | 'node_skipped'
  /** 调试消息 */
  message: string
  /** 附加数据 */
  data?: Record<string, any>
}

/** custom 模式事件数据：自定义事件 */
export interface CustomEventData {
  /** 自定义事件类型 */
  type: string
  /** 自定义事件数据 */
  data: any
}
