/**
 * 查询表单数据模型 JSON Schema 定义
 *
 * 本文件定义了查询表单的核心数据模型、约束规则和校验函数。
 * 查询表单用于构建报表的参数查询界面。
 */

// ==================== 查询表单 Schema ====================

/**
 * Option 选项 Schema
 * 文档参考: form-design.md
 */
export const OptionSchema = {
  type: 'object',
  properties: {
    label: { type: 'string', description: '选项显示文本' },
    value: { type: 'string', description: '选项实际值' }
  },
  required: ['label', 'value'],
  description: '下拉选择/单选框组/多选框组的选项'
}

/**
 * RegList 正则校验规则 Schema
 */
export const RegListSchema = {
  type: 'object',
  properties: {
    pattern: { type: 'string', description: '正则表达式，如/^1[3-9]\\d{9}$/' },
    message: { type: 'string', description: '校验失败提示信息' }
  },
  required: ['pattern', 'message'],
  description: '正则校验规则'
}

/**
 * BaseInputComponent 输入组件公共属性 Schema
 * 文档参考: form-design.md
 */
export const BaseInputComponentSchema = {
  type: 'object',
  properties: {
    label: { type: 'string', description: '字段标签名，显示在表单中的名称' },
    tag: { type: 'string', description: '渲染标签，如u-input、u-select' },
    tagIcon: { type: 'string', description: '图标标识' },
    vModel: { type: 'string', description: '绑定字段名，必须与数据集Parameter的name一致' },
    span: { type: 'integer', minimum: 1, maximum: 24, description: '栅格占位，同一行内多个组件span之和应≤24' },
    labelWidth: { type: 'string', description: '标签宽度(px)' },
    style: { type: 'object', description: '自定义样式' },
    required: { type: 'boolean', description: '是否必填' },
    regList: { type: 'array', items: RegListSchema, description: '正则校验规则列表' },
    changeTag: { type: 'boolean', description: '是否可切换组件类型' },
    document: { type: 'string', description: '组件文档路径' },
    formId: { type: 'string', description: '表单组件ID' },
    renderKey: { type: 'string', description: '渲染唯一键' },
    layout: { type: 'string', const: 'colFormItem', description: '布局类型' },
    defaultValue: { description: '默认值，各组件类型不同' },
    disabled: { type: 'boolean', description: '是否禁用' },
    type: { type: 'string', description: '组件子类型' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout'],
  description: '输入组件公共属性基类'
}

/**
 * Input 单行文本 Schema
 * 文档参考: form-design.md
 */
export const InputSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'u-input' },
    tagIcon: { type: 'string', const: 'input' },
    placeholder: { type: 'string', description: '占位文本' },
    clearable: { type: 'boolean', description: '是否可清空' },
    readonly: { type: 'boolean', description: '是否只读' },
    maxlength: { type: 'string', description: '最大输入长度' },
    showWordLimit: { type: 'boolean', description: '是否显示字数统计' },
    prepend: { type: 'string', description: '前置内容' },
    append: { type: 'string', description: '后置内容' },
    prefixIcon: { type: 'string', description: '前缀图标' },
    suffixIcon: { type: 'string', description: '后缀图标' },
    defaultValue: { type: 'string', description: '默认值' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout'],
  description: '单行文本输入组件'
}

/**
 * InputNumber 计数器 Schema
 * 文档参考: form-design.md
 */
export const InputNumberSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'u-input-number' },
    tagIcon: { type: 'string', const: 'number' },
    stepStrictly: { type: 'boolean', description: '是否只能输入步长的倍数' },
    controlsPosition: { type: 'string', enum: ['', 'right'], description: '控制按钮位置' },
    defaultValue: { type: 'string', description: '默认值' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout'],
  description: '计数器组件'
}

/**
 * Select 下拉选择 Schema
 * 文档参考: form-design.md
 */
export const SelectSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'u-select' },
    tagIcon: { type: 'string', const: 'select' },
    multiple: { type: 'boolean', description: '是否多选' },
    clearable: { type: 'boolean', description: '是否可清空' },
    filterable: { type: 'boolean', description: '是否可搜索' },
    placeholder: { type: 'string', description: '占位文本' },
    options: { type: 'array', items: OptionSchema, description: '选项列表' },
    defaultValue: { type: 'string', description: '默认值' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout', 'options'],
  description: '下拉选择组件'
}

