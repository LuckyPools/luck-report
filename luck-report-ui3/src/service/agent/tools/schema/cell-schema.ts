/**
 * 单元格数据模型 JSON Schema 定义
 */
import { ImageValueSchema, getImageCellTemplate, validateImageValue } from './image-schema'
import { ZxingValueSchema, getQrcodeCellTemplate, getBarcodeCellTemplate, validateZxingValue } from './zxing-schema'
import { ChartValueSchema, getChartCellTemplate, validateChartValue } from './chart-schema'
import { SlashValueSchema, getSlashCellTemplate, validateSlashValue } from './slash-schema'

/** Border 边框 Schema */
export const BorderSchema = {
  type: 'object',
  properties: {
    width: { type: 'integer', description: '边框宽度，如1、2' },
    color: { type: 'string', description: '边框颜色，RGB格式如"0,0,0"', pattern: '^[0-9]+,[0-9]+,[0-9]+$' },
    style: { type: 'string', enum: ['solid', 'dashed', 'doublesolid'], description: '边框样式：实线/虚线/双实线' }
  },
  required: ['width', 'color', 'style']
}

/** CellStyle 单元格样式 Schema */
export const CellStyleSchema = {
  type: 'object',
  properties: {
    bgcolor: { type: 'string', description: '背景色，RGB格式"R,G,B"，null为透明', pattern: '^[0-9]+,[0-9]+,[0-9]+$' },
    forecolor: { type: 'string', description: '前景色（字体颜色），RGB格式如"0,0,0"' },
    fontSize: { type: 'integer', description: '字体大小，如10、12、14' },
    fontFamily: { type: 'string', description: '字体族，如"宋体"、"微软雅黑"' },
    format: { type: 'string', description: '格式化模式，如"#.##"保留两位小数' },
    lineHeight: { type: 'integer', description: '行高（CSS 倍数 = fontSize × 本值；如 fontSize=12、本值=3 时实际行高=36px），0 不设置' },
    align: { type: 'string', enum: ['left', 'center', 'right'], description: '水平对齐' },
    valign: { type: 'string', enum: ['top', 'middle', 'bottom'], description: '垂直对齐' },
    bold: { type: 'boolean', description: '是否加粗' },
    italic: { type: 'boolean', description: '是否斜体' },
    underline: { type: 'boolean', description: '是否下划线' },
    wrapCompute: { type: 'boolean', description: '是否自动换行' },
    leftBorder: { ...BorderSchema, description: '左边框' },
    rightBorder: { ...BorderSchema, description: '右边框' },
    topBorder: { ...BorderSchema, description: '上边框' },
    bottomBorder: { ...BorderSchema, description: '下边框' }
  }
}

/** SimpleValue 简单文本值 Schema */
export const SimpleValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'simple' },
    value: { type: 'string', description: '文本内容' }
  },
  required: ['type', 'value']
}

/** ExpressionValue 表达式值 Schema */
export const ExpressionValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'expression' },
    value: { type: 'string', description: '表达式源码，包含换行和空格的完整表达式文本' },
  },
  required: ['type', 'value']
}

/** DatasetCondition 数据集过滤条件 Schema */
export const DatasetConditionSchema = {
  type: 'object',
  properties: {
    left: { type: 'string', description: '左侧表达式，字段名或表达式' },
    operation: { type: 'string', description: '操作符符号，如==、<、>、<=' },
    right: { type: 'string', description: '右侧表达式，比较值' },
    join: { type: 'string', enum: ['and', 'or'], description: '条件连接方式' },
    type: { type: 'string', description: '条件类型，如property表示属性条件' }
  }
}

/** DatasetValue 数据集值 Schema */
export const DatasetValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'dataset' },
    datasetName: { type: 'string', description: '数据集名称，必须为报表中已定义的数据集' },
    property: { type: 'string', description: '字段名称，必须为数据集中的字段名' },
    aggregate: {
      type: 'string',
      enum: ['select', 'group', 'customgroup', 'regroup', 'reselect', 'sum', 'count', 'max', 'min', 'avg'],
      description: '聚合方式：select/group/customgroup/regroup/reselect支持展开，sum/count/max/min/avg返回单值'
    },
    order: { type: 'string', enum: ['none', 'asc', 'desc'], description: '排序方式，仅select/group等聚合可用' },
    value: { type: 'string', description: '表达式值字符串，如"orders.group(price)"' },
    conditions: {
      type: 'array',
      description: '过滤条件列表，支持链式嵌套结构',
      items: DatasetConditionSchema
    },
    groupItems: {
      type: 'array',
      description: '自定义分组项列表，当aggregate为customgroup时使用',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '分组名称，只允许英文+字符串的组合' },
          conditions: { type: 'array', description: '分组条件列表', items: DatasetConditionSchema }
        }
      }
    },
    mappingType: { type: 'string', enum: ['simple', 'dataset'], description: '数据映射类型，仅group/select聚合可用' },
    mappingItems: {
      type: 'array',
      description: '简单映射项列表，当mappingType为simple时使用',
      items: {
        type: 'object',
        properties: {
          value: { type: 'string', description: '实际值' },
          label: { type: 'string', description: '显示值' }
        }
      }
    },
    mappingDataset: { type: 'string', description: '数据集映射-数据集名称，当mappingType为dataset时使用' },
    mappingKeyProperty: { type: 'string', description: '数据集映射-键字段' },
    mappingValueProperty: { type: 'string', description: '数据集映射-值字段' }
  },
  required: ['type', 'datasetName', 'aggregate', 'property'],
  description: '数据集值对象，通过聚合方式从数据集提取数据'
}

