<template>
  <div class="export-container">
    <AgentView ref="agentRef" />
  </div>
</template>

<script setup lang="ts">
/**
 * AI 对话框导出页面
 * 用于 iframe 嵌入模式，方便后续组件移除和隐藏管理
 * 通过 /export 路径访问此页面
 */
import { ref, onMounted } from 'vue'
import AgentView from '@/views/agent/index.vue'

const agentRef = ref<InstanceType<typeof AgentView> | null>(null)

onMounted(() => {
  // 自动打开聊天面板
  if (agentRef.value) {
    // 通过 DOM 操作触发点击浮动按钮
    setTimeout(() => {
      const floatButton = document.querySelector('.float-button') as HTMLElement
      if (floatButton) {
        floatButton.click()
      }
    }, 100)
  }
})
</script>

<style scoped>
.export-container {
  width: 100%;
  height: 100vh;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.export-container :deep(.agent-container) {
  padding: 0;
  width: 100%;
  height: 100%;
}

.export-container :deep(.float-button) {
  display: none;
}

.export-container :deep(.chat-panel) {
  position: relative !important;
  width: 100% !important;
  height: 100% !important;
  left: 0 !important;
  top: 0 !important;
  border-radius: 0;
  box-shadow: none;
  z-index: 1;
}
</style>
