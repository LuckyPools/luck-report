<template>
  <div class="input-area">
    <div class="input-container" :class="{ pending: responseStatus === 'pending' }">
      <ImagePreviewArea
        :uploaded-images="uploadedImages"
        @remove="removeImage"
      />
      <textarea
        ref="textareaRef"
        v-model="inputValue"
        :placeholder="placeholderText"
        :disabled="responseStatus === 'pending'"
        @keydown="handleKeyDown"
        @input="autoResize"
        @paste="handlePaste"
        class="input-textarea"
        rows="1"
      />
      <div class="input-toolbar">
        <div class="toolbar-left">
          <SearchButton
            :search-enable="searchEnable"
            :local-search-enable="localSearchEnable"
            @toggle="toggleSearch"
          />
          <a-popover
            v-if="hasUseMcp"
            v-model:open="mcpPopoverOpen"
            trigger="click"
            placement="topLeft"
          >
            <template #content>
              <McpServerSelect
                :mcp-servers="mcpServers"
                @change-select="handleChangeMcpSelect"
              />
            </template>
            <a-tooltip v-if="currentModelSupportTool" title="MCP 服务器" placement="bottom">
              <a-button
                type="text"
                size="small"
                class="toolbar-btn"
                :class="{ 'mcp-selected': hasMcpSelected }"
              >
                <template #icon><ApiOutlined /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip v-else title="当前模型不支持 MCP 工具">
              <a-button type="text" size="small" class="toolbar-btn" disabled>
                <template #icon><ApiOutlined /></template>
              </a-button>
            </a-tooltip>
          </a-popover>
          <a-tooltip v-if="currentModelSupportVision" title="上传图片" placement="bottom">
            <a-button type="text" size="small" class="toolbar-btn" @click="handleImageUpload()">
              <template #icon><PictureOutlined /></template>
            </a-button>
          </a-tooltip>
          <a-tooltip v-else title="当前模型不支持图片理解" placement="bottom">
            <a-button type="text" size="small" class="toolbar-btn" disabled>
              <template #icon><PictureOutlined /></template>
            </a-button>
          </a-tooltip>
          <!-- 历史消息数按钮：暂时隐藏，工具栏按钮过多导致发送按钮显示不全，后续可考虑移至更多菜单或设置中
          <a-popover
            v-model:open="historyPopoverOpen"
            trigger="click"
            placement="topLeft"
          >
            <template #content>
              <HistorySettings
                :history-type="historyType"
                :history-count="historyCount"
                @save="handleHistorySave"
                @cancel="historyPopoverOpen = false"
              />
            </template>
            <a-tooltip title="历史消息数" placement="bottom">
              <a-button type="text" size="small" class="toolbar-btn">
                <template #icon><FieldTimeOutlined /></template>
                <span class="toolbar-text">{{ historyLabel }}</span>
              </a-button>
            </a-tooltip>
          </a-popover>
          -->
          <!-- 暂时注释 -->
          <!-- <a-button type="text" size="small" class="toolbar-btn" @click="emit('clearMemory')">
            <template #icon><ClearOutlined /></template>
            <span class="toolbar-text">清除记忆</span>
          </a-button>
          <a-tooltip title="清空对话">
            <a-button type="text" size="small" class="toolbar-btn" @click="emit('clear')">
              <template #icon><DeleteOutlined /></template>
              <span class="toolbar-text">清空对话</span>
            </a-button>
          </a-tooltip> -->
        </div>
        <div class="toolbar-right">
          <span class="shortcut-hint">{{ shortcutHint }}</span>
          <a-button
            v-if="responseStatus === 'pending'"
            type="primary"
            shape="circle"
            size="small"
            @click="emit('stop')"
          >
            <template #icon><StopOutlined /></template>
          </a-button>
          <a-button
            v-else
            type="primary"
            shape="circle"
            size="small"
            :disabled="!inputValue.trim()"
            @click="handleSend"
          >
            <template #icon><ArrowUpOutlined /></template>
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { message as antMessage, Button as AButton, Tooltip as ATooltip, Popover as APopover } from 'ant-design-vue'
import {
  ArrowUpOutlined,
  StopOutlined,
  ClearOutlined,
  DeleteOutlined,
  FieldTimeOutlined,
  PictureOutlined,
  ApiOutlined
} from '@ant-design/icons-vue'
import type { ResponseStatus, Attachment, HistoryType } from '../types/chat'
import { useImageUpload } from '../composables/useImageUpload'
import { useUserSettings } from '../composables/useUserSettings'
import ImagePreviewArea from './ImagePreviewArea.vue'
import SearchButton from './SearchButton.vue'
import McpServerSelect from './McpServerSelect.vue'
import HistorySettings from './HistorySettings.vue'

