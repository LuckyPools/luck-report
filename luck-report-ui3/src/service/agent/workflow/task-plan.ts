/**
 * 任务计划抽象：TaskNode / TaskPlan
 * 解决多节点配合、循环、读写混合、跨组件依赖等场景的统一抽象
 *
 * 设计要点：
 * 1. 任何"动作"都是 TaskNode（读写、循环、批处理都靠 dependsOn/params 表达，不为特定场景建专用节点）
 * 2. understand_and_plan 节点（LLM）把用户需求拆成 TaskPlan JSON
 * 3. Dispatcher 节点（代码）自环执行 TaskPlan，拓扑排序 + 失败策略
 * 4. summary 是 TaskNode 的一种 action，由 Dispatcher 收尾
 */

import type { CompiledReportGraph } from './types'
import type { ReportState } from './state'
import type { WorkflowRuntime } from './runtime'
import type { ToolRegistry } from '../tools/registry'

/** 任务执行状态（运行时由 Dispatcher 写） */
export type TaskStatus = 'pending' | 'in_progress' | 'success' | 'failed' | 'skipped'

/** 失败策略：abort=中断后续任务 / skip=标 skipped 继续 / continue=忽略失败继续（依赖者继续跑） */
export type TaskFailPolicy = 'abort' | 'skip' | 'continue'

/** 任务节点（Planner 输出 / Dispatcher 输入） */
export interface TaskNode {
  /** 任务唯一 ID（同 plan 内唯一），Planner 输出 t1/t2/... */
  id: string
  /** 任务动作：见 EXECUTABLE_ACTIONS 常量，read_* / create_* / modify_* / delete_* / summary */
  action: string
  /** 动作参数，透传给对应 executor / 子图 */
  params?: Record<string, any>
  /** 依赖的 task id 列表：所列任务全部 success 后本任务才可执行 */
  dependsOn?: string[]
  /** 失败策略，默认 abort */
  onFail?: TaskFailPolicy
  /** 单任务最大重试次数（不含首次），默认 0 */
  maxRetries?: number
  /** 状态：运行时由 Dispatcher 维护，Planner 输出可不填 */
  status?: TaskStatus
  /** 任务结果：运行时由 Dispatcher 写 */
  result?: any
  /** 错误信息：运行时由 Dispatcher 写 */
  error?: string
  /** 已重试次数：运行时由 Dispatcher 写 */
  retryCount?: number
}

/** 任务计划 = 任务节点列表 */
export type TaskPlan = TaskNode[]

/** Task 执行结果（executor 返回值） */
export interface TaskExecResult {
  /** 写回 state 的 patch（dispatcher 会 merge 到 taskResults / 业务字段） */
  statePatch: Record<string, any>
  /** 透传 task.result（一般等于 statePatch 的关键摘要） */
  result: any
}

/** Task 执行器签名 */
export type TaskExecutor = (
  state: ReportState,
  task: TaskNode,
  runtime: WorkflowRuntime
) => Promise<TaskExecResult>

/** 注册 action → 子图工厂 + 输出映射的注册表条目 */
export interface ActionRegistryEntry {
  /** 子图工厂，接收 task 闭包注入参数（用于透传 userMessage/taskParams 到子图） */
  factory: (task?: TaskNode) => CompiledReportGraph
  /** 把子图输出映射到父图 state（fields → state） */
  pickOutput: (subResult: any, task: TaskNode) => Record<string, any>
  /** 节点 ID 标识（用于事件、日志） */
  nodeId: string
  /** 写任务还是读任务（read 任务失败不回滚） */
  kind: 'read' | 'write'
}

/** Dispatcher 内部用：action → registry 映射 */
export type ActionRegistry = Record<string, ActionRegistryEntry>

/**
 * 可执行 action 白名单（单一来源，PLANNER_TASK_SCHEMA 共享）
 */
export const EXECUTABLE_ACTIONS = [
  // 读
  'read_datasources',
  'read_datasets',
  'read_cells',
  'read_rows',
  'read_cols',
  'read_form',
  'read_page',
  'read_report',
  // 写：数据源
  'create_datasource',
  'modify_datasource',
  'delete_datasource',
  // 写：数据集
  'create_dataset',
  'modify_dataset',
  'delete_dataset',
  // 写：单元格 / 行 / 列
  'modify_cell',
  'create_row',
  'modify_row',
  'delete_row',
  'create_col',
  'modify_col',
  'delete_col',
  // 写：表单 / 页面
  'modify_form',
  'modify_page'
] as const

