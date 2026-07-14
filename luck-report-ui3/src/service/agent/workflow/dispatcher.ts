/**
 * Dispatcher / Summary 节点工厂
 * 与 task-plan.ts 的纯数据/算法分离，本文件负责把数据接到 LangGraph 节点
 *
 * Dispatcher: 代码节点，自环执行 TaskPlan（拓扑 + 失败策略）
 * Summary:    LLM Decider 包装，把所有 taskResult 汇总成自然语言回答
 *
 * Planner 节点已合并到 understand-plan-node.ts 的 buildUnderstandPlanNode
 */

import { withInput } from './node-wrapper.ts'
import { runtimeToContext } from './context-annotation.ts'
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
  SUMMARY_ACTION
} from './task-plan.ts'
import { filterActiveErrors } from './utils.ts'
import { AskUserInterrupt } from './ask-user-interrupt.ts'
import { logger } from './logger.ts'

const log = logger('dispatcher')

export { AskUserInterrupt }

/**
 * Dispatcher 节点工厂（核心）
 * 行为：每轮拉出 ready 任务，并行执行；执行完标记 success/failed；失败时按策略传播
 * 出口：plan 全部 done / dead / 超轮次 → 条件边进入 summary 或 END
 *
 * #10 改动：删除 ACTION_PRODUCED_FIELDS 独立表，改从 registry[task.action].producedFields 读取
 *
 * @param registry - action → 子图工厂 + pickOutput + producedFields 映射
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
      log.info('planner 失败，跳过调度:', state.plannerError)
      return { errors: [state.plannerError] } as ReportStateUpdate
    }

    if (plan.length === 0) {
      log.info('plan 为空，跳过调度')
      return { dispatchRound: currentRound + 1 } as ReportStateUpdate
    }

    if (isPlanDone(plan)) {
      log.info('全部任务完成，进入 summary')
      return { dispatchRound: currentRound + 1 } as ReportStateUpdate
    }
    if (isPlanDead(plan)) {
      log.warn('任务计划卡死（有 pending 但无可执行），中止')
      return { errors: ['任务计划卡死，存在无法满足的依赖'], dispatchRound: currentRound + 1 } as ReportStateUpdate
    }
    if (currentRound >= maxRounds) {
      log.error(`超出最大调度轮次 ${maxRounds}，强制中止`)
      return { errors: [`超出最大调度轮次 ${maxRounds}`], dispatchRound: currentRound + 1 } as ReportStateUpdate
    }

    let ready = pickReadyTasks(plan)
    log.info(`[dispatch_task] round=${currentRound}, ready=[${ready.map(t => `${t.id}:${t.action}(status=${t.status},dependsOn=[${t.dependsOn?.join(',')}])`).join(', ')}], plan=[${plan.map(t => `${t.id}:${t.action}=${t.status}`).join(', ')}]`)
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

      log.info(`[dispatch_task] round=${currentRound} 完成, finalPlan=[${finalPlan.map(t => `${t.id}:${t.action}=${t.status}${t.error ? '(' + t.error.substring(0, 60) + ')' : ''}`).join(', ')}]`)

      return {
        taskPlan: finalPlan,
        taskResults: results,
        dispatchRound: currentRound + 1
      } as ReportStateUpdate
    } catch (e: any) {
      // #9 改动：简化冗余 catch 逻辑（原 if/else 都是 throw e，仅差异在 warn 日志）
      if (e instanceof AskUserInterrupt) {
        log.warn('不应触发的 AskUserInterrupt 路径:', e.message)
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

      // #12 改动：summary 任务不应出现在 TaskPlan 里（prompt 已禁止）。
      // 如果历史 session 或 fallback 路径仍产生了 summary 任务，标 failed 暴露问题，
      // 而非标 success 掩盖。summary 由主图 summary 节点统一处理。
      if (task.action === SUMMARY_ACTION) {
        log.warn(`任务 ${task.id} 是 summary 任务，不应进入 Dispatcher 执行（标 failed 暴露问题）`)
        return {
          ...task,
          status: 'failed',
          error: 'summary 任务不应进入 Dispatcher 执行，应由主图 summary 节点统一处理',
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
      const mergedState = mergeReadFrom(task, plan, state, results, registry)
      const { statePatch, result } = await runSubgraphForTask(entry, task, mergedState, runtime)
      Object.assign(results, statePatch)
      // 检查子图是否有严重错误（缺少关键字产出 / 无法解析），有则标记 failed
      const subErrors = filterActiveErrors(statePatch.errors)
      const hasCriticalError = subErrors.length > 0 && subErrors.some(e =>
        /缺少|失败|无法解析/.test(e)
      )
      if (hasCriticalError) {
        lastError = subErrors.join('; ')
        log.warn(`任务 ${task.id} 子图执行有关键错误:`, lastError)
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
      log.warn(`任务 ${task.id} 第 ${attempt + 1} 次失败:`, lastError)
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
 * 给当前 task 准备"喂给子图"的 state：
 * 1. 把 task.params 中形如 { $ref: 't1' } 的占位替换为对应 task.result（已有逻辑）
 * 2. 关键决策点：按 task.dependsOn 遍历上游已成功 task，
 *    通过 registry[upstream.action].producedFields 把上游产出的业务数据字段（cellsData/rowData/...）
 *    注入到 state。这样下游写子图（如 modify_cell_subgraph）启动时
 *    state.cellsData 已有值，START 条件边会跳过内部 read_cells 节点，
 *    避免 dispatcher 任务和子图内部 read 的重复调用。
 *
 * #10 改动：producedFields 从 registry 读取（原 ACTION_PRODUCED_FIELDS 独立表已删除）
 *
 * 注意：
 * - 上游 task 必须 status=success（pickReadyTasks 已保证），但仍做防御性检查
 * - 仅注入非 undefined / 非 null 的字段；空对象/空数组照样注入（子图自带"空则读"判断）
 * - 同一字段被多个上游覆盖时，dependsOn 中靠后的任务胜出
 */
