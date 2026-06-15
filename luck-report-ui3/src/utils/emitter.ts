/**
 * 简单的事件总线（mitt 风格的 Vue3 兼容实现）
 *
 * 背景：
 * - Vue3 已移除 $on / $off / $once 实例事件 API
 * - 项目内 form / form-item / radio-group / select 等组件原先依赖这些 API
 *   在组件间广播事件
 * - 本文件提供一个最小可用的全局事件总线，避免引入新依赖
 *
 * 使用：
 *   import emitter from '@/utils/emitter'
 *   emitter.on('form-blur', handler)
 *   emitter.off('form-blur', handler)
 *   emitter.emit('form-blur', payload)
 */
type Handler = (payload?: unknown) => void

const handlers: Record<string, Handler[]> = {}

const emitter = {
  /**
   * 注册事件监听
   * @param type 事件名
   * @param handler 事件处理函数
   */
  on(type: string, handler: Handler): void {
    ;(handlers[type] || (handlers[type] = [])).push(handler)
  },

  /**
   * 注销事件监听
   * @param type 事件名
   * @param handler 要移除的处理函数（不传则清空该事件的所有监听）
   */
  off(type: string, handler?: Handler): void {
    const list = handlers[type]
    if (!list) return
    if (!handler) {
      handlers[type] = []
    } else {
      const idx = list.indexOf(handler)
      if (idx > -1) list.splice(idx, 1)
    }
  },

  /**
   * 触发事件
   * @param type 事件名
   * @param payload 事件参数
   */
  emit(type: string, payload?: unknown): void {
    const list = handlers[type]
    if (!list) return
    list.slice().forEach((fn) => {
      try {
        fn(payload)
      } catch (err) {
        // 单个 handler 抛错不影响其他 handler
        // eslint-disable-next-line no-console
        console.error('[emitter] handler error for', type, err)
      }
    })
  }
}

export default emitter
