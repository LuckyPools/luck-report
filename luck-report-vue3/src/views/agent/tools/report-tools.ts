import type { ToolDefinition } from './types'
import { executeCode } from '@/views/export/iframe-utils'

/**
 * 读取单元格数据工具
 * 只读工具，可并发执行
 * 调用设计器的 readCellByAgent 方法获取单元格完整定义
 */
export const readCellTool: ToolDefinition<{ rowIndex: number; colIndex: number }> = {
  name: 'read_cell',
  description: '读取报表指定坐标的单元格数据，返回单元格的完整定义（值、样式、类型等）。行索引和列索引均从0开始。',
  inputSchema: {
    type: 'object',
    properties: {
      rowIndex: { type: 'integer', description: '行索引，从0开始' },
      colIndex: { type: 'integer', description: '列索引，从0开始' }
    },
    required: ['rowIndex', 'colIndex']
  },
  execute: async ({ rowIndex, colIndex }) => {
    return executeCode(`readCellByAgent({ rowIndex: ${rowIndex}, colIndex: ${colIndex} })`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 设置单元格值工具
 * 写操作，需串行执行
 * 调用设计器的 setCellByAgent 方法设置单元格值
 */
export const setCellTool: ToolDefinition<{ rowIndex: number; colIndex: number; cellValue: string }> = {
  name: 'set_cell_value',
  description: '设置报表指定坐标的单元格值。行索引和列索引均从0开始。仅支持设置简单文本值。',
  inputSchema: {
    type: 'object',
    properties: {
      rowIndex: { type: 'integer', description: '行索引，从0开始' },
      colIndex: { type: 'integer', description: '列索引，从0开始' },
      cellValue: { type: 'string', description: '要设置的单元格值' }
    },
    required: ['rowIndex', 'colIndex', 'cellValue']
  },
  execute: async ({ rowIndex, colIndex, cellValue }) => {
    const escaped = cellValue.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
    return executeCode(`setCellByAgent({ rowIndex: ${rowIndex}, colIndex: ${colIndex}, cellValue: '${escaped}' })`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 获取报表整体结构工具
 * 只读工具，返回当前报表的行列数、合并单元格、数据源等概要信息
 */
export const getReportSchemaTool: ToolDefinition = {
  name: 'get_report_schema',
  description: '获取当前报表的整体结构信息，包括行列数、合并单元格区域、已绑定的数据源等概要信息。在修改报表前应先调用此工具了解当前状态。',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  execute: async () => {
    return executeCode('getReportSchema()')
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 合并单元格工具
 * 写操作，需串行执行
 * 将指定矩形区域内的单元格合并
 */
export const mergeCellsTool: ToolDefinition<{
  startRow: number; startCol: number; endRow: number; endCol: number
}> = {
  name: 'merge_cells',
  description: '合并指定矩形区域内的单元格。起始和结束行列索引均从0开始，结束索引包含在内。',
  inputSchema: {
    type: 'object',
    properties: {
      startRow: { type: 'integer', description: '起始行索引，从0开始' },
      startCol: { type: 'integer', description: '起始列索引，从0开始' },
      endRow: { type: 'integer', description: '结束行索引，从0开始' },
      endCol: { type: 'integer', description: '结束列索引，从0开始' }
    },
    required: ['startRow', 'startCol', 'endRow', 'endCol']
  },
  execute: async ({ startRow, startCol, endRow, endCol }) => {
    return executeCode(`mergeCellsByAgent({ startRow: ${startRow}, startCol: ${startCol}, endRow: ${endRow}, endCol: ${endCol} })`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 设置单元格样式工具
 * 写操作，需串行执行
 * 支持设置字体、字号、颜色、背景色、对齐方式等样式属性
 */
export const setCellStyleTool: ToolDefinition<{
  rowIndex: number; colIndex: number; styleType: string; styleValue: string
}> = {
  name: 'set_cell_style',
  description: '设置指定单元格的样式属性。styleType 可选值：fontSize、fontFamily、bold、italic、underline、fontColor、bgColor、align、valign。styleValue 为对应的样式值。',
  inputSchema: {
    type: 'object',
    properties: {
      rowIndex: { type: 'integer', description: '行索引，从0开始' },
      colIndex: { type: 'integer', description: '列索引，从0开始' },
      styleType: {
        type: 'string',
        description: '样式类型，可选：fontSize、fontFamily、bold、italic、underline、fontColor、bgColor、align、valign',
        enum: ['fontSize', 'fontFamily', 'bold', 'italic', 'underline', 'fontColor', 'bgColor', 'align', 'valign']
      },
      styleValue: { type: 'string', description: '样式值，如 "14"、"#ff0000"、"center" 等' }
    },
    required: ['rowIndex', 'colIndex', 'styleType', 'styleValue']
  },
  execute: async ({ rowIndex, colIndex, styleType, styleValue }) => {
    const escaped = styleValue.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    return executeCode(`setCellStyleByAgent({ rowIndex: ${rowIndex}, colIndex: ${colIndex}, styleType: '${styleType}', styleValue: '${escaped}' })`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 插入行工具
 * 写操作，需串行执行且需用户确认
 */
export const insertRowsTool: ToolDefinition<{ rowIndex: number; count: number }> = {
  name: 'insert_rows',
  description: '在指定行位置插入指定数量的行。现有行会向下移动。',
  inputSchema: {
    type: 'object',
    properties: {
      rowIndex: { type: 'integer', description: '插入位置的行索引，从0开始' },
      count: { type: 'integer', description: '要插入的行数，默认1' }
    },
    required: ['rowIndex', 'count']
  },
  execute: async ({ rowIndex, count }) => {
    return executeCode(`insertRowsByAgent({ rowIndex: ${rowIndex}, count: ${count} })`)
  },
  readOnly: false,
  requireConfirm: true
}

/**
 * 插入列工具
 * 写操作，需串行执行且需用户确认
 */
export const insertColsTool: ToolDefinition<{ colIndex: number; count: number }> = {
  name: 'insert_cols',
  description: '在指定列位置插入指定数量的列。现有列会向右移动。',
  inputSchema: {
    type: 'object',
    properties: {
      colIndex: { type: 'integer', description: '插入位置的列索引，从0开始' },
      count: { type: 'integer', description: '要插入的列数，默认1' }
    },
    required: ['colIndex', 'count']
  },
  execute: async ({ colIndex, count }) => {
    return executeCode(`insertColsByAgent({ colIndex: ${colIndex}, count: ${count} })`)
  },
  readOnly: false,
  requireConfirm: true
}
