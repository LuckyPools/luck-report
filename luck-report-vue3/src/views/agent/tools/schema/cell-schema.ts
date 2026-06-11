/**
 * 单元格数据模型 JSON Schema 定义
 *
 * 本文件定义了单元格的核心数据模型、约束规则、数据模板和校验函数。
 * 单元格是报表的基本组成单元，包含位置、值、样式、展开等属性。
 */

// 导入其他值类型的 Schema（用于 CellValueSchema 的 oneOf 组合）
import { ImageValueSchema, getImageCellTemplate, validateImageValue } from './image-schema'
import { ZxingValueSchema, getQrcodeCellTemplate, getBarcodeCellTemplate, validateZxingValue } from './zxing-schema'
import { ChartValueSchema, getChartCellTemplate, validateChartValue } from './chart-schema'
import { SlashValueSchema, getSlashCellTemplate, validateSlashValue } from './slash-schema'
// 导入表达式对象 Schema（避免循环依赖，从独立文件导入）
import { ExpressionObjectSchema } from './expression-schema'

// ==================== 单元格基础 Schema ====================

/**
 * Border 边框 Schema
 */
export const BorderSchema = {
  type: 'object',
  properties: {
    width: { type: 'integer', description: '边框宽度，如1、2' },
    color: { type: 'string', description: '边框颜色，RGB格式如"0,0,0"', pattern: '^[0-9]+,[0-9]+,[0-9]+$' },
    style: { type: 'string', enum: ['solid', 'dashed', 'doublesolid'], description: '边框样式：实线/虚线/双实线' }
  },
  required: ['width', 'color', 'style']
}

/**
 * CellStyle 单元格样式 Schema
 */
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

/**
 * SimpleValue 简单文本值 Schema
 */
export const SimpleValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'simple' },
    value: { type: 'string', description: '文本内容' }
  },
  required: ['type', 'value']
}

// ExpressionObjectSchema 已移至 expression-schema.ts，此处通过导入使用

/**
 * ExpressionValue 表达式值 Schema
 * 表达式单元格的值对象，包含表达式源码和解析后的表达式对象
 */
export const ExpressionValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'expression' },
    value: { type: 'string', description: '表达式源码，包含换行和空格的完整表达式文本' },
    text: { type: 'string', description: '表达式源码，与value相同' },
    expression: { ...ExpressionObjectSchema, description: '表达式对象，解析后的结构化数据' }
  },
  required: ['type', 'value', 'text']
}

/**
 * DatasetCondition 数据集过滤条件 Schema
 * 支持链式嵌套条件结构
 */
export const DatasetConditionSchema = {
  type: 'object',
  properties: {
    left: { type: 'string', description: '左侧表达式，字段名或表达式' },
    op: { type: 'string', enum: ['GreatThen', 'EqualsGreatThen', 'LessThen', 'EqualsLessThen', 'Equals', 'NotEquals', 'In', 'NotIn', 'Like'], description: '比较运算符枚举值' },
    operation: { type: 'string', description: '操作符符号，如==、<、>、<=' },
    right: { type: 'string', description: '右侧表达式，比较值' },
    join: { type: 'string', enum: ['and', 'or'], description: '条件连接方式' },
    type: { type: 'string', description: '条件类型，如property表示属性条件' },
    nextCondition: { type: 'object', nullable: true, description: '下一个嵌套条件（已废弃，必须设为null）' }
  }
}

/**
 * DatasetValue 数据集值 Schema
 * 文档参考: dataset-cell.md
 */
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
    expr: { type: 'string', nullable: true, description: '表达式字符串，通常为null' },
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
          name: { type: 'string', description: '分组名称' },
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

/**
 * LinkParameter 链接参数 Schema
 * 条件属性中的链接参数，可包含表达式
 */
export const LinkParameterSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '参数名' },
    value: { type: 'string', description: '参数值，可为表达式' },
    valueExpression: {
      ...ExpressionObjectSchema,
      description: '参数值表达式对象，当value为表达式时使用'
    }
  },
  required: ['name', 'value']
}