/**
 * summary 动作：仅供内部引用，不放在 EXECUTABLE_ACTIONS 里
 * 原因：summary 由主图的独立 summary 节点统一处理（dispatch_task → summary → END），
 * 重复出现在 TaskPlan 里会被 Dispatcher 标为 failed（无对应执行器）。
 * Planner 提示词已删除"必须最后加一个 summary 任务"的规则。
 */
export const SUMMARY_ACTION = 'summary'

/** action 名（EXECUTABLE_ACTIONS 的 element 类型） */
export type ExecutableAction = typeof EXECUTABLE_ACTIONS[number]

/**
 * action → 中文标签（UI 展示用，单一来源）
 *
 * 维护规则：
 * - 与 EXECUTABLE_ACTIONS / SUMMARY_ACTION 保持同步，新加 action 时务必同步本表
 * - 口径与 dispatcher.ts 的 summary 描述里"action → 中文标签映射"段落一致
 */
export const ACTION_LABELS: Record<string, string> = {
  // 读
  read_datasources: '读取数据源',
  read_datasets: '读取数据集',
  read_cells: '读取单元格',
  read_rows: '读取行',
  read_cols: '读取列',
  read_form: '读取查询表单',
  read_page: '读取页面配置',
  read_report: '读取报表',
  // 写：数据源
  create_datasource: '创建数据源',
  modify_datasource: '修改数据源',
  delete_datasource: '删除数据源',
  // 写：数据集
  create_dataset: '创建数据集',
  modify_dataset: '修改数据集',
  delete_dataset: '删除数据集',
  // 写：单元格 / 行 / 列
  modify_cell: '修改单元格',
  create_row: '创建行',
  modify_row: '修改行',
  delete_row: '删除行',
  create_col: '创建列',
  modify_col: '修改列',
  delete_col: '删除列',
  // 写：表单 / 页面
  modify_form: '修改查询表单',
  modify_page: '修改页面配置',
  // summary
  summary: '汇总'
}

/**
 * 取 action 的中文标签；未知 action 兜底返回原 action 字符串
 */
export function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}

/** Planner 输出（Function Calling 工具 plan_tasks 的 input schema）
 *
 * 关键设计：action 字段是受控 enum（不是 string），强制 LLM 只能选可执行动作
 */
export const PLANNER_TASK_SCHEMA = {
  type: 'object',
  properties: {
    tasks: {
      type: 'array',
      description: '任务计划列表，按执行顺序排列；同 dependsOn 的任务可并行',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '任务 ID，同 plan 内唯一，推荐 t1/t2/...' },
          action: {
            type: 'string',
            enum: EXECUTABLE_ACTIONS,
            description: '任务动作，决定走哪个 executor；可选值见 EXECUTABLE_ACTIONS'
          },
          params: { type: 'object', description: '动作参数，透传给对应 executor' },
          dependsOn: { type: 'array', items: { type: 'string' }, description: '依赖的 task id 列表' },
          onFail: { type: 'string', enum: ['abort', 'skip', 'continue'], description: '失败策略，默认 abort' },
          maxRetries: { type: 'number', description: '最大重试次数（不含首次），默认 0' }
        },
        required: ['id', 'action']
      }
    }
  },
  required: ['tasks']
} as const

/** Planner 工具名（Function Calling 工具） */
export const PLANNER_TOOL_NAME = 'plan_tasks'

/**
 * 注册 Planner 虚拟工具到 toolRegistry
 * plan_tasks 不是真实工具（不操作设计器），但需要出现在 LLM 的 tools 列表中，
 * 让 LLM 按 function calling 格式返回结构化 TaskPlan
 *
 * @param registry - 工具注册表
 */
export function registerPlannerTool(registry: ToolRegistry): void {
  registry.register({
    name: PLANNER_TOOL_NAME,
    description: '把用户需求拆成 TaskPlan 任务列表。必填字段：tasks 数组（至少 1 项），每个元素含 id、action，可选 params/dependsOn/onFail/maxRetries。',
    inputSchema: PLANNER_TASK_SCHEMA as unknown as Record<string, any>,
    validate: (input: any) => {
      if (!input || typeof input !== 'object') {
        return '缺少 tasks 参数。正确：{"tasks":[{"id":"t1","action":"read_cols"}]}'
      }
      if (input.tasks === undefined) {
        return '缺少 tasks 参数。正确：{"tasks":[{"id":"t1","action":"read_cols"}]}'
      }
      if (!Array.isArray(input.tasks) && typeof input.tasks !== 'string') {
        return 'tasks 参数必须是 JSON 数组。正确：{"tasks":[{"id":"t1","action":"read_cols"}]}'
      }
      let tasks: any = input.tasks
      if (typeof tasks === 'string') {
        try { tasks = JSON.parse(tasks) } catch { return 'tasks 字符串无法解析为 JSON 数组' }
      }
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return 'tasks 数组不能为空，至少需要 1 个任务。正确：{"tasks":[{"id":"t1","action":"create_datasource","params":{"purpose":"查用户信息"}}]}'
      }
      return null
    },
    execute: async (input: any) => {
      if (!input || typeof input !== 'object') {
        return { error: '缺少 tasks 参数', success: false, message: '必须传 tasks 数组' }
      }
      let tasks = input.tasks
      if (typeof tasks === 'string') {
        try {
          tasks = JSON.parse(tasks)
        } catch {
          return { error: 'tasks 字符串无法解析', success: false, message: 'tasks 字符串无法解析为 JSON 数组' }
        }
      }
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return { error: 'tasks 数组为空', success: false, message: '必须至少包含 1 个任务' }
      }
      return { tasks }
    },
    readOnly: true,
    requireConfirm: false,
    // 关键决策点：plan_tasks 是虚拟工具，仅作 function calling 协议锚点
    // 不操作设计器，对话区展示对用户没有价值，统一通过 showMessage=false 关闭
    showMessage: false
  })
}

