import {computed, ref} from 'vue'
import type {Task} from '../tools/types'
import type {WorkflowStepRecord} from '../workflow/state.ts'
import type {TaskNode, TaskStatus} from '../workflow/task-plan.ts'
import {getActionLabel} from '../workflow/task-plan.ts'

/**
 * 任务列表管理 Hook，负责 Task 对象的创建、更新、查询
 */
export function useTaskList() {
  /** 任务列表 */
  const tasks = ref<Task[]>([])

  /** 当前工作流节点描述 */
  const currentWorkflowNode = ref<string>('')

  /**
   * 更新任务列表
   * 每次调用都会完全替换任务列表，支持 LLM 动态调整任务
   *
   * @param newTasks - 新的任务列表
   * @param workflowNode - 当前工作流节点描述
   */
  const updateTasks = (newTasks: Task[], workflowNode?: string) => {
    tasks.value = newTasks
    if (workflowNode) {
      currentWorkflowNode.value = workflowNode
    }
  }

  /**
   * 从 LLM 规划的 TaskPlan 同步任务列表（v2 主路径）
   * 取代旧 syncFromWorkflow，避免把 LangGraph 主图节点（load_docs / dispatch_task / summary…）渲染到 UI
   *
   * @param plan - LLM 通过 plan_tasks 提交的任务计划
   * @param activeNodeId - 当前正在执行的 LangGraph 节点（validate_plan / dispatch_task），仅日志使用
   */
  const updateFromTaskPlan = (plan: TaskNode[], activeNodeId?: string) => {
    tasks.value = plan.map(t => ({
      id: t.id,
      content: buildTaskContent(t),
      status: mapTaskNodeStatus(t.status),
      timestamp: Date.now()
    }))
    // 卡片标题写死为"任务规划"，activeNodeId 仅保留供未来扩展
    currentWorkflowNode.value = '任务规划'
    if (activeNodeId) {
      console.log(`[useTaskList] 任务计划更新 from=${activeNodeId}, 任务数=${plan.length}`)
    }
  }

  /**
   * 从工作流步骤记录同步任务列表
   * 工作流模式下替代 LLM 调用 todos 工具，
   * 代码直接将步骤执行状态映射为 Task 对象
   *
   * @param stepRecords - 工作流步骤执行记录数组
   * @param activeStepId - 当前正在执行的步骤ID，可选
   */
  const syncFromWorkflow = (stepRecords: WorkflowStepRecord[], activeStepId?: string) => {
    tasks.value = stepRecords.map(record => ({
      id: record.stepId,
      content: record.stepName,
      status: mapWorkflowStatusToTaskStatus(record.status),
      workflowNode: record.status === 'in_progress' ? record.stepName : undefined,
      timestamp: Date.now(),
      parentStepId: record.parentStepId // 传递父步骤ID，用于前端展示层级关系
    }))

    // 更新当前工作流节点
    const activeStep = stepRecords.find(r => r.stepId === activeStepId || r.status === 'in_progress')
    if (activeStep) {
      currentWorkflowNode.value = activeStep.stepName
    }
  }

  /**
   * 获取任务进度统计
   * 计算已完成、进行中、待执行的任务数量和完成百分比
   *
   * @returns 任务统计信息
   */
  const getTaskProgress = computed(() => {
    const total = tasks.value.length
    const completed = tasks.value.filter(t => t.status === 'completed').length
    const inProgress = tasks.value.filter(t => t.status === 'in_progress').length
    const pending = tasks.value.filter(t => t.status === 'pending').length

    return {
      total,
      completed,
      inProgress,
      pending,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  })

  /**
   * 清空任务列表
   * 在新对话开始或任务完成后调用
   */
  const clearTasks = () => {
    tasks.value = []
    currentWorkflowNode.value = ''
  }

  return {
    tasks,
    currentWorkflowNode,
    updateTasks,
    updateFromTaskPlan,
    syncFromWorkflow,
    getTaskProgress,
    clearTasks
  }
}

/**
 * 把 LLM 规划的 TaskNode 映射成 UI Task 的 content 文本
 * 格式：`<action 中文标签>` 或 `<action 中文标签> - <params 短描述>`
 *
 * params 短描述按以下顺序取第一个非空值：
 * purpose → name → description → cellAddress → cellAddresses(取首项)
 */
function buildTaskContent(t: TaskNode): string {
  const label = getActionLabel(t.action)
  const params = t.params ?? {}
  const short =
    (typeof params.purpose === 'string' && params.purpose) ||
    (typeof params.name === 'string' && params.name) ||
    (typeof params.description === 'string' && params.description) ||
    (typeof params.cellAddress === 'string' && params.cellAddress) ||
    (Array.isArray(params.cellAddresses) && params.cellAddresses[0])
  return short ? `${label} - ${short}` : label
}

/**
 * TaskPlan 的 TaskNode.status → UI Task['status'] 映射
 * @param status - TaskNode 状态（pending/in_progress/success/failed/skipped）
 * @returns UI Task 状态
 */
function mapTaskNodeStatus(
  status: TaskStatus | string | undefined
): Task['status'] {
  switch (status) {
    case 'success':
      return 'completed'
    case 'failed':
    case 'skipped':
      return 'cancelled'
    case 'in_progress':
      return 'in_progress'
    case 'pending':
    default:
      return 'pending'
  }
}

/**
 * 工作流步骤状态映射到任务状态
 * @param status - 工作流步骤状态
 * @returns 任务状态
 */
function mapWorkflowStatusToTaskStatus(
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'error' | 'skipped'
): Task['status'] {
  switch (status) {
    case 'in_progress':
      return 'in_progress'
    case 'completed':
      return 'completed'
    case 'cancelled':
    case 'error':
    case 'skipped':
      return 'cancelled'
    default:
      return 'pending'
  }
}
