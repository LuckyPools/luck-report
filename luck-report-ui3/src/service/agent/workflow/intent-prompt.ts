/**
 * 意图分析提示词，用于工作流引擎第一步让 LLM 分析用户意图输出结构化 JSON
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
 * 构建意图分析的工具调用策略
 * 使用 "auto" 让模型自行决定是否调用工具，兼容思考模式（qwen3.7 plus 等模型）
 * 提示词中已明确要求调用 analyze_intent 工具，LLM 通常会遵守
 *
 * @returns tool_choice 参数值，string
 */
export const INTENT_TOOL_CHOICE = 'auto'

/**
 * 意图分析的输出 JSON Schema
 * 用于约束 LLM 的输出格式，确保可解析
 *
 * 设计原则：意图阶段只判相关性，不判具体要改报表哪些部分。
 * needsBusinessKnowledge / needsAgentKnowledge / needsSchemaSearch 是前置 search_knowledge 节点的输入，
 * requiredDocs 是前置 load_docs 节点的输入，二者必须由意图阶段决定。
 * 涉及具体报表部位（cell/form/page/row/col/datasource）的判定交给后续 understand_and_plan 节点。
 */
export const INTENT_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    intentType: {
      type: 'string',
      enum: ['report_agent', 'create_report', 'irrelevant'],
      description: '用户意图类型：report_agent 统一接管所有报表相关需求（读+改由 Planner 自主规划），create_report 让用户先手动建报表，irrelevant 表示与报表无关'
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
    'intentType',
    'needsBusinessKnowledge', 'needsAgentKnowledge', 'needsSchemaSearch',
    'requiredDocs', 'taskDescription'
  ]
}


