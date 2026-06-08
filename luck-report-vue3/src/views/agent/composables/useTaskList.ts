import { ref, computed } from 'vue'
import type { Task } from '../tools/types'
import type { WorkflowStepRecord } from '../workflow/types'

/**
 * 任务列表管理 Hook
 * 负责 Task 对象的创建、更新、查询
 * 使用 Vue 的响应式系统实现任务状态的实时更新
 * 支持两种模式：
 * - 自由模式：LLM 通过 todos 工具动态创建/更新任务
 * - 工作流模式：代码驱动，从工作流步骤记录同步任务状态
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
   * 从工作流步骤记录同步任务列表
   * 工作流模式下替代 LLM 调用 todos 工具，
   * 代码直接将步骤执行状态映射为 Task 对象
   *
   * @param stepRecords - 工作流步骤执行记录数组
   * @param activeStepId - 当前正在执行的步骤ID，可选
   */
  const syncFromWorkflow = (stepRecords: WorkflowStepRecord[], activeStepId?: string) => {
    const newTasks: Task[] = stepRecords.map(record => ({
      id: record.stepId,
      content: record.stepName,
      status: mapWorkflowStatusToTaskStatus(record.status),
      workflowNode: record.status === 'in_progress' ? record.stepName : undefined,
      timestamp: Date.now(),
      parentStepId: record.parentStepId // 传递父步骤ID，用于前端展示层级关系
    }))
    tasks.value = newTasks

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
    syncFromWorkflow,
    getTaskProgress,
    clearTasks
  }
}

/**
 * 工作流步骤状态映射到任务状态
 * @param status - 工作流步骤状态
 * @returns 任务状态
 */
function mapWorkflowStatusToTaskStatus(
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'error'
): Task['status'] {
  switch (status) {
    case 'in_progress':
      return 'in_progress'
    case 'completed':
      return 'completed'
    case 'cancelled':
    case 'error':
      return 'cancelled'
    default:
      return 'pending'
  }
}