<template>
  <div class="mcp-server-select">
    <div class="mcp-title">MCP 服务器</div>
    <div
      v-for="server in mcpServers"
      :key="server.name"
      class="mcp-item"
    >
      <div class="mcp-info">
        <span class="mcp-name">{{ server.name }}</span>
        <span v-if="server.description" class="mcp-desc">{{ server.description }}</span>
      </div>
      <a-switch
        :checked="server.selected"
        size="small"
        @change="(checked: boolean) => emit('changeSelect', server.name, checked)"
      />
    </div>
    <div v-if="mcpServers.length === 0" class="mcp-empty">
      暂无可用的 MCP 服务器
    </div>
  </div>
</template>

<script setup lang="ts">
import { Switch as ASwitch } from 'ant-design-vue'
import type { McpServer } from '../types/chat'

/**
 * McpServerSelect 组件
 * 对应 HiveChat McpServerSelect，MCP 服务器选择弹窗内容
 * 展示所有可用的 MCP 服务器，支持开关切换
 */

interface Props {
  mcpServers: Array<McpServer & { selected?: boolean }>
}

interface Emits {
  (e: 'changeSelect', name: string, selected: boolean): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped>
.mcp-server-select {
  display: flex;
  flex-direction: column;
  padding: 8px;
  width: 280px;
}

.mcp-title {
  font-weight: 600;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 4px;
}

.mcp-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.mcp-info {
  display: flex;
  flex-direction: column;
}

.mcp-name {
  font-size: 14px;
  color: #374151;
}

.mcp-desc {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.mcp-empty {
  padding: 16px 0;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}
</style>
