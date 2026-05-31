<template>
  <div class="export-container">
    <div class="action-buttons">
      <button class="action-btn read-btn" @click="handleRead">读取</button>
      <button class="action-btn set-btn" @click="handleSet">设置</button>
    </div>
    <AgentView ref="agentRef" />
  </div>
</template>

<script setup lang="ts">
/**
 * AI 对话框导出页面
 * 用于 iframe 嵌入模式，方便后续组件移除和隐藏管理
 * 通过 /export 路径访问此页面
 * 提供读取和设置按钮，通过 postMessage 与父窗口通信
 */
import { ref, onMounted } from 'vue'
import AgentView from '@/views/chat/index.vue'
import { executeCode } from './iframe-utils'

const agentRef = ref<InstanceType<typeof AgentView> | null>(null)

/**
 * 处理读取按钮点击
 * 使用代码字符串方式触发父窗口执行 readCellByAgent 方法并打印返回值
 */
const handleRead = async () => {
  try {
    const result = await executeCode("readCellByAgent({ rowIndex:0, colIndex:0 })")
    console.log('[Export] readCell 返回值:', result)
  } catch (error) {
    console.error('[Export] readCell 执行失败:', error)
  }
}

/**
 * 处理设置按钮点击
 * 使用代码字符串方式触发父窗口执行 setCellByAgent 方法并打印返回值
 */
const handleSet = async () => {
  try {
    const value = '测试值-' + Date.now()
    const result = await executeCode(`setCellByAgent({ rowIndex:0, colIndex:0, cellValue:'${value}'})`)
    console.log('[Export] setCell 返回值:', result)
  } catch (error) {
    console.error('[Export] setCell 执行失败:', error)
  }
}

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

.action-buttons {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 1000;
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.read-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.read-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.set-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.set-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
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
