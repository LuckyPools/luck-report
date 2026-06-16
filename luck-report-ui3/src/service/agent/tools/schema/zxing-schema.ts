/**
 * 二维码/条码单元格数据模型 JSON Schema 定义
 * 定义二维码和条码单元格的核心数据模型，支持静态文本和表达式动态计算两种来源模式
 */

// ==================== 二维码/条码相关 Schema ====================

/**
 * ZxingValue 二维码/条码值 Schema
 * 文档参考: qrcode-cell.md, barcode-cell.md
 */
export const ZxingValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'zxing' },
    category: { type: 'string', enum: ['qrcode', 'barcode'], description: '分类：qrcode为二维码，barcode为条码' },
    source: { type: 'string', enum: ['text', 'expression'], description: '数据来源：text为静态文本，expression为表达式动态计算' },
    value: { type: 'string', description: '编码内容或表达式文本' },
    width: { type: 'integer', description: '宽度(px)，最小值1，默认100', minimum: 1 },
    height: { type: 'integer', description: '高度(px)，最小值1，默认100', minimum: 1 },
    format: {
      type: 'string',
      enum: ['QR_CODE', 'AZTEC', 'CODABAR', 'CODE_39', 'CODE_93', 'CODE_128', 'DATA_MATRIX', 'EAN_8', 'EAN_13', 'ITF', 'PDF_417', 'UPC_A', 'UPC_E'],
      description: '编码格式：qrcode固定QR_CODE，barcode可选多种格式'
    },
    codeDisplay: { type: 'boolean', description: '是否显示编码文本' }
  },
  required: ['type', 'category', 'source', 'value'],
  description: '二维码/条码值对象，支持静态文本和表达式两种来源模式'
}

// ==================== 数据模板生成函数 ====================

/**
 * 生成二维码单元格模板
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @param text - 二维码内容
 * @returns 符合规范的单元格模板对象
 */
export function getQrcodeCellTemplate(rowIndex: number, colIndex: number, text: string = ''): object {
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
      width: 100,
      height: 100,
      source: 'text',
      format: null,
      category: 'qrcode',
      codeDisplay: false,
      value: text,
      type: 'zxing'
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
 * 生成条码单元格模板
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @param text - 条码内容
 * @param format - 条码格式
 * @returns 符合规范的单元格模板对象
 */
export function getBarcodeCellTemplate(rowIndex: number, colIndex: number, text: string = '', format: string = 'AZTEC'): object {
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
      width: 103,
      height: 40,
      source: 'text',
      format,
      category: 'barcode',
      codeDisplay: false,
      value: text,
      type: 'zxing'
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

// ==================== 数据校验函数 ====================

/**
 * 校验二维码/条码值数据是否符合规范
 *
 * @param zxingValue - 二维码/条码值对象
 * @returns 错误信息（多条用换行分隔），undefined 表示校验通过
 */
export function validateZxingValue(zxingValue: any): string | undefined {
  if (!zxingValue || typeof zxingValue !== 'object') {
    return 'zxingValue 必须是对象类型'
  }
  const errors: string[] = []

  // type 必须是 zxing
  if (zxingValue.type !== 'zxing') {
    errors.push('zxingValue.type 必须是 "zxing"')
  }

  // category 校验
  const validCategories = ['qrcode', 'barcode']
  if (!zxingValue.category || !validCategories.includes(zxingValue.category)) {
    errors.push(`zxingValue.category 必须是 ${validCategories.join('/')} 之一，当前为 ${zxingValue.category}`)
  }

  // source 校验
  const validSources = ['text', 'expression']
  if (!zxingValue.source || !validSources.includes(zxingValue.source)) {
    errors.push(`zxingValue.source 必须是 ${validSources.join('/')} 之一，当前为 ${zxingValue.source}`)
  }

  // value 校验
  if (!zxingValue.value || typeof zxingValue.value !== 'string') {
    errors.push('zxingValue.value 必须是非空字符串')
  }

  // width 校验
  if (typeof zxingValue.width !== 'number' || zxingValue.width < 1) {
    errors.push('zxingValue.width 必须是大于0的整数')
  }

  // height 校验
  if (typeof zxingValue.height !== 'number' || zxingValue.height < 1) {
    errors.push('zxingValue.height 必须是大于0的整数')
  }

  // barcode 类型时 format 校验
  if (zxingValue.category === 'barcode') {
    const validFormats = ['QR_CODE', 'AZTEC', 'CODABAR', 'CODE_39', 'CODE_93', 'CODE_128', 'DATA_MATRIX', 'EAN_8', 'EAN_13', 'ITF', 'PDF_417', 'UPC_A', 'UPC_E']
    if (zxingValue.format && !validFormats.includes(zxingValue.format)) {
      errors.push(`zxingValue.format 必须是 ${validFormats.join('/')} 之一，当前为 ${zxingValue.format}`)
    }
  }

  // codeDisplay 校验
  if (zxingValue.codeDisplay !== undefined && typeof zxingValue.codeDisplay !== 'boolean') {
    errors.push('zxingValue.codeDisplay 必须是布尔类型')
  }

  return errors.length ? errors.join('\n') : undefined
}
