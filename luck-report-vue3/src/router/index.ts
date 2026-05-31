import { createRouter, createWebHistory } from 'vue-router'

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
    }
  ],
})

export default router
