/**
 * 列定义数据模型 JSON Schema 定义
 *
 * 本文件定义了报表列定义的核心数据模型、约束规则和校验函数。
 * 列定义用于管理报表中每一列的宽度和显示状态。
 *
 * 在 set_columns 工具中，键为列号（从1开始），值为本 Schema 描述的列定义对象。
 */

// ==================== 列定义 Schema ====================

/**
 * ColumnDefinition 列定义 Schema
 * 文档参考: page-config.md, col.md
 *
 * 注意：列号由外层对象的 key 决定，value 中不再包含 columnNumber 字段
 */
export const ColumnDefinitionSchema = {
  type: 'object',
  properties: {
    width: { type: 'integer', description: '列宽(px)' },
    hide: { type: 'boolean', description: '是否隐藏列' }
  },
  required: ['width'],
  description: '列定义对象（列号由外层对象的 key 决定）'
}

// ==================== 数据校验函数 ====================

/**
 * 校验列定义数据是否符合规范
 * 列号由调用方在外层对象的 key 中传入，不在 value 中校验
 *
 * @param column - 列定义对象
 * @returns 错误信息，undefined 表示校验通过
 */
export function validateColumnDefinition(column: any): string | undefined {
  if (!column || typeof column !== 'object') {
    return 'column 必须是对象类型'
  }

  // width 校验
  if (typeof column.width !== 'number') {
    return 'column.width 必须是数字类型'
  }

  // hide 校验
  if (column.hide !== undefined && typeof column.hide !== 'boolean') {
    return 'column.hide 必须是布尔类型'
  }

  return undefined
}

// ==================== 数据规范化函数 ====================

/**
 * 规范化单个列定义：补齐缺失的 hide 等可选字段
 * @param column - LLM 传入的列定义对象，可为 null/undefined/部分字段缺失
 * @returns 符合 ColumnDefinitionSchema 规范的完整列定义对象
 */
export function normalizeColumnDefinition(column: any): Record<string, any> {
  // 默认模板：hide 为 false 表示不隐藏
  const base: Record<string, any> = {
    hide: false
  }
  // 防御：column 不是对象（LLM 传 null/字符串/数字等）时直接返回基线
  if (!column || typeof column !== 'object' || Array.isArray(column)) {
    return base
  }
  // 浅合并：LLM 传入的字段覆盖模板默认值
  Object.assign(base, column)
  return base
}

/**
 * 规范化批量列定义：遍历 columns 的列号 key，调用 normalizeColumnDefinition 逐个补齐
 * @param columns - LLM 传入的批量列定义对象，key 为列号（从1开始）
 * @returns 规范化后的批量列定义对象，key 仍保持列号格式
 */
export function normalizeColumnDefinitions(columns: any): Record<string, any> {
  const result: Record<string, any> = {}
  // 防御：columns 不是对象时返回空对象
  if (!columns || typeof columns !== 'object' || Array.isArray(columns)) {
    return result
  }
  for (const key of Object.keys(columns)) {
    // 仅处理合法的列号 key；其它原样透传（validate 会报错）
    const columnNumber = parseInt(key, 10)
    if (isNaN(columnNumber) || columnNumber < 1) {
      result[key] = columns[key]
      continue
    }
    result[key] = normalizeColumnDefinition(columns[key])
  }
  return result
}
