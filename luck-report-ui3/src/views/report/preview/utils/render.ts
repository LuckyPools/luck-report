/**
 * 预览页面渲染工具
 *
 * 改造要点：
 * 1. 由 render.js 改造为 render.ts；显式标注入参/返回值类型
 * 2. Vue2 `new Vue({...}).$mount(node)` 改为 Vue3 `createApp(wrapper).mount(node)`
 *    其中 wrapper 是通过 h(componentDef, listeners) 生成的渲染函数组件
 *    这样可以拦截子组件 emit 的 `on-submit` 等事件，转发到全局 emitter
 * 3. 旧版 u-xxx 自定义组件全部替换为 ant-design-vue a-xxx（以全局注册方式提供）
 * 4. 暴露 unmount / $destroy 方法用于在 search-box 销毁子实例时调用
 */
import { createApp, defineComponent, h, type App, type Component } from 'vue'
import {
  Modal,
  Input,
  InputNumber,
  Select,
  Radio,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  Switch,
  Button,
  Form,
  FormItem,
  Row,
  Col,
  DatePicker,
  Tree,
  Tabs,
  TabPane,
  Divider,
  Tag
} from 'ant-design-vue'
import emitter from '@/utils/emitter'
import { getUrlQueryString } from '@/utils/url'
import { i18n } from '@/locales'

/** 简化对象方法入参 */
type SimplifyInput = unknown

/**
 * 构建 URL 查询参数（合并 searchFormParameters）
 * - 解析当前 URL 的 query 字符串为对象
 * - 将 searchFormParameters 中的非空值合并进去
 * - 排除 token 参数（token 应通过 X-Access-Token header 传递，不应作为请求参数）
 * - 重新拼装为 `?key=value&k2=v2` 形式返回
 * @param searchFormParameters 表单提交的参数（值空将不覆盖已有值）
 * @returns 形如 `?a=1&b=2` 的字符串
 */
export function buildLocationSearchParameters(
  searchFormParameters: Record<string, unknown> | null | undefined
): string {
  let urlParameters = getUrlQueryString()
  const parameters: Record<string, string> = {}
  const pairs = urlParameters.split('&')
  // 排除 token 参数，token 应通过 header 传递
  const excludeKeys = ['token', 'X-Access-Token']
  for (let i = 0; i < pairs.length; i++) {
    const item = pairs[i]
    if (item === '') {
      continue
    }
    const param = item.split('=')
    // 排除 token 相关参数
    if (!excludeKeys.includes(param[0])) {
      parameters[param[0]] = param[1]
    }
  }
  if (searchFormParameters) {
    for (const key in searchFormParameters) {
      const value = searchFormParameters[key]
      if (value && !excludeKeys.includes(key)) {
        parameters[key] = String(value)
      }
    }
  }
  let p = '?'
  for (const key in parameters) {
    if (p === '?') {
      p += key + '=' + parameters[key]
    } else {
      p += '&' + key + '=' + parameters[key]
    }
  }
  return p
}

/** a-xxx 组件到 ant-design-vue 组件对象的映射，用于动态模板内的 tag 解析 */
const aComponents: Record<string, Component> = {
  'a-modal': Modal,
  'a-input': Input,
  'a-input-number': InputNumber,
  'a-select': Select,
  'a-option': Select.Option,
  'a-select-option': Select.Option,
  'a-radio': Radio,
  'a-radio-group': RadioGroup,
  'a-checkbox': Checkbox,
  'a-checkbox-group': CheckboxGroup,
  'a-switch': Switch,
  'a-button': Button,
  'a-button-group': Button.Group,
  'a-form': Form,
  'a-form-item': FormItem,
  'a-row': Row,
  'a-col': Col,
  'a-date-picker': DatePicker,
  'a-tree': Tree,
  'a-tree-node': Tree.TreeNode,
  'a-tabs': Tabs,
  'a-tab-pane': TabPane,
  'a-divider': Divider,
  'a-tag': Tag
}

/** 解析后的组件配置 */
interface ParsedComponentOptions {
  template: string
  data?: () => Record<string, unknown>
  methods?: Record<string, (...args: unknown[]) => unknown>
  components?: Record<string, Component>
  [key: string]: unknown
}

/** 暴露给外部的预览组件实例句柄 */
export interface PreviewRenderInstance {
  /** Vue3 组件实例（proxy） */
  instance: Record<string, unknown> | null
  /** ant-design-vue app 实例，用于显式销毁 */
  app: App | null
  /** Vue3 标准卸载方法 */
  unmount(): void
  /** 兼容旧代码中的 $destroy 调用 */
  $destroy(): void
}

/**
 * 简化对象结构
 * 将包含 { value: xxx } 单属性的对象递归扁平化为直接值，
 * 处理数组中同类结构的元素，空对象转为空字符串
 * @param obj 待简化的值，可以是对象、数组或基本类型
 * @returns 简化后的值
 */
