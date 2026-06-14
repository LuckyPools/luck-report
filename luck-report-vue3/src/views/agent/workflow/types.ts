/**
 * 意图分析结果类型定义
 * LLM 分析用户输入后输出的结构化意图，用于确定走哪个工作流以及步骤条件
 */

/**
 * 意图分析结果
 */
export interface IntentAnalysisResult {
  /** 用户意图类型 */
  intentType: 'modify_report' | 'analyze_report' | 'irrelevant' | 'create_report'
  /** 是否涉及数据源/数据集的操作（读取或修改） */
  needsDatasourceOperation: boolean
  /** 是否涉及单元格的操作（读取或修改） */
  needsCellOperation: boolean
  /** 是否涉及查询表单的操作（读取或修改） */
  needsFormOperation: boolean
  /** 是否涉及页面配置的操作（读取或修改） */
  needsPageConfigOperation: boolean
  /** 是否涉及行操作（行高调整、插入/删除行等） */
  needsRowOperation: boolean
  /** 是否涉及列操作（列宽调整、插入/删除列等） */
  needsColOperation: boolean
  /** 是否涉及业务知识查询 */
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
 */

import type { CompiledStateGraph } from '@langchain/langgraph'

/** 任务执行状态（运行时由 Dispatcher 写） */
export type TaskStatus = 'pending' | 'in_progress' | 'success' | 'failed' | 'skipped'

/** 任务失败策略 */
export type TaskFailPolicy = 'abort' | 'skip' | 'continue'

/**
 * 任务节点（通用抽象）
 * 任何"动作"都是 TaskNode：
 * - 读：read_datasources / read_datasets / read_cells ...
 * - 写：create_datasource / modify_dataset / modify_cell ...
 * - 收尾：summary
 * 循环、批处理、跨组件依赖都通过 params / dependsOn 表达，不为特定场景建专用节点
 */
export interface TaskNode {
  /** 任务唯一 ID（同 plan 内唯一），Planner 输出 t1/t2/... */
  id: string
  /** 任务动作，决定走哪个 executor */
  action: string
  /** 动作参数，透传给对应 executor / 子图 */
  params?: Record<string, any>
  /** 依赖的 task id 列表：所列任务全部 success 后本任务才可执行 */
  dependsOn?: string[]
  /** 失败策略：abort=中断后续 / skip=标 skipped 继续 / continue=忽略失败继续，默认 abort */
  onFail?: TaskFailPolicy
  /** 单任务最大重试次数（不含首次），默认 0 */
  maxRetries?: number
  /** 状态：运行时由 Dispatcher 写 */
  status?: TaskStatus
  /** 任务结果：运行时由 Dispatcher 写 */
  result?: any
  /** 错误信息：运行时由 Dispatcher 写 */
  error?: string
  /** 已重试次数：运行时由 Dispatcher 写 */
  retryCount?: number
}

/** 任务计划 = 任务节点列表 */
export type TaskPlan = TaskNode[]

/** 节点定义元数据（用于 UI 展示） */
export interface NodeMeta {
  type: 'node' | 'subgraph'
  description?: string
  /** 节点是否可跳过（运行时由 skipWhen 决定；此字段仅在静态构建期已知） */
  skippable?: boolean
}

/** 编译后图统一接口 = LangGraph CompiledStateGraph（适配器已删除） */
export type CompiledReportGraph = CompiledStateGraph<any, any, any, any, any, any, any, any, any, any>

/** 自建图（legacy）和 LangGraph 图（new）的工厂统一签名 */
export type CompiledGraphFactory = () => CompiledReportGraph
