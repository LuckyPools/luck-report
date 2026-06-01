<template>
  <div class="chat-list-container">
    <div v-if="store.sessionListLoading" class="chat-list-loading">
      <a-spin />
    </div>

    <div v-else-if="store.sessionList.length === 0" class="chat-list-empty">
      <span class="empty-text">暂无对话记录</span>
    </div>

    <div v-else class="chat-list-body">
      <div
        v-for="chat in store.sessionList"
        :key="chat.id"
        :class="['chat-item', { 'chat-item-active': chat.id === currentSessionId }]"
        @click="handleSelect(chat)"
      >
        <div class="chat-item-content">
          <PushpinOutlined v-if="chat.isPinned === 1" class="pin-icon" />
          <span class="chat-item-title">{{ chat.title || '新对话' }}</span>
        </div>
        <a-dropdown :trigger="['click']" @click.stop>
          <div class="chat-item-more" @click.stop>
            <EllipsisOutlined />
          </div>
          <template #overlay>
            <a-menu @click="handleMenuClick($event, chat)">
              <a-menu-item key="rename">
                <EditOutlined />
                <span class="menu-text">重命名</span>
              </a-menu-item>
              <a-menu-item v-if="chat.isPinned === 1" key="unpin">
                <PushpinOutlined />
                <span class="menu-text">取消置顶</span>
              </a-menu-item>
              <a-menu-item v-else key="pin">
                <PushpinOutlined />
                <span class="menu-text">置顶</span>
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item key="delete">
                <DeleteOutlined />
                <span class="menu-text delete-text">删除</span>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>

    <a-modal
      v-model:open="renameModalVisible"
      title="重命名对话"
      ok-text="保存"
      cancel-text="取消"
      @ok="handleRenameConfirm"
    >
      <a-input
        v-model:value="renameTitle"
        placeholder="请输入对话名称"
        style="margin-top: 16px; margin-bottom: 16px"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Spin as ASpin,
  Dropdown as ADropdown,
  Menu as AMenu,
  MenuItem as AMenuItem,
  MenuDivider as AMenuDivider,
  Modal as AModal,
  Input as AInput,
  Modal,
  message
} from 'ant-design-vue'
import {
  EditOutlined,
  DeleteOutlined,
  PushpinOutlined,
  EllipsisOutlined
} from '@ant-design/icons-vue'
import { useChatStore } from '@/stores/chat'
import type { SessionInfo } from '@/api/chat/session.ts'

/**
 * 会话列表组件
 * 从 chatStore 读取会话列表数据，确保与主面板数据同步
 * 提供历史对话的切换、重命名、置顶、删除功能
 * 以弹窗形式嵌入聊天面板，点击对话项加载该会话的所有消息
 */

interface Props {
  /** 当前活跃的会话ID */
  currentSessionId: string | null
}

interface Emits {
  (e: 'select', sessionId: string): void
  (e: 'deleted', sessionId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const store = useChatStore()

/** 重命名弹窗可见性 */
const renameModalVisible = ref(false)

/** 重命名输入值 */
const renameTitle = ref('')

/** 正在重命名的会话ID */
const renameSessionId = ref('')

/**
 * 选择会话
 * 点击会话项时触发，通知父组件加载该会话的消息
 *
 * @param chat - 选中的会话
 */
const handleSelect = (chat: SessionInfo) => {
  if (chat.id === props.currentSessionId) return
  emit('select', chat.id)
}

/**
 * 菜单点击事件处理
 * 根据菜单项 key 执行对应操作：重命名、置顶/取消置顶、删除
 *
 * @param event - 菜单点击事件
 * @param chat - 目标会话
 */
const handleMenuClick = (event: { key: string }, chat: SessionInfo) => {
  const action = event.key
  if (action === 'rename') {
    renameSessionId.value = chat.id
    renameTitle.value = chat.title || ''
    renameModalVisible.value = true
  } else if (action === 'pin') {
    handlePin(chat.id, 1)
  } else if (action === 'unpin') {
    handlePin(chat.id, 0)
  } else if (action === 'delete') {
    handleDelete(chat.id)
  }
}

/**
 * 置顶或取消置顶会话
 * 通过 store 统一操作，自动刷新列表
 *
 * @param sessionId - 会话ID
 * @param isPinned - 0-取消置顶，1-置顶
 */
const handlePin = async (sessionId: string, isPinned: number) => {
  try {
    await store.pinSession(sessionId, isPinned)
    message.success(isPinned === 1 ? '已置顶' : '已取消置顶')
  } catch (e) {
    console.error('[ChatList] 置顶操作失败:', e)
    message.error('操作失败')
  }
}

/**
 * 删除会话
 * 弹出确认弹窗后通过 store 执行软删除，自动刷新列表
 *
 * @param sessionId - 会话ID
 */
const handleDelete = (sessionId: string) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除该对话吗？删除后不可恢复。',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        await store.deleteSession(sessionId)
        message.success('删除成功')
        emit('deleted', sessionId)
      } catch (e) {
        console.error('[ChatList] 删除会话失败:', e)
        message.error('删除失败')
      }
    }
  })
}

/**
 * 确认重命名
 * 通过 store 保存新标题，自动更新列表
 */
const handleRenameConfirm = async () => {
  if (!renameTitle.value.trim()) {
    message.warning('标题不能为空')
    return
  }
  try {
    await store.renameSession(renameSessionId.value, renameTitle.value.trim())
    message.success('重命名成功')
    renameModalVisible.value = false
  } catch (e) {
    console.error('[ChatList] 重命名失败:', e)
    message.error('重命名失败')
  }
}

onMounted(() => {
  store.fetchSessionList()
})

/**
 * 暴露刷新方法，供父组件在创建新会话后调用
 */
defineExpose({
  refresh: () => store.fetchSessionList()
})
</script>

<style scoped>
.chat-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-list-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.chat-list-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.empty-text {
  font-size: 13px;
  color: #9ca3af;
}

.chat-list-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 0;
}

.chat-list-body::-webkit-scrollbar {
  width: 4px;
}

.chat-list-body::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 2px;
}

.chat-list-body::-webkit-scrollbar-track {
  background: transparent;
}

.chat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin: 2px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #6b7280;
  transition: background-color 0.15s;
}

.chat-item:hover {
  background-color: #f3f4f6;
}

.chat-item-active {
  background-color: #eff6ff;
  color: #1d4ed8;
  font-weight: 500;
}

.chat-item-active:hover {
  background-color: #dbeafe;
}

.chat-item-content {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 6px;
}

.pin-icon {
  font-size: 12px;
  color: #f59e0b;
  flex-shrink: 0;
}

.chat-item-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-item-more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.chat-item:hover .chat-item-more {
  opacity: 1;
}

.chat-item-more:hover {
  background-color: #e5e7eb;
}

.menu-text {
  margin-left: 8px;
}

.delete-text {
  color: #ef4444;
}
</style>
