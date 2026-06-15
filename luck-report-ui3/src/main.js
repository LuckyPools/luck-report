/**
 * 应用入口文件
 * 负责创建 Vue3 应用实例、注册全局依赖（路由/Pinia/国际化/AntdVue）并挂载根节点
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

// 注册全局依赖
app.use(router)
app.use(pinia)
app.use(i18n)
app.use(Antd)

// 挂载根节点
app.mount('#app')
