/**
 * messagebox 静态 API 封装（基于 ant-design-vue Modal）
 *
 * 背景：
 * - 原项目 src/components/messagebox/index.vue + instance.ts 自定义实现
 * - 现已迁移到 ant-design-vue，本文件用 antd Modal 函数式 API
 *   重新实现 alert / confirm / prompt，**保持调用方零修改**：
 *     MessageBox.alert(message, title?, options?) => Promise
 *     MessageBox.confirm(message, title?, options?) => Promise
 *     MessageBox.prompt(message, title?, options?) => Promise<string>
 *
 * 调用方：
 * - src/utils/comnon.ts（showAlert / showConfirm）
 * - src/utils/table.ts（其他确认弹窗）
 */
import { Modal, Input } from 'ant-design-vue'
import { createApp, h, ref, type App, type VNode } from 'vue'
import i18n from '@/locales'

/** messagebox 通用选项 */
interface MessageBoxOptions {
  type?: 'alert' | 'confirm' | 'prompt'
  useHTMLString?: boolean
  [key: string]: unknown
}

/** antd Modal.confirm/info 返回的实例句柄类型（精简） */
interface ModalHandle {
  destroy: () => void
}

/** 把字符串或简单 HTML 包装成 vnode（useHTMLString=true 时使用） */
function renderMessage(message: unknown, useHTMLString?: boolean): VNode | string {
  if (useHTMLString && typeof message === 'string') {
    return h('div', { innerHTML: message })
  }
  return String(message ?? '')
}

/** messagebox 静态方法对象（占位，下面逐个挂载静态方法） */
const MessageBox = {
  alert: undefined as unknown as (message: string, title?: string, options?: MessageBoxOptions) => Promise<void>,
  confirm: undefined as unknown as (message: string, title?: string, options?: MessageBoxOptions) => Promise<void>,
  prompt: undefined as unknown as (message: string, title?: string, options?: MessageBoxOptions) => Promise<string>
}

/**
 * 提示弹窗（仅确定按钮）
 * @param message 提示内容
 * @param title 弹窗标题
 * @param options 扩展选项
 * @returns 关闭后的 Promise
 */
MessageBox.alert = function (
  message: string,
  title?: string,
  options?: MessageBoxOptions
): Promise<void> {
  return new Promise<void>((resolve) => {
    const inst: ModalHandle = Modal.info({
      title: title || '',
      content: renderMessage(message, options?.useHTMLString),
      okText: '确定',
      maskClosable: false,
      onOk: () => {
        resolve()
      },
      onCancel: () => {
        resolve()
      }
    }) as unknown as ModalHandle
    // 引用以避免 ESLint 报 no-unused-vars
    void inst
  })
}

/**
 * 确认弹窗（确定 + 取消）
 * @param message 确认内容
 * @param title 弹窗标题
 * @param options 扩展选项
 * @returns 用户选择结果的 Promise（resolve=确认，reject=取消）
 */
MessageBox.confirm = function (
  message: string,
  title?: string,
  options?: MessageBoxOptions
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const inst: ModalHandle = Modal.confirm({
      title: title || '',
      content: renderMessage(message, options?.useHTMLString),
      okText: '确定',
      cancelText: '取消',
      maskClosable: false,
      onOk: () => {
        resolve()
      },
      onCancel: () => {
        reject(new Error('cancel'))
      }
    }) as unknown as ModalHandle
    void inst
  })
}

/**
 * prompt 弹窗（输入框 + 确定/取消）
 * - 动态挂载一个 a-input 节点作为 Modal 内容，提交时取输入值 resolve
 * - 每次调用都创建独立子应用 + 容器，关闭后销毁避免内存泄漏
 */
MessageBox.prompt = function (
  message: string,
  title?: string,
  options?: MessageBoxOptions
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // 输入值用 ref 持有，Modal 关闭时取出来
    const inputValue = ref<string>('')
    const InputComp = Input
    const contentVnode = h('div', [
      h('div', { style: 'margin-bottom: 8px' }, renderMessage(message, options?.useHTMLString)),
      h(InputComp, {
        value: inputValue.value,
        'onUpdate:value': (val: string) => {
          inputValue.value = val
        }
      })
    ])

    let app: App | null = null
    const mountContainer = document.createElement('div')
    document.body.appendChild(mountContainer)
    app = createApp({
      setup() {
        return () => contentVnode
      }
    })
    app.use(i18n)
    app.mount(mountContainer)

    const inst: ModalHandle = Modal.confirm({
      title: title || '',
      content: () => contentVnode,
      okText: '确定',
      cancelText: '取消',
      maskClosable: false,
      onOk: () => {
        const v = inputValue.value
        // 关闭后清理子应用
        if (app) {
          app.unmount()
        }
        if (mountContainer.parentNode) {
          mountContainer.parentNode.removeChild(mountContainer)
        }
        resolve(v)
      },
      onCancel: () => {
        if (app) {
          app.unmount()
        }
        if (mountContainer.parentNode) {
          mountContainer.parentNode.removeChild(mountContainer)
        }
        reject(new Error('cancel'))
      }
    }) as unknown as ModalHandle
    void inst
  })
}

// 默认导出（兼容旧的 default import 用法）
export default MessageBox