/** LinkParameter 链接参数 Schema */
export const LinkParameterSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '参数名，只允许英文+字符串的组合' },
    value: { type: 'string', description: '参数值，可为表达式' }
  },
  required: ['name', 'value']
}

/** Condition 条件对象 Schema */
export const ConditionSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['property', 'expression', 'cell', 'current'],
      description: '条件类型：property-属性条件(比较数据集字段值)，expression-表达式条件(左右均为表达式)，cell-单元格条件(比较指定单元格的值)，current-当前值条件(比较当前单元格自身值)'
    },
    left: { type: 'string', nullable: true, description: '左侧表达式，type为property时为字段名，type为cell时为单元格名称，type为current（推荐改写为property）时为null' },
    operation: {
      type: 'string',
      enum: ['>', '>=', '<', '<=', '==', '!=', 'in', 'not in', 'like'],
      description: '比较运算符符号，如 >、>=、<、<=、==、!=、in、not in、like'
    },
    right: { type: 'string', description: '右侧比较值' },
    join: { type: 'string', enum: ['and', 'or', null], description: '条件连接方式，多个条件时使用and或or连接' }
  },
  required: ['type', 'right']
}

/** ConditionCellStyle 条件样式 Schema */
export const ConditionCellStyleSchema = {
  type: 'object',
  properties: {
    ...CellStyleSchema.properties,
    bgcolorScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '背景色作用范围：cell-仅当前单元格，row-当前单元格所在整行，column-当前单元格所在整列' },
    forecolorScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '前景色作用范围' },
    fontSizeScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '字体大小作用范围' },
    fontFamilyScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '字体族作用范围' },
    alignScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '水平对齐作用范围' },
    valignScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '垂直对齐作用范围' },
    boldScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '加粗作用范围' },
    italicScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '斜体作用范围' },
    underlineScope: { type: 'string', enum: ['cell', 'row', 'column'], description: '下划线作用范围' }
  },
  description: '条件样式对象，继承CellStyle并增加样式作用范围属性'
}

/** Paging 分页配置 Schema */
export const PagingSchema = {
  type: 'object',
  properties: {
    position: { type: 'string', enum: ['before', 'after'], description: '分页位置：before-之前分页，after-之后分页' },
    line: { type: 'integer', description: '分页行数，0表示不分页' }
  },
  description: '分页配置对象，满足条件时触发分页'
}

/** ConditionPropertyItem 条件属性项 Schema */
export const ConditionPropertyItemSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '条件名称，如"condition1"，只允许英文+字符串的组合' },
    conditions: {
      type: 'array',
      items: ConditionSchema,
      description: '条件列表，条件之间通过join连接，空数组表示无条件限制'
    },
    rowHeight: { type: 'integer', description: '行高，0表示不修改' },
    colWidth: { type: 'integer', description: '列宽，0表示不修改' },
    newValue: { type: 'string', description: '新值，满足条件时替换单元格值，null表示不修改' },
    linkUrl: { type: 'string', description: '链接地址，满足条件时设置单元格链接' },
    linkTargetWindow: { type: 'string', enum: ['_blank', null], description: '链接打开方式' },
    linkParameters: { type: 'array', items: LinkParameterSchema, description: '链接参数列表' },
    cellStyle: { ...ConditionCellStyleSchema, description: '条件样式，满足条件时应用的样式' },
    paging: { ...PagingSchema, description: '分页配置，满足条件时触发分页' },
    expr: { type: 'string', description: '条件表达式（已废弃）' }
  },
  required: ['name', 'conditions']
}

/** CellPosition 单元格坐标 Schema */
export const CellPositionSchema = {
  type: 'object',
  properties: {
    row: { type: 'integer', description: '行号，从1开始', minimum: 1 },
    col: { type: 'integer', description: '列号，从1开始', minimum: 1 }
  },
  required: ['row', 'col'],
  description: '单元格坐标，row/col从1开始'
}

/**
 * 生成简单文本单元格模板
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @returns 符合规范的单元格模板对象
 */
