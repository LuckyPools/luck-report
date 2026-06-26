<template>
  <div class="deep-think-button" :class="{ active: localDeepThink }" @click="handleToggle">
    <i class="iconfont icon-think think-icon" />
    <span class="think-text">深度思考</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

/**
 * DeepThinkButton 组件
 * 深度思考开关按钮，胶囊样式
 * - 选中状态使用主题色高亮（图标、文本、边框）
 * - 未选中为默认浅灰样式
 * 状态由父组件管理（v-model:deepThink / @toggle）
 */

interface Props {
  /** 当前是否启用深度思考 */
  deepThink?: boolean
}

interface Emits {
  (e: 'toggle', enabled: boolean): void
  (e: 'update:deepThink', enabled: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  deepThink: false
})

const emit = defineEmits<Emits>()

/** 本地状态，避免父组件未传值时按钮无法响应 */
const localDeepThink = ref(props.deepThink)

/**
 * 切换深度思考状态
 * 同步通知父组件更新
 */
const handleToggle = () => {
  localDeepThink.value = !localDeepThink.value
  emit('update:deepThink', localDeepThink.value)
  emit('toggle', localDeepThink.value)
}
</script>

<style scoped>
.deep-think-button {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 4px 12px 4px 10px;
  height: 28px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  background-color: #fff;
}

.deep-think-button:hover {
  background-color: #f3f4f6;
}

.deep-think-button.active {
  background-color: rgba(var(--color-primary-rgb), 0.08);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.think-icon {
  font-size: 14px;
  color: #6b7280;
  transition: color 0.2s;
}

.deep-think-button:hover .think-icon {
  color: #374151;
}

.deep-think-button.active .think-icon {
  color: var(--color-primary);
}

.think-text {
  font-size: 12px;
  margin-left: 4px;
  color: #374151;
  transition: color 0.2s;
}

.deep-think-button.active .think-text {
  color: var(--color-primary);
}
</style>
