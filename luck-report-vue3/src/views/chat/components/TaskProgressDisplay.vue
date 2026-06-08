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

      <!-- 任务步骤展示，超出最大高度时显示滚动条 -->
      <div class="steps-scroll-wrapper">
        <a-steps
          :current="currentStepIndex"
          :status="stepsStatus"
          direction="vertical"
          size="small"
        >
          <a-step
            v-for="(task, index) in mainTasks"
            :key="task.id"
            :title="`${index + 1}. ${task.content}`"
            :status="getStepStatus(task)"
          >
            <!-- 子任务层级展示 - 暂时隐藏 -->
            <!-- <template #description v-if="getSubtasks(task.id).length > 0">
              <div class="subtask-steps">
                <a-steps
                  :current="getSubtaskCurrentIndex(task.id)"
                  direction="vertical"
                  size="small"
                  class="nested-steps"
                >
                  <a-step
                    v-for="(subtask, subIndex) in getSubtasks(task.id)"
                    :key="subtask.id"
                    :title="`${getSubtaskLetter(subIndex)}. ${subtask.content}`"
                    :status="getStepStatus(subtask)"
                  />
                </a-steps>
              </div>
            </template> -->
          </a-step>
        </a-steps>
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
 * 使用 a-steps 组件可视化任务流程，支持层级展示
 */

interface Props {
  /** 任务列表 */
  tasks: Task[]
  /** 当前工作流节点描述 */
  currentWorkflowNode?: string
}

const props = withDefaults(defineProps<Props>(), {})

/**
 * 主任务列表（没有父步骤的任务）
 */
const mainTasks = computed(() => {
  return props.tasks.filter(t => !t.parentStepId)
})

/**
 * 获取指定主任务的子任务列表
 * @param parentStepId - 父步骤ID
 * @returns 子任务列表
 */
const getSubtasks = (parentStepId: string) => {
  return props.tasks.filter(t => t.parentStepId === parentStepId)
}

/**
 * 获取子任务序号字母（a, b, c, ...）
 * @param index - 子任务索引
 * @returns 序号字母
 */
const getSubtaskLetter = (index: number) => {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  return letters[index] || letters[letters.length - 1]
}

/**
 * 获取子任务列表的当前步骤索引
 * @param parentStepId - 父步骤ID
 * @returns 当前步骤索引
 */
const getSubtaskCurrentIndex = (parentStepId: string) => {
  const subtasks = getSubtasks(parentStepId)
  const inProgressIndex = subtasks.findIndex(t => t.status === 'in_progress')
  if (inProgressIndex >= 0) return inProgressIndex

  const pendingIndex = subtasks.findIndex(t => t.status === 'pending')
  if (pendingIndex >= 0) return pendingIndex

  return subtasks.length - 1
}

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
 * 当前步骤索引（第一个 in_progress 或 pending 的主任务）
 */
const currentStepIndex = computed(() => {
  const inProgressIndex = mainTasks.value.findIndex(t => t.status === 'in_progress')
  if (inProgressIndex >= 0) return inProgressIndex

  const pendingIndex = mainTasks.value.findIndex(t => t.status === 'pending')
  if (pendingIndex >= 0) return pendingIndex

  return mainTasks.value.length - 1
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
      return 'wait'
    default:
      return 'wait'
  }
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

/* 任务列表滚动容器，限制最大高度，超出时显示滚动条 */
.steps-scroll-wrapper {
  max-height: 320px;
  overflow-y: auto;
}

/* 滚动条样式 */
.steps-scroll-wrapper::-webkit-scrollbar {
  width: 4px;
}

.steps-scroll-wrapper::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 2px;
}

.steps-scroll-wrapper::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

/* 子任务层级展示样式 */
.subtask-steps {
  margin-top: 8px;
  padding-left: 24px;
}

/* 嵌套的 a-steps 组件样式调整 */
.nested-steps {
  margin-top: 4px;
}

/* 子任务步骤图标样式 */
.nested-steps :deep(.ant-steps-item-icon) {
  width: 18px;
  height: 18px;
  font-size: 10px;
}

/* 子任务步骤标题样式 */
.nested-steps :deep(.ant-steps-item-title) {
  font-size: 11px;
  color: #595959;
}

/* 子任务步骤连接线样式 */
.nested-steps :deep(.ant-steps-item-tail) {
  top: 12px;
  padding-left: 18px;
}
</style>
