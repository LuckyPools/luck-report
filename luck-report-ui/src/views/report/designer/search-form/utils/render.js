import { makeMap } from './index'

import UCheckbox from "@/components/checkbox/index.vue";
import UCheckboxGroup from "@/components/checkbox-group/index.vue";
import USelect from "@/components/select/index.vue";
import UOption from "@/components/option/index.vue";
import URadioGroup from "@/components/radio-group/index.vue";
import URadio from "@/components/radio/index.vue";
import USwitch from "@/components/switch/index.vue";
import UInput from "@/components/input/index.vue";
import UInputNumber from "@/components/input-number/index.vue";
import UButton from "@/components/button/index.vue"
import UDialog from "@/components/dialog/index.vue";
import UFormItem from "@/components/form-item/index.vue";
import UForm from "@/components/form/index.vue";
import URow from "@/components/row/index.vue";
import UCol from "@/components/col/index.vue";
import UDatePicker from "@/components/date-picker/index.vue";
import UTree from "@/components/tree/index.vue";
import UTabs from "@/components/tabs/index.vue";
import UTabPane from "@/components/tabs/pane.vue";

// 参考https://github.com/vuejs/vue/blob/v2.6.10/src/platforms/web/server/class.js
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

function vModel(self, dataObject, defaultValue) {
  dataObject.props.value = defaultValue

  dataObject.on.input = val => {
    self.$emit('input', val)
  }
}

const componentChild = {
  'u-button': {
    defaultValue(h, conf, key) {
      return conf[key]
    },
  },
  'u-input': {
    prepend(h, conf, key) {
      return <template slot="prepend">{conf[key]}</template>
    },
    append(h, conf, key) {
      return <template slot="append">{conf[key]}</template>
    }
  },
  'u-select': {
    options(h, conf, key) {
      const list = []
      if (conf.options && Array.isArray(conf.options)) {
        conf.options.forEach(item => {
          list.push(<u-option label={item.label} value={item.value} disabled={item.disabled}></u-option>)
        })
      }
      return list
    }
  },
  'u-radio-group': {
    options(h, conf, key) {
      const list = []
      if (conf.options && Array.isArray(conf.options)) {
        conf.options.forEach(item => {
          if (conf.optionType === 'button') list.push(<u-radio-button label={item.value}>{item.label}</u-radio-button>)
          else list.push(<u-radio label={item.value} border={conf.border}>{item.label}</u-radio>)
        })
      }
      return list
    }
  },
  'u-checkbox-group': {
    options(h, conf, key) {
      const list = []
      if (conf.options && Array.isArray(conf.options)) {
        conf.options.forEach(item => {
          if (conf.optionType === 'button') {
            list.push(<u-checkbox-button label={item.value}>{item.label}</u-checkbox-button>)
          } else {
            list.push(<u-checkbox label={item.value} border={conf.border}>{item.label}</u-checkbox>)
          }
        })
      }
      return list
    }
  }
}

export default {
  components: {
    UTabPane,
    UTabs,
    UTree,
    UDatePicker,
    UCol,
    URow,
    UForm,
    UFormItem,
    UDialog,
    USwitch,
    URadioGroup,
    USelect,
    UOption,
    UCheckbox,
    UCheckboxGroup,
    URadio,
    UInput,
    UInputNumber,
    UButton
  },
  render(h) {
    const dataObject = {
      attrs: {},
      props: {},
      on: {},
      style: {}
    }
    const confClone = JSON.parse(JSON.stringify(this.conf))
    const children = []

    const childObjs = componentChild[confClone.tag]
    if (childObjs) {
      Object.keys(childObjs).forEach(key => {
        const childFunc = childObjs[key]
        if (confClone[key]) {
          children.push(childFunc(h, confClone, key))
        }
      })
    }

    Object.keys(confClone).forEach(key => {
      const val = confClone[key]
      if (key === 'vModel') {
        vModel(this, dataObject, confClone.defaultValue)
      } else if (dataObject[key]) {
        dataObject[key] = val
      } else if (!isAttr(key)) {
        dataObject.props[key] = val
      } else {
        dataObject.attrs[key] = val
      }
    })
    return h(this.conf.tag, dataObject, children)
  },
  props: ['conf']
}
