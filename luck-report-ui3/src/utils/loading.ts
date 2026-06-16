/**
 * Loading 服务（基于 ant-design-vue 的 Spin）
 *
 * 背景：原项目使用 src/components/loading/index.vue + instance.ts 创建全屏 Loading。
 * 现已迁移到 ant-design-vue，本文件用 a-spin 重新实现服务式 loading，
 * 保持调用方零修改：
 *   import showLoading from '@/utils/loading'
 *   const loading = showLoading({ text: '加载中...' })
 *   loading.close()
 */
import { createApp, h, ref, type App, type VNode } from 'vue'
import { Spin } from 'ant-design-vue'
import i18n from '@/locales'

/** Loading 服务选项 */
export interface ShowLoadingOptions {
  text?: string
  bgColor?: string
}

/** Loading 服务返回的句柄 */
export interface ShowLoadingHandle {
  close: () => void
}

/** a-spin 包装节点的 DOM 扩展 */
interface LoadingElement extends HTMLElement {
  __app__?: App
}

/**
 * 创建全屏 Loading（基于 a-spin）
 * @param options 文本与背景色
 */
function showLoading(options: ShowLoadingOptions = {}): ShowLoadingHandle {
  const text = options.text || ''
  const bgColor = options.bgColor || ''

  const mountContainer = document.createElement('div') as LoadingElement
  mountContainer.classList.add('u-loading-fullscreen-wrapper')
  Object.assign(mountContainer.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    background: bgColor || 'rgba(255, 255, 255, .8)',
    zIndex: '30000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  })
  document.body.appendChild(mountContainer)
  document.body.classList.add('u-loading-parent')

  // 构造 a-spin vnode，tip 显示文本
  const tipRef = ref<string>(text)
  const spinVNode: VNode = h(Spin, {
    spinning: true,
    tip: tipRef.value,
    size: 'large'
  })

  const app = createApp({
    setup() {
      return () => spinVNode
    }
  })
  app.use(i18n)
  app.mount(mountContainer)
  mountContainer.__app__ = app

  return {
    close: (): void => {
      if (mountContainer.__app__) {
        mountContainer.__app__.unmount()
      }
      if (mountContainer.parentNode) {
        mountContainer.parentNode.removeChild(mountContainer)
      }
      if (document.body.classList.contains('u-loading-parent') && !document.querySelector('.u-loading-fullscreen-wrapper')) {
        document.body.classList.remove('u-loading-parent')
      }
    }
  }
}

export default showLoading
