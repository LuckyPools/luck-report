import { trigger } from './config'

let confGlobal
let someSpanIsNot24

export function dialogWrapper(str) {
  return `<u-dialog v-bind="$attrs" v-on="$listeners" @open="onOpen" @close="onClose" :title="$t('searchForm.dialogTitle')">
    ${str}
    <div slot="footer">
      <u-button @click="close">{{ $t('searchForm.cancel') }}</u-button>
      <u-button type="primary" @click="handleConfirm">{{ $t('searchForm.confirm') }}</u-button>
    </div>
  </u-dialog>`
}

export function vueTemplate(str) {
  return `<template>
    <div>
      ${str}
    </div>
  </template>`
}

export function vueScript(str) {
  return `<script>
    ${str}
  </script>`
}

export function cssStyle(cssStr) {
  return `<style>
    ${cssStr}
  </style>`
}

function buildFormTemplate(conf, child, type) {
  let labelPosition = ''
  if (conf.labelPosition !== 'right') {
    labelPosition = `labelPosition="${conf.labelPosition}"`
  }
  const disabled = conf.disabled ? `:disabled="${conf.disabled}"` : ''
  let str = `<u-form ref="${conf.formRef}" :model="${conf.formModel}" :rules="${conf.formRules}" size="${conf.size}" ${disabled} :label-width="${conf.labelWidth}" ${labelPosition}>
      ${child}
      ${buildFromBtns(conf, type)}
    </u-form>`
  if (someSpanIsNot24) {
    str = `<u-row :gutter="${conf.gutter}">
        ${str}
      </u-row>`
  }
  return str
}

function buildFromBtns(conf, type) {
  let str = ''
  if (conf.formBtns && type === 'file') {
    str = `
        <u-row>
          <u-form-item>
            <u-button type="info"  @click.prevent="resetForm" style="display: inline-flex; align-items: center; justify-content: center;">
                <i class="iconfont icon-refresh"></i>
                <span style="margin-left: 4px">{{ $t('searchForm.reset') }}</span>  
            </u-button>
            <u-button type="primary" @click.prevent="submitForm" style="margin-left: 5px; display: inline-flex; align-items: center; justify-content: center;">
                <i class="iconfont icon-search"></i>
                <span style="margin-left: 4px">{{ $t('searchForm.search') }}</span>
            </u-button>
          </u-form-item>
        </u-row>
    `
    if (someSpanIsNot24) {
      str = `<u-col :span="24">
          ${str}
        </u-col>`
    }
  }
  return str
}

// span不为24的用u-col包裹
function colWrapper(element, str) {
  if (someSpanIsNot24 || element.span !== 24) {
    return `<u-col :span="${element.span}">
      ${str}
    </u-col>`
  }
  return str
}

const layouts = {
  colFormItem(element) {
    let labelWidth = ''
    if (element.labelWidth && element.labelWidth !== confGlobal.labelWidth) {
      labelWidth = `:label-width="${element.labelWidth}"`
    }
    const required = !trigger[element.tag] && element.required ? 'required' : ''
    const tagDom = tags[element.tag] ? tags[element.tag](element) : null
    let str = `<u-form-item ${labelWidth} label="${element.label}" prop="${element.vModel}" ${required}>
        ${tagDom}
      </u-form-item>`
    str = colWrapper(element, str)
    return str
  },
  rowFormItem(element) {
    const type = element.type === 'default' ? '' : `type="${element.type}"`
    const justify = element.type === 'default' ? '' : `justify="${element.justify}"`
    const align = element.type === 'default' ? '' : `align="${element.align}"`
    const gutter = element.gutter ? `:gutter="${element.gutter}"` : ''
    const children = element.children && Array.isArray(element.children) ? element.children.map(el => layouts[el.layout](el)) : []
    let str = `<u-row ${type} ${justify} ${align} ${gutter}>
      ${children.join('\n')}
    </u-row>`
    str = colWrapper(element, str)
    return str
  }
}

