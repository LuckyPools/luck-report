import { createRouter, createWebHistory } from 'vue-router'

/**
 * 路由说明
 * - '/' 主页
 * - '/designer' 报表设计器入口（与后端 ReportPageController#designer 对应）
 * - '/preview'  报表预览入口（与后端 ReportPageController#preview 对应）
 * - dev 模式下 '/designer' 走 Vite dev server；prod 模式下 '/designer' 由 ReportPageController 通配回收
 *
 * import.meta.env.BASE_URL：
 *   - dev: '/'（vite.config.ts base）
 *   - build: './'（vite.config.ts base，打包后由 Thymeleaf 嵌入）
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'main',
      component: () => import('@/views/main/index.vue')
    },
    {
      path: '/test',
      name: 'test',
      component: () => import('@/views/test/index.vue')
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('@/views/chat/index.vue')
    },
    {
      path: '/export',
      name: 'export',
      component: () => import('@/views/export/index.vue')
    },
    {
      path: '/model-config',
      name: 'model-config',
      component: () => import('@/views/model-config/index.vue')
    },
    {
      path: '/business-knowledge-config',
      name: 'business-knowledge-config',
      component: () => import('@/views/business-knowledge-config/index.vue')
    },
    {
      path: '/datasource',
      name: 'datasource',
      component: () => import('@/views/datasource/index.vue')
    },
    {
      path: '/agent-knowledge-config',
      name: 'agent-knowledge-config',
      component: () => import('@/views/agent-knowledge-config/index.vue')
    },
    {
      // 报表设计器入口（与后端 ReportPageController#designer 对应）
      path: '/designer',
      name: 'designer',
      component: () => import('@/views/designer/index.vue')
    },
    {
      // 报表预览入口（与后端 ReportPageController#preview 对应）
      path: '/preview',
      name: 'preview',
      component: () => import('@/views/preview/index.vue')
    }
  ],
})

export default router
