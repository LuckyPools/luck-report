/**
 * Pinia 增强类型声明
 * 说明：将 store/modules/report.ts 中导出的 useReportStore 注册为全局 InjectionKey，
 *        让组件内 inject('reportStore') 等场景也能拿到带类型的 store 实例。
 */
import 'pinia'
import type { ReportStore } from '@/store/modules/report'

declare module 'pinia' {
  interface PiniaCustomProperties {
    /** 报表设计器 store 实例（项目内统一从 useReportStore() 取） */
    readonly reportStore: ReportStore
  }
}

export {}
