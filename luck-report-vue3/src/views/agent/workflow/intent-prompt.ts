/**
 * 意图分析提示词
 * 用于工作流引擎第一步：让 LLM 分析用户意图，输出结构化 JSON
 *
 * 提示词文本统一存放在 src/prompt/plan/intent-analysis.md，
 * 通过 loadPromptDocByEnum('INTENT_ANALYSIS') 加载
 * 角色定义、报表说明、强制规则等由 system.md 统一提供
 */

import { loadPromptDocByEnum } from '@/prompt'
import type { ToolApiFormat } from '../tools/types'

/** 意图分析工具名称，用于 Function Calling 强制调用 */
export const INTENT_TOOL_NAME = 'analyze_intent'

/**
 * 获取意图分析的补充提示词
 * 从 prompt 目录加载意图分析规则和输出格式，角色定义由 system.md 提供
 * @returns 意图分析补充提示词文本，string
 */
export async function getIntentAnalysisPrompt(): Promise<string> {
  return loadPromptDocByEnum('INTENT_ANALYSIS')
}

/**
 * 构建意图分析的工具定义（Function Calling 格式）
 * 将意图分析伪装为一个工具调用，利用 Function Calling 机制强制 LLM 输出结构化 JSON，
 * 避免 LLM 输出自由文本导致解析失败
 *
 * @returns 工具定义列表（包含 analyze_intent 工具），ToolApiFormat[]
 */
export function buildIntentAnalysisTools(): ToolApiFormat[] {
  return [
    {
      name: INTENT_TOOL_NAME,
      description: '分析用户输入，判断用户意图并输出结构化的意图分析结果',
      inputSchema: INTENT_ANALYSIS_SCHEMA
    }
  ]
}

/**
 * 构建意图分析的强制工具调用策略
 * 设置 tool_choice 为强制调用 analyze_intent 工具，确保 LLM 必定以 Function Calling 格式输出
 *
 * @returns tool_choice 参数值，Object
 */
export function buildIntentToolChoice(): Record<string, any> {
  return {
    type: 'function',
    function: { name: INTENT_TOOL_NAME }
  }
}

/**
 * 意图分析的输出 JSON Schema
 * 用于约束 LLM 的输出格式，确保可解析
 */
export const INTENT_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    intentType: {
      type: 'string',
      enum: ['modify_report', 'analyze_report', 'create_report', 'irrelevant'],
      description: '用户意图类型'
    },
    needsDatasourceChange: {
      type: 'boolean',
      description: '是否涉及数据源/数据集的修改或读取'
    },
    needsCellChange: {
      type: 'boolean',
      description: '是否涉及单元格的修改或读取'
    },
    needsFormChange: {
      type: 'boolean',
      description: '是否涉及查询表单的修改或读取'
    },
    needsPageConfigChange: {
      type: 'boolean',
      description: '是否涉及页面配置的修改或读取'
    },
    needsRowColChange: {
      type: 'boolean',
      description: '是否涉及行列结构的修改'
    },
    needsBusinessKnowledge: {
      type: 'boolean',
      description: '是否需要搜索业务知识'
    },
    needsAgentKnowledge: {
      type: 'boolean',
      description: '是否需要搜索报表制作经验'
    },
    needsSchemaSearch: {
      type: 'boolean',
      description: '是否需要跨数据源搜索表结构'
    },
    requiredDocs: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'REPORT_DEFINITION', 'DATASOURCE_DATASET', 'CELL_COMMON_ATTRIBUTE',
          'SIMPLE_TEXT_CELL', 'EXPRESSION_CELL', 'DATASET_CELL', 'CHART_CELL',
          'IMAGE_CELL', 'BARCODE_CELL', 'QRCODE_CELL', 'DIAGONAL_HEADER_CELL',
          'CELL_CONDITIONAL_ATTRIBUTE', 'FORM_DESIGN', 'PAGE_CONFIG',
          'TABLE_ROW', 'TABLE_COL', 'CELL_RENDER_ORDER', 'PARENT_CELL_RELATION',
          'EXPRESSION', 'FUNCTION'
        ]
      },
      description: '需要加载的文档列表'
    },
    taskDescription: {
      type: 'string',
      description: '任务描述，用一句话概括用户要做什么'
    }
  },
  required: [
    'intentType', 'needsDatasourceChange', 'needsCellChange', 'needsFormChange',
    'needsPageConfigChange', 'needsRowColChange', 'needsBusinessKnowledge',
    'needsAgentKnowledge', 'needsSchemaSearch', 'requiredDocs', 'taskDescription'
  ]
}

/**
 * 获取步骤参数生成的提示词模板
 * 用于工作流中需要 LLM 生成工具参数的步骤
 * 角色定义由 system.md 统一提供，本模板只包含步骤上下文信息
 *
 * @param stepName - 步骤名称，string，不可为空
 * @param stepDescription - 步骤描述，string，不可为空
 * @param taskDescription - 任务描述，string，不可为空
 * @param previousResults - 前序步骤结果摘要，string，可为空
 * @returns 步骤参数生成提示词，string
 */
export function getStepPromptTemplate(
  stepName: string,
  stepDescription: string,
  taskDescription: string,
  previousResults?: string
): string {
  let prompt = `# 当前工作流步骤：${stepName}
步骤说明：${stepDescription}
用户需求：${taskDescription}`

  if (previousResults) {
    prompt += `\n前序步骤执行结果：\n${previousResults}`
  }

  prompt += `\n\n请根据以上信息，决定下一步操作。你可以调用一个或多个工具来完成当前步骤的任务。

【重要规则】：
1. 你只需要完成当前步骤"${stepName}"的任务，不要做其他步骤的事情
2. **思考工具调用策略**：
   - 检查当前步骤是否已经调用过某些工具，如果有，优先使用已获取的结果，避免重复调用
   - 如果需要对同一对象进行多次修改（如单元格的多个属性），尽量合并到一次工具调用中完成
   - 只有在确实需要新数据或需要重新执行操作时才调用工具
3. 完成任务后直接输出文本回复，不要再调用任何工具`

  return prompt
}
