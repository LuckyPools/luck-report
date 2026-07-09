/**
 * 查询表单数据模型 JSON Schema 定义
 *
 * 该文件为报表 agent 工具（get_search_form / set_search_form / get_search_form_template）
 * 描述前端设计器（src/views/report/designer/search-form）实际使用的数据结构。
 *
 * 设计器已迁移到 ant-design-vue 4.x：
 * - 组件 tag 统一为 a-xxx（如 a-input / a-select / a-date-picker）
 * - 字段命名与 utils/types.ts 的 FormConf / FormField 保持一致
 * - 顶层结构不再有 tag 字段，formRef / formModel / formRules 等配置直接平铺
 */

// ==================== 基础类型 Schema ====================

/**
 * Option 选项 Schema（下拉 / 单选 / 多选 通用）
 */
export const OptionSchema = {
  type: 'object',
  properties: {
    label: { type: 'string', description: '选项显示文本' },
    value: { type: ['string', 'number', 'boolean'], description: '选项实际值' },
    disabled: { type: 'boolean', description: '是否禁用该选项' }
  },
  required: ['label', 'value'],
  description: '下拉选择 / 单选框组 / 多选框组的选项'
}

/**
 * RegList 正则校验规则 Schema
 */
export const RegListSchema = {
  type: 'object',
  properties: {
    pattern: { type: 'string', description: '正则表达式字符串，如 /^1[3-9]\\d{9}$/' },
    message: { type: 'string', description: '校验失败提示信息' }
  },
  required: ['pattern', 'message'],
  description: '正则校验规则'
}

// ==================== 输入组件 Schema ====================

/**
 * BaseInputComponent 输入组件公共属性 Schema
 */
export const BaseInputComponentSchema = {
  type: 'object',
  properties: {
    // 内部标识
    __key: { type: 'string', description: '内部渲染 key（设计器内部使用）' },
    formId: { type: 'integer', description: '组件唯一 id（设计器内部分配，数字类型）' },
    renderKey: { type: ['integer', 'string'], description: '画布渲染键' },
    // 基础元数据
    label: { type: 'string', description: '字段标签名' },
    tag: { type: 'string', description: '组件标签（a-xxx）' },
    tagIcon: { type: 'string', description: '控件库图标标识' },
    vModel: { type: 'string', description: '绑定字段名，需与数据集 Parameter.name 一致' },
    // 布局
    layout: { type: 'string', const: 'colFormItem', description: '布局类型，输入组件固定为 colFormItem' },
    span: { type: 'integer', minimum: 1, maximum: 24, description: '栅格占位 1-24' },
    labelWidth: { type: ['integer', 'null'], description: '标签宽度(px)；null 表示使用表单级 labelWidth' },
    style: { type: 'object', description: '自定义样式' },
    // 校验与状态
    required: { type: 'boolean', description: '是否必填' },
    disabled: { type: 'boolean', description: '是否禁用' },
    readonly: { type: 'boolean', description: '是否只读' },
    regList: { type: 'array', items: RegListSchema, description: '正则校验规则列表' },
    // 其它
    changeTag: { type: 'boolean', description: '是否可在右侧面板切换组件类型' },
    document: { type: 'string', description: '组件帮助文档链接' },
    defaultValue: { description: '默认值，类型随组件变化' },
    type: { type: 'string', description: '组件子类型' }
  },
  required: ['label', 'tag', 'vModel', 'span', 'layout', 'formId', '__key', 'renderKey'],
  description: '输入组件公共属性基类'
}

/**
 * Input 单行文本 Schema
 */
export const InputSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'a-input' },
    tagIcon: { type: 'string', const: 'input' },
    placeholder: { type: 'string', description: '占位文本' },
    clearable: { type: 'boolean', description: '是否可清空（设计器默认 true）' },
    readonly: { type: 'boolean', description: '是否只读' },
    maxlength: { type: 'integer', description: '最大输入长度' },
    showWordLimit: { type: 'boolean', description: '是否显示字数统计' },
    prepend: { type: 'string', description: '前置内容（兼容老数据，新代码推荐用 prefix）' },
    append: { type: 'string', description: '后置内容（兼容老数据，新代码推荐用 suffix）' },
    prefixIcon: { type: 'string', description: '前缀图标' },
    suffixIcon: { type: 'string', description: '后缀图标' },
    defaultValue: { type: 'string', description: '默认值' }
  },
  required: BaseInputComponentSchema.required,
  description: '单行文本输入组件（a-input）'
}