export function simplifyObject(obj: SimplifyInput): SimplifyInput {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => simplifyObject(item))
  }

  const result: Record<string, unknown> = {}
  for (const key in obj as Record<string, unknown>) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as Record<string, unknown>)[key]
      if (typeof value === 'object' && value !== null) {
        const v = value as Record<string, unknown> & unknown[]
        if (
          Object.prototype.hasOwnProperty.call(v, 'value') &&
          Object.keys(v).length === 1
        ) {
          result[key] = v.value
        } else if (
          Array.isArray(v) &&
          v.length > 0 &&
          v.every(
            (item) =>
              typeof item === 'object' &&
              item !== null &&
              Object.prototype.hasOwnProperty.call(item, 'value') &&
              Object.keys(item as object).length === 1
          )
        ) {
          result[key] = v.map((item) => simplifyObject((item as Record<string, unknown>).value))
        } else if (Array.isArray(v)) {
          result[key] = v.map((item) => simplifyObject(item))
        } else if (Object.keys(v).length === 0) {
          result[key] = ''
        } else {
          result[key] = simplifyObject(value)
        }
      } else {
        result[key] = value
      }
    }
  }
  return result
}

/**
 * 解析组件字符串为 Vue3 组件配置
 * - 抽取 <template> 主体
 * - 抽取 <script> 主体，移除 import 和 export default，再以 new Function 还原出对象
 * - 合并 template + script 解析结果
 * @param componentStr 完整的 Vue 组件字符串
 * @returns 解析后的组件配置
 */
function parseComponentStr(componentStr: string): ParsedComponentOptions | null {
  const templateMatch = componentStr.match(/<template[^>]*>([\s\S]*?)<\/template>/)
  const scriptMatch = componentStr.match(/<script[^>]*>([\s\S]*?)<\/script>/)

  if (!templateMatch) {
    console.error('组件字符串中未找到template部分')
    return null
  }

  const template = templateMatch[1].trim()
  const componentOptions: ParsedComponentOptions = {
    template,
    components: { ...aComponents }
  }

  if (scriptMatch) {
    try {
      const scriptContent = scriptMatch[1].trim()
      const cleanedScript = scriptContent
        .replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '')
        .replace(/export\s+default\s+/, '')

      const importFunction = new Function(`return ${cleanedScript}`)
      const scriptResult = importFunction() as ParsedComponentOptions

      if (scriptResult.data && typeof scriptResult.data === 'function') {
        const originalData =
          (componentOptions.data as (() => Record<string, unknown>) | undefined) ||
          (() => ({}))
        componentOptions.data = function (this: unknown) {
          return Object.assign(
            {},
            originalData.call(this),
            (scriptResult.data as (...args: unknown[]) => Record<string, unknown>).call(this)
          )
        }
      }

      if (scriptResult.methods) {
        componentOptions.methods = Object.assign(
          {},
          componentOptions.methods || {},
          scriptResult.methods as Record<string, (...args: unknown[]) => unknown>
        )
      }

      for (const key in scriptResult) {
        if (!['data', 'methods', 'components'].includes(key)) {
          componentOptions[key] = (scriptResult as Record<string, unknown>)[key]
        }
      }
    } catch (error) {
      console.error('解析组件script部分时出错:', error)
    }
  }

  return componentOptions
}

/**
 * 将完整的Vue组件字符串渲染为Vue组件并挂载到指定节点（Vue3 createApp 实现）
 * - 通过外层包装组件的 h(componentDef, listeners) 拦截 on-submit 等事件
 * - 事件会同时转发到全局 emitter，search-box 即可通过 emitter.on('search-form:on-submit', ...) 接收
 * @param componentStr 完整的Vue组件字符串，包含template、script和style部分
 * @param mountNode 挂载节点，可以是DOM元素或选择器字符串
 * @returns 返回的实例句柄（包含 unmount / $destroy）
 */
export function renderTemplateToComponent(
  componentStr: string,
  mountNode: HTMLElement | string
): PreviewRenderInstance | null {
  let node: HTMLElement | null = mountNode as HTMLElement
  if (typeof mountNode === 'string') {
    node = document.querySelector(mountNode) as HTMLElement | null
    if (!node) {
      console.error(`找不到挂载节点: ${mountNode}`)
      return null
    }
  }

  const componentOptions = parseComponentStr(componentStr)
  if (!componentOptions) {
    return null
  }

  // 子组件本体（仍然支持 Options API 写法，包括 this.$emit）
  const componentDef = defineComponent({
    ...componentOptions,
    components: {
      ...(componentOptions.components || {})
    }
  })

  // 外层包装：使用渲染函数 + 显式监听器拦截 emit
  const wrapper = defineComponent({
    name: 'PreviewFormWrapper',
    setup() {
      return () => {
        const listeners: Record<string, (...args: unknown[]) => void> = {
          onOnSubmit: (...args: unknown[]) => {
            emitter.emit('search-form:on-submit', ...args)
          }
        }
        return h(componentDef, listeners)
      }
    }
  })

  const app: App = createApp(wrapper)
  app.use(i18n)

  // 挂载
  const proxy = app.mount(node)

  const handle: PreviewRenderInstance = {
    instance: (proxy as unknown as Record<string, unknown>) || null,
    app,
    unmount() {
      try {
        app.unmount()
      } catch (e) {
        console.error('卸载预览组件失败:', e)
      }
      handle.app = null
      handle.instance = null
    },
    $destroy() {
      handle.unmount()
    }
  }
  return handle
}
