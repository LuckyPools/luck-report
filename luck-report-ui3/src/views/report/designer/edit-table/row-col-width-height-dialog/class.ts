/**
 * RowColWidthHeightDialog 动态挂载类
 *
 * 工作流程：
 * 1. 构造时 createApp 启动 RowColWidthHeightDialog 子应用 → 挂到 body
 * 2. 调用 show(callback, value, isCol) 触发弹窗显示
 * 3. 用户在弹窗中确认后回调 callback(num)
 *
 * 调用方：
 * - src/views/report/designer/edit-table/utils/ContextMenu.ts
 *   - row_height → isCol=false
 *   - col_width → isCol=true
 *
 * 迁移说明：
 * - Vue2 `Vue.extend(Comp).$mount()` 改为 vue3 `createApp(Comp).mount(el)`（通过 createDialogApp 工具）
 * - 子 app 由 createDialogApp 内部 app.use(i18n) / app.use(Antd) 注入依赖；
 *   vue3 createApp 是独立的，与 main.ts 主 app 不共享 plugin 状态
 * - 组件内部仍然叫 show(callback, value, isCol)，保持 API 兼容
 */
// 组件需要同时作为值（createApp 挂载）和类型（泛型推断）使用，所以用普通 import
// SFC 默认导出的 DefineComponent 既是值也是类型
import RowColWidthHeightDialog from './index.vue'
import { createDialogApp, type DialogAppHandle } from '@/utils/dialog'

/** 弹窗组件 props 类型（无显式 props，data 通过 show 注入；占位以便泛型推断） */
interface RowColWidthHeightDialogProps extends Record<string, unknown> {
  // 组件未声明 props
}

/** 弹窗组件暴露的方法 */
interface RowColWidthHeightDialogMethods {
  show(callback: (num: number) => void, value: number | string, isCol: boolean): void
}

/**
 * RowColWidthHeightDialog 挂载类
 */
export default class Class {
  /** Vue3 子应用句柄 */
  private handle: DialogAppHandle<RowColWidthHeightDialogProps> | null = null

  /**
   * 构造方法：创建并挂载弹窗子应用
   */
  constructor() {
    this.handle = createDialogApp<RowColWidthHeightDialogProps>(RowColWidthHeightDialog as unknown as Parameters<typeof createDialogApp>[0], {})
  }

  /**
   * 显示弹窗
   * @param callback 确认后的回调
   * @param value 初始值
   * @param isCol true=列宽；false=行高
   */
  show(callback: (num: number) => void, value: number | string, isCol: boolean): void {
    const inst = this.handle?.instance as unknown as RowColWidthHeightDialogMethods | null
    if (inst && typeof inst.show === 'function') {
      inst.show(callback, value, isCol)
    }
  }
}
