/**
 * 表单/页面配置相关子工作流
 * - modifyFormGraph：修改查询表单
 * - modifyPageGraph：修改页面配置（含页眉页脚）
 */

import {
  ReportStateGraph,
  LLMDecideNode,
  ToolCallNode,
  LastValueAfterFinishChannel,
  defaultRetryOn
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { reportStateSchema } from '../state.ts'

/**
 * 修改查询表单工作流：read → modify_and_write
 * read 节点用 ToolCallNode 纯函数读取，modify_and_write 节点 context 自动包含 searchForm
 */
export function modifyFormGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true, datasets: true, searchResults: true },
    output: { searchForm: true }
  })

  // 节点1：读取查询表单（纯函数，零 LLM）
  const readOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_form_out', readOut)
  graph.addNode('read_form', new ToolCallNode({
    nodeId: 'read_form',
    toolName: 'get_search_form',
    args: {},
    outChannelName: 'read_form_out',
    resultKey: 'searchForm'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '读取查询表单数据' }
  })

  // 节点2：修改并写入查询表单
  const writeOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('modify_and_write_form_out', writeOut)
  graph.addNode('modify_and_write_form', new LLMDecideNode({
    nodeId: 'modify_and_write_form',
    allowedTools: ['set_search_form', 'get_search_form_template', 'load_report_introduce'],
    requiredToolResults: ['set_search_form'],
    maxIterations: 4,
    description: 'searchForm 已在 context 中，禁止重读。按"读 searchForm → 场景判断（空表单先调 get_search_form_template 取模板 / 基于原数据调整）→ 调 set_search_form 写入"流程处理。',
    outChannelName: 'modify_and_write_form_out'
  }), {
    triggers: ['searchForm'],
    triggerMode: 'any',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '修改并写入查询表单' }
  })

  graph.addEdge('__start__', 'read_form')
  graph.addEdge('read_form', 'modify_and_write_form')
  graph.addEdge('modify_and_write_form', '__end__')

  return graph.compile()
}

/**
 * 修改页面配置工作流：read → modify_and_write
 * read 阶段并行读取 paper/header/footer，modify_and_write 阶段由 LLM 统一决策
 */
export function modifyPageGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true, searchResults: true },
    output: { pageConfig: true, headerConfig: true, footerConfig: true }
  })

  // 节点1a：读取页面配置（纯函数，零 LLM）
  const readPaperOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_paper_config_out', readPaperOut)
  graph.addNode('read_paper_config', new ToolCallNode({
    nodeId: 'read_paper_config',
    toolName: 'get_paper_config',
    args: {},
    outChannelName: 'read_paper_config_out',
    resultKey: 'pageConfig'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '读取纸张配置数据' }
  })

  // 节点1b：读取页眉配置（纯函数，零 LLM）
  const readHeaderOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_header_config_out', readHeaderOut)
  graph.addNode('read_header_config', new ToolCallNode({
    nodeId: 'read_header_config',
    toolName: 'get_header',
    args: {},
    outChannelName: 'read_header_config_out',
    resultKey: 'headerConfig'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '读取页眉配置数据' }
  })

  // 节点1c：读取页脚配置（纯函数，零 LLM）
  const readFooterOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('read_footer_config_out', readFooterOut)
  graph.addNode('read_footer_config', new ToolCallNode({
    nodeId: 'read_footer_config',
    toolName: 'get_footer',
    args: {},
    outChannelName: 'read_footer_config_out',
    resultKey: 'footerConfig'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '读取页脚配置数据' }
  })

  // 节点2：修改并写入页面配置（含页眉页脚）
  const writeOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('modify_and_write_page_out', writeOut)
  graph.addNode('modify_and_write_page', new LLMDecideNode({
    nodeId: 'modify_and_write_page',
    allowedTools: ['update_paper', 'update_header', 'update_footer', 'get_paper_config_template', 'get_header_footer_template', 'load_report_introduce'],
    requiredToolResults: ['update_paper', 'update_header', 'update_footer'],
    maxIterations: 6,
    description: 'pageConfig、headerConfig、footerConfig 已在 context 中，禁止重读。按以下流程处理：\n' +
      '1. 纸张配置：读 pageConfig → 空配置先调 get_paper_config_template 取模板 / 基于原数据调整 → 调 update_paper 写入\n' +
      '2. 页眉配置：读 headerConfig → 空配置先调 get_header_footer_template({type:"header"}) 取模板 / 基于原数据调整 → 调 update_header 写入\n' +
      '3. 页脚配置：读 footerConfig → 空配置先调 get_header_footer_template({type:"footer"}) 取模板 / 基于原数据调整 → 调 update_footer 写入\n' +
      '【重要】header 和 footer 是 reportDef 的独立字段，与 paper 平级，禁止把 header/footer 放进 paper 对象中。\n' +
      '失败必须按 message 修正后重试对应工具，禁止换工具。',
    outChannelName: 'modify_and_write_page_out'
  }), {
    triggers: ['pageConfig', 'headerConfig', 'footerConfig'],
    triggerMode: 'any',
    retryPolicy: { maxAttempts: 2, retryOn: defaultRetryOn, clearMemoryOnRetry: true },
    metadata: { description: '修改并写入页面配置（含页眉页脚）' }
  })

  graph.addEdge('__start__', 'read_paper_config')
  graph.addEdge('__start__', 'read_header_config')
  graph.addEdge('__start__', 'read_footer_config')
  graph.addEdge(['read_paper_config', 'read_header_config', 'read_footer_config'], 'modify_and_write_page')
  graph.addEdge('modify_and_write_page', '__end__')

  return graph.compile()
}
