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
import type { FormField, SelectOption as Option } from './types'
import { makeMap } from './index'

// HTML 原生 attr 白名单（参考 Vue 内部 class util），未在该集合中的字段一律走 props
const isAttr = makeMap(
  'accept,accept-charset,accesskey,action,align,alt,async,autocomplete,'
  + 'autofocus,autoplay,autosave,bgcolor,border,buffered,challenge,charset,'
  + 'checked,cite,class,code,codebase,color,cols,colspan,content,http-equiv,'
  + 'name,contenteditable,contextmenu,controls,coords,data,datetime,default,'
  + 'defer,dir,dirname,disabled,download,draggable,dropzone,enctype,method,for,'
  + 'form,formaction,headers,height,hidden,high,href,hreflang,http-equiv,'
  + 'icon,id,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,'
  + 'manifest,max,maxlength,media,method,GET,POST,min,multiple,email,file,'
  + 'muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,'
  + 'preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,'
  + 'scope,scoped,seamless,selected,shape,size,type,text,sizes,span,'
  + 'spellcheck,src,srcdoc,srclang,srcset,start,step,style,summary,tabindex,'
  + 'target,title,type,usemap,value,width,wrap'
)

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
      const component = componentOf(confClone.tag)
      if (!component) {
        return h('span', { class: 'render-error' }, `未知组件: ${confClone.tag}`)
      }
      const dataObject: {
        attrs: Record<string, unknown>
        props: Record<string, unknown>
        on: Record<string, (...args: unknown[]) => void>
        style: Record<string, string | number>
      } = {
        attrs: {},
        props: {},
        on: {},
        style: {}
      }
      const children: VNode[] = []

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
        if (key === 'options' || key === 'children' || key === 'regList' || key === 'vModel' || key === 'tagIcon' || key === '__key' || key === 'formId' || key === 'layout') {
          // 这些字段不直接渲染到组件 prop
          return
        }
        const val = confClone[key]
        if (key === 'prefixIcon' || key === 'prepend') {
          if (val) dataObject.props.prefix = val
          return
        }
        if (key === 'suffixIcon' || key === 'append') {
          if (val) dataObject.props.suffix = val
          return
        }
        if (key === 'size') {
          const mapped = aSizeOf(val as string)
          if (mapped) dataObject.props.size = mapped
          return
        }
        if (key === 'placeholder' || key === 'clearable' || key === 'disabled' || key === 'readonly' || key === 'maxlength') {
          if (val !== undefined && val !== null && val !== '') {
            dataObject.props[key] = val
          }
          return
        }
        if (key === 'span') {
          if (val !== 24) dataObject.props.span = val
          return
        }
        // a-checkbox-group 不直接接受 border（border 在子项上）
        if (confClone.tag === 'a-checkbox-group' && key === 'border') {
          return
        }
        // a-switch 字段重命名（activeText → checked-children 等）
        if (confClone.tag === 'a-switch') {
          if (key === 'activeText' && val) {
            dataObject.props['checked-children'] = val
            return
          }
          if (key === 'inactiveText' && val) {
            dataObject.props['un-checked-children'] = val
            return
          }
          if (key === 'activeValue' && val !== undefined) {
            dataObject.props['checked-value'] = val
            return
          }
          if (key === 'inactiveValue' && val !== undefined) {
            dataObject.props['un-checked-value'] = val
            return
          }
          if (key === 'activeColor' && val) {
            dataObject.props['checked-color'] = val
            return
          }
          if (key === 'inactiveColor' && val) {
            dataObject.props['un-checked-color'] = val
            return
          }
        }
        // a-checkbox-group / a-radio-group 的 border 在组级（checkbox） / 子项级（radio） 透传
        if (!isAttr(key)) {
          dataObject.props[key] = val
        } else {
          dataObject.attrs[key] = val
        }
      })

      // v-model: 双向绑定
      if (confClone.vModel !== undefined) {
        const vKey = vModelBind(confClone.tag)
        dataObject.props[vKey] = confClone.defaultValue
        dataObject.on['update:' + vKey] = (val: unknown) => {
          confClone.defaultValue = val
        }
      }

      return h(component, dataObject, children)
    }
  }
})
