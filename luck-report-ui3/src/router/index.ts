/**
 * 路由配置
 *
 * 当前阶段：仅保留占位页用于骨架验证，views 下的页面后续逐个迁移并加入路由表
 *
 * 调用方：src/main.ts（app.use(router)）
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Home from '@/views/Home.vue'

/** 报表子模块根路径（与 webpack publicPath 区分：这是业务路由前缀） */
export const rootPath: string = '/report'

/**
 * 路由表
 * - 占位首页 Home 直接静态引入，体积小、加载时机早
 * - 后续阶段将原 views 下的 preview/designer/searchFormDesigner 等页面按 vue-router 4 写法回填
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '占位首页' }
  },
  {
    path: rootPath + '/designer',
    name: 'Designer',
    component: () => import('@/views/report/designer/index.vue')
  }
  // 后续阶段将原 views 下的页面按 vue-router 4 写法回填：
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
