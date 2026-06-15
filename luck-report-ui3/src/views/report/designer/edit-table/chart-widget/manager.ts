/**
 * ChartWidgetManager：图表 widget 单例管理器
 *
 * 工作流程：
 * 1. CellRenderer 在渲染 chart 类型单元格时通过 set(key, widget) 注册 widget
 * 2. 后续渲染同坐标单元格时通过 get(key) 取出复用
 * 3. 表格销毁/卸载时通过 clear() 批量销毁 + 清空
 *
 * 调用方：
 * - src/views/report/designer/edit-table/utils/CellRenderer.ts（注册 / 获取）
 * - src/views/report/designer/edit-table/chart-widget/class.ts（remove / destroy）
 *
 * 迁移说明：
 * - 保留原 .js 的全部方法
 * - widget 类型声明为带 destroy() 的最小接口
 */
import type ChartWidget from './class'

/**
 * 内部使用的 widget 最小接口（仅声明 destroy 字段，不强制 index signature）
 * - 仅在 manager 文件内部做 cast 时使用，对外不暴露
 */
interface WidgetLike {
  destroy?: () => void
}

/**
 * WidgetManager 泛型接口
 * - 约束为 `T extends object`（不强制 [key: string]: any 的 index signature）
 * - 这样 class 实例类型可以直接作为 T 使用
 */
interface WidgetManager<T extends object> {
  widgets: Record<string, T>
  get(key: string): T | undefined
  set(key: string, widget: T): void
  has(key: string): boolean
  remove(key: string): void
  clear(): void
}

/** ChartWidgetManager 单例对象（类型为带 destroy 的 ChartWidget） */
const chartWidgetManager: WidgetManager<ChartWidget> = {
  widgets: {},

  /**
   * 获取指定 key 的 widget
   * @param key 单元格唯一键（`${row}_${col}`）
   */
  get(key: string): ChartWidget | undefined {
    return this.widgets[key]
  },

  /**
   * 注册 / 替换 widget
   * @param key 单元格唯一键
   * @param widget ChartWidget 实例
   */
  set(key: string, widget: ChartWidget): void {
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
   * - 若 widget 实现 destroy() 则先调用
   * @param key 单元格唯一键
   */
  remove(key: string): void {
    const widget = this.widgets[key]
    if (widget) {
      const w = widget as unknown as WidgetLike
      if (w.destroy) {
        w.destroy()
      }
    }
    delete this.widgets[key]
  },

  /**
   * 批量销毁并清空所有 widget
   * - 表格整体卸载时调用
   */
  clear(): void {
    Object.keys(this.widgets).forEach(key => {
      const widget = this.widgets[key]
      if (widget) {
        const w = widget as unknown as WidgetLike
        if (w.destroy) {
          w.destroy()
        }
      }
    })
    this.widgets = {}
  }
}

export default chartWidgetManager
