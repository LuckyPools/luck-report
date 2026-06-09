import type { ToolDefinition, ToolApiFormat } from './types'
import {
  searchBusinessKnowledgeTool,
  searchAgentKnowledgeTool,
  readCellTool,
  writeCellTool,
  readCellsTool,
  writeCellsTool,
  getDatasourcesTool,
  setDatasourcesTool,
  addDatasourceTool,
  updateDatasourceTool,
  removeDatasourceTool,
  getTableRelationTool,
  searchSchemaTool,
  getDatasetsTool,
  addDatasetTool,
  updateDatasetTool,
  removeDatasetTool,
  getSearchFormTool,
  setSearchFormTool,
  getPaperConfigTool,
  updatePaperTool,
  getRowsTool,
  setRowsTool,
  updateRowTool,
  insertRowTool,
  deleteRowTool,
  insertColTool,
  deleteColTool,
  mergeCellsTool,
  backupDataTool,
  restoreDataTool,
  validateExpressionTool,
  previewDataTool,
  buildFieldsTool,
  saveReportTool,
  loadBuildinDatasourcesTool,
  testConnectionTool,
  loadBeanMethodsTool,
  validateConditionTool,
  clearCellContentTool,
  clearCellStyleTool,
  clearCellAllTool,
  selectDatasourceOperationTool,
  getCellTemplateTool,
  getDatasetTemplateTool,
  getDatasourceTemplateTool,
} from './report-tools'
import { loadReportIntroduceTool } from './doc-tools.ts'

/**
 * 工具注册表
 * 管理所有可用工具的注册、查找、列表
 * 参考 Claude Code 的 getAllBaseTools() 工具注册机制
 */
export class ToolRegistry {
  /** 工具定义映射表，key 为工具名称 */
  private tools: Map<string, ToolDefinition> = new Map()

  /**
   * 注册一个工具
   * @param tool - 工具定义
   */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      console.warn(`[ToolRegistry] 工具 "${tool.name}" 已存在，将被覆盖`)
    }
    this.tools.set(tool.name, tool)
  }

  /**
   * 批量注册工具
   * @param tools - 工具定义数组
   */
  registerAll(tools: ToolDefinition[]): void {
    tools.forEach(t => this.register(t))
  }

  /**
   * 按名称查找工具
   * @param name - 工具名称
   * @returns 工具定义或 undefined
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name)
  }

  /**
   * 获取所有已注册工具
   * @returns 工具定义数组
   */
  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  /**
   * 获取所有只读工具名称列表
   * 只读工具可并发执行，无需串行排队
   * @returns 只读工具名称数组
   */
  getReadOnlyToolNames(): string[] {
    return this.getAll().filter(t => t.readOnly).map(t => t.name)
  }

  /**
   * 获取需要确认的工具名称列表
   * 高风险操作执行前需用户确认
   * @returns 需确认工具名称数组
   */
  getConfirmRequiredToolNames(): string[] {
    return this.getAll().filter(t => t.requireConfirm).map(t => t.name)
  }

  /**
   * 生成供 LLM 使用的工具定义列表
   * 将内部 ToolDefinition 转换为后台 API 需要的 tools 参数格式
   * @returns 工具定义数组（API 格式）
   */
  toApiFormat(): ToolApiFormat[] {
    return this.getAll().map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }))
  }

  /**
   * 校验工具调用输入参数
   * 使用工具的 inputSchema 进行基本校验（检查必填字段是否存在）
   *
   * @param toolName - 工具名称
   * @param input - 调用输入参数
   * @returns 校验结果，valid 为 true 表示通过
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
}

/**
 * 创建默认工具注册表，注册所有报表操作工具
 * @returns 已初始化的工具注册表实例
 */
export function createDefaultRegistry(): ToolRegistry {
  const registry = new ToolRegistry()
  registry.registerAll([
    searchBusinessKnowledgeTool,
    searchAgentKnowledgeTool,
    loadReportIntroduceTool,
    readCellTool,
    writeCellTool,
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
    getSearchFormTool,
    setSearchFormTool,
    getPaperConfigTool,
    updatePaperTool,
    getRowsTool,
    setRowsTool,
    updateRowTool,
    insertRowTool,
    deleteRowTool,
    insertColTool,
    deleteColTool,
    mergeCellsTool,
    backupDataTool,
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
  ])
  return registry
}