/**
 * InputNumber 数字输入 Schema
 */
export const InputNumberSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'a-input-number' },
    tagIcon: { type: 'string', const: 'number' },
    min: { type: 'number', description: '最小值' },
    max: { type: 'number', description: '最大值' },
    step: { type: 'number', description: '步长' },
    stepStrictly: { type: 'boolean', description: '是否只能输入步长的倍数' },
    precision: { type: 'integer', description: '数值精度' },
    controlsPosition: { type: 'string', description: '控制按钮位置（a-input-number 已统一，仅保留兼容老数据）' },
    defaultValue: { type: 'string', description: '默认值' }
  },
  required: BaseInputComponentSchema.required,
  description: '数字输入组件（a-input-number）'
}

/**
 * Select 下拉选择 Schema
 */
export const SelectSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'a-select' },
    tagIcon: { type: 'string', const: 'select' },
    multiple: { type: 'boolean', description: '是否多选' },
    clearable: { type: 'boolean', description: '是否可清空（设计器默认 true）' },
    filterable: { type: 'boolean', description: '是否可搜索' },
    placeholder: { type: 'string', description: '占位文本' },
    options: { type: 'array', items: OptionSchema, description: '选项列表' },
    defaultValue: { type: 'string', description: '默认值' }
  },
  required: [...BaseInputComponentSchema.required, 'options'],
  description: '下拉选择组件（a-select）'
}

/**
 * RadioGroup 单选框组 Schema
 */
export const RadioGroupSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'a-radio-group' },
    tagIcon: { type: 'string', const: 'radio' },
    options: { type: 'array', items: OptionSchema, description: '选项列表' },
    optionType: { type: 'string', enum: ['default', 'button'], description: '单选框样式' },
    border: { type: 'boolean', description: '是否带边框' },
    size: { type: 'string', enum: ['medium', 'small', 'mini'], description: '尺寸（medium 渲染时映射为 middle，mini 映射为 small）' },
    defaultValue: { type: 'string', description: '默认值' }
  },
  required: [...BaseInputComponentSchema.required, 'options'],
  description: '单选框组组件（a-radio-group）'
}

/**
 * CheckboxGroup 多选框组 Schema
 */
export const CheckboxGroupSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'a-checkbox-group' },
    tagIcon: { type: 'string', const: 'checkbox' },
    options: { type: 'array', items: OptionSchema, description: '选项列表' },
    optionType: { type: 'string', enum: ['default', 'button'], description: '多选框样式' },
    border: { type: 'boolean', description: '是否带边框' },
    size: { type: 'string', enum: ['medium', 'small', 'mini'], description: '尺寸' },
    defaultValue: { type: 'array', items: { type: ['string', 'number', 'boolean'] }, description: '默认值（数组）' }
  },
  required: [...BaseInputComponentSchema.required, 'options'],
  description: '多选框组组件（a-checkbox-group）'
}

/**
 * Switch 开关 Schema
 */
export const SwitchSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'a-switch' },
    tagIcon: { type: 'string', const: 'switch' },
    activeText: { type: 'string', description: '打开时的文字描述' },
    inactiveText: { type: 'string', description: '关闭时的文字描述' },
    activeColor: { type: 'string', description: '打开时背景颜色' },
    inactiveColor: { type: 'string', description: '关闭时背景颜色' },
    activeValue: { description: '打开时的值', default: true },
    inactiveValue: { description: '关闭时的值', default: false },
    defaultValue: { type: 'boolean', description: '默认值' }
  },
  required: BaseInputComponentSchema.required,
  description: '开关组件（a-switch）'
}

/**
 * DatePicker 日期选择器 Schema
 */
