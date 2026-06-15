/**
 * ContentTable（edit-table 组件）契约
 *
 * 工作流程：
 * 1. 接收父级传入的 reportPath，挂载时从 url 解析 reportPath 并初始化 handsontable
 * 2. 加载报表定义（reportDef），构建二维数据 / 列宽 / 行高 / 合并单元格
 * 3. 监听用户选中、编辑、拖放、右键菜单等交互
 * 4. 通过 emit('cell-selected') / emit('save') / emit('error') 与父级通信
 * 5. 通过 expose() 向父级暴露 getReportData / saveReport
 *
 * 调用方：src/views/report/designer/index.vue（报表设计器顶层页）
 *        src/views/report/designer/resource-panel/index.vue（侧边栏，间接通过 store 读取）
 *
 * 迁移说明：
 * - 原 Options API 已迁为 setup lang=ts
 * - 模板引用从 this.$refs.contentTable 改为 contentTable = ref<HTMLDivElement>()
 * - 事件由 this.$emit 改为 defineEmits
 * - 全局 store 由 this.$store.dispatch 改为 useReportStore()
 * - i18n 由 this.$t 改为 useI18n().t
 */

import type { ReportCell, ReportDef, ReportRowHeader } from '@/types/report-def'

/** 单元格选中范围 */
export interface CellRange {
  /** 起始行（0 基） */
  rowIndex: number
  /** 起始列（0 基） */
  colIndex: number
  /** 结束行（0 基） */
  row2Index: number
  /** 结束列（0 基） */
  col2Index: number
}

/** 组件 props 契约 */
export interface ContentTableProps {
  /** 报表路径（由父级传入，未传入时从 url query 解析） */
  reportPath?: string
}

/** 组件 emits 契约 */
export interface ContentTableEmits {
  /** 选中单元格范围变化 */
  (e: 'cell-selected', range: CellRange): void
  /** 请求保存（data 为当前报表的 xml 字符串） */
  (e: 'save', payload: { data: string }): void
  /** 加载或运行期错误 */
  (e: 'error', err: unknown): void
}

/** 组件 expose 契约（父级通过 ref 调用的方法） */
export interface ContentTableExpose {
  /** 获取当前报表的 xml 字符串（用于保存） */
  getReportData(): string
  /** 触发保存（内部同样会 emit 'save'） */
  saveReport(): void
}

/** ContentTable 内部 cellsMap 单元（与 ReportCell 同义） */
export type ContentTableCell = ReportCell

/** ContentTable 内部 rowHeaders 单元 */
export type ContentTableRowHeader = ReportRowHeader

/** ContentTable 内部 reportDef 单元 */
export type ContentTableReportDef = ReportDef
