/**
 * 模板代码生成器
 *
 * 改造要点：
 * 1. 全部 u-xxx 改为 ant-design-vue a-xxx
 * 2. 弹窗：u-dialog + slot="footer" → a-modal + <template #footer>
 * 3. v-model 自动转 v-model:value / v-model:checked（vModelOf）
 * 4. size 枚举 medium/small/mini → middle/small（aSizeOf）
 * 5. 对旧 u-input 的 slot="prepend/append" 退化为 a-input 的 prefix / suffix 字符串属性
 * 6. 同步删除 u-input-number 的 controlsPosition（a-input-number 无此属性）
 */
import { trigger } from './config'
import type { FormField, FormConf } from './types'

let confGlobal: FormConf | null = null
let someSpanIsNot24 = false

/** ant-design-vue Form size 映射 */
function aSizeOf(size?: string): string | undefined {
  if (size === 'mini') return 'small'
  if (size === 'medium') return 'middle'
  return size
}

/** a-xxx 组件 v-model 绑定形式 */
function vModelOf(tag: string): string {
  if (tag === 'a-switch') return 'v-model:checked'
  return 'v-model:value'
}

/** 弹窗外壳：使用 a-modal + <template #footer> */
export function dialogWrapper(str: string): string {
  return `<a-modal v-bind="$attrs" v-on="$listeners" @open="onOpen" @close="onClose" :title="t('searchForm.dialogTitle')" v-model:open="visible" :footer="null" @ok="handleConfirm" @cancel="close">
    ${str}
    <template #footer>
      <a-button @click="close">{{ t('searchForm.cancel') }}</a-button>
      <a-button type="primary" @click="handleConfirm">{{ t('searchForm.confirm') }}</a-button>
    </template>
  </a-modal>`
}

export function vueTemplate(str: string): string {
  return `<template>
    <div>
      ${str}
    </div>
  </template>`
}

export function vueScript(str: string): string {
  return `<script>
    ${str}
  </script>`
}

export function cssStyle(cssStr: string): string {
  return `<style>
    ${cssStr}
  </style>`
}

function buildFormTemplate(conf: FormConf, child: string, type: string): string {
  let labelPosition = ''
  if (conf.labelPosition !== 'right') {
    labelPosition = `label-position="${conf.labelPosition}"`
  }
  const disabled = conf.disabled ? ':disabled="true"' : ''
  let str = `<a-form ref="${conf.formRef}" :model="${conf.formModel}" :rules="${conf.formRules}" size="${aSizeOf(conf.size) || 'middle'}" ${disabled} :label-width="${conf.labelWidth}" ${labelPosition}>
      ${child}
      ${buildFromBtns(conf, type)}
    </a-form>`
  if (someSpanIsNot24) {
    str = `<a-row :gutter="${conf.gutter}">
        ${str}
      </a-row>`
  }
  return str
}

function buildFromBtns(conf: FormConf, type: string): string {
  let str = ''
  if (conf.formBtns && type === 'file') {
    str = `
        <a-row>
          <a-form-item>
            <a-button @click.prevent="resetForm" style="display: inline-flex; align-items: center; justify-content: center;">
                <i class="iconfont icon-refresh"></i>
                <span style="margin-left: 4px">{{ t('searchForm.reset') }}</span>
            </a-button>
            <a-button type="primary" @click.prevent="submitForm" style="margin-left: 5px; display: inline-flex; align-items: center; justify-content: center;">
                <i class="iconfont icon-search"></i>
                <span style="margin-left: 4px">{{ t('searchForm.search') }}</span>
            </a-button>
          </a-form-item>
        </a-row>
    `
    if (someSpanIsNot24) {
      str = `<a-col :span="24">
          ${str}
        </a-col>`
    }
  }
  return str
}

function colWrapper(element: FormField, str: string): string {
  if (someSpanIsNot24 || element.span !== 24) {
    return `<a-col :span="${element.span}">
      ${str}
    </a-col>`
  }
  return str
}

