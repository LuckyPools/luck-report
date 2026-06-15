/**
 * Pinia 状态管理入口
 *
 * 改造说明：
 * - 原 Vuex 3 入口已弃用，Pinia 是 Vue3 官方推荐的状态管理方案
 * - 旧的 src/store/modules/report.js 仍保留（按 Vuex 写法），但不在此入口引用，
 *   避免 Pinia 启动时报错；后续 views 迁移时按 Pinia 用法重写为 useReportStore
 */
import { createPinia } from 'pinia'

const pinia = createPinia()

export default pinia
