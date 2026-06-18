/**
 * 画布预览渲染器
 *
 * 改造要点：
 * 1. 由 render.js + u-xxx 自定义组件 → TSX + ant-design-vue a-xxx
 * 2. 模板字符串形式 <template slot="prepend"> 替换为 a-input 的 prefix/suffix 字符串属性
 * 3. v-model 拆分为 v-model:value / v-model:checked
 * 4. 事件走 onClick、onChange 等（vue3 JSX 写法）
 * 5. h 函数调用使用 ant-design-vue 组件对象（而非字符串 tag）以保证类型与运行期正常
 */
import { defineComponent, h, type VNode } from 'vue'
import {
  Form,
  FormItem,
  Input,
  InputNumber,
  Select,
  SelectOption,
  Radio,
  RadioGroup,
  RadioButton,
  Checkbox,
  CheckboxGroup,
  Switch,
  DatePicker,
  TimePicker,
  Button,
  Row,
  Col
} from 'ant-design-vue'
import dayjs from 'dayjs'
import type { FormField, SelectOption as Option } from './types'
import { makeMap } from './index'

// HTML 原生 attr 白名单（收紧为真正应作为 HTML attr 透传的字段）。
// 之前白名单混入了大量 ant-design-vue 组件 prop（如 type, size, value, name, maxlength, span 等），
// 导致 a-button type=primary / a-input-number step / a-date-picker format 等走 attrs 后失效。
// 现在除真正 HTML attr 与 data-*/aria-* 之外，其余字段一律走 props。
const HTML_NATIVE_ATTRS =
  'class,style,id,title,hidden,role,tabindex,lang,dir,'
  + 'accept,alt,autocomplete,autofocus,cite,cols,colspan,contenteditable,'
  + 'controls,coords,datetime,default,download,for,headers,height,href,'
  + 'hreflang,ismap,label,longdesc,manifest,maxlength,method,multiple,'
  + 'muted,name,novalidate,open,pattern,placeholder,poster,preload,'
  + 'readonly,rel,required,reversed,rows,rowspan,sandbox,scope,selected,'
  + 'shape,src,srcdoc,srclang,srcset,start,target,usemap,width,wrap,'
  + 'crossorigin,decoding,loading,referrerpolicy,sizes,as,color,'
  + 'inputmode,enterkeyhint,autocapitalize,autocorrect,spellcheck'
const isAttrBase = makeMap(HTML_NATIVE_ATTRS)
function isAttr(key: string): boolean {
  return isAttrBase(key) || key.startsWith('data-') || key.startsWith('aria-')
}

/** v-model 形式映射 */
function vModelBind(tag: string): 'value' | 'checked' {
  return tag === 'a-switch' ? 'checked' : 'value'
}

/** ant-design-vue size 映射 */
function aSizeOf(size?: string): string | undefined {
  if (size === 'mini') return 'small'
  if (size === 'medium') return 'middle'
  return size
}

/** tag → ant-design-vue 组件对象（用于 h 函数） */
function componentOf(tag: string) {
  switch (tag) {
    case 'a-form': return Form
    case 'a-form-item': return FormItem
    case 'a-input': return Input
    case 'a-input-number': return InputNumber
    case 'a-select': return Select
    case 'a-select-option': return SelectOption
    case 'a-radio': return Radio
    case 'a-radio-group': return RadioGroup
    case 'a-radio-button': return RadioButton
    case 'a-checkbox': return Checkbox
    case 'a-checkbox-group': return CheckboxGroup
    case 'a-checkbox-button': return Checkbox
    case 'a-switch': return Switch
    case 'a-date-picker': return DatePicker
    case 'a-time-picker': return TimePicker
    case 'a-button': return Button
    case 'a-row': return Row
    case 'a-col': return Col
    default: return undefined
  }
}

/** Vue 3 h 函数类型（使用 any 签名以匹配从 'vue' 导入的 h 重载，避免 self-reference 限制） */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HFunction = (...args: any[]) => VNode

interface ChildBuilder {
  (h: HFunction, conf: FormField, key: string): VNode | VNode[] | null
}

const componentChild: Record<string, Record<string, ChildBuilder>> = {
  'a-button': {
    defaultValue(_h, conf, key) {
      return h('span', null, (conf as Record<string, unknown>)[key] as string)
    }
  },
  'a-input': {
    // prepend/append 已在主循环中映射为 a-input 的 prefix/suffix 字符串属性
  },
  'a-select': {
    options(_h, conf) {
      const list: VNode[] = []
      if (conf.options && Array.isArray(conf.options)) {
        conf.options.forEach((item: Option, index: number) => {
          list.push(
            h(SelectOption, { key: index, value: item.value, disabled: item.disabled }, () => item.label)
          )
        })
      }
      return list
    }
  },
  'a-radio-group': {
    options(_h, conf) {
      const list: VNode[] = []
      if (conf.options && Array.isArray(conf.options)) {
        conf.options.forEach((item: Option, index: number) => {
          if (conf.optionType === 'button') {
            list.push(h(RadioButton, { key: index, value: item.value }, () => item.label))
          } else {
            // border 是 a-radio 上支持的 prop
            list.push(h(Radio, { key: index, value: item.value, border: !!conf.border }, () => item.label))
          }
        })
      }
      return list
    }
  },
  'a-checkbox-group': {
    options(_h, conf) {
      const list: VNode[] = []
      if (conf.options && Array.isArray(conf.options)) {
        conf.options.forEach((item: Option, index: number) => {
          // border 放在 a-checkbox 上，a-checkbox 在 group 内时支持 border 渲染
          list.push(h(Checkbox, { key: index, value: item.value, border: !!conf.border }, () => item.label))
        })
      }
      return list
    }
  }
}

