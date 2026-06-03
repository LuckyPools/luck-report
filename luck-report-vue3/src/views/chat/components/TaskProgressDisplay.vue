<template>
  <div v-if="tasks.length > 0" class="task-progress-display">
    <a-card :bordered="true">
      <template #title>
        <CheckSquareOutlined />
        <span class="card-title-text">{{ currentWorkflowNode }}</span>
      </template>
      <template #extra>
        <LoadingOutlined v-if="hasInProgressTask" spin />
        <CheckCircleOutlined v-else-if="allCompleted" />
      </template>

      <!-- 任务步骤展示 -->
      <a-steps
        :current="currentStepIndex"
        :status="stepsStatus"
        direction="vertical"
        size="small"
      >
        <a-step
          v-for="task in visibleTasks"
          :key="task.id"
          :title="task.content"
          :status="getStepStatus(task)"
          :description="getStepDescription(task)"
        />
      </a-steps>

      <!-- 隐藏任务摘要 -->
      <div v-if="hiddenTasksCount > 0" class="hidden-summary">
        <span>还有 {{ hiddenTasksCount }} 个任务...</span>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Steps as ASteps, Step as AStep, Card as ACard } from 'ant-design-vue'
import { LoadingOutlined, CheckCircleOutlined, CheckSquareOutlined } from '@ant-design/icons-vue'
import type { Task } from '@/views/agent/tools/types'

/**
 * TaskProgressDisplay 组件
 * 展示 Agent 的任务规划步骤和执行进度
 * 使用 a-steps 组件可视化任务流程
 */

interface Props {
  /** 任务列表 */
  tasks: Task[]
  /** 当前工作流节点描述 */
  currentWorkflowNode?: string
  /** 最大显示任务数量 */
  maxDisplay?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxDisplay: 5
})

/**
 * 是否有正在执行的任务
 */
const hasInProgressTask = computed(() => {
  return props.tasks.some(t => t.status === 'in_progress')
})

/**
 * 是否所有任务已完成
 */
const allCompleted = computed(() => {
  return props.tasks.length > 0 && props.tasks.every(t => t.status === 'completed')
})

/**
 * 当前步骤索引（第一个 in_progress 或 pending 的任务）
 */
const currentStepIndex = computed(() => {
  const inProgressIndex = props.tasks.findIndex(t => t.status === 'in_progress')
  if (inProgressIndex >= 0) return inProgressIndex

  const pendingIndex = props.tasks.findIndex(t => t.status === 'pending')
  if (pendingIndex >= 0) return pendingIndex

  return props.tasks.length - 1
})

/**
 * Steps 组件状态
 */
const stepsStatus = computed(() => {
  if (allCompleted.value) return 'finish'
  if (hasInProgressTask.value) return 'process'
  return 'wait'
})

/**
 * 可见任务列表（限制显示数量）
 */
const visibleTasks = computed(() => {
  return props.tasks.slice(0, props.maxDisplay)
})

/**
 * 隐藏任务数量
 */
const hiddenTasksCount = computed(() => {
  return Math.max(0, props.tasks.length - props.maxDisplay)
})

/**
 * 获取单个步骤的状态
 * @param task - 任务对象
 * @returns 步骤状态
 */
const getStepStatus = (task: Task) => {
  switch (task.status) {
    case 'completed':
      return 'finish'
    case 'in_progress':
      return 'process'
    case 'cancelled':
      return 'error'
    default:
      return 'wait'
  }
}

/**
 * 获取步骤描述（显示依赖关系）
 * @param task - 任务对象
 * @returns 步骤描述
 */
const getStepDescription = (task: Task) => {
  if (task.dependencies && task.dependencies.length > 0) {
    return `依赖任务: ${task.dependencies.join(', ')}`
  }
  return undefined
}
</script>

<style scoped>
.task-progress-display {
  margin: 8px 0;
}

/* 覆盖 a-card 默认样式，与 tool-call 保持一致 */
.task-progress-display :deep(.ant-card) {
  border: 1px solid #1677ff;
  border-radius: 8px;
}

.task-progress-display :deep(.ant-card-head) {
  padding: 0;
  min-height: auto;
  border-bottom: 1px solid #e5e7eb;
}

.task-progress-display :deep(.ant-card-head-wrapper) {
  padding: 8px 12px;
}

.task-progress-display :deep(.ant-card-head-title) {
  font-size: 12px;
  font-weight: 500;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.task-progress-display :deep(.ant-card-head-title .anticon) {
  /** color: #1677ff; **/
  font-size: 16px;
}

.card-title-text {
  line-height: 1;
  font-size: 12px;
}

.task-progress-display :deep(.ant-card-extra) {
  font-size: 14px;
  padding: 0;
}

.task-progress-display :deep(.ant-card-body) {
  padding: 12px;
}

/* steps 标题字体与 tool-call 保持一致 */
.task-progress-display :deep(.ant-steps-item-title) {
  font-size: 12px;
}

.hidden-summary {
  margin-top: 8px;
  color: #999;
  font-size: 12px;
}
</style>
