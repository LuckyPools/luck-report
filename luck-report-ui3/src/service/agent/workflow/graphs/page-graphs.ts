import { StateGraph, START, END } from '@langchain/langgraph'
import {
  ReportStateAnnotation,
  WorkflowRuntimeAnnotation
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { createLLMDecideNode } from '@/service/agent/workflow/nodes/llm-decide-node.ts'
import { createToolCallNode } from "@/service/agent/workflow/nodes/tool-call-node.ts"
import { buildCheckIfNeedModifyNode } from '@/service/agent/workflow/nodes/check-node.ts'

/**
 * 修改页面配置工作流（LangGraph 版本）
 * 边序：3 个 read 节点并行从 __start__ 启动，全部完成后汇合到 check_if_page_match
 * - __start__ → read_paper_config
 * - __start__ → read_header_config
 * - __start__ → read_footer_config
 * - [paper, header, footer] → check_if_page_match（all 模式汇合）
 * - check_if_page_match → [条件边] → modify_and_write_page 或 END
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

    // 检查节点：判断当前页面配置是否已符合需求
    const checkIfPageMatch = buildCheckIfNeedModifyNode({
        nodeId: 'check_if_page_match',
        dataKey: 'pageConfig, headerConfig, footerConfig',
        skipKey: 'skipPageModify',
        dataDescription: '页面配置包含三部分：pageConfig(纸张配置), headerConfig(页眉), footerConfig(页脚)'
    })

    // 节点2：修改并写入页面配置（含页眉页脚）
    const modifyAndWritePage = createLLMDecideNode({
        nodeId: 'modify_and_write_page',
        allowedTools: ['update_paper', 'update_header', 'update_footer', 'get_paper_config_template', 'get_header_footer_template', 'load_report_doc'],
        requiredToolResults: ['update_paper', 'update_header', 'update_footer'],
        maxIterations: 6,
        description:
            'pageConfig、headerConfig、footerConfig 已在 context 中。按以下流程处理：\n' +
            '1. 纸张配置：读 pageConfig → 空配置先调 get_paper_config_template 取模板 / 基于原数据调整 → 调 update_paper 写入\n' +
            '2. 页眉配置：读 headerConfig → 线配置先调 get_header_footer_template({type:"header"}) 取模板 / 基于原数据调整 → 调 update_header 写入\n' +
            '3. 页脚配置：读 footerConfig → 线配置先调 get_header_footer_template({type:"footer"}) 取模板 / 基于原数据调整 → 调 update_footer 写入\n' +
            '【重要】header 和 footer 是 reportDef 的独立字段，与 paper 平级，禁止把 header/footer 放进 paper 对象中。\n' +
            '失败必须按 message 修正后重试对应工具。'
    })

    const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
        .addNode('read_paper_config', readPaperConfig)
        .addNode('read_header_config', readHeaderConfig)
        .addNode('read_footer_config', readFooterConfig)
        .addNode('check_if_page_match', checkIfPageMatch)
        .addNode('modify_and_write_page', modifyAndWritePage)
        .addEdge(START, 'read_paper_config')
        .addEdge(START, 'read_header_config')
        .addEdge(START, 'read_footer_config')
        // all 模式汇合：3 个 read 都完成才进入检查节点
        .addEdge(['read_paper_config', 'read_header_config', 'read_footer_config'], 'check_if_page_match')
        // 检查节点后的条件边：如果已符合需求则跳过修改，否则继续执行
        .addConditionalEdges('check_if_page_match', (state) => {
            if (state.skipPageModify === true) {
                console.log('[modifyPageGraph] 页面配置已符合需求，跳过修改操作')
                return 'END'
            }
            return 'modify_and_write_page'
        }, {
            END: END,
            modify_and_write_page: 'modify_and_write_page'
        })
        .addEdge('modify_and_write_page', END)

    return g.compile()
}

/**
 * 读页面配置（dispatcher read_page 动作调用）
 * 3 个 read 节点并行拉取 paper / header / footer，结果分别写入对应 state 字段
 */
export function readPageGraph(): CompiledReportGraph {
  const readPaperConfig = createToolCallNode({
    nodeId: 'read_paper_config',
    toolName: 'get_paper_config',
    args: {},
    resultKey: 'pageConfig'
  })
  const readHeaderConfig = createToolCallNode({
    nodeId: 'read_header_config',
    toolName: 'get_header',
    args: {},
    resultKey: 'headerConfig'
  })
  const readFooterConfig = createToolCallNode({
    nodeId: 'read_footer_config',
    toolName: 'get_footer',
    args: {},
    resultKey: 'footerConfig'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_paper_config', readPaperConfig)
    .addNode('read_header_config', readHeaderConfig)
    .addNode('read_footer_config', readFooterConfig)
    .addEdge(START, 'read_paper_config')
    .addEdge(START, 'read_header_config')
    .addEdge(START, 'read_footer_config')
    // all 模式汇合：3 个 read 都完成才结束
    .addEdge(['read_paper_config', 'read_header_config', 'read_footer_config'], END)

  return g.compile()
}