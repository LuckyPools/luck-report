<template>
  <div class="chat-header" @mousedown="handleMouseDown">
    <div class="header-left">
      <span class="model-name">{{ currentModel }}</span>
    </div>
    <div class="header-right">
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
import { Button as AButton, Tooltip as ATooltip, Popconfirm as APopconfirm } from 'ant-design-vue'
import {
  CloseOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'

/**
 * ChatHeader 组件
 * 对话框头部，对照 HiveChat ChatHeader 精简功能
 * - 显示当前模型名称
 * - 删除聊天按钮（对应 HiveChat 的 deleteChat）
 * - 关闭按钮
 * 已移除：星标按钮、清空按钮（清空在 InputArea 工具栏中已有）
 * 根元素直接绑定 mousedown 实现拖动，close 按钮 stop 防止触发拖动
 */

interface Props {
  /** 当前模型显示名称 */
  currentModel: string
}

interface Emits {
  (e: 'close'): void
  (e: 'mousedown', event: MouseEvent): void
  (e: 'deleteChat'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

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

.model-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
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
