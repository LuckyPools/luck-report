/**
 * LangGraph 工作流引擎统一导出
 * 业务代码（task/ 下的 9 个子图）从这里导入所需能力
 *
 * 模块结构：
 * - types.ts                接口与类型
 * - state.ts                State Annotation（含全部 25+ 字段）
 * - context-annotation.ts   运行时 context Annotation + 守卫
 * - runtime-bridge.ts       WorkflowRuntime ↔ config.context 桥接
 * - node-wrapper.ts         节点包装高阶函数
 * - wrapper.ts              节点元数据查询
 *
 * 典型用法（业务图）：
 * ```ts
 * import { StateGraph, START, END } from '@langchain/langgraph'
 * import {
 *   ReportStateAnnotation,
 *   WorkflowRuntimeAnnotation,
 *   withInput
 * } from '../index'
 *
 * const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
 *   .addNode('loadDocs', withInput(async (state, config, runtime) => {
 *     const result = await runtime.toolRegistry.executeTool('load_report_introduce', { fileNames: docs })
 *     return { searchResults: { docs: result } }
 *   }, { nodeName: 'loadDocs' }))
 *   .addEdge(START, 'loadDocs')
 *   .addEdge('loadDocs', END)
 *
 * export function createMyGraph() {
 *   return g.compile()
 * }
 * ```
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
    ModifyReportInputAnnotation,
    ModifyReportOutputAnnotation,
    AnalyzeReportInputAnnotation,
    AnalyzeReportOutputAnnotation
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

// 节点包装（事件发射统一走 runtime.emitEvent，节点直接调用，无 emit* 壳子）
export {
    withInput,
    subgraphNode
} from './node-wrapper'
export type { NodeFunction, NodeWrapperOptions } from '../node-wrapper.ts'

// 节点元数据查询（适配器已删除，这里只保留查询函数）
export {
    getCompiledNodeNames,
    getCompiledNode
} from './wrapper'

// 任务计划抽象（TaskNode / Dispatcher / Planner / Summary）
export {
    PLANNER_TOOL_NAME,
    PLANNER_TASK_SCHEMA,
    validateTaskPlan,
    pickReadyTasks,
    isPlanDone,
    isPlanDead,
    propagateFailure
} from './task-plan'
export type {
    TaskNode,
    TaskPlan,
    TaskStatus,
    TaskFailPolicy,
    TaskExecResult,
    TaskExecutor,
    ActionRegistry,
    ActionRegistryEntry
} from './task-plan'

// 节点工厂（Planner / Dispatcher / Summary）
export {
    buildPlannerNode,
    buildDispatcherNode,
    buildSummaryNode
} from './dispatcher'

// 常用 LangGraph 重新导出（业务代码直接从此处导入，简化路径）
export { StateGraph, Annotation, START, END, Command, Send, interrupt } from '@langchain/langgraph'
