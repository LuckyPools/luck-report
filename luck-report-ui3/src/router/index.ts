/**
 * 路由配置
 *
 * 当前阶段：工作台化（顶栏 + 左侧菜单 + 内容区）
 *
 * 形态：
 * - 工作台（默认）：所有业务页面统一由 WorkspaceLayout 包裹，含顶栏、菜单
 * - 嵌入（?view=embed）：由 WorkspaceLayout 自身识别 query 隐藏 chrome，
 *   第三方 iframe 嵌入时无菜单/无顶栏，直接渲染目标页
 *
 * 路由分层：
 * - 顶层独立路由：/report/designer、/report/preview —— 独立全屏页，
 *   菜单点击会通过 window.open 打开新标签，不在 workspace 内嵌渲染
 * - workspace 子路由：/report/datasource、/report/model-config、/report/manage 等后台管理页
 *   全部由 WorkspaceLayout 包裹，含顶栏/侧栏；/ 默认重定向到 /report/manage
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

/** 报表子模块根路径（与 webpack publicPath 区分：这是业务路由前缀） */
export const rootPath: string = '/report'

/**
 * 路由表
 * - 顶层独立路由（designer/preview）走全屏渲染，菜单点击新标签打开
 * - 顶层 / 走 WorkspaceLayout（菜单 + 顶栏），默认重定向到 /report/manage
 * - workspace 下挂后台管理子路由
 */
const routes: RouteRecordRaw[] = [
  // —— 顶层独立路由：报表设计/预览（全屏，不嵌在 workspace 内） ——
  {
    path: rootPath + '/designer',
    name: 'Designer',
    component: () => import('@/views/report/designer/index.vue'),
    meta: { title: '报表设计' }
  },
  {
    path: rootPath + '/preview',
    name: 'Preview',
    component: () => import('@/views/report/preview/index.vue'),
    meta: { title: '报表预览' }
  },

  // —— 工作台：/ 走 WorkspaceLayout（菜单 + 顶栏），/ 默认重定向到报表管理 ——
  {
    path: '/',
    component: () => import('@/layouts/WorkspaceLayout.vue'),
    redirect: rootPath + '/manage',
    children: [
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
        path: rootPath + '/role',
        name: 'ManageRole',
        component: () => import('@/views/report/role/index.vue'),
        meta: { title: '角色报表' }
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
        meta: { title: '智能体知识库' }
      },
      {
        path: rootPath + '/manage',
        name: 'ManageReports',
        component: () => import('@/views/report/manage/index.vue'),
        meta: { title: '报表管理' }
      }
    ]
  },

  // —— 兜底：未匹配路径回到报表管理 ——
  {
    path: '/:pathMatch(.*)*',
    redirect: rootPath + '/manage'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_PUBLIC_PATH || '/'),
  routes
})

export default router
