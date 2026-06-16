/**
 * 组件元数据 / 默认 formConf
 *
 * 改造要点：
 * 1. 全部 tag 由 u-xxx 改为 ant-design-vue 的 a-xxx
 * 2. trigger 字典同步改为 a-xxx
 * 3. 删除 u-input-number 的 controlsPosition（a-input-number 已统一），仍保留旧字段以兼容读取老数据
 * 4. 全部加显式 TS 类型
 */
import type { FormConf, FormField } from './types'

/** 表单全局默认配置 */
export const formConf: FormConf = {
  formRef: 'aFormRef',
  formModel: 'formData',
  formRules: 'rules',
  size: 'medium',
  labelPosition: 'right',
  labelWidth: 100,
  gutter: 0,
  disabled: false,
  span: 24,
  formBtns: true
}

/** a-xxx 组件的 v-model 绑定方式（用于 render.tsx 与 html.ts） */
export const vModelMap: Record<string, string> = {
  'a-input': 'value',
  'a-input-number': 'value',
  'a-select': 'value',
  'a-radio-group': 'value',
  'a-checkbox-group': 'value',
  'a-switch': 'checked',
  'a-date-picker': 'value'
}

/** 触发校验的时机（标签名为 a-xxx） */
export const trigger = {
  'a-input': 'blur',
  'a-input-number': 'blur',
  'a-select': 'change',
  'a-radio-group': 'change',
  'a-checkbox-group': 'change',
  'a-switch': 'change',
  'a-date-picker': 'change'
} as const

/** ant-design-vue size 映射（a-* 枚举为 large/middle/small） */
export function toAntSize(size: 'medium' | 'small' | 'mini' | 'large' | 'middle' | undefined): 'large' | 'middle' | 'small' | undefined {
  if (size === 'mini') return 'small'
  if (size === 'medium') return 'middle'
  return size
}

/** 单行输入 */
export const inputComponents: FormField[] = [
  {
    __key: 'a-input',
    formId: 1,
    tag: 'a-input',
    tagIcon: 'input',
    label: '单行文本',
    vModel: 'field1',
    placeholder: '请输入',
    defaultValue: undefined,
    span: 24,
    style: { width: '100%' },
    clearable: true,
    prepend: '',
    append: '',
    'prefixIcon': '',
    'suffixIcon': '',
    maxlength: undefined,
    'showWordLimit': false,
    type: 'text',
    regList: [],
    required: true,
    document: 'https://www.antdv.com/components/input-cn'
  },
  {
    __key: 'a-input-number',
    formId: 3,
    tag: 'a-input-number',
    tagIcon: 'number',
    label: '数字输入',
    vModel: 'field3',
    placeholder: '请输入',
    defaultValue: undefined,
    span: 24,
    style: { width: '100%' },
    min: undefined,
    max: undefined,
    step: undefined,
    'stepStrictly': false,
    precision: undefined,
    'controlsPosition': '',
    regList: [],
    required: true,
    document: 'https://www.antdv.com/components/input-number-cn'
  }
]

/** 选择类 */
export const selectComponents: FormField[] = [
  {
    __key: 'a-select',
    formId: 4,
    tag: 'a-select',
    tagIcon: 'select',
    label: '下拉选择',
    vModel: 'field4',
    placeholder: '请选择',
    defaultValue: undefined,
    span: 24,
    style: { width: '100%' },
    clearable: true,
    multiple: false,
    filterable: false,
    required: true,
    options: [
      { value: 'Beijing', label: '北京' },
      { value: 'Shanghai', label: '上海' },
      { value: 'Guangzhou', label: '广州' }
    ],
    regList: [],
    document: 'https://www.antdv.com/components/select-cn'
  },
  {
    __key: 'a-radio-group',
    formId: 5,
    tag: 'a-radio-group',
    tagIcon: 'radio',
    label: '单选',
    vModel: 'field5',
    defaultValue: undefined,
    span: 24,
    style: {},
    size: 'small',
    optionType: 'default',
    border: false,
    required: true,
    options: [
      { value: '选项1', label: '选项1' },
      { value: '选项2', label: '选项2' }
    ],
    regList: [],
    document: 'https://www.antdv.com/components/radio-cn'
  },
  {
    __key: 'a-checkbox-group',
    formId: 6,
    tag: 'a-checkbox-group',
    tagIcon: 'checkbox',
    label: '多选',
    vModel: 'field6',
    defaultValue: [],
    span: 24,
    style: {},
    size: 'small',
    optionType: 'default',
    border: false,
    required: true,
    options: [
      { value: '选项1', label: '选项1' },
      { value: '选项2', label: '选项2' }
    ],
    regList: [],
    document: 'https://www.antdv.com/components/checkbox-cn'
  },
  {
    __key: 'a-switch',
    formId: 7,
    tag: 'a-switch',
    tagIcon: 'switch',
    label: '开关',
    vModel: 'field7',
    defaultValue: false,
    span: 24,
    style: {},
    'activeText': '',
    'inactiveText': '',
    'activeColor': '',
    'inactiveColor': '',
    'activeValue': true,
    'inactiveValue': false,
    regList: [],
    document: 'https://www.antdv.com/components/switch-cn'
  },
  {
    __key: 'a-date-picker',
    formId: 9,
    tag: 'a-date-picker',
    tagIcon: 'date',
    label: '日期选择',
    vModel: 'field9',
    placeholder: '请选择',
    defaultValue: undefined,
    span: 24,
    style: { width: '100%' },
    type: 'date',
    format: 'YYYY-MM-DD',
    'valueFormat': 'format',
    'start-placeholder': '开始日期',
    'end-placeholder': '结束日期',
    'range-separator': '至',
    readonly: false,
    clearable: true,
    regList: [],
    required: true,
    document: 'https://www.antdv.com/components/date-picker-cn'
  }
]

/** 布局/按钮类 */
export const layoutComponents: FormField[] = [
  {
    __key: 'a-row',
    formId: 11,
    layout: 'rowFormItem',
    tag: 'a-row',
    tagIcon: 'row',
    label: '栅格布局',
    componentName: 'row_1',
    span: 24,
    type: 'default',
    justify: 'start',
    align: 'top',
    gutter: 0,
    children: [],
    regList: [],
    document: ''
  },
  {
    __key: 'a-button',
    formId: 12,
    tag: 'a-button',
    tagIcon: 'button',
    label: '按钮',
    span: 24,
    defaultValue: '按钮',
    type: 'primary',
    icon: '',
    size: 'small',
    document: 'https://www.antdv.com/components/button-cn'
  }
]

/** 左上「控件库」配置 */
export const components: FormField[] = [...inputComponents, ...selectComponents, ...layoutComponents]
