<template>
  <div
    v-if="!visible"
    class="float-button"
    :class="{ 'is-dragging': isDragging }"
    :style="{ transform: `translate(${positionX}px, ${positionY}px)` }"
    @mousedown="handleMouseDown"
    @click="handleClick"
  >
    <CustomerServiceOutlined />
  </div>
</template>

<script setup lang="ts">
import { CustomerServiceOutlined } from '@ant-design/icons-vue'

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
  background-color: var(--color-primary);
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
  background-color: var(--color-primary-hover);
}

.float-button :deep(.anticon) {
  font-size: 24px;
  color: #fff;
}
</style>
