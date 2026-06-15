/**
 * handsontable 类型增强定义（仅定义私有/缺失字段，不重写官方方法）
 *
 * 背景：
 * - node_modules/handsontable/handsontable.d.ts 是 6.2.2 的官方 typings
 *   内部用 `declare namespace _Handsontable { class Core { ... } }` 声明
 * - 官方 Core 已经声明了 addHook / countRows / countCols / getSettings / setDataAtCell /
 *   updateSettings / loadData / render / destroy / alter / getRowHeight / getColWidth /
 *   getSelected / getCell / getCoords 等方法，**禁止在 interface 中重写**，否则会冲突丢失
 * - 之前用 `declare global { namespace _Handsontable { interface Core { ... } } }`
 *   试图扩展，但因方法签名不一致（如 getCell 返回值类型不同）导致 class 成员被丢弃
 * - 新方案：仅在 augment 中**新增**官方 d.ts 缺失的字段（view 引用链、Hooks 类型），
 *   然后在 types/handsontable.ts 中用交叉类型 `_Handsontable.Core & HandsontableAugment`
 *   把官方 class 与本增强合并为 HandsontableInstance
 *
 * 工作流程：
 * 1. 全局 `import 'handsontable'` 触发官方 d.ts 加载
 * 2. 本文件 `export {}` → 自身被识别为 ES Module
 * 3. `declare global { ... }` 把新增类型挂到全局
 * 4. types/handsontable.ts 通过交叉类型整合
 *
 * 调用方：
 * - src/types/handsontable.ts（被所有需要 handsontable 实例类型的 .ts/.vue 文件引用）
 * - src/views/report/designer/edit-table/chart-widget/index.vue（使用 ViewLike）
 *
 * 注意：
 * - 私有 API 仅在 handsontable 6.x 存在；本项目锁版本 6.2.2，可放心使用
 * - 官方 d.ts 已声明的方法**不要重复声明**，仅做新增
 */

/**
 * side-effect import：触发官方 handsontable d.ts 加载，
 * 让 _Handsontable.Core / Handsontable 等全局命名空间可用
 */
import 'handsontable'

/** 本文件是 ES Module（必须有 export 才能让 declare global 生效） */
export {}

/** handsontable 私有 view 抽象（chart-widget 等通过 hot.view.wtTable / hot.view.wt.wtTable 访问） */
interface WtTableLike {
  /** 通过 TD 元素反查坐标，chart-widget 不使用但部分代码路径会触发 */
  getCoords(td: HTMLElement): { row: number; col: number } | null
  /**
   * 获取指定单元格的内部 cell 包装
   * - chart-widget 直接取 .parentNode 拿 td
   * - parentNode 在浏览器中一定是 HTMLElement | null
   */
  getCell?(row: number, col: number): { parentNode: HTMLElement | null } | null
}

/** 内部 view 引用链：chart-widget 兼容 view.wtTable 与 view.wt.wtTable 两种写法 */
interface ViewLike {
  wtTable?: WtTableLike
  wt?: {
    wtTable?: WtTableLike
  }
}

/**
 * 静态 hooks 抽象（Handsontable.hooks / window.Handsontable.hooks）
 * - 项目中既用到 `Handsontable.hooks.run` 也用到 `Handsontable.hooks.add`
 * - 官方 d.ts 没有为 Hooks 单独定义类型，这里按实际使用补充
 */
interface HooksLike {
  /**
   * 注册一个全局钩子
   * @param name 钩子名
   * @param callback 回调
   * @param instance 绑定到具体实例（handsontable 6.x 真实签名）
   */
  add(name: string, callback: (...args: any[]) => any, instance?: unknown): void
  /**
   * 手动触发一个钩子
   * @param context handsontable 实例
   * @param name 钩子名
   * @param args 钩子参数
   */
  run(context: unknown, name: string, ...args: any[]): void
  /** 反注册 */
  remove(name: string, callback?: (...args: any[]) => any): void
}

/**
 * 项目侧 handsontable 实例增强（官方 d.ts 没有的私有字段）
 * - 用交叉类型合并到 _Handsontable.Core，避免重写官方方法
 */
export interface HandsontableAugment {
  /** 内部 view 引用链（chart-widget 通过它拿 wtTable） */
  view?: ViewLike
  /**
   * 重新设置 handsontable 配置
   * - settings 改用 Partial 形式，匹配项目内「局部更新」的常见用法
   * - init 改为可选（handsontable 6.x 默认 false）
   * @param settings 新配置（部分配置即可）
   * @param init 是否走 init 流程（handsontable 6.x 默认 false，可选）
   */
  updateSettings(settings: Partial<Handsontable.DefaultSettings>, init?: boolean): void
  /**
   * 注册一个 handsontable 钩子回调
   * - 官方 d.ts 把 callback 限制为 `(() => void) | (() => void)[]`，
   *   但实际 afterRenderer / afterChange / afterRowResize / afterColumnResize 等
   *   钩子都需要接收参数（td, row, col, ...）
   * - 这里把 callback 放宽为 `(...args: any[]) => any`，与运行时行为一致
   * - 通过交叉类型合并到 _Handsontable.Core，不会丢失官方声明
   * @param name 钩子名
   * @param callback 回调函数（参数个数按钩子语义传入）
   */
  addHook(name: string, callback: (...args: any[]) => any): void
}

declare global {
  /**
   * 扩展官方 Handsontable.Hooks 接口
   * - 官方 d.ts 中 Handsontable.Hooks 是「钩子回调映射表」类型（仅声明各 afterXxx 回调字段）
   * - 但 `static hooks: Handsontable.Hooks` 的实际运行时值是 Hooks 类实例，
   *   拥有 run / add / remove / register 等方法
   * - 项目中使用 `Handsontable.hooks.run(...)` / `Handsontable.hooks.add(...)`
   *   所以把缺失的实例方法声明合并到 Handsontable.Hooks
   */
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Handsontable {
    interface Hooks {
      /**
       * 注册一个全局钩子
       * @param name 钩子名
       * @param callback 回调
       * @param instance 绑定到具体实例（handsontable 6.x 真实签名）
       */
      add(name: string, callback: (...args: any[]) => any, instance?: unknown): void
      /**
       * 手动触发一个钩子
       * @param context handsontable 实例
       * @param name 钩子名
       * @param args 钩子参数
       */
      run(context: unknown, name: string, ...args: any[]): void
      /** 反注册 */
      remove(name: string, callback?: (...args: any[]) => any): void
    }
  }

  /**
   * window.Handsontable 同样需要 hooks 字段
   * - 用 any 以兼容上游 lib 中已存在的隐式声明（部分 lib.d.ts 把 Window.Handsontable
   *   声明为 any，这里再细化会被 TS 当作重复声明且类型不兼容）
   */
  interface Window {
    Handsontable?: any
  }
}