/**
 * Condition 条件对象 Schema
 * 条件属性中的单个条件，用于判断是否满足条件
 */
export const ConditionSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['property', 'expression', 'cell', 'current'],
      description: '条件类型：property-属性条件(比较数据集字段值)，expression-表达式条件(左右均为表达式)，cell-单元格条件(比较指定单元格的值)，current-当前值条件(比较当前单元格自身值)'
    },
    left: { type: 'string', description: '左侧表达式，type为property时为字段名，type为cell时为单元格名称，type为current时为null' },
    op: {
      type: 'string',
      enum: ['GreatThen', 'EqualsGreatThen', 'LessThen', 'EqualsLessThen', 'Equals', 'NotEquals', 'In', 'NotIn', 'Like'],
      description: '比较运算符枚举值'
    },
    operation: {
      type: 'string',
      enum: ['>', '>=', '<', '<=', '==', '!=', 'in', 'not in', 'like'],
      description: '运算符符号表示'
    },
    right: { type: 'string', description: '右侧比较值' },
    join: { type: 'string', enum: ['and', 'or', null], description: '条件连接方式，多个条件时使用and或or连接' },
    nextCondition: { type: 'object', nullable: true, description: '下一个嵌套条件（已废弃，必须设为null）'}
  },
  required: ['type', 'op', 'right']
}

/**
 * ConditionCellStyle 条件样式 Schema
 * 继承 CellStyle 并增加样式作用范围属性
 */
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

/**
 * Paging 分页配置 Schema
 * 条件属性中的分页配置，满足条件时触发分页
 */
export const PagingSchema = {
  type: 'object',
  properties: {
    position: { type: 'string', enum: ['before', 'after'], description: '分页位置：before-之前分页，after-之后分页' },
    line: { type: 'integer', description: '分页行数，0表示不分页' }
  },
  description: '分页配置对象，满足条件时触发分页'
}

/**
 * ConditionPropertyItem 条件属性项 Schema
 * 条件属性分组，包含一组条件及满足条件后的效果
 */
export const ConditionPropertyItemSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '条件名称，如"条件1"、"条件2"' },
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

/**
 * CellPosition 单元格坐标 Schema
 * 用于 readCells 工具的参数，row/col 从1开始
 */
export const CellPositionSchema = {
  type: 'object',
  properties: {
    row: { type: 'integer', description: '行号，从1开始', minimum: 1 },
    col: { type: 'integer', description: '列号，从1开始', minimum: 1 }
  },
  required: ['row', 'col'],
  description: '单元格坐标，row/col从1开始'
}

// ==================== 数据模板生成函数 ====================

/**
 * 生成简单文本单元格模板
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @returns 符合规范的单元格模板对象
 */
export function getSimpleCellTemplate(rowIndex: number, colIndex: number): object {
  const rowNumber = rowIndex + 1
  const colNumber = colIndex + 1
  // 列字母转换：1->A, 2->B, ...
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
    topParentCellName: null,
    conditionPropertyItems: null
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
  // 数据集单元格通常需要展开
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
    text: expression,
    expression: null,
    value: expression,
    type: 'expression'
  }
  return baseCell
}

