import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 可拖动面板与悬浮按钮的 Composable
 * panelPosition 始终表示弹窗的左上角位置，悬浮按钮的位置由
 * panelPosition + (panelWidth - buttonWidth, (panelHeight - buttonHeight) / 2) 推导得出。
 * 这样关闭弹窗后，悬浮按钮会出现在弹窗关闭时的位置。
 *
 * @param panelWidth - 弹窗宽度，默认 380px
 * @param panelHeight - 弹窗高度，默认 560px
 * @param buttonWidth - 悬浮按钮宽度，默认 50px
 * @param buttonHeight - 悬浮按钮高度，默认 50px
 * @returns 拖动相关的状态和方法
 */
export function useDrag(panelWidth = 380, panelHeight = 560, buttonWidth = 50, buttonHeight = 50) {
  const isDragging = ref(false)
  /** 鼠标在按下与松开之间是否产生了超过阈值的位移，用于区分点击和拖动 */
  const dragMoved = ref(false)
  /** 当前拖动源：dialog 拖动弹窗，button 拖动悬浮按钮 */
  const dragSource = ref<'dialog' | 'button'>('dialog')
  const panelPosition = ref({
    x: window.innerWidth - panelWidth - 50,
    y: (window.innerHeight - panelHeight) / 2
  })
  const dragStart = ref({ x: 0, y: 0 })

  /**
   * 重置弹窗位置到默认位置（屏幕右侧居中）
   */
  const resetPosition = () => {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    panelPosition.value = {
      x: windowWidth - panelWidth - 50,
      y: (windowHeight - panelHeight) / 2
    }
  }

  /**
   * 处理鼠标按下事件
   * @param e - 鼠标事件对象
   * @param source - 拖动来源：dialog 拖动弹窗，button 拖动悬浮按钮
   */
  const handleMouseDown = (e: MouseEvent, source: 'dialog' | 'button' = 'dialog') => {
    isDragging.value = true
    dragMoved.value = false
    dragSource.value = source
    dragStart.value = {
      x: e.clientX - panelPosition.value.x,
      y: e.clientY - panelPosition.value.y
    }
    e.preventDefault()
  }

  /**
   * 处理鼠标移动事件
   * 更新弹窗位置，并根据拖动源做边界检测
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return

    const newX = e.clientX - dragStart.value.x
    const newY = e.clientY - dragStart.value.y

    // 位移超过 3px 视为真实拖动，避免点击误判
    if (
      Math.abs(newX - panelPosition.value.x) > 3 ||
      Math.abs(newY - panelPosition.value.y) > 3
    ) {
      dragMoved.value = true
    }

    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    if (dragSource.value === 'button') {
      // 拖动悬浮按钮时，约束按钮本体始终在视口内
      // 按钮位置 = panelPosition + (panelWidth - buttonWidth, 0)
      // 纵向偏移为 0，按钮顶部与弹窗顶部对齐；
      // Y 轴按按钮高度约束而非弹窗高度，避免按钮无法拖到屏幕底部
      const offsetX = panelWidth - buttonWidth
      const offsetY = 0
      panelPosition.value = {
        x: Math.max(-offsetX, Math.min(newX, windowWidth - panelWidth)),
        y: Math.max(-offsetY, Math.min(newY, windowHeight - buttonHeight))
      }
    } else {
      // 拖动弹窗时，约束弹窗整体始终在视口内
      panelPosition.value = {
        x: Math.max(0, Math.min(newX, windowWidth - panelWidth)),
        y: Math.max(0, Math.min(newY, windowHeight - panelHeight))
      }
    }
  }

  /**
   * 处理鼠标松开事件
   */
  const handleMouseUp = () => {
    isDragging.value = false
  }

  /**
   * 处理窗口大小改变事件
   * 防止缩放后弹窗/按钮跑到屏幕外
   */
  const handleResize = () => {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    panelPosition.value = {
      x: Math.min(panelPosition.value.x, windowWidth - panelWidth),
      y: Math.min(panelPosition.value.y, windowHeight - panelHeight)
    }
  }

  onMounted(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    window.removeEventListener('resize', handleResize)
  })

  return {
    isDragging,
    dragMoved,
    panelPosition,
    resetPosition,
    handleMouseDown
  }
}