function mergeReadFrom(
  task: TaskNode,
  plan: TaskPlan,
  state: ReportState,
  results: Record<string, any>,
  registry: ActionRegistry
): ReportState {
  const byId = new Map(plan.map(t => [t.id, t]))
  const merged: Record<string, any> = { ...(task.params ?? {}) }
  for (const [k, v] of Object.entries(merged)) {
    if (v && typeof v === 'object' && '$ref' in v && typeof v.$ref === 'string') {
      const refId = v.$ref
      const upstream = byId.get(refId)
      merged[k] = upstream?.result ?? results[refId] ?? null
    }
  }

  // 关键决策点：注入上游 task 产出的业务数据字段
  const stateInject: Record<string, any> = {}
  for (const depId of task.dependsOn ?? []) {
    const upstream = byId.get(depId)
    if (!upstream || upstream.status !== 'success') continue
    // #10 改动：从 registry 读取 producedFields（原 ACTION_PRODUCED_FIELDS 独立表已删除）
    const entry = registry[upstream.action]
    const fields = entry?.producedFields
    if (!fields || fields.length === 0) continue
    const upstreamResult = upstream.result
    if (!upstreamResult || typeof upstreamResult !== 'object') continue
    for (const field of fields) {
      const value = upstreamResult[field]
      if (value !== undefined && value !== null) {
        stateInject[field] = value
      }
    }
  }

  return { ...state, ...stateInject, taskParams: merged } as any
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
  log.debug('开始执行子图:', entry.nodeId, `task=${task.id}:${task.action}`)
  const result = await subGraph.invoke(state as Record<string, any>, {
    context: runtimeToContext(childRuntime)
  })
  log.debug('子图执行完成:', entry.nodeId, 'result keys:', Object.keys(result ?? {}))
  const childErrors = filterActiveErrors((result as any).errors)
  const out = entry.pickOutput(result, task)
  if (childErrors.length > 0) {
    out.errors = [...(out.errors ?? []), ...childErrors]
  }
  log.debug('pickOutput 结果:', Object.keys(out), `errors=${JSON.stringify(out.errors)}`)
  return {
    statePatch: out,
    result: summarizeForTask(entry, out, task)
  }
}

