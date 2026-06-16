/**
 * ask_user 中断信号
 *
 * 触发时机：
 * - understand_and_plan 节点 LLM 调用 ask_user 工具时（interruptOnCall 拦截路径）
 * - 任何其它后续阶段如检测到 ask_user 工具被调用，也应抛此信号（防御性）
 *
 * 传播路径：
 * LLM Decider 节点 throw → LangGraph stream 异常退出 → agent-loop catch →
 * 转发为 done(reason='awaiting_user') 事件给 UI → UI 收集用户回复后重启 runAgentLoop
 */

export class AskUserInterrupt extends Error {
  readonly code = 'ASK_USER'
  /** 触发源标识（ask_user 工具名 或 task id） */
  readonly taskId: string
  /** 提问文本 */
  readonly question: string
  /** 可选项（多选一时） */
  readonly options?: string[]

  constructor(taskId: string, question: string, options?: string[]) {
    super(`ask_user 触发用户输入中断：${question}`)
    this.name = 'AskUserInterrupt'
    this.taskId = taskId
    this.question = question
    this.options = options
  }
}
