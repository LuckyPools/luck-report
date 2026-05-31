import { ref } from 'vue'
import type { MessageSendShortcut } from '../types/chat'

const STORAGE_KEY = 'userSettings_messageSendShortcut'

/**
 * 用户设置管理 Hook
 * 对应 HiveChat useUserSettingsStore，管理快捷键等用户偏好设置
 * 使用 localStorage 持久化
 */
export function useUserSettings() {
  /** 消息发送快捷键模式 */
  const messageSendShortcut = ref<MessageSendShortcut>(
    (localStorage.getItem(STORAGE_KEY) as MessageSendShortcut) || 'enter'
  )

  /**
   * 设置消息发送快捷键模式
   * @param shortcut - 快捷键模式
   */
  const setMessageSendShortcut = (shortcut: MessageSendShortcut) => {
    messageSendShortcut.value = shortcut
    localStorage.setItem(STORAGE_KEY, shortcut)
  }

  /**
   * 获取快捷键提示文本
   * 根据 messageSendShortcut 和操作系统动态生成
   *
   * @returns 快捷键提示文本
   */
  const getShortcutHint = (): string => {
    if (messageSendShortcut.value === 'enter') {
      return '按 Enter 发送'
    }
    const isMac = navigator.userAgent.includes('Mac')
    return isMac ? '按 ⌘ + Enter 发送' : '按 Ctrl + Enter 发送'
  }

  /**
   * 判断键盘事件是否应该触发发送
   * 根据 messageSendShortcut 模式判断
   *
   * @param e - 键盘事件
   * @returns 是否应该发送消息
   */
  const shouldSendMessage = (e: KeyboardEvent): boolean => {
    if (messageSendShortcut.value === 'enter') {
      return !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
    }
    return (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey
  }

  return {
    messageSendShortcut,
    setMessageSendShortcut,
    getShortcutHint,
    shouldSendMessage
  }
}
