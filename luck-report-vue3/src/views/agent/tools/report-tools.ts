import type { ToolDefinition } from './types'
import { vectorSearch } from '@/api/vector'
import { executeCode } from '@/views/export/iframe-utils'
import { getSchemaPrompt, getBuildinDatasources, searchSchema } from '@/api/datasource'
import {
  getCellTemplateByType,
  getExpressionCellWithConditionTemplate,
  getSqlDatasetTemplate,
  getBuildinDatasourceTemplate,
  CellPositionSchema,
  CellsSchema,
  DatasetSchema,
  DatasourceSchema,
  SearchFormSchema,
  PaperSchema,
  HeaderFooterSchema,
  RowDefinitionSchema,
  ColumnDefinitionSchema,
  validateCells,
  validateDataset,
  validateDatasource,
  validateSearchForm,
  validatePaper,
  validateRowDefinition,
  validateColumnDefinition,
  normalizeCells,
  normalizeRowDefinitions,
  normalizeColumnDefinitions,
  getSearchFormTemplate,
  normalizeSearchForm,
  getPaperConfigTemplate,
  getHeaderFooterTemplate,
  normalizePaper,
  getRowDefinitionsTemplate,
  getColumnDefinitionsTemplate
} from './schema/index'

/**
 * 工具执行结果常量
 */
export const ToolResult = {
  SUCCESS: { success: true, message: '执行成功' },
  ERROR: { success: false, message: '执行失败' }
} as const

/**
 * 创建工具执行结果，用于生成包含详细信息的返回值
 */
export function createToolResult(success: boolean, message: string, data?: any): { success: boolean; message: string; data?: any } {
  return { success, message, data }
}

/**
 * 搜索业务知识工具
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
        description: '单元格坐标数组，每个元素包含 row（行号，从1开始）和 col（列号，从1开始）'
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

// ============ 数据源操作工具 ============

/**
 * 获取数据源列表工具
 */
