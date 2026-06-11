/**
 * 查询表单数据模型 JSON Schema 定义
 */

// ==================== 查询表单 Schema ====================

/**
 * Option 选项 Schema
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
 * DatePicker 日期选择器 Schema
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
 * 遍历 fields 全部行容器，收集每个 RowComponent 和子组件的错误，一次性返回
 * 避免 LLM 一次只看到一条报错反复重试
 *
 * @param searchForm - 查询表单对象
 * @returns 错误信息（多条用换行分隔），undefined 表示校验通过
 */
export function validateSearchForm(searchForm: any): string | undefined {
  if (!searchForm || typeof searchForm !== 'object') {
    return 'searchForm 必须是对象类型'
  }
  const errors: string[] = []

  // tag 必须是 u-form
  if (searchForm.tag !== 'u-form') {
    errors.push('searchForm.tag 必须是 "u-form"')
  }

  // fields 必须是数组
  if (!Array.isArray(searchForm.fields)) {
    errors.push('searchForm.fields 必须是数组')
  } else {
    // 校验每个 field（RowComponent）：收集所有行的错误而不是只取第一个
    for (let i = 0; i < searchForm.fields.length; i++) {
      const row = searchForm.fields[i]
      const rowError = validateRowComponent(row, i)
      if (rowError) {
        errors.push(`fields[${i}]: ${rowError}`)
      }
    }
  }

  return errors.length ? errors.join('\n') : undefined
}

/**
 * 校验行容器组件
 * 收集 tag/layout/children 的错误，并且遍历全部子组件收集错误
 *
 * @param row - 行容器对象
 * @param index - 行索引
 * @returns 错误信息（多条用换行分隔），undefined 表示校验通过
 */
function validateRowComponent(row: any, index: number): string | undefined {
  if (!row || typeof row !== 'object') {
    return `searchForm.fields[${index}] 必须是对象类型`
  }
  const errors: string[] = []

  // tag 必须是 u-row
  if (row.tag !== 'u-row') {
    errors.push(`tag 必须是 "u-row"，当前为 ${row.tag}`)
  }

  // layout 必须是 rowFormItem
  if (row.layout !== 'rowFormItem') {
    errors.push(`layout 必须是 "rowFormItem"，当前为 ${row.layout}`)
  }

  // children 必须是数组
  if (!Array.isArray(row.children)) {
    errors.push('children 必须是数组')
  } else {
    // 校验每个子组件：收集所有子组件的错误而不是只取第一个
    for (let j = 0; j < row.children.length; j++) {
      const child = row.children[j]
      const childError = validateFormComponent(child, index, j)
      if (childError) {
        errors.push(`children[${j}]: ${childError}`)
      }
    }
  }

  return errors.length ? errors.join('\n') : undefined
}

/**
 * 校验表单组件
 *
 * @param component - 表单组件对象
 * @param rowIndex - 行索引
 * @param childIndex - 子组件索引
 * @returns 错误信息（多条用换行分隔），undefined 表示校验通过
 */
