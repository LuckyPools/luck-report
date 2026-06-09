/**
 * 列定义数据模型 JSON Schema 定义
 *
 * 本文件定义了报表列定义的核心数据模型、约束规则和校验函数。
 * 列定义用于管理报表中每一列的宽度和显示状态。
 */

// ==================== 列定义 Schema ====================

/**
 * ColumnDefinition 列定义 Schema
 * 文档参考: page-config.md, col.md
 */
export const ColumnDefinitionSchema = {
  type: 'object',
  properties: {
    columnNumber: { type: 'integer', minimum: 1, description: '列号，从1开始' },
    width: { type: 'integer', description: '列宽(px)' },
    hide: { type: 'boolean', description: '是否隐藏列' }
  },
  required: ['columnNumber', 'width'],
  description: '列定义对象'
}

// ==================== 数据校验函数 ====================

/**
 * 校验列定义数据是否符合规范
 * @param column - 列定义对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateColumnDefinition(column: any): string | undefined {
  if (!column || typeof column !== 'object') {
    return 'column 必须是对象类型'
  }

  // columnNumber 校验（从1开始）
  if (typeof column.columnNumber !== 'number' || column.columnNumber < 1) {
    return 'column.columnNumber 必须是大于0的整数'
  }

  // width 校验
  if (column.width !== undefined && typeof column.width !== 'number') {
    return 'column.width 必须是数字类型'
  }

  // hide 校验
  if (column.hide !== undefined && typeof column.hide !== 'boolean') {
    return 'column.hide 必须是布尔类型'
  }

  return undefined
}