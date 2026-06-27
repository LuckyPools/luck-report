<template>
  <div
    class="ai-dialog-header"
    @mousedown="handleMouseDown"
    :style="{ cursor: isDragging ? 'grabbing' : 'grab' }"
  >
    <div class="ai-dialog-title-wrapper">
      <img class="ai-dialog-logo" :src="logoUrl" alt="智能助手" />
      <span class="ai-dialog-title">智能助手</span>
    </div>
    <div class="ai-dialog-actions"></div>
    <button class="ai-dialog-close" @click="handleClose">×</button>
  </div>
</template>

<script setup lang="ts">
import logoUrl from '@/assets/images/ai/agent-header.png'

interface Props {
  isDragging: boolean
}

interface Emits {
  (e: 'mousedown', event: MouseEvent): void
  (e: 'close'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleMouseDown = (e: MouseEvent) => {
  emit('mousedown', e)
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.ai-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: #fff;
  flex-shrink: 0;
}

.ai-dialog-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-dialog-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
}

.ai-dialog-title {
  font-size: 16px;
  font-weight: 600;
}

.ai-dialog-actions {
  display: flex;
  gap: 8px;
  margin-left: 12px;
}

.ai-dialog-close {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background 0.2s;
  line-height: 1;
  padding: 0;
  font-family: Arial, sans-serif;
}

.ai-dialog-close:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