function validateFormComponent(component: any, rowIndex: number, childIndex: number): string | undefined {
  if (!component || typeof component !== 'object') {
    return `searchForm.fields[${rowIndex}].children[${childIndex}] 必须是对象类型`
  }
  const errors: string[] = []

  const validTags = ['u-input', 'u-input-number', 'u-select', 'u-radio-group', 'u-checkbox-group', 'u-switch', 'u-date-picker', 'u-button']
  if (!validTags.includes(component.tag)) {
    errors.push(`tag 必须是 ${validTags.join('/')} 之一，当前为 ${component.tag}`)
  }

  // layout 必须是 colFormItem
  if (component.layout !== 'colFormItem') {
    errors.push(`layout 必须是 "colFormItem"，当前为 ${component.layout}`)
  }

  // span 校验
  if (typeof component.span !== 'number' || component.span < 1 || component.span > 24) {
    errors.push('span 必须是 1-24 之间的整数')
  }

  // 非按钮组件必须有 vModel
  if (component.tag !== 'u-button') {
    if (!component.vModel || typeof component.vModel !== 'string') {
      errors.push('vModel 必须是非空字符串')
    }
  }

  // Select/RadioGroup/CheckboxGroup 必须有 options
  if (['u-select', 'u-radio-group', 'u-checkbox-group'].includes(component.tag)) {
    if (!Array.isArray(component.options)) {
      errors.push('options 必须是数组')
    } else {
      // 遍历每个 option，收集所有非法 option 的错误
      for (let k = 0; k < component.options.length; k++) {
        const opt = component.options[k]
        if (!opt || !opt.label || !opt.value) {
          errors.push(`options[${k}] 必须包含 label 和 value`)
        }
      }
    }
  }

  // DatePicker 必须有 type
  if (component.tag === 'u-date-picker') {
    const validDateTypes = ['date', 'datetime', 'week', 'month', 'year', 'daterange']
    if (!validDateTypes.includes(component.type)) {
      errors.push(`type 必须是 ${validDateTypes.join('/')} 之一，当前为 ${component.type}`)
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

  return errors.length ? errors.join('\n') : undefined
}

// ==================== 模板生成函数 ====================

/**
 * 各组件类型到默认模板的映射，用于 getSearchFormTemplate 按类型生成组件示例
 */
const COMPONENT_TEMPLATE_MAP: Record<string, (vModel: string, label: string) => any> = {
  input: (vModel, label) => ({
    label,
    tag: 'u-input',
    tagIcon: 'input',
    vModel,
    span: 24,
    layout: 'colFormItem',
    placeholder: `请输入${label}`,
    clearable: false,
    readonly: false,
    maxlength: null,
    showWordLimit: false,
    disabled: false,
    required: false,
    changeTag: false,
    defaultValue: '',
    formId: vModel,
    renderKey: vModel
  }),
  inputNumber: (vModel, label) => ({
    label,
    tag: 'u-input-number',
    tagIcon: 'number',
    vModel,
    span: 24,
    layout: 'colFormItem',
    stepStrictly: false,
    controlsPosition: '',
    disabled: false,
    required: false,
    changeTag: false,
    defaultValue: '',
    formId: vModel,
    renderKey: vModel
  }),
  select: (vModel, label) => ({
    label,
    tag: 'u-select',
    tagIcon: 'select',
    vModel,
    span: 24,
    layout: 'colFormItem',
    multiple: false,
    clearable: false,
    filterable: false,
    placeholder: `请选择${label}`,
    options: [],
    disabled: false,
    required: false,
    changeTag: false,
    defaultValue: '',
    formId: vModel,
    renderKey: vModel
  }),
  radioGroup: (vModel, label) => ({
    label,
    tag: 'u-radio-group',
    tagIcon: 'radio',
    vModel,
    span: 24,
    layout: 'colFormItem',
    options: [],
    optionType: 'default',
    border: false,
    size: 'medium',
    disabled: false,
    required: false,
    changeTag: false,
    defaultValue: '',
    formId: vModel,
    renderKey: vModel
  }),
  checkboxGroup: (vModel, label) => ({
    label,
    tag: 'u-checkbox-group',
    tagIcon: 'checkbox',
    vModel,
    span: 24,
    layout: 'colFormItem',
    options: [],
    optionType: 'default',
    border: false,
    size: 'medium',
    disabled: false,
    required: false,
    changeTag: false,
    defaultValue: [],
    formId: vModel,
    renderKey: vModel
  }),
  switch: (vModel, label) => ({
    label,
    tag: 'u-switch',
    tagIcon: 'switch',
    vModel,
    span: 24,
    layout: 'colFormItem',
    activeColor: null,
    inactiveColor: null,
    activeValue: true,
    inactiveValue: false,
    disabled: false,
    required: false,
    changeTag: false,
    defaultValue: false,
    formId: vModel,
    renderKey: vModel
  }),
  datePicker: (vModel, label) => ({
    label,
    tag: 'u-date-picker',
    tagIcon: 'date',
    vModel,
    span: 24,
    layout: 'colFormItem',
    type: 'date',
    format: 'YYYY-MM-DD',
    valueFormat: 'format',
    placeholder: `请选择${label}`,
    clearable: false,
    readonly: false,
    disabled: false,
    required: false,
    changeTag: false,
    defaultValue: '',
    formId: vModel,
    renderKey: vModel
  }),
  button: (_vModel, label) => ({
    label: label || '查询',
    type: 'primary',
    size: 'medium',
    tag: 'u-button',
    tagIcon: 'button',
    span: 24,
    layout: 'colFormItem',
    disabled: false,
    changeTag: false,
    defaultValue: '',
    vModel: '',
    formId: 'btn_query',
    renderKey: 'btn_query'
  })
}

/**
 * 生成查询表单模板，包含指定类型的组件示例
 *
 * @param componentTypes - 需要的组件类型数组，如 ['input','select','datePicker']，可为空（返回空壳模板）
 * @returns 完整的查询表单模板对象，包含 u-form 外壳和指定组件
 */
export function getSearchFormTemplate(componentTypes?: string[]): any {
  const fields: any[] = []

  if (componentTypes && componentTypes.length > 0) {
    // 每个组件类型生成一个 RowComponent 包裹一个子组件
    const children: any[] = []
    for (const type of componentTypes) {
      const factory = COMPONENT_TEMPLATE_MAP[type]
      if (factory) {
        // vModel 和 label 用类型名做占位，LLM 基于模板修改时替换
        const vModel = `${type}Field`
        const label = `${type}字段`
        children.push(factory(vModel, label))
      }
    }
    if (children.length > 0) {
      fields.push({
        type: 'default',
        tag: 'u-row',
        tagIcon: 'row',
        span: 24,
        gutter: 15,
        justify: 'start',
        align: 'top',
        layout: 'rowFormItem',
        layoutTree: true,
        componentName: 'row1',
        formId: 'row1',
        renderKey: 'row1',
        document: '',
        children
      })
    }
  }

  return {
    formRef: 'uForm',
    tag: 'u-form',
    formModel: 'formData',
    size: 'small',
    labelPosition: 'left',
    labelWidth: 100,
    formRules: 'rules',
    gutter: 15,
    disabled: false,
    span: 24,
    formBtns: true,
    fields
  }
}

// ==================== 数据规范化函数 ====================

/**
 * 规范化查询表单数据：补齐布尔字段默认值、生成 renderKey/formId 等
 * 与 validateSearchForm 职责分离：normalize 只补字段，validate 检查结构性错误
 *
 * @param searchForm - 查询表单对象，可为空
 * @returns 规范化后的查询表单对象
 */
export function normalizeSearchForm(searchForm: any): any {
  if (!searchForm || typeof searchForm !== 'object') return searchForm

  // 补齐顶层布尔属性默认值
  if (searchForm.disabled === undefined || searchForm.disabled === null) searchForm.disabled = false
  if (searchForm.formBtns === undefined || searchForm.formBtns === null) searchForm.formBtns = true

  // 补齐 fields 中每个组件的布尔属性
  if (Array.isArray(searchForm.fields)) {
    for (const row of searchForm.fields) {
      if (!row || typeof row !== 'object') continue
      if (Array.isArray(row.children)) {
        for (const child of row.children) {
          normalizeFormComponent(child)
        }
      }
    }
  }

  return searchForm
}

/**
 * 规范化单个表单组件：补齐布尔字段默认值
 *
 * @param component - 表单组件对象，可为空
 * @returns 规范化后的表单组件对象
 */
function normalizeFormComponent(component: any): any {
  if (!component || typeof component !== 'object') return component

  // 公共布尔属性
  if (component.disabled === undefined || component.disabled === null) component.disabled = false
  if (component.required === undefined || component.required === null) component.required = false
  if (component.changeTag === undefined || component.changeTag === null) component.changeTag = false

  // u-input 特有布尔属性
  if (component.tag === 'u-input') {
    if (component.clearable === undefined || component.clearable === null) component.clearable = false
    if (component.readonly === undefined || component.readonly === null) component.readonly = false
    if (component.showWordLimit === undefined || component.showWordLimit === null) component.showWordLimit = false
  }

  // u-input-number 特有布尔属性
  if (component.tag === 'u-input-number') {
    if (component.stepStrictly === undefined || component.stepStrictly === null) component.stepStrictly = false
  }

  // u-select 特有布尔属性
  if (component.tag === 'u-select') {
    if (component.clearable === undefined || component.clearable === null) component.clearable = false
    if (component.multiple === undefined || component.multiple === null) component.multiple = false
    if (component.filterable === undefined || component.filterable === null) component.filterable = false
  }

  // u-date-picker 特有布尔属性
  if (component.tag === 'u-date-picker') {
    if (component.clearable === undefined || component.clearable === null) component.clearable = false
  }

  return component
}