export function getSimpleCellTemplate(rowIndex: number, colIndex: number): object {
  const rowNumber = rowIndex + 1
  const colNumber = colIndex + 1
  const colLetter = String.fromCharCode(65 + colIndex)

  return {
    rowNumber,
    columnNumber: colNumber,
    rowSpan: 0,
    colSpan: 0,
    name: `${colLetter}${rowNumber}`,
    value: {
      value: '',
      type: 'simple'
    },
    cellStyle: {
      bgcolor: null,
      forecolor: '0,0,0',
      fontSize: 10,
      fontFamily: '宋体',
      format: null,
      lineHeight: 0,
      align: 'center',
      valign: 'middle',
      bold: null,
      italic: null,
      underline: null,
      wrapCompute: null,
      leftBorder: null,
      rightBorder: null,
      topBorder: null,
      bottomBorder: null
    },
    linkUrl: null,
    linkTargetWindow: null,
    linkParameters: null,
    fillBlankRows: false,
    multiple: 0,
    expand: 'None',
    leftParentCellName: null,
    topParentCellName: null
  }
}

/**
 * 生成数据集单元格模板
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @param datasetName - 数据集名称
 * @param property - 字段名
 * @param aggregate - 聚合方式
 * @returns 符合规范的单元格模板对象
 */
export function getDatasetCellTemplate(
  rowIndex: number,
  colIndex: number,
  datasetName: string,
  property: string,
  aggregate: string = 'group'
): object {
  const baseCell = getSimpleCellTemplate(rowIndex, colIndex) as any
  baseCell.value = {
    expr: null,
    datasetName,
    aggregate,
    property,
    groupItems: null,
    mappingType: 'simple',
    mappingDataset: null,
    mappingKeyProperty: null,
    mappingValueProperty: null,
    mappingItems: null,
    conditions: null,
    order: 'none',
    value: `${datasetName}.${aggregate}(${property})`,
    type: 'dataset'
  }
  if (aggregate === 'group' || aggregate === 'select') {
    baseCell.expand = 'Down'
    baseCell.topParentCellName = 'root'
  }
  return baseCell
}

/**
 * 生成表达式单元格模板
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @param expression - 表达式内容
 * @returns 符合规范的单元格模板对象
 */
export function getExpressionCellTemplate(rowIndex: number, colIndex: number, expression: string = ''): object {
  const baseCell = getSimpleCellTemplate(rowIndex, colIndex) as any
  baseCell.value = {
    value: expression,
    type: 'expression'
  }
  return baseCell
}

/**
 * 根据值类型获取单元格模板，覆盖全部 7 种单元格类型
 * @param type - 值类型
 * @param rowIndex - 行索引
 * @param colIndex - 列索引
 * @param options - 可选参数（按 type 含义不同）
 * @returns 单元格模板对象
 */
export function getCellTemplateByType(
  type: string,
  rowIndex: number,
  colIndex: number,
  options?: {
    datasetName?: string;
    property?: string;
    aggregate?: string;
    expression?: string;
    imagePath?: string;
    qrcodeText?: string;
    barcodeText?: string;
    barcodeFormat?: string;
    chartType?: 'bar' | 'horizontalBar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea' | 'scatter' | 'bubble';
    chartCategoryProperty?: string;
    chartValueProperty?: string;
  }
): object {
  switch (type) {
    case 'simple':
      return getSimpleCellTemplate(rowIndex, colIndex)
    case 'dataset':
      return getDatasetCellTemplate(
        rowIndex,
        colIndex,
        options?.datasetName || 'dataset_name',
        options?.property || 'field_name',
        options?.aggregate || 'group'
      )
    case 'expression':
      return getExpressionCellTemplate(rowIndex, colIndex, options?.expression || '')
    case 'image':
      return getImageCellTemplate(rowIndex, colIndex, options?.imagePath || '')
    case 'chart':
      return getChartCellTemplate(
        rowIndex,
        colIndex,
        options?.datasetName || '',
        options?.chartCategoryProperty || '',
        options?.chartValueProperty || '',
        options?.chartType || 'pie'
      )
    case 'slash':
      return getSlashCellTemplate(rowIndex, colIndex)
    case 'zxing':
      if ((options as any)?.zxingCategory === 'barcode') {
        return getBarcodeCellTemplate(rowIndex, colIndex, options?.barcodeText || '', options?.barcodeFormat || 'AZTEC')
      }
      return getQrcodeCellTemplate(rowIndex, colIndex, options?.qrcodeText || '')
    default:
      return getSimpleCellTemplate(rowIndex, colIndex)
  }
}

/** 支持条件属性的单元格类型 */
export const CONDITION_SUPPORTED_TYPES = ['expression', 'dataset'] as const

