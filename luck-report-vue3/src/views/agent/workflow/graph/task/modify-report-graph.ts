/**
 * 修改报表主工作流
 * 完整流程：load_docs + 并行知识搜索 → plan_tasks（探查意图）→ select_datasource_op / apply_datasource_type → 子图路由 → form/page 收尾
 */

import {
  ReportStateGraph,
  LLMDecideNode,
  LastValueAfterFinishChannel,
  defaultRetryOn
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { reportStateSchema } from '../state.ts'
import {
  extractDocsMap,
  filterActiveErrors,
  formatDocsAsText
} from '../utils.ts'
import { createDatasourceGraph } from './datasource-graphs.ts'
import { createDatasetGraph, modifyDatasetGraph } from './dataset-create-graphs.ts'
import { modifyCellGraph } from './cell-graphs.ts'
import { modifyRowGraph, modifyColGraph } from './row-col-graphs.ts'
import { modifyFormGraph, modifyPageGraph } from './form-page-graphs.ts'

/**
 * 修改报表工作流
 * 主编排图，按意图路由到子图
 * @returns 编译后的可执行图，CompiledReportGraph
 */
export function modifyReportGraph(): CompiledReportGraph {
  const graph = new ReportStateGraph(reportStateSchema, {
    input: { userMessage: true, intent: true },
    output: {
      cellsData: true,
      datasources: true,
      datasets: true,
      rowData: true,
      colData: true,
      pageConfig: true,
      headerConfig: true,
      footerConfig: true,
      searchForm: true,
      errors: true
    }
  })

  // 阶段1：加载本地知识库（无条件必跑）
  graph.addNode('load_docs', async (state, runtime) => {
    const stepId = 'load_docs'
    const docs = state.intent?.requiredDocs ?? []
    const cache = (state as any).__docCache
    const memoryManager = (state as any).__memoryManager

    // 跨 turn 复用：state.searchResults.docRefs 记录已加载文档名
    const docRefs: string[] = Array.isArray((state.searchResults as any)?.docRefs)
      ? (state.searchResults as any).docRefs
      : []
    const loadedSet = new Set<string>(docRefs)
    const missingDocs = docs.filter((d: string) => !loadedSet.has(d))

    if (missingDocs.length === 0) {
      runtime?.emitEvent({
        mode: 'updates',
        event: { nodeId: stepId, output: { type: 'tool_call', toolCallId: `${stepId}_skip`, toolName: 'load_report_introduce', input: { fileNames: docs } }, status: 'running' },
        timestamp: Date.now()
      })
      runtime?.emitEvent({
        mode: 'updates',
        event: { nodeId: stepId, output: { type: 'tool_result', toolCallId: `${stepId}_skip`, toolName: 'load_report_introduce', result: '已命中跨 turn 文档缓存，本次跳过加载' }, status: 'success' },
        timestamp: Date.now()
      })
      return { searchResults: { docRefs: docs } }
    }

    const toolCallId = `${stepId}_load_report_introduce_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    runtime?.emitEvent({
      mode: 'updates',
      event: {
        nodeId: stepId,
        output: {
          type: 'tool_call',
          toolCallId,
          toolName: 'load_report_introduce',
          input: { fileNames: missingDocs }
        },
        status: 'running'
      },
      timestamp: Date.now()
    })

    // 只请求缺失文档
    const result = await runtime?.toolRegistry.executeTool('load_report_introduce', { fileNames: missingDocs })

    // 写缓存：把工具返回内容存到 cache，跨 turn 复用
    if (cache && result) {
      const docsMap = extractDocsMap(result, missingDocs)
      if (docsMap && Object.keys(docsMap).length > 0) {
        cache.putBatch(docsMap)
      }
    }

    // 写 1 条 tool_result 到 messages（仅缺失部分，首次加载时）
    if (memoryManager && missingDocs.length > 0) {
      memoryManager.addMessage({
        role: 'tool_result',
        toolCallId,
        toolName: 'load_report_introduce',
        content: formatDocsAsText(result),
        docRefs: [...missingDocs]
      })
    }

    runtime?.emitEvent({
      mode: 'updates',
      event: {
        nodeId: stepId,
        output: {
          type: 'tool_result',
          toolCallId,
          toolName: 'load_report_introduce',
          result: formatDocsAsText(result)
        },
        status: result ? 'success' : 'failed'
      },
      timestamp: Date.now()
    })

    // state.searchResults 只存 docRefs（全文走 cache，避免累加膨胀）
    return { searchResults: { docRefs: docs } }
  }, {
    triggers: ['__start__'],
    triggerMode: 'all',
    metadata: { description: '加载本地知识库' }
  })

  const searchBusinessOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('search_business_out', searchBusinessOut)
  graph.addNode('search_business', new LLMDecideNode({
    nodeId: 'search_business',
    allowedTools: ['search_business_knowledge'],
    description: '搜索与用户需求相关的业务术语、业务规则等知识',
    outChannelName: 'search_business_out'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    skipWhen: (state) => !state.intent?.needsBusinessKnowledge,
    metadata: { silent: true, description: '搜索业务知识' }
  })

  const searchAgentOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('search_agent_out', searchAgentOut)
  graph.addNode('search_agent', new LLMDecideNode({
    nodeId: 'search_agent',
    allowedTools: ['search_agent_knowledge'],
    description: '搜索报表制作的案例、最佳实践和设计经验',
    outChannelName: 'search_agent_out'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    skipWhen: (state) => !state.intent?.needsAgentKnowledge,
    metadata: { silent: true, description: '搜索报表制作经验' }
  })

  const searchSchemaOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('search_schema_out', searchSchemaOut)
  graph.addNode('search_schema', new LLMDecideNode({
    nodeId: 'search_schema',
    allowedTools: ['search_schema'],
    description: '跨数据源搜索表结构，定位包含相关表的数据源',
    outChannelName: 'search_schema_out'
  }), {
    triggers: ['__start__'],
    triggerMode: 'all',
    skipWhen: (state) => !state.intent?.needsSchemaSearch,
    metadata: { silent: true, description: '搜索数据源表结构' }
  })

  const planOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('plan_tasks_out', planOut)
  graph.addNode('plan_tasks', new LLMDecideNode({
    nodeId: 'plan_tasks',
    allowedTools: [
      'get_datasources', 'get_datasets',
      'get_search_form'
    ],
    maxIterations: 1,
    description: '**只读探查节点**。根据用户需求和 intent，仅调用与本步意图直接相关的只读工具来确认上下文：' +
      '数据源场景：get_datasources/get_datasets；表单场景：get_search_form。' +
      '**禁止**调用 get_paper_config / get_rows / get_columns / read_cells / write_* 等工具；' +
      '**禁止**在本节点执行任何修改动作；**禁止**分多轮重复调用同一个工具。' +
      '单元格/行列场景无需本步探查，子图内的 read_cells / read_rows_cols 节点会自动读取。' +
      '一次探查完成后立即结束。',
    outChannelName: 'plan_tasks_out'
  }), {
    triggers: ['searchResults'],
    triggerMode: 'any',
    skipWhen: (state) => {
      const i = state.intent
      return !i?.needsDatasourceOperation
        && !i?.needsCellOperation
        && !i?.needsFormOperation
        && !i?.needsPageConfigOperation
        && !i?.needsRowOperation
        && !i?.needsColOperation
    },
    metadata: { description: '分析用户需求并规划任务' }
  })

  // 数据源操作路由器：拆出 select_datasource_op 让 requiredToolResults 不会误伤纯单元格/表单场景
  const selectOut = new LastValueAfterFinishChannel<any>()
  graph.addChannel('select_datasource_op_out', selectOut)
  graph.addNode('select_datasource_op', new LLMDecideNode({
    nodeId: 'select_datasource_op',
    allowedTools: ['select_datasource_operation'],
    requiredToolResults: ['select_datasource_operation'],
    maxIterations: 1,
    description:
      '【本节点唯一任务】立刻调用 select_datasource_operation 工具，**禁止**调用其他任何工具。\n' +
      '【禁止】不要重复审视历史对话、不要重新分析用户意图、不要纠结数据源名称。意图已经由 plan_tasks 节点分析好，你只负责"翻译"。\n' +
      '【禁止】不要在思考里长篇大论，看到意图后 1 步内就调工具，思考控制在 200 字以内。\n' +
      '【决策树】根据 state.intent.datasourceOperationHint（plan_tasks 已经给好）直接映射：\n' +
      '  - 包含"新建/创建/添加/新增"且涉及数据源 → operationType=create_datasource（datasourceName 留空，让下游决定）\n' +
      '  - 包含"新建/创建/添加/新增"且涉及数据集 → operationType=create_dataset（datasourceName 从 searchResults.get_datasources 里挑最匹配的）\n' +
      '  - 包含"修改/编辑/更新/改" → operationType=modify_datasource 或 modify_dataset（按 hint 指明）\n' +
      '  - 包含"删除/移除" → operationType=delete_datasource 或 delete_dataset\n' +
      '【示例】意图是"创建一个有用户信息的数据源" → 立即调 select_datasource_operation({operationType: "create_datasource"})，**不要**在 create_datasource 之外多传字段。\n' +
      '【兜底】如果 hint 缺失，根据 userMessage 里的动词（创建/修改/删除）做最直接判断，**不要反复揣摩**。',
    outChannelName: 'select_datasource_op_out'
  }), {
    triggers: ['plan_tasks_out'],
    triggerMode: 'any',
    skipWhen: (state) => !state.intent?.needsDatasourceOperation,
    metadata: { description: '声明数据源操作类型' }
  })

  // 将 select_datasource_op 的结果写入 intent.datasourceOperationType，供下游条件边使用
  // 关键：select_datasource_operation 工具描述里承诺 "create_datasource 会自动升级为 create_datasource_and_dataset"
  // 这里必须真正实现这个升级，否则 LLM 返回 create_datasource 后流程会停在 create_datasource_subgraph 不再往下走
  graph.addNode('apply_datasource_type', async (state) => {
    const result = state.select_datasource_operation
    let opType: string | undefined = result?.operationType
    const rawOpType = opType
    if (opType === 'create_datasource') {
      opType = 'create_datasource_and_dataset'
    }
    // 关键决策点：记录 LLM 选了什么类型、是否发生升级
    console.log(`[modify-report] apply_datasource_type 决策`, JSON.stringify({
      rawOpType, finalOpType: opType, upgraded: rawOpType !== opType
    }))
    if (opType && state.intent) {
      return { intent: { ...state.intent, datasourceOperationType: opType } }
    }
    return {}
  }, {
    triggers: ['select_datasource_op_out'],
    triggerMode: 'any',
    metadata: { silent: true, description: '应用数据源操作类型到意图' }
  })

  // 阶段3：子图嵌入
  graph.addNode('create_datasource_subgraph', async (state, runtime) => {
    const subGraph = createDatasourceGraph()
    const childRuntime = runtime?.fork()
    const result = await subGraph.execute(state, { configurable: { runtime: childRuntime } })
    const childErrors = filterActiveErrors(result.state.errors)
    const output: Record<string, any> = {
      targetDatasourceName: result.state.targetDatasourceName,
      targetTableNames: result.state.targetTableNames,
      datasources: result.state.datasources
    }
    if (childErrors.length > 0) {
      output.errors = childErrors
    }
    return output
  }, {
    // 关键：去掉 select_datasource_op_out trigger
    // 原因：skipWhen 命中时不会更新 versionsSeen，导致 trigger 在后续超级步（apply_datasource_type 升级 opType 后）仍判定为"新触发"，
    // 从而和条件边 from apply_datasource_type 的目标并行调度。路由改走条件边即可：
    //   - 纯 create_datasource: plan_tasks 条件边直跳
    //   - 升级 create_datasource_and_dataset: apply_datasource_type 条件边直跳
    triggers: ['plan_tasks_out'],
    triggerMode: 'any',
    skipWhen: (state) => {
      // 接受 create_datasource 与 create_datasource_and_dataset：apply_datasource_type 会把 create_datasource 升级成后者
      const op = state.intent?.datasourceOperationType
      return op !== 'create_datasource' && op !== 'create_datasource_and_dataset'
    },
    input: { datasources: true, intent: true, userMessage: true, searchResults: true },
    output: { datasources: true, errors: true, targetDatasourceName: true, targetTableNames: true },
    metadata: { description: '创建数据源子流程' }
  })

  graph.addNode('create_dataset_subgraph', async (state, runtime) => {
    const subGraph = createDatasetGraph()
    const childRuntime = runtime?.fork()
    const result = await subGraph.execute(state, { configurable: { runtime: childRuntime } })
    const childErrors = filterActiveErrors(result.state.errors)
    const output: Record<string, any> = {
      datasets: result.state.datasets,
      searchForm: result.state.searchForm,
      dataset: result.state.dataset,
      targetDatasourceName: result.state.targetDatasourceName
    }
    if (childErrors.length > 0) {
      output.errors = childErrors
    }
    console.log(`[modify-report] create_dataset_subgraph 子图结果`, JSON.stringify({
      success: result.success, childErrors, hasDataset: !!result.state.dataset
    }))
    return output
  }, {
    // 关键：去掉 select_datasource_op_out trigger（修复 error-21：被 create_datasource_subgraph 并行调度的根因）
    // 仅保留 plan_tasks_out 作为辅助触发：纯 create_dataset 走 plan_tasks 条件边直跳；create_datasource_and_dataset 走 create_datasource_subgraph 条件边接力
    triggers: ['plan_tasks_out'],
    triggerMode: 'any',
    skipWhen: (state) => {
      // 接受 create_dataset 与 create_datasource_and_dataset：后者由 create_datasource_subgraph 完成数据源后接力过来
      const op = state.intent?.datasourceOperationType
      return op !== 'create_dataset' && op !== 'create_datasource_and_dataset'
    },
    input: { datasources: true, intent: true, userMessage: true, searchResults: true },
    output: { datasets: true, searchForm: true, errors: true },
    metadata: { description: '创建数据集子流程' }
  })

  graph.addNode('modify_dataset_subgraph', async (state, runtime) => {
    const subGraph = modifyDatasetGraph()
    const childRuntime = runtime?.fork()
    const result = await subGraph.execute(state, { configurable: { runtime: childRuntime } })
    return result.state
  }, {
    triggers: ['plan_tasks_out', 'select_datasource_op_out'],
    triggerMode: 'any',
    skipWhen: (state) => state.intent?.datasourceOperationType !== 'modify_dataset',
    input: { datasets: true, intent: true, userMessage: true, searchResults: true },
    output: { datasets: true, searchForm: true },
    metadata: { description: '修改数据集子流程' }
  })

  graph.addNode('modify_cell_subgraph', async (state, runtime) => {
    const subGraph = modifyCellGraph()
    const childRuntime = runtime?.fork()
    const result = await subGraph.execute(state, { configurable: { runtime: childRuntime } })
    return result.state
  }, {
    triggers: ['plan_tasks_out', 'select_datasource_op_out'],
    triggerMode: 'any',
    skipWhen: (state) => !state.intent?.needsCellOperation,
    input: { datasets: true, cellsData: true, intent: true, searchResults: true },
    output: { cellsData: true },
    metadata: { description: '修改单元格子流程' }
  })

  // 行/列结构子流程：处理行高/列宽调整、插入/删除行列
  graph.addNode('modify_row_subgraph', async (state, runtime) => {
    const subGraph = modifyRowGraph()
    const childRuntime = runtime?.fork()
    const result = await subGraph.execute(state, { configurable: { runtime: childRuntime } })
    return result.state
  }, {
    triggers: ['plan_tasks_out', 'select_datasource_op_out'],
    triggerMode: 'any',
    skipWhen: (state) => !state.intent?.needsRowOperation,
    input: { intent: true, userMessage: true, searchResults: true },
    output: { rowData: true },
    metadata: { description: '修改行结构子流程' }
  })

  graph.addNode('modify_col_subgraph', async (state, runtime) => {
    const subGraph = modifyColGraph()
    const childRuntime = runtime?.fork()
    const result = await subGraph.execute(state, { configurable: { runtime: childRuntime } })
    return result.state
  }, {
    triggers: ['plan_tasks_out', 'select_datasource_op_out'],
    triggerMode: 'any',
    skipWhen: (state) => !state.intent?.needsColOperation,
    input: { intent: true, userMessage: true, searchResults: true },
    output: { colData: true },
    metadata: { description: '修改列结构子流程' }
  })

  // 阶段4：表单/页面操作子图
  graph.addNode('modify_form_subgraph', async (state, runtime) => {
    const subGraph = modifyFormGraph()
    const childRuntime = runtime?.fork()
    const result = await subGraph.execute(state, { configurable: { runtime: childRuntime } })
    return result.state
  }, {
    triggers: ['plan_tasks_out', 'select_datasource_op_out'],
    triggerMode: 'any',
    skipWhen: (state) => !state.intent?.needsFormOperation,
    input: { datasets: true, intent: true, userMessage: true, searchResults: true },
    output: { searchForm: true },
    metadata: { description: '修改查询表单子流程' }
  })

  graph.addNode('modify_page_subgraph', async (state, runtime) => {
    const subGraph = modifyPageGraph()
    const childRuntime = runtime?.fork()
    const result = await subGraph.execute(state, { configurable: { runtime: childRuntime } })
    return result.state
  }, {
    triggers: ['plan_tasks_out', 'select_datasource_op_out'],
    triggerMode: 'any',
    skipWhen: (state) => !state.intent?.needsPageConfigOperation,
    input: { intent: true, userMessage: true, searchResults: true },
    output: { pageConfig: true, headerConfig: true, footerConfig: true },
    metadata: { description: '修改页面配置子流程（含页眉页脚）' }
  })

  // 边
  graph.addEdge('__start__', 'load_docs')
  graph.addEdge('__start__', 'search_business')
  graph.addEdge('__start__', 'search_agent')
  graph.addEdge('__start__', 'search_schema')
  graph.addEdge(['load_docs', 'search_business', 'search_agent', 'search_schema'], 'plan_tasks')

  // 阶段2 → 阶段3 子图：按意图路由
  graph.addConditionalEdges('plan_tasks', (state) => {
    const opType = state.intent?.datasourceOperationType
    if (opType === 'create_datasource') return 'create_datasource_subgraph'
    if (opType === 'create_dataset') return 'create_dataset_subgraph'
    if (opType === 'modify_dataset') return 'modify_dataset_subgraph'
    if (state.intent?.needsDatasourceOperation && !opType) return 'select_datasource_op'
    if (state.intent?.needsCellOperation) return 'modify_cell_subgraph'
    if (state.intent?.needsRowOperation) return 'modify_row_subgraph'
    if (state.intent?.needsColOperation) return 'modify_col_subgraph'
    if (state.intent?.needsFormOperation) return 'modify_form_subgraph'
    if (state.intent?.needsPageConfigOperation) return 'modify_page_subgraph'
    return '__end__'
  })

  // apply_datasource_type 后按已设置的 datasourceOperationType 路由到对应子图
  graph.addConditionalEdges('apply_datasource_type', (state) => {
    const opType = state.intent?.datasourceOperationType
    // 升级后的 "create_datasource_and_dataset" 先走数据源子图（先建数据源），子图完成后由其自身条件边接力到 create_dataset_subgraph
    if (opType === 'create_datasource' || opType === 'create_datasource_and_dataset') return 'create_datasource_subgraph'
    if (opType === 'create_dataset') return 'create_dataset_subgraph'
    if (opType === 'modify_dataset') return 'modify_dataset_subgraph'
    return '__end__'
  })

  // 子工作流完成后的路由
  graph.addConditionalEdges('create_datasource_subgraph', (state) => {
    const childErrors = filterActiveErrors(state.errors)
    if (childErrors.length > 0) {
      console.log(`[modify-report] create_datasource_subgraph 路由`, JSON.stringify({
        target: '__end__', reason: 'errors 非空', errCount: childErrors.length, firstError: childErrors[0]
      }))
      return '__end__'
    }
    if (state.intent?.datasourceOperationType === 'create_datasource_and_dataset') {
      console.log(`[modify-report] create_datasource_subgraph 路由`, JSON.stringify({
        target: 'create_dataset_subgraph', reason: 'opType=create_datasource_and_dataset'
      }))
      return 'create_dataset_subgraph'
    }
    console.log(`[modify-report] create_datasource_subgraph 路由`, JSON.stringify({
      target: '__end__', reason: 'opType 不是 create_datasource_and_dataset', opType: state.intent?.datasourceOperationType
    }))
    return '__end__'
  })
  graph.addConditionalEdges('create_dataset_subgraph', (state) => {
    const childErrors = filterActiveErrors(state.errors)
    if (childErrors.length > 0) {
      console.log(`[modify-report] create_dataset_subgraph 路由`, JSON.stringify({
        target: '__end__', reason: 'errors 非空', errCount: childErrors.length, firstError: childErrors[0]
      }))
      return '__end__'
    }
    if (state.intent?.needsCellOperation) return 'modify_cell_subgraph'
    if (state.intent?.needsRowOperation) return 'modify_row_subgraph'
    if (state.intent?.needsColOperation) return 'modify_col_subgraph'
    if (state.intent?.needsFormOperation) return 'modify_form_subgraph'
    if (state.intent?.needsPageConfigOperation) return 'modify_page_subgraph'
    return '__end__'
  })
  graph.addConditionalEdges('modify_dataset_subgraph', (state) => {
    if (state.intent?.needsCellOperation) return 'modify_cell_subgraph'
    if (state.intent?.needsRowOperation) return 'modify_row_subgraph'
    if (state.intent?.needsColOperation) return 'modify_col_subgraph'
    if (state.intent?.needsFormOperation) return 'modify_form_subgraph'
    if (state.intent?.needsPageConfigOperation) return 'modify_page_subgraph'
    return '__end__'
  })
  // modify_cell_subgraph 完成后按 form → page → __end__ 路由
  graph.addConditionalEdges('modify_cell_subgraph', (state) => {
    if (state.intent?.needsFormOperation) return 'modify_form_subgraph'
    if (state.intent?.needsPageConfigOperation) return 'modify_page_subgraph'
    return '__end__'
  })
  // modify_row_subgraph 完成后：行+列场景接力到列子图，否则按 form/page/__end__ 路由
  graph.addConditionalEdges('modify_row_subgraph', (state) => {
    if (state.intent?.needsColOperation) return 'modify_col_subgraph'
    if (state.intent?.needsFormOperation) return 'modify_form_subgraph'
    if (state.intent?.needsPageConfigOperation) return 'modify_page_subgraph'
    return '__end__'
  })
  // modify_col_subgraph 完成后按 form → page → __end__ 路由
  graph.addConditionalEdges('modify_col_subgraph', (state) => {
    if (state.intent?.needsFormOperation) return 'modify_form_subgraph'
    if (state.intent?.needsPageConfigOperation) return 'modify_page_subgraph'
    return '__end__'
  })
  graph.addEdge('modify_form_subgraph', 'modify_page_subgraph')
  graph.addEdge('modify_page_subgraph', '__end__')

  return graph.compile()
}
