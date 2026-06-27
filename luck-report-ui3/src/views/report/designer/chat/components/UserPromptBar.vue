<template>
  <div class="user-prompt-bar">
    <transition name="user-prompt-slide">
      <div v-if="prompt" class="user-prompt-hint">
        <div class="user-prompt-hint-icon">💬</div>
        <div class="user-prompt-hint-body">
          <div class="user-prompt-hint-label">Agent 在询问：</div>
          <div class="user-prompt-hint-question">{{ prompt.question }}</div>
        </div>
        <a-button
          v-if="prompt.options && prompt.options.length"
          type="link"
          size="small"
          class="user-prompt-hint-toggle"
          @click="showOptions = !showOptions"
        >{{ showOptions ? '收起选项' : '查看选项' }}</a-button>
        <a-button
          type="text"
          size="small"
          class="user-prompt-hint-dismiss"
          title="忽略此问题"
          @click="handleDismiss"
        >×</a-button>
      </div>
    </transition>
    <div v-if="prompt && prompt.options && prompt.options.length && showOptions" class="user-prompt-options-bar">
      <a-tag
        v-for="opt in prompt.options"
        :key="opt"
        class="user-prompt-option-pill"
        @click="handleSelectOption(opt)"
      >{{ opt }}</a-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button as AButton, Tag as ATag } from 'ant-design-vue'

interface AwaitingUserPrompt {
  taskId: string
  question: string
  options?: string[]
}

interface Props {
  prompt: AwaitingUserPrompt | null
}

interface Emits {
  (e: 'dismiss'): void
  (e: 'select-option', option: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showOptions = ref(false)

watch(
  () => props.prompt,
  (val) => {
    if (!val) {
      showOptions.value = false
    }
  }
)

const handleDismiss = () => {
  showOptions.value = false
  emit('dismiss')
}

const handleSelectOption = (option: string) => {
  emit('select-option', option)
}
</script>

<style scoped>
.user-prompt-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin: 8px 12px 0;
  background: linear-gradient(135deg, #fff7e6 0%, #fff1d6 100%);
  border: 1px solid #ffd591;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(255, 159, 67, 0.08);
}
.user-prompt-hint-icon {
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
}
.user-prompt-hint-body {
  flex: 1;
  min-width: 0;
}
.user-prompt-hint-label {
  font-size: 12px;
  color: #d48806;
  font-weight: 500;
  margin-bottom: 2px;
}
.user-prompt-hint-question {
  font-size: 13px;
  line-height: 1.5;
  color: #5c2e00;
  word-break: break-word;
}
.user-prompt-hint-toggle,
.user-prompt-hint-dismiss {
  flex-shrink: 0;
  padding: 0 6px;
  height: 24px;
  font-size: 12px;
}
.user-prompt-hint-dismiss {
  color: #999;
  font-size: 18px;
  line-height: 1;
}
.user-prompt-hint-dismiss:hover {
  color: #666;
}

.user-prompt-options-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 14px 0;
  margin: 0 12px;
}
.user-prompt-option-pill {
  cursor: pointer;
  padding: 2px 10px;
  border-radius: 12px;
  background: #fafafa;
  border-color: #d9d9d9;
  font-size: 12px;
  transition: all 0.15s;
}
.user-prompt-option-pill:hover {
  color: #fa8c16;
  border-color: #ffd591;
  background: #fff7e6;
}

.user-prompt-slide-enter-active,
.user-prompt-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.user-prompt-slide-enter-from,
.user-prompt-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
