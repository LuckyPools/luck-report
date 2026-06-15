/**
 * Vuex 风格 store 兼容层
 *
 * 用途：
 * - 原项目大量使用 `store.dispatch('report/X', payload)` 和 `store.getters['report/Y']` 的 Vuex 风格写法
 * - 直接把所有调用改成 Pinia 调用成本高、风险大
 * - 此 shim 把 Pinia store 包装成 Vuex 风格的 store，让旧代码无需改动即可继续工作
 *
 * 使用：
 *   import store from '@/store/vuex-compat'
 *   store.dispatch('report/contextAddCell', cell)
 *   store.getters['report/getContext']
 *
 * 注意：仅作过渡使用，新增代码请直接使用 `useReportStore()`。
 */
import { useReportStore } from './modules/report'

/** Vuex 风格 store 抽象类型 */
export interface VuexCompatStore {
  /** 分发 action：type 格式为 '模块/动作名'，自动忽略模块名前缀 */
  dispatch(type: string, payload?: unknown): Promise<unknown>
  /** getters 字典：key 格式为 '模块/getter名' */
  getters: Record<string, unknown>
}

/**
 * 将 Vuex 风格 action 名称转为 Pinia 风格方法名
 * - 'report/setContext' → 'setContext'
 * - 'report/contextAddCell' → 'contextAddCell'
 */
const actionNameOf = (type: string): string => {
  const idx = type.indexOf('/')
  return idx >= 0 ? type.substring(idx + 1) : type
}

/**
 * 构造 Vuex 风格 store 代理
 * - 每次访问都从 Pinia 实时取最新值，避免 store 状态变更后缓存陈旧
 * - dispatch: 把 '模块/X' 映射到 useReportStore().X(payload)
 * - getters: 把 '模块/X' 映射到 useReportStore().X 的当前值
 *   - 对 curried 形式的 getter（如 getRows(rowNumber) => rows），保留函数引用供调用方再传参
 */
const buildStore = (): VuexCompatStore => {
  const report = () => useReportStore()
  return {
    dispatch(type: string, payload?: unknown): Promise<unknown> {
      const name = actionNameOf(type)
      const fn = (report() as unknown as Record<string, unknown>)[name]
      if (typeof fn === 'function') {
        // Pinia action 自身已是函数，直接调用即可
        return Promise.resolve((fn as (p?: unknown) => unknown).call(report(), payload))
      }
      return Promise.resolve()
    },
    getters: new Proxy({} as Record<string, unknown>, {
      get(_t, prop: string) {
        const name = actionNameOf(prop)
        const target = report() as unknown as Record<string, unknown>
        const value = target[name]
        // 如果 Pinia getter 本身是函数（curried getter），原样返回供调用方继续传参
        if (typeof value === 'function') return value
        // 否则直接返回当前值
        return value
      }
    })
  }
}

/** 全局单例 Vuex 兼容 store */
const store: VuexCompatStore = buildStore()

export default store
