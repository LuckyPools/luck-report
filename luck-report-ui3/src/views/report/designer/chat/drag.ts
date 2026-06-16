import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 可拖动面板的 Composable
 * 提供面板拖动功能的状态和方法
 * @param panelWidth - 面板宽度，默认 360px
 * @param panelHeight - 面板高度，默认 500px
 * @returns 拖动相关的状态和方法
 */
export function useDrag(panelWidth = 360, panelHeight = 500) {
  const isDragging = ref(false)
  const panelPosition = ref({ x: 0, y: 0 })
  const dragStart = ref({ x: 0, y: 0 })

  /**
   * 重置面板位置到默认位置
   * 默认位置为窗口右侧居中
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
   * 开始拖动并记录起始位置
   * @param e - 鼠标事件对象
   */
  const handleMouseDown = (e: MouseEvent) => {
    isDragging.value = true
    dragStart.value = {
      x: e.clientX - panelPosition.value.x,
      y: e.clientY - panelPosition.value.y
    }
    e.preventDefault()
  }

  /**
   * 处理鼠标移动事件
   * 更新面板位置，包含边界检测
   * @param e - 鼠标事件对象
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    
    const newX = e.clientX - dragStart.value.x
    const newY = e.clientY - dragStart.value.y
    
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    
    panelPosition.value = {
      x: Math.max(0, Math.min(newX, windowWidth - panelWidth)),
      y: Math.max(0, Math.min(newY, windowHeight - panelHeight))
    }
  }

  /**
   * 处理鼠标松开事件
   * 结束拖动
   */
  const handleMouseUp = () => {
    isDragging.value = false
  }

  /**
   * 处理窗口大小改变事件
   * 确保面板不会超出窗口边界
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
    panelPosition,
    resetPosition,
    handleMouseDown
  }
}
