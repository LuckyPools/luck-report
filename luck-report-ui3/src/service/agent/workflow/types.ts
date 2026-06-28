/**
 * 意图分析结果类型定义
 * LLM 分析用户输入后输出的结构化意图，用于确定走哪个工作流以及步骤条件
 */

/**
 * 意图分析结果
 *
 * 设计原则：意图阶段只回答"用户输入是否与报表相关"这一核心问题，
 * 具体要改报表哪些部分、要加载哪些文档等需求理解工作，交给后续 understand_and_plan 节点完成。
 */
export interface IntentAnalysisResult {
  /** 用户意图类型：report_agent 统一接管所有报表相关需求，由 Planner 自主规划读/写混排 */
  intentType: 'report_agent' | 'irrelevant' | 'create_report'
  /** 是否需要业务知识查询 */
  needsBusinessKnowledge: boolean
  /** 是否需要参考报表制作经验 */
  needsAgentKnowledge: boolean
  /** 是否需要跨数据源搜索表结构 */
  needsSchemaSearch: boolean
  /** 需要加载的文档列表 */
  requiredDocs: string[]
  /** 任务描述，供后续步骤的 LLM 参考 */
  taskDescription: string
}

/**
 * LangGraph 适配层类型定义
 * 业务代码直接复用 LangGraph CompiledStateGraph 类型，不再自定义
 *
 * 注意：TaskNode / TaskPlan / TaskStatus / TaskFailPolicy 统一定义在 task-plan.ts，
 * 此处不再重复定义，避免维护两份不同步
 */

import type { CompiledStateGraph } from '@langchain/langgraph'

/** 节点定义元数据（用于 UI 展示） */
export interface NodeMeta {
  type: 'node' | 'subgraph'
  description?: string
  skippable?: boolean
}

/** 编译后图统一接口 = LangGraph CompiledStateGraph */
export type CompiledReportGraph = CompiledStateGraph<any, any, any, any, any, any, any, any, any, any>

/** 自建图（legacy）和 LangGraph 图（new）的工厂统一签名 */
export type CompiledGraphFactory = () => CompiledReportGraph