const tags = {
  'u-button': el => {
    const {
      tag
    } = attrBuilder(el)
    const type = el.type ? `type="${el.type}"` : ''
    const icon = el.icon ? `icon="${el.icon}"` : ''
    const size = el.size ? `size="${el.size}"` : ''
    let child = buildElButtonChild(el)

    if (child) child = `\n${child}\n` // 换行
    return `<${el.tag} ${type} ${icon} ${size}>${child}</${el.tag}>`
  },
  'u-input': el => {
    const {
      vModel, clearable, placeholder, width
    } = attrBuilder(el)
    const maxlength = el.maxlength ? `:maxlength="${el.maxlength}"` : ''
    const showWordLimit = el['showWordLimit'] ? 'showWordLimit' : ''
    const prefixIcon = el['prefixIcon'] ? `prefixIcon='${el['prefixIcon']}'` : ''
    const suffixIcon = el['suffixIcon'] ? `suffixIcon='${el['suffixIcon']}'` : ''
    const type = el.type ? `type="${el.type}"` : ''
    let child = buildElInputChild(el)

    if (child) child = `\n${child}\n` // 换行
    return `<${el.tag} ${vModel} ${type} ${placeholder} ${maxlength} ${showWordLimit} ${clearable} ${prefixIcon} ${suffixIcon} ${width}>${child}</${el.tag}>`
  },
  'u-input-number': el => {
    const { vModel, placeholder } = attrBuilder(el)
    const controlsPosition = el['controlsPosition'] ? `controlsPosition=${el['controlsPosition']}` : ''
    const min = el.min ? `:min='${el.min}'` : ''
    const max = el.max ? `:max='${el.max}'` : ''
    const step = el.step ? `:step='${el.step}'` : ''
    const stepStrictly = el['stepStrictly'] ? 'stepStrictly' : ''
    const precision = el.precision ? `:precision='${el.precision}'` : ''

    return `<${el.tag} ${vModel} ${placeholder} ${step} ${stepStrictly} ${precision} ${controlsPosition} ${min} ${max}></${el.tag}>`
  },
  'u-select': el => {
    const {
      vModel, clearable, placeholder, width
    } = attrBuilder(el)
    const filterable = el.filterable ? 'filterable' : ''
    const multiple = el.multiple ? 'multiple' : ''
    // 数据集来源：级联刷新期间展示 loading
    const loading = el.optionSource === 'dataset' ? `:loading="!!dsLoading['${el.vModel}']"` : ''
    let child = buildElSelectChild(el)

    if (child) child = `\n${child}\n` // 换行
    return `<${el.tag} ${vModel} ${placeholder} ${multiple} ${filterable} ${clearable} ${width} ${loading}>${child}</${el.tag}>`
  },
  'u-radio-group': el => {
    const { vModel } = attrBuilder(el)
    const size = `size="${el.size}"`
    let child = buildElRadioGroupChild(el)

    if (child) child = `\n${child}\n` // 换行
    return `<${el.tag} ${vModel} ${size}>${child}</${el.tag}>`
  },
  'u-checkbox-group': el => {
    const { vModel } = attrBuilder(el)
    const size = `size="${el.size}"`
    const min = el.min ? `:min="${el.min}"` : ''
    const max = el.max ? `:max="${el.max}"` : ''
    let child = buildElCheckboxGroupChild(el)

    if (child) child = `\n${child}\n` // 换行
    return `<${el.tag} ${vModel} ${min} ${max} ${size}>${child}</${el.tag}>`
  },
  'u-switch': el => {
    const { vModel } = attrBuilder(el)
    const activeText = el['activeText'] ? `activeText="${el['activeText']}"` : ''
    const inactiveText = el['inactiveText'] ? `inactiveText="${el['inactiveText']}"` : ''
    const activeColor = el['activeColor'] ? `activeColor="${el['activeColor']}"` : ''
    const inactiveColor = el['inactiveColor'] ? `inactiveColor="${el['inactiveColor']}"` : ''
    const activeValue = el['activeValue'] !== true ? `:activeValue='${JSON.stringify(el['activeValue'])}'` : ''
    const inactiveValue = el['inactiveValue'] !== false ? `:inactiveValue='${JSON.stringify(el['inactiveValue'])}'` : ''

    return `<${el.tag} ${vModel} ${activeText} ${inactiveText} ${activeColor} ${inactiveColor} ${activeValue} ${inactiveValue}></${el.tag}>`
  },
  'u-cascader': el => {
    const {
      vModel, clearable, placeholder, width
    } = attrBuilder(el)
    const options = el.options ? `:options="${el.vModel}Options"` : ''
    const props = el.props ? `:props="${el.vModel}Props"` : ''
    const showAllLevels = el['show-all-levels'] ? '' : ':show-all-levels="false"'
    const filterable = el.filterable ? 'filterable' : ''
    const separator = el.separator === '/' ? '' : `separator="${el.separator}"`

    return `<${el.tag} ${vModel} ${options} ${props} ${width} ${showAllLevels} ${placeholder} ${separator} ${filterable} ${clearable}></${el.tag}>`
  },

  'u-date-picker': el => {
    const {
      vModel, clearable, placeholder, width
    } = attrBuilder(el)
    const startPlaceholder = el['start-placeholder'] ? `start-placeholder="${el['start-placeholder']}"` : ''
    const endPlaceholder = el['end-placeholder'] ? `end-placeholder="${el['end-placeholder']}"` : ''
    const rangeSeparator = el['range-separator'] ? `range-separator="${el['range-separator']}"` : ''
    const format = el.format ? `format="${el.format}"` : ''
    const valueFormat = el['valueFormat'] ? `valueFormat="${el['valueFormat']}"` : ''
    const type = el.type === 'date' ? '' : `type="${el.type}"`

    return `<${el.tag} ${type} ${vModel} ${format} ${valueFormat} ${width} ${placeholder} ${startPlaceholder} ${endPlaceholder} ${rangeSeparator} ${clearable}></${el.tag}>`
  },


}

