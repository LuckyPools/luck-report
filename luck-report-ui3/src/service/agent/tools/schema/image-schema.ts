/**
 * 图片单元格数据模型 JSON Schema 定义
 */
/**
 * ImageValue 图片值 Schema
 */
export const ImageValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'image' },
    source: { type: 'string', enum: ['text', 'expression'], description: '图片来源：text为静态路径，expression为表达式动态计算' },
    value: { type: 'string', description: 'text 模式：图片 URL；expression 模式：表达式源码（如 "return https://..."）' },
    width: { type: 'integer', description: '图片宽度(px)，最小值1', minimum: 1 },
    height: { type: 'integer', description: '图片高度(px)，最小值1', minimum: 1 }
  },
  required: ['type', 'source', 'width', 'height', 'value'],
  description: '图片值对象，支持静态路径和表达式两种来源模式'
}

// ==================== 数据模板生成函数 ====================

/**
 * 生成图片单元格模板
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @param imagePath - 图片路径
 * @returns 符合规范的单元格模板对象
 */
export function getImageCellTemplate(rowIndex: number, colIndex: number, imagePath: string = ''): object {
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
      source: 'text',
      width: 100,
      height: 100,
      value: imagePath,
      type: 'image'
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
 * 校验图片值数据是否符合规范
 *
 * @param imageValue - 图片值对象
 * @returns 错误信息（多条用换行分隔），undefined 表示校验通过
 */
export function validateImageValue(imageValue: any): string | undefined {
  if (!imageValue || typeof imageValue !== 'object') {
    return 'imageValue 必须是对象类型'
  }
  const errors: string[] = []

  // type 必须是 image
  if (imageValue.type !== 'image') {
    errors.push('imageValue.type 必须是 "image"')
  }

  // source 校验
  const validSources = ['text', 'expression']
  if (!imageValue.source || !validSources.includes(imageValue.source)) {
    errors.push(`imageValue.source 必须是 ${validSources.join('/')} 之一，当前为 ${imageValue.source}`)
  }

  // width 校验
  if (typeof imageValue.width !== 'number' || imageValue.width < 1) {
    errors.push('imageValue.width 必须是大于0的整数')
  }

  // height 校验
  if (typeof imageValue.height !== 'number' || imageValue.height < 1) {
    errors.push('imageValue.height 必须是大于0的整数')
  }

  // value 校验
  if (!imageValue.value || typeof imageValue.value !== 'string') {
    errors.push('imageValue.value 必须是非空字符串')
  }

  return errors.length ? errors.join('\n') : undefined
}
