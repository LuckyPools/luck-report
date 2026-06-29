/**
 * 库模式入口。
 * - mount(el, options)：命令式挂载，原生 HTML / 非 Vue 宿主用
 * - LuckReportApp：声明式组件，Vue 宿主用
 *
 * 第三方用法：
 *   import LuckReport from 'luck-report-ui'
 *   LuckReport.mount('#container', { token: 'xxx', baseURL: '/api' })
 *
 *   import { LuckReportApp } from 'luck-report-ui'
 *   <LuckReportApp :token="token" base-url="/api" />
 *
 * vue / ant-design-vue / pinia / vue-router / axios 等被 vite.config.ts
 * 标记为 external，由宿主工程提供。
 */

import { createApp, defineComponent, h, type App as VueApp } from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import '@/assets/css/iconfont/iconfont.css'
import '@/assets/css/common/index.css'

import router from './router'
import pinia from './store'
import i18n from './locales'
import { setRequestToken, captureTokenFromUrl } from './utils/token'
import { setApiBaseURL } from './utils/api-base'

export interface LuckReportOptions {
  token?: string
  baseURL?: string
  defaultRoute?: string
  embed?: boolean
}

export function mount(el: HTMLElement | string, options: LuckReportOptions = {}): VueApp {
  const container = typeof el === 'string' ? document.querySelector(el) : el
  if (!container) {
    throw new Error(`[luck-report-ui] mount target not found: ${el}`)
  }

  if (options.token) setRequestToken(options.token)
  if (options.baseURL) setApiBaseURL(options.baseURL)
  captureTokenFromUrl()

  // ★ 监听父页面推送的 LR_TOKEN_REFRESH / LR_TOKEN_EXPIRED
  // 父页面通过 postMessage 推新 token 时，本 iframe 写入 sessionStorage，
  // 后续 axios 拦截器从 sessionStorage 读 → 注入 X-Access-Token header（不重载 iframe）
  // origin 校验必须做（防恶意页面伪造 token 推送）
  if (typeof window !== 'undefined') {
    window.addEventListener('message', (e: MessageEvent) => {
      // 父页面 origin 来源：优先从 document.referrer 解析（dev 时常见），
      // 生产环境第三方业务方按需改成硬编码的具体父页面 origin
      if (e.data?.type === 'LR_TOKEN_REFRESH' && typeof e.data.token === 'string' && e.data.token) {
        console.info('[LR-Token] 收到父页面推送的新 token，写入 sessionStorage')
        setRequestToken(e.data.token)
      }
    })
  }

  const app = createApp(App)
  // 把 embed / defaultRoute 通过 provide 注入，组件用 inject 读取，
  // 避免直接改 window.location 触发 router 重新匹配
  app.provide('luckReportEmbed', !!options.embed)
  app.provide('luckReportDefaultRoute', options.defaultRoute || '')
  app.use(pinia)
  app.use(router)
  app.use(i18n)
  app.use(Antd)
  app.mount(container)

  // 等待 router 完成首次导航（异步组件、守卫等）后再做跳转，
  // 避免在 pending 状态下调用 replace 引发组件闪一下
  router.isReady().then(() => {
    if (!options.defaultRoute) return
    const target = options.defaultRoute
    const current = router.currentRoute.value
    // 比对 fullPath（path + query + hash），已匹配就不动 URL
    if (current.fullPath === target || current.path === target) return
    // 透传 query（保留 filePath 等参数）
    const query = current.query
    router.replace({ path: target, query }).catch(() => undefined)
  })

  return app
}

export const LuckReportApp = defineComponent({
  name: 'LuckReportApp',
  props: {
    token: { type: String, default: '' },
    baseURL: { type: String, default: '/api' },
    defaultRoute: { type: String, default: '' },
    embed: { type: Boolean, default: false }
  },
  setup(props, { expose }) {
    let app: VueApp | null = null

    const rootRef = (el: HTMLElement | null) => {
      if (!el || app) return
      app = mount(el, {
        token: props.token,
        baseURL: props.baseURL,
        defaultRoute: props.defaultRoute,
        embed: props.embed
      })
      expose({ app, unmount: () => app?.unmount() })
    }

    return () => h('div', { ref: rootRef, class: 'luck-report-app-root' })
  }
})

const LuckReport = { mount, LuckReportApp }
export default LuckReport