const layouts: Record<string, (el: FormField) => string> = {
  colFormItem(element) {
    let labelWidth = ''
    if (element.labelWidth && element.labelWidth !== confGlobal!.labelWidth) {
      labelWidth = `:label-width="${element.labelWidth}"`
    }
    const required = !trigger[element.tag as keyof typeof trigger] && element.required ? 'required' : ''
    const tagDom = tags[element.tag] ? tags[element.tag](element) : ''
    let str = `<a-form-item ${labelWidth} label="${element.label}" name="${element.vModel}" ${required}>
        ${tagDom}
      </a-form-item>`
    str = colWrapper(element, str)
    return str
  },
  rowFormItem(element) {
    const type = element.type === 'default' ? '' : `type="${element.type}"`
    const justify = element.type === 'default' ? '' : `justify="${element.justify}"`
    const align = element.type === 'default' ? '' : `align="${element.align}"`
    const gutter = element.gutter !== undefined ? `:gutter="${element.gutter}"` : ''
    const children = element.children && Array.isArray(element.children)
      ? element.children.map(el => layouts[el.layout as string](el))
      : []
    let str = `<a-row ${type} ${justify} ${align} ${gutter}>
      ${children.join('\n')}
    </a-row>`
    str = colWrapper(element, str)
    return str
  }
}

const tags: Record<string, (el: FormField) => string> = {
  'a-button': el => {
    const { disabled } = attrBuilder(el)
    // a-button 不写 type 时是 'default'，但为避免与 antd 默认样式混淆，显式输出
    const type = el.type ? `type="${el.type}"` : 'type="default"'
    const size = aSizeOf(el.size) ? `size="${aSizeOf(el.size)}"` : ''
    const icon = el.icon ? `<i class="iconfont ${el.icon}"></i>` : ''
    let child = buildElButtonChild(el)
    if (child) child = `\n${child}\n`
    return `<${el.tag} ${type} ${size} ${disabled}>${icon}${child}</${el.tag}>`
  },
  'a-input': el => {
    const { disabled, vModel, clearable, placeholder } = attrBuilder(el)
    const maxlength = el.maxlength ? `:maxlength="${el.maxlength}"` : ''
    const showWordLimit = el['showWordLimit'] ? 'show-count' : ''
    const readonly = el.readonly ? 'readonly' : ''
    // a-input 不再支持 slot="prepend/append"，使用 prefix/suffix 字符串属性
    const prefix = (el['prefixIcon'] || el.prepend) ? `prefix="${el['prefixIcon'] || el.prepend}"` : ''
    const suffix = (el['suffixIcon'] || el.append) ? `suffix="${el['suffixIcon'] || el.append}"` : ''
    const type = el.type ? `type="${el.type}"` : ''
    return `<${el.tag} ${vModel} ${type} ${placeholder} ${maxlength} ${showWordLimit} ${readonly} ${disabled} ${clearable} ${prefix} ${suffix}></${el.tag}>`
  },
  'a-input-number': el => {
    const { disabled, vModel, placeholder } = attrBuilder(el)
    const min = el.min !== undefined ? `:min="${el.min}"` : ''
    const max = el.max !== undefined ? `:max="${el.max}"` : ''
    const step = el.step !== undefined ? `:step="${el.step}"` : ''
    const precision = el.precision !== undefined ? `:precision="${el.precision}"` : ''

    return `<${el.tag} ${vModel} ${placeholder} ${step} ${precision} ${min} ${max} ${disabled}></${el.tag}>`
  },
  'a-select': el => {
    const { disabled, vModel, clearable, placeholder } = attrBuilder(el)
    const filterable = el.filterable ? 'filterable' : ''
    const multiple = el.multiple ? 'mode="multiple"' : ''
    let child = buildElSelectChild(el)
    if (child) child = `\n${child}\n`
    return `<${el.tag} ${vModel} ${placeholder} ${disabled} ${multiple} ${filterable} ${clearable}>${child}</${el.tag}>`
  },
  'a-radio-group': el => {
    const { disabled, vModel } = attrBuilder(el)
    const size = aSizeOf(el.size as string) ? `size="${aSizeOf(el.size as string)}"` : ''
    const optionType = el.optionType === 'button' ? 'option-type="button"' : ''
    const buttonStyle = el.optionType === 'button' ? 'button-style="solid"' : ''
    let child = buildElRadioGroupChild(el)
    if (child) child = `\n${child}\n`
    return `<${el.tag} ${vModel} ${optionType} ${buttonStyle} ${size} ${disabled}>${child}</${el.tag}>`
  },
  'a-checkbox-group': el => {
    const { disabled, vModel } = attrBuilder(el)
    const optionType = el.optionType === 'button' ? 'option-type="button"' : ''
    let child = buildElCheckboxGroupChild(el)
    if (child) child = `\n${child}\n`
    return `<${el.tag} ${vModel} ${optionType} ${disabled}>${child}</${el.tag}>`
  },
  'a-switch': el => {
    const { disabled, vModel } = attrBuilder(el)
    const activeText = el['activeText'] ? `checked-children="${el['activeText']}"` : ''
    const inactiveText = el['inactiveText'] ? `un-checked-children="${el['inactiveText']}"` : ''
    const activeValue = el['activeValue'] !== true ? `:checked-value='${JSON.stringify(el['activeValue'])}'` : ''
    const inactiveValue = el['inactiveValue'] !== false ? `:un-checked-value='${JSON.stringify(el['inactiveValue'])}'` : ''

    return `<${el.tag} ${vModel} ${activeText} ${inactiveText} ${activeValue} ${inactiveValue} ${disabled}></${el.tag}>`
  },
  'a-cascader': el => {
    const { disabled, vModel, clearable, placeholder } = attrBuilder(el)
    const options = el.options ? `:options="${el.vModel}Options"` : ''
    const showAllLevels = el['show-all-levels'] === false ? ':show-all-levels="false"' : ''
    const filterable = el.filterable ? 'filterable' : ''
    const separator = el.separator && el.separator !== '/' ? `separator="${el.separator}"` : ''

    return `<${el.tag} ${vModel} ${options} ${showAllLevels} ${placeholder} ${separator} ${filterable} ${clearable} ${disabled}></${el.tag}>`
  },
  'a-date-picker': el => {
    const { disabled, vModel, clearable, placeholder } = attrBuilder(el)
    const format = el.format ? `format="${el.format}"` : ''
    const valueFormat = el['valueFormat'] && el['valueFormat'] !== 'format' ? `value-format="${el['valueFormat']}"` : ''
    const type = el.type === 'date' ? '' : `picker="${el.type}"`
    const readonly = el.readonly ? 'readonly' : ''

    return `<${el.tag} ${type} ${vModel} ${format} ${valueFormat} ${placeholder} ${clearable} ${readonly} ${disabled}></${el.tag}>`
  },
  'a-time-picker': el => {
    const { disabled, vModel, clearable, placeholder } = attrBuilder(el)
    const format = el.format ? `format="${el.format}"` : ''
    const valueFormat = el['valueFormat'] && el['valueFormat'] !== 'format' ? `value-format="${el['valueFormat']}"` : ''

    return `<${el.tag} ${vModel} ${format} ${valueFormat} ${placeholder} ${clearable} ${disabled}></${el.tag}>`
  }
}

