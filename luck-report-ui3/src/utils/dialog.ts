/**
 * createDialogApp：动态挂载 Vue3 对话框组件的辅助方法
 *
 * 工作流程：
 * 1. 创建独立的 div 容器 → 挂到 body
 * 2. createApp 启动子应用，把 props 传给组件
 * 3. 返回 { app, instance, el, unmount } 供调用方使用
 *
 * 调用方：
 * - src/views/report/designer/edit-table/row-col-number-dialog/class.ts
 * - src/views/report/designer/edit-table/row-col-width-height-dialog/class.ts
 *
 * 迁移说明：
 * - Vue2 `Vue.extend(Comp).$mount()` 改为 Vue3 `createApp(Comp, props).mount(el)`
 * - 返回的 unmount() 同时卸载 Vue3 应用 + 移除 DOM 容器
 * - 子 app 必须重新 app.use(i18n) / app.use(Antd)，
 *   否则 dialog setup 中 useI18n() 会报
 *   "Need to install with `app.use` function"，
 *   a-modal / a-form 等组件也会因未注册而不可用
 */
import { createApp, type App, type Component, type ComponentPublicInstance } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import { i18n } from '@/locales'

/** createDialogApp 返回值 */
export interface DialogAppHandle<P extends Record<string, unknown>> {
  /** Vue3 子应用实例 */
  app: App
  /** 组件实例（通过 mount 返回的代理） */
  instance: ComponentPublicInstance<P>
  /** 挂载容器 DOM */
  el: HTMLElement
  /** 卸载 Vue3 应用并从 body 移除容器 */
  unmount: () => void
}

/**
 * 创建一个独立的 Vue3 对话框应用
 *
 * @param Comp 对话框组件（带 props 推断）
 * @param props 传给对话框组件的 props
 * @returns 对话框句柄（含 app / instance / el / unmount）
 */
export function createDialogApp<P extends Record<string, unknown>>(
  Comp: Component,
  props: P
): DialogAppHandle<P> {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const app = createApp(Comp, props)
  // 子 app 与主 app 互相独立，必须显式注册依赖，否则：
  // - setup 中 useI18n() 抛 "Need to install with `app.use` function"
  // - a-modal / a-form / a-input-number / a-button 等组件因未注册而失败
  app.use(i18n)
  app.use(Antd)
  const instance = app.mount(el) as ComponentPublicInstance<P>
  return {
    app,
    instance,
    el,
    unmount: (): void => {
      app.unmount()
      if (el.parentNode) {
        el.parentNode.removeChild(el)
      }
    }
  }
}
