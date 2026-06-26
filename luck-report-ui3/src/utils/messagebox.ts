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
import { Modal, Input, Button } from 'ant-design-vue'
import { createApp, h, ref, type App, type CSSProperties, type VNode } from 'vue'
import i18n from '@/locales'

/** messagebox 通用选项 */
interface MessageBoxOptions {
  type?: 'alert' | 'confirm' | 'prompt'
  useHTMLString?: boolean
  okText?: string
  cancelText?: string
  closable?: boolean
  /** 是否垂直居中，默认 true；当指定 top 时自动失效 */
  centered?: boolean
  /** 距离顶部的高度，如 '100px' / '20vh' / 80（数字按 px 处理）；不传则居中 */
  top?: string | number
  [key: string]: unknown
}

/** 把字符串或简单 HTML 包装成 vnode（useHTMLString=true 时使用） */
function renderMessage(message: unknown, useHTMLString?: boolean): VNode | string {
  if (useHTMLString && typeof message === 'string') {
    return h('div', { innerHTML: message })
  }
  return String(message ?? '')
}

/**
 * 解析定位选项
 * - 默认垂直居中（centered=true）
 * - 指定 top 时：转成 style.top，并自动关闭 centered
 * - top 接受 '100px' / '20vh' 等任意 CSS 长度值，数字按 px 处理
 */
function resolvePositioning(options?: MessageBoxOptions): { centered: boolean; style?: CSSProperties } {
  const hasCustomTop =
    options?.top !== undefined && options?.top !== null && options?.top !== ''
  const topValue = hasCustomTop
    ? typeof options?.top === 'number'
      ? `${options.top}px`
      : String(options!.top)
    : undefined
  return {
    centered: hasCustomTop ? false : options?.centered ?? true,
    style: topValue ? { top: topValue } : undefined
  }
}

/** messagebox 静态方法对象（占位，下面逐个挂载静态方法） */
const MessageBox = {
  alert: undefined as unknown as (message: string, title?: string, options?: MessageBoxOptions) => Promise<void>,
  confirm: undefined as unknown as (message: string, title?: string, options?: MessageBoxOptions) => Promise<void>,
  prompt: undefined as unknown as (message: string, title?: string, options?: MessageBoxOptions) => Promise<string>
}

