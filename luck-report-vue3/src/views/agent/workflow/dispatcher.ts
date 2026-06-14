/**
 * Planner / Dispatcher / Summary 节点工厂
 * 与 task-plan.ts 的纯数据/算法分离，本文件负责把数据接到 LangGraph 节点
 *
 * Planner:   LLM Decider 包装，用 Function Calling 强制输出结构化 TaskPlan JSON
 * Dispatcher: 代码节点，自环执行 TaskPlan（拓扑 + 失败策略）
 * Summary:    LLM Decider 包装，把所有 taskResult 汇总成自然语言回答
 */

import { withInput, runtimeToContext } from './index.ts'
import { createLLMDecideNode } from './nodes/llm-decide-node.ts'
import { createToolCallNode } from './nodes/tool-call-node.ts'
import type { LangGraphRunnableConfig } from '@langchain/langgraph'
import type { WorkflowRuntime } from './runtime.ts'
import type { ReportState, ReportStateUpdate } from './state.ts'
import type { TaskNode, TaskPlan, TaskExecResult, ActionRegistry } from './task-plan.ts'
import {
  PLANNER_TOOL_NAME,
  PLANNER_TASK_SCHEMA,
  isPlanDone,
  isPlanDead,
  pickReadyTasks,
  propagateFailure,
  validateTaskPlan
} from './task-plan.ts'
import { filterActiveErrors } from './utils.ts'

/**
 * Planner 节点工厂（LLM Decider 包装）
 * 通过 Function Calling 强制 LLM 输出 TaskPlan JSON（参考 analyze_intent 模式）
 * @param options - 配置
 * @param options.systemRole  - system 提示词角色名（默认 'planner'）
 * @param options.maxRetries  - Planner 自身重试次数（默认 2；thinking mode 下 LLM 倾向"先文本说明再调工具"，第 1 轮失败时由 done 分支发"系统强制提示"，第 2 轮改用 function calling）
 * @returns LangGraph 节点函数
 */
export function buildPlannerNode(options?: { systemRole?: string; maxRetries?: number }) {
  return createLLMDecideNode({
    nodeId: 'plan_tasks',
    allowedTools: [PLANNER_TOOL_NAME],
    requiredToolResults: [PLANNER_TOOL_NAME],
    maxIterations: options?.maxRetries ?? 2,
    // 关键决策点：planner 是虚拟工具，结果需要落到 state.taskResults（state 已声明的字段）才能被 collectPlan 读
    // resultKeyAsObject=true 让 toolResults 按 toolName 分键：{ taskResults: { plan_tasks: {tasks:[...]} } }
    resultKey: 'taskResults',
    resultKeyAsObject: true,
    description:
      '【唯一任务】立刻调用 plan_tasks 工具，**禁止**调用其他任何工具。\n' +
      '【禁止】不要重复审视历史对话、不要重新分析用户意图、不要纠结字段。意图已经由 analyze_intent 分析好，你只负责"翻译"。\n' +
      '【禁止】不要在思考里长篇大论，看到意图后 1 步内就调工具，思考控制在 200 字以内。\n' +
      '【决策要点】把用户需求拆成 TaskPlan（任务列表）：\n' +
      '  - 读任务用 read_*：read_datasources / read_datasets / read_cells / read_rows / read_cols / read_form / read_page / read_report\n' +
      '  - 写任务用 create_* / modify_* / delete_*\n' +
      '  - 收尾用 summary（必须放最后）\n' +
      '  - 跨任务依赖用 dependsOn：被依赖任务 id 列表\n' +
      '  - 失败策略用 onFail：abort(默认中断) / skip(标 skipped 继续) / continue(忽略失败)\n' +
      '  - 重试用 maxRetries：单任务最大重试次数（不含首次）\n' +
      '【关键】一个原子动作 = 一个 task；多步操作（先创建数据源再创建数据集）拆成多个 task 并用 dependsOn 连接；\n' +
      '批量操作（多个单元格 / 多个数据源）拆成多个 task，方便并行。\n' +
      '【兜底】如果意图不明，输出空 tasks 列表（让上游走 ask_clarification）。'
  })
}

/**
 * Dispatcher 节点工厂（核心）
 * 行为：每轮拉出 ready 任务，并行执行；执行完标记 success/failed；失败时按策略传播
 * 出口：plan 全部 done / dead / 超轮次 → 条件边进入 summary 或 END
 *
 * @param registry - action → 子图工厂 + pickOutput 映射
 * @param options - 配置
 * @param options.maxRounds  - 最大调度轮次，默认 50
 * @returns LangGraph 节点函数
 */
