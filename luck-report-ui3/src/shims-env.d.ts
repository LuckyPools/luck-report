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
 */
declare module '@/components/messagebox/instance' {
  const MessageBox: {
    alert(message: string, title?: string, options?: any): Promise<any>
    confirm(message: string, title?: string, options?: any): Promise<any>
    prompt(message: string, title?: string, options?: any): Promise<any>
  }
  export default MessageBox
}

declare module '@/components/messagebox/instance.js' {
  const MessageBox: {
    alert(message: string, title?: string, options?: any): Promise<any>
    confirm(message: string, title?: string, options?: any): Promise<any>
    prompt(message: string, title?: string, options?: any): Promise<any>
  }
  export default MessageBox
}

declare module '@/views/report/designer/edit-table/manager' {
  const TableManager: {
    table: any
    get(): any
    set(table: any): void
    has(): boolean
    clear(): void
  }
  export default TableManager
}

declare module '@/views/report/designer/edit-table/manager.js' {
  const TableManager: {
    table: any
    get(): any
    set(table: any): void
    has(): boolean
    clear(): void
  }
  export default TableManager
}

declare module '@/components/utils' {
  export function debounce(func: () => void, wait: number, name: string): void
  export function oneOf(value: any, validList: any[]): boolean
  export function isVNode(node: any): boolean
  export function deepCopy<T = any>(data: T, hash?: WeakMap<any, any>): T
  export function findComponentUpward(context: any, componentName: string | string[], componentNames?: string[]): any
  export function findBrothersComponents(context: any, componentName: string, exceptMe?: boolean): any[]
  export function findComponentDownward(context: any, componentName: string): any
}
