/**
 * Dispatcher / Summary 节点工厂
 * 与 task-plan.ts 的纯数据/算法分离，本文件负责把数据接到 LangGraph 节点
 *
 * Dispatcher: 代码节点，自环执行 TaskPlan（拓扑 + 失败策略）
 * Summary:    LLM Decider 包装，把所有 taskResult 汇总成自然语言回答
 *
 * Planner 节点已合并到 understand-plan-node.ts 的 buildUnderstandPlanNode
 */

import { withInput, runtimeToContext } from './index.ts'
import { createLLMDecideNode } from './nodes/llm-decide-node.ts'
import type { LangGraphRunnableConfig } from '@langchain/langgraph'
import type { WorkflowRuntime } from './runtime.ts'
import type { ReportState, ReportStateUpdate } from './state.ts'
import type { TaskNode, TaskPlan, TaskExecResult, ActionRegistry } from './task-plan.ts'
import {
  isPlanDone,
  isPlanDead,
  pickReadyTasks,
  propagateFailure,
  EXECUTABLE_ACTIONS
} from './task-plan.ts'
import { filterActiveErrors } from './utils.ts'
import { AskUserInterrupt } from './ask-user-interrupt.ts'

export { AskUserInterrupt }

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

    if (state.plannerError) {
      console.log(`[dispatcher] planner 失败，跳过调度: ${state.plannerError}`)
      return { errors: [state.plannerError] } as ReportStateUpdate
    }

    if (plan.length === 0) {
      console.log(`[dispatcher] plan 为空，跳过调度`)
      return { dispatchRound: currentRound + 1 } as ReportStateUpdate
    }

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

    let ready = pickReadyTasks(plan)
    if (ready.length === 0) {
      return { dispatchRound: currentRound + 1 } as ReportStateUpdate
    }

    const nextPlan: TaskPlan = plan.map(t => {
      const readyTask = ready.find(r => r.id === t.id)
      if (!readyTask) return t
      if (readyTask.status === 'skipped') return readyTask
      return { ...t, status: 'in_progress' as const, retryCount: t.retryCount ?? 0 }
    })

    try {
      const updates: TaskNode[] = await Promise.all(ready.map(async (task) => {
        if (task.status === 'skipped') return task
        return await executeTask(task, nextPlan, registry, state, runtime, results)
      }))

      const updateMap = new Map(updates.map(u => [u.id, u]))
      const finalPlan: TaskPlan = nextPlan.map(t => updateMap.get(t.id) ?? t)

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
    } catch (e: any) {
      if (e instanceof AskUserInterrupt) {
        console.warn(`[dispatcher] 不应触发的 AskUserInterrupt 路径: ${e.message}`)
        throw e
      }
      throw e
    }
  }, { nodeName: nodeId })
}

/**
 * 单任务执行（含重试）
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
      if (task.action === 'ask_user') {
        return {
          ...task,
          status: 'failed',
          error: 'ask_user 任务不应进入执行阶段',
          retryCount: startedRetry + attempt
        }
      }

      const entry = registry[task.action]
      if (!entry) {
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
      // 检查子图是否有严重错误（缺少关键字产出 / 无法解析），有则标记 failed
      const subErrors = filterActiveErrors(statePatch.errors)
      const hasCriticalError = subErrors.length > 0 && subErrors.some(e =>
        /缺少|失败|无法解析/.test(e)
      )
      if (hasCriticalError) {
        lastError = subErrors.join('; ')
        console.warn(`[dispatcher] 任务 ${task.id} 子图执行有关键错误: ${lastError}`)
        if (attempt < maxRetries) continue  // 重试
        return {
          ...task,
          status: 'failed',
          error: lastError,
          retryCount: startedRetry + attempt
        }
      }
      return {
        ...task,
        status: 'success',
        result,
        retryCount: startedRetry + attempt
      }
    } catch (e: any) {
      if (e instanceof AskUserInterrupt) {
        throw e
      }
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
 */
function mergeReadFrom(task: TaskNode, plan: TaskPlan, state: ReportState, results: Record<string, any>): ReportState {
  const byId = new Map(plan.map(t => [t.id, t]))
  const merged: Record<string, any> = { ...(task.params ?? {}) }
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
 */
async function runSubgraphForTask(
  entry: ActionRegistry[string],
  task: TaskNode,
  state: ReportState,
  runtime: WorkflowRuntime
): Promise<TaskExecResult> {
  const subGraph = entry.factory(task)
  const childRuntime = runtime.fork?.() ?? runtime
  console.log(`[runSubgraphForTask] 开始执行子图: ${entry.nodeId}, task=${task.id}:${task.action}`)
  const result = await subGraph.invoke(state as Record<string, any>, {
    context: runtimeToContext(childRuntime)
  })
  console.log(`[runSubgraphForTask] 子图执行完成: ${entry.nodeId}, result keys:`, Object.keys(result ?? {}))
  const childErrors = filterActiveErrors((result as any).errors)
  const out = entry.pickOutput(result, task)
  if (childErrors.length > 0) {
    out.errors = [...(out.errors ?? []), ...childErrors]
  }
  console.log(`[runSubgraphForTask] pickOutput 结果:`, JSON.stringify(Object.keys(out)), `errors=${JSON.stringify(out.errors)}`)
  return {
    statePatch: out,
    result: summarizeForTask(entry, out, task)
  }
}

/**
 * 把 pickOutput 的结果归一为 task.result
 */
function summarizeForTask(entry: ActionRegistry[string], patch: Record<string, any>, task: TaskNode): any {
  if (entry.kind === 'read') {
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
  return patch
}

/**
 * Summary 节点工厂（LLM Decider 包装）
 * 把所有 taskResult 喂给 LLM，生成自然语言总结
 *
 * 两种 mode：
 * 1. 正常模式：state.taskResults 非空，按 task 汇报成功/失败
 * 2. 空模式：state.taskResults 为空，输出兜底语
 */
export function buildSummaryNode(options?: { maxIterations?: number }) {
  return createLLMDecideNode({
    nodeId: 'summary',
    allowedTools: ['load_report_introduce'],
    requiredToolResultsAny: [],
    maxIterations: options?.maxIterations ?? 2,
    description:
      '【唯一任务】根据当前模式用自然语言向用户汇报。\n' +
      '【模式识别 - 第一步必做】\n' +
      '- 模式 A（规划失败）：如果 state.plannerError 非空 → 走"规划失败"模式，向用户说明无法理解需求，请用户补充信息。\n' +
      '- 模式 B（正常执行）：否则按 taskResults 汇报。\n' +
      '【模式 A：规划失败】\n' +
      '- 把 plannerError 字段的文本**原样或稍作整理**告诉用户\n' +
      '- 明确指出还需要补齐哪些具体信息\n' +
      '- 鼓励用户在补充完整信息后重新提问\n' +
      '- **不要**展开分析用户意图、不要调任何工具\n' +
      '【模式 B：正常执行汇报】\n' +
      '【必须包含】\n' +
      '1. 完成了什么（按 task id 顺序）\n' +
      '2. 哪些成功、哪些失败、失败原因（如果 errors 字段非空也要提及）\n' +
      '3. 读任务的结果（用户可能问"告诉我哪个数据集是查用户的"）\n' +
      '【禁止】不要再次调用写工具（read/create/modify/delete_*），仅汇报。\n' +
      '【禁止】不要在汇报中再次分析用户意图。\n' +
      '【格式】简洁、清晰；分点列举每个 task 的结果。'
  })
}
