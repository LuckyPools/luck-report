/**
 * 提示词加载器
 * 加载 src/prompt 目录下的 .md 文件，供 ContextManager、doc-tools.ts 工具等模块统一调用
 * 支持枚举映射和路径加载两种方式，含缓存和压缩
 *
 * 使用 Vite import.meta.glob + ?raw 在构建时将 .md 文件内联为字符串常量，
 * 无需 fetch 网络请求，开发和生产环境均可直接使用
 */

/**
 * 提示词文档枚举名
 * 枚举值即为名称本身，供 loadPromptDocByEnum 和工具调用时使用
 * 实际文件路径通过 PROMPT_DOC_PATH_MAP 映射
 */
export enum PromptDocName {
  SYSTEM = 'SYSTEM',
  REPORT_DEFINITION = 'REPORT_DEFINITION',
  CELL_RENDER_ORDER = 'CELL_RENDER_ORDER',
  PARENT_CELL_RELATION = 'PARENT_CELL_RELATION',
  BARCODE_CELL = 'BARCODE_CELL',
  CELL_COMMON_ATTRIBUTE = 'CELL_COMMON_ATTRIBUTE',
  CELL_CONDITIONAL_ATTRIBUTE = 'CELL_CONDITIONAL_ATTRIBUTE',
  CHART_CELL = 'CHART_CELL',
  DATASET_CELL = 'DATASET_CELL',
  DIAGONAL_HEADER_CELL = 'DIAGONAL_HEADER_CELL',
  EXPRESSION_CELL = 'EXPRESSION_CELL',
  IMAGE_CELL = 'IMAGE_CELL',
  QRCODE_CELL = 'QRCODE_CELL',
  SIMPLE_TEXT_CELL = 'SIMPLE_TEXT_CELL',
  DATASOURCE_DATASET = 'DATASOURCE_DATASET',
  EXPRESSION = 'EXPRESSION',
  FUNCTION = 'FUNCTION',
  FORM_DESIGN = 'FORM_DESIGN',
  PAGE_CONFIG = 'PAGE_CONFIG',
  TABLE_ROW = 'TABLE_ROW',
  TABLE_COL = 'TABLE_COL',
  COMPACT = 'COMPACT'
}

/**
 * 枚举名到实际文件路径的映射
 * 路径相对于 src/prompt 目录，不含 .md 后缀
 */
const PROMPT_DOC_PATH_MAP: Record<PromptDocName, string> = {
  [PromptDocName.SYSTEM]: 'plan/system',
  [PromptDocName.REPORT_DEFINITION]: 'instruction/report-definition',
  [PromptDocName.CELL_RENDER_ORDER]: 'instruction/cell-render-order',
  [PromptDocName.PARENT_CELL_RELATION]: 'instruction/parent-cell-relation',
  [PromptDocName.BARCODE_CELL]: 'model/cell/barcode-cell',
  [PromptDocName.CELL_COMMON_ATTRIBUTE]: 'model/cell/cell-common-attribute',
  [PromptDocName.CELL_CONDITIONAL_ATTRIBUTE]: 'model/cell/cell-conditional-attribute',
  [PromptDocName.CHART_CELL]: 'model/cell/chart-cell',
  [PromptDocName.DATASET_CELL]: 'model/cell/dataset-cell',
  [PromptDocName.DIAGONAL_HEADER_CELL]: 'model/cell/diagonal-header-cell',
  [PromptDocName.EXPRESSION_CELL]: 'model/cell/expression-cell',
  [PromptDocName.IMAGE_CELL]: 'model/cell/image-cell',
  [PromptDocName.QRCODE_CELL]: 'model/cell/qrcode-cell',
  [PromptDocName.SIMPLE_TEXT_CELL]: 'model/cell/simple-text-cell',
  [PromptDocName.DATASOURCE_DATASET]: 'model/datasource/datasource-dataset',
  [PromptDocName.EXPRESSION]: 'formura/expression/expression',
  [PromptDocName.FUNCTION]: 'formura/expression/function',
  [PromptDocName.FORM_DESIGN]: 'model/form-design/form-design',
  [PromptDocName.PAGE_CONFIG]: 'model/page-config/page-config',
  [PromptDocName.TABLE_ROW]: 'model/table/row',
  [PromptDocName.TABLE_COL]: 'model/table/col',
  [PromptDocName.COMPACT]: 'compact/compact'
}

/**
 * 构建时通过 Vite import.meta.glob + ?raw 将 src/prompt 下所有 .md 文件内联为字符串
 * key 格式为 /src/prompt/相对路径.md，value 为文件原始内容
 */
const promptModules = import.meta.glob<string>('/src/prompt/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

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

  const moduleKey = `/src/prompt/${relativePath}.md`
  const rawContent = promptModules[moduleKey]
  if (rawContent === undefined) {
    throw new Error(`加载提示词文档失败: ${relativePath}，文件不存在`)
  }

  const content = compressPrompt(rawContent)
  docCache.set(relativePath, content)
  return content
}

/**
 * 根据枚举名加载提示词文档
 * 通过 PROMPT_DOC_PATH_MAP 映射枚举值到实际文件路径，委托 loadPromptDoc 统一加载
 *
 * @param name - 提示词文档枚举名，PromptDocName 枚举值
 * @returns 压缩后的文档文本内容，string
 */
export async function loadPromptDocByEnum(name: PromptDocName): Promise<string> {
  const filePath = PROMPT_DOC_PATH_MAP[name]
  if (!filePath) {
    throw new Error(`未知的提示词文档枚举名: ${name}`)
  }
  return loadPromptDoc(filePath)
}

/**
 * 批量加载提示词文档并用分界线拼接
 * 供需要同时加载多段提示词的场景使用，如对话开始时加载系统提示词 + 报表说明
 *
 * @param names - 提示词文档枚举名数组，PromptDocName[]，不可为空
 * @returns 拼接后的完整提示词文本，string
 */
export async function loadPromptDocs(names: PromptDocName[]): Promise<string> {
  const SEPARATOR = '\n---- 分界线 ----\n'
  const contents = await Promise.all(names.map(name => loadPromptDocByEnum(name)))
  return contents.join(SEPARATOR)
}
