/**
 * understand_and_plan 节点工厂
 *
 * 合并原 gather_requirements + plan_execution 两个阶段为一个 LLM 调用
 *
 * 职责：分析用户需求，必要时通过 ask_user 追问，需求清晰后直接调用 plan_tasks
 *       输出 TaskPlan，不再经过 RequirementsSpec 中间层
 *
 * 关键设计：
 * - LLM 可调工具：plan_tasks（提交 TaskPlan）、ask_user（中断型追问）、load_report_doc（辅助理解）
 * - ask_user 走 interruptOnCall 中断路径，不执行 execute
 * - gatherMaxRounds 在 runtime 上，llm-decide-node 在调 ask_user 前自检；超限给 LLM 错误反馈
 * - 节点结束条件：
 *   1. LLM 调 plan_tasks → state.taskResults 写入 → validate_plan 后处理
 *   2. LLM 调 ask_user（未超轮次）→ AskUserInterrupt → 重启 runAgentLoop
 *   3. 必填工具未执行 + maxIterations 耗尽 → plannerError → 主图条件边路由到 summary
 *
 * validate_plan 节点（原 collect_plan）：
 * - 改名原因：原 collect_plan 实际上是个"校验关卡"，不是单纯收集
 * - 职责（#4 升级后）：
 *   1. 读 LLM 输出的 TaskPlan
 *   2. 标准化 task
 *   3. 校验结构（id 唯一、dependsOn 存在、无环）
 *   4. 依赖拓扑自动补全（inferMissingDependsOn）
 *   5. 覆盖度校验（checkPlanCoverage）
 *   6. 失败时 set plannerError（#3 之后无兜底；#A 之后会触发重规划）
 *   7. 成功时写 state.taskPlan
 */

import { createLLMDecideNode } from './llm-decide-node.ts'
import { withInput } from '../node-wrapper.ts'
import {
  PLANNER_TOOL_NAME,
  EXECUTABLE_ACTIONS,
  validateTaskPlan,
  inferMissingDependsOn,
  checkPlanCoverage
} from '../task-plan.ts'
import type { TaskPlan } from '../task-plan.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'
import type { WorkflowRuntime } from '../runtime.ts'
import { resetGatherRounds } from '../gather-state.ts'
import { loadPromptDocByEnumSync } from '@/prompt'
import { logger } from '../logger.ts'

const log = logger('understand-plan-node')

/**
 * 同步加载 understand_and_plan 的 prompt 文本
 * 从 plan/understand-plan.md 加载，替换动态占位符（{{READ_ACTIONS}}、{{WRITE_ACTIONS}}）
 *
 * #13 改动：改为 const + IIFE 立即执行初始化，避免 mutable module state
 * （原 _cachedDescription 是 let 模块级变量，SSR/测试场景可能串数据）
 * EXECUTABLE_ACTIONS 列表在运行时不变，IIFE 一次初始化后即为常量
 */
const UNDERSTAND_PLAN_DESCRIPTION: string = (() => {
  const readActions = EXECUTABLE_ACTIONS.filter(a => a.startsWith('read_')).join(' / ')
  const writeActions = EXECUTABLE_ACTIONS.filter(a => a.startsWith('modify_') || a.startsWith('create_') || a.startsWith('delete_')).join(' / ')

  const raw = loadPromptDocByEnumSync('UNDERSTAND_PLAN')
  return raw
    .replace('{{READ_ACTIONS}}', readActions)
    .replace('{{WRITE_ACTIONS}}', writeActions)
})()


/**
 * understand_and_plan 节点工厂
 *
 * @param options - 配置
 * @param options.maxIterations - LLM Decider 单次 run 的最大迭代次数（默认 8）
 * @returns LangGraph 节点函数
 *
 * #A 改动：description 改为函数形式，按 state.replanRound 动态拼接"上一轮被拒"反馈，
 *         让重规划时 LLM 看到具体的失败原因（plannerError），而不是空白重试。
 */
export function buildUnderstandPlanNode(options?: { maxIterations?: number }) {
  const baseDescription = UNDERSTAND_PLAN_DESCRIPTION
  return createLLMDecideNode({
    nodeId: 'understand_and_plan',
    allowedTools: [PLANNER_TOOL_NAME, 'ask_user', 'load_report_doc'],
    requiredToolResultsAny: [PLANNER_TOOL_NAME],
    // 关键决策点：首轮强制 LLM 调 plan_tasks（不许先 ask_user 也不许摆烂）
    // plan_tasks 的 validate 会拒绝空输入，触发 hasToolError → LLM 自动重试
    // 第 2 轮起放开 toolChoice，LLM 仍可选择 ask_user
    forceToolChoiceFirst: true,
    // 给 LLM 足够空间：先可能多轮 ask_user，最后 plan_tasks
    maxIterations: options?.maxIterations ?? 8,
    resultKey: 'taskResults',
    resultKeyAsObject: true,
    description: (state) => {
      const replan = state.replanRound ?? 0
      if (replan <= 0) return baseDescription
      const err = state.plannerError ?? '未知错误'
      return `${baseDescription}\n\n【重规划反馈 — 第 ${replan} 次重试】\n你上一轮提交的计划被系统拒绝：\n${err}\n\n请基于此反馈重新规划 plan_tasks，确保：\n1. 严格满足【modify_cell 触发条件】、【动作依赖拓扑】等规划约束\n2. 修正上一轮被指出的所有问题\n3. 如有不确定的字段，参考 search_results/search_schema 里已加载的数据结构`
    }
  })
}