/** 支持的操作符数组 */
export const OPERATION_ARRAY: string[] = ['>', '>=', '<', '<=', '==', '!=', 'in', 'not in', 'like']

/**
 * 校验条件属性项结构，收集所有错误一次性返回
 * @param items - 条件属性项数组
 * @returns 错误信息，undefined 表示通过
 */
function validateConditionPropertyItems(items: any): string | undefined {
  if (!Array.isArray(items)) {
    return '必须是数组'
  }
  const errors: string[] = []
  for (let i = 0; i < items.length; i++) {
    const itemError = validateConditionPropertyItem(items[i])
    if (itemError) {
      errors.push(`第${i}项: ${itemError}`)
    }
  }
  return errors.length ? errors.join('\n') : undefined
}

/**
 * 校验单个条件属性项结构，收集该条件项下所有错误
 * @param item - 条件属性项
 * @returns 错误信息，undefined 表示通过
 */
function validateConditionPropertyItem(item: any): string | undefined {
  if (!item || typeof item !== 'object') {
    return '必须是对象'
  }
  const errors: string[] = []
  if (typeof item.name !== 'string' || item.name.trim() === '') {
    errors.push('name 必须是非空字符串')
  }
  if (!Array.isArray(item.conditions)) {
    errors.push('conditions 必须是数组')
  } else {
    for (let j = 0; j < item.conditions.length; j++) {
      const condError = validateCondition(item.conditions[j], j, item.conditions)
      if (condError) {
        errors.push(`conditions[${j}]: ${condError}`)
      }
    }
  }
  return errors.length ? errors.join('\n') : undefined
}

/**
 * 校验单个条件结构，收集单条条件下所有字段的错误一次性返回
 * @param cond - 条件对象
 * @param index - 在 conditions 数组中的索引
 * @param allConditions - 完整 conditions 数组，用于校验 join 位置
 * @returns 错误信息（多条用换行分隔），undefined 表示通过
 */
function validateCondition(cond: any, index: number, allConditions: any[]): string | undefined {
  if (!cond || typeof cond !== 'object') {
    return '必须是对象'
  }
  const errors: string[] = []
  const validTypes = ['property', 'expression', 'cell', 'current']
  if (!validTypes.includes(cond.type)) {
    errors.push(`type 必须是 ${validTypes.join('/')} 之一，当前为 ${cond.type}`)
  }
  // operation 必须为合法操作符
  const validOperations = OPERATION_ARRAY
  if (!validOperations.includes(cond.operation)) {
    errors.push(`operation 必须是 ${validOperations.join('/')} 之一，当前为 ${cond.operation}`)
  }
  if (cond.right == null || cond.right === '') {
    errors.push('right 不能为空')
  }
  // join：第一个条件 join 必须为 null，其余位置必须是 and/or
  if (index === 0 && cond.join != null) {
    errors.push('第一个条件的 join 必须为 null')
  }
  if (index > 0 && cond.join != null && !['and', 'or'].includes(cond.join)) {
    errors.push(`join 必须是 and/or 之一，当前为 ${cond.join}`)
  }
  return errors.length ? errors.join('\n') : undefined
}

/**
 * 规范化条件属性项数组，补齐 operation/left/join 等缺失字段
 * @param items - 条件属性项数组
 * @returns 规范化后的条件属性项数组
 */
function normalizeConditionPropertyItems(items: any[]): any[] {
  return items.map(item => normalizeConditionPropertyItem(item))
}

/**
 * 规范化单个条件属性项
 * @param item - 条件属性项
 * @returns 规范化后的条件属性项
 */
function normalizeConditionPropertyItem(item: any): any {
  const conditions = Array.isArray(item.conditions) ? item.conditions : []
  return {
    name: typeof item.name === 'string' ? item.name : '',
    conditions: conditions.map((c: any, i: number, arr: any[]) => normalizeCondition(c, i, arr)),
    rowHeight: typeof item.rowHeight === 'number' ? item.rowHeight : 0,
    colWidth: typeof item.colWidth === 'number' ? item.colWidth : 0,
    newValue: item.newValue ?? null,
    linkUrl: item.linkUrl ?? null,
    linkTargetWindow: item.linkTargetWindow ?? null,
    linkParameters: Array.isArray(item.linkParameters) ? item.linkParameters : null,
    cellStyle: item.cellStyle ?? null,
    paging: item.paging ?? null,
    expr: item.expr ?? null
  }
}

/**
 * 规范化单个条件对象，补齐 operation/left/join 等字段
 * @param cond - 原始条件
 * @param index - 在 conditions 数组中的索引
 * @returns 规范化后的条件对象
 */
