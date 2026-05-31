/**
 * 工具定义接口
 * 参考 Claude Code 的 Tool<Input, Output> 类型，适配前端报表场景
 * 每个工具对应一个报表操作，LLM 通过 tool_use 调用，前端通过 PostMessage 执行
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
}

/**
 * 工具调用记录
 * 记录一次完整的工具调用生命周期
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
 * 工具定义的 API 格式
 * 发送给后台 LLM 的工具定义格式，遵循 Function Calling 协议
 */
export interface ToolApiFormat {
  /** 工具名称 */
  name: string
  /** 工具描述 */
  description: string
  /** 输入参数 JSON Schema */
  inputSchema: Record<string, any>
}
