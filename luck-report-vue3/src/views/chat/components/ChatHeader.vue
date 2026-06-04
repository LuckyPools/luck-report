<template>
  <div class="chat-header" @mousedown="handleMouseDown">
    <div class="header-left">
      <a-select
        v-model:value="selectedModelId"
        class="model-select"
        :loading="isPending"
        @change="handleModelChange"
        @click.stop
      >
        <a-select-option v-for="model in modelList" :key="model.id" :value="model.id">
          {{ model.displayName }}
        </a-select-option>
      </a-select>
    </div>
    <div class="header-right">
      <a-tooltip title="历史对话">
        <a-button type="text" size="small" @click.stop="emit('openChatList')">
          <template #icon><UnorderedListOutlined /></template>
        </a-button>
      </a-tooltip>
      <a-popconfirm
        title="确认删除"
        description="确定要删除当前聊天吗？删除后不可恢复。"
        ok-text="确定"
        cancel-text="取消"
        @confirm="emit('deleteChat')"
      >
        <a-tooltip title="删除聊天">
          <a-button type="text" size="small" @click.stop>
            <template #icon><DeleteOutlined /></template>
          </a-button>
        </a-tooltip>
      </a-popconfirm>
      <a-tooltip title="关闭">
        <a-button type="text" size="small" @click.stop="emit('close')">
          <template #icon><CloseOutlined /></template>
        </a-button>
      </a-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button as AButton, Tooltip as ATooltip, Popconfirm as APopconfirm, Select as ASelect, SelectOption as ASelectOption } from 'ant-design-vue'
import {
  CloseOutlined,
  DeleteOutlined,
  UnorderedListOutlined
} from '@ant-design/icons-vue'
import type { LLMModel } from '../types/chat'

/**
 * ChatHeader 组件
 * 对话框头部，对照 HiveChat ChatHeader 精简功能
 * - 显示模型选择下拉框，用户可以选择不同的模型
 * - 删除聊天按钮（对应 HiveChat 的 deleteChat）
 * - 关闭按钮
 * 已移除：星标按钮、清空按钮（清空在 InputArea 工具栏中已有）
 * 根元素直接绑定 mousedown 实现拖动，close 按钮 stop 防止触发拖动
 */

interface Props {
  /** 模型列表 */
  modelList: LLMModel[]
  /** 当前模型 */
  currentModel: LLMModel
  /** 是否正在加载 */
  isPending?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'mousedown', event: MouseEvent): void
  (e: 'deleteChat'): void
  (e: 'openChatList'): void
  (e: 'modelChange', modelId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/** 当前选中的模型ID */
const selectedModelId = ref<string>(props.currentModel?.id || '')

/**
 * 监听 currentModel 变化，更新选中状态
 */
watch(() => props.currentModel, (newModel) => {
  if (newModel) {
    selectedModelId.value = newModel.id
  }
}, { immediate: true })

/**
 * 处理模型选择变化
 * @param modelId 选中的模型ID
 */
const handleModelChange = (modelId: string) => {
  const selectedModel = props.modelList.find(m => m.id === modelId)
  if (selectedModel) {
    emit('modelChange', modelId)
  }
}

/**
 * 处理鼠标按下事件
 * 通知父组件开始拖动
 * @param e - 鼠标事件对象
 */
const handleMouseDown = (e: MouseEvent) => {
  emit('mousedown', e)
}
</script>

<style scoped>
.chat-header {
  height: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background-color: #f9fafb;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  cursor: move;
  user-select: none;
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
}

.model-select {
  width: 180px;
  font-size: 14px;
}

.model-select :deep(.ant-select-selector) {
  border: none;
  background-color: transparent;
  font-weight: 500;
  color: #374151;
}

.model-select :deep(.ant-select-selection-item) {
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-right :deep(.ant-btn) {
  color: #9ca3af;
}

.header-right :deep(.ant-btn:hover) {
  color: #4b5563;
}
</style>
