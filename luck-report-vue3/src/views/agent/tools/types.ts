/**
 * 工具定义接口，适配前端报表场景
 */
export interface ToolDefinition<TInput = any, TOutput = any> {
  /** 工具名称，唯一标识，如 "set_cell_value" */
  name: string
  /** 工具描述，供 LLM 理解工具用途和调用时机 */
  description: string
  /** 输入参数 JSON Schema，用于 LLM 生成调用参数和前端校验 */
  inputSchema: Record<string, any>
  /** 执行函数，通过 PostMessage 操作设计器 */
  execute: (input: TInput) => Promise<TOutput>
  /** 是否为只读工具（只读工具可并发执行，写操作需串行） */
  readOnly: boolean
  /** 是否需要用户确认才执行（高风险操作如删除、清空） */
  requireConfirm: boolean
  /** 参数校验函数，返回错误信息或 undefined（校验通过） */
  validate?: (input: TInput) => string | undefined
}

/**
 * 工具调用记录，包含调用ID、参数、结果、状态等
 */
export interface ToolCall {
  /** 调用唯一 ID，由 LLM 返回 */
  toolCallId: string
  /** 工具名称 */
  toolName: string
  /** 调用输入参数 */
  input: any
  /** 执行结果 */
  result?: any
  /** 执行错误信息 */
  error?: string
  /** 调用状态 */
  status: 'pending' | 'running' | 'confirming' | 'done' | 'error'
}

/**
 * 工具定义的 API 格式，遵循 Function Calling 协议
 */
export interface ToolApiFormat {
  /** 工具名称 */
  name: string
  /** 工具描述 */
  description: string
  /** 输入参数 JSON Schema */
  inputSchema: Record<string, any>
}

/**
 * 任务对象，用于展示 Agent 任务规划和执行进度
 */
export interface Task {
  /** 任务唯一标识 */
  id: string
  /** 任务描述内容 */
  content: string
  /** 任务状态 */
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  /** 依赖的任务ID列表 */
  dependencies?: string[]
  /** 工作流节点描述（当前正在执行的操作） */
  workflowNode?: string
  /** 任务执行时间戳 */
  timestamp?: number
  /** 父步骤ID，用于标识层级关系（子工作流步骤） */
  parentStepId?: string
}
