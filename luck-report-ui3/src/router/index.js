/**
 * 路由配置
 * 当前阶段：仅保留占位页用于骨架验证，views 下的页面后续逐个迁移并加入路由表
 */
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'

export const rootPath = '/report'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '占位首页' }
  }
  // 后续阶段将原 views 下的 preview/designer/searchFormDesigner 等页面按 vue-router 4 写法回填：
  // {
  //   path: rootPath + '/preview',
  //   name: 'Preview',
  //   component: () => import('@/views/report/preview/index.vue')
  // }
]

const router = createRouter({
  history: createWebHistory(process.env.VUE_APP_PUBLIC_PATH || '/'),
  routes
})

export default router
