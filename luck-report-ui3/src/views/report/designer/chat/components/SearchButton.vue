<template>
  <div v-if="searchEnable" class="search-button" :class="{ active: localSearchEnable }" @click="emit('toggle')">
    <SearchOutlined class="search-icon" />
    <span class="search-text">联网</span>
  </div>
</template>

<script setup lang="ts">
import { SearchOutlined } from '@ant-design/icons-vue'

/**
 * SearchButton 组件
 * 对应 HiveChat SearchButton，联网搜索开关按钮
 * 仅在全局配置 searchEnable 为 true 时显示
 * 选中状态蓝色高亮，未选中灰色
 */

interface Props {
  /** 全局联网搜索开关（管理员配置） */
  searchEnable: boolean
  /** 当前本地联网搜索状态 */
  localSearchEnable: boolean
}

interface Emits {
  (e: 'toggle'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped>
.search-button {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 4px 12px 4px 8px;
  height: 28px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.search-button:hover {
  background-color: #f3f4f6;
}

.search-button.active {
  background-color: #dbeafe;
  border-color: #60a5fa;
  color: #1d4ed8;
}

.search-icon {
  font-size: 14px;
}

.search-text {
  font-size: 12px;
  margin-left: 4px;
}
</style>
