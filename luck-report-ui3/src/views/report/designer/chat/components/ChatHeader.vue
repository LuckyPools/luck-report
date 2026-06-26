<template>
  <div class="chat-header" @mousedown="handleMouseDown" />
</template>

<script setup lang="ts">
/**
 * ChatHeader 组件
 * 对话框头部，保留为拖动句柄
 * - 模型选择已迁移到 InputArea 工具栏左端的 ModelSelect 组件
 * 根元素直接绑定 mousedown 实现拖动
 */

interface Emits {
  (e: 'mousedown', event: MouseEvent): void
}

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
  height: 8px;
  min-height: 8px;
  background-color: transparent;
  flex-shrink: 0;
  cursor: move;
  user-select: none;
}
</style>
