/**
 * 行定义数据模型 JSON Schema 定义
 *
 * 本文件定义了报表行定义的核心数据模型、约束规则和校验函数。
 * 行定义用于管理报表中每一行的高度和类型配置。
 *
 * 在 set_rows 工具中，键为行号（从1开始），值为本 Schema 描述的行定义对象。
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
 *
 * 注意：行号由外层对象的 key 决定，value 中不再包含 rowNumber 字段
 */
export const RowDefinitionSchema = {
  type: 'object',
  properties: {
    height: { type: 'integer', description: '行高(pt)' },
    band: { ...BandSchema, description: '行类型，null为普通行' }
  },
  required: ['height'],
  description: '行定义对象（行号由外层对象的 key 决定）'
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
 * 行号由调用方在外层对象的 key 中传入，不在 value 中校验
 *
 * @param row - 行定义对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateRowDefinition(row: any): string | undefined {
  if (!row || typeof row !== 'object') {
    return 'row 必须是对象类型'
  }

  // height 校验
  if (typeof row.height !== 'number') {
    return 'row.height 必须是数字类型'
  }

  // band 校验
  const validBands = ['headerrepeat', 'footerrepeat', 'title', 'summary']
  if (row.band !== undefined && row.band !== null && !validBands.includes(row.band)) {
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

// ==================== 数据规范化函数 ====================

/**
 * 规范化单个行定义：补齐缺失的 band 等可选字段
 * @param row - LLM 传入的行定义对象，可为 null/undefined/部分字段缺失
 * @returns 符合 RowDefinitionSchema 规范的完整行定义对象
 */
export function normalizeRowDefinition(row: any): Record<string, any> {
  // 默认模板：band 为 null 表示普通行
  const base: Record<string, any> = {
    band: null
  }
  // 防御：row 不是对象（LLM 传 null/字符串/数字等）时直接返回基线
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return base
  }
  // 浅合并：LLM 传入的字段覆盖模板默认值
  Object.assign(base, row)
  return base
}

/**
 * 规范化批量行定义：遍历 rows 的行号 key，调用 normalizeRowDefinition 逐个补齐
 * @param rows - LLM 传入的批量行定义对象，key 为行号（从1开始）
 * @returns 规范化后的批量行定义对象，key 仍保持行号格式
 */
export function normalizeRowDefinitions(rows: any): Record<string, any> {
  const result: Record<string, any> = {}
  // 防御：rows 不是对象时返回空对象
  if (!rows || typeof rows !== 'object' || Array.isArray(rows)) {
    return result
  }
  for (const key of Object.keys(rows)) {
    // 仅处理合法的行号 key；其它原样透传（validate 会报错）
    const rowNumber = parseInt(key, 10)
    if (isNaN(rowNumber) || rowNumber < 1) {
      result[key] = rows[key]
      continue
    }
    result[key] = normalizeRowDefinition(rows[key])
  }
  return result
}