function normalizeCondition(cond: any, index: number): any {
  // type: 'current' 改写为 'property'，与设计器写入行为一致
  let type = cond.type
  if (type === 'current') {
    type = 'property'
  }

  let operation = cond.operation ?? null

  // left 缺省值
  let left = cond.left
  if (left == null && type === 'property') {
    left = null
  }

  // join：第一个条件必须为 null，后续条件兜底为 and
  let join = cond.join
  if (index === 0) {
    join = null
  } else if (join == null) {
    join = 'and'
  }

  return {
    type,
    left: left ?? null,
    operation,
    right: cond.right ?? '',
    join
  }
}

/**
 * 生成单个条件对象的模板
 * @param index - 在 conditions 数组中的索引，决定 join 默认值
 * @param type - 条件类型：property/expression/cell/current
 * @param left - 左侧值：property 传字段名/cell 传单元格名/current 传 null
 * @param operation - 比较运算符符号，如 >、>=、<、<=、==、!=、in、not in、like
 * @param right - 右侧比较值
 * @param join - 条件连接方式；index=0 时强制置 null
 * @returns 符合 ConditionSchema 规范的条件对象
 */
function getConditionTemplate(
  index: number,
  type: 'property' | 'expression' | 'cell' | 'current',
  left: string | null,
  operation: string,
  right: string,
  join?: 'and' | 'or'
): Record<string, any> {
  return {
    type,
    left,
    operation,
    right,
    join: index === 0 ? null : (join ?? 'and')
  }
}

/**
 * 生成单个条件属性项的模板
 * @param name - 条件名称
 * @param conditions - 条件对象数组
 * @param cellStyle - 满足条件时应用的样式
 * @param extras - 可选扩展字段
 * @returns 符合 ConditionPropertyItemSchema 规范的条件属性项
 */
function getConditionPropertyItemTemplate(
  name: string,
  conditions: Record<string, any>[],
  cellStyle: Record<string, any> | null = null,
  extras: {
    newValue?: any;
    linkUrl?: string | null;
    linkTargetWindow?: string | null;
    linkParameters?: any[] | null;
    paging?: Record<string, any> | null;
    rowHeight?: number;
    colWidth?: number;
  } = {}
): Record<string, any> {
  return {
    name,
    conditions,
    rowHeight: extras.rowHeight ?? 0,
    colWidth: extras.colWidth ?? 0,
    newValue: extras.newValue ?? null,
    linkUrl: extras.linkUrl ?? null,
    linkTargetWindow: extras.linkTargetWindow ?? null,
    linkParameters: extras.linkParameters ?? null,
    cellStyle,
    paging: extras.paging ?? null,
    expr: null
  }
}

/**
 * 生成表达式单元格+多条件组的完整模板
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @param expression - 表达式内容
 * @returns 包含 value + conditionPropertyItems 的完整单元格模板
 */
export function getExpressionCellWithConditionTemplate(
  rowIndex: number = 0,
  colIndex: number = 0,
  expression: string = 'B4'
): Record<string, any> {
  const baseCell = JSON.parse(JSON.stringify(getExpressionCellTemplate(rowIndex, colIndex, expression)))

  baseCell.value = {
    value: expression,
    type: 'expression'
  }

  baseCell.conditionPropertyItems = [
    // 第 1 组：单条件（property，属性值等于 9 → 红色背景）
    getConditionPropertyItemTemplate(
      'group1',
      [
        getConditionTemplate(0, 'property', null, '==', '9')
      ],
      {
        bgcolor: '255,0,0',
        bgcolorScope: 'cell'
      }
    ),

    // 第 2 组：多条件 AND（current>11 AND cell(B2)==4）
    getConditionPropertyItemTemplate(
      'group2',
      [
        getConditionTemplate(0, 'current', null, '>', '11'),
        getConditionTemplate(1, 'cell', 'B2', '==', '4', 'and')
      ],
      {
        bold: true,
        forecolor: '255,255,0',
        fontSize: 16,
        underline: true,
        italic: true,
        align: 'left',
        alignScope: 'cell',
        valign: 'top',
        valignScope: 'cell',
        boldScope: 'cell',
        forecolorScope: 'cell',
        fontSizeScope: 'cell',
        italicScope: 'cell',
        underlineScope: 'cell'
      }
    ),

    // 第 3 组：多条件 OR（property<5 OR property>100）
    getConditionPropertyItemTemplate(
      'group3',
      [
        getConditionTemplate(0, 'property', 'value', '<', '5'),
        getConditionTemplate(1, 'property', 'value', '>', '100', 'or')
      ],
      {
        valign: 'top',
        valignScope: 'cell'
      }
    )
  ]

  return baseCell
}

/**
 * 校验单元格数据是否符合规范
 * @param cell - 单元格对象
 * @returns 错误信息（多条用换行分隔），undefined 表示校验通过
 */
