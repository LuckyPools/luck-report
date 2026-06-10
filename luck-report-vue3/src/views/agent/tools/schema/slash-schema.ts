/**
 * 斜线表头数据模型 JSON Schema 定义
 *
 * 本文件定义了斜线表头单元格的核心数据模型。
 * 斜线表头用于绘制包含斜线的复杂表头结构。
 */

// ==================== 斜线表头相关 Schema ====================

/**
 * Slash 斜线对象 Schema
 * 文档参考: diagonal-header-cell.md
 */
export const SlashSchema = {
  type: 'object',
  properties: {
    x: { type: 'number', description: '文本X坐标，相对于单元格的横坐标位置' },
    y: { type: 'number', description: '文本Y坐标，相对于单元格的纵坐标位置' },
    degree: { type: 'number', description: '斜线角度，如45、30' },
    text: { type: 'string', description: '斜线上的文本标签' }
  },
  required: ['x', 'y', 'degree', 'text'],
  description: '斜线对象，包含坐标、角度和文本'
}

/**
 * SlashValue 斜线表头值 Schema
 * 文档参考: diagonal-header-cell.md
 */
export const SlashValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'slash' },
    slashes: {
      type: 'array',
      items: SlashSchema,
      description: '斜线列表，每条斜线包含坐标、角度和文本'
    },
    value: { type: 'string', nullable: true, description: '值字段，通常为null' },
    svg: { type: 'string', description: 'SVG内容，由系统渲染时自动生成' },
    base64Data: { type: 'string', description: 'Base64图片数据，由系统渲染时自动生成' }
  },
  required: ['type', 'slashes'],
  description: '斜线表头值对象，用于绘制斜线表头'
}

// ==================== 数据校验函数 ====================

/**
 * 校验斜线表头值数据是否符合规范
 * @param slashValue - 斜线表头值对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateSlashValue(slashValue: any): string | undefined {
  if (!slashValue || typeof slashValue !== 'object') {
    return 'slashValue 必须是对象类型'
  }

  // type 必须是 slash
  if (slashValue.type !== 'slash') {
    return 'slashValue.type 必须是 "slash"'
  }

  // slashes 必须是数组
  if (!Array.isArray(slashValue.slashes)) {
    return 'slashValue.slashes 必须是数组'
  }

  // 校验每个斜线对象
  for (let i = 0; i < slashValue.slashes.length; i++) {
    const slash = slashValue.slashes[i]
    const slashError = validateSlash(slash, i)
    if (slashError) return slashError
  }

  return undefined
}

/**
 * 校验单个斜线对象是否符合规范
 * @param slash - 斜线对象
 * @param index - 斜线索引
 * @returns 错误信息，undefined 表示校验通过
 */
function validateSlash(slash: any, index: number): string | undefined {
  if (!slash || typeof slash !== 'object') {
    return `slashValue.slashes[${index}] 必须是对象类型`
  }

  // x 校验
  if (typeof slash.x !== 'number') {
    return `slashValue.slashes[${index}].x 必须是数字类型`
  }

  // y 校验
  if (typeof slash.y !== 'number') {
    return `slashValue.slashes[${index}].y 必须是数字类型`
  }

  // degree 校验
  if (typeof slash.degree !== 'number') {
    return `slashValue.slashes[${index}].degree 必须是数字类型`
  }

  // text 校验
  if (!slash.text || typeof slash.text !== 'string') {
    return `slashValue.slashes[${index}].text 必须是非空字符串`
  }

  return undefined
}

// ==================== 数据模板生成函数 ====================

/**
 * 生成斜线表头单元格模板
 * 参考 doc/template/slash.json 的结构
 * 默认生成空 slashes 列表，LLM 调用时需补充斜线项
 *
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @returns 符合规范的斜线表头单元格模板对象
 */
export function getSlashCellTemplate(rowIndex: number, colIndex: number): object {
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
      svg: null,
      slashes: [],
      base64Data: null,
      value: null,
      type: 'slash'
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