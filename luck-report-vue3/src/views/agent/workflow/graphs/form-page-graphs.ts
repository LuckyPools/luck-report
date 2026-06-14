/**
 * 表单/页面配置相关子工作流（LangGraph 版本）
 * - modifyFormGraph：read → modify_and_write
 * - modifyPageGraph：read paper/header/footer 并行 → modify_and_write
 *
 * 与自建引擎版本的差异：
 * 1. read 阶段用 ToolCallNode 纯函数
 * 2. modify_and_write 阶段用 LLMDecideNode
 * 3. modify_page 三个 read 节点并行触发 modify_and_write（all 模式汇合）
 * 4. 不再 new LastValueAfterFinishChannel
 */

import { StateGraph, START, END } from '@langchain/langgraph'
import {
  ReportStateAnnotation,
  WorkflowRuntimeAnnotation,
  withInput
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { createLLMDecideNode } from '@/views/agent/workflow/nodes/llm-decide-node.ts'
import { createToolCallNode } from '@/views/agent/workflow/nodes/tool-call-node.ts'

/**
 * 修改查询表单工作流（LangGraph 版本）
 * 边序：__start__ → read_form → modify_and_write_form → __end__
 * @returns 编译后的可执行图
 */
export function modifyFormGraph(): CompiledReportGraph {
  // 节点1：读取查询表单（纯函数，零 LLM）
  const readForm = createToolCallNode({
    nodeId: 'read_form',
    toolName: 'get_search_form',
    args: {},
    resultKey: 'searchForm'
  })

  // 节点2：修改并写入查询表单
  const modifyAndWriteForm = createLLMDecideNode({
    nodeId: 'modify_and_write_form',
    allowedTools: ['set_search_form', 'get_search_form_template', 'load_report_introduce'],
    requiredToolResults: ['set_search_form'],
    maxIterations: 4,
    description:
      'searchForm 已在 context 中，禁止重读。按"读 searchForm → 场景判断（空表单先调 get_search_form_template 取模板 / 基于原数据调整）→ 调 set_search_form 写入"流程处理。'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_form', readForm)
    .addNode('modify_and_write_form', modifyAndWriteForm)
    .addEdge(START, 'read_form')
    .addEdge('read_form', 'modify_and_write_form')
    .addEdge('modify_and_write_form', END)

  return g.compile()
}

/**
 * 修改页面配置工作流（LangGraph 版本）
 * 边序：3 个 read 节点并行从 __start__ 启动，全部完成后汇合到 modify_and_write_page
 * - __start__ → read_paper_config
 * - __start__ → read_header_config
 * - __start__ → read_footer_config
 * - [paper, header, footer] → modify_and_write_page（all 模式汇合）
 * - modify_and_write_page → __end__
 *
 * @returns 编译后的可执行图
 */
export function modifyPageGraph(): CompiledReportGraph {
  // 节点1a：读取页面配置（纯函数）
  const readPaperConfig = createToolCallNode({
    nodeId: 'read_paper_config',
    toolName: 'get_paper_config',
    args: {},
    resultKey: 'pageConfig'
  })

  // 节点1b：读取页眉配置（纯函数）
  const readHeaderConfig = createToolCallNode({
    nodeId: 'read_header_config',
    toolName: 'get_header',
    args: {},
    resultKey: 'headerConfig'
  })

  // 节点1c：读取页脚配置（纯函数）
  const readFooterConfig = createToolCallNode({
    nodeId: 'read_footer_config',
    toolName: 'get_footer',
    args: {},
    resultKey: 'footerConfig'
  })

  // 节点2：修改并写入页面配置（含页眉页脚）
  const modifyAndWritePage = createLLMDecideNode({
    nodeId: 'modify_and_write_page',
    allowedTools: ['update_paper', 'update_header', 'update_footer', 'get_paper_config_template', 'get_header_footer_template', 'load_report_introduce'],
    requiredToolResults: ['update_paper', 'update_header', 'update_footer'],
    maxIterations: 6,
    description:
      'pageConfig、headerConfig、footerConfig 已在 context 中，禁止重读。按以下流程处理：\n' +
      '1. 纸张配置：读 pageConfig → 空配置先调 get_paper_config_template 取模板 / 基于原数据调整 → 调 update_paper 写入\n' +
      '2. 页眉配置：读 headerConfig → 空配置先调 get_header_footer_template({type:"header"}) 取模板 / 基于原数据调整 → 调 update_header 写入\n' +
      '3. 页脚配置：读 footerConfig → 空配置先调 get_header_footer_template({type:"footer"}) 取模板 / 基于原数据调整 → 调 update_footer 写入\n' +
      '【重要】header 和 footer 是 reportDef 的独立字段，与 paper 平级，禁止把 header/footer 放进 paper 对象中。\n' +
      '失败必须按 message 修正后重试对应工具，禁止换工具。'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_paper_config', readPaperConfig)
    .addNode('read_header_config', readHeaderConfig)
    .addNode('read_footer_config', readFooterConfig)
    .addNode('modify_and_write_page', modifyAndWritePage)
    .addEdge(START, 'read_paper_config')
    .addEdge(START, 'read_header_config')
    .addEdge(START, 'read_footer_config')
    // all 模式汇合：3 个 read 都完成才触发写入
    .addEdge(['read_paper_config', 'read_header_config', 'read_footer_config'], 'modify_and_write_page')
    .addEdge('modify_and_write_page', END)

  return g.compile()
}
