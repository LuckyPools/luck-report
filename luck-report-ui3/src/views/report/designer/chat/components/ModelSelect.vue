<template>
  <a-popover
    v-model:open="popoverOpen"
    trigger="click"
    placement="topLeft"
    overlay-class-name="model-select-popover"
  >
    <template #content>
      <div class="model-select-dropdown">
        <div
          v-for="model in modelList"
          :key="model.id"
          class="model-select-item"
          :class="{ active: model.id === currentModel?.id }"
          @click="handleSelect(model.id)"
        >
          <span class="model-item-star">
            <i class="iconfont icon-four-pointed-outline" />
          </span>
          <span class="model-item-name">{{ model.displayName }}</span>
        </div>
        <div v-if="!modelList.length" class="model-select-empty">暂无可用模型</div>
      </div>
    </template>
    <div
      v-if="currentModel"
      class="model-select-trigger"
      :class="{ 'is-loading': isPending }"
      @click.stop
    >
      <span class="model-trigger-icon">
        <i class="iconfont icon-four-pointed-outline" />
      </span>
      <span class="model-trigger-name">{{ currentModel.displayName }}</span>
      <span class="model-trigger-arrow">
        <CaretDownOutlined />
      </span>
    </div>
  </a-popover>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Popover as APopover } from 'ant-design-vue'
import { CaretDownOutlined } from '@ant-design/icons-vue'
import type { LLMModel } from '../types/chat'

/**
 * ModelSelect 组件
 * 对话框内左侧的模型选择器，胶囊样式
 * - 显示当前选中模型
 * - 点击弹出下拉列表，点击切换模型
 * - 左侧带星形图标
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
  (e: 'modelChange', modelId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  isPending: false
})

const emit = defineEmits<Emits>()

const popoverOpen = ref(false)

watch(
  () => props.currentModel,
  () => {
    // 切换模型后自动关闭下拉
    popoverOpen.value = false
  }
)

/**
 * 选中模型
 * @param modelId 模型ID
 */
const handleSelect = (modelId: string) => {
  popoverOpen.value = false
  if (modelId !== props.currentModel?.id) {
    emit('modelChange', modelId)
  }
}
</script>

<style scoped>
.model-select-trigger {
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 6px 0 6px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  max-width: 220px;
  margin-right: 5px;
}

.model-select-trigger:hover {
  background-color: #f3f4f6;
}

.model-select-trigger.is-loading {
  opacity: 0.6;
  cursor: wait;
}

.model-trigger-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: currentColor;
  flex-shrink: 0;
  margin-right: 4px;
}

.model-trigger-name {
  font-size: 12px;
  color: #374151;
  margin-right: 4px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-trigger-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #9ca3af;
  flex-shrink: 0;
}
</style>

<style>
/* 非 scoped 样式：popover 渲染在 body 末尾，无法命中 scoped */
.model-select-popover .ant-popover-inner {
  padding: 4px;
  border-radius: 12px;
}

.model-select-popover .ant-popover-inner-content {
  padding: 4px;
}

.model-select-dropdown {
  min-width: 200px;
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.model-select-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
  font-size: 13px;
  color: #1f2937;
}

.model-select-item:hover {
  background-color: #f3f4f6;
}

.model-select-item.active {
  background-color: rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-primary);
}

.model-item-star {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: currentColor;
  margin-right: 6px;
  flex-shrink: 0;
}

.model-item-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-select-empty {
  padding: 12px;
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
}
</style>
