/**
 * 工作流全局状态定义
 * 参照 LangGraph Annotation 模式，每个字段通过 reducer 决定如何合并
 *
 * 核心设计：
 * - 每个状态字段配套 reducer（与 LangGraph Annotation 一致）
 * - BinaryOperatorAggregateChannel 是 reducer 的载体
 * - 节点的 return Partial<ReportWorkflowState> 通过 reducer 合并到全局 state
 */

// ==================== Reducer 配置 ====================

/**
 * 字段 reducer 配置
 * 参照 LangGraph Annotation 中每个字段声明 reducer 的模式
 */
export type StateFieldReducer<T> =
  /** 覆盖式写入（单值字段） */
  | { kind: 'overwrite'; initial?: T }
  /** 二元运算合并（自定义 reducer） */
  | { kind: 'binop'; operator: (current: T, update: T) => T; initial: T }
  /** 累加（数组追加） */
  | { kind: 'append'; initial?: T[] }
  /** 步末清空（触发信号，如 __start__） */
  | { kind: 'ephemeral'; initial?: T }

// ==================== 具体类型定义 ====================

/** 数据源信息类型 */
export interface DatasourceInfo {
  id: string
  name: string
  type: string
  config: Record<string, any>
}

/** 数据集信息类型 */
export interface DatasetInfo {
  id: string
  name: string
  sql: string
  datasourceName: string
  fields?: FieldInfo[]
}

/** 查询表单配置类型 */
export interface SearchFormConfig {
  datasetId: string
  fields: FormFieldConfig[]
  layout?: Record<string, any>
}

/** 表单字段配置 */
export interface FormFieldConfig {
  name: string
  label: string
  type: string
  required?: boolean
  defaultValue?: any
}

/** 字段信息类型 */
export interface FieldInfo {
  name: string
  type: string
  label?: string
  aggregation?: string
}

/** 意图分析结果（复用旧类型） */
export type { IntentAnalysisResult } from '../types'

/** 步骤执行记录 */
export interface WorkflowStepRecord {
  /** 步骤ID */
  stepId: string
  /** 步骤名称 */
  stepName: string
  /** 执行状态 */
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'error' | 'skipped'
  /** 执行结果 */
  result?: any
  /** 错误信息 */
  error?: string
  /** 重试次数 */
  retryCount: number
  /** 父步骤ID（子工作流步骤） */
  parentStepId?: string
  /** 执行耗时（毫秒） */
  duration?: number
  /** 时间戳 */
  timestamp?: number
}

// ==================== 工作流状态 ====================

/**
 * 工作流全局状态
 * 参照 LangGraph Annotation 模式，每个字段通过 reducer 决定如何合并
 */
export interface ReportWorkflowState {
  /** 用户原始输入 */
  userMessage: string
  /** 意图分析结果 */
  intent: any
  /** 数据源列表（overwrite：后写覆盖） */
  datasources: DatasourceInfo[]
  /** 数据集列表（overwrite） */
  datasets: DatasetInfo[]
  /** SQL 校验结果（overwrite：失败时保持 null） */
  sqlValidationResult: { success: boolean; data?: any; error?: string } | null
  /** 字段解析结果（overwrite） */
  fieldsResult: { success: boolean; fields?: FieldInfo[]; error?: string } | null
  /** 数据集写入结果（overwrite） */
  datasetWriteResult: { success: boolean; message?: string; error?: string; datasetId?: string } | null
  /** 查询表单配置（overwrite） */
  searchForm: SearchFormConfig | null
  /** 单元格数据（overwrite） */
  cellsData: Record<string, any> | null
  /** 页面配置（overwrite） */
  pageConfig: Record<string, any> | null
  /** 错误信息（append：跨节点累加） */
  errors: string[]
  /** 步骤执行记录（append：累加） */
  stepRecords: WorkflowStepRecord[]
  /** 搜索结果（binop：多源合并，每源覆盖同名字段） */
  searchResults: Record<string, any>
  /** 重试计数（binop：累加 +1） */
  retryCount: number
}

// ==================== State Schema 注册表 ====================

/**
 * State Schema 注册表
 * 编译时将 ReportWorkflowState 编译为字段 → Channel 的映射
 * compile() 自动遍历此表创建对应 Channel 实例
 */
export const reportStateSchema: Record<keyof ReportWorkflowState, StateFieldReducer<any>> = {
  userMessage:        { kind: 'overwrite' },
  intent:             { kind: 'overwrite' },
  datasources:        { kind: 'overwrite', initial: [] },
  datasets:           { kind: 'overwrite', initial: [] },
  sqlValidationResult:{ kind: 'overwrite', initial: null },
  fieldsResult:       { kind: 'overwrite', initial: null },
  datasetWriteResult: { kind: 'overwrite', initial: null },
  searchForm:         { kind: 'overwrite', initial: null },
  cellsData:          { kind: 'overwrite', initial: null },
  pageConfig:         { kind: 'overwrite', initial: null },
  errors:             { kind: 'append', initial: [] },
  stepRecords:        { kind: 'append', initial: [] },
  searchResults:      { kind: 'binop', operator: (a, b) => ({ ...a, ...b }), initial: {} },
  retryCount:         { kind: 'binop', operator: (a, b) => a + b, initial: 0 }
}
