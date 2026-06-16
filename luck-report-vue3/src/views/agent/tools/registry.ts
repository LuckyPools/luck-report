import type { ToolDefinition, ToolApiFormat } from './types'

import { loadReportIntroduceTool } from './doc-tools.ts'
import { askUserTool } from './ask-user-tool.ts'
import {
  saveReportTool,
  searchAgentKnowledgeTool,
  searchBusinessKnowledgeTool, validateConditionTool, validateExpressionTool
} from "@/views/agent/tools/common-tools.ts";
import {
    clearCellAllTool,
    clearCellContentTool,
    clearCellStyleTool, getCellTemplateTool, mergeCellsTool,
    readCellsTool,
    writeCellsTool
} from "@/views/agent/tools/cell-tools.ts";
import {
    addDatasourceTool,
    getDatasourcesTool, getDatasourceTemplateTool,
    getTableRelationTool, loadBeanMethodsTool, loadBuildinDatasourcesTool,
    searchSchemaTool, selectDatasourceOperationTool
} from "@/views/agent/tools/datasource-tools.ts";
import {
    addDatasetTool, buildFieldsTool,
    commitDatasetTool,
    getDatasetsTool, getDatasetTemplateTool, parseFilterConditionsTool, previewDataTool,
    removeDatasetTool,
    updateDatasetTool, validateDatasetTool
} from "@/views/agent/tools/dataset-tools.ts";
import {
  deleteColTool, deleteRowTool,
  getColumnDefinitionsTemplateTool, getColumnsTool,
  getRowDefinitionsTemplateTool, getRowsTool, insertColTool, insertRowTool, setColumnsTool, setRowsTool
} from "@/views/agent/tools/row-col-tools.ts";
import {
  getFooterConfigTool,
  getHeaderConfigTool, getHeaderFooterTemplateTool,
  getPaperConfigTemplateTool, getPaperConfigTool,
  getSearchFormTemplateTool,
  getSearchFormTool, setSearchFormTool, updateFooterTool, updateHeaderTool, updatePaperTool
} from "@/views/agent/tools/page-tools.ts";

/**
 * 工具注册表，管理工具的注册、查找和列表
 */
export class ToolRegistry {
  /** 工具定义映射表，key 为工具名称 */
  private tools: Map<string, ToolDefinition> = new Map()

  /**
   * 注册一个工具
   */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      console.warn(`[ToolRegistry] 工具 "${tool.name}" 已存在，将被覆盖`)
    }
    this.tools.set(tool.name, tool)
  }

  /**
   * 批量注册工具
   */
  registerAll(tools: ToolDefinition[]): void {
    tools.forEach(t => this.register(t))
  }

  /**
   * 按名称查找工具
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name)
  }

  /**
   * 获取所有已注册工具
   */
  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  /**
   * 获取所有只读工具名称列表，只读工具可并发执行
   */
  getReadOnlyToolNames(): string[] {
    return this.getAll().filter(t => t.readOnly).map(t => t.name)
  }

  /**
   * 获取需要确认的工具名称列表，高风险操作执行前需用户确认
   */
  getConfirmRequiredToolNames(): string[] {
    return this.getAll().filter(t => t.requireConfirm).map(t => t.name)
  }

  /**
   * 生成供 LLM 使用的工具定义列表，将内部 ToolDefinition 转换为后台 API 需要的格式
   */
  toApiFormat(): ToolApiFormat[] {
    return this.getAll().map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }))
  }

  /**
   * 校验工具调用输入参数，使用工具的 inputSchema 进行基本校验
   */
  validateInput(toolName: string, input: Record<string, any>): { valid: boolean; errors: string[] } {
    const tool = this.tools.get(toolName)
    if (!tool) {
      return { valid: false, errors: [`工具 "${toolName}" 不存在`] }
    }

    const errors: string[] = []
    const required = tool.inputSchema.required || []
    const properties = tool.inputSchema.properties || {}

    for (const key of required) {
      if (input[key] === undefined || input[key] === null) {
        errors.push(`缺少必填参数: ${key}`)
      }
    }

    for (const key of Object.keys(input)) {
      if (!properties[key]) {
        errors.push(`未知参数: ${key}`)
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * 按名称查找并执行工具，封装"查找 → 校验 → 执行"三步流程
   */
  async executeTool<TInput = any, TOutput = any>(
    name: string,
    input: TInput
  ): Promise<TOutput> {
    const tool = this.tools.get(name)
    if (!tool) {
      throw new Error(`工具 "${name}" 不存在`)
    }
    if (tool.validate) {
      const err = tool.validate(input)
      if (err) {
        throw new Error(`工具 "${name}" 参数校验失败: ${err}`)
      }
    } else {
      const v = this.validateInput(name, input)
      if (!v.valid) {
        throw new Error(`工具 "${name}" 参数校验失败: ${v.errors.join('; ')}`)
      }
    }
    const rawResult = (await tool.execute(input)) as any
    if (rawResult == null) {
      console.warn(`[WARN][ToolRegistry] 工具 "${name}" 执行返回 null/undefined，已归一为业务失败对象`)
      return {
        success: false,
        message: `工具 "${name}" 未返回结果`,
        data: null
      } as unknown as TOutput
    }
    return rawResult as TOutput
  }

  /**
   * 获取所有已注册工具定义，getAll 的语义化别名
   */
  getToolDefinitions(): ToolDefinition[] {
    return this.getAll()
  }
}

/**
 * 创建默认工具注册表，注册所有报表操作工具
 */
export function createDefaultRegistry(): ToolRegistry {
  const registry = new ToolRegistry()
  registry.registerAll([
    // 中断型工具：ask_user 只在 understand_and_plan 节点中允许调用
    askUserTool,
    searchBusinessKnowledgeTool,
    searchAgentKnowledgeTool,
    loadReportIntroduceTool,
    readCellsTool,
    writeCellsTool,
    getDatasourcesTool,
    // setDatasourcesTool,
    addDatasourceTool,
    // updateDatasourceTool,
    // removeDatasourceTool,
    getTableRelationTool,
    searchSchemaTool,
    getDatasetsTool,
    addDatasetTool,
    updateDatasetTool,
    removeDatasetTool,
    validateDatasetTool,
    parseFilterConditionsTool,
    commitDatasetTool,

    getSearchFormTool,
    setSearchFormTool,

    getPaperConfigTool,
    updatePaperTool,
    getHeaderConfigTool,
    updateHeaderTool,
    getFooterConfigTool,
    updateFooterTool,
    getHeaderFooterTemplateTool,

    getRowsTool,
    setRowsTool,
    insertRowTool,
    deleteRowTool,

    getColumnsTool,
    setColumnsTool,
    insertColTool,
    deleteColTool,

    mergeCellsTool,
    // backupDataTool,
    // restoreDataTool,
    validateExpressionTool,
    previewDataTool,
    buildFieldsTool,
    saveReportTool,
    loadBuildinDatasourcesTool,
    // testConnectionTool,
    loadBeanMethodsTool,
    validateConditionTool,
    clearCellContentTool,
    clearCellStyleTool,
    clearCellAllTool,
    selectDatasourceOperationTool,
    // 数据模板工具
    getCellTemplateTool,
    getDatasetTemplateTool,
    getDatasourceTemplateTool,
    getSearchFormTemplateTool,
    getPaperConfigTemplateTool,
    getRowDefinitionsTemplateTool,
    getColumnDefinitionsTemplateTool,
  ])
  return registry
}
