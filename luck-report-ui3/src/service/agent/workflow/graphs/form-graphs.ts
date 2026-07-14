/**
 * 表单/页面配置相关子工作流（LangGraph 版本）
 * - modifyFormGraph：read → modify_and_write
 * - modifyPageGraph：read paper/header/footer 并行 → modify_and_write
 * - readFormGraph：单节点拉取 searchForm（被 dispatcher read_form 动作调用）
 * - readPageGraph：3 个 read 节点并行拉取 paper/header/footer（被 dispatcher read_page 动作调用）
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
import { createLLMDecideNode } from '@/service/agent/workflow/nodes/llm-decide-node.ts'
import { createToolCallNode } from '@/service/agent/workflow/nodes/tool-call-node.ts'
import { buildCheckIfNeedModifyNode } from '@/service/agent/workflow/nodes/check-node.ts'

import { logger } from '../logger.ts'

const log = logger('form-graphs')


/**
 * 修改查询表单工作流（LangGraph 版本）
 * 边序：__start__ → read_form → check_if_form_match → [条件边] → modify_and_write_form → __end__
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

  // 检查节点：判断当前表单配置是否已符合需求
  const checkIfFormMatch = buildCheckIfNeedModifyNode({
    nodeId: 'check_if_form_match',
    dataKey: 'searchForm',
    skipKey: 'skipFormModify',
    dataDescription: '表单数据格式为 {datasetId, fields: [{name, label, type, required, defaultValue}], layout}'
  })

  // 节点2：修改并写入查询表单
  const modifyAndWriteForm = createLLMDecideNode({
    nodeId: 'modify_and_write_form',
    allowedTools: ['set_search_form', 'get_search_form_template', 'load_report_doc'],
    requiredToolResults: ['set_search_form'],
    maxIterations: 4,
    description:
      'searchForm 已在 context 中。按"读 searchForm → 场景判断（空表单先调 get_search_form_template 取模板 / 基于原数据调整）→ 调 set_search_form 写入"流程处理。\n' +
      '【数据集参数同步】如果 state.dataset 存在且包含 parameters 数组，说明前序 create_dataset/modify_dataset 任务已生成带查询参数的数据集，' +
      '此时必须将 dataset.parameters 中的每个参数作为查询条件添加到表单中（参数名即条件名，参数类型决定控件类型）。' +
      '如果 state.dataset 不存在或无 parameters，则按用户描述的 taskParams 调整表单。'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_form', readForm)
    .addNode('check_if_form_match', checkIfFormMatch)
    .addNode('modify_and_write_form', modifyAndWriteForm)
    .addEdge(START, 'read_form')
    .addEdge('read_form', 'check_if_form_match')
    // 检查节点后的条件边：如果已符合需求则跳过修改，否则继续执行
    .addConditionalEdges('check_if_form_match', (state) => {
      if (state.skipFormModify === true) {
        log.info('[modifyFormGraph] 表单配置已符合需求，跳过修改操作')
        return 'END'
      }
      return 'modify_and_write_form'
    }, {
      END: END,
      modify_and_write_form: 'modify_and_write_form'
    })
    .addEdge('modify_and_write_form', END)

  return g.compile()
}

/**
 * 读查询表单（dispatcher read_form 动作调用）
 * 单节点，调 get_search_form，结果写入 state.searchForm
 */
export function readFormGraph(): CompiledReportGraph {
  const readForm = createToolCallNode({
    nodeId: 'read_form',
    toolName: 'get_search_form',
    args: {},
    resultKey: 'searchForm'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_form', readForm)
    .addEdge(START, 'read_form')
    .addEdge('read_form', END)

  return g.compile()
}