/**
 * 校验 TaskPlan 合法性
 * 1. id 唯一
 * 2. dependsOn 引用的 id 必须存在
 * 3. 不能形成环（DFS 检测）
 */
export function validateTaskPlan(plan: TaskPlan): string[] {
  const errors: string[] = []
  if (!Array.isArray(plan) || plan.length === 0) {
    errors.push('TaskPlan 为空')
    return errors
  }
  const ids = new Set<string>()
  for (const t of plan) {
    if (!t.id) errors.push('任务缺少 id')
    else if (ids.has(t.id)) errors.push(`任务 id 重复: ${t.id}`)
    else ids.add(t.id)
  }
  for (const t of plan) {
    for (const dep of t.dependsOn ?? []) {
      if (!ids.has(dep)) errors.push(`任务 ${t.id} 引用了不存在的依赖 ${dep}`)
    }
  }
  // 环检测：DFS
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const adj = new Map<string, string[]>()
  for (const t of plan) adj.set(t.id, t.dependsOn ?? [])
  const dfs = (id: string): boolean => {
    if (visited.has(id)) return false
    if (visiting.has(id)) return true
    visiting.add(id)
    for (const d of adj.get(id) ?? []) {
      if (dfs(d)) return true
    }
    visiting.delete(id)
    visited.add(id)
    return false
  }
  for (const t of plan) {
    if (dfs(t.id)) {
      errors.push(`任务依赖形成环，包含: ${t.id}`)
      break
    }
  }
  return errors
}

/**
 * 计算当前可执行的任务（status=pending 且所有依赖 success）
 */
export function pickReadyTasks(plan: TaskPlan): TaskNode[] {
  const byId = new Map<string, TaskNode>()
  for (const t of plan) byId.set(t.id, t)
  return plan.filter(t => {
    if (t.status !== 'pending' && t.status !== 'in_progress') return false
    return (t.dependsOn ?? []).every(dep => byId.get(dep)?.status === 'success')
  })
}

/**
 * 判断 TaskPlan 是否全部完成（无 pending/in_progress）
 */
export function isPlanDone(plan: TaskPlan): boolean {
  return plan.every(t => ['success', 'failed', 'skipped'].includes(t.status ?? ''))
}

/**
 * 判断 TaskPlan 是否处于"卡死"状态（无 pending/in_progress 但又未 done）
 */
export function isPlanDead(plan: TaskPlan): boolean {
  if (isPlanDone(plan)) return false
  const active = plan.filter(t => t.status === 'pending' || t.status === 'in_progress')
  return active.length === 0
}

/**
 * 根据失败策略，传播失败/跳过状态
 * 任务 t 失败后，所有"depends on t 且 onFail 不是 continue"的任务被标 skipped
 */
export function propagateFailure(plan: TaskPlan, failedId: string): TaskPlan {
  const failedTask = plan.find(t => t.id === failedId)
  if (!failedTask) return plan
  const failPolicy = failedTask.onFail ?? 'abort'
  for (const t of plan) {
    if (t.status !== 'pending') continue
    if (!(t.dependsOn ?? []).includes(failedId)) continue
    if (failPolicy === 'continue') {
      t.status = 'failed'
      t.error = `依赖任务 ${failedId} 失败`
    } else {
      t.status = 'skipped'
      t.error = `依赖任务 ${failedId} 失败（${failPolicy}）`
    }
  }
  return plan
}

/**
 * 动作依赖拓扑（单一来源）
 *
 * 语义：key 动作必须排在 value 列表中所有动作之后。
 * - validate_plan 阶段会按此表自动补 dependsOn（LLM 没显式写时）
 * - understand-plan.md 也直接引用此表作为 prompt 的"动作依赖拓扑"段落
 * - 改顺序约束：只动这张表即可
 */