export function validateCell(cell: any): string | undefined {
  if (!cell || typeof cell !== 'object') {
    return 'cell 必须是对象类型'
  }
  const errors: string[] = []

  // 必填字段检查
  if (typeof cell.rowNumber !== 'number' || cell.rowNumber < 1) {
    errors.push('rowNumber 必须是大于0的整数')
  }
  if (typeof cell.columnNumber !== 'number' || cell.columnNumber < 1) {
    errors.push('columnNumber 必须是大于0的整数')
  }

  // value 校验
  if (!cell.value || typeof cell.value !== 'object') {
    errors.push('value 必须是对象且包含 type 字段')
  } else {
    const validTypes = ['simple', 'expression', 'dataset', 'image', 'chart', 'slash', 'zxing']
    if (!validTypes.includes(cell.value.type)) {
      errors.push(`value.type 必须是 ${validTypes.join('/')} 之一，当前为 ${cell.value.type}`)
    }
  }

  // expand 校验
  if (cell.expand && !['None', 'Down', 'Right'].includes(cell.expand)) {
    errors.push(`expand 必须是 None/Down/Right 之一，当前为 ${cell.expand}`)
  }

  // leftParentCellName / topParentCellName 校验：允许 null/root/单元格名称格式(A1,B2,C3)
  const parentCellNamePattern = /^[A-Z]+[0-9]+$/
  if (cell.leftParentCellName != null) {
    const v = String(cell.leftParentCellName)
    if (v !== 'root' && !parentCellNamePattern.test(v)) {
      errors.push(`leftParentCellName 必须为 null/"root"/单元格名称(如 A1,C3)，当前为 "${v}"`)
    }
  }
  if (cell.topParentCellName != null) {
    const v = String(cell.topParentCellName)
    if (v !== 'root' && !parentCellNamePattern.test(v)) {
      errors.push(`topParentCellName 必须为 null/"root"/单元格名称(如 A1,C3)，当前为 "${v}"`)
    }
  }

  // cellStyle 校验
  if (cell.cellStyle) {
    const style = cell.cellStyle
    if (style.align && !['left', 'center', 'right'].includes(style.align)) {
      errors.push(`cellStyle.align 必须是 left/center/right 之一，当前为 ${style.align}`)
    }
    if (style.valign && !['top', 'middle', 'bottom'].includes(style.valign)) {
      errors.push(`cellStyle.valign 必须是 top/middle/bottom 之一，当前为 ${style.valign}`)
    }
    // 颜色格式校验
    if (style.bgcolor && typeof style.bgcolor === 'string' && !/^[0-9]+,[0-9]+,[0-9]+$/.test(style.bgcolor)) {
      errors.push(`cellStyle.bgcolor 格式错误，应为 RGB 格式如 "255,0,0"，当前为 ${style.bgcolor}`)
    }
    if (style.forecolor && typeof style.forecolor === 'string' && !/^[0-9]+,[0-9]+,[0-9]+$/.test(style.forecolor)) {
      errors.push(`cellStyle.forecolor 格式错误，应为 RGB 格式如 "0,0,0"，当前为 ${style.forecolor}`)
    }
  }

  // 仅有 value 字段才继续校验 value 子结构
  if (cell.value && typeof cell.value === 'object') {
    // dataset 类型值校验（结构校验仅检查必填字段；property 是否真实存在于数据集 fields 中，
    // 由 writeCellsTool.execute 阶段的 validateDatasetFieldBindings 校验）
    if (cell.value.type === 'dataset') {
      if (!cell.value.datasetName) {
        errors.push('dataset 类型单元格必须包含 datasetName')
      }
      if (!cell.value.aggregate) {
        errors.push('dataset 类型单元格必须包含 aggregate')
      }
      if (!cell.value.property) {
        errors.push('dataset 类型单元格必须包含 property')
      }
      const validAggregates = ['group', 'select', 'sum', 'count', 'max', 'min', 'avg', 'customgroup']
      if (!validAggregates.includes(cell.value.aggregate)) {
        errors.push(`value.aggregate 必须是 ${validAggregates.join('/')} 之一，当前为 ${cell.value.aggregate}`)
      }
      const validOrders = ['none', 'asc', 'desc']
      if (!validOrders.includes(cell.value.order)) {
        errors.push(`value.order 必须是 ${validOrders.join('/')} 之一，当前为 ${cell.value.order}`)
      }
    }

    // expression 类型值校验：禁止 = 前缀（Excel 风格），Luck-Report 表达式不使用 = 前缀
    if (cell.value.type === 'expression') {
      const expr = cell.value.value
      if (typeof expr === 'string' && expr.startsWith('=')) {
        errors.push(`expression 值不能以 "=" 开头（非 Excel 语法），正确写法如 count(A3[]) 或 sum(B3[])，当前为 ${expr}`)
      }
    }

    // image/chart/slash/zxing 类型值校验
    if (cell.value.type === 'image') {
      const subError = validateImageValue(cell.value)
      if (subError) errors.push(`value: ${subError}`)
    }
    if (cell.value.type === 'chart') {
      const subError = validateChartValue(cell.value)
      if (subError) errors.push(`value: ${subError}`)
    }
    if (cell.value.type === 'slash') {
      const subError = validateSlashValue(cell.value)
      if (subError) errors.push(`value: ${subError}`)
    }
    if (cell.value.type === 'zxing') {
      const subError = validateZxingValue(cell.value)
      if (subError) errors.push(`value: ${subError}`)
    }
  }

  // conditionPropertyItems 校验：仅 expression/dataset 支持
  if (cell.conditionPropertyItems != null
      && (!cell.value || typeof cell.value !== 'object'
          || !CONDITION_SUPPORTED_TYPES.includes(cell.value.type as typeof CONDITION_SUPPORTED_TYPES[number]))) {
    errors.push(
      `value.type 为 "${cell.value?.type}" 时不支持 conditionPropertyItems（仅 expression/dataset 支持）。` +
      `请将 value.type 改为 "expression"（推荐，值用 B3 自身引用即可）` +
      `或 "dataset"，然后再写入 conditionPropertyItems`
    )
  } else if (cell.conditionPropertyItems != null) {
    const itemsError = validateConditionPropertyItems(cell.conditionPropertyItems)
    if (itemsError) {
      errors.push(`conditionPropertyItems 校验失败: ${itemsError}`)
    }
  }

  return errors.length ? errors.join('\n') : undefined
}

