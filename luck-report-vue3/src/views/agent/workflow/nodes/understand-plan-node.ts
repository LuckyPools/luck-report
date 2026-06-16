/**
 * understand_and_plan 节点工厂
 *
 * 合并原 gather_requirements + plan_execution 两个阶段为一个 LLM 调用
 *
 * 职责：分析用户需求，必要时通过 ask_user 追问，需求清晰后直接调用 plan_tasks
 *       输出 TaskPlan，不再经过 RequirementsSpec 中间层
 *
 * 关键设计：
 * - LLM 可调工具：plan_tasks（提交 TaskPlan）、ask_user（中断型追问）、load_report_introduce（辅助理解）
 * - ask_user 走 interruptOnCall 中断路径，不执行 execute
 * - gatherMaxRounds 在 runtime 上，llm-decide-node 在调 ask_user 前自检；超限给 LLM 错误反馈
 * - 节点结束条件：
 *   1. LLM 调 plan_tasks → state.taskResults 写入 → collect_plan 后处理
 *   2. LLM 调 ask_user（未超轮次）→ AskUserInterrupt → 重启 runAgentLoop
 *   3. 必填工具未执行 + maxIterations 耗尽 → plannerError → 主图条件边路由到 summary
 */

import { createLLMDecideNode } from './llm-decide-node.ts'
import { withInput } from '../node-wrapper.ts'
import { PLANNER_TOOL_NAME, EXECUTABLE_ACTIONS, validateTaskPlan, generateFallbackPlan } from '../task-plan.ts'
import type { TaskPlan, TaskNode } from '../task-plan.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'
import type { WorkflowRuntime } from '../runtime.ts'
import { resetGatherRounds } from '../gather-state.ts'
import { loadPromptDocByEnumSync } from '@/prompt'

/**
 * 同步加载 understand_and_plan 的 prompt 文本
 * 从 plan/understand-plan.md 加载，替换动态占位符（{{READ_ACTIONS}}、{{WRITE_ACTIONS}}）
 * 结果缓存到模块级变量，避免重复加载和替换
 */
let _cachedDescription: string | null = null

function getUnderstandPlanDescription(): string {
  if (_cachedDescription !== null) return _cachedDescription

  const readActions = EXECUTABLE_ACTIONS.filter(a => a.startsWith('read_')).join(' / ')
  const writeActions = EXECUTABLE_ACTIONS.filter(a => a.startsWith('modify_') || a.startsWith('create_') || a.startsWith('delete_')).join(' / ')

  const raw = loadPromptDocByEnumSync('UNDERSTAND_PLAN')
  _cachedDescription = raw
    .replace('{{READ_ACTIONS}}', readActions)
    .replace('{{WRITE_ACTIONS}}', writeActions)

  return _cachedDescription
}

/**
 * understand_and_plan 节点工厂
 *
 * @param options - 配置
 * @param options.maxIterations - LLM Decider 单次 run 的最大迭代次数（默认 8）
 * @returns LangGraph 节点函数
 */
export function buildUnderstandPlanNode(options?: { maxIterations?: number }) {
  return createLLMDecideNode({
    nodeId: 'understand_and_plan',
    allowedTools: [PLANNER_TOOL_NAME, 'ask_user', 'load_report_introduce'],
    requiredToolResultsAny: [PLANNER_TOOL_NAME],
    // 给 LLM 足够空间：先可能多轮 ask_user，最后 plan_tasks
    maxIterations: options?.maxIterations ?? 8,
    resultKey: 'taskResults',
    resultKeyAsObject: true,
    description: getUnderstandPlanDescription()
  })
}

/**
 * collect_plan 后处理节点（纯函数节点）
 *
 * 从 state.taskResults[PLANNER_TOOL_NAME] 读 LLM 提交的 TaskPlan
 * - 校验 TaskPlan 合法性（id 唯一、dependsOn 存在、无环）
 * - 校验失败 → 用 generateFallbackPlan 兜底
 * - 校验成功 → 写 state.taskPlan
 * - 主图条件边根据 state.taskPlan / state.plannerError 决定路由
 */
