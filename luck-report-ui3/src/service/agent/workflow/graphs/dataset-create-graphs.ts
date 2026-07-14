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
import { buildCheckIfNeedModifyNode } from '@/service/agent/workflow/nodes/check-node.ts'
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
import { logger } from '../logger.ts'

const log = logger('dataset-create-graphs')

/** 数据集操作模式：create 新建，update 修改 */
export type DatasetOpMode = 'create' | 'update'

/**
 * 加载现有数据集（update 模式前置节点）
 * 读取所有 datasets，匹配目标数据集名称，注入 dataset / targetDatasourceName
 *
 * 目标数据集名称来源优先级：
 * 1. state.taskParams.name / datasetName（planner 通过 plan_tasks 传入）
 * 2. state.intent?.targetDatasetName / datasetName（意图分析阶段传入）
 * 3. state.datasets 中的唯一匹配（仅一个数据集时自动选取）
 *
 * 同时会从上游 read_datasets 任务注入的 state.datasets 中尝试匹配，
 * 避免因 taskParams 中 datasourceName/datasetName 混淆导致匹配失败
 */
function buildLoadExistingDatasetNode() {
  return withInput(async (state: ReportState, _config, runtime) => {
    const stepId = 'load_existing_dataset'
    const allDatasets: any = await runToolWithEvent(runtime, stepId, 'get_datasets', {})

    // 从多个来源获取目标数据集名称
    const tp = state.taskParams ?? {}
    const targetName = tp.name || tp.datasetName
      || state.intent?.targetDatasetName || state.intent?.datasetName

    const dsList: any[] = Array.isArray(allDatasets)
      ? allDatasets
      : (Array.isArray(allDatasets?.datasets) ? allDatasets.datasets : [])

    if (!targetName && dsList.length !== 1) {
      return { errors: [`load_existing_dataset: 无法确定目标数据集名称（taskParams=${JSON.stringify(tp)}, intent无目标名称），且当前有 ${dsList.length} 个数据集无法自动选取`] } as ReportStateUpdate
    }

    // 优先按名称精确匹配
    let found: any = null
    if (targetName) {
      found = dsList.find((d: any) => d?.name === targetName || d?.dataset?.name === targetName)
    }

    // 精确匹配失败时，尝试从上游注入的 state.datasets 中查找正确的 datasourceName+datasetName 组合
    if (!found && targetName && Array.isArray(state.datasets)) {
      found = state.datasets.find((d: any) => {
        const dName = d?.name || d?.dataset?.name
        return dName === targetName
      })
      if (found) {
        log.info(`[load_existing_dataset] 通过 state.datasets 找到数据集: ${JSON.stringify({ name: found.name, datasourceName: found.datasourceName })}`)
      }
    }

    // 仍未找到且有目标名称：尝试宽松匹配
    // 两种场景：targetName 可能被误传为 datasourceName，或数据集名称含有前缀/后缀差异
    if (!found && targetName) {
      found = dsList.find((d: any) => {
        const dName = d?.name || d?.dataset?.name
        const dsName = d?.datasourceName || d?.datasource?.name
        // 1. targetName 实际是 datasourceName，反向匹配该数据源下的数据集
        if (dsName === targetName) return true
        // 2. 下划线/驼峰变体匹配（如 userInfo ↔ user_info）
        const snake = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
        if (dName && snake(dName) === snake(targetName)) return true
        return false
      })
      if (found) {
        log.info(`[load_existing_dataset] 通过宽松匹配找到数据集: targetName=${targetName}, matched=${JSON.stringify({ name: found.name, datasourceName: found.datasourceName })}`)
      }
    }

    // 无目标名称但只有一个数据集，自动选取
    if (!found && !targetName && dsList.length === 1) {
      found = dsList[0]
      log.info(`[load_existing_dataset] 只有一个数据集，自动选取: ${found?.name}`)
    }

    if (!found) {
      const availableNames = dsList.map((d: any) => `${d?.datasourceName || '?'}.${d?.name || '?'}`).join(', ')
      return { errors: [`load_existing_dataset: 未找到目标数据集 "${targetName || ''}"，当前共有 ${dsList.length} 个数据集: ${availableNames}`] } as ReportStateUpdate
    }

    const dsName = found.datasourceName || found.datasource?.name || found.datasource
    log.info(`[load_existing_dataset] 找到数据集: name=${found.name}, datasourceName=${dsName}`)
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
 * 边序：
 * - create模式：__start__ → prepare_schema → ... → write_dataset → confirm_dataset → __end__
 * - update模式：__start__ → load_existing_dataset → check_if_dataset_match → [条件边] → prepare_schema → ... → __end__
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

  // update 模式前置 load_existing_dataset 和 check_if_dataset_match
  let startEdges: string | { condition: (state: ReportState) => string; map: Record<string, string> } = 'prepare_schema'
  if (mode === 'update') {
    builder.addNode('load_existing_dataset', buildLoadExistingDatasetNode())
    
    // 检查节点：判断当前数据集配置是否已符合需求
    const checkIfDatasetMatch = buildCheckIfNeedModifyNode({
      nodeId: 'check_if_dataset_match',
      dataKey: 'dataset',
      skipKey: 'skipDatasetModify',
      dataDescription: '数据集配置包含：name, sql, datasourceName, fields, parameters等'
    })
    builder.addNode('check_if_dataset_match', checkIfDatasetMatch)
    
    builder.addEdge('load_existing_dataset', 'check_if_dataset_match')
    
    // 检查节点后的条件边：如果已符合需求则跳过修改，否则继续执行
    builder.addConditionalEdges('check_if_dataset_match', (state) => {
      if (state.skipDatasetModify === true) {
        log.info('[modifyDatasetGraph] 数据集配置已符合需求，跳过修改操作')
        return 'END'
      }
      return 'prepare_schema'
    }, {
      END: END,
      prepare_schema: 'prepare_schema'
    })
    
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