/**
 * 校验批量单元格数据，遍历每个 key 调用 validateCell
 * @param cells - 批量单元格数据对象，key为 "row,col" 格式
 * @returns 错误信息（多条用换行分隔），undefined 表示校验通过
 */
export function validateCells(cells: any): string | undefined {
  if (!cells || typeof cells !== 'object') {
    return 'cells 必须是对象类型'
  }

  const keys = Object.keys(cells)
  if (keys.length === 0) {
    return 'cells 不能为空对象'
  }

  const errors: string[] = []
  for (const key of keys) {
    // 校验 key 格式
    if (!/^[0-9]+,[0-9]+$/.test(key)) {
      errors.push(`key "${key}" 格式错误，应为 "row,col"（从1开始）`)
      continue
    }
    // 校验每个单元格
    const cellError = validateCell(cells[key])
    if (cellError) {
      errors.push(`单元格 ${key} 校验失败:\n${cellError}`)
    }
  }

  return errors.length ? errors.join('\n') : undefined
}

/**
 * 浅合并 b 到 a（同 Object.assign 语义，但支持 null 跳过）
 * - 用于在 LLM 输出的部分字段上做深合并
 * - 仅做一层，不递归（避免误改模板的嵌套对象如 conditionPropertyItems）
 */
function shallowMergeBase<T extends Record<string, any>>(a: T, b: Record<string, any> | null | undefined): T {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return a
  for (const key of Object.keys(b)) {
    // 跳过显式 null/undefined 让 LLM 可以"清空"某个字段（如 leftParentCellName: null）
    if (b[key] === undefined) continue
    a[key] = b[key]
  }
  return a
}

/**
 * 规范化单个单元格，按 cell.value.type 选对应模板补齐缺失字段
 * @param cell - LLM 传入的单元格对象
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @returns 符合 CellSchema 规范的完整单元格对象
 */
export function normalizeCell(cell: any, rowIndex: number, colIndex: number): Record<string, any> {
  // 防御：cell 不是对象时无法推断类型，按 simple 兜底
  const cellType = (cell && typeof cell === 'object' && !Array.isArray(cell) && cell.value && typeof cell.value === 'object')
    ? (cell.value.type || 'simple')
    : 'simple'
  // 按 cell.value.type 选对应类型的完整模板作 base
  const base = JSON.parse(JSON.stringify(getCellTemplateByType(cellType, rowIndex, colIndex))) as Record<string, any>
  if (!cell || typeof cell !== 'object' || Array.isArray(cell)) {
    return base
  }
  // 分离 value 和 cellStyle：value 整体替换（避免内部结构畸形合并），cellStyle 深合并（保留模板默认字段）
  const { value: cellValue, cellStyle: cellCellStyle, ...rest } = cell
  // 浅合并其余顶层字段（LLM 传入覆盖模板默认值）
  shallowMergeBase(base, rest)
  // cellStyle 字段：深合并到模板默认的 cellStyle 上（关键修复）
  // 之前 Object.assign 会把模板默认的 {align, valign, fontSize, fontFamily, ...} 整体替换为 LLM 输出的 {fontSize: 22}，
  // 导致用户未改的属性（align/valign/bold/border 等）被重置为默认值（例：A1 字体 14→22，align 从 center 变回默认）
  // 深合并后：LLM 只传 fontSize:22 时，align/valign/fontFamily/bold/border 等其他字段保留模板/已有值
  if (cellCellStyle && typeof cellCellStyle === 'object' && !Array.isArray(cellCellStyle)) {
    if (!base.cellStyle || typeof base.cellStyle !== 'object' || Array.isArray(base.cellStyle)) {
      base.cellStyle = {}
    }
    shallowMergeBase(base.cellStyle, cellCellStyle)
  }
  // value 字段：LLM 传了则整体替换，未传则保留模板默认（按类型的空值）
  if (cellValue && typeof cellValue === 'object' && !Array.isArray(cellValue)) {
    base.value = cellValue
  }
  // conditionPropertyItems 规范化：仅对 expression/dataset 执行
  if (!CONDITION_SUPPORTED_TYPES.includes(base.value?.type as typeof CONDITION_SUPPORTED_TYPES[number])) {
    base.conditionPropertyItems = null
  } else if (Array.isArray(base.conditionPropertyItems)) {
    base.conditionPropertyItems = normalizeConditionPropertyItems(base.conditionPropertyItems)
  }
  return base
}