export const getDatasourcesTool: ToolDefinition<{
  name?: string;
}> = {
  name: 'get_datasources',
  description: '获取设计器已添加的数据源数据。不传name返回全部数据源列表，传入name返回指定名称的数据源对象。',
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
 */
export const setDatasourcesTool: ToolDefinition<{
  datasources: any[];
}> = {
  name: 'set_datasources',
  description: '整体替换全部数据源列表。此操作会覆盖现有数据源，请谨慎使用。返回 { success, message } 结构。',
  inputSchema: {
    type: 'object',
    properties: {
      datasources: { type: 'array', items: DatasourceSchema, description: '数据源定义数组' }
    },
    required: ['datasources']
  },
  execute: async ({ datasources }) => {
    for (const datasource of datasources) {
      const error = validateDatasource(datasource)
      if (error) {
        return { success: false, message: `数据校验失败: ${error}` }
      }
    }
    return executeCode(`setDatasources({datasources:${JSON.stringify(datasources)}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 添加数据源工具
 */
export const addDatasourceTool: ToolDefinition<{
  datasource: any;
}> = {
  name: 'add_datasource',
  description: '添加数据源到报表。返回 { success, message } 结构。buildin类型数据源名称必须来自 load_buildin_datasources 返回列表。',
  inputSchema: {
    type: 'object',
    properties: {
      datasource: DatasourceSchema
    },
    required: ['datasource']
  },
  execute: async ({ datasource }) => {
    const error = validateDatasource(datasource)
    if (error) {
      return { success: false, message: `数据校验失败: ${error}` }
    }
    if (datasource.type === 'buildin') {
      try {
        const buildinResult = await executeCode(`loadBuildinDatasources()`)
        const buildinNames: string[] = buildinResult?.datasources || []
        if (!buildinNames.includes(datasource.name)) {
          return {
            success: false,
            message: `数据源名称 "${datasource.name}" 不在内置数据源列表中。合法名称列表：${buildinNames.join('、')}。请从 load_buildin_datasources 返回的列表中选择名称`
          }
        }
      } catch {
        console.warn('[add_datasource] 校验buildin数据源名称时获取列表失败，跳过校验')
      }
    }
    return executeCode(`addDatasource({datasource:${JSON.stringify(datasource)}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 更新数据源工具
 */
export const updateDatasourceTool: ToolDefinition<{
  name: string;
  datasource: any;
}> = {
  name: 'update_datasource',
  description: '按名称更新数据源定义。会完全替换该名称对应的数据源。返回 { success, message } 结构。',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '目标数据源名称' },
      datasource: DatasourceSchema
    },
    required: ['name', 'datasource']
  },
  execute: async ({ name, datasource }) => {
    const error = validateDatasource(datasource)
    if (error) {
      return { success: false, message: `数据校验失败: ${error}` }
    }
    return executeCode(`updateDatasource({name:'${name}',datasource:${JSON.stringify(datasource)}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 删除数据源工具
 */
export const removeDatasourceTool: ToolDefinition<{
  name: string;
}> = {
  name: 'remove_datasource',
  description: '按名称删除数据源。此操作不可撤销。返回 { success, message } 结构。',
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
    const params: { id?: number; name?: string; query: string } = { query }

    if (datasourceId !== undefined) {
      params.id = datasourceId
    } else if (datasourceName !== undefined) {
      params.name = datasourceName
    } else {
      throw new Error('必须提供 datasourceId 或 datasourceName')
    }

    const response = await getSchemaPrompt(params)
    if (response.code === 0) {
      return response.data
    } else {
      throw new Error(response.message || '获取Schema提示词失败')
    }
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 获取所有可用的数据源列表工具
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
    const response = await getBuildinDatasources()
    if (response.code === 0) {
      return response.data
    } else {
      throw new Error(response.message || '获取数据源列表失败')
    }
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 跨数据源搜索Schema工具
 */
export const searchSchemaTool: ToolDefinition<{
  query: string;
}> = {
  name: 'search_schema',
  description: '跨数据源搜索表结构信息。传入自然语言查询，返回所有匹配的数据源及其表结构信息。当不确定应该使用哪个内置数据源时，调用此工具快速定位包含相关表的数据源。',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '自然语言查询，描述要查找的表或业务概念，如"销售订单"、"库存管理"、"用户信息"'
      }
    },
    required: ['query']
  },
  execute: async ({ query }) => {
    const response = await searchSchema(query)
    if (response.code === 0) {
      return response.data
    } else {
      throw new Error(response.message || '搜索Schema失败')
    }
  },
  readOnly: true,
  requireConfirm: false
}

// ============ 数据集操作工具 ============

/**
 * 获取数据集工具
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
 */
export const addDatasetTool: ToolDefinition<{
  datasourceName: string;
  dataset: any;
}> = {
  name: 'add_dataset',
  description: `向指定数据源下添加一个新的数据集。返回 { success, message } 结构。
【数据规范】dataset 必须包含 name/sql/fields，fields 必须通过 build_fields 工具生成。。`,
  inputSchema: {
    type: 'object',
    properties: {
      datasourceName: { type: 'string', description: '目标数据源名称' },
      dataset: DatasetSchema
    },
    required: ['datasourceName', 'dataset']
  },
  execute: async ({ datasourceName, dataset }) => {
    return executeCode(`addDataset({datasourceName:'${datasourceName}',dataset:${JSON.stringify(dataset)}})`)
  },
  readOnly: false,
  requireConfirm: false,
  validate: ({ dataset }) => validateDataset(dataset)
}

/**
 * 更新数据集工具
 */
export const updateDatasetTool: ToolDefinition<{
  datasourceName: string;
  datasetName: string;
  dataset: any;
}> = {
  name: 'update_dataset',
  description: `按数据源名称和数据集名称匹配更新数据集定义。会完全替换该数据集。返回 { success, message } 结构。
【数据规范】dataset 必须包含 name/sql/fields，fields 必须通过 build_fields 工具生成。`,
  inputSchema: {
    type: 'object',
    properties: {
      datasourceName: { type: 'string', description: '目标数据源名称' },
      datasetName: { type: 'string', description: '目标数据集名称' },
      dataset: DatasetSchema
    },
    required: ['datasourceName', 'datasetName', 'dataset']
  },
  execute: async ({ datasourceName, datasetName, dataset }) => {
    return executeCode(`updateDataset({datasourceName:'${datasourceName}',datasetName:'${datasetName}',dataset:${JSON.stringify(dataset)}})`)
  },
  readOnly: false,
  requireConfirm: false,
  validate: ({ dataset }) => validateDataset(dataset)
}

/**
 * 删除数据集工具
 */
export const removeDatasetTool: ToolDefinition<{
  datasourceName: string;
  datasetName: string;
}> = {
  name: 'remove_dataset',
  description: `按数据源名称和数据集名称删除数据集。此操作不可撤销，请谨慎使用。返回 { success: true/false, message: '...' } 结构，success=true 表示成功，message 包含详细信息。`,
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
 */
export const setSearchFormTool: ToolDefinition<{
  searchForm: any;
}> = {
  name: 'set_search_form',
  description: `整体替换查询表单设计数据。此操作会覆盖现有表单配置，请谨慎使用。返回 { success, message } 结构。
【数据约束】searchForm.tag 必须是 "u-form"，fields 必须是数组，输入组件必须有 vModel 且与数据集 Parameter.name 一致。`,
  inputSchema: {
    type: 'object',
    properties: {
      searchForm: SearchFormSchema
    },
    required: ['searchForm']
  },
  execute: async ({ searchForm }) => {
    const normalized = normalizeSearchForm(searchForm)
    const error = validateSearchForm(normalized)
    if (error) {
      return { success: false, message: `数据校验失败: ${error}` }
    }
    return executeCode(`setSearchForm({searchForm:${JSON.stringify(normalized)}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 获取查询表单模板工具
 */
export const getSearchFormTemplateTool: ToolDefinition<{
  componentTypes?: string[];
}> = {
  name: 'get_search_form_template',
  description: `获取符合规范的查询表单模板。返回完整的表单定义模板，包含 u-form 外壳和指定类型的组件示例。
【参数】componentTypes: 需要的组件类型数组，如 ['input','select','datePicker']，不传则返回空壳模板。
【约束】禁止凭空构造 searchForm 对象，必须基于此模板或 get_search_form 返回的数据修改。`,
  inputSchema: {
    type: 'object',
    properties: {
      componentTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['input', 'inputNumber', 'select', 'radioGroup', 'checkboxGroup', 'switch', 'datePicker', 'button']
        },
        description: '需要的组件类型列表，不传则返回空壳模板'
      }
    },
    required: []
  },
  execute: async ({ componentTypes }) => {
    return getSearchFormTemplate(componentTypes)
  },
  readOnly: true,
  requireConfirm: false
}

// ============ 页面配置操作工具 ============

/**
 * 获取页面配置工具
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
 */
export const updatePaperTool: ToolDefinition<{
  paper: any;
}> = {
  name: 'update_paper',
  description: `合并更新页面配置属性。只需传入要修改的属性，未传入的属性保持不变。返回 { success, message } 结构。
【数据约束】paperType: A0-A10/B0-B10/CUSTOM；pagingMode: fitpage/fixrows；orientation: portrait/landscape；fixRows: pagingMode为fixrows时必须≥1。`,
  inputSchema: {
    type: 'object',
    properties: {
      paper: PaperSchema
    },
    required: ['paper']
  },
  execute: async ({ paper }) => {
    const normalized = normalizePaper(paper)
    const error = validatePaper(normalized)
    if (error) {
      return { success: false, message: `数据校验失败: ${error}` }
    }
    return executeCode(`updatePaper({paper:${JSON.stringify(normalized)}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 获取页面配置模板工具
 */
export const getPaperConfigTemplateTool: ToolDefinition<{}> = {
  name: 'get_paper_config_template',
  description: `获取符合规范的页面配置模板，包含A4纵向的默认纸张设置。
【使用场景】新建报表或重置页面配置时获取初始结构，需要参考页面配置数据规范时。
【重要】paper 只包含纸张相关配置，header 和 footer 是 reportDef 的独立字段，与 paper 平级。`,
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    return getPaperConfigTemplate()
  },
  readOnly: true,
  requireConfirm: false
}

// ============ 页眉页脚操作工具 ============

/**
 * 获取页眉配置工具
 */
export const getHeaderConfigTool: ToolDefinition<{}> = {
  name: 'get_header',
  description: '获取报表的页眉配置数据，包含左侧/中间/右侧内容、字体、颜色、高度等信息。',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    return executeCode(`getHeaderConfig()`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 更新页眉配置工具
 */
export const updateHeaderTool: ToolDefinition<{
  header: any;
}> = {
  name: 'update_header',
  description: `合并更新页眉配置属性。只需传入要修改的属性，未传入的属性保持不变。返回 { success, message } 结构。
【数据约束】left/center/right 支持文本和表达式（如 page()/pages()）；forecolor: RGB格式如 "0,0,0"；height/margin: 页眉高度和间距(pt)。`,
  inputSchema: {
    type: 'object',
    properties: {
      header: HeaderFooterSchema
    },
    required: ['header']
  },
  execute: async ({ header }) => {
    return executeCode(`updateHeader({header:${JSON.stringify(header)}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 获取页脚配置工具
 */
export const getFooterConfigTool: ToolDefinition<{}> = {
  name: 'get_footer',
  description: '获取报表的页脚配置数据，包含左侧/中间/右侧内容、字体、颜色、高度等信息。',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    return executeCode(`getFooterConfig()`)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 更新页脚配置工具
 */
export const updateFooterTool: ToolDefinition<{
  footer: any;
}> = {
  name: 'update_footer',
  description: `合并更新页脚配置属性。只需传入要修改的属性，未传入的属性保持不变。返回 { success, message } 结构。
【数据约束】left/center/right 支持文本和表达式（如 page()/pages()）；forecolor: RGB格式如 "0,0,0"；height/margin: 页脚高度和间距(pt)。`,
  inputSchema: {
    type: 'object',
    properties: {
      footer: HeaderFooterSchema
    },
    required: ['footer']
  },
  execute: async ({ footer }) => {
    return executeCode(`updateFooter({footer:${JSON.stringify(footer)}})`)
  },
  readOnly: false,
  requireConfirm: false
}

/**
 * 获取页眉页脚配置模板工具
 */
export const getHeaderFooterTemplateTool: ToolDefinition<{
  type: 'header' | 'footer';
}> = {
  name: 'get_header_footer_template',
  description: `获取符合规范的页眉或页脚配置模板。返回包含默认值的完整结构（含字体/颜色/对齐/高度等）。
【使用场景】需要添加或重置页眉/页脚时获取初始结构，不确定页眉/页脚字段取值范围时。
【重要】header 和 footer 是 reportDef 的独立字段，与 paper 平级，禁止凭空构造。`,
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['header', 'footer'],
        description: '生成页眉(header)还是页脚(footer)的模板'
      }
    },
    required: ['type']
  },
  execute: async ({ type }) => {
    return getHeaderFooterTemplate(type)
  },
  readOnly: true,
  requireConfirm: false
}

// ============ 行操作工具 ============

/**
 * 获取行数据工具
 */
export const getRowsTool: ToolDefinition<{
  rowNumbers?: number[];
}> = {
  name: 'get_rows',
  description: '获取表格行数据。rowNumbers 为行号数组（从1开始），按需返回 { 行号: 行定义 } 格式的对象；不传 rowNumbers 则返回全部行。',
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
    const args: string[] = []
    if (Array.isArray(rowNumbers)) {
      args.push(`rowNumbers:${JSON.stringify(rowNumbers)}`)
    }
    return executeCode(`getRows({${args.join(',')}})`)
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
  description: `批量更新行数据。rows 为 { 行号: 行定义 } 格式的对象，行号作为 key（从1开始）。执行前自动备份，异常时自动回滚。返回 { success, message } 结构。
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
    return executeCode(`setRows({rows:${JSON.stringify(normalized)}})`)
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

// ============ 列操作工具 ============

/**
 * 获取列数据工具
 */
export const getColumnsTool: ToolDefinition<{
  columnNumbers?: number[];
}> = {
  name: 'get_columns',
  description: '获取表格列数据。columnNumbers 为列号数组（从1开始），按需返回 { 列号: 列定义 } 格式的对象；不传 columnNumbers 则返回全部列。',
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
    const args: string[] = []
    if (Array.isArray(columnNumbers)) {
      args.push(`columnNumbers:${JSON.stringify(columnNumbers)}`)
    }
    return executeCode(`getColumns({${args.join(',')}})`)
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
  description: `批量更新列数据。columns 为 { 列号: 列定义 } 格式的对象，列号作为 key（从1开始）。执行前自动备份，异常时自动回滚。返回 { success, message } 结构。
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
    return executeCode(`setColumns({columns:${JSON.stringify(normalized)}})`)
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
  description: `在指定位置插入行。会同时处理单元格数据和行头信息，确保数据一致性。position为行索引从0开始，number为插入行数默认1。返回 { success: true/false, message: '...' } 结构，success=true 表示成功，message 包含详细信息。`,
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
 */
export const deleteRowTool: ToolDefinition<{
  startRow: number;
  endRow: number;
}> = {
  name: 'delete_row',
  description: `删除指定范围的行。会同时处理单元格数据、合并单元格配置和行头信息。startRow和endRow为行索引从0开始。返回 { success: true/false, message: '...' } 结构，success=true 表示成功，message 包含详细信息。`,
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
 */
export const insertColTool: ToolDefinition<{
  position: number;
  number?: number;
}> = {
  name: 'insert_col',
  description: `在指定位置插入列。会同时处理单元格数据，确保数据一致性。position为列索引从0开始，number为插入列数默认1。返回 { success: true/false, message: '...' } 结构，success=true 表示成功，message 包含详细信息。`,
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
 */
export const deleteColTool: ToolDefinition<{
  startCol: number;
  endCol: number;
}> = {
  name: 'delete_col',
  description: `删除指定范围的列。会同时处理单元格数据、合并单元格配置。startCol和endCol为列索引从0开始。返回 { success: true/false, message: '...' } 结构，success=true 表示成功，message 包含详细信息。`,
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

// ============ 后端接口调用工具 ============

/**
 * 校验单元格表达式语法工具
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
  description: '验证数据集SQL是否可正确执行。修改或添加数据集前验证数据集是否合法，根据SQL和数据源类型执行预览查询，仅返回执行结果（1表示成功，0表示失败）。type为jdbc时需提供username/password/driver/url，type为buildin时需提供name。',
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
  requireConfirm: false
}

/**
 * 获取内置数据源列表工具
 */
export const loadBuildinDatasourcesTool: ToolDefinition<{}> = {
  name: 'load_buildin_datasources',
  description: '获取Spring内置数据源名称列表。返回的名称是创建buildin类型数据源时唯一合法的名称来源，add_datasource的name必须从此列表中选择，禁止凭空编造名称。',
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

// ============ 数据源操作路由工具 ============

/**
 * 数据源操作路由工具
 */
export const selectDatasourceOperationTool: ToolDefinition<{
  operationType: 'create_datasource' | 'modify_datasource' | 'delete_datasource' | 'create_dataset' | 'modify_dataset' | 'delete_dataset';
  datasourceName?: string;
  datasetName?: string;
  description: string;
}> = {
  name: 'select_datasource_operation',
  description: '选择要执行的数据源/数据集操作类型。在分析用户需求后调用此工具，声明具体的操作类型（创建/修改/删除 数据源/数据集），系统将根据选择执行对应的子工作流。注意：create_datasource 会自动升级为 create_datasource_and_dataset（同时创建数据源和数据集）。',
  inputSchema: {
    type: 'object',
    properties: {
      operationType: {
        type: 'string',
        enum: ['create_datasource', 'modify_datasource', 'delete_datasource', 'create_dataset', 'modify_dataset', 'delete_dataset'],
        description: '操作类型：create_datasource=创建数据源（自动升级为创建数据源+数据集）, modify_datasource=修改数据源, delete_datasource=删除数据源, create_dataset=创建数据集, modify_dataset=修改数据集, delete_dataset=删除数据集'
      },
      datasourceName: {
        type: 'string',
        description: '目标数据源名称，创建数据源时可不传'
      },
      datasetName: {
        type: 'string',
        description: '目标数据集名称，仅数据集操作时需要'
      },
      description: {
        type: 'string',
        description: '操作描述，简要说明要做什么'
      }
    },
    required: ['operationType', 'description']
  },
  execute: async (input) => {
    // 路由工具不执行实际操作，直接返回输入参数供步骤结果使用
    return input
  },
  readOnly: true,
  requireConfirm: false
}

// ============ 数据模板工具 ============

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

/**
 * 获取数据集模板工具
 */
export const getDatasetTemplateTool: ToolDefinition<{
  name?: string;
  sql?: string;
}> = {
  name: 'get_dataset_template',
  description: `获取符合规范的SQL数据集模板。返回完整的数据集定义模板，包含所有必填字段。
【参数】name: 数据集名称（可选）；sql: SQL语句（可选）。
【重要】fields 必须通过 build_fields 工具生成，禁止自行编造；dataset 参数必须是JSON对象。`,
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '数据集名称（可选）' },
      sql: { type: 'string', description: 'SQL语句（可选）' }
    },
    required: []
  },
  execute: async ({ name, sql }) => {
    return getSqlDatasetTemplate(name, sql)
  },
  readOnly: true,
  requireConfirm: false
}

/**
 * 获取数据源模板工具
 */
export const getDatasourceTemplateTool: ToolDefinition<{
  name?: string;
}> = {
  name: 'get_datasource_template',
  description: `获取符合规范的buildin数据源模板。返回完整的数据源定义模板。
【使用场景】创建buildin数据源前获取初始结构，了解数据源数据规范。
【限制】只允许创建 buildin 类型数据源，jdbc/spring 类型数据源需用户手动配置。`,
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '数据源名称（可选）' }
    },
    required: []
  },
  execute: async ({ name }) => {
    return getBuildinDatasourceTemplate(name)
  },
  readOnly: true,
  requireConfirm: false
}