export function buildDispatcherNode(
  registry: ActionRegistry,
  options?: { maxRounds?: number }
) {
  const maxRounds = options?.maxRounds ?? 50
  const nodeId = 'dispatch_task'

  return withInput(async (state: ReportState, _config: LangGraphRunnableConfig, runtime: WorkflowRuntime) => {
    const plan: TaskPlan = Array.isArray(state.taskPlan) ? state.taskPlan : []
    const results: Record<string, any> = { ...(state.taskResults || {}) }
    const currentRound = state.dispatchRound ?? 0
    // 关键决策点：planner 失败 → 直接退出（不调度），由主图条件边进 summary
    if (state.plannerError) {
      console.log(`[dispatcher] planner 失败，跳过调度: ${state.plannerError}`)
      return { errors: [state.plannerError] } as ReportStateUpdate
    }

    // 关键决策点：plan 为空 → 跳过
    if (plan.length === 0) {
      console.log(`[dispatcher] plan 为空，跳过调度`)
      return { dispatchRound: currentRound + 1 } as ReportStateUpdate
    }

    // 关键决策点：plan 全部完成 或 卡死 或 超轮次
    if (isPlanDone(plan)) {
      console.log(`[dispatcher] 全部任务完成，进入 summary`)
      return { dispatchRound: currentRound + 1 } as ReportStateUpdate
    }
    if (isPlanDead(plan)) {
      console.warn(`[dispatcher] 任务计划卡死（有 pending 但无可执行），中止`)
      return { errors: ['任务计划卡死，存在无法满足的依赖'], dispatchRound: currentRound + 1 } as ReportStateUpdate
    }
    if (currentRound >= maxRounds) {
      console.error(`[dispatcher] 超出最大调度轮次 ${maxRounds}，强制中止`)
      return { errors: [`超出最大调度轮次 ${maxRounds}`], dispatchRound: currentRound + 1 } as ReportStateUpdate
    }

    // 关键决策点：取出本轮可执行任务
    const ready = pickReadyTasks(plan)
    if (ready.length === 0) {
      // 理论上 isPlanDead 已覆盖，这里是保险
      return { dispatchRound: currentRound + 1 } as ReportStateUpdate
    }
    console.log(`[dispatcher] 第 ${currentRound + 1} 轮，可执行任务: ${JSON.stringify(ready.map(t => `${t.id}:${t.action}`))}`)

    // 关键决策点：标记 in_progress（先把状态写回，便于 UI 看到）
    const nextPlan: TaskPlan = plan.map(t => ready.find(r => r.id === t.id)
      ? { ...t, status: 'in_progress' as const, retryCount: t.retryCount ?? 0 }
      : t
    )

    // 关键决策点：并行执行所有 ready 任务（无依赖时多任务同轮并行）
    const updates: TaskNode[] = await Promise.all(ready.map(async (task) => {
      const updated = await executeTask(task, nextPlan, registry, state, runtime, results)
      return updated
    }))

    // 把更新合回 plan
    const updateMap = new Map(updates.map(u => [u.id, u]))
    const finalPlan: TaskPlan = nextPlan.map(t => updateMap.get(t.id) ?? t)

    // 关键决策点：失败传播（按 onFail 策略）
    for (const t of finalPlan) {
      if (t.status === 'failed' || t.status === 'skipped') {
        propagateFailure(finalPlan, t.id)
      }
    }

    return {
      taskPlan: finalPlan,
      taskResults: results,
      dispatchRound: currentRound + 1
    } as ReportStateUpdate
  }, { nodeName: nodeId })
}

/**
 * 单任务执行（含重试）
 * @param task - 当前任务
 * @param plan - 当前 plan（按 plan 查依赖）
 * @param registry - action 映射
 * @param state - 当前 state
 * @param runtime - 运行时
 * @param results - taskResults 共享对象（执行中合并）
 * @returns 更新后的 task（含 status/result/error/retryCount）
 */
async function executeTask(
  task: TaskNode,
  plan: TaskPlan,
  registry: ActionRegistry,
  state: ReportState,
  runtime: WorkflowRuntime,
  results: Record<string, any>
): Promise<TaskNode> {
  const maxRetries = task.maxRetries ?? 0
  const startedRetry = task.retryCount ?? 0
  let lastError: string | undefined = task.error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const entry = registry[task.action]
      if (!entry) {
        // 关键决策点：未知 action 视为失败
        return {
          ...task,
          status: 'failed',
          error: `未知 action: ${task.action}`,
          retryCount: startedRetry + attempt
        }
      }
      const mergedState = mergeReadFrom(task, plan, state, results)
      const { statePatch, result } = await runSubgraphForTask(entry, task, mergedState, runtime)
      Object.assign(results, statePatch)
      return {
        ...task,
        status: 'success',
        result,
        retryCount: startedRetry + attempt
      }
    } catch (e: any) {
      lastError = e?.message ?? String(e)
      console.warn(`[dispatcher] 任务 ${task.id} 第 ${attempt + 1} 次失败: ${lastError}`)
    }
  }
  return {
    ...task,
    status: 'failed',
    error: lastError,
    retryCount: startedRetry + maxRetries
  }
}

