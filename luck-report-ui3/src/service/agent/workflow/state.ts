/**
 * LangGraph 状态层定义
 * 用 Annotation.Root 表达 ReportWorkflowState，参照 [graph/state.ts] 的字段声明
 * 字段 reducer 行为与自建引擎严格对齐
 */

import { Annotation } from '@langchain/langgraph'
import type { IntentAnalysisResult } from './types.ts'
import type { TaskNode } from './task-plan.ts'

// ==================== 字段类型定义（与自建引擎一致） ====================

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

/** 筛选条件定义 */
export interface FilterCondition {
  columnName: string
  paramName: string
  operator: string
  label: string
}

/** 意图分析结果（复用父目录 api.ts 里的真实结构） */
export type { IntentAnalysisResult }

/** 步骤执行记录 */
export interface WorkflowStepRecord {
  stepId: string
  stepName: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'error' | 'skipped'
  result?: any
  error?: string
  retryCount: number
  parentStepId?: string
  duration?: number
  timestamp?: number
}

// ==================== State Annotation ====================

/**
 * ReportWorkflowState LangGraph 版本
 * 每个字段 reducer 严格对应 [graph/state.ts] 中的 StateFieldReducer 行为
 * - overwrite: 后写覆盖（b ?? a 保证 null 不覆盖已有值）
 * - binop: 自定义合并（searchResults 用对象展开，retryCount 用累加）
 * - append: 数组追加
 * - ephemeral: 步末清空（每次 invoke 重置）
 */