function attrBuilder(el: FormField) {
  return {
    vModel: `${vModelOf(el.tag)}="${confGlobal!.formModel}.${el.vModel}"`,
    clearable: el.clearable ? 'allow-clear' : '',
    placeholder: el.placeholder ? `placeholder="${el.placeholder}"` : '',
    disabled: el.disabled ? ':disabled="true"' : ''
  }
}

function buildElButtonChild(conf: FormField): string {
  const children: string[] = []
  if (conf.default) {
    children.push(conf.default as string)
  }
  return children.join('\n')
}

function buildElSelectChild(conf: FormField): string {
  const children: string[] = []
  if (conf.options && conf.options.length) {
    children.push(
      `<a-select-option v-for="(item, index) in ${conf.vModel}Options" :key="index" :value="item.value" :disabled="item.disabled">{{item.label}}</a-select-option>`
    )
  }
  return children.join('\n')
}

function buildElRadioGroupChild(conf: FormField): string {
  const children: string[] = []
  if (conf.options && conf.options.length) {
    const tag = conf.optionType === 'button' ? 'a-radio-button' : 'a-radio'
    children.push(
      `<${tag} v-for="(item, index) in ${conf.vModel}Options" :key="index" :value="item.value" :disabled="item.disabled">{{item.label}}</${tag}>`
    )
  }
  return children.join('\n')
}

function buildElCheckboxGroupChild(conf: FormField): string {
  const children: string[] = []
  if (conf.options && conf.options.length) {
    const tag = conf.optionType === 'button' ? 'a-checkbox-button' : 'a-checkbox'
    children.push(
      `<${tag} v-for="(item, index) in ${conf.vModel}Options" :key="index" :value="item.value" :disabled="item.disabled">{{item.label}}</${tag}>`
    )
  }
  return children.join('\n')
}

export function makeUpHtml(conf: FormConf & { fields?: FormField[] }, type: 'file' | 'dialog'): string {
  const htmlList: string[] = []
  confGlobal = conf
  someSpanIsNot24 = !!(conf.fields && Array.isArray(conf.fields) && conf.fields.some(item => item.span !== 24))
  if (conf.fields && Array.isArray(conf.fields)) {
    conf.fields.forEach(el => {
      htmlList.push(layouts[el.layout as string](el))
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
