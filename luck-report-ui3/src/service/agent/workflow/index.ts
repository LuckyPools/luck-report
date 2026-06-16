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
    CompiledGraphFactory,
    NodeMeta
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
    IntentAnalysisResult,
    WorkflowStepRecord
} from './state'

// Context Annotation + 守卫
export {
    WorkflowRuntimeAnnotation,
    requireContext,
    runtimeToContext
} from './context-annotation'
export type { WorkflowRuntimeContext } from '../context-annotation.ts'

// Runtime 桥接
export {
    buildRunnableConfig,
    getRuntime,
    rebuildRuntime,
    invokeSubgraph,
    isLangGraphEngineEnabled
} from './runtime-bridge'

// 节点包装
export {
    withInput,
    subgraphNode
} from './node-wrapper'
export type { NodeFunction, NodeWrapperOptions } from '../node-wrapper.ts'

// 节点元数据查询
export {
    getCompiledNodeNames,
    getCompiledNode
} from './wrapper'

// 任务计划抽象（TaskNode / Dispatcher / Summary）
export {
    PLANNER_TOOL_NAME,
    PLANNER_TASK_SCHEMA,
    EXECUTABLE_ACTIONS,
    validateTaskPlan,
    pickReadyTasks,
    isPlanDone,
    isPlanDead,
    propagateFailure,
    generateFallbackPlan
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
export {
    buildUnderstandPlanNode,
    buildCollectPlanNode
} from './nodes/understand-plan-node'

// 中断信号
export { AskUserInterrupt } from './ask-user-interrupt'

// 常用 LangGraph 重新导出
export { StateGraph, Annotation, START, END, Command, Send, interrupt } from '@langchain/langgraph'