/**
 * 规范化批量单元格，遍历 "row,col" key 调用 normalizeCell
 * @param cells - 批量单元格对象，key 为 "row,col" 格式
 * @returns 规范化后的批量单元格对象
 */
export function normalizeCells(cells: any): Record<string, any> {
  const result: Record<string, any> = {}
  // 防御：cells 不是对象时返回空对象
  if (!cells || typeof cells !== 'object' || Array.isArray(cells)) {
    return result
  }
  for (const key of Object.keys(cells)) {
    const match = /^([0-9]+),([0-9]+)$/.exec(key)
    if (!match) {
      result[key] = cells[key]
      continue
    }
    // key 是 1-based 坐标，转 0-based
    const rowIndex = parseInt(match[1], 10) - 1
    const colIndex = parseInt(match[2], 10) - 1
    result[key] = normalizeCell(cells[key], rowIndex, colIndex)
  }
  return result
}

/** CellValue 单元格值 Schema（根据 type 动态匹配） */
export const CellValueSchema = {
  oneOf: [
    SimpleValueSchema,
    ExpressionValueSchema,
    DatasetValueSchema,
    ImageValueSchema,
    ZxingValueSchema,
    ChartValueSchema,
    SlashValueSchema
  ],
  description: '单元格值对象，根据type不同有不同结构'
}

/** Cell 单元格完整定义 Schema */
export const CellSchema = {
  type: 'object',
  properties: {
    rowNumber: { type: 'integer', description: '行号，从1开始', minimum: 1 },
    columnNumber: { type: 'integer', description: '列号，从1开始', minimum: 1 },
    rowSpan: { type: 'integer', description: '行合并数，0表示不合并', minimum: 0 },
    colSpan: { type: 'integer', description: '列合并数，0表示不合并', minimum: 0 },
    name: { type: 'string', description: '单元格名称，如A1、B2' },
    value: CellValueSchema,
    cellStyle: CellStyleSchema,
    linkUrl: { type: 'string', description: '链接地址，支持普通文本和表达式，表达式用 `${...}` 包裹，用于与普通文本区分。' },
    linkTargetWindow: { type: 'string', enum: ['_blank', null], description: '链接打开方式' },
    linkParameters: { type: 'array', items: LinkParameterSchema, description: '链接参数列表' },
    fillBlankRows: { type: 'boolean', description: '是否填充空白行' },
    multiple: { type: 'integer', description: '填充行数倍数，0不限制', minimum: 0 },
    expand: { type: 'string', enum: ['None', 'Down', 'Right'], description: '展开方向' },
    leftParentCellName: { type: 'string', description: '左父格名称：null(默认)/"root"(无父格)/单元格名如"A1"、"C3"。禁止用坐标"3,3"格式。' },
    topParentCellName: { type: 'string', description: '上父格名称：null(默认)/"root"(无父格)/单元格名如"A1"、"C3"。禁止用坐标"3,3"格式。' },
    conditionPropertyItems: {
      type: 'array',
      items: ConditionPropertyItemSchema,
      description: '条件属性分组列表，每个分组包含一组条件及满足条件后的效果，按分组顺序依次判断，效果可叠加'
    }
  },
  required: ['rowNumber', 'columnNumber', 'value'],
  description: '单元格完整定义，包含位置、值、样式、展开方式等属性'
}

/**
 * CellsSchema 批量单元格数据 Schema
 * 用于 writeCells 工具的参数，key为 "row,col" 格式（从1开始），value为单元格定义对象
 */
export const CellsSchema = {
  type: 'object',
  description: '批量单元格数据，key为 "row,col" 格式（从1开始），value为单元格定义对象',
  additionalProperties: CellSchema,
  patternProperties: {
    '^[0-9]+,[0-9]+$': CellSchema
  }
}
