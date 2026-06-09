/**
 * 行定义数据模型 JSON Schema 定义
 *
 * 本文件定义了报表行定义的核心数据模型、约束规则和校验函数。
 * 行定义用于管理报表中每一行的高度和类型配置。
 */

// ==================== 行定义 Schema ====================

/**
 * Band 行类型枚举 Schema
 */
export const BandSchema = {
  type: 'string',
  enum: ['headerrepeat', 'footerrepeat', 'title', 'summary'],
  description: '行类型：headerrepeat(重复表头)、footerrepeat(重复表尾)、title(标题行)、summary(总结行)'
}

/**
 * RowDefinition 行定义 Schema
 * 文档参考: page-config.md, row.md
 */
export const RowDefinitionSchema = {
  type: 'object',
  properties: {
    rowNumber: { type: 'integer', minimum: 1, description: '行号，从1开始' },
    height: { type: 'integer', description: '行高(pt)' },
    band: { ...BandSchema, description: '行类型，null为普通行' }
  },
  required: ['rowNumber', 'height'],
  description: '行定义对象'
}

/**
 * RowHeader 行头对象 Schema
 * 文档参考: row.md
 */
export const RowHeaderSchema = {
  type: 'object',
  properties: {
    rowNumber: { type: 'integer', minimum: 0, description: '行号，从0开始的行索引' },
    height: { type: 'integer', description: '行高(px)' },
    band: { ...BandSchema, description: '行类型，null为普通行' }
  },
  required: ['rowNumber'],
  description: '行头对象，用于管理行类型配置'
}

// ==================== 数据校验函数 ====================

/**
 * 校验行定义数据是否符合规范
 * @param row - 行定义对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateRowDefinition(row: any): string | undefined {
  if (!row || typeof row !== 'object') {
    return 'row 必须是对象类型'
  }

  // rowNumber 校验（从1开始）
  if (typeof row.rowNumber !== 'number' || row.rowNumber < 1) {
    return 'row.rowNumber 必须是大于0的整数'
  }

  // height 校验
  if (row.height !== undefined && typeof row.height !== 'number') {
    return 'row.height 必须是数字类型'
  }

  // band 校验
  const validBands = ['headerrepeat', 'footerrepeat', 'title', 'summary']
  if (row.band && !validBands.includes(row.band)) {
    return `row.band 必须是 ${validBands.join('/')} 之一或为 null`
  }

  return undefined
}

/**
 * 校验行头对象是否符合规范
 * @param rowHeader - 行头对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateRowHeader(rowHeader: any): string | undefined {
  if (!rowHeader || typeof rowHeader !== 'object') {
    return 'rowHeader 必须是对象类型'
  }

  // rowNumber 校验（从0开始）
  if (typeof rowHeader.rowNumber !== 'number' || rowHeader.rowNumber < 0) {
    return 'rowHeader.rowNumber 必须是非负整数'
  }

  // height 校验
  if (rowHeader.height !== undefined && typeof rowHeader.height !== 'number') {
    return 'rowHeader.height 必须是数字类型'
  }

  // band 校验
  const validBands = ['headerrepeat', 'footerrepeat', 'title', 'summary']
  if (rowHeader.band && !validBands.includes(rowHeader.band)) {
    return `rowHeader.band 必须是 ${validBands.join('/')} 之一或为 null`
  }

  return undefined
}