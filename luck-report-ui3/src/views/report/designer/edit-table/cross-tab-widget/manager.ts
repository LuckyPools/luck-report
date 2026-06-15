/**
 * CrossTabWidgetManager：斜线表（cross tab）widget 单例管理器
 *
 * 工作流程：
 * 1. CellRenderer 在渲染 slash 类型单元格时通过 set(key, widget) 注册 widget
 * 2. 同坐标刷新时通过 get(key) 取出复用 + 调 refreshCell()
 * 3. 卸载时通过 clear() 批量销毁
 *
 * 调用方：
 * - src/views/report/designer/edit-table/utils/CellRenderer.ts
 * - src/views/report/designer/edit-table/cross-tab-widget/class.ts
 *
 * 迁移说明：
 * - 与 chart-widget/manager.ts 结构一致，类型为带 destroy + refreshCell 的 CrossTabWidget
 */
import type CrossTabWidget from './class'

/** CrossTabWidget 抽象最小接口 */
export interface CrossTabWidgetLike {
  destroy?: () => void
  refreshCell?: () => void
  [key: string]: any
}

/** 内部使用的最小接口（不强制 index signature） */
interface WidgetBase {
  destroy?: () => void
  refreshCell?: () => void
}

/**
 * WidgetManager 泛型接口
 * - 约束改为 `T extends object` 而非 `T extends CrossTabWidgetLike`
 * - 这样 class 实例类型（class 的字段类型已与 any 相容）可以直接作为 T 使用
 * - 不再触发"类实例缺少 index signature"的 TS2344 报错
 */
interface WidgetManager<T extends object> {
  widgets: Record<string, T>
  get(key: string): T | undefined
  set(key: string, widget: T): void
  has(key: string): boolean
  remove(key: string): void
  clear(): void
}

/** CrossTabWidgetManager 单例对象 */
const CrossTabWidgetManager: WidgetManager<CrossTabWidget> = {
  widgets: {},

  /**
   * 获取指定 key 的 widget
   * @param key 单元格唯一键（`${row}_${col}`）
   */
  get(key: string): CrossTabWidget | undefined {
    return this.widgets[key]
  },

  /**
   * 注册 / 替换 widget
   * @param key 单元格唯一键
   * @param widget CrossTabWidget 实例
   */
  set(key: string, widget: CrossTabWidget): void {
    this.widgets[key] = widget
  },

  /**
   * 是否存在指定 key 的 widget
   * @param key 单元格唯一键
   */
  has(key: string): boolean {
    return key in this.widgets
  },

  /**
   * 销毁并移除指定 widget
   * @param key 单元格唯一键
   */
  remove(key: string): void {
    const widget = this.widgets[key]
    if (widget) {
      const w = widget as unknown as WidgetBase
      if (w.destroy) {
        w.destroy()
      }
    }
    delete this.widgets[key]
  },

  /**
   * 批量销毁并清空所有 widget
   */
  clear(): void {
    Object.keys(this.widgets).forEach(key => {
      const widget = this.widgets[key]
      if (widget) {
        const w = widget as unknown as WidgetBase
        if (w.destroy) {
          w.destroy()
        }
      }
    })
    this.widgets = {}
  }
}

export default CrossTabWidgetManager
