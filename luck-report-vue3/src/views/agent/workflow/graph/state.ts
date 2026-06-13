/**
 * 工作流全局状态定义，参照 LangGraph Annotation 模式，每个字段通过 reducer 决定如何合并
 */

// ==================== Reducer 配置 ====================

/**
 * 字段 reducer 配置，参照 LangGraph Annotation 中每个字段声明 reducer 的模式
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
 * 工作流全局状态，参照 LangGraph Annotation 模式，每个字段通过 reducer 决定如何合并
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
  /** 单个待写入的数据集对象（overwrite）：createDatasetGraph 在 build/validate/add 阶段之间传递 */
  dataset: Record<string, any> | null
  /** 选中的目标数据源名称（overwrite）：createDatasetGraph 在 pick_datasource 阶段锁定，build 阶段使用 */
  targetDatasourceName: string | null
  /** 选中的目标表名列表（overwrite）：resolve_table 解析出的物理表名 */
  targetTableNames: string[]
  /** 数据源表结构信息（overwrite）：resolve_table 写入 ResolvedSchema，build_dataset 只读 */
  tableStructures: Record<string, any> | null
  /** SQL 数据集模板（overwrite）：fetch_dataset_template 节点取数后写入，compose_dataset 节点使用 */
  datasetTemplate: Record<string, any> | null
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
  /** 行数据（overwrite）：modifyRowGraph 读到的行定义数组（来自 get_rows） */
  rowData: Record<string, any>[] | null
  /** 列数据（overwrite）：modifyColGraph 读到的列定义数组（来自 get_columns） */
  colData: Record<string, any>[] | null
  /** 页面配置（overwrite） */
  pageConfig: Record<string, any> | null
  /** 页眉配置（overwrite） */
  headerConfig: Record<string, any> | null
  /** 页脚配置（overwrite） */
  footerConfig: Record<string, any> | null
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
 * State Schema 注册表，编译时将 ReportWorkflowState 编译为字段 → Channel 的映射
 */
export const reportStateSchema: Record<keyof ReportWorkflowState, StateFieldReducer<any>> = {
  userMessage:        { kind: 'overwrite' },
  intent:             { kind: 'overwrite' },
  datasources:        { kind: 'overwrite', initial: [] },
  datasets:           { kind: 'overwrite', initial: [] },
  dataset:            { kind: 'overwrite', initial: null },
  targetDatasourceName: { kind: 'overwrite', initial: null },
  targetTableNames:   { kind: 'overwrite', initial: [] },
  tableStructures:    { kind: 'overwrite', initial: null },
  datasetTemplate:    { kind: 'overwrite', initial: null },
  sqlValidationResult:{ kind: 'overwrite', initial: null },
  fieldsResult:       { kind: 'overwrite', initial: null },
  datasetWriteResult: { kind: 'overwrite', initial: null },
  searchForm:         { kind: 'overwrite', initial: null },
  cellsData:          { kind: 'overwrite', initial: null },
  rowData:            { kind: 'overwrite', initial: null },
  colData:            { kind: 'overwrite', initial: null },
  pageConfig:         { kind: 'overwrite', initial: null },
  headerConfig:       { kind: 'overwrite', initial: null },
  footerConfig:       { kind: 'overwrite', initial: null },
  errors:             { kind: 'append', initial: [] },
  stepRecords:        { kind: 'append', initial: [] },
  searchResults:      { kind: 'binop', operator: (a, b) => ({ ...a, ...b }), initial: {} },
  retryCount:         { kind: 'binop', operator: (a, b) => a + b, initial: 0 }
}
