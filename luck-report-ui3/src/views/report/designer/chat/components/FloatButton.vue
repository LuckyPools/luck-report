<template>
  <div
    v-if="!visible"
    class="float-button"
    :class="{ 'is-dragging': isDragging }"
    :style="{ transform: `translate(${positionX}px, ${positionY}px)` }"
    @mousedown="handleMouseDown"
    @click="handleClick"
  >
    <img class="float-button__icon" :src="agentHeader" alt="AI助手" />
  </div>
</template>

<script setup lang="ts">
import agentHeader from '@/assets/images/ai/agent-header.png'

interface Props {
  visible: boolean
  isDragging: boolean
  positionX: number
  positionY: number
}

interface Emits {
  (e: 'mousedown', event: MouseEvent): void
  (e: 'click'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleMouseDown = (e: MouseEvent) => {
  emit('mousedown', e)
}

const handleClick = () => {
  emit('click')
}
</script>

<style scoped>
.float-button {
  position: fixed;
  top: 0;
  left: 0;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: background-color 0.3s;
  user-select: none;
  touch-action: none;
  pointer-events: auto;
}

.float-button.is-dragging {
  cursor: grabbing;
}

.float-button:hover {

}

.float-button :deep(.anticon) {
  font-size: 24px;
  color: #fff;
}

.float-button__icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
</style>
