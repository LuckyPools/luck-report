/**
 * 数据集创建/修改子工作流（LangGraph 版本）
 * create / update 共用 prepare_schema → resolve_datasource → resolve_table →
 * fetch_dataset_template → resolve_filter_conditions → build_dataset → validate_dataset
 * 差异化：create 从 prepare_schema 起、update 前置 load_existing_dataset；写入节点 add vs update
 *
 * 删除数据集见本文件 deleteDatasetGraph
 * 读数据集见本文件 readDatasetsGraph（dispatcher read_datasets 动作调用）
 */

import { StateGraph, START, END } from '@langchain/langgraph'
import {
  ReportStateAnnotation,
  WorkflowRuntimeAnnotation,
  withInput
} from '../index.ts'
import type { CompiledReportGraph } from '../index.ts'
import { runToolWithEvent } from '../utils.ts'
import { createToolCallNode } from '@/service/agent/workflow/nodes/tool-call-node.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'
import {
  buildPrepareSchemaNode,
  buildResolveDatasourceNode,
  buildResolveTableNode,
  buildFetchDatasetTemplateNode,
  buildResolveFilterConditionsNode,
  buildBuildDatasetNode,
  buildValidateDatasetNode,
  buildConfirmDatasetNode
} from './dataset-shared-builders.ts'

/** 数据集操作模式：create 新建，update 修改 */
export type DatasetOpMode = 'create' | 'update'

/**
 * 加载现有数据集（update 模式前置节点）
 * 读取所有 datasets，匹配 intent.targetDatasetName / datasetName，注入 dataset / targetDatasourceName
 * @returns LangGraph 节点函数
 */
function buildLoadExistingDatasetNode() {
  return withInput(async (state: ReportState, _config, runtime) => {
    const stepId = 'load_existing_dataset'
    const allDatasets: any = await runToolWithEvent(runtime, stepId, 'get_datasets', {})
    const targetName = state.intent?.targetDatasetName || state.intent?.datasetName
    const dsList: any[] = Array.isArray(allDatasets)
      ? allDatasets
      : (Array.isArray(allDatasets?.datasets) ? allDatasets.datasets : [])
    if (!targetName) {
      return { errors: ['load_existing_dataset: intent 中缺少目标数据集名称（targetDatasetName 或 datasetName）'] } as ReportStateUpdate
    }
    const found = dsList.find((d: any) => d?.name === targetName)
    if (!found) {
      return { errors: [`load_existing_dataset: 未找到目标数据集 "${targetName}"，当前共有 ${dsList.length} 个数据集`] } as ReportStateUpdate
    }
    const dsName = found.datasourceName || found.datasource
    return {
      dataset: found,
      targetDatasourceName: dsName,
      datasets: dsList
    } as ReportStateUpdate
  }, { nodeName: 'load_existing_dataset' })
}

/**
 * 写入数据集节点工厂
 * create 模式调 add_dataset；update 模式调 update_dataset（要求 dataset.name）
 * @param mode - 操作模式
 * @returns 节点函数
 */
function buildWriteDatasetNode(mode: DatasetOpMode) {
  const stepId = mode === 'create' ? 'add_dataset' : 'update_dataset'
  const toolName = mode === 'create' ? 'add_dataset' : 'update_dataset'
  return withInput(async (state: ReportState, _config, runtime) => {
    const dsName = state.targetDatasourceName
    const dataset = state.dataset
    if (!dsName || !dataset) {
      return { errors: [`${stepId}: 缺少 datasourceName 或 dataset`] } as ReportStateUpdate
    }
    const args: Record<string, any> = { datasourceName: dsName, dataset }
    if (mode === 'update') {
      const datasetName = (dataset as any)?.name
      if (!datasetName) return { errors: ['update_dataset: 缺少 dataset.name'] } as ReportStateUpdate
      args.datasetName = datasetName
    }
    const result: any = await runToolWithEvent(runtime, stepId, toolName, args)
    if (result?.success === false) {
      return { errors: [`${stepId} 失败: ${result.message || '未知错误'}`] } as ReportStateUpdate
    }
    return {
      datasetWriteResult: {
        success: true,
        message: result?.message,
        datasetId: result?.datasetId
      }
    } as ReportStateUpdate
  }, { nodeName: stepId })
}

/**
 * 创建/修改数据集工作流工厂（LangGraph 版本）
 * 边序：__start__ → [load_existing_dataset?] → prepare_schema → resolve_datasource → resolve_table
 *       → fetch_dataset_template → resolve_filter_conditions → build_dataset
 *       → validate_dataset → write_dataset → confirm_dataset → __end__
 * 注：表单同步已移至 planner 统一规划 modify_form 任务，不再由数据集子图内部处理
 * @param mode - 'create' 新建，'update' 修改
 * @returns 编译后的工作流图
 */
