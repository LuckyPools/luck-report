import type { ToolDefinition } from './types'
import { vectorSearch } from '@/api/vector'
import { validateExpression, validateCondition, saveReport } from '@/utils/tools'

/**
 * 工具执行结果常量
 */
export const ToolResult = {
  SUCCESS: { success: true, message: '执行成功' },
  ERROR: { success: false, message: '执行失败' }
} as const

/**
 * 创建工具执行结果，用于生成包含详细信息的返回值
 *
 * @param success - 是否成功，boolean，不可为空
 * @param message - 提示信息，string，不可为空
 * @param data - 可选的业务数据，any，可为空
 * @returns 标准工具返回结构 { success, message, data? }
 */
export function createToolResult(success: boolean, message: string, data?: any): { success: boolean; message: string; data?: any } {
  return { success, message, data }
}

/**
 * 搜索业务知识工具
 */
export const searchBusinessKnowledgeTool: ToolDefinition<{
  query: string;
  topK?: number;
}> = {
  name: 'search_business_knowledge',
  description: '搜索业务知识和术语。当用户询问与实际业务相关的问题、需要了解业务术语、业务规则或业务背景知识时调用此工具。',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: '搜索关键词，如"销售额计算规则"、"客户等级分类"、"库存预警逻辑"' },
      topK: { type: 'integer', description: '返回条数，默认5' }
    },
    required: ['query']
  },
  execute: async ({ query, topK }) => {
    return vectorSearch({
      query,
      vectorType: 'businessTerm',
      topK: topK ?? 5,
      threshold: 0.5
    })
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 搜索智能体知识工具
 */
export const searchAgentKnowledgeTool: ToolDefinition<{
  query: string;
  topK?: number;
}> = {
  name: 'search_agent_knowledge',
  description: '搜索报表制作的经验、案例和最佳实践。当遇到难以解决的报表问题、需要参考案例或了解报表设计经验时调用此工具。',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: '搜索关键词，如"动态列报表"、"分组汇总"、"条件格式化"' },
      topK: { type: 'integer', description: '返回条数，默认5' }
    },
    required: ['query']
  },
  execute: async ({ query, topK }) => {
    return vectorSearch({
      query,
      vectorType: 'agentKnowledge',
      topK: topK ?? 5,
      threshold: 0.5
    })
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 校验单元格表达式语法工具
 */
export const validateExpressionTool: ToolDefinition<{
  expression: string;
}> = {
  name: 'validate_expression',
  description: '校验单元格表达式的语法正确性。传入表达式内容，返回校验结果（通过/未通过及错误信息）。用于验证表达式单元格、图片表达式、二维码/条码表达式等。',
  inputSchema: {
    type: 'object',
    properties: {
      expression: { type: 'string', description: '待校验的表达式内容' }
    },
    required: ['expression']
  },
  execute: async ({ expression }) => {
    return validateExpression({ expression })
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 条件表达式逻辑校验工具
 */
export const validateConditionTool: ToolDefinition<{
  expression: string;
}> = {
  name: 'validate_condition',
  description: '校验条件表达式的逻辑语法正确性。用于验证条件样式、数据过滤等场景中的条件表达式，返回校验结果（通过/未通过及错误信息）。',
  inputSchema: {
    type: 'object',
    properties: {
      expression: { type: 'string', description: '待校验的条件表达式' }
    },
    required: ['expression']
  },
  execute: async ({ expression }) => {
    return validateCondition({ expression })
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 保存报表工具
 */
export const saveReportTool: ToolDefinition<{
  fileName?: string;
}> = {
  name: 'save_report',
  description: '保存当前报表。将设计器中的报表数据保存到服务器。可选传入fileName指定文件名（不含.ureport.xml后缀），不传则使用当前已打开的文件名。',
  inputSchema: {
    type: 'object',
    properties: {
      fileName: { type: 'string', description: '报表文件名，不含.ureport.xml后缀。不传则使用当前文件名' }
    },
    required: []
  },
  execute: async ({ fileName }) => {
    return saveReport({ fileName })
  },
  readOnly: false,
  requireConfirm: false
}

