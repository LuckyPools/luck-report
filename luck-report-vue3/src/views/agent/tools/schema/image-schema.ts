/**
 * 图片单元格数据模型 JSON Schema 定义
 */
import {ExpressionObjectSchema} from "@/views/agent/tools/schema/expression-schema.ts";

/**
 * ImageValue 图片值 Schema
 */
export const ImageValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'image' },
    source: { type: 'string', enum: ['text', 'expression'], description: '图片来源：text为静态路径，expression为表达式动态计算' },
    path: { type: 'string', description: '图片路径。text 模式：与 value 完全相同；expression 模式：与 value 完全相同（或为表达式预期产出 URL）。前端 ImageValueEditor 仅在 source=expression 时读 value，但运行时渲染与 tooltip 都依赖 path 字段。' },
    value: { type: 'string', description: 'text 模式：与 path 完全相同的图片 URL；expression 模式：表达式源码（如 "return https://..."）。**text 模式下 value 必须与 path 完全一致**，否则前端编辑器回显为空。' },
    expr: { type: 'string', description: '表达式字符串（已废弃，通常为null）' },
    expression: { ...ExpressionObjectSchema, description: '表达式对象，当source为expression时可能包含，通常为null' },
    width: { type: 'integer', description: '图片宽度(px)，最小值1', minimum: 1 },
    height: { type: 'integer', description: '图片高度(px)，最小值1', minimum: 1 }
  },
  required: ['type', 'source', 'width', 'height'],
  description: '图片值对象，支持静态路径和表达式两种来源模式。text 模式下 value === path（前端编辑器只读 value.value）；expression 模式下 value 是表达式源码、path 是其等价值。'
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
      path: imagePath,
      expr: null,
      expression: null,
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
    topParentCellName: null,
    conditionPropertyItems: null
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

  // source 为 text 时必须有 path，且 value 必须与 path 一致（前端编辑器只读 value.value）
  if (imageValue.source === 'text') {
    if (!imageValue.path || typeof imageValue.path !== 'string') {
      errors.push('imageValue.path 必须是非空字符串（当 source 为 text 时）')
    }
    // 强制 value === path：前端 ImageValueEditor 在 text 模式下从 value.value 取路径写入，
    // 若 value 漏填或与 path 不一致，编辑器回显会空白（典型 bug：LLM 只填 path 不填 value）
    if (typeof imageValue.value !== 'string' || imageValue.value !== imageValue.path) {
      errors.push('source=text 时，imageValue.value 必须是非空字符串且与 path 完全一致（前端编辑器只读 value.value）')
    }
  }

  // source 为 expression 时必须有 value（表达式源码），且 path 必须与 value 一致或为预期 URL
  if (imageValue.source === 'expression') {
    if (!imageValue.value || typeof imageValue.value !== 'string') {
      errors.push('imageValue.value 必须是非空字符串（当 source 为 expression 时）')
    }
    // 强制 path 非空且与 value 一致：运行时渲染/canvas 读 path 作为展示 URL；
    // 编辑器代码框虽然只读 value.value，但 path 漏填会导致运行时图片无法渲染
    if (typeof imageValue.path !== 'string' || !imageValue.path || imageValue.path !== imageValue.value) {
      errors.push('source=expression 时，imageValue.path 必须是非空字符串且与 value 完全一致（运行时渲染读 path）')
    }
  }

  return errors.length ? errors.join('\n') : undefined
}
