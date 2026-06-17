/**
 * 应用入口文件
 *
 * 流程：
 * 1. createApp(App) - 创建 Vue3 应用实例
 * 2. app.use(router/pinia/i18n/Antd) - 注册路由、状态管理、国际化、UI 库
 * 3. 读取 window.__INIT__（由后端壳模板注入，view=workspace/embed 等）
 * 4. 注册全局消息组件
 * 5. app.mount('#app') - 挂载到 index.html 中 id=app 的根节点
 *
 * 调用方：public/index.html（vite 通过 /src/main.ts 模块加载）
 */
import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

import App from './App.vue'
import router from './router'
import pinia from './store'
import i18n from './locales'

import '@/assets/css/iconfont/iconfont.css'
import './assets/css/common/index.css'
import { captureTokenFromUrl } from '@/utils/token'

// 创建应用实例
const app = createApp(App)

captureTokenFromUrl()

// 注册全局依赖（顺序：pinia 需先于 router，保证路由守卫中能正常访问 store）
app.use(pinia)
app.use(router)
app.use(i18n)
app.use(Antd)

// —— 读取后端壳模板注入的初始化上下文（可选） ——
// 后端可在 index.html 中通过 Thymeleaf 注入：
//   <script>window.__INIT__ = { view: 'workspace', theme: 'dark' }</script>
// 前端通过该对象判断默认形态、主题等。当前实现仅作占位读取，预留扩展位。
declare global {
  interface Window {
    __INIT__?: {
      view?: 'workspace' | 'embed'
      theme?: 'light' | 'dark'
      [key: string]: unknown
    }
    __PAGE__?: string
  }
}
const initContext = (typeof window !== 'undefined' && window.__INIT__) || {}
// 预留：将 initContext 同步到 store / provide，供 WorkspaceLayout 等读取
// 当前实现：WorkspaceLayout 直接读 route.query.view 即可，无需 store 同步
void initContext

// 挂载根节点
app.mount('#app')
