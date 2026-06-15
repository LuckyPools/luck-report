/**
 * 无类型声明（@types 缺失）的第三方库的兜底声明
 *
 * - raphael：无 @types/raphael 包，运行时是 CommonJS 导出 Raphael 构造函数
 * - save-svg-as-png：无类型声明，运行时是带 default 导出的函数
 * - undo-manager：项目用了但无类型声明
 * - sortablejs：项目用了但无类型声明
 *
 * 兜底策略：unknown 默认值，调用方需要自己再 cast
 * 这里使用 any 而非 unknown，便于跨文件传递时少一些 cast
 */

declare module 'raphael' {
  const Raphael: any
  export default Raphael
}

declare module 'save-svg-as-png' {
  const saveSvgAsPng: any
  export default saveSvgAsPng
}

declare module 'undo-manager' {
  const UndoManager: any
  // 使用 export = CJS 形式，避免与现有 lib 中已声明的 default 冲突
  // （import UndoManager from 'undo-manager' 在 esModuleInterop 下仍可工作）
  export = UndoManager
}

declare module 'sortablejs' {
  const Sortable: any
  export default Sortable
}
