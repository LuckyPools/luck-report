<template>
  <div v-if="visible" class="scroll-to-bottom" @click="emit('click')">
    <DownOutlined />
  </div>
</template>

<script setup lang="ts">
import { DownOutlined } from '@ant-design/icons-vue'

/**
 * ScrollToBottomButton 组件
 * 当用户手动上滚后显示，点击可快速回到底部
 */

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'click'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped>
.scroll-to-bottom {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  z-index: 100;
  transition: all 0.2s;
}

.scroll-to-bottom:hover {
  background-color: #f9fafb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}

.scroll-to-bottom :deep(.anticon) {
  font-size: 14px;
  color: #6b7280;
}
</style>
