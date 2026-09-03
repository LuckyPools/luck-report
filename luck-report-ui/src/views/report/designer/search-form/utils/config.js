import {$t} from "@/locales";
export const formConf = {
  formRef: 'uForm',
  tag: 'u-form',
  formModel: 'formData',
  size: 'medium',
  labelPosition: 'right',
  labelWidth: 100,
  formRules: 'rules',
  gutter: 15,
  disabled: false,
  span: 24,
  formBtns: true
}

export const inputComponents = [
  {
    label: $t('searchForm.singleLineText'),
    tag: 'u-input',
    tagIcon: 'input',
    placeholder: $t('searchForm.pleaseEnter'),
    defaultValue: undefined,
    span: 24,
    labelWidth: null,
    style: { width: '100%' },
    clearable: true,
    prepend: '',
    append: '',
    'prefixIcon': '',
    'suffixIcon': '',
    maxlength: null,
    'showWordLimit': false,
    required: true,
    regList: [],
    changeTag: true,
    document: '/component/input'
  },
  {
    label: $t('searchForm.counter'),
    tag: 'u-input-number',
    tagIcon: 'number',
    placeholder: '',
    defaultValue: undefined,
    span: 24,
    labelWidth: null,
    min: undefined,
    max: undefined,
    step: undefined,
    'stepStrictly': false,
    precision: undefined,
    'controlsPosition': '',
    required: true,
    regList: [],
    changeTag: true,
    document: '/component/input-number'
  }
]

export const selectComponents = [
  {
    label: $t('searchForm.dropdownSelect'),
    tag: 'u-select',
    tagIcon: 'select',
    placeholder: $t('searchForm.pleaseSelect'),
    defaultValue: undefined,
    span: 24,
    labelWidth: null,
    style: { width: '100%' },
    clearable: true,
    required: true,
    filterable: false,
    multiple: false,
    options: [{
      label: $t('searchForm.optionOne'),
      value: 1
    }, {
      label: $t('searchForm.optionTwo'),
      value: 2
    }],
    optionSource: 'static',
    regList: [],
    changeTag: true,
    document: '/component/select'
  },
  {
    label: $t('searchForm.radioGroup'),
    tag: 'u-radio-group',
    tagIcon: 'radio',
    defaultValue: null,
    span: 24,
    labelWidth: null,
    style: {},
    optionType: 'default',
    border: false,
    size: 'medium',
    required: true,
    options: [{
      label: $t('searchForm.optionOne'),
      value: 1
    }, {
      label: $t('searchForm.optionTwo'),
      value: 2
    }],
    optionSource: 'static',
    regList: [],
    changeTag: true,
    document: '/component/radio'
  },
  {
    label: $t('searchForm.checkboxGroup'),
    tag: 'u-checkbox-group',
    tagIcon: 'checkbox',
    // 默认值统一字符串存储，多选为逗号拼接格式，空为 null
    defaultValue: null,
    span: 24,
    labelWidth: null,
    style: {},
    optionType: 'default',
    border: false,
    size: 'medium',
    required: true,
    options: [{
      label: $t('searchForm.optionOne'),
      value: 1
    }, {
      label: $t('searchForm.optionTwo'),
      value: 2
    }],
    optionSource: 'static',
    regList: [],
    changeTag: true,
    document: '/component/checkbox'
  },
  {
    label: $t('searchForm.switch'),
    tag: 'u-switch',
    tagIcon: 'switch',
    defaultValue: 'false',
    span: 24,
    labelWidth: null,
    style: {},
    required: true,
    // 'activeText': '',
    // 'inactiveText': '',
    'activeColor': null,
    'inactiveColor': null,
    'activeValue': true,
    'inactiveValue': false,
    regList: [],
    changeTag: true,
    document: '/component/switch'
  },

  {
    label: $t('searchForm.datePicker'),
    tag: 'u-date-picker',
    tagIcon: 'date',
    placeholder: $t('searchForm.pleaseSelect'),
    defaultValue: null,
    type: 'date',
    span: 24,
    labelWidth: null,
    style: { width: '100%' },
    clearable: true,
    required: true,
    format: 'YYYY-MM-DD',
    'valueFormat': 'format',
    regList: [],
    changeTag: true,
    document: '/component/date-picker'
  },
]

export const layoutComponents = [
  {
    layout: 'rowFormItem',
    tagIcon: 'row',
    type: 'default',
    tag: 'u-row',
    justify: 'start',
    align: 'top',
    label: $t('searchForm.rowContainer'),
    layoutTree: true,
    children: [],
    document: '/component/layout'
  },
  {
    layout: 'colFormItem',
    label: $t('searchForm.button'),
    changeTag: true,
    labelWidth: null,
    tag: 'u-button',
    tagIcon: 'button',
    span: 24,
    defaultValue: $t('searchForm.mainButton'),
    type: 'primary',
    icon: 'icon-search',
    size: 'medium',
    document: '/component/button'
  }
]

// 组件rule的触发方式，无触发方式的组件不生成rule
export const trigger = {
  'u-input': 'blur',
  'u-input-number': 'blur',
  'u-select': 'change',
  'u-radio-group': 'change',
  'u-checkbox-group': 'change',
  'u-date-picker': 'change'
}
