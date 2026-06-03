import type { ToolDefinition } from './types'
import { loadPromptDocByEnum, PromptDocName } from '@/prompt'

/**
 * 工具可用的指令文档枚举值列表
 * 排除 SYSTEM 等内部文档，仅暴露给 AI 工具调用的指令类文档
 */
const INSTRUCTION_DOC_NAMES = Object.values(PromptDocName).filter(
  name => name !== PromptDocName.SYSTEM
)

/**
 * 加载报表提示词文档工具
 * 根据传入的文件名枚举列表，加载对应的提示词文档内容
 * 多个文件内容之间用 "---- 分界线 ----" 加换行符拼接
 * 只读工具，可并发执行
 */
export const loadReportIntroduceTool: ToolDefinition<{
  fileNames: PromptDocName[]
}> = {
  name: 'load_report_introduce',
  description: '加载报表相关的提示词文档，获取报表组件、表达式、数据源等详细说明。可传入多个文件名同时加载，文档内容将以分界线拼接返回。当需要了解报表某个方面的详细规范时调用此工具。',
  inputSchema: {
    type: 'object',
    properties: {
      fileNames: {
        type: 'array',
        description: '要加载的提示词文档列表。可选值：REPORT_DEFINITION-报表说明、CELL_RENDER_ORDER-单元格渲染顺序、PARENT_CELL_RELATION-父子格关系、BARCODE_CELL-条形码单元格、CELL_COMMON_ATTRIBUTE-单元格通用属性、CELL_CONDITIONAL_ATTRIBUTE-条件属性、CHART_CELL-图表单元格、DATASET_CELL-数据集单元格、DIAGONAL_HEADER_CELL-斜线表头单元格、EXPRESSION_CELL-表达式单元格、IMAGE_CELL-图片单元格、QRCODE_CELL-二维码单元格、SIMPLE_TEXT_CELL-普通文本单元格、DATASOURCE_DATASET-数据源与数据集、EXPRESSION-表达式说明、FUNCTION-函数说明、FORM_DESIGN-查询表单设计、PAGE_CONFIG-页面配置、TABLE_ROW-行列说明。示例：加载报表说明传 ["REPORT_DEFINITION"]，同时加载多个文档传 ["DATASOURCE_DATASET", "DATASET_CELL", "CELL_COMMON_ATTRIBUTE"]',
        items: {
          type: 'string',
          enum: INSTRUCTION_DOC_NAMES
        }
      }
    },
    required: ['fileNames']
  },
  execute: async ({ fileNames }) => {
    if (!fileNames || fileNames.length === 0) {
      return '未指定要加载的文档文件名'
    }

    const SEPARATOR = '\n---- 分界线 ----\n'
    const contents = await Promise.all(
      fileNames.map(fileName => loadPromptDocByEnum(fileName as PromptDocName))
    )
    return contents.join(SEPARATOR)
  },
  readOnly: true,
  requireConfirm: false
}
