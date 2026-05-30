<template>
  <div class="agent-container">
    <h1>Agent 页面</h1>

    <div class="float-button" @click="toggleChat">
      <CustomerServiceOutlined />
    </div>

    <div v-if="chatVisible" class="chat-panel" :style="{ left: panelPosition.x + 'px', top: panelPosition.y + 'px' }">
      <div class="chat-header" @mousedown="handleMouseDown">
        <div class="header-left">
          <div class="avatar">
            <img :src="chatHeaderImg" alt="客服头像" />
          </div>
          <span class="title">在线咨询</span>
        </div>
        <CloseOutlined class="close-btn" @click="toggleChat" />
      </div>
      <div class="chat-body"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CustomerServiceOutlined, CloseOutlined } from '@ant-design/icons-vue'
import '@/assets/css/common/index.css'
import { useDrag } from './drag.ts'
import chatHeaderImg from '@/assets/images/chat-header.png'

const chatVisible = ref(false)
const { panelPosition, resetPosition, handleMouseDown } = useDrag(360, 500)

const toggleChat = () => {
  chatVisible.value = !chatVisible.value
  if (chatVisible.value) {
    resetPosition()
  }
}
</script>

<style scoped>
.agent-container {
  padding: 20px;
}

.float-button {
  position: fixed;
  right: 50px;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  background-color: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px var(--shadow-color);
  z-index: 1000;
  transition: all 0.3s;
}

.float-button:hover {
  background-color: var(--primary-hover-color);
  transform: translateY(-50%) scale(1.1);
}

.float-button :deep(.anticon) {
  font-size: 24px;
  color: #fff;
}

.chat-panel {
  position: fixed;
  width: 360px;
  height: 500px;
  background-color: var(--background-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--shadow-color);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

.chat-header {
  background-color: var(--primary-color);
  color: var(--text-color);
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: move;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.title {
  font-size: 16px;
  font-weight: 500;
}

.close-btn {
  cursor: pointer;
  font-size: 18px;
  transition: opacity 0.3s;
}

.close-btn:hover {
  opacity: 0.7;
}

.chat-body {
  flex: 1;
  background-color: var(--background-color);
  padding: 16px;
  overflow-y: auto;
}
</style>
