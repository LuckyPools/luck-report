/**
 * ChartWidget：图表单元格的渲染容器
 *
 * 工作流程：
 * 1. CellRenderer 检测到 value.type === 'chart' 时通过 manager 注册 ChartWidget
 * 2. renderChart 在单元格内创建挂载点 → createApp 启动 vue3 实例 → 渲染 ChartWidgetVue
 * 3. 单元格重绘时 refresh 复用同一实例；卸载时 destroy 释放资源
 *
 * 调用方：
 * - src/views/report/designer/edit-table/utils/CellRenderer.ts
 * - src/views/report/designer/edit-table/chart-widget/manager.ts
 *
 * 迁移说明：
 * - Vue2 `new Vue({ render }).$mount(el)` 改为 Vue3 `createApp(Comp, props).mount(el)`
 * - vueInstance.$destroy() 改为 app.unmount()
 * - window.chartColors 颜色常量保留为全局（原代码已声明）
 */
import { createApp, type App } from 'vue'
import ChartWidgetVue from '@/views/report/designer/edit-table/chart-widget/index.vue'
import chartWidgetManager from './manager'
import type { ReportContext } from '@/types/report-def'

/**
 * ChartWidgetVue 组件 props 抽象（与 .vue 中 props 对应）
 * - extends Record<string, unknown> 是为了满足 vue3 createApp 第二个参数 Data 的 index signature 约束
 */
export interface ChartWidgetProps extends Record<string, unknown> {
  context: ReportContext
  rowIndex: number
  colIndex: number
}

/**
 * ChartWidget 类：包装单个图表单元格
 */
export default class ChartWidget {
  /** 容器 DOM 元素（单元格 td） */
  container: HTMLElement | null
  /** 单元格行索引（0 基） */
  rowIndex: number
  /** 单元格列索引（0 基） */
  colIndex: number
  /** Vue3 应用实例（迁移前是 vue2 vueInstance） */
  vueInstance: App | null

  /**
   * 构造方法
   * @param container 容器元素（单元格 td）
   * @param rowIndex 行索引
   * @param colIndex 列索引
   */
  constructor(container: HTMLElement, rowIndex: number, colIndex: number) {
    this.container = container
    this.rowIndex = rowIndex
    this.colIndex = colIndex
    this.vueInstance = null
  }

  /**
   * 渲染 / 重新渲染图表
   * - 已存在实例时先 unmount + 释放
   * - 在容器内创建挂载点，createApp 启动 Vue3 子应用
   *
   * @param container 容器元素（可选，省略时使用实例内保存的）
   * @param context 报表上下文
   * @param rowIndex 行索引
   * @param colIndex 列索引
   */
  renderChart(container: HTMLElement | null, context: ReportContext, rowIndex: number, colIndex: number): void {
    if (container) {
      this.container = container
    }

    // 容器不存在则放弃（不抛错，避免渲染雪崩）
    if (!this.container) {
      console.error('Container element not provided for ChartWidget')
      return
    }

    // 销毁旧 Vue3 实例
    if (this.vueInstance) {
      this.vueInstance.unmount()
      this.vueInstance = null
    }

    // 清空容器内容
    this.container.innerHTML = ''

    // 创建挂载点
    const mountPoint = document.createElement('div')
    mountPoint.className = 'test'
    this.container.appendChild(mountPoint)

    // Vue3 createApp 启动子应用
    this.vueInstance = createApp(ChartWidgetVue, {
      context,
      rowIndex,
      colIndex
    } as ChartWidgetProps)
    this.vueInstance.mount(mountPoint)
  }

  /**
   * 刷新：复用同容器 + 当前行/列重新渲染
   * @param context 报表上下文
   */
  refresh(context: ReportContext): void {
    this.renderChart(this.container, context, this.rowIndex, this.colIndex)
  }

  /**
   * 销毁 widget
   * - 释放 Vue3 应用实例
   * - 从 manager 中移除
   */
  destroy(): void {
    if (this.vueInstance) {
      this.vueInstance.unmount()
      this.vueInstance = null
    }
    if (this.rowIndex !== undefined && this.colIndex !== undefined) {
      const widgetKey = `${this.rowIndex}_${this.colIndex}`
      chartWidgetManager.remove(widgetKey)
    }
  }
}

/**
 * 全局 chart 颜色映射（原代码挂在 window 上，所有 chart 实例共享）
 * - 后续可考虑改为 ES Module 导出，但保持全局便于与 chart.js / raphael 等直接对接
 */
declare global {
  interface Window {
    chartColors: Record<string, string>
  }
}
window.chartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
}