/**
 * 提示弹窗（带主题色 header + 关闭按钮，与全局 a-modal 样式一致）
 *
 * 不再使用 antd 的 Modal.info() 函数式 API，因为该 API 会把 title
 * 与 info 图标一起渲染在 body 内，无法渲染独立 header。
 * 这里临时挂载一个 a-modal 组件实例，让 common/index.css 中
 * .ant-modal-header 的主题色样式自然生效。
 *
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
    const mountContainer = document.createElement('div')
    document.body.appendChild(mountContainer)
    const positioning = resolvePositioning(options)

    let app: App | null = null
    const handleClose = (): void => {
      if (app) {
        app.unmount()
        app = null
      }
      if (mountContainer.parentNode) {
        mountContainer.parentNode.removeChild(mountContainer)
      }
      resolve()
    }

    app = createApp({
      setup() {
        const visible = ref(true)
        return () =>
          h(
            Modal,
            {
              open: visible.value,
              title: title || '',
              closable: options?.closable !== false,
              maskClosable: false,
              width: 416,
              centered: positioning.centered,
              style: positioning.style,
              'onUpdate:open': (val: boolean) => {
                if (!val) handleClose()
              },
              onCancel: handleClose,
              onOk: handleClose
            },
            {
              default: () => renderMessage(message, options?.useHTMLString),
              footer: () =>
                h('div', { style: 'text-align: right' }, [
                  h(
                    Button,
                    { type: 'primary', onClick: handleClose },
                    { default: () => options?.okText || '确定' }
                  )
                ])
            }
          )
      }
    })
    app.use(i18n)
    app.mount(mountContainer)
  })
}

/**
 * 确认弹窗（带主题色 header + 确定 / 取消，与全局 a-modal 样式一致）
 *
 * 与 MessageBox.alert 同样的实现思路：临时挂载 a-modal 组件，
 * footer 自定义两个按钮，点 OK resolve，点取消/× reject。
 *
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
    const mountContainer = document.createElement('div')
    document.body.appendChild(mountContainer)
    const positioning = resolvePositioning(options)

    let app: App | null = null
    const cleanup = (): void => {
      if (app) {
        app.unmount()
        app = null
      }
      if (mountContainer.parentNode) {
        mountContainer.parentNode.removeChild(mountContainer)
      }
    }
    const handleOk = (): void => {
      cleanup()
      resolve()
    }
    const handleCancel = (): void => {
      cleanup()
      reject(new Error('cancel'))
    }

    app = createApp({
      setup() {
        const visible = ref(true)
        return () =>
          h(
            Modal,
            {
              open: visible.value,
              title: title || '',
              closable: options?.closable !== false,
              maskClosable: false,
              width: 416,
              centered: positioning.centered,
              style: positioning.style,
              'onUpdate:open': (val: boolean) => {
                if (!val) handleCancel()
              },
              onCancel: handleCancel,
              onOk: handleOk
            },
            {
              default: () => renderMessage(message, options?.useHTMLString),
              footer: () =>
                h('div', { style: 'text-align: right' }, [
                  h(
                    Button,
                    { onClick: handleCancel },
                    { default: () => options?.cancelText || '取消' }
                  ),
                  h(
                    Button,
                    {
                      type: 'primary',
                      onClick: handleOk,
                      style: 'margin-left: 8px'
                    },
                    { default: () => options?.okText || '确定' }
                  )
                ])
            }
          )
      }
    })
    app.use(i18n)
    app.mount(mountContainer)
  })
}

/**
 * prompt 弹窗（带主题色 header + 输入框 + 确定 / 取消，与全局 a-modal 样式一致）
 *
 * 与 MessageBox.alert / confirm 同样的实现思路：临时挂载 a-modal 组件，
 * 默认插槽内渲染 a-input 节点，提交时取输入值 resolve。
 *
 * @param message 输入框上方提示
 * @param title 弹窗标题
 * @param options 扩展选项
 * @returns 用户输入内容的 Promise（resolve=提交，reject=取消）
 */
MessageBox.prompt = function (
  message: string,
  title?: string,
  options?: MessageBoxOptions
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const inputValue = ref<string>('')
    const mountContainer = document.createElement('div')
    document.body.appendChild(mountContainer)
    const positioning = resolvePositioning(options)

    let app: App | null = null
    const cleanup = (): void => {
      if (app) {
        app.unmount()
        app = null
      }
      if (mountContainer.parentNode) {
        mountContainer.parentNode.removeChild(mountContainer)
      }
    }
    const handleOk = (): void => {
      const v = inputValue.value
      cleanup()
      resolve(v)
    }
    const handleCancel = (): void => {
      cleanup()
      reject(new Error('cancel'))
    }

    app = createApp({
      setup() {
        const visible = ref(true)
        return () =>
          h(
            Modal,
            {
              open: visible.value,
              title: title || '',
              closable: options?.closable !== false,
              maskClosable: false,
              width: 416,
              centered: positioning.centered,
              style: positioning.style,
              'onUpdate:open': (val: boolean) => {
                if (!val) handleCancel()
              },
              onCancel: handleCancel,
              onOk: handleOk
            },
            {
              default: () =>
                h('div', [
                  h(
                    'div',
                    { style: 'margin-bottom: 8px' },
                    renderMessage(message, options?.useHTMLString)
                  ),
                  h(Input, {
                    value: inputValue.value,
                    'onUpdate:value': (val: string) => {
                      inputValue.value = val
                    }
                  })
                ]),
              footer: () =>
                h('div', { style: 'text-align: right' }, [
                  h(
                    Button,
                    { onClick: handleCancel },
                    { default: () => options?.cancelText || '取消' }
                  ),
                  h(
                    Button,
                    {
                      type: 'primary',
                      onClick: handleOk,
                      style: 'margin-left: 8px'
                    },
                    { default: () => options?.okText || '确定' }
                  )
                ])
            }
          )
      }
    })
    app.use(i18n)
    app.mount(mountContainer)
  })
}

// 默认导出（兼容旧的 default import 用法）
export default MessageBox
