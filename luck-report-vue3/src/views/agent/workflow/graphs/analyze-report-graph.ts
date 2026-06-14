/**
 * 分析报表主工作流（LangGraph 版本）
 * 读取报表的各类配置数据，分析报表结构并返回分析结果
 *
 * 与自建引擎版本的差异：
 * 1. 不再 new LastValueAfterFinishChannel
 * 2. skipWhen 在节点内部提前 return {}，或在条件边路由跳过
 * 3. 6 个 read 节点从 load_docs 通过 addConditionalEdges 扇出（数组返回值为并行执行列表）
 * 4. 6 个 read 节点全部汇合到 END（END 节点本身即 barrier，并行完成后才结束图）
 * 5. 6 个 read 节点按 intent 标志位条件执行；不执行时早 return
 */

import { StateGraph, START, END } from '@langchain/langgraph'
import {
  ReportStateAnnotation,
  AnalyzeReportInputAnnotation,
  AnalyzeReportOutputAnnotation,
  WorkflowRuntimeAnnotation,
  withInput
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { createLLMDecideNode } from '@/views/agent/workflow/nodes/llm-decide-node.ts'
import { createToolCallNode } from '@/views/agent/workflow/nodes/tool-call-node.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'
import { buildLoadDocsNode } from './load-docs.ts'

/**
 * 分析报表工作流
 * 边序：__start__ → load_docs → fan-out（6 个 read 节点按 intent 条件执行）→ __end__
 * 关键：END 节点本身即 barrier，所有并行 read 完成后才进入 END
 *
 * @returns 编译后的可执行图
 */
export function analyzeReportGraph(): CompiledReportGraph {
  // 节点1：加载文档（无条件必跑，复用公共 load_docs 节点）
  const loadDocs = buildLoadDocsNode()

  // 节点2：读取数据源/数据集（LLM，按 intent 跳过）
  const readDatasources = createLLMDecideNode({
    nodeId: 'read_datasources',
    allowedTools: ['get_datasources', 'get_datasets'],
    description: '读取数据源和数据集信息'
  })

  // 节点3：读取单元格（LLM）
  const readCells = createLLMDecideNode({
    nodeId: 'read_cells',
    allowedTools: ['read_cells'],
    description: '读取单元格数据'
  })

  // 节点4：读取行数据（ToolCall，按 intent 跳过）
  const readRows = createToolCallNode({
    nodeId: 'read_rows',
    toolName: 'get_rows',
    args: {},
    resultKey: 'rowData'
  })

  // 节点5：读取列数据（ToolCall，按 intent 跳过）
  const readCols = createToolCallNode({
    nodeId: 'read_cols',
    toolName: 'get_columns',
    args: {},
    resultKey: 'colData'
  })

  // 节点6：读取查询表单（LLM）
  const readForm = createLLMDecideNode({
    nodeId: 'read_form',
    allowedTools: ['get_search_form'],
    description: '读取查询表单配置'
  })

  // 节点7：读取页面配置（LLM）
  const readPageConfig = createLLMDecideNode({
    nodeId: 'read_page_config',
    allowedTools: ['get_paper_config'],
    description: '读取页面配置'
  })

  // 关键：使用链式 API 保持 LangGraph StateGraph 的 N 类型推断
  // 边设计：load_docs → fan-out（按 intent 条件边路由到需要执行的 read 节点）→ END
  // addConditionalEdges 返回的数组决定下游并行执行哪些 read 节点，未列出则被跳过
  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('load_docs', loadDocs)
    .addNode('read_datasources', readDatasources)
    .addNode('read_cells', readCells)
    .addNode('read_rows', readRows)
    .addNode('read_cols', readCols)
    .addNode('read_form', readForm)
    .addNode('read_page_config', readPageConfig)
    .addEdge(START, 'load_docs')
    .addConditionalEdges('load_docs', (state: ReportState) => {
      const intent = state.intent
      const targets: string[] = []
      if (intent?.needsDatasourceOperation) targets.push('read_datasources')
      if (intent?.needsCellOperation) targets.push('read_cells')
      if (intent?.needsRowOperation) targets.push('read_rows')
      if (intent?.needsColOperation) targets.push('read_cols')
      if (intent?.needsFormOperation) targets.push('read_form')
      if (intent?.needsPageConfigOperation) targets.push('read_page_config')
      return targets
    })
    .addEdge('read_datasources', END)
    .addEdge('read_cells', END)
    .addEdge('read_rows', END)
    .addEdge('read_cols', END)
    .addEdge('read_form', END)
    .addEdge('read_page_config', END)

  return g.compile({ input: AnalyzeReportInputAnnotation, output: AnalyzeReportOutputAnnotation })
}
