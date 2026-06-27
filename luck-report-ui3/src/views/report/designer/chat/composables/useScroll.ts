import { ref, watch, onUnmounted, type Ref } from 'vue'
import type { ResponseStatus } from '../types/chat'

/**
 * 聊天滚动逻辑 Composable
 * 负责滚动到底部按钮显隐、用户手动滚动检测、自动滚动等
 *
 * @param chatBodyRef - 聊天区域 DOM 引用
 * @param messageList - 消息列表
 * @param responseMessage - 当前响应消息（流式输出中）
 * @param responseStatus - 响应状态
 * @param setIsUserScrolling - 设置用户手动滚动状态的函数
 * @returns 滚动相关的状态和方法
 */
export function useScroll(
  chatBodyRef: Ref<HTMLElement | null>,
  messageList: Ref<{ id: number | string }[]>,
  responseMessage: Ref<string>,
  responseStatus: Ref<ResponseStatus>,
  setIsUserScrolling: (value: boolean) => void,
  isUserScrolling: Ref<boolean>
) {
  /** 是否显示滚动到底部按钮 */
  const showScrollButton = ref(false)

  /** 滚动节流定时器 */
  let scrollThrottleTimer: ReturnType<typeof setTimeout> | null = null
  /** 自动滚动防抖定时器 */
  let autoScrollTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * 滚动到底部
   * 平滑滚动聊天区域到最底部
   */
  const scrollToBottom = () => {
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTo({
        top: chatBodyRef.value.scrollHeight,
        behavior: 'smooth'
      })
      setIsUserScrolling(false)
      showScrollButton.value = false
    }
  }

  /**
   * 处理滚动事件（原始逻辑）
   * 判断用户是否手动上滚，综合判断滚动到底部按钮的显示
   */
  const handleScrollRaw = () => {
    const el = chatBodyRef.value
    if (!el) return

    const isNearBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 20
    const shouldShowButton = !isNearBottom
      && el.scrollHeight > el.clientHeight + 50
      && responseStatus.value !== 'pending'

    setIsUserScrolling(!isNearBottom)
    showScrollButton.value = shouldShowButton
  }

  /**
   * 节流滚动处理，100ms 间隔
   */
  const throttledHandleScroll = () => {
    if (scrollThrottleTimer) return
    scrollThrottleTimer = setTimeout(() => {
      handleScrollRaw()
      scrollThrottleTimer = null
    }, 100)
  }

  /**
   * 防抖自动滚动到底部
   * 仅在用户未手动上滚时自动滚动
   */
  const debouncedAutoScroll = () => {
    if (autoScrollTimer) clearTimeout(autoScrollTimer)
    autoScrollTimer = setTimeout(() => {
      if (!isUserScrolling.value && chatBodyRef.value) {
        requestAnimationFrame(() => {
          if (chatBodyRef.value) {
            chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
          }
        })
      }
    }, 50)
  }

  /**
   * 消息列表或响应内容变化时，触发自动滚动
   */
  watch(
    () => [messageList.value.length, responseMessage.value],
    () => {
      debouncedAutoScroll()
    }
  )

  /**
   * 清理定时器
   */
  const cleanupScrollTimers = () => {
    if (scrollThrottleTimer) clearTimeout(scrollThrottleTimer)
    if (autoScrollTimer) clearTimeout(autoScrollTimer)
  }

  onUnmounted(() => {
    cleanupScrollTimers()
  })

  return {
    showScrollButton,
    scrollToBottom,
    throttledHandleScroll,
    debouncedAutoScroll,
    cleanupScrollTimers
  }
}