export const ACTION_DEPENDENCY_TOPOLOGY: Record<string, string[]> = {
  // 数据集相关
  create_dataset: ['create_datasource'],
  modify_dataset: ['create_datasource'],
  delete_dataset: ['create_datasource'],
  // 单元格（依赖数据集 + 行列）
  modify_cell: ['create_dataset', 'create_row', 'create_col'],
  // 行/列（依赖数据集坐标）
  create_row: ['create_dataset'],
  create_col: ['create_dataset'],
  // 表单：依赖数据集字段 + 数据源
  modify_form: ['create_dataset', 'create_datasource']
}

/**
 * 按动作依赖拓扑自动补 dependsOn
 *
 * 算法：对每个 task，按拓扑表找出它应依赖的前置动作，
 *       在 plan 中向前找最近的同 action task，追加到 dependsOn（去重）
 *
 * 不修改任务顺序、不修改 id、不修改 LLM 显式写的依赖；
 * 只追加拓扑要求的、且 LLM 没写的依赖。
 */
export function inferMissingDependsOn(plan: TaskPlan): TaskPlan {
  for (let i = 0; i < plan.length; i++) {
    const task = plan[i]
    const requiredActions = ACTION_DEPENDENCY_TOPOLOGY[task.action]
    if (!requiredActions || requiredActions.length === 0) continue

    const existingDeps = new Set(task.dependsOn ?? [])
    for (const reqAction of requiredActions) {
      // 已在 dependsOn 里 → 跳过（LLM 写过了，不再改）
      const alreadyDeps = (task.dependsOn ?? []).some(depId => {
        const depTask = plan.find(t => t.id === depId)
        return depTask?.action === reqAction
      })
      if (alreadyDeps) continue

      // 在 plan 中向前找最近的同 action task
      const dep = plan.slice(0, i).reverse().find(t => t.action === reqAction)
      if (dep && !existingDeps.has(dep.id)) {
        task.dependsOn = [...(task.dependsOn ?? []), dep.id]
        existingDeps.add(dep.id)
      }
    }
  }
  return plan
}

/**
 * 覆盖度校验：userMessage 意图与 plan 动作的语义对齐
 *
 * 返回错误字符串数组，空数组表示通过
 * - 规则从严到松：宁可误报（让 LLM 重规划补任务），不可漏报（导致 LLM 漏规划后 summary 幻觉）
 * - 新增规则：在 ACTION_COVERAGE_RULES 加一条即可
 */
export const ACTION_COVERAGE_RULES: Array<{
  /** 触发条件：userMessage 满足此正则时启用本规则 */
  pattern: RegExp
  /** 校验描述（出错时返回给 LLM 看） */
  description: string
  /** 检查 plan 动作是否满足 */
  check: (actions: Set<string>) => boolean
}> = [
  {
    // 涉及数据展示/列出/导出 → 必须有 modify_cell 或 create_row
    pattern: /(修改|设置|更改|赋值|变成|展示|显示|列出来|列出|导出|看到|呈现)/,
    description: '用户要求展示/显示数据,但 plan 未包含 modify_cell 或 create_row',
    check: (actions) => actions.has('modify_cell') || actions.has('create_row')
  },
  {
    // 涉及查询筛选条件 → 必须有 modify_form
    pattern: /(按|输入|根据|通过|支持).*(查询|筛选|搜索|条件|参数)/,
    description: '用户要求筛选/查询数据,但 plan 未包含 modify_form',
    check: (actions) => actions.has('modify_form')
  },
  {
    // 涉及创建/添加数据集 → 必须有 create_dataset
    pattern: /(创建|添加|新增|增加).*(数据集|dataset)/i,
    description: '用户要求创建/添加数据集,但 plan 未包含 create_dataset',
    check: (actions) => actions.has('create_dataset')
  },
  {
    // 涉及 modify_form → 必须先有 create_dataset（依赖检查）
    pattern: /(筛选|查询|条件|参数)/,
    description: '用户要求添加查询表单,但 plan 未包含 create_dataset（表单依赖数据集）',
    check: (actions) => !actions.has('modify_form') || actions.has('create_dataset')
  }
]

export function checkPlanCoverage(userMessage: string, plan: TaskPlan): string[] {
  if (!userMessage) return []
  const actions = new Set(plan.map(t => t.action))
  const errors: string[] = []
  for (const rule of ACTION_COVERAGE_RULES) {
    if (rule.pattern.test(userMessage) && !rule.check(actions)) {
      errors.push(rule.description)
    }
  }
  return errors
}

