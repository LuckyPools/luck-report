/**
 * 报表设计器核心领域类型定义
 *
 * 设计原则：
 * - 全部为可空字段，因 store 在初始化时 context 可能为空
 * - 与原 Vuex 模块的字段保持一致，避免迁移时上层消费逻辑改动
 * - 字段命名沿用后端协议（rowNumber/columnNumber 等），不做 isXxx 风格转换（后端字段以数据为准）
 */

/**
 * 单元格定义
 * - rowNumber/columnNumber 为强类型字段
 * - 其余字段（value/cellStyle/format/...）通过 [key: string]: any 索引
 *   这样 cell.cellStyle?.xxx 这种链式读写不会触发 TS18046（unknown 不可索引）
 *   比 unknown 更贴合运行时实际使用方式
 */
export interface ReportCell {
  rowNumber: number
  columnNumber: number
  cellStyle?: Record<string, any>
  [key: string]: any
}

/** 行头定义 */
export interface ReportRowHeader {
  rowNumber: number
  band: string
}

/** 数据集字段 */
export interface ReportDatasetField {
  name: string
  [key: string]: unknown
}

/** 数据集定义 */
export interface ReportDataset {
  name: string
  fields?: ReportDatasetField[]
  [key: string]: unknown
}

/** 数据源定义 */
export interface ReportDatasource {
  name: string
  datasets?: ReportDataset[]
  [key: string]: unknown
}

/** 查询表单设计对象 */
export interface ReportSearchForm {
  [key: string]: unknown
}

/** 页面/页眉/页脚共用基础结构（具体字段以实际运行时为准） */
export interface ReportPaperLike {
  [key: string]: unknown
}

/** 报表行定义 */
export interface ReportRowDef {
  rowNumber: number
  [key: string]: unknown
}

/** 报表列定义 */
export interface ReportColumnDef {
  columnNumber: number
  [key: string]: unknown
}

/** 报表核心定义（reportDef） */
export interface ReportDef {
  datasources?: ReportDatasource[]
  searchForm?: ReportSearchForm
  paper?: ReportPaperLike
  header?: ReportPaperLike
  footer?: ReportPaperLike
  rows?: ReportRowDef[]
  columns?: ReportColumnDef[]
  [key: string]: unknown
}

/** 设计器全局上下文（cellsMap 用 Map 存储以便按 row,col 快速定位） */
export interface ReportContext {
  reportDef: ReportDef
  cellsMap: Map<string, ReportCell>
  rowHeaders: ReportRowHeader[]
  [key: string]: unknown
}
