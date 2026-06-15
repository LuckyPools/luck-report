/**
 * 全局环境变量类型声明
 * 说明：补充 Vue CLI 注入到 process.env 上的变量类型，让 TS 能正常推断
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /** 资源基础路径，由 vue.config.js publicPath 注入 */
    readonly VUE_APP_PUBLIC_PATH?: string
    /** 当前构建模式（development/production） */
    readonly NODE_ENV?: 'development' | 'production' | 'test'
  }
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

export {}

declare module '@/components/utils' {
  export function debounce(func: () => void, wait: number, name: string): void
  export function oneOf(value: any, validList: any[]): boolean
  export function isVNode(node: any): boolean
  export function deepCopy<T = any>(data: T, hash?: WeakMap<any, any>): T
  export function findComponentUpward(context: any, componentName: string | string[], componentNames?: string[]): any
  export function findBrothersComponents(context: any, componentName: string, exceptMe?: boolean): any[]
  export function findComponentDownward(context: any, componentName: string): any
}
