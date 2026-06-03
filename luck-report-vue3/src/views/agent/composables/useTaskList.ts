import { ref, computed } from 'vue'
import type { Task } from '../tools/types'

/**
 * 任务列表管理 Hook
 * 负责 Task 对象的创建、更新、查询
 * 使用 Vue 的响应式系统实现任务状态的实时更新
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
    getTaskProgress,
    clearTasks
  }
}