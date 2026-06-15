/**
 * Pinia 状态管理入口
 *
 * 改造说明：
 * - 原 Vuex 3 入口已弃用，Pinia 是 Vue3 官方推荐的状态管理方案
 * - 旧 src/store/getters.js 已删除（其内容并入 modules/report.ts 的 getters）
 * - src/store/modules/report.ts 已迁移为 defineStore 写法，对外暴露 useReportStore
 *
 * views 使用方式：
 *   import { useReportStore } from '@/store/modules/report'
 *   const report = useReportStore()
 *   report.contextAddCell(cell)
 *   report.setFileName('xxx')
 */
import { createPinia, type Pinia } from 'pinia'

/** 全局 Pinia 实例（单例） */
const pinia: Pinia = createPinia()

export default pinia