/**
 * InputArea 组件
 * 输入区域，对照 HiveChat AdaptiveTextarea 补齐所有功能
 * - 图片上传（点击/粘贴）、预览、删除
 * - 联网搜索开关
 * - MCP 服务器选择
 * - 快捷键系统（Enter/Ctrl+Enter 发送）
 * - 模型能力检测（视觉/工具）
 * - 工具栏：历史消息数、清除记忆、清空对话、发送/停止按钮
 */

interface Props {
  responseStatus: ResponseStatus
  messageCount?: number
  placeholder?: string
  /** 全局联网搜索开关（管理员配置） */
  searchEnable?: boolean
  /** 是否有可用的 MCP 服务器 */
  hasUseMcp?: boolean
  /** 是否有已选中的 MCP 服务器 */
  hasMcpSelected?: boolean
  /** MCP 服务器列表 */
  mcpServers?: Array<{ name: string; description?: string; selected?: boolean }>
  /** 当前模型是否支持视觉 */
  currentModelSupportVision?: boolean
  /** 当前模型是否支持工具调用 */
  currentModelSupportTool?: boolean
  /** 历史消息类型 */
  historyType?: HistoryType
  /** 历史消息条数 */
  historyCount?: number
}

interface Emits {
  (e: 'send', message: string, attachments?: Attachment[], searchEnabled?: boolean): void
  (e: 'stop'): void
  (e: 'clear'): void
  (e: 'clearMemory'): void
  (e: 'toggleSearch', enabled: boolean): void
  (e: 'changeMcpSelect', name: string, selected: boolean): void
  (e: 'changeHistorySettings', type: HistoryType, count: number): void
}

const props = withDefaults(defineProps<Props>(), {
  messageCount: 0,
  placeholder: '',
  searchEnable: false,
  hasUseMcp: false,
  hasMcpSelected: false,
  mcpServers: () => [],
  currentModelSupportVision: false,
  currentModelSupportTool: false,
  historyType: 'count',
  historyCount: 5
})

const emit = defineEmits<Emits>()

const inputValue = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const localSearchEnable = ref(false)
const mcpPopoverOpen = ref(false)
const historyPopoverOpen = ref(false)

const { uploadedImages, handleImageUpload, removeImage, getAttachments, clearImages } = useImageUpload()
const { getShortcutHint, shouldSendMessage } = useUserSettings()

/** 快捷键提示文本 */
const shortcutHint = computed(() => getShortcutHint())

/** 动态 placeholder，包含快捷键提示 */
const placeholderText = computed(() => {
  return props.placeholder || `请输入消息，${shortcutHint.value}`
})

/** 历史消息标签，根据类型显示不同文本 */
const historyLabel = computed(() => {
  if (props.historyType === 'all') return '全部'
  if (props.historyType === 'none') return '无'
  return `${props.historyCount} 条`
})

/**
 * 切换联网搜索状态
 * 同步通知父组件更新 webSearchEnabled
 */
const toggleSearch = () => {
  localSearchEnable.value = !localSearchEnable.value
  emit('toggleSearch', localSearchEnable.value)
}

/**
 * 监听全局搜索开关变化
 * 当管理员关闭联网搜索时，重置本地搜索状态
 */
watch(() => props.searchEnable, (newVal) => {
  if (!newVal) {
    localSearchEnable.value = false
    emit('toggleSearch', false)
  }
})

/**
 * 处理 MCP 服务器选中状态变更
 * @param name - 服务器名称
 * @param selected - 是否选中
 */
const handleChangeMcpSelect = (name: string, selected: boolean) => {
  emit('changeMcpSelect', name, selected)
}

/**
 * 处理历史消息设置保存
 * @param type - 历史消息类型
 * @param count - 历史消息条数
 */
const handleHistorySave = (type: HistoryType, count: number) => {
  emit('changeHistorySettings', type, count)
  historyPopoverOpen.value = false
}

/**
 * 处理粘贴事件
 * 检测剪贴板中的图片文件并自动上传
 *
 * @param e - 粘贴事件
 */
