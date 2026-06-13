import type { ToolDefinition } from './types'
import { executeCode } from '@/views/export/iframe-utils'
import {
  SearchFormSchema,
  PaperSchema,
  HeaderFooterSchema,
  validateSearchForm,
  validatePaper,
  normalizeSearchForm,
  getSearchFormTemplate,
  getPaperConfigTemplate,
  getHeaderFooterTemplate,
  normalizePaper
} from './schema/index'

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
