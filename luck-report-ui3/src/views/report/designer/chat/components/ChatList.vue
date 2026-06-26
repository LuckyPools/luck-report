<template>
  <div class="chat-list-container">
    <!-- 开启新对话按钮 -->
    <div class="new-chat-wrapper">
      <a-button type="default" block class="new-chat-button" @click="handleNewChat">
        <template #icon>
          <i class="iconfont icon-add-chat1"></i>
        </template>
        开启新对话
      </a-button>
    </div>

    <!-- 会话列表 -->
    <div class="chat-list-body" ref="scrollContainer" @scroll="throttledHandleScroll">
      <div v-if="store.sessionListLoading && store.sessionList.length === 0" class="chat-list-loading">
        <a-spin />
      </div>

      <template v-else>
        <!-- 已置顶 -->
        <div v-if="pinnedChats.length > 0" class="chat-section">
          <div class="chat-section-header">
            <PushpinOutlined class="chat-section-icon" />
            <span class="chat-section-title">已置顶</span>
          </div>
          <div
            v-for="chat in pinnedChats"
            :key="chat.id"
            :class="['chat-item', { 'chat-item-active': chat.id === currentSessionId }]"
            @click="handleSelect(chat)"
          >
            <div class="chat-item-content">
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
                  <a-menu-item key="unpin">
                    <PushpinOutlined />
                    <span class="menu-text">取消置顶</span>
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

        <!-- 最近对话 -->
        <div class="chat-section">
          <div class="chat-section-header">
            <MessageOutlined class="chat-section-icon" />
            <span class="chat-section-title">最近对话</span>
          </div>

          <div v-if="recentChats.length === 0" class="chat-section-empty">
            <span>暂无对话记录</span>
          </div>

          <template v-else>
            <div
              v-for="chat in recentChats"
              :key="chat.id"
              :class="['chat-item', { 'chat-item-active': chat.id === currentSessionId }]"
              @click="handleSelect(chat)"
            >
              <div class="chat-item-content">
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
                    <a-menu-item key="pin">
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
          </template>
        </div>

        <!-- 底部加载状态 -->
        <div v-if="store.sessionListLoading && store.sessionList.length > 0" class="load-more-loading">
          <a-spin size="small" />
          <span class="load-more-text">加载中...</span>
        </div>
        <div v-else-if="!store.sessionListHasMore && (recentChats.length + pinnedChats.length) > 0" class="load-more-end">
          <span>没有更多了</span>
        </div>
      </template>
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
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  Spin as ASpin,
  Dropdown as ADropdown,
  Menu as AMenu,
  MenuItem as AMenuItem,
  MenuDivider as AMenuDivider,
  Modal as AModal,
  Input as AInput,
  Button as AButton,
  Modal,
  message
} from 'ant-design-vue'
import {
  EditOutlined,
  DeleteOutlined,
  PushpinOutlined,
  EllipsisOutlined,
  MessageOutlined
} from '@ant-design/icons-vue'
import { useChatStore } from '@/store/modules/chat'
import type { SessionInfo } from '@/api/chat/session'

/**
 * 会话列表组件
 * 从 chatStore 读取会话列表数据，确保与主面板数据同步
 * 提供历史对话的切换、重命名、置顶、删除功能
 * 嵌入对话框左侧，参照 HiveChat ChatList.tsx 样式
 * 支持分页滚动加载，每次加载10条数据
 */

interface Props {
  /** 当前活跃的会话ID */
  currentSessionId: string | null
}