const handlePaste = async (e: ClipboardEvent) => {
  if (!e.clipboardData?.files.length) return

  if (!props.currentModelSupportVision) {
    antMessage.warning('当前模型不支持图片理解')
    return
  }

  const files = Array.from(e.clipboardData.files)
  const imageFiles = files.filter(file => file.type.startsWith('image/'))

  if (imageFiles.length > 0) {
    e.preventDefault()
    for (const file of imageFiles) {
      const url = URL.createObjectURL(file)
      handleImageUpload(file, url)
    }
  }
}

/**
 * 处理键盘按下事件
 * 根据 useUserSettings 的快捷键配置决定发送/换行行为
 *
 * @param e - 键盘事件对象
 */
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.isComposing) return

  if (e.key === 'Enter') {
    if (shouldSendMessage(e)) {
      e.preventDefault()
      handleSend()
    } else {
      // 插入换行
      e.preventDefault()
      const target = e.currentTarget as HTMLTextAreaElement
      const start = target.selectionStart
      const end = target.selectionEnd
      const newValue = inputValue.value.substring(0, start) + '\n' + inputValue.value.substring(end)
      inputValue.value = newValue
      nextTick(() => {
        target.selectionStart = target.selectionEnd = start + 1
      })
    }
  }
}

/**
 * 发送消息
 * 校验输入内容后触发 send 事件并清空输入框和图片
 */
const handleSend = async () => {
  if (!inputValue.value.trim() || props.responseStatus === 'pending') return

  const attachments = uploadedImages.value.length > 0
    ? await getAttachments()
    : undefined

  emit('send', inputValue.value.trim(), attachments, localSearchEnable.value || undefined)
  inputValue.value = ''
  clearImages()
  localSearchEnable.value = false

  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = MIN_HEIGHT + 'px'
    }
  })
}

/** textarea 最小行数高度（px），用于初始化和 autoResize 下限 */
const MIN_HEIGHT = 48

/** textarea 最大行数高度（px），用于 autoResize 上限 */
const MAX_HEIGHT = 96

/**
 * 自动调整 textarea 高度
 * 根据内容动态调整高度，支持 minRows 和 maxRows 限制
 * 对应 HiveChat AdaptiveTextarea 的 checkOverflow 逻辑
 * 注意：先设为最小高度再测量，避免 'auto' 导致的瞬间高度跳变
 */
const autoResize = () => {
  const textarea = textareaRef.value
  if (!textarea) return

  // 先设为最小高度再测量 scrollHeight，避免 'auto' 导致的瞬间收缩跳变
  textarea.style.height = MIN_HEIGHT + 'px'
  const newHeight = Math.min(Math.max(textarea.scrollHeight, MIN_HEIGHT), MAX_HEIGHT)
  textarea.style.height = newHeight + 'px'
}

onMounted(() => {
  if (textareaRef.value) {
    // 初始化为最小行数高度，防止首次输入时高度跳变
    textareaRef.value.style.height = MIN_HEIGHT + 'px'
    textareaRef.value.focus()
  }
  window.addEventListener('resize', autoResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', autoResize)
})
</script>

<style scoped>
.input-area {
  padding: 8px 12px 12px;
  background-color: #fff;
  flex-shrink: 0;
}

.input-container {
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
}

.input-container.pending {
  background-color: #f9fafb;
}

.input-textarea {
  width: 100%;
  padding: 12px 16px 4px;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  font-family: inherit;
  color: #1f2937;
  background: transparent;
}

.input-textarea::placeholder {
  color: #9ca3af;
}

.input-textarea:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.input-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 8px;
  min-height: 36px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* 第一个按钮左边距 8px，加上 toolbar 的 padding-left 8px，总共 16px 与输入光标对齐 */
.toolbar-left > :first-child {
  margin-left: 8px;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 0;
}

.toolbar-btn :deep(.anticon) {
  font-size: 14px;
  color: #9ca3af;
}

.toolbar-btn:hover :deep(.anticon) {
  color: #6b7280;
}

.toolbar-btn.mcp-selected :deep(.anticon) {
  color: #1677ff;
}

.toolbar-text {
  font-size: 12px;
  color: #6b7280;
  margin-left: 2px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shortcut-hint {
  font-size: 11px;
  color: #d1d5db;
  white-space: nowrap;
}

.toolbar-right :deep(.ant-btn) {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