/**
 * validate_plan 后处理节点（纯函数节点，原 collect_plan）
 *
 * 职责升级（#4 改动）：
 * - 原 collect_plan：读 LLM 输出 → 标准化 → 校验结构 → 兜底
 * - 现 validate_plan：读 LLM 输出 → 标准化 → 校验结构 → 依赖拓扑补全 → 覆盖度校验 → 失败 set plannerError
 *
 * 失败行为（#3 改动后）：
 * - LLM 未调 plan_tasks / 报 error / 空任务 / 结构校验失败 → 直接 set plannerError
 * - 覆盖度校验失败（userMessage 含"展示"但 plan 缺 modify_cell 等）→ set plannerError
 * - 不再有任何兜底场景，LLM 是规划的唯一来源
 *
 * plannerError 路由：
 * - 失败时同时 +1 replanRound（#A 改动）
 * - validate_plan 条件边：replanRound<2 → understand_and_plan（回灌重规划）；否则 → summary
 */
export function buildValidatePlanNode() {
  return withInput(async (state: ReportState): Promise<ReportStateUpdate> => {
    const planResult = state.taskResults?.[PLANNER_TOOL_NAME] as { tasks?: any[] } | undefined
    const currentReplan = state.replanRound ?? 0

    // LLM 没调 plan_tasks
    const submitErr = (state.errors as string[] | undefined)?.find(
      e => e.includes(PLANNER_TOOL_NAME) || /必需工具未执行/.test(e)
    )

    if (!planResult) {
      const msg = submitErr
        ? `规划阶段未提交任务计划: ${submitErr}`
        : '规划阶段未提交任务计划（LLM 未调用 plan_tasks）'
      log.warn(`[validate_plan] ${msg}（replanRound: ${currentReplan} → ${currentReplan + 1}）`)
      return { plannerError: msg, replanRound: currentReplan + 1 } as ReportStateUpdate
    }

    // plan_tasks 返回了 error
    if ((planResult as any).error) {
      const msg = `plan_tasks 失败: ${(planResult as any).error}`
      log.warn(`[validate_plan] ${msg}（replanRound: ${currentReplan} → ${currentReplan + 1}）`)
      return { plannerError: msg, replanRound: currentReplan + 1 } as ReportStateUpdate
    }

    // 解析 tasks
    let tasks = planResult.tasks
    if (!Array.isArray(tasks) || tasks.length === 0) {
      const msg = 'plan_tasks 返回空任务列表'
      log.warn(`[validate_plan] ${msg}（replanRound: ${currentReplan} → ${currentReplan + 1}）`)
      return { plannerError: msg, replanRound: currentReplan + 1 } as ReportStateUpdate
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

    // 结构校验
    const validationErrors = validateTaskPlan(plan)
    if (validationErrors.length > 0) {
      log.warn(`[validate_plan] TaskPlan 校验失败: ${validationErrors.join('; ')}`)
      // 尝试修复：过滤掉引用不存在依赖的 dependsOn
      const validIds = new Set(plan.map(t => t.id))
      const fixedPlan: TaskPlan = plan.map(t => ({
        ...t,
        dependsOn: (t.dependsOn ?? []).filter(d => validIds.has(d))
      }))
      const recheck = validateTaskPlan(fixedPlan)
      if (recheck.length > 0) {
        const msg = `TaskPlan 校验失败: ${recheck.join('; ')}`
        log.warn(`[validate_plan] 修复后仍校验失败: ${msg}（replanRound: ${currentReplan} → ${currentReplan + 1}）`)
        return { plannerError: msg, replanRound: currentReplan + 1 } as ReportStateUpdate
      }
      // 修复成功 → 继续走后续校验（拓扑补全 + 覆盖度）
      return finalizePlan(state, fixedPlan)
    }

    log.info(`[validate_plan] 任务计划已确认: ${plan.length} 个任务`, plan.map(t => `${t.id}:${t.action}`).join(', '))
    return finalizePlan(state, plan)
  }, { nodeName: 'validate_plan' })
}

/**
 * 校验后处理：依赖拓扑补全 + 覆盖度校验
 * - 拓扑补全：按 ACTION_DEPENDENCY_TOPOLOGY 自动补 LLM 没显式写的 dependsOn
 * - 覆盖度校验：userMessage 意图与 plan 动作的语义对齐
 *   失败时 set plannerError（当前路由到 summary；#A 之后回灌 understand_and_plan）
 */
function finalizePlan(
  state: ReportState,
  plan: TaskPlan
): ReportStateUpdate {
  // 1) 依赖拓扑自动补全
  inferMissingDependsOn(plan)

  // 日志：输出补全后的完整任务计划（含 dependsOn），便于排查依赖链问题
  log.info(`[validate_plan] 拓扑补全后任务计划: ${plan.map(t => `${t.id}:${t.action}(dependsOn=[${t.dependsOn?.join(',') ?? ''}])`).join(', ')}`)

  // 2) 覆盖度校验
  const coverageErrors = checkPlanCoverage(state.userMessage ?? '', plan)
  if (coverageErrors.length > 0) {
    const errMsg = `规划未覆盖用户需求: ${coverageErrors.join('; ')}`
    const currentReplan = state.replanRound ?? 0
    log.warn(`[validate_plan] ${errMsg}（replanRound: ${currentReplan} → ${currentReplan + 1}）`)
    return { taskPlan: plan, plannerError: errMsg, replanRound: currentReplan + 1 } as ReportStateUpdate
  }

  return { taskPlan: plan, plannerError: null, replanRound: state.replanRound ?? 0 } as ReportStateUpdate
}