export function createOrUpdateDatasetGraph(mode: DatasetOpMode): CompiledReportGraph {
  // write_dataset 节点根据 mode 决定 add vs update
  const writeNode = buildWriteDatasetNode(mode)
  // build_dataset 节点根据 mode 决定 preserveName（update 模式需保留原名）
  const buildDatasetNode = buildBuildDatasetNode({ preserveName: mode === 'update' })

  // 链式建图
  const builder = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('prepare_schema', buildPrepareSchemaNode())
    .addNode('resolve_datasource', buildResolveDatasourceNode())
    .addNode('resolve_table', buildResolveTableNode())
    .addNode('fetch_dataset_template', buildFetchDatasetTemplateNode())
    .addNode('resolve_filter_conditions', buildResolveFilterConditionsNode())
    .addNode('build_dataset', buildDatasetNode)
    .addNode('validate_dataset', buildValidateDatasetNode())
    .addNode('write_dataset', writeNode)
    .addNode('confirm_dataset', buildConfirmDatasetNode())

  // update 模式前置 load_existing_dataset
  let startEdges = 'prepare_schema'
  if (mode === 'update') {
    builder.addNode('load_existing_dataset', buildLoadExistingDatasetNode())
    builder.addEdge('load_existing_dataset', 'prepare_schema')
    startEdges = 'load_existing_dataset'
  }
  // write 节点统一注册为 'write_dataset'，边也引用 'write_dataset'
  const writeNodeName = 'write_dataset'

  return builder
    .addEdge(START, startEdges as any)
    .addEdge('prepare_schema', 'resolve_datasource')
    .addEdge('resolve_datasource', 'resolve_table')
    .addEdge('resolve_table', 'fetch_dataset_template')
    .addEdge('fetch_dataset_template', 'resolve_filter_conditions')
    .addEdge('resolve_filter_conditions', 'build_dataset')
    .addEdge('build_dataset', 'validate_dataset')
    .addEdge('validate_dataset', writeNodeName)
    .addEdge(writeNodeName, 'confirm_dataset')
    .addEdge('confirm_dataset', END)
    .compile()
}

/**
 * 创建数据集工作流（向后兼容别名，内部走 createOrUpdateDatasetGraph('create')）
 * @returns 编译后的工作流图
 */
export function createDatasetGraph(): CompiledReportGraph {
  return createOrUpdateDatasetGraph('create')
}

/**
 * 修改数据集工作流（向后兼容别名，内部走 createOrUpdateDatasetGraph('update')）
 * @returns 编译后的工作流图
 */
export function modifyDatasetGraph(): CompiledReportGraph {
  return createOrUpdateDatasetGraph('update')
}

/**
 * 删除数据集工作流（LangGraph 版本）
 * 边序：__start__ → confirm_dataset_exists → delete_dataset_obj → __end__
 */
export function deleteDatasetGraph(): CompiledReportGraph {
  const confirmDatasetExists = withInput(async (_state: ReportState, _config, runtime) => {
    const datasets = await runtime.toolRegistry.executeTool('get_datasets', {})
    return { datasets } as ReportStateUpdate
  }, { nodeName: 'confirm_dataset_exists' })

  const deleteDatasetObj = withInput(async (_state: ReportState, _config, runtime) => {
    const result = await runtime.toolRegistry.executeTool('remove_dataset', {})
    return { datasets: result } as ReportStateUpdate
  }, { nodeName: 'delete_dataset_obj' })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('confirm_dataset_exists', confirmDatasetExists)
    .addNode('delete_dataset_obj', deleteDatasetObj)
    .addEdge(START, 'confirm_dataset_exists')
    .addEdge('confirm_dataset_exists', 'delete_dataset_obj')
    .addEdge('delete_dataset_obj', END)

  return g.compile()
}

// ==================== 读数据集子工作流 ====================

/**
 * 读数据集工作流（dispatcher read_datasets 动作调用）
 * 单节点，调 get_datasets，结果写入 state.datasets
 * 参数：taskParams.datasourceName / taskParams.name（可选过滤）
 */
export function readDatasetsGraph(): CompiledReportGraph {
  const readNode = createToolCallNode({
    nodeId: 'read_datasets',
    toolName: 'get_datasets',
    args: (state) => {
      const p = state.taskParams ?? {}
      const args: Record<string, any> = {}
      if (p.datasourceName) args.datasourceName = p.datasourceName
      if (p.name) args.datasetName = p.name
      return args
    },
    resultKey: 'datasets'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_datasets', readNode)
    .addEdge(START, 'read_datasets')
    .addEdge('read_datasets', END)

  return g.compile()
}