/**
 * 把 task.params 中形如 { $ref: 't1' } 的占位替换为对应 task.result
 * 让下游任务直接复用上游数据（解决"读写混合 + 跨任务共享"）
 * @param task - 当前任务
 * @param plan - 当前 plan
 * @param state - 当前 state
 * @param results - taskResults
 * @returns 合并后的 state
 */
function mergeReadFrom(task: TaskNode, plan: TaskPlan, state: ReportState, results: Record<string, any>): ReportState {
  const byId = new Map(plan.map(t => [t.id, t]))
  const merged: Record<string, any> = { ...(task.params ?? {}) }
  // 浅替换 $ref 占位（递归一层，避免太复杂）
  for (const [k, v] of Object.entries(merged)) {
    if (v && typeof v === 'object' && '$ref' in v && typeof v.$ref === 'string') {
      const refId = v.$ref
      const upstream = byId.get(refId)
      merged[k] = upstream?.result ?? results[refId] ?? null
    }
  }
  return { ...state, taskParams: merged } as any
}

/**
 * 子图调用 + 错误归一
 * @param entry - action 注册条目
 * @param task - 当前任务（用于闭包注入到子图 state）
 * @param state - 合并后的 state
 * @param runtime - 运行时
 * @returns 标准化结果
 */
async function runSubgraphForTask(
  entry: ActionRegistry[string],
  task: TaskNode,
  state: ReportState,
  runtime: WorkflowRuntime
): Promise<TaskExecResult> {
  // 关键决策点：factory(task) 闭包注入 task，子图 invoke 时把 task.params.description 注入 userMessage
  const subGraph = entry.factory(task)
  const childRuntime = runtime.fork?.() ?? runtime
  const result = await subGraph.invoke(state as Record<string, any>, {
    context: runtimeToContext(childRuntime)
  })
  const childErrors = filterActiveErrors((result as any).errors)
  const out = entry.pickOutput(result, task)
  if (childErrors.length > 0) {
    out.errors = [...(out.errors ?? []), ...childErrors]
  }
  return {
    statePatch: out,
    result: summarizeForTask(entry, out, task)
  }
}

/**
 * 把 pickOutput 的结果归一为 task.result
 * read 任务 → 返回 datasources/datasets/cellsData 等核心字段
 * write 任务 → 返回 datasetWriteResult / cellsData 等
 */
function summarizeForTask(entry: ActionRegistry[string], patch: Record<string, any>, task: TaskNode): any {
  if (entry.kind === 'read') {
    // 读任务：透传核心数据
    if (patch.datasources) return { datasources: patch.datasources }
    if (patch.datasets) return { datasets: patch.datasets }
    if (patch.cellsData) return { cellsData: patch.cellsData }
    if (patch.rowData) return { rowData: patch.rowData }
    if (patch.colData) return { colData: patch.colData }
    if (patch.searchForm) return { searchForm: patch.searchForm }
    if (patch.pageConfig || patch.headerConfig || patch.footerConfig) {
      return {
        pageConfig: patch.pageConfig,
        headerConfig: patch.headerConfig,
        footerConfig: patch.footerConfig
      }
    }
  }
  // 写任务：透传 statePatch 关键字段
  return patch
}

/**
 * Summary 节点工厂（LLM Decider 包装）
 * 把所有 taskResult 喂给 LLM，生成自然语言总结
 * 失败任务也参与总结，便于告知用户哪些成功哪些失败
 * @param options - 配置
 * @returns LangGraph 节点函数
 */
export function buildSummaryNode(options?: { maxIterations?: number }) {
  return createLLMDecideNode({
    nodeId: 'summary',
    allowedTools: ['load_report_introduce'],
    requiredToolResultsAny: [], // summary 不强制调工具，纯文本回复即可
    maxIterations: options?.maxIterations ?? 2,
    description:
      '【唯一任务】根据 taskResults 字段中的所有任务执行结果，用自然语言向用户汇报。\n' +
      '【必须包含】\n' +
      '1. 完成了什么（按 task id 顺序）\n' +
      '2. 哪些成功、哪些失败、失败原因（如果 errors 字段非空也要提及）\n' +
      '3. 读任务的结果（用户可能问"告诉我哪个数据集是查用户的"）\n' +
      '【禁止】不要再次调用写工具（read/create/modify/delete_*），仅汇报。\n' +
      '【禁止】不要在汇报中再次分析用户意图。\n' +
      '【格式】简洁、清晰；分点列举每个 task 的结果。'
  })
}
