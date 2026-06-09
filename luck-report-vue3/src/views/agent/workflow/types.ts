/**
 * 工作流编排类型定义
 * 代码驱动的工作流编排，替代纯提示词的任务规划方案
 * 核心思路：用代码控制步骤顺序和条件，只在参数生成环节让 LLM 参与
 */

/**
 * 数据源/数据集操作类型
 * 执行时由 LLM 路由判断，决定走哪个子工作流
 */
export type DatasourceOperationType =
  | 'modify_datasource'
  | 'delete_datasource'
  | 'create_dataset'
  | 'modify_dataset'
  | 'delete_dataset'

/**
 * 工作流步骤定义
 * 每个步骤声明需要调用的工具、是否需要 LLM 参与决策、执行条件等
 */
export interface WorkflowStep {
  /** 步骤唯一标识 */
  id: string
  /** 步骤名称，用于 UI 展示 */
  name: string
  /**
   * 需要调用的工具名称，与 ToolRegistry 中注册的工具名一致
   * 特殊值：
   * - '_llm_decide'：LLM 自主决策调用哪些工具
   * - '_subworkflow'：执行子工作流，需配合 subworkflowId 或 subworkflowSelector 使用
   */
  tool: string
  /** 是否需要 LLM 生成参数，false 则用固定参数或上一步结果 */
  needsLLM: boolean
  /** 参数模板，可用 {{stepId.field}} 引用前序步骤的结果 */
  paramTemplate?: Record<string, any>
  /** 动态参数生成器，优先级高于 paramTemplate，从上下文动态生成工具参数 */
  dynamicParams?: (context: WorkflowContext) => Record<string, any>
  /** 执行条件，返回 true 才执行，false 跳过 */
  condition?: (context: WorkflowContext) => boolean
  /** 是否为关键步骤，关键步骤失败则终止整个工作流 */
  critical?: boolean
  /** 最大重试次数，默认 0 */
  maxRetries?: number
  /** 步骤描述，供 LLM 理解该步骤的目的 */
  description?: string
  /** 是否为静默步骤，静默步骤不向用户输出步骤名称和跳过提示，默认 false */
  silent?: boolean
  /**
   * 子工作流ID，tool 为 '_subworkflow' 时使用
   * 与 SUBWORKFLOW_REGISTRY 中的 key 对应
   */
  subworkflowId?: string
  /**
   * 子工作流动态选择器，优先级高于 subworkflowId
   * 根据上下文动态选择要执行的子工作流ID
   */
  subworkflowSelector?: (context: WorkflowContext) => string
  /**
   * 允许调用的工具白名单（仅 _llm_decide 步骤生效）
   * 指定后，LLM 只能看到并调用白名单中的工具，其他工具对 LLM 不可见
   * 未指定则允许调用所有已注册工具
   * 示例：['get_datasources', 'select_datasource_operation']
   */
  allowedTools?: string[]
  /**
   * 必须成功执行的工具列表（仅 _llm_decide 步骤生效）
   * 步骤完成时校验：列表中的工具必须在 stepResults[stepId] 中存在且结果不为错误
   * 若校验不通过，步骤视为失败，不会继续往下执行
   * 示例：['preview_data', 'build_fields', 'add_dataset']
   */
  requiredToolResults?: string[]
  /**
   * 结果校验器，步骤执行成功后调用
   * 工具调用成功不代表业务语义正确（如 get_datasources 返回空数组），
   * 通过此校验器检查业务语义，返回错误信息则视为步骤失败
   * @param result - 工具执行结果
   * @param context - 工作流上下文
   * @returns 错误信息字符串，undefined 表示校验通过
   */
  resultValidator?: (result: any, context: WorkflowContext) => string | undefined
}

/**
 * 工作流定义
 * 一组有序步骤的集合，代表一类任务的完整执行流程
 */
export interface WorkflowDefinition {
  /** 工作流唯一标识 */
  id: string
  /** 工作流名称 */
  name: string
  /** 工作流描述 */
  description: string
  /** 有序步骤列表 */
  steps: WorkflowStep[]
}

/**
 * 意图分析结果
 * LLM 分析用户输入后输出的结构化意图，用于确定走哪个工作流以及步骤条件
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
  /** 是否涉及行列结构的操作（读取或修改） */
  needsRowColOperation: boolean
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
 * 工作流执行上下文
 * 在工作流执行过程中逐步积累的数据，供步骤间传递和条件判断
 */
export interface WorkflowContext {
  /** 用户原始输入 */
  userMessage: string
  /** 意图分析结果 */
  intent: IntentAnalysisResult
  /** 各步骤执行结果，key 为步骤 id */
  stepResults: Record<string, any>
  /** 当前报表状态快照 */
  reportState?: any
  /** 会话ID */
  sessionId?: string
}

/**
 * 工作流步骤执行状态
 */
export type WorkflowStepStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'error'

/**
 * 工作流步骤执行记录
 * 记录每个步骤的执行状态和结果
 */
export interface WorkflowStepRecord {
  /** 步骤 id */
  stepId: string
  /** 步骤名称 */
  stepName: string
  /** 执行状态 */
  status: WorkflowStepStatus
  /** 执行结果 */
  result?: any
  /** 错误信息 */
  error?: string
  /** 重试次数 */
  retryCount: number
  /** 父步骤ID，用于标识层级关系（子工作流步骤） */
  parentStepId?: string
}

/**
 * 工作流执行结果
 */
export interface WorkflowResult {
  /** 工作流 id */
  workflowId: string
  /** 是否全部成功 */
  success: boolean
  /** 各步骤执行记录 */
  stepRecords: WorkflowStepRecord[]
  /** 最终汇总信息 */
  summary?: string
  /** 错误信息（工作流级别） */
  error?: string
}

/**
 * 工作流事件类型
 * 工作流引擎执行过程中通过回调向外暴露各种事件
 */
export type WorkflowEvent =
  | { type: 'workflow_start'; workflowId: string }
  | { type: 'step_start'; stepId: string; stepName: string; silent?: boolean }
  | { type: 'step_progress'; stepId: string; message: string }
  | { type: 'step_complete'; stepId: string; result?: any }
  | { type: 'step_skip'; stepId: string; reason: string; silent?: boolean }
  | { type: 'step_error'; stepId: string; error: string }
  | { type: 'workflow_complete'; result: WorkflowResult }
  | { type: 'llm_call'; stepId: string; prompt: string }
  | { type: 'llm_response'; stepId: string; response: string }
  | { type: 'step_reasoning'; stepId: string; content: string }
  | { type: 'tool_call'; stepId: string; toolCallId: string; toolName: string; input: any }
  | { type: 'tool_result'; stepId: string; toolCallId: string; toolName: string; result: any; error?: string }
