import type { ToolDefinition } from './types'
import { vectorSearch } from '@/api/vector'
import { executeCode } from '@/views/export/iframe-utils'
import { getSchemaPrompt, getBuildinDatasources } from '@/api/datasource'

/**
 * 工具执行结果枚举
 * 规范写操作工具的返回值类型，与设计器端 utils.js 的 ToolResult 保持一致
 */
export const ToolResult = {
  /** 执行成功 */
  SUCCESS: 1,
  /** 执行失败 */
  ERROR: 0
} as const

/**
 * 搜索业务知识工具
 * 通过后端向量检索 API 查询业务相关的知识和术语
 * 只读工具，可并发执行
 * 调用后端 /api/vector/search 接口，传入 vectorType=businessTerm
 *
 * 使用场景：
 * - 用户询问与实际业务相关的问题时
 * - 需要了解业务术语、业务规则、业务逻辑时
 * - 需要查询业务背景知识时
 */
export const searchBusinessKnowledgeTool: ToolDefinition<{
  query: string;
  topK?: number;
}> = {
  name: 'search_business_knowledge',
  description: '搜索业务知识和术语。当用户询问与实际业务相关的问题、需要了解业务术语、业务规则或业务背景知识时调用此工具。',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: '搜索关键词，如"销售额计算规则"、"客户等级分类"、"库存预警逻辑"' },
      topK: { type: 'integer', description: '返回条数，默认5' }
    },
    required: ['query']
  },
  execute: async ({ query, topK }) => {
    return vectorSearch({
      query,
      vectorType: 'businessTerm',
      topK: topK ?? 5,
      threshold: 0.5
    })
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 搜索智能体知识工具
 * 通过后端向量检索 API 查询报表制作的经验、案例、最佳实践
 * 只读工具，可并发执行
 * 调用后端 /api/vector/search 接口，传入 vectorType=agentKnowledge
 *
 * 使用场景：
 * - 遇到难以解决的报表问题时
 * - 需要参考报表制作的案例和最佳实践时
 * - 需要了解报表设计的经验和技巧时
 */
export const searchAgentKnowledgeTool: ToolDefinition<{
  query: string;
  topK?: number;
}> = {
  name: 'search_agent_knowledge',
  description: '搜索报表制作的经验、案例和最佳实践。当遇到难以解决的报表问题、需要参考案例或了解报表设计经验时调用此工具。',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: '搜索关键词，如"动态列报表"、"分组汇总"、"条件格式化"' },
      topK: { type: 'integer', description: '返回条数，默认5' }
    },
    required: ['query']
  },
  execute: async ({ query, topK }) => {
    return vectorSearch({
      query,
      vectorType: 'agentKnowledge',
      topK: topK ?? 5,
      threshold: 0.5
    })
  },
  readOnly: true,
  requireConfirm: false
}

// ============ 单元格操作工具 ============

/**
 * 读取单元格数据工具
 * 读取指定行列坐标的单元格定义，包含值、样式、表达式等信息
 * 只读工具，可并发执行
 */
