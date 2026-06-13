import type { ToolDefinition } from './types'
import { executeCode } from '@/views/export/iframe-utils'
import {
    CellPositionSchema,
    CellsSchema, getCellTemplateByType, getExpressionCellWithConditionTemplate,
    normalizeCells,
    validateCells
} from './schema/index'

/**
 * 批量读取单元格数据工具
 */
export const readCellsTool: ToolDefinition<{
  cellPositionArray: Array<{ row: number; col: number }>;
}> = {
  name: 'read_cells',
  description: '批量读取多个单元格数据，返回以 "row,col" 为key的单元格定义对象。行列号从1开始。适用于需要同时读取多个单元格的场景，一次调用即可获取全部目标单元格。',
  inputSchema: {
    type: 'object',
    properties: {
      cellPositionArray: {
        type: 'array',
        items: CellPositionSchema,
        description: '单元格坐标数组，每个元素包含 row（行号，从1开始，A等价于1）和 col（列号，从1开始）'
      }
    },
    required: ['cellPositionArray']
  },
  execute: async ({ cellPositionArray }) => {
    return executeCode(`readCells({cellPositionArray:${JSON.stringify(cellPositionArray)}})`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 批量写入单元格定义工具
 */
export const writeCellsTool: ToolDefinition<{
  cells: Record<string, any>;
}> = {
  name: 'write_cells',
  description: '批量写入多个单元格。key为 "row,col" 格式（从1开始）。执行前自动备份，执行后回读验证。返回 { success, message } 结构。',
  inputSchema: {
    type: 'object',
    properties: {
      cells: CellsSchema
    },
    required: ['cells']
  },
  execute: async ({ cells }) => {
    const normalized = normalizeCells(cells)
    return executeCode(`writeCells({cells:${JSON.stringify(normalized)}})`)
  },
  readOnly: false,
  requireConfirm: false,
  validate: ({ cells }) => validateCells(cells)
}

/**
 * 合并/拆分单元格工具
 */
export const mergeCellsTool: ToolDefinition<{
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}> = {
  name: 'merge_cells',
  description: `合并或拆分单元格。如果选中区域已合并则拆分，未合并则合并。行列索引从0开始。返回 { success: true/false, message: '...' } 结构，success=true 表示成功，message 包含详细信息。`,
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
    return executeCode(`mergeCells({startRow:${startRow},startCol:${startCol},endRow:${endRow},endCol:${endCol}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 备份数据工具
 */
export const backupDataTool: ToolDefinition<{
  description?: string;
  type?: string;
}> = {
  name: 'backup_data',
  description: `备份当前报表数据快照。在执行修改操作前自动调用，也可手动调用。最多保留最近20步备份。返回 { success: true/false, message: '...' } 结构，success=true 表示成功，message 包含详细信息。`,
  inputSchema: {
    type: 'object',
    properties: {
      description: { type: 'string', description: '备份描述，说明当前操作内容' },
      type: { type: 'string', description: '备份数据类型标识' }
    },
    required: []
  },
  execute: async ({ description, type }) => {
    const args: string[] = []
    if (description) args.push(`description:'${description}'`)
    if (type) args.push(`type:'${type}'`)
    return executeCode(`backupData({${args.join(',')}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 还原数据工具
 */
export const restoreDataTool: ToolDefinition<{}> = {
  name: 'restore_data',
  description: '还原最近一次修改前的数据。类似撤销操作，只能一步步还原。当AI操作发生异常时使用此工具回退。',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    return executeCode(`restoreData()`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 清空单元格内容工具
 */
export const clearCellContentTool: ToolDefinition<{
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}> = {
  name: 'clear_cell_content',
  description: `清空指定区域单元格的内容，保留样式不变。行列索引从0开始。返回 { success: true/false, message: '...' } 结构，success=true 表示成功，message 包含详细信息。`,
  inputSchema: {
    type: 'object',
    properties: {
      startRow: { type: 'integer', description: '起始行索引，从0开始' },
      endRow: { type: 'integer', description: '结束行索引，从0开始' },
      startCol: { type: 'integer', description: '起始列索引，从0开始' },
      endCol: { type: 'integer', description: '结束列索引，从0开始' }
    },
    required: ['startRow', 'endRow', 'startCol', 'endCol']
  },
  execute: async ({ startRow, endRow, startCol, endCol }) => {
    return executeCode(`clearCellContent({startRow:${startRow},endRow:${endRow},startCol:${startCol},endCol:${endCol}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 清空单元格样式工具
 */
export const clearCellStyleTool: ToolDefinition<{
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}> = {
  name: 'clear_cell_style',
  description: `清空指定区域单元格的样式，重置为默认样式，保留内容不变。行列索引从0开始。返回 { success: true/false, message: '...' } 结构，success=true 表示成功，message 包含详细信息。`,
  inputSchema: {
    type: 'object',
    properties: {
      startRow: { type: 'integer', description: '起始行索引，从0开始' },
      endRow: { type: 'integer', description: '结束行索引，从0开始' },
      startCol: { type: 'integer', description: '起始列索引，从0开始' },
      endCol: { type: 'integer', description: '结束列索引，从0开始' }
    },
    required: ['startRow', 'endRow', 'startCol', 'endCol']
  },
  execute: async ({ startRow, endRow, startCol, endCol }) => {
    return executeCode(`clearCellStyle({startRow:${startRow},endRow:${endRow},startCol:${startCol},endCol:${endCol}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 清空单元格全部工具
 */
export const clearCellAllTool: ToolDefinition<{
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}> = {
  name: 'clear_cell_all',
  description: `清空指定区域单元格的全部内容和样式，重置为默认空白单元格。行列索引从0开始。返回 { success: true/false, message: '...' } 结构，success=true 表示成功，message 包含详细信息。`,
  inputSchema: {
    type: 'object',
    properties: {
      startRow: { type: 'integer', description: '起始行索引，从0开始' },
      endRow: { type: 'integer', description: '结束行索引，从0开始' },
      startCol: { type: 'integer', description: '起始列索引，从0开始' },
      endCol: { type: 'integer', description: '结束列索引，从0开始' }
    },
    required: ['startRow', 'endRow', 'startCol', 'endCol']
  },
  execute: async ({ startRow, endRow, startCol, endCol }) => {
    return executeCode(`clearCellAll({startRow:${startRow},endRow:${endRow},startCol:${startCol},endCol:${endCol}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 获取单元格模板工具
 */

export const getCellTemplateTool: ToolDefinition<{
    type: 'simple' | 'dataset' | 'expression' | 'expression_with_condition' | 'image' | 'qrcode' | 'barcode';
    rowIndex: number;
    colIndex: number;
    options?: {
        datasetName?: string;
        property?: string;
        aggregate?: string;
        expression?: string;
        imagePath?: string;
        qrcodeText?: string;
        barcodeText?: string;
        barcodeFormat?: string;
    };
}> = {
    name: 'get_cell_template',
    description: `获取符合规范的单元格模板。返回完整的单元格定义模板，包含所有必填字段和默认值。
【参数】type: simple/dataset/expression/expression_with_condition/image/qrcode/barcode；rowIndex/colIndex: 单元格坐标（从0开始）；options: 可选参数。
【重要】禁止凭空构造cell对象，必须基于此模板或read_cell返回的数据修改。`,
    inputSchema: {
        type: 'object',
        properties: {
            type: {
                type: 'string',
                enum: ['simple', 'dataset', 'expression', 'expression_with_condition', 'image', 'qrcode', 'barcode'],
                description: '单元格值类型；expression_with_condition 返回带 3 组条件示例的完整模板'
            },
            rowIndex: { type: 'integer', description: '行索引，从0开始' },
            colIndex: { type: 'integer', description: '列索引，从0开始' },
            options: {
                type: 'object',
                properties: {
                    datasetName: { type: 'string', description: '数据集名称（dataset类型必填）' },
                    property: { type: 'string', description: '字段名（dataset类型必填）' },
                    aggregate: { type: 'string', enum: ['group', 'select', 'sum', 'count', 'max', 'min', 'avg'], description: '聚合方式' },
                    expression: { type: 'string', description: '表达式内容（expression类型）' },
                    imagePath: { type: 'string', description: '图片路径（image类型）' },
                    qrcodeText: { type: 'string', description: '二维码内容（qrcode类型）' },
                    barcodeText: { type: 'string', description: '条码内容（barcode类型）' },
                    barcodeFormat: { type: 'string', description: '条码格式，如AZTEC' }
                }
            }
        },
        required: ['type', 'rowIndex', 'colIndex']
    },
    execute: async ({ type, rowIndex, colIndex, options }) => {
        if (type === 'expression_with_condition') {
            // 表达式 + 完整条件属性模板，3 组示例覆盖单条件/AND/OR
            return getExpressionCellWithConditionTemplate(rowIndex, colIndex, options?.expression || 'B4')
        }
        return getCellTemplateByType(type, rowIndex, colIndex, options)
    },
    readOnly: true,
    requireConfirm: false
}
