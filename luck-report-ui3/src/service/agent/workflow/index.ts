/**
 * LangGraph 工作流引擎统一导出
 * 业务代码（task/ 下的子图）从这里导入所需能力
 *
 * 模块结构：
 * - api.ts                接口与类型
 * - state.ts                State Annotation
 * - context-annotation.ts   运行时 context Annotation + 守卫
 * - runtime-bridge.ts       WorkflowRuntime ↔ config.context 桥接
 * - node-wrapper.ts         节点包装高阶函数
 * - wrapper.ts              节点元数据查询
 */

// 类型与接口
export type {
    CompiledReportGraph,
    CompiledGraphFactory
} from './types'

// State Annotation
export {
    ReportStateAnnotation,
    ReportAgentInputAnnotation,
    ReportAgentOutputAnnotation
} from './state'
export type {
    ReportState,
    ReportStateUpdate,
    DatasourceInfo,
    DatasetInfo,
    SearchFormConfig,
    FormFieldConfig,
    FieldInfo,
    FilterCondition,
    IntentAnalysisResult
} from './state'

// Context Annotation + 守卫
export {
    WorkflowRuntimeAnnotation,
    requireContext,
    runtimeToContext
} from './context-annotation'
export type { WorkflowRuntimeContext } from '../context-annotation.ts'

// Runtime 桥接（#7 改动后仅保留 getRuntime；buildRunnableConfig/rebuildRuntime/invokeSubgraph/isLangGraphEngineEnabled 已删除）
export { getRuntime } from './runtime-bridge'

// 节点包装（#4 改动：删除未被调用的 subgraphNode）
export {
    withInput
} from './node-wrapper'
export type { NodeFunction, NodeWrapperOptions } from '../node-wrapper.ts'

// 任务计划抽象（TaskNode / Dispatcher / Summary）
export {
    PLANNER_TOOL_NAME,
    PLANNER_TASK_SCHEMA,
    EXECUTABLE_ACTIONS,
    SUMMARY_ACTION,
    validateTaskPlan,
    pickReadyTasks,
    isPlanDone,
    isPlanDead,
    propagateFailure,
    inferMissingDependsOn,
    checkPlanCoverage
} from './task-plan'
export type {
    TaskNode,
    TaskPlan,
    TaskStatus,
    TaskFailPolicy,
    TaskExecResult,
    TaskExecutor,
    ActionRegistry,
    ActionRegistryEntry,
    ExecutableAction
} from './task-plan'

// 节点工厂（Dispatcher / Summary）
export {
    buildDispatcherNode,
    buildSummaryNode
} from './dispatcher'

// 理解+规划节点（合并原 gather + planner）
// buildValidatePlanNode 是新名（原 buildCollectPlanNode 已移除）
export {
    buildUnderstandPlanNode,
    buildValidatePlanNode
} from './nodes/understand-plan-node'

// 中断信号
export { AskUserInterrupt } from './ask-user-interrupt'

// 常用 LangGraph 重新导出
export { StateGraph, Annotation, START, END, Command, Send, interrupt } from '@langchain/langgraph'

// 日志工具（#19 改动：替代散布的 console.log）
export { logger, setLogLevel, getLogLevel } from './logger'
export type { LogLevel, Logger } from './logger'
