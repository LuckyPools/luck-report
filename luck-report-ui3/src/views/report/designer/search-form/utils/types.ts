/**
 * 查询表单设计器共用类型定义
 *
 * 改造说明：
 * - 由原 utils/*.js 中散落的 JSDoc 抽出集中维护
 * - 既是「设计器内」配置 / 渲染 / 代码生成的契约，也是「画布预览」render.tsx 的 props 类型
 * - tag 字段已统一为 ant-design-vue 的 a-xxx 命名
 *
 * 字段命名规范：
 * - 与 ant-design-vue 4.x prop 名称对齐（如 prefixIcon、activeValue、optionType）
 * - 保留对老数据的兼容：缺失字段视为 undefined，不抛错
 */

/** ant-design-vue Form size 枚举 */
export type AntFormSize = 'small' | 'middle' | 'large'

/** 设计器内部仍沿用 medium/small/mini；该联合仅用于右侧面板配置项，输出与渲染时映射到 a-* size */
export type DesignerFormSize = 'medium' | 'small' | 'mini'

/** ant-design-vue Form labelPosition */
export type AntLabelPosition = 'left' | 'right' | 'top'

/** 行容器（a-row）的水平排列 */
export type AntJustify = 'start' | 'end' | 'center' | 'space-around' | 'space-between'

/** 行容器（a-row）的垂直排列 */
export type AntAlign = 'top' | 'middle' | 'bottom'

/** 行容器布局模式 */
export type RowLayoutType = 'default' | 'flex'

/** 日期选择器类型 */
export type DatePickerType = 'date' | 'week' | 'month' | 'year' | 'datetime'

/** 单/多选项的呈现形态 */
export type OptionType = 'default' | 'button'

/** 字段在画布中的布局类型 */
export type LayoutType = 'colFormItem' | 'rowFormItem'

/** 代码生成类型：file = 独立页面；dialog = 弹窗 */
export type CodeType = 'file' | 'dialog'

/**
 * 表单整体配置（对应 formConf）
 * - formRef / formModel / formRules 三个字段会在生成代码时作为标识符插入
 */
export interface FormConf {
  formRef: string
  formModel: string
  formRules: string
  /** 旧 enum 兼容：medium/small/mini；写入与生成时做映射 */
  size: DesignerFormSize
  labelPosition: AntLabelPosition
  labelWidth: number
  gutter: number
  disabled: boolean
  span: number
  /** 是否生成「重置 / 查询」按钮组 */
  formBtns: boolean
  /** 画布上未聚焦的组件是否保留虚线边框 */
  unFocusedComponentBorder?: boolean
}

/** select / radio / checkbox / cascader 选项 */
export interface SelectOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
  /** 级联选择子选项 */
  children?: SelectOption[]
}

/** 正则校验规则；pattern 保留为字符串，生成代码时 new RegExp(eval 改为静态字符串) */
export interface RegRule {
  pattern: string
  message: string
}

/**
 * 字段统一结构
 * - tag 形如 a-input / a-select / a-radio-group / a-checkbox-group / a-switch / a-date-picker / a-button / a-row
 * - layout 形如 colFormItem / rowFormItem
 * - vModel 仅在需要双向绑定的字段上存在；row / button 没有
 * - children 仅在 layout=rowFormItem 时使用
 */
export interface FormField {
  /** 内部用 key（renderKey） */
  __key?: string
  /** 内部唯一 id */
  formId: number
  /** 组件标签，对应 ant-design-vue 标签名（a-xxx） */
  tag: string
  /** 图标名（设计器左侧库使用） */
  tagIcon?: string
  /** colFormItem / rowFormItem */
  layout?: LayoutType
  /** 中文标题 */
  label?: string
  /** 表单数据 key */
  vModel?: string
  placeholder?: string
  defaultValue?: unknown
  span: number
  labelWidth?: number | null
  style?: Record<string, string>
  clearable?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  multiple?: boolean
  filterable?: boolean
  options?: SelectOption[]
  min?: number
  max?: number
  step?: number
  precision?: number
  /** 兼容 a-input / a-input-number 的 prefix/suffix 字符串属性 */
  prefixIcon?: string
  suffixIcon?: string
  maxlength?: number
  showWordLimit?: boolean
  activeText?: string
  inactiveText?: string
  activeValue?: unknown
  inactiveValue?: unknown
  activeColor?: string
  inactiveColor?: string
  /** row 布局相关 */
  type?: RowLayoutType | DatePickerType | string
  format?: string
  /**
   * 与后端实体类字段对应，必须保留，值为 'format' 时表示"用 format 字段的值做值格式"。
   * 注意：antd-vue DatePicker 虽有 valueFormat prop，但期望的是 dayjs 格式串（如 'YYYY-MM-DD'），
   * 传入 'format' 会被当作 dayjs 模板，导致显示乱码（如 for57amt）。
   * 因此渲染（render.tsx）与代码生成（html.ts）均会跳过该字段，不透传给组件。
   */
  valueFormat?: 'format' | string
  optionType?: OptionType
  border?: boolean
  justify?: AntJustify
  align?: AntAlign
  gutter?: number
  /** 标记可切换组件类型（右侧面板显示「组件类型」下拉） */
  changeTag?: boolean
  /** 是否为行容器；用于右侧面板显示「布局结构树」 */
  layoutTree?: boolean
  /** row 容器名（仅 row 存在） */
  componentName?: string
  children?: FormField[]
  /** 帮助文档链接 */
  document?: string
  /** 校验规则列表 */
  regList?: RegRule[]
  /** 按钮专用 */
  icon?: string
  size?: DesignerFormSize
  /** 兼容旧 showTip */
  showTip?: boolean
  /** 允许任意扩展属性 */
  [k: string]: unknown
}

/** 设计器内部运行期输入的载荷（formConf + fields） */
export interface SearchFormPayload {
  fields: FormField[]
  formConf: FormConf
}

/** 代码生成配置（来自 code-type-dialog） */
export interface GenerateConf {
  type: CodeType
  fileName?: string
}