/**
 * 把 pickOutput 的结果归一为 task.result
 *
 * #18 改动：用 entry.producedFields 决定返回字段，消除原 if-else 链与 ACTION_PRODUCED_FIELDS 的双源真相。
 * read 任务：只返回 producedFields 中列出的、且 patch 中实际有值的字段
 * write 任务：返回整个 patch
 */
function summarizeForTask(entry: ActionRegistry[string], patch: Record<string, any>, task: TaskNode): any {
  if (entry.kind === 'read' && entry.producedFields.length > 0) {
    const result: Record<string, any> = {}
    let hasAny = false
    for (const field of entry.producedFields) {
      if (patch[field] !== undefined && patch[field] !== null) {
        result[field] = patch[field]
        hasAny = true
      }
    }
    if (hasAny) return result
  }
  return patch
}

/**
 * Summary 节点工厂（LLM Decider 包装）
 * 把所有 taskResult 喂给 LLM，生成自然语言总结
 *
 * 三种 mode：
 * 1. 正常模式：state.taskResults 非空，按 task 汇报成功/失败
 * 2. 空模式：state.taskResults 为空，输出兜底语
 * 3. 规划失败模式：state.plannerError 非空，说明任务计划未通过校验，未执行任何任务，
 *    必须向用户报告失败，禁止幻觉"成功"
 */
