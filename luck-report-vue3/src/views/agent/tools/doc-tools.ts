import type { ToolDefinition } from './types'
import {loadPromptDocByEnum, PROMPT_DOC_PATH_MAP} from '@/prompt'
import {type PromptDocName} from '@/prompt'

/**
 * 工具可用的指令文档名列表
 * 排除 SYSTEM 等内部文档，仅暴露给 AI 工具调用的指令类文档
 */
const INSTRUCTION_DOC_NAMES = Object.keys(PROMPT_DOC_PATH_MAP).filter(
  name => name !== 'SYSTEM'
) as PromptDocName[]

/**
 * 加载报表提示词文档工具
 * 根据传入的文件名枚举列表，加载对应的提示词文档内容
 * 返回结构体 { docs: Record<fileName, content> }，便于调用方按 docName 一一对应写入缓存
 * 只读工具，可并发执行
 */
export const loadReportIntroduceTool: ToolDefinition<{
  fileNames: PromptDocName[]
}> = {
  name: 'load_report_introduce',
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
      // 空入参：返回空结构体，避免调用方按 string 分支兜底
      return { docs: {} as Record<string, string> }
    }

    // 验证每个文件名是否在枚举列表中
    const invalidNames = fileNames.filter(name => !INSTRUCTION_DOC_NAMES.includes(name as PromptDocName))
    if (invalidNames.length > 0) {
      // 错误也走结构体，附带 error 字段；调用方可识别并跳过写入缓存
      return {
        docs: {} as Record<string, string>,
        error: `无效的文档名称: ${invalidNames.join(', ')}。有效的文档名称包括: ${INSTRUCTION_DOC_NAMES.join('、')}`
      }
    }

    // 并发加载每篇文档，按 fileName 一一对应
    const entries = await Promise.all(
      fileNames.map(async (name) => [name, await loadPromptDocByEnum(name)] as const)
    )
    // 结构体返回：{ docs: { [fileName]: content } }
    // 调用方（load_docs 节点）直接 cache.putBatch(result.docs) 即可，无需再按分隔符切分
    return { docs: Object.fromEntries(entries) }
  },
  readOnly: true,
  requireConfirm: false
}