export default defineComponent({
  name: 'SearchFormRender',
  props: {
    conf: {
      type: Object as () => FormField,
      required: true
    }
  },
  setup(props) {
    return () => {
      const confClone: FormField = JSON.parse(JSON.stringify(props.conf))
      // #region debug-point switch-radio-unselectable
      if (confClone.tag === 'a-switch' || confClone.tag === 'a-radio-group') {
        // eslint-disable-next-line no-console
        console.log('[render.tsx][render start]', {
          tag: confClone.tag,
          confDefaultValue: props.conf.defaultValue,
          cloneDefaultValue: confClone.defaultValue,
          confRef: props.conf
        })
      }
      // #endregion debug-point switch-radio-unselectable
      const component = componentOf(confClone.tag)
      if (!component) {
        return h('span', { class: 'render-error' }, `未知组件: ${confClone.tag}`)
      }
      // Vue 3 h 函数的第二个参数直接是 props 对象，不需要分层
      const dataObject: Record<string, unknown> = {}
      const children: VNode[] = []

      // #region debug-point switch-radio-unselectable
      // 在根元素挂 onClick,看 click 事件是否真的到 switch/radio 根节点
      if (confClone.tag === 'a-switch' || confClone.tag === 'a-radio-group') {
        dataObject.onClick = (e: MouseEvent) => {
          // eslint-disable-next-line no-console
          console.log('[render.tsx][root onClick]', {
            tag: confClone.tag,
            target: (e.target as HTMLElement)?.tagName,
            targetClass: (e.target as HTMLElement)?.className,
            currentDefault: (props.conf as Record<string, unknown>).defaultValue
          })
        }
      }
      // #endregion debug-point switch-radio-unselectable

      // 子组件
      const childObjs = componentChild[confClone.tag]
      if (childObjs) {
        Object.keys(childObjs).forEach(key => {
          const childFunc = childObjs[key]
          if (confClone[key]) {
            const res = childFunc(h, confClone, key)
            if (res) {
              if (Array.isArray(res)) children.push(...res)
              else children.push(res)
            }
          }
        })
      }

      Object.keys(confClone).forEach(key => {
        // 这些字段不直接渲染到组件 prop
        if (
          key === 'options' ||
          key === 'children' ||
          key === 'regList' ||
          key === 'vModel' ||
          key === 'tagIcon' ||
          key === '__key' ||
          key === 'formId' ||
          key === 'layout' ||
          key === 'tag' ||
          key === 'document' ||
          key === 'renderKey' ||
          key === 'defaultValue' ||
          key === 'label' ||
          key === 'required' ||
          key === 'valueFormat'
        ) {
          return
        }
        const val = confClone[key]
        if (key === 'prefixIcon' || key === 'prepend') {
          if (val) dataObject.prefix = val
          return
        }
        if (key === 'suffixIcon' || key === 'append') {
          if (val) dataObject.suffix = val
          return
        }
        if (key === 'size') {
          const mapped = aSizeOf(val as string)
          if (mapped) dataObject.size = mapped
          return
        }
        // ---- tag 专属属性映射：config 字段（与后端实体类对齐）→ ant-design-vue prop ----
        // 与 html.ts 代码生成保持一致：config 保留后端字段名，渲染时映射为 a-xxx 真实 prop
        // a-select: multiple→mode, clearable→allowClear, filterable→showSearch
        if (confClone.tag === 'a-select') {
          if (key === 'multiple') {
            if (val) dataObject.mode = 'multiple'
            return
          }
          if (key === 'clearable') {
            if (val) dataObject.allowClear = val
            return
          }
          if (key === 'filterable') {
            if (val) dataObject.showSearch = val
            return
          }
        }
        // a-input: clearable→allowClear, showWordLimit→showCount
        if (confClone.tag === 'a-input') {
          if (key === 'clearable') {
            if (val) dataObject.allowClear = val
            return
          }
          if (key === 'showWordLimit') {
            if (val) dataObject.showCount = val
            return
          }
        }
        // a-date-picker: clearable→allowClear, type→picker（datetime 拆分为 picker=date + showTime）
        // 注意：antd DatePicker 的 allowClear 默认值是 true（与 a-input/a-select 默认 false 不同），
        // 因此 clearable=false 时必须显式传 allowClear=false，否则会被默认值覆盖导致"永远可清空"。
        if (confClone.tag === 'a-date-picker') {
          if (key === 'clearable') {
            dataObject.allowClear = val
            return
          }
          if (key === 'type') {
            if (val === 'datetime') {
              dataObject.picker = 'date'
              dataObject.showTime = true
            } else if (val) {
              dataObject.picker = val
            }
            return
          }
        }
        if (key === 'placeholder' || key === 'clearable' || key === 'readonly' || key === 'maxlength') {
          if (val !== undefined && val !== null && val !== '') {
            dataObject[key] = val
          }
          return
        }
        // disabled：仅当字段自身显式禁用时才传 prop；
        // 为 false 时不传，让组件从父级 a-form 的 disabled 注入继承，
        // 否则会覆盖表单级禁用配置。
        if (key === 'disabled') {
          if (val === true) {
            dataObject.disabled = true
          }
          return
        }
        if (key === 'span') {
          if (val !== 24) dataObject.span = val
          return
        }
        // a-checkbox-group 不直接接受 border（border 在子项上）
        if (confClone.tag === 'a-checkbox-group' && key === 'border') {
          return
        }
        // a-switch 字段重命名（activeText → checked-children 等）
        if (confClone.tag === 'a-switch') {
          if (key === 'activeText' && val) {
            dataObject['checked-children'] = val
            return
          }
          if (key === 'inactiveText' && val) {
            dataObject['un-checked-children'] = val
            return
          }
          if (key === 'activeValue' && val !== undefined) {
            dataObject['checked-value'] = val
            return
          }
          if (key === 'inactiveValue' && val !== undefined) {
            dataObject['un-checked-value'] = val
            return
          }
          if (key === 'activeColor' && val) {
            dataObject['checked-color'] = val
            return
          }
          if (key === 'inactiveColor' && val) {
            dataObject['un-checked-color'] = val
            return
          }
        }
        // 其他属性直接赋值到 dataObject
        if (dataObject[key] !== undefined) {
          dataObject[key] = val
        } else if (!isAttr(key)) {
          dataObject[key] = val
        } else {
          dataObject[key] = val
        }
      })

      // v-model: 双向绑定
      // 关键：必须改写 props.conf.defaultValue（draggable-item 中的 el），而不是 confClone.defaultValue。
      // 否则开关/单选点击后只更新了本渲染函数内的深拷贝，组件内部 checked 状态没真正被外部更新，
      // 下次重渲又被初始值覆盖，导致"点击没反应"。
      // #region debug-point switch-radio-unselectable
      if (confClone.tag === 'a-switch' || confClone.tag === 'a-radio-group') {
        // eslint-disable-next-line no-console
        console.log('[render.tsx][v-model check]', {
          tag: confClone.tag,
          vModel: confClone.vModel,
          hasVModel: confClone.vModel !== undefined,
          confKeys: Object.keys(confClone)
        })
      }
      // #endregion debug-point switch-radio-unselectable
      if (confClone.vModel !== undefined) {
        const vKey = vModelBind(confClone.tag)
        let defaultVal = confClone.defaultValue
        // a-select 多选模式下 value 必须为数组，否则 ant-design-vue 不生效/报错
        if (confClone.tag === 'a-select' && confClone.multiple && !Array.isArray(defaultVal)) {
          defaultVal = defaultVal === undefined || defaultVal === null || defaultVal === ''
            ? []
            : [defaultVal]
        }
        if (confClone.tag === 'a-date-picker' || confClone.tag === 'a-time-picker') {
          const raw = props.conf.defaultValue
          if (raw === undefined || raw === null || raw === '') {
            defaultVal = undefined
          } else if (dayjs.isDayjs(raw)) {
            defaultVal = raw
          } else {
            const fmt = (confClone.format as string) || undefined
            defaultVal = fmt ? dayjs(raw as string, fmt) : dayjs(raw as string)
          }
        }
        dataObject[vKey] = defaultVal
        // Vue 3 h 函数中，事件监听器使用 onUpdate:value 或 onUpdate:checked 格式（带冒号）
        const eventKey = 'onUpdate:' + vKey
        dataObject[eventKey] = (val: unknown) => {
          // #region debug-point switch-radio-unselectable
          if (confClone.tag === 'a-switch' || confClone.tag === 'a-radio-group') {
            // eslint-disable-next-line no-console
            console.log('[render.tsx][update:' + vKey + ']', {
              tag: confClone.tag,
              oldVal: props.conf.defaultValue,
              newVal: val,
              confRef: props.conf
            })
          }
          // #endregion debug-point switch-radio-unselectable
          props.conf.defaultValue = val
        }
        // #region debug-point switch-radio-unselectable
        if (confClone.tag === 'a-switch' || confClone.tag === 'a-radio-group') {
          // eslint-disable-next-line no-console
          console.log('[render.tsx][bind v-model]', {
            tag: confClone.tag,
            vKey,
            eventKey,
            currentDefaultValue: confClone.defaultValue,
            boundPropsKeys: Object.keys(dataObject)
          })
        }
        // #endregion debug-point switch-radio-unselectable
      }

      return h(component, dataObject, children.length ? { default: () => children } : null)
    }
  }
})
