import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

export const rootPath = "/report";

const routes = [
  {
    path: rootPath + '/preview',
    name: 'Preview',
    component: () => import('@/views/report/preview/index.vue')
  },
  {
    path: rootPath + '/designer',
    name: 'Designer',
    component: () => import('@/views/report/designer/index.vue')
  },
  {
    path: rootPath + '/searchFormDesigner',
    name: 'searchFormDesigner',
    component: () => import('@/views/report/designer/search-form/index.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.VUE_APP_PUBLIC_PATH || '/',
  routes
})

export default router
