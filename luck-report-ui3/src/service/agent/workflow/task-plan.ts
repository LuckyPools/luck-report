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
  'modify_page',
  // 收尾
  'summary'
] as const

/** action 名（EXECUTABLE_ACTIONS 的 element 类型） */
export type ExecutableAction = typeof EXECUTABLE_ACTIONS[number]

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
    description: '把用户需求拆成 TaskPlan 任务列表。必填字段：tasks 数组，每个元素含 id、action，可选 params/dependsOn/onFail/maxRetries。',
    inputSchema: PLANNER_TASK_SCHEMA as unknown as Record<string, any>,
    validate: (input: any) => {
      if (!input || typeof input !== 'object') return null
      if (input.tasks !== undefined && !Array.isArray(input.tasks) && typeof input.tasks !== 'string') {
        return 'tasks 参数必须是 JSON 数组。正确：{"tasks":[{"id":"t1","action":"read_cols"}]}'
      }
      return null
    },
    execute: async (input: any) => {
      if (!input || typeof input !== 'object') {
        return { tasks: [] }
      }
      let tasks = input.tasks
      if (typeof tasks === 'string') {
        try {
          tasks = JSON.parse(tasks)
        } catch {
          return { tasks: [] }
        }
      }
      if (!Array.isArray(tasks)) {
        return { tasks: [] }
      }
      return { tasks }
    },
    readOnly: true,
    requireConfirm: false
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
 * 根据 intent 结构化信息生成兜底 TaskPlan
 * 当 LLM 未能成功调用 plan_tasks 时，基于 intent 的 needs* 标志位推断任务链
 */
export function generateFallbackPlan(
  intent: { taskDescription?: string; intentType?: string },
  userMessage: string
): TaskPlan {
  // 无法推断时返回空 plan，由 summary 兜底
  if (!intent?.taskDescription && !userMessage) return []
  const desc = intent?.taskDescription ?? userMessage
  return [
    {
      id: 't1',
      action: 'read_report',
      params: { description: `读取当前报表结构` },
      dependsOn: [],
      onFail: 'abort',
      maxRetries: 0,
      status: 'pending',
      retryCount: 0
    },
    {
      id: 't2',
      action: 'summary',
      params: { description: `汇报结果：${desc}` },
      dependsOn: ['t1'],
      onFail: 'abort',
      maxRetries: 0,
      status: 'pending',
      retryCount: 0
    }
  ]
}
