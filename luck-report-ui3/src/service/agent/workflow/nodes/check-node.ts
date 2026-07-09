/**
 * 检查节点（无工具，LLM纯文本输出并解析JSON）
 * 用于modify图在read后判断当前数据是否已符合用户需求
 */

import { withInput } from '../node-wrapper.ts'
import type { WorkflowRuntime } from '../runtime.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'
import { loadPromptDocByEnumSync } from '@/prompt/index.ts'

/**
 * 检查节点配置选项
 */
export interface CheckIfNeedModifyNodeOptions {
  /** 节点ID，不可为空 */
  nodeId: string
  /** 当前数据的key名称（如cellsData、rowData等），用于描述提示词 */
  dataKey: string
  /** 跳过标记的字段名（如skipCellModify、skipRowModify等），不可为空 */
  skipKey: string
  /**
   * 数据描述模板，用于说明当前数据的结构
   * 示例：'单元格数据格式为 {"row,col": {value, type}}'
   */
  dataDescription: string
}

/**
 * 创建检查节点（判断当前数据是否已符合用户需求）
 *
 * 方法说明：创建一个轻量级LLM节点，不调用任何工具，生成文本判断结果并解析JSON写入State
 *
 * @param options - 节点配置，CheckIfNeedModifyNodeOptions，不可为空
 * @returns LangGraph节点函数，用于modify图的read和write之间
 *
 * @example
 * ```ts
 * // modifyCellGraph中的检查节点
 * const checkNode = buildCheckIfNeedModifyNode({
 *   nodeId: 'check_if_cells_match',
 *   dataKey: 'cellsData',
 *   skipKey: 'skipCellModify',
 *   dataDescription: '单元格数据格式为 {"row,col": {value, type}}'
 * })
 * ```
 */
export function buildCheckIfNeedModifyNode(options: CheckIfNeedModifyNodeOptions) {
  const { nodeId, dataKey, skipKey, dataDescription } = options

  // 同步加载检查提示词模板
  const checkPromptTemplate = loadPromptDocByEnumSync('CHECK')

  return withInput(async (state: ReportState, _config, runtime: WorkflowRuntime) => {
    // 替换模板变量
    const systemPrompt = checkPromptTemplate
      .replace(/\{\{DATA_KEY\}\}/g, dataKey)
      .replace(/\{\{DATA_DESCRIPTION\}\}/g, dataDescription)
      .replace(/\{\{SKIP_KEY\}\}/g, skipKey)

    // 收集当前数据：dataKey可能为逗号分隔的多个key（如page-graphs）
    const dataKeys = dataKey.split(',').map(k => k.trim())
    const dataParts: string[] = []
    for (const key of dataKeys) {
      const val = (state as Record<string, any>)[key]
      if (val !== null && val !== undefined) {
        dataParts.push(`【${key}】\n${JSON.stringify(val, null, 2)}`)
      }
    }
    const currentDataStr = dataParts.length > 0
      ? dataParts.join('\n\n')
      : '（无数据）'

    // 收集用户需求
    const userNeed = state.userMessage || (state.taskParams ? JSON.stringify(state.taskParams) : '（未提供）')

    // 构建消息列表
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `【用户需求】\n${userNeed}\n\n【当前数据】\n${currentDataStr}` }
    ]

    // 调用LLM生成文本
    let responseText = ''
    try {
      const llmGen = runtime.llmCaller(messages, [])  // 直接调用，不需要await
      for await (const event of llmGen) {
        if (event.type === 'token') {
          responseText += event.content
          runtime.emitEvent({
            mode: 'updates',
            event: { nodeId, output: { type: 'step_progress', message: event.content }, status: 'running' },
            timestamp: Date.now()
          })
        } else if (event.type === 'token_usage') {
          runtime.emitEvent({
            mode: 'updates',
            event: { nodeId, output: { type: 'token_usage', usage: event.usage }, status: 'running' },
            timestamp: Date.now()
          })
        }
      }
    } catch (err: any) {
      console.error(`[${nodeId}] LLM调用失败:`, err.message)
      return { [skipKey]: false } as ReportStateUpdate
    }

    console.log(`[${nodeId}] LLM原始响应:`, responseText)

    // 解析JSON响应
    try {
      // 去除可能的markdown代码块标记
      let jsonStr = responseText.trim()
      const jsonMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim()
      }

      const parsed = JSON.parse(jsonStr)
      console.log(`[${nodeId}] 解析后的JSON:`, parsed)

      // 验证返回的字段名是否正确
      if (parsed && typeof parsed[skipKey] === 'boolean') {
        console.log(`[${nodeId}] 检查结果: ${skipKey}=${parsed[skipKey]}, reason=${parsed.reason || '无'}`)
        return { [skipKey]: parsed[skipKey] } as ReportStateUpdate
      } else {
        console.error(`[${nodeId}] JSON格式不正确，缺少${skipKey}字段或类型错误:`, parsed)
        return { [skipKey]: false } as ReportStateUpdate
      }
    } catch (err: any) {
      console.error(`[${nodeId}] JSON解析失败:`, err.message, '原始文本:', responseText)
      return { [skipKey]: false } as ReportStateUpdate
    }
  }, { nodeName: nodeId })
}