export const DatePickerSchema = {
  type: 'object',
  properties: {
    ...BaseInputComponentSchema.properties,
    tag: { type: 'string', const: 'a-date-picker' },
    tagIcon: { type: 'string', const: 'date' },
    type: { type: 'string', enum: ['date', 'datetime', 'week', 'month', 'year'], description: '选择器类型' },
    format: { type: 'string', description: '显示格式，如 YYYY-MM-DD' },
    valueFormat: { type: 'string', description: "值格式；特殊值 'format' 表示用 format 字段的值（渲染时跳过该字段）" },
    placeholder: { type: 'string', description: '占位文本' },
    clearable: { type: 'boolean', description: '是否可清空（设计器默认 true）' },
    readonly: { type: 'boolean', description: '是否只读' },
    'start-placeholder': { type: 'string', description: '范围选择开始日期占位文本' },
    'end-placeholder': { type: 'string', description: '范围选择结束日期占位文本' },
    'range-separator': { type: 'string', description: '范围选择分隔符' },
    defaultValue: { type: 'string', description: '默认值' }
  },
  required: [...BaseInputComponentSchema.required, 'type'],
  description: '日期选择组件（a-date-picker）'
}

/**
 * Button 按钮 Schema
 */
export const ButtonSchema = {
  type: 'object',
  properties: {
    // 内部标识
    __key: { type: 'string', description: '内部渲染 key' },
    formId: { type: 'integer', description: '组件唯一 id' },
    renderKey: { type: ['integer', 'string'], description: '画布渲染键' },
    // 按钮字段
    label: { type: 'string', description: '按钮文本' },
    type: { type: 'string', enum: ['primary', 'success', 'warning', 'danger', 'info', 'default'], description: '按钮类型' },
    size: { type: 'string', enum: ['medium', 'small', 'mini'], description: '尺寸' },
    icon: { type: 'string', description: '图标类名' },
    disabled: { type: 'boolean', description: '是否禁用' },
    tag: { type: 'string', const: 'a-button' },
    tagIcon: { type: 'string', const: 'button' },
    span: { type: 'integer', minimum: 1, maximum: 24, description: '栅格占位' },
    layout: { type: 'string', const: 'colFormItem', description: '布局类型' },
    labelWidth: { type: ['integer', 'null'], description: '标签宽度(px)' },
    changeTag: { type: 'boolean', description: '是否可切换类型' },
    defaultValue: { type: 'string', description: '默认值（按钮文本）' },
    vModel: { type: 'string', description: '绑定字段名（按钮一般不需要）' },
    document: { type: 'string', description: '组件文档路径' }
  },
  required: ['label', 'tag', 'span', 'layout', 'formId', '__key', 'renderKey'],
  description: '按钮组件（a-button）'
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

// ==================== 容器与表单 Schema ====================

/**
 * RowComponent 行容器 Schema
 */
export const RowComponentSchema = {
  type: 'object',
  properties: {
    __key: { type: 'string', description: '内部渲染 key' },
    formId: { type: 'integer', description: '组件唯一 id' },
    renderKey: { type: ['integer', 'string'], description: '画布渲染键' },
    type: { type: 'string', enum: ['default', 'flex'], description: '行布局类型' },
    tag: { type: 'string', const: 'a-row', description: '渲染标签' },
    tagIcon: { type: 'string', const: 'row', description: '图标标识' },
    label: { type: 'string', description: '行标题' },
    span: { type: 'integer', description: '行占位', default: 24 },
    gutter: { type: 'integer', description: '列间距(px)', default: 0 },
    justify: { type: 'string', enum: ['start', 'end', 'center', 'space-around', 'space-between'], description: '水平排列方式' },
    align: { type: 'string', enum: ['top', 'middle', 'bottom'], description: '垂直排列方式' },
    layout: { type: 'string', const: 'rowFormItem', description: '布局类型，行容器固定为 rowFormItem' },
    layoutTree: { type: 'boolean', const: true, description: '是否为树形布局容器' },
    componentName: { type: 'string', description: '组件名称（行容器内唯一）' },
    regList: { type: 'array', items: RegListSchema, description: '校验规则（行容器一般为空）' },
    document: { type: 'string', description: '组件文档路径' },
    children: { type: 'array', items: FormComponentSchema, description: '行内子组件列表' }
  },
  required: ['tag', 'layout', 'layoutTree', 'children', 'formId', '__key', 'renderKey'],
  description: '行容器组件（a-row），用于放置输入组件'
}

/**
 * SearchForm 查询表单 Schema
 *
 * 顶层不再有 tag 字段；formRef / formModel / formRules / size 等配置直接平铺。
 */
export const SearchFormSchema = {
  type: 'object',
  properties: {
    formRef: { type: 'string', description: '表单 ref 标识（生成代码时作为标识符）', default: 'aFormRef' },
    formModel: { type: 'string', description: '表单数据对象名', default: 'formData' },
    formRules: { type: 'string', description: '校验规则对象名', default: 'rules' },
    size: { type: 'string', enum: ['medium', 'small', 'mini'], description: '表单组件尺寸（medium 渲染时映射为 middle，mini 映射为 small）' },
    labelPosition: { type: 'string', enum: ['left', 'right', 'top'], description: '标签对齐方式' },
    labelWidth: { type: 'integer', description: '标签宽度(px)', default: 100 },
    gutter: { type: 'integer', description: '栅格间距(px)', default: 0 },
    disabled: { type: 'boolean', description: '是否禁用整表' },
    span: { type: 'integer', description: '默认栅格占位', default: 24 },
    formBtns: { type: 'boolean', description: '是否显示查询 / 重置按钮' },
    unFocusedComponentBorder: { type: 'boolean', description: '画布上未聚焦的组件是否保留虚线边框' },
    fields: { type: 'array', items: RowComponentSchema, description: '表单字段列表（树形结构）' }
  },
  required: ['formRef', 'formModel', 'formRules', 'fields'],
  description: '查询表单配置对象'
}

// ==================== 数据校验函数 ====================

/** 全部合法的 a-xxx 输入组件 tag 列表 */
const VALID_INPUT_TAGS = ['a-input', 'a-input-number', 'a-select', 'a-radio-group', 'a-checkbox-group', 'a-switch', 'a-date-picker', 'a-button']

/** a-date-picker 合法 type 列表（与 types.ts DatePickerType 对齐） */
const VALID_DATE_TYPES = ['date', 'datetime', 'week', 'month', 'year']

/** 顶层 formConf 中必须为非空字符串的字段 */
const REQUIRED_FORM_STRINGS = ['formRef', 'formModel', 'formRules']

/**
 * 校验查询表单数据：收集所有错误后一次性返回，避免 LLM 反复重试
 *
 * @param searchForm - 查询表单对象，不可为空
 * @returns string | undefined - 错误信息（多条用换行分隔），undefined 表示校验通过
 */
export function validateSearchForm(searchForm: any): string | undefined {
  if (!searchForm || typeof searchForm !== 'object') {
    return 'searchForm 必须是对象类型'
  }
  const errors: string[] = []

  // 顶层 formRef / formModel / formRules 必填字符串
  for (const key of REQUIRED_FORM_STRINGS) {
    if (!searchForm[key] || typeof searchForm[key] !== 'string') {
      errors.push(`${key} 必须是非空字符串`)
    }
  }

  // fields 必须是数组
  if (!Array.isArray(searchForm.fields)) {
    errors.push('searchForm.fields 必须是数组')
    return errors.join('\n')
  }

  // 收集所有行的错误而不是只取第一个
  searchForm.fields.forEach((row: any, i: number) => {
    const rowError = validateRowComponent(row, i)
    if (rowError) {
      errors.push(`fields[${i}]: ${rowError}`)
    }
  })

  return errors.length ? errors.join('\n') : undefined
}

/**
 * 校验行容器组件：收集 tag / layout / children 的错误，并遍历全部子组件
 *
 * @param row - 行容器对象，不可为空
 * @param index - 行索引，不可为空
 * @returns string | undefined - 错误信息（多条用换行分隔），undefined 表示校验通过
 */
function validateRowComponent(row: any, index: number): string | undefined {
  if (!row || typeof row !== 'object') {
    return `searchForm.fields[${index}] 必须是对象类型`
  }
  const errors: string[] = []

  // tag 必须是 a-row
  if (row.tag !== 'a-row') {
    errors.push(`tag 必须是 "a-row"，当前为 ${row.tag}`)
  }

  // layout 必须是 rowFormItem
  if (row.layout !== 'rowFormItem') {
    errors.push(`layout 必须是 "rowFormItem"，当前为 ${row.layout}`)
  }

  // children 必须是数组
  if (!Array.isArray(row.children)) {
    errors.push('children 必须是数组')
    return errors.join('\n')
  }

  // 收集所有子组件的错误而不是只取第一个
  row.children.forEach((child: any, j: number) => {
    const childError = validateFormComponent(child, index, j)
    if (childError) {
      errors.push(`children[${j}]: ${childError}`)
    }
  })

  return errors.length ? errors.join('\n') : undefined
}

/**
 * 校验表单组件
 *
 * @param component - 表单组件对象，不可为空
 * @param rowIndex - 行索引，不可为空
 * @param childIndex - 子组件索引，不可为空
 * @returns string | undefined - 错误信息（多条用换行分隔），undefined 表示校验通过
 */
function validateFormComponent(component: any, rowIndex: number, childIndex: number): string | undefined {
  if (!component || typeof component !== 'object') {
    return `searchForm.fields[${rowIndex}].children[${childIndex}] 必须是对象类型`
  }
  const errors: string[] = []

  // 通用字段校验
  errors.push(...validateCommonFields(component))

  // 选项类组件 options 校验
  if (['a-select', 'a-radio-group', 'a-checkbox-group'].includes(component.tag)) {
    errors.push(...validateOptionsField(component))
  }

  // DatePicker type 校验
  if (component.tag === 'a-date-picker') {
    errors.push(...validateDatePickerType(component))
  }

  return errors.length ? errors.join('\n') : undefined
}

/**
 * 校验输入组件通用字段（tag / layout / span / vModel）
 *
 * @param component - 表单组件对象
 * @returns string[] - 错误信息数组（可能为空）
 */
function validateCommonFields(component: any): string[] {
  const errors: string[] = []
  if (!VALID_INPUT_TAGS.includes(component.tag)) {
    errors.push(`tag 必须是 ${VALID_INPUT_TAGS.join('/')} 之一，当前为 ${component.tag}`)
  }
  if (component.layout !== 'colFormItem') {
    errors.push(`layout 必须是 "colFormItem"，当前为 ${component.layout}`)
  }
  if (typeof component.span !== 'number' || component.span < 1 || component.span > 24) {
    errors.push('span 必须是 1-24 之间的整数')
  }
  // 非按钮组件必须有 vModel
  if (component.tag !== 'a-button' && (!component.vModel || typeof component.vModel !== 'string')) {
    errors.push('vModel 必须是非空字符串')
  }
  return errors
}

/**
 * 校验 options 字段（a-select / a-radio-group / a-checkbox-group）
 *
 * @param component - 表单组件对象
 * @returns string[] - 错误信息数组（可能为空）
 */
function validateOptionsField(component: any): string[] {
  const errors: string[] = []
  if (!Array.isArray(component.options)) {
    errors.push('options 必须是数组')
    return errors
  }
  component.options.forEach((opt: any, k: number) => {
    if (!opt || opt.label === undefined || opt.value === undefined) {
      errors.push(`options[${k}] 必须包含 label 和 value`)
    }
  })
  return errors
}

/**
 * 校验 DatePicker type 字段
 *
 * @param component - 表单组件对象
 * @returns string[] - 错误信息数组（可能为空）
 */
function validateDatePickerType(component: any): string[] {
  const errors: string[] = []
  if (!VALID_DATE_TYPES.includes(component.type)) {
    errors.push(`type 必须是 ${VALID_DATE_TYPES.join('/')} 之一，当前为 ${component.type}`)
  }
  return errors
}

// ==================== 模板生成函数 ====================

/** 模板组件 formId 计数器，确保同一模板内 formId 唯一 */
let templateFormIdCounter = 0

/**
 * 获取下一个模板 formId（每次 getSearchFormTemplate 调用前会重置计数器）
 *
 * @returns number - 自增的 formId
 */
function nextTemplateFormId(): number {
  return ++templateFormIdCounter
}

/** 输入组件公共字段，用于 COMPONENT_TEMPLATE_MAP 中各工厂函数 */
const TEMPLATE_BASE_FIELDS = {
  span: 24,
  labelWidth: null,
  disabled: false,
  required: false,
  changeTag: true,
  regList: [] as any[]
}

/**
 * 各组件类型到默认模板的映射，用于 getSearchFormTemplate 按类型生成组件示例
 */
const COMPONENT_TEMPLATE_MAP: Record<string, (vModel: string, label: string) => any> = {
  input: (vModel, label) => ({
    __key: `a-input-${vModel}`,
    formId: nextTemplateFormId(),
    renderKey: nextTemplateFormId(),
    tag: 'a-input',
    tagIcon: 'input',
    label,
    vModel,
    placeholder: `请输入${label}`,
    defaultValue: undefined,
    span: TEMPLATE_BASE_FIELDS.span,
    labelWidth: TEMPLATE_BASE_FIELDS.labelWidth,
    style: { width: '100%' },
    clearable: true,
    prepend: '',
    append: '',
    prefixIcon: '',
    suffixIcon: '',
    maxlength: undefined,
    showWordLimit: false,
    readonly: false,
    disabled: TEMPLATE_BASE_FIELDS.disabled,
    required: TEMPLATE_BASE_FIELDS.required,
    regList: [...TEMPLATE_BASE_FIELDS.regList],
    changeTag: TEMPLATE_BASE_FIELDS.changeTag,
    document: 'https://www.antdv.com/components/input-cn'
  }),

  inputNumber: (vModel, label) => ({
    __key: `a-input-number-${vModel}`,
    formId: nextTemplateFormId(),
    renderKey: nextTemplateFormId(),
    tag: 'a-input-number',
    tagIcon: 'number',
    label,
    vModel,
    placeholder: `请输入${label}`,
    defaultValue: undefined,
    span: TEMPLATE_BASE_FIELDS.span,
    labelWidth: TEMPLATE_BASE_FIELDS.labelWidth,
    style: { width: '100%' },
    min: undefined,
    max: undefined,
    step: undefined,
    stepStrictly: false,
    precision: undefined,
    controlsPosition: '',
    disabled: TEMPLATE_BASE_FIELDS.disabled,
    required: TEMPLATE_BASE_FIELDS.required,
    regList: [...TEMPLATE_BASE_FIELDS.regList],
    changeTag: TEMPLATE_BASE_FIELDS.changeTag,
    document: 'https://www.antdv.com/components/input-number-cn'
  }),

  select: (vModel, label) => ({
    __key: `a-select-${vModel}`,
    formId: nextTemplateFormId(),
    renderKey: nextTemplateFormId(),
    tag: 'a-select',
    tagIcon: 'select',
    label,
    vModel,
    placeholder: `请选择${label}`,
    defaultValue: undefined,
    span: TEMPLATE_BASE_FIELDS.span,
    labelWidth: TEMPLATE_BASE_FIELDS.labelWidth,
    style: { width: '100%' },
    multiple: false,
    clearable: true,
    filterable: false,
    options: [],
    disabled: TEMPLATE_BASE_FIELDS.disabled,
    required: TEMPLATE_BASE_FIELDS.required,
    regList: [...TEMPLATE_BASE_FIELDS.regList],
    changeTag: TEMPLATE_BASE_FIELDS.changeTag,
    document: 'https://www.antdv.com/components/select-cn'
  }),

  radioGroup: (vModel, label) => ({
    __key: `a-radio-group-${vModel}`,
    formId: nextTemplateFormId(),
    renderKey: nextTemplateFormId(),
    tag: 'a-radio-group',
    tagIcon: 'radio',
    label,
    vModel,
    defaultValue: undefined,
    span: TEMPLATE_BASE_FIELDS.span,
    labelWidth: TEMPLATE_BASE_FIELDS.labelWidth,
    style: {},
    size: 'small',
    optionType: 'default',
    border: false,
    disabled: TEMPLATE_BASE_FIELDS.disabled,
    required: TEMPLATE_BASE_FIELDS.required,
    options: [],
    regList: [...TEMPLATE_BASE_FIELDS.regList],
    changeTag: TEMPLATE_BASE_FIELDS.changeTag,
    document: 'https://www.antdv.com/components/radio-cn'
  }),

  checkboxGroup: (vModel, label) => ({
    __key: `a-checkbox-group-${vModel}`,
    formId: nextTemplateFormId(),
    renderKey: nextTemplateFormId(),
    tag: 'a-checkbox-group',
    tagIcon: 'checkbox',
    label,
    vModel,
    defaultValue: [],
    span: TEMPLATE_BASE_FIELDS.span,
    labelWidth: TEMPLATE_BASE_FIELDS.labelWidth,
    style: {},
    size: 'small',
    optionType: 'default',
    border: false,
    disabled: TEMPLATE_BASE_FIELDS.disabled,
    required: TEMPLATE_BASE_FIELDS.required,
    options: [],
    regList: [...TEMPLATE_BASE_FIELDS.regList],
    changeTag: TEMPLATE_BASE_FIELDS.changeTag,
    document: 'https://www.antdv.com/components/checkbox-cn'
  }),

  switch: (vModel, label) => ({
    __key: `a-switch-${vModel}`,
    formId: nextTemplateFormId(),
    renderKey: nextTemplateFormId(),
    tag: 'a-switch',
    tagIcon: 'switch',
    label,
    vModel,
    defaultValue: false,
    span: TEMPLATE_BASE_FIELDS.span,
    labelWidth: TEMPLATE_BASE_FIELDS.labelWidth,
    style: {},
    disabled: TEMPLATE_BASE_FIELDS.disabled,
    required: TEMPLATE_BASE_FIELDS.required,
    activeText: '',
    inactiveText: '',
    activeColor: '',
    inactiveColor: '',
    activeValue: true,
    inactiveValue: false,
    regList: [...TEMPLATE_BASE_FIELDS.regList],
    changeTag: TEMPLATE_BASE_FIELDS.changeTag,
    document: 'https://www.antdv.com/components/switch-cn'
  }),

  datePicker: (vModel, label) => ({
    __key: `a-date-picker-${vModel}`,
    formId: nextTemplateFormId(),
    renderKey: nextTemplateFormId(),
    tag: 'a-date-picker',
    tagIcon: 'date',
    label,
    vModel,
    placeholder: `请选择${label}`,
    defaultValue: undefined,
    span: TEMPLATE_BASE_FIELDS.span,
    labelWidth: TEMPLATE_BASE_FIELDS.labelWidth,
    style: { width: '100%' },
    type: 'date',
    format: 'YYYY-MM-DD',
    valueFormat: 'format',
    clearable: true,
    readonly: false,
    disabled: TEMPLATE_BASE_FIELDS.disabled,
    required: TEMPLATE_BASE_FIELDS.required,
    'start-placeholder': '开始日期',
    'end-placeholder': '结束日期',
    'range-separator': '至',
    regList: [...TEMPLATE_BASE_FIELDS.regList],
    changeTag: TEMPLATE_BASE_FIELDS.changeTag,
    document: 'https://www.antdv.com/components/date-picker-cn'
  }),

  button: (vModel, label) => ({
    __key: `a-button-${vModel || 'default'}`,
    formId: nextTemplateFormId(),
    renderKey: nextTemplateFormId(),
    tag: 'a-button',
    tagIcon: 'button',
    layout: 'colFormItem',
    label: label || '查询',
    span: TEMPLATE_BASE_FIELDS.span,
    labelWidth: TEMPLATE_BASE_FIELDS.labelWidth,
    defaultValue: '查询',
    type: 'primary',
    size: 'small',
    icon: '',
    disabled: false,
    changeTag: true,
    document: 'https://www.antdv.com/components/button-cn'
  })
}

/**
 * 生成查询表单模板，包含指定类型的组件示例（ant-design-vue 格式）
 *
 * @param componentTypes - 需要的组件类型数组，如 ['input','select','datePicker']，可为空
 * @returns 完整的查询表单模板对象，含 aFormRef 外壳与指定组件
 */
export function getSearchFormTemplate(componentTypes?: string[]): any {
  // 每次生成模板前重置计数器，确保同一调用内 formId 唯一且可预测
  templateFormIdCounter = 0
  const fields: any[] = []

  if (componentTypes && componentTypes.length > 0) {
    // 每个组件类型生成一个独立的子组件，统一放到一个 RowComponent 内
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
        __key: 'a-row-row1',
        formId: nextTemplateFormId(),
        renderKey: nextTemplateFormId(),
        type: 'default',
        tag: 'a-row',
        tagIcon: 'row',
        label: '栅格布局',
        componentName: 'row1',
        span: 24,
        gutter: 0,
        justify: 'start',
        align: 'top',
        layout: 'rowFormItem',
        layoutTree: true,
        regList: [],
        document: '',
        children
      })
    }
  }

  return {
    formRef: 'aFormRef',
    formModel: 'formData',
    formRules: 'rules',
    size: 'medium',
    labelPosition: 'right',
    labelWidth: 100,
    gutter: 0,
    disabled: false,
    span: 24,
    formBtns: true,
    fields
  }
}

