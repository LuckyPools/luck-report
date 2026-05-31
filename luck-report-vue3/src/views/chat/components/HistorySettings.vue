<template>
  <div class="history-settings">
    <a-segmented v-model:value="localType" :options="segmentOptions" />
    <div class="history-notice">
      <template v-if="localType === 'all'">
        <p class="notice-text">发送所有历史消息给模型</p>
      </template>
      <template v-if="localType === 'none'">
        <p class="notice-text">不发送历史消息，每次对话独立</p>
      </template>
      <template v-if="localType === 'count'">
        <p class="notice-text">仅发送最近 N 条消息给模型</p>
        <a-input-number
          v-model:value="localCount"
          :min="1"
          :max="30"
          style="margin-top: 4px; width: 100%;"
        />
      </template>
    </div>
    <div class="history-actions">
      <a-button size="small" @click="emit('cancel')">取消</a-button>
      <a-button type="primary" size="small" @click="handleSave">保存</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Segmented as ASegmented, InputNumber as AInputNumber, Button as AButton } from 'ant-design-vue'
import type { HistoryType } from '../types/chat'

/**
 * HistorySettings 组件
 * 对应 HiveChat HistorySettings，历史记录类型设置弹窗
 * 支持三种模式：all（全部）、none（无）、count（指定条数）
 */

interface Props {
  historyType: HistoryType
  historyCount: number
}

interface Emits {
  (e: 'save', type: HistoryType, count: number): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localType = ref<HistoryType>(props.historyType)
const localCount = ref(props.historyCount)

const segmentOptions = [
  { label: '全部', value: 'all' },
  { label: '无', value: 'none' },
  { label: '指定条数', value: 'count' }
]

/**
 * 保存历史记录设置
 */
const handleSave = () => {
  emit('save', localType.value, localCount.value)
}
</script>

<style scoped>
.history-settings {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}

.history-notice {
  margin-top: 8px;
  padding: 0 4px;
}

.notice-text {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 4px;
}

.history-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  gap: 8px;
}
</style>