/**
 * RadioGroup 单选框组 Schema
 * 文档参考: form-design.md
 */
export const RadioGroupSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'u-radio-group' },
    tagIcon: { type: 'string', const: 'radio' },
    options: { type: 'array', items: OptionSchema, description: '选项列表' },
    optionType: { type: 'string', enum: ['default', 'button'], description: '单选框样式' },
    border: { type: 'boolean', description: '是否带边框' },
    size: { type: 'string', enum: ['medium', 'small', 'mini'], description: '尺寸' },
    defaultValue: { type: 'string', description: '默认值' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout', 'options'],
  description: '单选框组组件'
}

/**
 * CheckboxGroup 多选框组 Schema
 * 文档参考: form-design.md
 */
export const CheckboxGroupSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'u-checkbox-group' },
    tagIcon: { type: 'string', const: 'checkbox' },
    options: { type: 'array', items: OptionSchema, description: '选项列表' },
    optionType: { type: 'string', enum: ['default', 'button'], description: '多选框样式' },
    border: { type: 'boolean', description: '是否带边框' },
    size: { type: 'string', enum: ['medium', 'small', 'mini'], description: '尺寸' },
    defaultValue: { type: 'array', items: { type: 'string' }, description: '默认值（数组）' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout', 'options'],
  description: '多选框组组件'
}

/**
 * Switch 开关 Schema
 * 文档参考: form-design.md
 */
export const SwitchSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'u-switch' },
    tagIcon: { type: 'string', const: 'switch' },
    activeColor: { type: 'string', description: '打开时颜色' },
    inactiveColor: { type: 'string', description: '关闭时颜色' },
    activeValue: { type: 'boolean', description: '打开时的值', default: true },
    inactiveValue: { type: 'boolean', description: '关闭时的值', default: false },
    defaultValue: { type: 'boolean', description: '默认值' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout'],
  description: '开关组件'
}

/**
 * DatePicker 日期选择 Schema
 * 文档参考: form-design.md
 */
export const DatePickerSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'u-date-picker' },
    tagIcon: { type: 'string', const: 'date' },
    type: { type: 'string', enum: ['date', 'datetime', 'week', 'month', 'year', 'daterange'], description: '选择器类型' },
    format: { type: 'string', description: '显示格式，如YYYY-MM-DD' },
    valueFormat: { type: 'string', enum: ['format', 'timestamp'], description: '值格式' },
    placeholder: { type: 'string', description: '占位文本' },
    clearable: { type: 'boolean', description: '是否可清空' },
    readonly: { type: 'boolean', description: '是否只读' },
    defaultValue: { type: 'string', description: '默认值' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout', 'type'],
  description: '日期选择组件'
}

/**
 * Button 按钮 Schema
 * 文档参考: form-design.md
 */
export const ButtonSchema = {
  type: 'object',
  properties: {
    label: { type: 'string', description: '按钮文本' },
    type: { type: 'string', enum: ['primary', 'success', 'warning', 'danger', 'info', 'default'], description: '按钮类型' },
    size: { type: 'string', enum: ['medium', 'small', 'mini'], description: '尺寸' },
    icon: { type: 'string', description: '图标类名' },
    disabled: { type: 'boolean', description: '是否禁用' },
    tag: { type: 'string', const: 'u-button' },
    tagIcon: { type: 'string', const: 'button' },
    span: { type: 'integer', minimum: 1, maximum: 24, description: '栅格占位' },
    layout: { type: 'string', const: 'colFormItem', description: '布局类型' },
    changeTag: { type: 'boolean', description: '是否可切换类型' },
    defaultValue: { type: 'string', description: '默认值（按钮文本）' },
    vModel: { type: 'string', description: '绑定字段名（按钮一般不需要）' },
    formId: { type: 'string', description: '表单组件ID' },
    renderKey: { type: 'string', description: '渲染唯一键' },
    document: { type: 'string', description: '组件文档路径' }
  },
  required: ['label', 'tag', 'span', 'layout'],
  description: '按钮组件'
}

/**
 * FormComponent 表单组件 Schema（动态类型）
 */
