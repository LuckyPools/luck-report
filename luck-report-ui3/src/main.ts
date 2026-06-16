/**
 * 应用入口文件
 *
 * 流程：
 * 1. createApp(App) - 创建 Vue3 应用实例
 * 2. app.use(router/pinia/i18n/Antd) - 注册路由、状态管理、国际化、UI 库
 * 3. app.mount('#app') - 挂载到 index.html 中 id=app 的根节点
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

// 创建应用实例
const app = createApp(App)

// 注册全局依赖（顺序：pinia 需先于 router，保证路由守卫中能正常访问 store）
app.use(pinia)
app.use(router)
app.use(i18n)
app.use(Antd)

// 挂载根节点
app.mount('#app')