interface Emits {
  (e: 'select', sessionId: string): void
  (e: 'deleted', sessionId: string): void
  (e: 'new-chat'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const store = useChatStore()

/** 滚动容器引用 */
const scrollContainer = ref<HTMLElement | null>(null)

/** 重命名弹窗可见性 */
const renameModalVisible = ref(false)

/** 重命名输入值 */
const renameTitle = ref('')

/** 正在重命名的会话ID */
const renameSessionId = ref('')

/** 已置顶的会话 */
const pinnedChats = computed(() => store.sessionList.filter(c => c.isPinned === 1))

/** 最近对话（未置顶） */
const recentChats = computed(() => store.sessionList.filter(c => c.isPinned !== 1))

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
 * 开启新对话
 */
const handleNewChat = () => {
  emit('new-chat')
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

/**
 * 滚动事件处理（节流）
 * 仅当列表实际可滚动（scrollHeight > clientHeight）且用户已滚动到底部附近时，
 * 才触发加载更多。
 *
 * @param event - 滚动事件
 */
const handleScroll = () => {
  const el = scrollContainer.value
  if (!el) return

  // 内容不足一屏时直接返回：这种情况由 mount 阶段的 autoFillScrollable 处理
  if (el.scrollHeight <= el.clientHeight) return

  // 距底部 50px 内才触发
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
    store.loadMoreSessionList()
  }
}

/** 节流：100ms 内只处理一次滚动事件，避免重复触发加载 */
let scrollTimer: ReturnType<typeof setTimeout> | null = null
const throttledHandleScroll = () => {
  if (scrollTimer) return
  scrollTimer = setTimeout(() => {
    handleScroll()
    scrollTimer = null
  }, 100)
}

/** 自动补齐的最大页数（防止极端情况下连续加载过多） */
const AUTO_FILL_MAX_PAGES = 10

/**
 * 自动加载后续分页，直到列表内容溢出可滚动，或没有更多数据，或达到页数上限
 * 解决"10 条不够一屏 → 没有滚动条 → 滚动事件永远不触发"的问题
 */
const autoFillScrollable = async () => {
  const el = scrollContainer.value
  if (!el) return

  for (let i = 0; i < AUTO_FILL_MAX_PAGES; i++) {
    if (!store.sessionListHasMore || store.sessionListLoading) return
    // 内容已经溢出可滚动，停止补齐
    if (el.scrollHeight > el.clientHeight) return

    await store.loadMoreSessionList()
    // 等待 DOM 更新
    await nextTick()
  }
}

onMounted(async () => {
  await store.fetchSessionList()
  await nextTick()
  // 初次加载后，若列表仍不足一屏，自动补齐（仅本次启动执行一次）
  autoFillScrollable()
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
  flex: 1;
  min-height: 0;
  background-color: #fff;
}

/* 开启新对话按钮 */
.new-chat-wrapper {
  padding: 8px 12px 4px;
  flex-shrink: 0;
}

.new-chat-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--color-primary);
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.new-chat-button:hover {
  color: var(--color-primary-hover);
  background: #f9fafb;
  border-color: var(--color-primary);
}

.new-chat-button :deep(.anticon) {
  color: var(--color-primary);
}

.new-chat-button:hover :deep(.anticon) {
  color: var(--color-primary-hover);
}

/* 列表区 */
.chat-list-body {
  flex: 1 1 0;
  height: 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 0 8px;
}

.chat-list-body::-webkit-scrollbar {
  width: 6px;
}

.chat-list-body::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 3px;
}

.chat-list-body::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}

.chat-list-body::-webkit-scrollbar-track {
  background: transparent;
}

.chat-list-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

/* 底部加载状态 / 加载更多 / 没有更多 */
.load-more-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 0;
  color: #9ca3af;
  font-size: 12px;
}

.load-more-text {
  font-size: 12px;
}

.load-more-end {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  color: #d1d5db;
  font-size: 12px;
}

/* 分组区块 */
.chat-section {
  padding: 4px 0;
}

.chat-section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px 4px;
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

.chat-section-icon {
  font-size: 12px;
}

.chat-section-title {
  font-size: 12px;
}

.chat-section-empty {
  padding: 8px 20px;
  font-size: 12px;
  color: #d1d5db;
}

/* 单项 */
.chat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin: 2px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #4b5563;
  transition: background-color 0.15s;
}

.chat-item:hover {
  background-color: #f3f4f6;
}

.chat-item-active {
  background-color: #f3f4f6;
  color: var(--color-primary);
  font-weight: 500;
}

.chat-item-active:hover {
  background-color: #e5e7eb;
}

.chat-item-content {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 6px;
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
  width: 22px;
  height: 22px;
  border-radius: 4px;
  opacity: 0;
  color: #9ca3af;
  transition: opacity 0.15s;
  flex-shrink: 0;
  font-size: 14px;
}

.chat-item:hover .chat-item-more,
.chat-item-active .chat-item-more {
  opacity: 1;
}

.chat-item-more:hover {
  background-color: #e5e7eb;
  color: #4b5563;
}

.menu-text {
  margin-left: 8px;
}

.delete-text {
  color: #ef4444;
}

/* 加载状态 */
.load-more-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 0;
  font-size: 12px;
  color: #9ca3af;
}

.load-more-text {
  font-size: 12px;
  color: #9ca3af;
}

.load-more-end {
  text-align: center;
  padding: 12px 0;
  font-size: 12px;
  color: #d1d5db;
}
</style>