export const FormComponentSchema = {
  oneOf: [
    InputSchema,
    InputNumberSchema,
    SelectSchema,
    RadioGroupSchema,
    CheckboxGroupSchema,
    SwitchSchema,
    DatePickerSchema,
    ButtonSchema
  ],
  description: '表单组件，可以是任意输入组件或按钮'
}

/**
 * RowComponent 行容器 Schema
 * 文档参考: form-design.md
 */
export const RowComponentSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'default', description: '行类型' },
    tag: { type: 'string', const: 'u-row', description: '渲染标签' },
    tagIcon: { type: 'string', const: 'row', description: '图标标识' },
    span: { type: 'integer', description: '行占位', default: 24 },
    gutter: { type: 'integer', description: '列间距(px)', default: 15 },
    justify: { type: 'string', enum: ['start', 'end', 'center', 'space-around', 'space-between'], description: '水平排列方式' },
    align: { type: 'string', enum: ['top', 'middle', 'bottom'], description: '垂直排列方式' },
    layout: { type: 'string', const: 'rowFormItem', description: '布局类型' },
    layoutTree: { type: 'boolean', const: true, description: '是否为树形布局容器' },
    componentName: { type: 'string', description: '组件名称（唯一）' },
    formId: { type: 'string', description: '表单组件ID' },
    renderKey: { type: 'string', description: '渲染唯一键' },
    document: { type: 'string', description: '组件文档路径' },
    children: { type: 'array', items: FormComponentSchema, description: '行内子组件列表' }
  },
  required: ['tag', 'layout', 'layoutTree', 'children'],
  description: '行容器组件，用于放置输入组件'
}

/**
 * SearchForm 查询表单 Schema
 * 文档参考: form-design.md
 */
export const SearchFormSchema = {
  type: 'object',
  properties: {
    formRef: { type: 'string', description: '表单ref标识', default: 'uForm' },
    tag: { type: 'string', const: 'u-form', description: '表单渲染标签' },
    formModel: { type: 'string', description: '表单数据对象名', default: 'formData' },
    size: { type: 'string', enum: ['small', 'medium', 'large'], description: '表单组件尺寸' },
    labelPosition: { type: 'string', enum: ['left', 'right', 'top'], description: '标签对齐方式' },
    labelWidth: { type: 'integer', description: '标签宽度(px)', default: 100 },
    formRules: { type: 'string', description: '校验规则对象名', default: 'rules' },
    gutter: { type: 'integer', description: '栅格间距(px)', default: 15 },
    disabled: { type: 'boolean', description: '是否禁用整表' },
    span: { type: 'integer', description: '默认栅格占位', default: 24 },
    formBtns: { type: 'boolean', description: '是否显示查询/重置按钮' },
    fields: { type: 'array', items: RowComponentSchema, description: '表单字段列表（树形结构）' }
  },
  required: ['tag', 'fields'],
  description: '查询表单配置对象'
}

// ==================== 数据校验函数 ====================

/**
 * 校验查询表单数据是否符合规范
 * @param searchForm - 查询表单对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateSearchForm(searchForm: any): string | undefined {
  if (!searchForm || typeof searchForm !== 'object') {
    return 'searchForm 必须是对象类型'
  }

  // tag 必须是 u-form
  if (searchForm.tag !== 'u-form') {
    return 'searchForm.tag 必须是 "u-form"'
  }

  // fields 必须是数组
  if (!Array.isArray(searchForm.fields)) {
    return 'searchForm.fields 必须是数组'
  }

  // 校验每个 field（RowComponent）
  for (let i = 0; i < searchForm.fields.length; i++) {
    const row = searchForm.fields[i]
    const rowError = validateRowComponent(row, i)
    if (rowError) return rowError
  }

  return undefined
}

/**
 * 校验行容器组件
 * @param row - 行容器对象
 * @param index - 行索引
 * @returns 错误信息，undefined 表示校验通过
 */
function validateRowComponent(row: any, index: number): string | undefined {
  if (!row || typeof row !== 'object') {
    return `searchForm.fields[${index}] 必须是对象类型`
  }

  // tag 必须是 u-row
  if (row.tag !== 'u-row') {
    return `searchForm.fields[${index}].tag 必须是 "u-row"`
  }

  // layout 必须是 rowFormItem
  if (row.layout !== 'rowFormItem') {
    return `searchForm.fields[${index}].layout 必须是 "rowFormItem"`
  }

  // children 必须是数组
  if (!Array.isArray(row.children)) {
    return `searchForm.fields[${index}].children 必须是数组`
  }

  // 校验每个子组件
  for (let j = 0; j < row.children.length; j++) {
    const child = row.children[j]
    const childError = validateFormComponent(child, index, j)
    if (childError) return childError
  }

  return undefined
}

