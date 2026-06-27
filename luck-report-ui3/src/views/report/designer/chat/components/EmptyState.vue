<template>
  <div class="empty-state">
    <template v-if="showGuideAlert">
      <a-alert
        message="请先配置 API Key 或添加模型"
        type="warning"
        show-icon
        class="guide-alert"
      />
    </template>
    <template v-else>
      <div class="welcome-card">
        <img class="welcome-icon" :src="chatHeaderImg" alt="智能助手" />
        <div class="welcome-text">
          <div class="welcome-title">你好，我是智能助手</div>
          <div class="welcome-desc">我可以帮助你解决使用中遇到的问题~</div>
        </div>
      </div>
      <div class="quick-questions">
        <div class="quick-questions-title">
          <span class="quick-questions-icon">🤖</span>
          <span>你可以这样问我：</span>
        </div>
        <div class="quick-question-list">
          <div
            v-for="(item, index) in quickQuestions"
            :key="index"
            class="quick-question-item"
            @click="handleQuickQuestionClick(item)"
          >
            <span class="quick-question-icon">{{ item.icon }}</span>
            <span class="quick-question-text">{{ item.text }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Alert as AAlert } from 'ant-design-vue'
import chatHeaderImg from '@/assets/images/ai/agent-header.png'

interface QuickQuestion {
  icon: string
  text: string
}

interface Props {
  showGuideAlert: boolean
  quickQuestions: QuickQuestion[]
}

interface Emits {
  (e: 'send-question', item: QuickQuestion): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleQuickQuestionClick = (item: QuickQuestion) => {
  emit('send-question', item)
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: 100%;
  gap: 24px;
  padding: 24px 24px 16px;
  box-sizing: border-box;
}

.welcome-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(170deg, rgba(0, 147, 255, 0.08) 0%, rgba(85, 0, 255, 0.08) 100%);
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  box-sizing: border-box;
}

.welcome-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  flex-shrink: 0;
}

.welcome-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.welcome-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

.welcome-desc {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
}

.quick-questions {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-questions-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  padding-left: 4px;
}

.quick-questions-icon {
  font-size: 16px;
}

.quick-question-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-question-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.quick-question-item:hover {
  border-color: var(--color-primary);
}

.quick-question-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.quick-question-text {
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.guide-alert {
  width: 100%;
  max-width: 300px;
}
</style>
