/**
 * iframe 通信工具类
 * 用于子 iframe 向父窗口发送指令消息
 * 支持动态方法名调用和代码字符串执行，确保兼容性
 * 支持获取方法执行的返回值
 */

/**
 * 消息类型定义
 */
export interface IframeMessage {
  type: 'IFRAME_COMMAND' | 'IFRAME_RESPONSE'
  action: string
  data?: any
  codeString?: string
  requestId?: string
  result?: any
  error?: string
  timestamp: number
}

/**
 * 存储待处理的请求 Promise
 */
const pendingRequests: Map<string, {
  resolve: (value: any) => void
  reject: (reason: any) => void
  timeout: ReturnType<typeof setTimeout>
}> = new Map()

/**
 * 生成唯一请求 ID
 * @return {string} 唯一请求 ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 监听父窗口返回的消息
 * 在模块加载时自动注册监听
 */
function initResponseListener(): void {
  window.addEventListener('message', (event: MessageEvent) => {
    if (!event.data || event.data.type !== 'IFRAME_RESPONSE') {
      return
    }

    const { requestId, result, error } = event.data
    if (!requestId) return

    const pending = pendingRequests.get(requestId)
    if (!pending) return

    // 清除超时定时器
    clearTimeout(pending.timeout)
    pendingRequests.delete(requestId)

    if (error) {
      pending.reject(new Error(error))
    } else {
      pending.resolve(result)
    }
  })
}

// 初始化响应监听
initResponseListener()

/**
 * 发送指令到父窗口
 * 通过 postMessage 实现跨域通信，通知父窗口执行对应方法
 *
 * @param action - 要执行的方法名，如 'readCellByAgent'、'setCellByAgent'
 * @param data - 可选的附加数据
 * @param targetOrigin - 目标窗口源，默认 '*' 表示不限制
 * @return void
 */
export function sendCommandToParent(
  action: string,
  data?: any,
  targetOrigin: string = '*'
): void {
  if (!window.parent || window.parent === window) {
    console.warn('[iframe-utils] 当前不在 iframe 中，无法发送消息到父窗口')
    return
  }

  const message: IframeMessage = {
    type: 'IFRAME_COMMAND',
    action,
    data,
    timestamp: Date.now()
  }

  try {
    window.parent.postMessage(message, targetOrigin)
    console.log(`[iframe-utils] 已发送指令: ${action}`, message)
  } catch (error) {
    console.error('[iframe-utils] 发送消息失败:', error)
  }
}

/**
 * 执行代码字符串并获取返回值
 * 支持发送完整的代码字符串如 "readCellByAgent()" 或 "setCellByAgent('value')"
 * 父窗口使用 new Function 动态执行代码并返回结果
 *
 * @param codeString - 代码字符串，格式如 "methodName(arg1, arg2, ...)"
 * @param targetOrigin - 目标窗口源，默认 '*' 表示不限制
 * @param timeout - 超时时间，默认 5000ms
 * @return Promise<any> 返回方法执行的结果
 */
export function executeCode(
  codeString: string,
  targetOrigin: string = '*',
  timeout: number = 5000
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!window.parent || window.parent === window) {
      console.warn('[iframe-utils] 当前不在 iframe 中，无法发送消息到父窗口')
      reject(new Error('当前不在 iframe 中'))
      return
    }

    // 从代码字符串中提取方法名作为 action
    const match = codeString.match(/^(\w+)/)
    const action = match ? match[1] : 'unknown'
    const requestId = generateRequestId()

    // 设置超时
    const timeoutId = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error(`请求超时: ${codeString}`))
    }, timeout)

    // 存储待处理的请求
    pendingRequests.set(requestId, {
      resolve,
      reject,
      timeout: timeoutId
    })

    const message: IframeMessage = {
      type: 'IFRAME_COMMAND',
      action,
      codeString,
      requestId,
      timestamp: Date.now()
    }

    try {
      window.parent.postMessage(message, targetOrigin)
      console.log(`[iframe-utils] 已发送代码指令: ${codeString}`, message)
    } catch (error) {
      clearTimeout(timeoutId)
      pendingRequests.delete(requestId)
      reject(error)
    }
  })
}