/**
 * 根据值类型获取单元格模板
 * 覆盖全部 7 种单元格类型：simple/expression/dataset/image/chart/slash/zxing
 * 其中 zxing 进一步按 category 区分 qrcode（默认）/barcode
 *
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
      // zxing 内部按 category 区分二维码/条码，options.zxingCategory 决定走哪个模板
      // 默认按二维码生成；LLM 显式传 options.zxingCategory === 'barcode' 时走条码模板
      if ((options as any)?.zxingCategory === 'barcode') {
        return getBarcodeCellTemplate(rowIndex, colIndex, options?.barcodeText || '', options?.barcodeFormat || 'AZTEC')
      }
      return getQrcodeCellTemplate(rowIndex, colIndex, options?.qrcodeText || '')
    default:
      return getSimpleCellTemplate(rowIndex, colIndex)
  }
}

// ==================== 数据校验函数 ====================

/**
 * 校验单元格数据是否符合规范
 * @param cell - 单元格对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateCell(cell: any): string | undefined {
  if (!cell || typeof cell !== 'object') {
    return 'cell 必须是对象类型'
  }

  // 必填字段检查
  if (typeof cell.rowNumber !== 'number' || cell.rowNumber < 1) {
    return 'rowNumber 必须是大于0的整数'
  }
  if (typeof cell.columnNumber !== 'number' || cell.columnNumber < 1) {
    return 'columnNumber 必须是大于0的整数'
  }

  // value 校验
  if (!cell.value || typeof cell.value !== 'object') {
    return 'value 必须是对象且包含 type 字段'
  }
  const validTypes = ['simple', 'expression', 'dataset', 'image', 'chart', 'slash', 'zxing']
  if (!validTypes.includes(cell.value.type)) {
    return `value.type 必须是 ${validTypes.join('/')} 之一，当前为 ${cell.value.type}`
  }

  // expand 校验
  if (cell.expand && !['None', 'Down', 'Right'].includes(cell.expand)) {
    return `expand 必须是 None/Down/Right 之一，当前为 ${cell.expand}`
  }

  // cellStyle 校验
  if (cell.cellStyle) {
    const style = cell.cellStyle
    if (style.align && !['left', 'center', 'right'].includes(style.align)) {
      return `cellStyle.align 必须是 left/center/right 之一，当前为 ${style.align}`
    }
    if (style.valign && !['top', 'middle', 'bottom'].includes(style.valign)) {
      return `cellStyle.valign 必须是 top/middle/bottom 之一，当前为 ${style.valign}`
    }
    // 颜色格式校验
    if (style.bgcolor && typeof style.bgcolor === 'string' && !/^[0-9]+,[0-9]+,[0-9]+$/.test(style.bgcolor)) {
      return `cellStyle.bgcolor 格式错误，应为 RGB 格式如 "255,0,0"，当前为 ${style.bgcolor}`
    }
    if (style.forecolor && typeof style.forecolor === 'string' && !/^[0-9]+,[0-9]+,[0-9]+$/.test(style.forecolor)) {
      return `cellStyle.forecolor 格式错误，应为 RGB 格式如 "0,0,0"，当前为 ${style.forecolor}`
    }
  }

  // dataset 类型值校验
  if (cell.value.type === 'dataset') {
    if (!cell.value.datasetName) {
      return 'dataset 类型单元格必须包含 datasetName'
    }
    if (!cell.value.aggregate) {
      return 'dataset 类型单元格必须包含 aggregate'
    }
    if (!cell.value.property) {
      return 'dataset 类型单元格必须包含 property'
    }
    const validAggregates = ['group', 'select', 'sum', 'count', 'max', 'min', 'avg', 'customgroup']
    if (!validAggregates.includes(cell.value.aggregate)) {
      return `value.aggregate 必须是 ${validAggregates.join('/')} 之一`
    }
  }

  // image 类型值校验
  if (cell.value.type === 'image') {
    return validateImageValue(cell.value)
  }

  // chart 类型值校验
  if (cell.value.type === 'chart') {
    return validateChartValue(cell.value)
  }

  // slash 类型值校验
  if (cell.value.type === 'slash') {
    return validateSlashValue(cell.value)
  }

  // zxing 类型值校验
  if (cell.value.type === 'zxing') {
    return validateZxingValue(cell.value)
  }

  return undefined
}

/**
 * 校验批量单元格数据是否符合规范
 * 遍历 cells 对象的每个 value，调用 validateCell 进行校验
 *
 * @param cells - 批量单元格数据对象，key为 "row,col" 格式，value为单元格定义对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateCells(cells: any): string | undefined {
  if (!cells || typeof cells !== 'object') {
    return 'cells 必须是对象类型'
  }

  const keys = Object.keys(cells)
  if (keys.length === 0) {
    return 'cells 不能为空对象'
  }

  for (const key of keys) {
    // 校验 key 格式
    if (!/^[0-9]+,[0-9]+$/.test(key)) {
      return `cells 的 key 格式错误，应为 "row,col"（从1开始），当前为 "${key}"`
    }
    // 校验每个单元格
    const cellError = validateCell(cells[key])
    if (cellError) {
      return `单元格 ${key} 校验失败: ${cellError}`
    }
  }

  return undefined
}

// ==================== 单元格数据规范化函数 ====================

/**
 * 规范化单个单元格：按 cell.value.type 选对应类型模板补齐缺失字段
 * 与 validate 职责分离：本函数只补字段、不校验；validate 只校验、不修改数据
 * merge 策略：以类型模板为基，LLM 传入的字段覆盖默认值；value 字段整体替换避免内部结构畸形合并
 * 不抛错：缺字段时静默补齐，调用方无需 try/catch
 *
 * @param cell - LLM 传入的单元格对象，可为 null/undefined/部分字段缺失
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @returns 符合 CellSchema 规范的完整单元格对象
 */