export const readCellTool: ToolDefinition<{
  rowIndex: number;
  colIndex: number;
}> = {
  name: 'read_cell',
  description: '读取指定坐标的单元格数据，返回单元格的完整定义（值、样式、表达式等）。行列索引从0开始。',
  inputSchema: {
    type: 'object',
    properties: {
      rowIndex: { type: 'integer', description: '单元格行坐标，从0开始' },
      colIndex: { type: 'integer', description: '单元格列坐标，从0开始' }
    },
    required: ['rowIndex', 'colIndex']
  },
  execute: async ({ rowIndex, colIndex }) => {
    return executeCode(`readCell({rowIndex:${rowIndex},colIndex:${colIndex}})`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 写入单元格定义工具
 * 写入指定坐标的单元格完整定义数据，执行前自动备份，执行后回读验证
 * 写操作工具，需串行执行
 */
export const writeCellTool: ToolDefinition<{
  rowIndex: number;
  colIndex: number;
  cell: any;
}> = {
  name: 'write_cell',
  description: `写入指定坐标的单元格完整定义数据。行列索引从0开始。执行前自动备份当前单元格数据，执行后回读验证。返回${ToolResult.SUCCESS}表示成功，${ToolResult.ERROR}表示失败。`,
  inputSchema: {
    type: 'object',
    properties: {
      rowIndex: { type: 'integer', description: '单元格行坐标，从0开始' },
      colIndex: { type: 'integer', description: '单元格列坐标，从0开始' },
      cell: { type: 'object', description: '完整的单元格定义对象，需符合 CellDefinition 数据模型' }
    },
    required: ['rowIndex', 'colIndex', 'cell']
  },
  execute: async ({ rowIndex, colIndex, cell }) => {
    return executeCode(`writeCell({rowIndex:${rowIndex},colIndex:${colIndex},cell:${JSON.stringify(cell)}})`)
  },
  readOnly: false,
  requireConfirm: false
}

// ============ 数据源操作工具 ============

/**
 * 获取数据源列表工具
 * 可获取全部数据源或按名称查询单个数据源
 * 只读工具，可并发执行
 */
export const getDatasourcesTool: ToolDefinition<{
  name?: string;
}> = {
  name: 'get_datasources',
  description: '获取数据源数据。不传name返回全部数据源列表，传入name返回指定名称的数据源对象。',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '数据源名称，不传则返回全部' }
    },
    required: []
  },
  execute: async ({ name }) => {
    const args: string[] = []
    if (name !== undefined) {
      args.push(`name:'${name}'`)
    }
    return executeCode(`getDatasources({${args.join(',')}})`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 设置全部数据源工具
 * 整体替换数据源列表
 * 写操作工具，需串行执行，需用户确认
 */
export const setDatasourcesTool: ToolDefinition<{
  datasources: any[];
}> = {
  name: 'set_datasources',
  description: '整体替换全部数据源列表。此操作会覆盖现有数据源，请谨慎使用。',
  inputSchema: {
    type: 'object',
    properties: {
      datasources: { type: 'array', description: '数据源定义数组' }
    },
    required: ['datasources']
  },
  execute: async ({ datasources }) => {
    return executeCode(`setDatasources({datasources:${JSON.stringify(datasources)}})`)
  },
  readOnly: false,
  requireConfirm: true
}

/**
 * 添加数据源工具
 * 向报表中添加一个新的数据源
 * 写操作工具，需串行执行
 */
export const addDatasourceTool: ToolDefinition<{
  datasource: any;
}> = {
  name: 'add_datasource',
  description: '添加一个新的数据源到报表中。',
  inputSchema: {
    type: 'object',
    properties: {
      datasource: { type: 'object', description: '数据源定义对象，包含name、type等属性' }
    },
    required: ['datasource']
  },
  execute: async ({ datasource }) => {
    return executeCode(`addDatasource({datasource:${JSON.stringify(datasource)}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 更新数据源工具
 * 按名称匹配替换数据源定义
 * 写操作工具，需串行执行
 */
export const updateDatasourceTool: ToolDefinition<{
  name: string;
  datasource: any;
}> = {
  name: 'update_datasource',
  description: '按名称匹配更新数据源定义。会完全替换该名称对应的数据源。',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '目标数据源名称' },
      datasource: { type: 'object', description: '新的数据源定义对象' }
    },
    required: ['name', 'datasource']
  },
  execute: async ({ name, datasource }) => {
    return executeCode(`updateDatasource({name:'${name}',datasource:${JSON.stringify(datasource)}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 删除数据源工具
 * 按名称删除数据源
 * 写操作工具，需串行执行，需用户确认
 */
export const removeDatasourceTool: ToolDefinition<{
  name: string;
}> = {
  name: 'remove_datasource',
  description: '按名称删除数据源。此操作不可撤销，请谨慎使用。',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '要删除的数据源名称' }
    },
    required: ['name']
  },
  execute: async ({ name }) => {
    return executeCode(`removeDatasource({name:'${name}'})`)
  },
  readOnly: false,
  requireConfirm: true
}

/**
 * 获取Schema提示词工具
 * 调用agent后台的schema-prompt接口，获取数据源的表关联关系和结构信息
 * 支持通过数据源ID或名称查询（二选一）
 * 通过向量检索召回相关表结构，合并逻辑外键，生成格式化的提示词
 * 用于Agent构建SQL时理解数据源的表结构
 * 只读工具，可并发执行
 */
export const getTableRelationTool: ToolDefinition<{
  datasourceId?: number;
  datasourceName?: string;
  query: string;
}> = {
  name: 'get_table_relation',
  description: '获取内置数据源的表字段和表关联信息。可以传入datasourceId或datasourceName（二选一），返回格式化的表结构信息，包括表名、字段、表关联关系等，用于构建SQL数据集。',
  inputSchema: {
    type: 'object',
    properties: {
      datasourceId: {
        type: 'integer',
        description: '数据源ID（与datasourceName二选一），从设计器内置数据源列表中获取'
      },
      datasourceName: {
        type: 'string',
        description: '数据源名称（与datasourceId二选一），设计器内置数据源的名称'
      },
      query: {
        type: 'string',
        description: '待查询的表名，如"用户表"'
      }
    },
    required: ['query']
  },
  execute: async ({ datasourceId, datasourceName, query }) => {
    // 调用agent后台的schema-prompt接口
    const params: { id?: number; name?: string; query: string } = { query }

    if (datasourceId !== undefined) {
      params.id = datasourceId
    } else if (datasourceName !== undefined) {
      params.name = datasourceName
    } else {
      throw new Error('必须提供 datasourceId 或 datasourceName')
    }

    const response = await getSchemaPrompt(params)
    if (response.success) {
      return response.data
    } else {
      throw new Error(response.message || '获取Schema提示词失败')
    }
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 获取所有可用的数据源列表工具（来自Agent数据库）
 * 调用agent后台的buildin/list接口，获取所有注册到Spring容器的BuildinDatasource Bean信息
 * 返回数据源名称、ID等信息，用于在设计报表时选择使用哪个数据源
 * 只读工具，可并发执行
 */
export const getAvailableDatasourcesTool: ToolDefinition<{}> = {
  name: 'get_available_datasources',
  description: '获取所有可用的数据源列表（来自Agent后台数据库配置）。返回数据源名称、ID等信息，用于在设计报表时选择使用哪个数据源。',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    // 调用Agent后台接口获取内置数据源列表
    const response = await getBuildinDatasources()
    if (response.success) {
      return response.data
    } else {
      throw new Error(response.message || '获取数据源列表失败')
    }
  },
  readOnly: true,
  requireConfirm: false
}

// ============ 数据集操作工具 ============

/**
 * 获取数据集工具
 * 可获取所有数据集或按数据源名称和数据集名称精确查询
 * 只读工具，可并发执行
 */
export const getDatasetsTool: ToolDefinition<{
  datasourceName?: string;
  datasetName?: string;
}> = {
  name: 'get_datasets',
  description: '获取数据集数据。不传参数返回所有数据集；传datasourceName返回该数据源下的数据集；同时传datasourceName和datasetName返回指定数据集。',
  inputSchema: {
    type: 'object',
    properties: {
      datasourceName: { type: 'string', description: '数据源名称' },
      datasetName: { type: 'string', description: '数据集名称，需配合datasourceName使用' }
    },
    required: []
  },
  execute: async ({ datasourceName, datasetName }) => {
    const args: string[] = []
    if (datasourceName !== undefined) {
      args.push(`datasourceName:'${datasourceName}'`)
    }
    if (datasetName !== undefined) {
      args.push(`datasetName:'${datasetName}'`)
    }
    return executeCode(`getDatasets({${args.join(',')}})`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 添加数据集工具
 * 向指定数据源下添加一个新数据集
 * 写操作工具，需串行执行
 */
export const addDatasetTool: ToolDefinition<{
  datasourceName: string;
  dataset: any;
}> = {
  name: 'add_dataset',
  description: '向指定数据源下添加一个新的数据集。',
  inputSchema: {
    type: 'object',
    properties: {
      datasourceName: { type: 'string', description: '目标数据源名称' },
      dataset: { type: 'object', description: '数据集定义对象' }
    },
    required: ['datasourceName', 'dataset']
  },
  execute: async ({ datasourceName, dataset }) => {
    return executeCode(`addDataset({datasourceName:'${datasourceName}',dataset:${JSON.stringify(dataset)}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 更新数据集工具
 * 按数据源名称和数据集名称匹配替换数据集定义
 * 写操作工具，需串行执行
 */
export const updateDatasetTool: ToolDefinition<{
  datasourceName: string;
  datasetName: string;
  dataset: any;
}> = {
  name: 'update_dataset',
  description: '按数据源名称和数据集名称匹配更新数据集定义。会完全替换该数据集。',
  inputSchema: {
    type: 'object',
    properties: {
      datasourceName: { type: 'string', description: '目标数据源名称' },
      datasetName: { type: 'string', description: '目标数据集名称' },
      dataset: { type: 'object', description: '新的数据集定义对象' }
    },
    required: ['datasourceName', 'datasetName', 'dataset']
  },
  execute: async ({ datasourceName, datasetName, dataset }) => {
    return executeCode(`updateDataset({datasourceName:'${datasourceName}',datasetName:'${datasetName}',dataset:${JSON.stringify(dataset)}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 删除数据集工具
 * 按数据源名称和数据集名称删除数据集
 * 写操作工具，需串行执行，需用户确认
 */
export const removeDatasetTool: ToolDefinition<{
  datasourceName: string;
  datasetName: string;
}> = {
  name: 'remove_dataset',
  description: '按数据源名称和数据集名称删除数据集。此操作不可撤销，请谨慎使用。',
  inputSchema: {
    type: 'object',
    properties: {
      datasourceName: { type: 'string', description: '目标数据源名称' },
      datasetName: { type: 'string', description: '要删除的数据集名称' }
    },
    required: ['datasourceName', 'datasetName']
  },
  execute: async ({ datasourceName, datasetName }) => {
    return executeCode(`removeDataset({datasourceName:'${datasourceName}',datasetName:'${datasetName}'})`)
  },
  readOnly: false,
  requireConfirm: true
}

// ============ 查询表单操作工具 ============

/**
 * 获取查询表单工具
 * 获取报表的查询表单设计数据
 * 只读工具，可并发执行
 */
export const getSearchFormTool: ToolDefinition<{}> = {
  name: 'get_search_form',
  description: '获取报表的查询表单设计数据，包含表单字段定义、布局等信息。',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    return executeCode(`getSearchForm()`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 设置查询表单工具
 * 整体替换查询表单设计数据
 * 写操作工具，需串行执行
 */
export const setSearchFormTool: ToolDefinition<{
  searchForm: any;
}> = {
  name: 'set_search_form',
  description: '整体替换查询表单设计数据。此操作会覆盖现有表单配置，请谨慎使用。',
  inputSchema: {
    type: 'object',
    properties: {
      searchForm: { type: 'object', description: '表单设计对象' }
    },
    required: ['searchForm']
  },
  execute: async ({ searchForm }) => {
    return executeCode(`setSearchForm({searchForm:${JSON.stringify(searchForm)}})`)
  },
  readOnly: false,
  requireConfirm: true
}

// ============ 页面配置操作工具 ============

/**
 * 获取页面配置工具
 * 获取报表的页面配置数据（纸张大小、边距、方向等）
 * 只读工具，可并发执行
 */
export const getPaperConfigTool: ToolDefinition<{}> = {
  name: 'get_paper_config',
  description: '获取报表的页面配置数据，包含纸张大小、边距、方向等信息。',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    return executeCode(`getPaperConfig()`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 更新页面配置工具
 * 合并更新页面配置属性
 * 写操作工具，需串行执行
 */
export const updatePaperTool: ToolDefinition<{
  paper: any;
}> = {
  name: 'update_paper',
  description: '合并更新页面配置属性。只需传入要修改的属性，未传入的属性保持不变。',
  inputSchema: {
    type: 'object',
    properties: {
      paper: { type: 'object', description: '要合并的页面配置属性，如 {paperSize:"A4",orientation:"landscape"}' }
    },
    required: ['paper']
  },
  execute: async ({ paper }) => {
    return executeCode(`updatePaper({paper:${JSON.stringify(paper)}})`)
  },
  readOnly: false,
  requireConfirm: false
}

// ============ 行操作工具 ============

/**
 * 获取行数据工具
 * 可获取全部行或按行号查询单行数据
 * 只读工具，可并发执行
 */
export const getRowsTool: ToolDefinition<{
  rowNumber?: number;
}> = {
  name: 'get_rows',
  description: '获取表格行数据。不传rowNumber返回全部行，传入rowNumber返回指定行的数据。',
  inputSchema: {
    type: 'object',
    properties: {
      rowNumber: { type: 'integer', description: '行号，不传则返回全部行' }
    },
    required: []
  },
  execute: async ({ rowNumber }) => {
    const args: string[] = []
    if (rowNumber !== undefined) {
      args.push(`rowNumber:${rowNumber}`)
    }
    return executeCode(`getRows({${args.join(',')}})`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 设置全部行数据工具
 * 整体替换行数据列表
 * 写操作工具，需串行执行，需用户确认
 */
export const setRowsTool: ToolDefinition<{
  rows: any[];
}> = {
  name: 'set_rows',
  description: '整体替换全部行数据。此操作会覆盖现有行配置，请谨慎使用。',
  inputSchema: {
    type: 'object',
    properties: {
      rows: { type: 'array', description: '行定义数组，每项包含 rowNumber、height、band 等属性' }
    },
    required: ['rows']
  },
  execute: async ({ rows }) => {
    return executeCode(`setRows({rows:${JSON.stringify(rows)}})`)
  },
  readOnly: false,
  requireConfirm: true
}

/**
 * 更新行工具
 * 按行号匹配替换行定义
 * 写操作工具，需串行执行
 */
export const updateRowTool: ToolDefinition<{
  rowNumber: number;
  row: any;
}> = {
  name: 'update_row',
  description: `按行号匹配更新行定义。会完全替换该行号的行配置。返回${ToolResult.SUCCESS}表示成功，${ToolResult.ERROR}表示失败。`,
  inputSchema: {
    type: 'object',
    properties: {
      rowNumber: { type: 'integer', description: '目标行号' },
      row: { type: 'object', description: '新的行定义对象' }
    },
    required: ['rowNumber', 'row']
  },
  execute: async ({ rowNumber, row }) => {
    return executeCode(`updateRow({rowNumber:${rowNumber},row:${JSON.stringify(row)}})`)
  },
  readOnly: false,
  requireConfirm: false
}

// ============ 列操作工具 ============

/**
 * 获取列数据工具
 * 可获取全部列或按列号查询单列数据
 * 只读工具，可并发执行
 */
export const getColumnsTool: ToolDefinition<{
  columnNumber?: number;
}> = {
  name: 'get_columns',
  description: '获取表格列数据。不传columnNumber返回全部列，传入columnNumber返回指定列的数据。',
  inputSchema: {
    type: 'object',
    properties: {
      columnNumber: { type: 'integer', description: '列号，不传则返回全部列' }
    },
    required: []
  },
  execute: async ({ columnNumber }) => {
    const args: string[] = []
    if (columnNumber !== undefined) {
      args.push(`columnNumber:${columnNumber}`)
    }
    return executeCode(`getColumns({${args.join(',')}})`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 设置全部列数据工具
 * 整体替换列数据列表
 * 写操作工具，需串行执行，需用户确认
 */
export const setColumnsTool: ToolDefinition<{
  columns: any[];
}> = {
  name: 'set_columns',
  description: `整体替换全部列数据。此操作会覆盖现有列配置，请谨慎使用。返回${ToolResult.SUCCESS}表示成功，${ToolResult.ERROR}表示失败。`,
  inputSchema: {
    type: 'object',
    properties: {
      columns: { type: 'array', description: '列定义数组，每项包含 columnNumber、width、hide 等属性' }
    },
    required: ['columns']
  },
  execute: async ({ columns }) => {
    return executeCode(`setColumns({columns:${JSON.stringify(columns)}})`)
  },
  readOnly: false,
  requireConfirm: true
}

/**
 * 更新列工具
 * 按列号匹配替换列定义
 * 写操作工具，需串行执行
 */
export const updateColumnTool: ToolDefinition<{
  columnNumber: number;
  column: any;
}> = {
  name: 'update_column',
  description: `按列号匹配更新列定义。会完全替换该列号的列配置。返回${ToolResult.SUCCESS}表示成功，${ToolResult.ERROR}表示失败。`,
  inputSchema: {
    type: 'object',
    properties: {
      columnNumber: { type: 'integer', description: '目标列号' },
      column: { type: 'object', description: '新的列定义对象' }
    },
    required: ['columnNumber', 'column']
  },
  execute: async ({ columnNumber, column }) => {
    return executeCode(`updateColumn({columnNumber:${columnNumber},column:${JSON.stringify(column)}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 添加行工具
 * 在指定位置插入行，同时处理单元格数据和行头信息
 * 写操作工具，需串行执行
 */
export const insertRowTool: ToolDefinition<{
  position: number;
  number?: number;
}> = {
  name: 'insert_row',
  description: `在指定位置插入行。会同时处理单元格数据和行头信息，确保数据一致性。position为行索引从0开始，number为插入行数默认1。返回${ToolResult.SUCCESS}表示成功，${ToolResult.ERROR}表示失败。`,
  inputSchema: {
    type: 'object',
    properties: {
      position: { type: 'integer', description: '插入位置（行索引），从0开始' },
      number: { type: 'integer', description: '插入行数，默认1' }
    },
    required: ['position']
  },
  execute: async ({ position, number: num }) => {
    return executeCode(`insertRow({position:${position},number:${num ?? 1}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 删除行工具
 * 删除指定范围的行，同时处理单元格数据和合并单元格配置
 * 写操作工具，需串行执行，需用户确认
 */
export const deleteRowTool: ToolDefinition<{
  startRow: number;
  endRow: number;
}> = {
  name: 'delete_row',
  description: `删除指定范围的行。会同时处理单元格数据、合并单元格配置和行头信息。startRow和endRow为行索引从0开始。返回${ToolResult.SUCCESS}表示成功，${ToolResult.ERROR}表示失败。`,
  inputSchema: {
    type: 'object',
    properties: {
      startRow: { type: 'integer', description: '起始行索引，从0开始' },
      endRow: { type: 'integer', description: '结束行索引，从0开始' }
    },
    required: ['startRow', 'endRow']
  },
  execute: async ({ startRow, endRow }) => {
    return executeCode(`deleteRow({startRow:${startRow},endRow:${endRow}})`)
  },
  readOnly: false,
  requireConfirm: true
}

/**
 * 插入列工具
 * 在指定位置插入列，同时处理单元格数据
 * 写操作工具，需串行执行
 */
export const insertColTool: ToolDefinition<{
  position: number;
  number?: number;
}> = {
  name: 'insert_col',
  description: `在指定位置插入列。会同时处理单元格数据，确保数据一致性。position为列索引从0开始，number为插入列数默认1。返回${ToolResult.SUCCESS}表示成功，${ToolResult.ERROR}表示失败。`,
  inputSchema: {
    type: 'object',
    properties: {
      position: { type: 'integer', description: '插入位置（列索引），从0开始' },
      number: { type: 'integer', description: '插入列数，默认1' }
    },
    required: ['position']
  },
  execute: async ({ position, number: num }) => {
    return executeCode(`insertCol({position:${position},number:${num ?? 1}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 删除列工具
 * 删除指定范围的列，同时处理单元格数据和合并单元格配置
 * 写操作工具，需串行执行，需用户确认
 */
export const deleteColTool: ToolDefinition<{
  startCol: number;
  endCol: number;
}> = {
  name: 'delete_col',
  description: `删除指定范围的列。会同时处理单元格数据、合并单元格配置。startCol和endCol为列索引从0开始。返回${ToolResult.SUCCESS}表示成功，${ToolResult.ERROR}表示失败。`,
  inputSchema: {
    type: 'object',
    properties: {
      startCol: { type: 'integer', description: '起始列索引，从0开始' },
      endCol: { type: 'integer', description: '结束列索引，从0开始' }
    },
    required: ['startCol', 'endCol']
  },
  execute: async ({ startCol, endCol }) => {
    return executeCode(`deleteCol({startCol:${startCol},endCol:${endCol}})`)
  },
  readOnly: false,
  requireConfirm: true
}

/**
 * 合并/拆分单元格工具
 * 选中区域已合并则拆分，未合并则合并
 * 写操作工具，需串行执行
 */
export const mergeCellsTool: ToolDefinition<{
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}> = {
  name: 'merge_cells',
  description: `合并或拆分单元格。如果选中区域已合并则拆分，未合并则合并。行列索引从0开始。返回${ToolResult.SUCCESS}表示成功，${ToolResult.ERROR}表示失败。`,
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
 * 备份当前报表数据快照，用于后续异常还原，最多保留20步
 * 写操作工具，需串行执行
 */
export const backupDataTool: ToolDefinition<{
  description?: string;
  type?: string;
}> = {
  name: 'backup_data',
  description: `备份当前报表数据快照。在执行修改操作前自动调用，也可手动调用。最多保留最近20步备份。返回${ToolResult.SUCCESS}表示成功，${ToolResult.ERROR}表示失败。`,
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
 * 从备份栈中弹出最近一条备份并还原，类似撤销操作，只能一步步还原
 * 写操作工具，需串行执行
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

// ============ 后端接口调用工具 ============

/**
 * 校验单元格表达式语法工具
 * 调用后端 scriptValidation 接口校验表达式语法正确性
 * 只读工具，可并发执行
 */
export const validateExpressionTool: ToolDefinition<{
  expression: string;
}> = {
  name: 'validate_expression',
  description: '校验单元格表达式的语法正确性。传入表达式内容，返回校验结果（通过/未通过及错误信息）。用于验证表达式单元格、图片表达式、二维码/条码表达式等。',
  inputSchema: {
    type: 'object',
    properties: {
      expression: { type: 'string', description: '待校验的表达式内容' }
    },
    required: ['expression']
  },
  execute: async ({ expression }) => {
    const escaped = expression.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
    return executeCode(`validateExpression({expression:'${escaped}'})`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 数据集预览数据工具
 * 调用后端 previewData 接口预览指定数据集的数据
 * 只读工具，可并发执行
 */
export const previewDataTool: ToolDefinition<{
  sql: string;
  type: string;
  parameters?: any[];
  username?: string;
  password?: string;
  driver?: string;
  url?: string;
  name?: string;
}> = {
  name: 'preview_data',
  description: '预览数据集的数据。根据SQL和数据源类型查询预览数据，返回字段列表和数据行。type为jdbc时需提供username/password/driver/url，type为buildin时需提供name。',
  inputSchema: {
    type: 'object',
    properties: {
      sql: { type: 'string', description: 'SQL语句' },
      type: { type: 'string', description: '数据源类型：jdbc 或 buildin' },
      parameters: { type: 'array', description: 'SQL参数列表' },
      username: { type: 'string', description: 'JDBC用户名（type=jdbc时）' },
      password: { type: 'string', description: 'JDBC密码（type=jdbc时）' },
      driver: { type: 'string', description: 'JDBC驱动类名（type=jdbc时）' },
      url: { type: 'string', description: 'JDBC连接URL（type=jdbc时）' },
      name: { type: 'string', description: '内置数据源名称（type=buildin时）' }
    },
    required: ['sql', 'type']
  },
  execute: async ({ sql, type, parameters, username, password, driver, url, name }) => {
    const args: string[] = [`sql:'${sql.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`, `type:'${type}'`]
    if (parameters) args.push(`parameters:${JSON.stringify(parameters)}`)
    if (username) args.push(`username:'${username}'`)
    if (password) args.push(`password:'${password}'`)
    if (driver) args.push(`driver:'${driver}'`)
    if (url) args.push(`url:'${url}'`)
    if (name) args.push(`name:'${name}'`)
    return executeCode(`previewData({${args.join(',')}})`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 构建数据集字段工具
 * 调用后端 buildFields 接口根据 SQL 和数据源信息解析字段列表
 * 只读工具，可并发执行
 */
export const buildFieldsTool: ToolDefinition<{
  sql: string;
  type: string;
  parameters?: any[];
  username?: string;
  password?: string;
  driver?: string;
  url?: string;
  name?: string;
}> = {
  name: 'build_fields',
  description: '根据SQL和数据源信息构建数据集字段列表。返回字段名和类型信息，用于配置数据集时自动解析字段。type为jdbc时需提供username/password/driver/url，type为buildin时需提供name。',
  inputSchema: {
    type: 'object',
    properties: {
      sql: { type: 'string', description: 'SQL语句' },
      type: { type: 'string', description: '数据源类型：jdbc 或 buildin' },
      parameters: { type: 'array', description: 'SQL参数列表' },
      username: { type: 'string', description: 'JDBC用户名（type=jdbc时）' },
      password: { type: 'string', description: 'JDBC密码（type=jdbc时）' },
      driver: { type: 'string', description: 'JDBC驱动类名（type=jdbc时）' },
      url: { type: 'string', description: 'JDBC连接URL（type=jdbc时）' },
      name: { type: 'string', description: '内置数据源名称（type=buildin时）' }
    },
    required: ['sql', 'type']
  },
  execute: async ({ sql, type, parameters, username, password, driver, url, name }) => {
    const args: string[] = [`sql:'${sql.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`, `type:'${type}'`]
    if (parameters) args.push(`parameters:${JSON.stringify(parameters)}`)
    if (username) args.push(`username:'${username}'`)
    if (password) args.push(`password:'${password}'`)
    if (driver) args.push(`driver:'${driver}'`)
    if (url) args.push(`url:'${url}'`)
    if (name) args.push(`name:'${name}'`)
    return executeCode(`buildFields({${args.join(',')}})`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 保存报表工具
 * 将当前设计器中的报表数据序列化为 XML 并调用后端保存接口
 * 写操作工具，需串行执行，需用户确认
 */
export const saveReportTool: ToolDefinition<{
  fileName?: string;
}> = {
  name: 'save_report',
  description: '保存当前报表。将设计器中的报表数据保存到服务器。可选传入fileName指定文件名（不含.ureport.xml后缀），不传则使用当前已打开的文件名。',
  inputSchema: {
    type: 'object',
    properties: {
      fileName: { type: 'string', description: '报表文件名，不含.ureport.xml后缀。不传则使用当前文件名' }
    },
    required: []
  },
  execute: async ({ fileName }) => {
    const args: string[] = []
    if (fileName) args.push(`fileName:'${fileName}'`)
    return executeCode(`saveReport({${args.join(',')}})`)
  },
  readOnly: false,
  requireConfirm: true
}

/**
 * 获取内置数据源列表工具
 * 调用后端 loadBuildinDatasources 接口获取 Spring 内置数据源
 * 只读工具，可并发执行
 */
export const loadBuildinDatasourcesTool: ToolDefinition<{}> = {
  name: 'load_buildin_datasources',
  description: '获取Spring内置数据源列表。返回所有可用的内置数据源信息，用于配置数据集时选择数据源。',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    return executeCode(`loadBuildinDatasources()`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 测试数据库连接工具
 * 调用后端 testConnection 接口验证数据库连接参数是否可用
 * 只读工具，可并发执行
 */
export const testConnectionTool: ToolDefinition<{
  driver: string;
  url: string;
  username?: string;
  password?: string;
}> = {
  name: 'test_connection',
  description: '测试数据库连接是否可用。传入JDBC驱动和连接URL，可选用户名密码，返回连接是否成功。',
  inputSchema: {
    type: 'object',
    properties: {
      driver: { type: 'string', description: 'JDBC驱动类名' },
      url: { type: 'string', description: 'JDBC连接URL' },
      username: { type: 'string', description: '数据库用户名' },
      password: { type: 'string', description: '数据库密码' }
    },
    required: ['driver', 'url']
  },
  execute: async ({ driver, url, username, password }) => {
    const args: string[] = [`driver:'${driver}'`, `url:'${url}'`]
    if (username) args.push(`username:'${username}'`)
    if (password) args.push(`password:'${password}'`)
    return executeCode(`testConnection({${args.join(',')}})`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 获取 Bean 数据源方法列表工具
 * 调用后端 loadMethods 接口获取指定 Spring Bean 的可用方法
 * 只读工具，可并发执行
 */
export const loadBeanMethodsTool: ToolDefinition<{
  beanId: string;
}> = {
  name: 'load_bean_methods',
  description: '获取指定Spring Bean数据源的方法列表。传入beanId，返回该Bean所有可调用的方法信息，用于配置Spring类型数据集。',
  inputSchema: {
    type: 'object',
    properties: {
      beanId: { type: 'string', description: 'Spring Bean标识' }
    },
    required: ['beanId']
  },
  execute: async ({ beanId }) => {
    return executeCode(`loadBeanMethods({beanId:'${beanId}'})`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 条件表达式逻辑校验工具
 * 调用后端 conditionScriptValidation 接口校验条件表达式的语法正确性
 * 只读工具，可并发执行
 */
export const validateConditionTool: ToolDefinition<{
  expression: string;
}> = {
  name: 'validate_condition',
  description: '校验条件表达式的逻辑语法正确性。用于验证条件样式、数据过滤等场景中的条件表达式，返回校验结果（通过/未通过及错误信息）。',
  inputSchema: {
    type: 'object',
    properties: {
      expression: { type: 'string', description: '待校验的条件表达式' }
    },
    required: ['expression']
  },
  execute: async ({ expression }) => {
    const escaped = expression.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
    return executeCode(`validateCondition({expression:'${escaped}'})`)
  },
  readOnly: true,
  requireConfirm: false
}

// ============ 单元格清空操作工具 ============

/**
 * 清空单元格内容工具
 * 将指定区域内的单元格内容清空，保留样式不变
 * 写操作工具，需串行执行
 */
export const clearCellContentTool: ToolDefinition<{
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}> = {
  name: 'clear_cell_content',
  description: `清空指定区域单元格的内容，保留样式不变。行列索引从0开始。返回${ToolResult.SUCCESS}表示成功，${ToolResult.ERROR}表示失败。`,
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
 * 将指定区域内的单元格样式重置为默认样式，保留内容不变
 * 写操作工具，需串行执行
 */
export const clearCellStyleTool: ToolDefinition<{
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}> = {
  name: 'clear_cell_style',
  description: `清空指定区域单元格的样式，重置为默认样式，保留内容不变。行列索引从0开始。返回${ToolResult.SUCCESS}表示成功，${ToolResult.ERROR}表示失败。`,
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
 * 将指定区域内的单元格内容和样式全部清空，重置为默认空白单元格
 * 写操作工具，需串行执行
 */
export const clearCellAllTool: ToolDefinition<{
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}> = {
  name: 'clear_cell_all',
  description: `清空指定区域单元格的全部内容和样式，重置为默认空白单元格。行列索引从0开始。返回${ToolResult.SUCCESS}表示成功，${ToolResult.ERROR}表示失败。`,
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
