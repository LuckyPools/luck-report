/**
 * 路由配置
 *
 * 当前阶段：占位首页 + 报表设计器/预览已就位；AI Agent / 后台管理 / 嵌入页路由已预留
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
 * - 设计器/预览/AI 对话/嵌入页/后台管理 4 类均挂载在 `views/report/*` 下，统一走 `/report/*`
 * - `/_dev/test` 仅在 development 构建时注册
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
  },
  {
    path: rootPath + '/preview',
    name: 'Preview',
    component: () => import('@/views/report/preview/index.vue')
  },

  // —— AI 对话与 Agent 引擎 ——
  {
    path: rootPath + '/chat',
    name: 'AgentChat',
    component: () => import('@/views/report/designer/chat/index.vue'),
    meta: { title: 'AI 报表助手' }
  },

  // —— 后台管理：数据源/模型/知识库 ——
  {
    path: rootPath + '/datasource',
    name: 'ManageDatasource',
    component: () => import('@/views/report/datasource/index.vue'),
    meta: { title: '数据源管理' }
  },
  {
    path: rootPath + '/model-config',
    name: 'ManageModelConfig',
    component: () => import('@/views/report/model-config/index.vue'),
    meta: { title: '模型管理' }
  },
  {
    path: rootPath + '/business-knowledge',
    name: 'ManageBusinessKnowledge',
    component: () => import('@/views/report/business-knowledge/index.vue'),
    meta: { title: '业务知识库' }
  },
  {
    path: rootPath + '/agent-knowledge',
    name: 'ManageAgentKnowledge',
    component: () => import('@/views/report/agent-knowledge/index.vue'),
    meta: { title: 'Agent 知识库' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_PUBLIC_PATH || '/'),
  routes
})

export default router