export const ReportStateAnnotation = Annotation.Root({
  // ==================== overwrite 字段（业务数据） ====================
  userMessage: Annotation<string>(),
  /** 用户的原始需求（不含 ask_user enriched 前缀），供子图推断表名等业务逻辑使用 */
  originalUserMessage: Annotation<string>({
    reducer: (oldVal, newVal) => {
      if (!newVal) return oldVal
      // 如果新值包含 enriched 前缀，且旧值已存在且不含 enriched 前缀，保留旧值
      if (newVal.includes('【上一轮 ask_user 任务】') && oldVal && !oldVal.includes('【上一轮 ask_user 任务】')) {
        return oldVal
      }
      return newVal
    }
  }),
  intent: Annotation<IntentAnalysisResult>(),
  datasources: Annotation<DatasourceInfo[]>({
    reducer: (a, b) => b ?? a,
    default: () => []
  }),
  datasets: Annotation<DatasetInfo[]>({
    reducer: (a, b) => b ?? a,
    default: () => []
  }),
  dataset: Annotation<Record<string, any> | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),
  targetDatasourceName: Annotation<string | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),
  targetTableNames: Annotation<string[]>({
    reducer: (a, b) => b ?? a,
    default: () => []
  }),
  tableStructures: Annotation<Record<string, any> | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),
  datasetTemplate: Annotation<Record<string, any> | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),
  sqlValidationResult: Annotation<{ success: boolean; data?: any; error?: string } | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),
  fieldsResult: Annotation<{ success: boolean; fields?: FieldInfo[]; error?: string } | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),
  datasetWriteResult: Annotation<{ success: boolean; message?: string; error?: string; datasetId?: string } | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),
  searchForm: Annotation<SearchFormConfig | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),
  filterAnalysis: Annotation<{ conditions: FilterCondition[] } | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),
  cellsData: Annotation<Record<string, any> | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),
  rowData: Annotation<Record<string, any>[] | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),
  colData: Annotation<Record<string, any>[] | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),
  pageConfig: Annotation<Record<string, any> | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),
  headerConfig: Annotation<Record<string, any> | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),
  footerConfig: Annotation<Record<string, any> | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),

  // ==================== append 字段 ====================
  errors: Annotation<string[]>({
    reducer: (a, b) => a.concat(b ?? []),
    default: () => []
  }),
  stepRecords: Annotation<WorkflowStepRecord[]>({
    reducer: (a, b) => a.concat(b ?? []),
    default: () => []
  }),

  // ==================== binop 字段 ====================
  /** 多源合并：load_docs / search_business / search_agent / search_schema 并行写，最终给 plan_tasks 用 */
  searchResults: Annotation<Record<string, any>>({
    reducer: (a, b) => ({ ...a, ...(b ?? {}) }),
    default: () => ({})
  }),
  retryCount: Annotation<number>({
    reducer: (a, b) => a + (b ?? 0),
    default: () => 0
  }),

  /** select_datasource_op 节点的工具调用结果，供 apply_datasource_type 读取 operationType */
  select_datasource_operation: Annotation<Record<string, any> | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),

  // ==================== 任务计划（TaskPlan / Dispatcher）==================
  /** 任务计划，由 plan_execution 节点生成，Dispatcher 自环执行 */
  taskPlan: Annotation<TaskNode[]>({
    reducer: (a, b) => b ?? a,
    default: () => []
  }),
  /** 任务执行结果，key 为 task id；用于 summary 节点汇总、跨任务读数据 */
  taskResults: Annotation<Record<string, any>>({
    reducer: (a, b) => ({ ...a, ...(b ?? {}) }),
    default: () => ({})
  }),
  /** Planner 失败时的错误信息；Dispatcher 看到非空时直接进 summary。
   *  注意：null 表示"规划成功"，必须能覆盖旧错误值（否则第二轮成功后仍死循环）。
   *  与其他字段的 `b ?? a` 不同，这里直接用新值，因为 plannerError 只在 understand_and_plan 节点设置，无并发问题。 */
  plannerError: Annotation<string | null>({
    reducer: (_, b) => b,
    default: () => null
  }),
  /**
   * 重规划计数器（#A 改动）
   * - validate_plan 校验失败时 +1
   * - 条件边据此判断是否回灌 understand_and_plan 重规划
   * - 上限 2（即最多重规划 2 次），超限进 summary 报告错误
   * - reducer 用 max 语义：并发更新时取最大值，避免漏计
   */
  replanRound: Annotation<number>({
    reducer: (a, b) => Math.max(a ?? 0, b ?? 0),
    default: () => 0
  }),
  /** 任务计划最大调度轮次（防止死循环），由主图常量传入 */
  planMaxRounds: Annotation<number | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),
  /** Dispatcher 自环计数器：每轮自增 1，主图条件边据此判断是否进 summary */
  dispatchRound: Annotation<number>({
    reducer: (a, b) => b ?? 0,
    default: () => 0
  }),
  /** 任务参数透传：Dispatcher invoke 子图前把 task.params 注入到这里，子图 LLM Decider 可读 */
  taskParams: Annotation<Record<string, any> | null>({
    reducer: (a, b) => b ?? a,
    default: () => null
  }),

  // ==================== 旁路字段（注入 reportState 即可，其它依赖走 runtime.context） ====================
  /** 当前主报表对象（来自父图 reportState），节点只读 */
  reportState: Annotation<any>({
    reducer: (a, b) => b ?? a,
    default: () => null
  })
  // 备注：原 __docCache / __memoryManager 旁路字段已删除。这些字段本应属于 runtime
  // 上下文（runtime.memoryManager / runtime.cacheManager），不应占 State 槽位。
  // 原 __executed_* 幂等位字段也已删除，LLM 节点通过 maxIterations 内部循环即可完成写入，
  // 重复触发问题由 addConditionalEdges 按状态值路由解决。
})

/** 状态类型导出（业务代码 typeof ReportStateAnnotation.State） */
export type ReportState = typeof ReportStateAnnotation.State
/** 节点返回的更新类型（业务代码 typeof ReportStateAnnotation.Update） */
export type ReportStateUpdate = typeof ReportStateAnnotation.Update

// ==================== Input/Output Schema 工厂 ====================

/** report_agent 入口需要的 input 字段 */
export const ReportAgentInputAnnotation = Annotation.Root({
  userMessage: Annotation<string>(),
  originalUserMessage: Annotation<string>(),
  intent: Annotation<IntentAnalysisResult>(),
  reportState: Annotation<any>()
})

/** report_agent 出口需要的 output 字段（包含 read + write 两类所需字段） */
export const ReportAgentOutputAnnotation = Annotation.Root({
  searchResults: Annotation<Record<string, any>>(),
  cellsData: Annotation<Record<string, any> | null>(),
  datasources: Annotation<DatasourceInfo[]>(),
  datasets: Annotation<DatasetInfo[]>(),
  rowData: Annotation<Record<string, any>[] | null>(),
  colData: Annotation<Record<string, any>[] | null>(),
  pageConfig: Annotation<Record<string, any> | null>(),
  headerConfig: Annotation<Record<string, any> | null>(),
  footerConfig: Annotation<Record<string, any> | null>(),
  searchForm: Annotation<SearchFormConfig | null>(),
  errors: Annotation<string[]>()
})