// ==================== 数据规范化函数 ====================

/** 设计器 a-xxx 组件除公共字段外的特有布尔属性 */
const TAG_BOOLEAN_FIELDS: Record<string, string[]> = {
  'a-input': ['clearable', 'readonly', 'showWordLimit'],
  'a-input-number': ['stepStrictly'],
  'a-select': ['clearable', 'multiple', 'filterable'],
  'a-radio-group': ['border'],
  'a-checkbox-group': ['border'],
  'a-switch': [],
  'a-date-picker': ['clearable'],
  'a-button': []
}

/** 输入组件公共布尔属性 */
const COMMON_BOOLEAN_FIELDS = ['disabled', 'required', 'changeTag']

/**
 * 规范化查询表单数据：补齐布尔字段默认值（防止后端 NPE）
 *
 * @param searchForm - 查询表单对象，可为空
 * @returns 规范化后的查询表单对象
 */
export function normalizeSearchForm(searchForm: any): any {
  if (!searchForm || typeof searchForm !== 'object') return searchForm

  // 补齐顶层布尔属性默认值
  if (searchForm.disabled === undefined || searchForm.disabled === null) searchForm.disabled = false
  if (searchForm.formBtns === undefined || searchForm.formBtns === null) searchForm.formBtns = true

  // 补齐 fields 中每个行容器的默认字段
  if (Array.isArray(searchForm.fields)) {
    for (const row of searchForm.fields) {
      if (!row || typeof row !== 'object') continue
      normalizeRowComponent(row)
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
 * 规范化行容器：补齐 gutter / span 等默认字段
 *
 * @param row - 行容器对象，可为空
 * @returns 规范化后的行容器对象
 */
function normalizeRowComponent(row: any): any {
  if (!row || typeof row !== 'object') return row
  if (row.gutter === undefined || row.gutter === null) row.gutter = 0
  if (row.span === undefined || row.span === null) row.span = 24
  return row
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
  fillBooleanDefaults(component, COMMON_BOOLEAN_FIELDS)

  // 组件特有布尔属性
  const tagBooleans = TAG_BOOLEAN_FIELDS[component.tag]
  if (tagBooleans) {
    fillBooleanDefaults(component, tagBooleans)
  }

  return component
}

/**
 * 将组件对象中指定字段为 undefined / null 的位置补为 false
 *
 * @param component - 表单组件对象
 * @param fields - 需要补默认值的字段名列表
 */
function fillBooleanDefaults(component: any, fields: string[]): void {
  for (const field of fields) {
    if (component[field] === undefined || component[field] === null) {
      component[field] = false
    }
  }
}
