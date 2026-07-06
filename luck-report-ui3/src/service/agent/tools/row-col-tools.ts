import type { ToolDefinition } from './types'
import {
  getRows,
  setRows,
  getColumns,
  setColumns,
  insertRow,
  deleteRow,
  insertCol,
  deleteCol
} from '@/utils/tools'
import {
  RowDefinitionSchema,
  ColumnDefinitionSchema,
  validateRowDefinition,
  validateColumnDefinition,
  normalizeRowDefinitions,
  normalizeColumnDefinitions,
  getRowDefinitionsTemplate,
  getColumnDefinitionsTemplate
} from './schema'

/**
 * 获取行数据工具
 */
export const getRowsTool: ToolDefinition<{
  rowNumbers?: number[];
}> = {
  name: 'get_rows',
  description: '获取表格行数据。rowNumbers 为行号数组（从1开始），支持一次获取多行，按需返回 { 行号: 行定义 } 格式的对象；不传 rowNumbers 则返回全部行。',
  inputSchema: {
    type: 'object',
    properties: {
      rowNumbers: {
        type: 'array',
        items: { type: 'integer', minimum: 1 },
        description: '行号数组（从1开始），按需返回指定行；不传则返回全部行'
      }
    },
    required: []
  },
  execute: async ({ rowNumbers }) => {
    return getRows({ rowNumbers })
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 批量设置行数据工具
 */
export const setRowsTool: ToolDefinition<{
  rows: Record<string, any>;
}> = {
  name: 'set_rows',
  description: `批量更新行数据。rows 为 { 行号: 行定义 } 格式的对象，行号作为 key（从1开始），支持一次传入多行。执行前自动备份，异常时自动回滚。返回 { success, message } 结构。
【数据约束】key 为行号（从1开始）；value.height: 行高(pt)必填；value.band: null/headerrepeat/footerrepeat/title/summary。`,
  inputSchema: {
    type: 'object',
    properties: {
      rows: {
        type: 'object',
        additionalProperties: RowDefinitionSchema,
        description: '行定义对象，key 为行号（从1开始），value 为行定义（包含 height 必填、band 可选）'
      }
    },
    required: ['rows']
  },
  execute: async ({ rows }) => {
    // 校验每行数据
    for (const [key, row] of Object.entries(rows)) {
      const rowNumber = parseInt(key, 10)
      if (isNaN(rowNumber) || rowNumber < 1) {
        return { success: false, message: `数据校验失败: 无效的行号 "${key}"` }
      }
      const error = validateRowDefinition(row)
      if (error) {
        return { success: false, message: `行 ${rowNumber} 数据校验失败: ${error}` }
      }
    }
    const normalized = normalizeRowDefinitions(rows)
    return setRows({ rows: normalized })
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 获取行定义模板工具
 */
export const getRowDefinitionsTemplateTool: ToolDefinition<{}> = {
  name: 'get_row_definitions_template',
  description: `获取符合规范的行定义模板，返回 { 行号: 行定义 } 格式的对象，包含 height（必填）和 band（可选）字段。禁止凭空构造 rows 对象，必须基于此模板或 get_rows 返回的数据修改。`,
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    return getRowDefinitionsTemplate()
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 获取列数据工具
 */
export const getColumnsTool: ToolDefinition<{
  columnNumbers?: number[];
}> = {
  name: 'get_columns',
  description: '获取表格列数据。columnNumbers 为列号数组（从1开始），支持一次获取多列，按需返回 { 列号: 列定义 } 格式的对象；不传 columnNumbers 则返回全部列。',
  inputSchema: {
    type: 'object',
    properties: {
      columnNumbers: {
        type: 'array',
        items: { type: 'integer', minimum: 1 },
        description: '列号数组（从1开始），按需返回指定列；不传则返回全部列'
      }
    },
    required: []
  },
  execute: async ({ columnNumbers }) => {
    return getColumns({ columnNumbers })
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 批量设置列数据工具
 */
export const setColumnsTool: ToolDefinition<{
  columns: Record<string, any>;
}> = {
  name: 'set_columns',
  description: `批量更新列数据。columns 为 { 列号: 列定义 } 格式的对象，列号作为 key（从1开始），支持一次传入多列。执行前自动备份，异常时自动回滚。返回 { success, message } 结构。
【数据约束】key 为列号（从1开始）；value.width: 列宽(px)必填；value.hide: 是否隐藏列可选。`,
  inputSchema: {
    type: 'object',
    properties: {
      columns: {
        type: 'object',
        additionalProperties: ColumnDefinitionSchema,
        description: '列定义对象，key 为列号（从1开始），value 为列定义（包含 width 必填、hide 可选）'
      }
    },
    required: ['columns']
  },
  execute: async ({ columns }) => {
    // 校验每列数据
    for (const [key, column] of Object.entries(columns)) {
      const columnNumber = parseInt(key, 10)
      if (isNaN(columnNumber) || columnNumber < 1) {
        return { success: false, message: `数据校验失败: 无效的列号 "${key}"` }
      }
      const error = validateColumnDefinition(column)
      if (error) {
        return { success: false, message: `列 ${columnNumber} 数据校验失败: ${error}` }
      }
    }
    const normalized = normalizeColumnDefinitions(columns)
    return setColumns({ columns: normalized })
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 获取列定义模板工具
 */
export const getColumnDefinitionsTemplateTool: ToolDefinition<{}> = {
  name: 'get_column_definitions_template',
  description: `获取符合规范的列定义模板，返回 { 列号: 列定义 } 格式的对象，包含 width（必填）和 hide（可选）字段。禁止凭空构造 columns 对象，必须基于此模板或 get_columns 返回的数据修改。`,
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    return getColumnDefinitionsTemplate()
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 添加行工具
 */
export const insertRowTool: ToolDefinition<{
  position: number;
  number?: number;
}> = {
  name: 'insert_row',
  description: `在指定位置插入行。会同时处理单元格数据和行头信息，确保数据一致性。position为行索引从0开始，number为插入行数默认1。支持批量操作，number 参数可一次插入连续多行。返回 { success: true/false, message: '...' } 结构，success=true 表示成功，message 包含详细信息。`,
  inputSchema: {
    type: 'object',
    properties: {
      position: { type: 'integer', description: '插入位置（行索引），从0开始' },
      number: { type: 'integer', description: '插入行数，默认1' }
    },
    required: ['position']
  },
  execute: async ({ position, number: num }) => {
    return insertRow({ position, number: num ?? 1 })
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 删除行工具
 */
export const deleteRowTool: ToolDefinition<{
  startRow: number;
  endRow: number;
}> = {
  name: 'delete_row',
  description: `删除指定范围的行。会同时处理单元格数据、合并单元格配置和行头信息。startRow和endRow为行索引从0开始。支持批量操作，指定起止行范围即可一次删除连续多行。返回 { success: true/false, message: '...' } 结构，success=true 表示成功，message 包含详细信息。`,
  inputSchema: {
    type: 'object',
    properties: {
      startRow: { type: 'integer', description: '起始行索引，从0开始' },
      endRow: { type: 'integer', description: '结束行索引，从0开始' }
    },
    required: ['startRow', 'endRow']
  },
  execute: async ({ startRow, endRow }) => {
    return deleteRow({ startRow, endRow })
  },
  readOnly: false,
  requireConfirm: true
}

/**
 * 插入列工具
 */
export const insertColTool: ToolDefinition<{
  position: number;
  number?: number;
}> = {
  name: 'insert_col',
  description: `在指定位置插入列。会同时处理单元格数据，确保数据一致性。position为列索引从0开始，number为插入列数默认1。支持批量操作，number 参数可一次插入连续多列。返回 { success: true/false, message: '...' } 结构，success=true 表示成功，message 包含详细信息。`,
  inputSchema: {
    type: 'object',
    properties: {
      position: { type: 'integer', description: '插入位置（列索引），从0开始' },
      number: { type: 'integer', description: '插入列数，默认1' }
    },
    required: ['position']
  },
  execute: async ({ position, number: num }) => {
    return insertCol({ position, number: num ?? 1 })
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 删除列工具
 */
export const deleteColTool: ToolDefinition<{
  startCol: number;
  endCol: number;
}> = {
  name: 'delete_col',
  description: `删除指定范围的列。会同时处理单元格数据、合并单元格配置。startCol和endCol为列索引从0开始。支持批量操作，指定起止列范围即可一次删除连续多列。返回 { success: true/false, message: '...' } 结构，success=true 表示成功，message 包含详细信息。`,
  inputSchema: {
    type: 'object',
    properties: {
      startCol: { type: 'integer', description: '起始列索引，从0开始' },
      endCol: { type: 'integer', description: '结束列索引，从0开始' }
    },
    required: ['startCol', 'endCol']
  },
  execute: async ({ startCol, endCol }) => {
    return deleteCol({ startCol, endCol })
  },
  readOnly: false,
  requireConfirm: true
}
