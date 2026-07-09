/**
 * 提示词加载器
 * 加载 src/prompt 目录下的 .md 文件，供 ContextManager、doc-tools.ts 工具等模块统一调用
 * 支持枚举映射和路径加载两种方式，含缓存和压缩
 *
 * 使用 Vite 原生 `?raw` 后缀将 .md 文件作为原始字符串打包，
 * 构建时直接内联到 bundle，无 fetch 网络请求
 */

/** 提示词文档名称联合类型，由 PROMPT_DOC_PATH_MAP 的键推导 */
export type PromptDocName = keyof typeof PROMPT_DOC_PATH_MAP

/**
 * 提示词文档名到实际文件路径的映射
 * 键为文档名称，路径相对于 src/prompt 目录，不含 .md 后缀
 */
export const PROMPT_DOC_PATH_MAP = {
  SYSTEM: 'plan/system',
  INTENT_ANALYSIS: 'plan/intent-analysis',
  UNDERSTAND_PLAN: 'plan/understand-plan',
  CHECK: 'plan/check',
  REPORT_DEFINITION: 'instruction/report-definition',
  CELL_RENDER_ORDER: 'instruction/cell-render-order',
  PARENT_CELL_RELATION: 'instruction/parent-cell-relation',
  BARCODE_CELL: 'model/cell/barcode-cell',
  CELL_COMMON_ATTRIBUTE: 'model/cell/cell-common-attribute',
  CELL_CONDITIONAL_ATTRIBUTE: 'model/cell/cell-conditional-attribute',
  CHART_CELL: 'model/cell/chart-cell',
  DATASET_CELL: 'model/cell/dataset-cell',
  DIAGONAL_HEADER_CELL: 'model/cell/diagonal-header-cell',
  EXPRESSION_CELL: 'model/cell/expression-cell',
  IMAGE_CELL: 'model/cell/image-cell',
  QRCODE_CELL: 'model/cell/qrcode-cell',
  SIMPLE_TEXT_CELL: 'model/cell/simple-text-cell',
  SLASH_CELL: 'model/cell/slash-cell',
  DATASOURCE_DATASET: 'model/datasource/datasource-dataset',
  EXPRESSION: 'formura/expression/expression',
  FUNCTION: 'formura/expression/function',
  FORM_DESIGN: 'model/form-design/form-design',
  PAGE_CONFIG: 'model/page-config/page-config',
  TABLE_ROW: 'model/table/row',
  TABLE_COL: 'model/table/col',
  COMPACT: 'compact/compact'
} as const

/**
 * 构建时通过 webpack 5 `?raw` 将 .md 文件内联为字符串常量
 * key 为相对于 src/prompt 的路径（不含 .md 后缀），value 为文件原始内容
 */
import systemMd from './plan/system.md?raw'
import intentAnalysisMd from './plan/intent-analysis.md?raw'
import understandPlanMd from './plan/understand-plan.md?raw'
import checkMd from './plan/check.md?raw'
import reportDefinitionMd from './instruction/report-definition.md?raw'
import cellRenderOrderMd from './instruction/cell-render-order.md?raw'
import parentCellRelationMd from './instruction/parent-cell-relation.md?raw'
import barcodeCellMd from './model/cell/barcode-cell.md?raw'
import cellCommonAttributeMd from './model/cell/cell-common-attribute.md?raw'
import cellConditionalAttributeMd from './model/cell/cell-conditional-attribute.md?raw'
import chartCellMd from './model/cell/chart-cell.md?raw'
import datasetCellMd from './model/cell/dataset-cell.md?raw'
import diagonalHeaderCellMd from './model/cell/diagonal-header-cell.md?raw'
import expressionCellMd from './model/cell/expression-cell.md?raw'
import imageCellMd from './model/cell/image-cell.md?raw'
import qrcodeCellMd from './model/cell/qrcode-cell.md?raw'
import simpleTextCellMd from './model/cell/simple-text-cell.md?raw'
import slashCellMd from './model/cell/slash-cell.md?raw'
import datasourceDatasetMd from './model/datasource/datasource-dataset.md?raw'
import expressionMd from './formura/expression/expression.md?raw'
import functionMd from './formura/expression/function.md?raw'
import formDesignMd from './model/form-design/form-design.md?raw'
import pageConfigMd from './model/page-config/page-config.md?raw'
import tableRowMd from './model/table/row.md?raw'
import tableColMd from './model/table/col.md?raw'
import compactMd from './compact/compact.md?raw'

