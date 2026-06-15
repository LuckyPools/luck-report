/**
 * CrossTabWidget：斜线表（cross tab）单元格的渲染容器
 *
 * 工作流程：
 * 1. CellRenderer 检测到 value.type === 'slash' 时通过 manager 注册 CrossTabWidget
 * 2. 构造时立即调 refreshCell → 在单元格内创建 Vue3 子应用 → 渲染 CrossTabWidgetVue
 * 3. value 变化时通过 refreshCell 重新挂载
 *
 * 调用方：
 * - src/views/report/designer/edit-table/utils/CellRenderer.ts
 * - src/views/report/designer/edit-table/cross-tab-widget/manager.ts
 *
 * 迁移说明：
 * - Vue2 `new Vue({ el, render }).$mount()` 改为 Vue3 `createApp(Comp, props).mount(el)`
 * - vueInstance.$destroy() 改为 app.unmount()
 * - doDraw() 兼容旧调用：保留但内部取子组件的 doDraw() 改用 defineExpose
 */
import { createApp, type App } from 'vue'
import CrossTabWidgetVue from './index.vue'
import TableManager from '../manager'
import type { HandsontableInstance } from '@/types/handsontable'
import type { ReportContext } from '@/types/report-def'

/**
 * CrossTabWidgetVue 组件 props 抽象
 * - extends Record<string, unknown> 是为了满足 vue3 createApp 第二个参数 Data 的 index signature 约束
 */
export interface CrossTabWidgetProps extends Record<string, unknown> {
  context: ReportContext
  rowIndex: number
  colIndex: number
  value: string
}

/**
 * CrossTabWidget 类：包装单个斜线表单元格
 */
export default class CrossTabWidget {
  /** 报表上下文 */
  context: ReportContext
  /** handsontable 实例（来自 TableManager） */
  hot: HandsontableInstance | null
  /** 单元格行索引 */
  rowIndex: number
  /** 单元格列索引 */
  colIndex: number
  /** 斜线表当前值（以 `|` 分隔的斜线文本集合） */
  value: string
  /** Vue3 应用实例 */
  vueInstance: App | null
  /** 挂载容器 DOM */
  container: HTMLElement | null

  /**
   * 构造方法：立即触发首次渲染
   * @param context 报表上下文
   * @param rowIndex 行索引
   * @param colIndex 列索引
   * @param value 斜线值（`|` 分隔）
   */
  constructor(context: ReportContext, rowIndex: number, colIndex: number, value: string) {
    this.context = context
    this.hot = TableManager.get()
    this.rowIndex = rowIndex
    this.colIndex = colIndex
    this.value = value
    this.vueInstance = null
    this.container = null

    this.refreshCell()
  }

  /**
   * 刷新单元格：销毁旧实例 → 创建挂载点 → createApp 启动 Vue3 子应用
   * 注：value 变化时由调用方先赋值 this.value，再调此方法
   */
  refreshCell(): void {
    if (this.vueInstance) {
      this.vueInstance.unmount()
      this.vueInstance = null
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
      this.container = null
    }

    if (!this.hot) {
      console.error('Handsontable instance not available for CrossTabWidget')
      return
    }
    const td = this.hot.getCell(this.rowIndex, this.colIndex)
    if (!td) {
      console.error('Cell DOM not found for CrossTabWidget')
      return
    }

    // 清空单元格内容
    while (td.firstChild) {
      td.removeChild(td.firstChild)
    }

    // 创建容器
    this.container = document.createElement('div')
    td.appendChild(this.container)

    // 启动 Vue3 子应用
    this.vueInstance = createApp(CrossTabWidgetVue, {
      context: this.context,
      rowIndex: this.rowIndex,
      colIndex: this.colIndex,
      value: this.value
    } as CrossTabWidgetProps)
    this.vueInstance.mount(this.container)
  }

  /**
   * 触发子组件重绘
   * - vue3 中通过 defineExpose 暴露的 doDraw() 间接调用
   * - vueInstance.$children 在 vue3 中不再可用，改为通过 provide/inject 或 ref
   * - 此方法为兼容旧调用保留，TS 阶段再考虑收敛
   */
  doDraw(): void {
    // vue3 不再支持 vueInstance.$children，等待 index.vue 迁移到 setup + defineExpose
    // 此处保留空实现，避免破坏旧调用方
  }

  /**
   * 销毁 widget
   * - 释放 Vue3 应用实例
   * - 移除挂载容器
   */
  destroy(): void {
    if (this.vueInstance) {
      this.vueInstance.unmount()
      this.vueInstance = null
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
      this.container = null
    }
  }
}