/**
 * 校验表单组件
 * @param component - 表单组件对象
 * @param rowIndex - 行索引
 * @param childIndex - 子组件索引
 * @returns 错误信息，undefined 表示校验通过
 */
function validateFormComponent(component: any, rowIndex: number, childIndex: number): string | undefined {
  if (!component || typeof component !== 'object') {
    return `searchForm.fields[${rowIndex}].children[${childIndex}] 必须是对象类型`
  }

  const validTags = ['u-input', 'u-input-number', 'u-select', 'u-radio-group', 'u-checkbox-group', 'u-switch', 'u-date-picker', 'u-button']
  if (!validTags.includes(component.tag)) {
    return `searchForm.fields[${rowIndex}].children[${childIndex}].tag 必须是 ${validTags.join('/')} 之一`
  }

  // layout 必须是 colFormItem
  if (component.layout !== 'colFormItem') {
    return `searchForm.fields[${rowIndex}].children[${childIndex}].layout 必须是 "colFormItem"`
  }

  // span 校验
  if (typeof component.span !== 'number' || component.span < 1 || component.span > 24) {
    return `searchForm.fields[${rowIndex}].children[${childIndex}].span 必须是 1-24 之间的整数`
  }

  // 非按钮组件必须有 vModel
  if (component.tag !== 'u-button') {
    if (!component.vModel || typeof component.vModel !== 'string') {
      return `searchForm.fields[${rowIndex}].children[${childIndex}].vModel 必须是非空字符串`
    }
  }

  // Select/RadioGroup/CheckboxGroup 必须有 options
  if (['u-select', 'u-radio-group', 'u-checkbox-group'].includes(component.tag)) {
    if (!Array.isArray(component.options)) {
      return `searchForm.fields[${rowIndex}].children[${childIndex}].options 必须是数组`
    }
    for (let k = 0; k < component.options.length; k++) {
      const opt = component.options[k]
      if (!opt.label || !opt.value) {
        return `searchForm.fields[${rowIndex}].children[${childIndex}].options[${k}] 必须包含 label 和 value`
      }
    }
  }

  // DatePicker 必须有 type
  if (component.tag === 'u-date-picker') {
    const validDateTypes = ['date', 'datetime', 'week', 'month', 'year', 'daterange']
    if (!validDateTypes.includes(component.type)) {
      return `searchForm.fields[${rowIndex}].children[${childIndex}].type 必须是 ${validDateTypes.join('/')} 之一`
    }
  }

  // 补全布尔属性默认值，防止后端解析时 NPE（Java 基本类型 boolean 无法接收 null）
  // 公共布尔属性（所有表单组件）
  if (component.disabled === undefined || component.disabled === null) {
    component.disabled = false
  }
  if (component.required === undefined || component.required === null) {
    component.required = false
  }
  if (component.changeTag === undefined || component.changeTag === null) {
    component.changeTag = false
  }

  // u-input 特有布尔属性
  if (component.tag === 'u-input') {
    if (component.clearable === undefined || component.clearable === null) {
      component.clearable = false
    }
    if (component.readonly === undefined || component.readonly === null) {
      component.readonly = false
    }
    if (component.showWordLimit === undefined || component.showWordLimit === null) {
      component.showWordLimit = false
    }
  }

  // u-input-number 特有布尔属性
  if (component.tag === 'u-input-number') {
    if (component.stepStrictly === undefined || component.stepStrictly === null) {
      component.stepStrictly = false
    }
  }

  // u-select 特有布尔属性
  if (component.tag === 'u-select') {
    if (component.clearable === undefined || component.clearable === null) {
      component.clearable = false
    }
    if (component.multiple === undefined || component.multiple === null) {
      component.multiple = false
    }
    if (component.filterable === undefined || component.filterable === null) {
      component.filterable = false
    }
  }

  // u-date-picker 特有布尔属性
  if (component.tag === 'u-date-picker') {
    if (component.clearable === undefined || component.clearable === null) {
      component.clearable = false
    }
  }

  return undefined
}