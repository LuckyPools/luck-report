/**
 * 全局环境变量类型声明
 * Vite 默认会把 `VITE_` 前缀的变量注入到 import.meta.env 中
 */
interface ImportMetaEnv {
  /** 应用名（页面标题），对应 .env.* 中的 VITE_APP_NAME */
  readonly VITE_APP_NAME?: string
  /** 资源基础路径，对应 .env.* 中的 VITE_PUBLIC_PATH */
  readonly VITE_PUBLIC_PATH?: string
  /** 后端 API baseURL，对应 .env.* 中的 VITE_API_BASE_URL */
  readonly VITE_API_BASE_URL?: string
  /** 当前构建模式（development/production/test） */
  readonly MODE?: 'development' | 'production' | 'test'
  /** 是否启用 LangGraph 引擎 */
  readonly VITE_USE_LANGGRAPH_ENGINE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/**
 * 第三方模块类型 shim（项目内未安装对应 @types）
 * undo-manager：通用撤销/重做管理器
 */
declare module 'undo-manager' {
  export default class UndoManager {
    constructor()
    add(cmd: any): void
    undo(): void
    redo(): void
    clear(): void
    hasUndo(): boolean
    hasRedo(): boolean
  }
}

/**
 * 项目内未迁移到 TS 的 JS 模块类型 shim
 * 这些模块后续会单独迁移，本 shim 仅消除 TS 检查报错
 * 注：messagebox/instance 已迁为 .ts 并自带类型，**不再需要 shim**。
 *     保留其他未迁移模块的 shim 占位。
 */

/**
 * 全局 window 扩展
 * - 这些字段由项目运行时挂到 window 上，TS 阶段先声明好类型避免 TS2339
 * - setDirty / undoManager：兼容层注入到 window 的全局副作用
 * - Handsontable：handsontable 全局对象（与 import 进来的同名值同源）
 */
declare global {
  interface Window {
    /** 标记报表脏数据，触发保存提示。运行时由 utils/table.ts 注入 */
    setDirty?: () => void
    /** 全局撤销/重做管理器。运行时由 utils/table.ts 注入 */
    undoManager?: {
      add(cmd: { redo: () => void; undo: () => void }): void
      undo(): void
      redo(): void
      clear(): void
      setLimit(limit: number): void
      hasUndo(): boolean
      hasRedo(): boolean
    }
    /** handsontable 全局对象，UI 模块偶有引用 */
    Handsontable?: typeof import('handsontable').default
  }
}

/**
 * Webpack 5 raw loader 资源类型声明
 * 配合 `import x from './xxx.md?raw'` 使用
 */
declare module '*.md?raw' {
  const content: string
  export default content
}

declare module '*.txt?raw' {
  const content: string
  export default content
}

export {}

