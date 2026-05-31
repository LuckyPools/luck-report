/**
 * iframe 跨框架通信工具
 * 用于 Vue3 AI 对话框与父页面（Vue2 设计器）之间的通信
 */

/**
 * 检测是否在 iframe 中运行
 * @returns 是否在 iframe 中
 */
export function isInIframe(): boolean {
  return window.self !== window.top
}

/**
 * 获取父窗口的 document 对象
 * 注意：仅在同源情况下可用
 * @returns 父窗口 document 或 null
 */
export function getParentDocument(): Document | null {
  if (!isInIframe()) return null
  try {
    return window.parent.document
  } catch {
    console.warn('无法访问父窗口 document，可能是跨域限制')
    return null
  }
}

/**
 * 操作父页面的 DOM 元素
 * @param selector - CSS 选择器
 * @param action - 要执行的操作
 * @returns 操作是否成功
 */
export function operateParentElement(
  selector: string,
  action: (element: Element) => void
): boolean {
  const parentDoc = getParentDocument()
  if (!parentDoc) return false

  const element = parentDoc.querySelector(selector)
  if (!element) {
    console.warn(`父页面中未找到元素: ${selector}`)
    return false
  }

  try {
    action(element)
    return true
  } catch (error) {
    console.error('操作父页面元素失败:', error)
    return false
  }
}

/**
 * 向父窗口发送消息
 * @param type - 消息类型
 * @param payload - 消息内容
 */
export function postMessageToParent(type: string, payload: unknown): void {
  if (!isInIframe()) return
  window.parent.postMessage({ type, payload }, '*')
}

/**
 * 监听来自父窗口的消息
 * @param type - 消息类型
 * @param handler - 消息处理函数
 * @returns 取消监听函数
 */
export function onMessageFromParent(
  type: string,
  handler: (payload: unknown) => void
): () => void {
  const listener = (event: MessageEvent) => {
    if (event.data?.type === type) {
      handler(event.data.payload)
    }
  }
  window.addEventListener('message', listener)
  return () => window.removeEventListener('message', listener)
}

/**
 * 设计器 DOM 操作工具集
 * 封装常用的设计器元素操作方法
 */
export const designerOperations = {
  /**
   * 高亮指定单元格
   * @param cellId - 单元格 ID
   */
  highlightCell(cellId: string): boolean {
    return operateParentElement(`#${cellId}`, (el) => {
      el.classList.add('ai-highlight')
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  },

  /**
   * 取消高亮
   * @param cellId - 单元格 ID
   */
  unhighlightCell(cellId: string): boolean {
    return operateParentElement(`#${cellId}`, (el) => {
      el.classList.remove('ai-highlight')
    })
  },

  /**
   * 获取设计器中选中的元素信息
   * @returns 选中元素的信息
   */
  getSelectedCells(): Array<{ id: string; content: string }> {
    const parentDoc = getParentDocument()
    if (!parentDoc) return []

    const selectedCells = parentDoc.querySelectorAll('.selected-cell')
    return Array.from(selectedCells).map((cell) => ({
      id: cell.id,
      content: cell.textContent || ''
    }))
  },

  /**
   * 在设计器中插入内容
   * @param targetSelector - 目标元素选择器
   * @param content - 要插入的内容
   */
  insertContent(targetSelector: string, content: string): boolean {
    return operateParentElement(targetSelector, (el) => {
      const input = el as HTMLInputElement
      if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
        input.value = content
        input.dispatchEvent(new Event('input', { bubbles: true }))
      } else {
        el.textContent = content
      }
    })
  }
}