export function normalizeCell(cell: any, rowIndex: number, colIndex: number): Record<string, any> {
  // 防御：cell 不是对象时无法推断类型，按 simple 兜底
  const cellType = (cell && typeof cell === 'object' && !Array.isArray(cell) && cell.value && typeof cell.value === 'object')
    ? (cell.value.type || 'simple')
    : 'simple'
  // 按 cell.value.type 选对应类型的完整模板作 base，保证顶层 cellStyle/rowSpan 等 + value 内部必填字段都补齐
  const base = JSON.parse(JSON.stringify(getCellTemplateByType(cellType, rowIndex, colIndex))) as Record<string, any>
  // 防御：cell 不是对象（LLM 传 null/字符串/数字等）时直接返回基线
  if (!cell || typeof cell !== 'object' || Array.isArray(cell)) {
    return base
  }
  // 分离 value：value 必须整体替换，避免 LLM 传 {"type":"simple"} 时把 value.value 漏掉
  const { value: cellValue, ...rest } = cell
  // 浅合并其余字段（LLM 传入覆盖模板默认值）
  Object.assign(base, rest)
  // value 字段：LLM 传了则整体替换，未传则保留模板默认（按类型的空值）
  if (cellValue && typeof cellValue === 'object' && !Array.isArray(cellValue)) {
    base.value = cellValue
  }
  return base
}

/**
 * 规范化批量单元格：遍历 cells 的 "row,col" key，调用 normalizeCell 逐个补齐
 * 与 validate 职责分离：本函数只补字段、不校验
 * 跳过 key 格式不合法的项（这些交给 validateCells 报错，不在 normalize 阶段处理）
 *
 * @param cells - LLM 传入的批量单元格对象，key 为 "row,col" 格式（从1开始）
 * @returns 规范化后的批量单元格对象，key 仍保持 "row,col" 格式
 */
export function normalizeCells(cells: any): Record<string, any> {
  const result: Record<string, any> = {}
  // 防御：cells 不是对象时返回空对象
  if (!cells || typeof cells !== 'object' || Array.isArray(cells)) {
    return result
  }
  for (const key of Object.keys(cells)) {
    // 仅处理 "row,col" 格式的 key；其它 key 原样透传（validate 会报错）
    const match = /^([0-9]+),([0-9]+)$/.exec(key)
    if (!match) {
      result[key] = cells[key]
      continue
    }
    // key 是 1-based 坐标，转 0-based 传给 normalizeCell
    const rowIndex = parseInt(match[1], 10) - 1
    const colIndex = parseInt(match[2], 10) - 1
    result[key] = normalizeCell(cells[key], rowIndex, colIndex)
  }
  return result
}

// ==================== 单元格完整定义 Schema ====================

/**
 * CellValue 单元格值 Schema（根据 type 动态匹配）
 * 使用 oneOf 组合所有值类型，确保每种类型都有完整的属性校验
 */
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

/**
 * Cell 单元格完整定义 Schema
 * 基于 cell-common-attribute.md 数据模型
 */
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
    leftParentCellName: { type: 'string', description: '左父格名称，如A1，null表示无，root表示根' },
    topParentCellName: { type: 'string', description: '上父格名称，如A1，null表示无，root表示根' },
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