export function buildSummaryNode(options?: { maxIterations?: number }) {
  const baseDescription =
    '【唯一任务】用 Markdown 向用户汇报本次操作的最终结果，不要调用任何工具，不要分析意图。\n' +
    '\n' +
    '【action → 中文标签映射】（直接用中文标签，不要暴露 action 英文名）\n' +
    '- create_datasource/modify_datasource/delete_datasource → 数据源\n' +
    '- create_dataset/modify_dataset/delete_dataset → 数据集\n' +
    '- modify_cell → 单元格\n' +
    '- merge_cell → 合并/拆分单元格\n' +
    '- create_row/modify_row/delete_row → 行\n' +
    '- create_col/modify_col/delete_col → 列\n' +
    '- modify_form → 查询表单\n' +
    '- modify_page → 页面配置\n' +
    '- read_* → 读取（加对象名，如：读取当前单元格、读取数据集）\n' +
    '\n' +
    '【标题与分节约定】\n' +
    '- 大标题：**纯文本段落**，**不用** Markdown 标题语法（不加 `#` `##`），**不用**加粗：`<用 userMessage 概括的需求名>任务执行完成`（全部成功）或 `<需求名>任务执行失败`（有失败）\n' +
    '- 一级分节（用 `###`）：`### 一、任务完成情况` / `### 二、任务总结` / `### 三、失败原因与建议`（**不带** emoji）\n' +
    '- 任务小节（用 `####`）：`#### 1.数据源` / `#### 2.数据集` / `#### 3.单元格`（带阿拉伯数字）\n' +
    '- 失败段落小节（用 `####`，**不带**数字前缀）：`#### 数据源`\n' +
    '- 字段项（状态/内容/关键数据）用 Markdown 加粗 + 普通段落：`**状态**: ✅ 成功`（直接顶格，不要加缩进前缀）\n' +
    '- 明细项（A1/B2 等）用普通无序列表 `-` 即可，marked 会自动缩进\n' +
    '\n' +
    '【正确样例】\n' +
    '\n' +
    '设置单元格A1的值为3，B2的值为4任务执行完成\n' +
    '\n' +
    '### 一、任务完成情况\n' +
    '\n' +
    '#### 1.单元格\n' +
    '\n' +
    '**状态**: ✅ 成功\n' +
    '**内容**: 已读取当前报表单元格，并根据用户需求修改了 A1 和 B2 单元格的值\n' +
    '**关键数据**:\n' +
    '\n' +
    '- A1(第1行第1列) → 值 : 3\n' +
    '- B2(第2行第2列) → 值 : 4\n' +
    '\n' +
    '### 二、任务总结\n' +
    '\n' +
    '报表中 A1 单元格的值已设置为3，B2 单元格的值已设置为4，修改操作全部成功，报表当前状态正确。\n' +
    '\n' +
    '【硬约束】\n' +
    '\n' +
    '1. 大标题**不用** Markdown 标题语法（不加 `#` `##` `###`），**不加粗**，直接写纯文本段落\n' +
    '2. 一级分节用 `###`（h2），任务小节用 `####`（h3），**不要**再嵌套 h4\n' +
    '3. 一级分节**不带** emoji；带中文数字（`一、` / `二、` / `三、`）；任务小节带阿拉伯数字（`1.` / `2.` / `3.`）\n' +
    '4. `###` `####` 与标题文字之间**必须**有半角空格\n' +
    '5. 字段项用 `**字段名**: 内容` 加粗段落；明细项用 `- 内容` 无序列表（marked 会自动缩进）\n' +
    '6. **不要**用全角空格、HTML `<div>`、行首空格做缩进——这些都会被 marked 错误解析或丢失\n' +
    '7. 任务块之间**必须**空一行；禁止用 `---` 分隔符\n' +
    '8. 状态前缀：`✅` 成功 / `❌` 失败 / `⚠️` 跳过 / `⏭️` 未执行\n' +
    '9. 有失败时追加 `### 三、失败原因与建议`，结构同"任务完成情况"（`#### <对象名>` + `**<对象名>**: 失败描述` + `**建议**: 后续操作`）\n' +
    '10. 全部成功时省略"三、失败原因与建议"；全部失败时省略"二、任务总结"\n' +
    '11. 输出前自检：标题前后空格、字段加粗语法、块间空行、列表项顶格（不要前置空格）'

  return createLLMDecideNode({
    nodeId: 'summary',
    allowedTools: [],
    disableTools: true,
    requiredToolResultsAny: [],
    maxIterations: options?.maxIterations ?? 2,
    description: (state) => {
      // 关键修复：当 plannerError 非空时，说明规划阶段失败，taskPlan 中的任务从未被 Dispatcher 执行过。
      // 如果不拦截，LLM 会看到 taskPlan（状态仍为 pending）并幻觉"任务执行成功"。
      // 必须明确告知 LLM：规划失败、未执行任何任务、只能报告失败。
      if (state.plannerError) {
        return `【重要：规划失败 — 未执行任何任务】\n` +
          `任务计划未通过系统校验，经过多次重规划仍无法满足要求，因此没有任何任务被实际执行。\n` +
          `taskPlan 中列出的任务状态仍为 pending（未执行），不要将其当作已完成的任务来汇报。\n\n` +
          `错误原因: ${state.plannerError}\n\n` +
          `请按以下要求向用户如实报告失败：\n` +
          `1. 大标题：纯文本，格式为"<需求名>任务执行失败"（不要用 Markdown 标题语法，不要加粗）\n` +
          `2. 只输出一个分节"### 三、失败原因与建议"，用 #### 小节说明失败原因\n` +
          `3. 在失败原因中用通俗语言解释：任务规划未能满足系统校验要求（如缺少必要的前置任务）\n` +
          `4. 给出建议：用户可以尝试更详细地描述需求，或手动在报表设计器中完成操作\n` +
          `5. 禁止输出"### 一、任务完成情况"和"### 二、任务总结"\n` +
          `6. 禁止报告任何任务成功，禁止编造执行结果和数据`
      }
      return baseDescription
    }
  })
}