const promptModules: Record<string, string> = {
  'plan/system': systemMd,
  'plan/intent-analysis': intentAnalysisMd,
  'plan/understand-plan': understandPlanMd,
  'plan/check': checkMd,
  'instruction/report-definition': reportDefinitionMd,
  'instruction/cell-render-order': cellRenderOrderMd,
  'instruction/parent-cell-relation': parentCellRelationMd,
  'model/cell/barcode-cell': barcodeCellMd,
  'model/cell/cell-common-attribute': cellCommonAttributeMd,
  'model/cell/cell-conditional-attribute': cellConditionalAttributeMd,
  'model/cell/chart-cell': chartCellMd,
  'model/cell/dataset-cell': datasetCellMd,
  'model/cell/diagonal-header-cell': diagonalHeaderCellMd,
  'model/cell/expression-cell': expressionCellMd,
  'model/cell/image-cell': imageCellMd,
  'model/cell/qrcode-cell': qrcodeCellMd,
  'model/cell/simple-text-cell': simpleTextCellMd,
  'model/cell/slash-cell': slashCellMd,
  'model/datasource/datasource-dataset': datasourceDatasetMd,
  'formura/expression/expression': expressionMd,
  'formura/expression/function': functionMd,
  'model/form-design/form-design': formDesignMd,
  'model/page-config/page-config': pageConfigMd,
  'model/table/row': tableRowMd,
  'model/table/col': tableColMd,
  'compact/compact': compactMd
}

/**
 * 压缩提示词文本
 * 依次执行：多余空行合并 → JSON 代码块紧凑化
 * 所有提示词段加载时统一调用，减少 token 消耗
 *
 * @param text - 原始提示词文本，string，不可为空
 * @returns 压缩后的提示词文本，string
 */
export function compressPrompt(text: string): string {
  if (!text) return text
  let result = text.replace(/\n{3,}/g, '\n\n')
  result = result.replace(/```json\s*\n([\s\S]*?)```/g, (match, jsonContent: string) => {
    try {
      const parsed = JSON.parse(jsonContent.trim())
      return '```json\n' + JSON.stringify(parsed) + '\n```'
    } catch {
      return match
    }
  })
  return result
}

/** 提示词文档缓存，供 loadPromptDoc 复用 */
const docCache: Map<string, string> = new Map()

/**
 * 加载提示词文档
 * 根据相对于 src/prompt 目录的文件路径加载 .md 文件，
 * 优先从缓存读取，缓存未命中则从构建时内联的模块映射中查找并压缩
 *
 * @param relativePath - 相对于 src/prompt 目录的路径（不含 .md 后缀），如 'model/cell/chart-cell'，string，不可为空
 * @returns 压缩后的文档文本内容，string
 */
export async function loadPromptDoc(relativePath: string): Promise<string> {
  const cached = docCache.get(relativePath)
  if (cached !== undefined) {
    return cached
  }

  const rawContent = promptModules[relativePath]
  if (rawContent === undefined) {
    throw new Error(`加载提示词文档失败: ${relativePath}，文件不存在`)
  }

  const content = compressPrompt(rawContent)
  docCache.set(relativePath, content)
  return content
}

/**
 * 根据文档名加载提示词文档
 * 通过 PROMPT_DOC_PATH_MAP 映射文档名到实际文件路径，委托 loadPromptDoc 统一加载
 *
 * @param name - 提示词文档名称，string，不可为空
 * @returns 压缩后的文档文本内容，string
 */
export async function loadPromptDocByEnum(name: string): Promise<string> {
  const filePath = (PROMPT_DOC_PATH_MAP as Record<string, string>)[name]
  if (!filePath) {
    throw new Error(`未知的提示词文档名: ${name}`)
  }
  return loadPromptDoc(filePath)
}

/**
 * 根据文档名同步加载提示词文档
 * Webpack `?raw` 模式下，模块内容在构建时已内联，可同步读取
 * 适用于节点工厂等同步初始化场景
 *
 * @param name - 提示词文档名称，string，不可为空
 * @returns 压缩后的文档文本内容，string
 */
export function loadPromptDocByEnumSync(name: string): string {
  const filePath = (PROMPT_DOC_PATH_MAP as Record<string, string>)[name]
  if (!filePath) {
    throw new Error(`未知的提示词文档名: ${name}`)
  }
  const cached = docCache.get(filePath)
  if (cached !== undefined) {
    return cached
  }
  const rawContent = promptModules[filePath]
  if (rawContent === undefined) {
    throw new Error(`加载提示词文档失败: ${filePath}，文件不存在`)
  }
  const content = compressPrompt(rawContent)
  docCache.set(filePath, content)
  return content
}

/**
 * 批量加载提示词文档并用分界线拼接
 * 供需要同时加载多段提示词的场景使用，如对话开始时加载系统提示词 + 报表说明
 *
 * @param names - 提示词文档名称数组，string[]，不可为空
 * @returns 拼接后的完整提示词文本，string
 */
export async function loadPromptDocs(names: string[]): Promise<string> {
  const SEPARATOR = '\n---- 分界线 ----\n'
  const contents = await Promise.all(names.map(name => loadPromptDocByEnum(name)))
  return contents.join(SEPARATOR)
}
