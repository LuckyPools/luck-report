import type { ToolDefinition } from './types'
import {loadPromptDocByEnum, PROMPT_DOC_PATH_MAP} from '@/prompt'
import {type PromptDocName} from '@/prompt'

/**
 * 工具可用的指令文档名列表，过滤掉 SYSTEM
 */
const INSTRUCTION_DOC_NAMES = Object.keys(PROMPT_DOC_PATH_MAP).filter(
  name => name !== 'SYSTEM'
) as PromptDocName[]

/**
 * 加载报表提示词文档工具，获取报表组件、表达式、数据源等详细说明
 */
export const loadReportDocTool: ToolDefinition<{
  fileNames: PromptDocName[]
}> = {
  name: 'load_report_doc',
  description: `加载报表相关的提示词文档，获取报表组件、表达式、数据源等详细说明。可传入多个文件名同时加载，返回结构体 { docs: { [fileName]: content } }。当需要了解报表某个方面的详细规范时调用此工具。
【参数格式要求】
fileNames 必须是一个字符串数组，数组中的每个元素必须是以下枚举值之一（区分大小写）：
${INSTRUCTION_DOC_NAMES.map(name => `- "${name}"`).join('\n')}
【正确示例】
加载单个文档：{ "fileNames": ["DATASOURCE_DATASET"] }
加载多个文档：{ "fileNames": ["DATASOURCE_DATASET", "DATASET_CELL", "CELL_COMMON_ATTRIBUTE"] }
【错误示例】
❌ 缺少引号：{ "fileNames": [DATASOURCE_DATASET] }
❌ 使用代码块标记：\`\`\`json"fileNames":[...]
❌ 字段名缺少引号：{ fileNames: ["DATASOURCE_DATASET"] }`,
  inputSchema: {
    type: 'object',
    properties: {
      fileNames: {
        type: 'array',
        description: `要加载的提示词文档列表。必须是字符串数组，每个元素必须是以下枚举值之一（区分大小写）：
${INSTRUCTION_DOC_NAMES.join('、')}

正确格式示例：
- 加载单个文档：["DATASOURCE_DATASET"]
- 加载多个文档：["DATASOURCE_DATASET", "DATASET_CELL", "CELL_COMMON_ATTRIBUTE"]

注意：数组元素必须用双引号包裹，如 "DATASOURCE_DATASET"，不能写成 DATASOURCE_DATASET`,
        items: {
          type: 'string',
          enum: INSTRUCTION_DOC_NAMES,
          description: '文档名称枚举值，必须是以下值之一（区分大小写）：' + INSTRUCTION_DOC_NAMES.join('、')
        }
      }
    },
    required: ['fileNames']
  },
  execute: async ({ fileNames }) => {
    if (!fileNames || fileNames.length === 0) {
      return { docs: {} as Record<string, string> }
    }

    const invalidNames = fileNames.filter(name => !INSTRUCTION_DOC_NAMES.includes(name as PromptDocName))
    if (invalidNames.length > 0) {
      return {
        docs: {} as Record<string, string>,
        error: `无效的文档名称: ${invalidNames.join(', ')}。有效的文档名称包括: ${INSTRUCTION_DOC_NAMES.join('、')}`
      }
    }

    const entries = await Promise.all(
      fileNames.map(async (name) => [name, await loadPromptDocByEnum(name)] as const)
    )
    return { docs: Object.fromEntries(entries) }
  },
  readOnly: true,
  requireConfirm: false
}