export function buildCollectPlanNode() {
  return withInput(async (state: ReportState, _config, runtime: WorkflowRuntime): Promise<ReportStateUpdate> => {
    const planResult = state.taskResults?.[PLANNER_TOOL_NAME] as { tasks?: any[] } | undefined

    // LLM 没调 plan_tasks
    const submitErr = (state.errors as string[] | undefined)?.find(
      e => e.includes(PLANNER_TOOL_NAME) || /必需工具未执行/.test(e)
    )

    if (!planResult) {
      const msg = submitErr
        ? `规划阶段未提交任务计划: ${submitErr}`
        : '规划阶段未提交任务计划（LLM 未调用 plan_tasks）'
      // 兜底：用 intent 生成默认 plan
      const fallback = generateFallbackPlan(state.intent, state.userMessage)
      if (fallback.length > 0) {
        console.log(`[collect_plan] 使用兜底 TaskPlan（${fallback.length} 个任务）`)
        resetGatherRounds(runtime.sessionId ?? 'default')
        return { taskPlan: fallback, plannerError: null } as ReportStateUpdate
      }
      return { plannerError: msg } as ReportStateUpdate
    }

    // plan_tasks 返回了 error
    if ((planResult as any).error) {
      const fallback = generateFallbackPlan(state.intent, state.userMessage)
      if (fallback.length > 0) {
        console.log(`[collect_plan] plan_tasks 报错，使用兜底 TaskPlan: ${(planResult as any).error}`)
        resetGatherRounds(runtime.sessionId ?? 'default')
        return { taskPlan: fallback, plannerError: null } as ReportStateUpdate
      }
      return { plannerError: `plan_tasks 失败: ${(planResult as any).error}` } as ReportStateUpdate
    }

    // 解析 tasks
    let tasks = planResult.tasks
    if (!Array.isArray(tasks) || tasks.length === 0) {
      const fallback = generateFallbackPlan(state.intent, state.userMessage)
      if (fallback.length > 0) {
        console.log(`[collect_plan] plan_tasks 返回空任务，使用兜底 TaskPlan`)
        resetGatherRounds(runtime.sessionId ?? 'default')
        return { taskPlan: fallback, plannerError: null } as ReportStateUpdate
      }
      return { plannerError: 'plan_tasks 返回空任务列表' } as ReportStateUpdate
    }

    // 标准化每个 task
    const plan: TaskPlan = tasks.map((t: any, i: number) => ({
      id: String(t.id ?? `t${i + 1}`),
      action: String(t.action ?? '').trim(),
      params: (t.params && typeof t.params === 'object') ? t.params : {},
      dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn : [],
      onFail: (t.onFail === 'skip' || t.onFail === 'continue') ? t.onFail : 'abort',
      maxRetries: typeof t.maxRetries === 'number' ? t.maxRetries : 0,
      status: 'pending' as const,
      retryCount: 0
    }))

    // 校验
    const validationErrors = validateTaskPlan(plan)
    if (validationErrors.length > 0) {
      console.warn(`[collect_plan] TaskPlan 校验失败: ${validationErrors.join('; ')}`)
      // 尝试修复：过滤掉引用不存在依赖的 dependsOn
      const validIds = new Set(plan.map(t => t.id))
      const fixedPlan: TaskPlan = plan.map(t => ({
        ...t,
        dependsOn: (t.dependsOn ?? []).filter(d => validIds.has(d))
      }))
      const recheck = validateTaskPlan(fixedPlan)
      if (recheck.length > 0) {
        const fallback = generateFallbackPlan(state.intent, state.userMessage)
        if (fallback.length > 0) {
          console.log(`[collect_plan] 修复后仍校验失败，使用兜底 TaskPlan`)
          resetGatherRounds(runtime.sessionId ?? 'default')
          return { taskPlan: fallback, plannerError: null } as ReportStateUpdate
        }
        return { plannerError: `TaskPlan 校验失败: ${recheck.join('; ')}` } as ReportStateUpdate
      }
      resetGatherRounds(runtime.sessionId ?? 'default')
      return { taskPlan: fixedPlan, plannerError: null } as ReportStateUpdate
    }

    console.log(`[collect_plan] 任务计划已确认: ${plan.length} 个任务`, plan.map(t => `${t.id}:${t.action}`).join(', '))
    resetGatherRounds(runtime.sessionId ?? 'default')
    return { taskPlan: plan, plannerError: null } as ReportStateUpdate
  }, { nodeName: 'collect_plan' })
}