function attrBuilder(el) {
  return {
    vModel: `v-model="${confGlobal.formModel}.${el.vModel}"`,
    clearable: el.clearable ? 'clearable' : '',
    placeholder: el.placeholder ? `placeholder="${el.placeholder}"` : '',
    width: el.style && el.style.width ? ':style="{width: \'100%\'}"' : ''
  }
}

// u-buttin 子级
function buildElButtonChild(conf) {
  const children = []
  if (conf.default) {
    children.push(conf.default)
  }
  return children.join('\n')
}

// u-input innerHTML
function buildElInputChild(conf) {
  const children = []
  if (conf.prepend) {
    children.push(`<span slot="prepend">${conf.prepend}</span>`)
  }
  if (conf.append) {
    children.push(`<span slot="append">${conf.append}</span>`)
  }
  return children.join('\n')
}

function buildElSelectChild(conf) {
  const children = []
  // 数据集来源：初始 options 为空也生成渲染入口，供运行时注入选项
  if ((conf.options && conf.options.length) || conf.optionSource === 'dataset') {
    children.push(`<u-option v-for="(item, index) in ${conf.vModel}Options" :key="index" :label="item.label" :value="item.value" :disabled="item.disabled"></u-option>`)
  }
  return children.join('\n')
}

function buildElRadioGroupChild(conf) {
  const children = []
  // 数据集来源：初始 options 为空也生成渲染入口，供运行时注入选项
  if ((conf.options && conf.options.length) || conf.optionSource === 'dataset') {
    const tag = conf.optionType === 'button' ? 'u-radio-button' : 'u-radio'
    const border = conf.border ? 'border' : ''
    children.push(`<${tag} v-for="(item, index) in ${conf.vModel}Options" :key="index" :label="item.value" :disabled="item.disabled" ${border}>{{item.label}}</${tag}>`)
  }
  return children.join('\n')
}

function buildElCheckboxGroupChild(conf) {
  const children = []
  // 数据集来源：初始 options 为空也生成渲染入口，供运行时注入选项
  if ((conf.options && conf.options.length) || conf.optionSource === 'dataset') {
    const tag = conf.optionType === 'button' ? 'u-checkbox-button' : 'u-checkbox'
    const border = conf.border ? 'border' : ''
    children.push(`<${tag} v-for="(item, index) in ${conf.vModel}Options" :key="index" :label="item.value" :disabled="item.disabled" ${border}>{{item.label}}</${tag}>`)
  }
  return children.join('\n')
}



export function makeUpHtml(conf, type) {
  const htmlList = []
  confGlobal = conf
  someSpanIsNot24 = conf.fields && Array.isArray(conf.fields) ? conf.fields.some(item => item.span !== 24) : false
  if (conf.fields && Array.isArray(conf.fields)) {
    conf.fields.forEach(el => {
      htmlList.push(layouts[el.layout](el))
    })
  }
  const htmlStr = htmlList.join('\n')

  let temp = buildFormTemplate(conf, htmlStr, type)
  if (type === 'dialog') {
    temp = dialogWrapper(temp)
  }
  confGlobal = null
  return temp
}
