/**
 * ask_user 工具定义
 *
 * 关键设计：
 * - 这是一个"中断型工具"，通过 interruptOnCall 标志让 LLM Decider 节点在调用时
 *   直接抛出 AskUserInterrupt 中断整个图执行（execute 不会被调用）
 * - 唯一允许调用的阶段是 understand_and_plan（理解需求 + 规划任务阶段）
 * - 一旦需求确认进入 dispatch_task，allowedTools 中不再包含此工具，
 *   LLM 在执行阶段物理上无法提问
 */

import type { ToolDefinition } from './types'

/** ask_user 工具：调用时立即抛出 AskUserInterrupt 中断当前图执行 */
export const askUserTool: ToolDefinition<{ question: string; options?: string[] }, never> = {
  name: 'ask_user',
  description:
    '向用户提问以补齐需求信息。仅在 understand_and_plan 阶段（分析需求时）允许调用。\n' +
    '【使用规范】\n' +
    '- question 必须精准单点，禁止一次性问多个独立字段（如禁止"请提供名称、类型、连接信息"）。\n' +
    '- 如果需要补齐多个字段，应多次调用本工具，每次只问一个。\n' +
    '- 禁止问已知信息（用户上一轮已说过的内容不要再问）。\n' +
    '- options 数组是可选的多选一备选项；不传或传空数组表示用户自由输入。\n' +
    '- 当信息已足够确定需求时，禁止调用本工具，必须改调 plan_tasks 提交任务计划。',
  inputSchema: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: '提问文本，必须精准指向一个缺失的字段'
      },
      options: {
        type: 'array',
        items: { type: 'string' },
        description: '可选项（多选一时填），空数组/不传表示用户自由输入'
      }
    },
    required: ['question']
  },
  // execute 不会被调用（interruptOnCall 在 LLM Decider 节点被识别后直接抛中断）
  execute: () => {
    throw new Error('ask_user 工具通过 interruptOnCall 处理，execute 不应被调用')
  },
  readOnly: true,
  requireConfirm: false,
  interruptOnCall: 'ask_user'
}
