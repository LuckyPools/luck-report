/**
 * 单元格相关子工作流（LangGraph 版本）
 * - modifyCellGraph：read → check → check_and_apply_row_col → plan_cell_structure → write_cells_batch(循环) → END
 * - readCellsGraph：单节点调 read_cells 工具，读取单元格数据
 *
 * 按行分批策略：
 * 创建报表时单元格数量多、样式各异，一次性 write_cells 容易出错。
 * 改为：先由 LLM 规划行级骨架（plan_cell_structure），再按行循环写入（write_cells_batch），
 * 每次只让 LLM 生成一行单元格的完整定义，降低单次输出复杂度。
 * 简单修改场景（单元格数≤4 或无分批计划）走原单次写入路径。
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
import { runToolWithEvent } from '../utils.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'

/** 分批计划中的单个批次 */
interface CellBatchItem {
  row: number
  band: string | null
  cells: Array<{ col: number; valueType: string; [k: string]: any }>
  styleHint: string
  contextNote: string
}

/** 分批计划结构 */
interface CellBatchPlan {
  totalRows: number
  totalCols: number
  batches: CellBatchItem[]
}

/**
 * 判断是否需要按行分批写入
 * 条件：cellBatchPlan 有多个批次且包含 batches 数组
 */
function needBatchWrite(state: ReportState): boolean {
  const plan = state.cellBatchPlan
  return plan !== null
    && Array.isArray((plan as any).batches)
    && (plan as any).batches.length > 1
}

/**
 * 修改单元格工作流（LangGraph 版本，按行分批）
 *
 * 边映射（分批路径）：
 * - __start__ → read_cells 或 check_if_cells_match（已有数据时跳过读取）
 * - read_cells → check_if_cells_match
 * - check_if_cells_match → [条件边] → check_and_apply_row_col 或 END
 * - check_and_apply_row_col → plan_cell_structure
 * - plan_cell_structure → [条件边: 有分批计划?] → write_cells_batch 或 write_cells
 * - write_cells_batch → [条件边: 还有下一批?] → advance_batch → write_cells_batch 或 END
 * - write_cells → END
 *
 * @returns 编译后的可执行图
 */
export function modifyCellGraph(): CompiledReportGraph {
  // 节点1：读取单元格数据（LLM 节点，使用 resultKey='cellsData'）
  const readCells = createLLMDecideNode({
    nodeId: 'read_cells',
    allowedTools: ['read_cells'],
    requiredToolResults: ['read_cells'],
    maxIterations: 2,
    resultKey: 'cellsData',
    description:
      '从 taskParams.cellAddresses（数组）或 cellAddress（单值）读取坐标，一次 read_cells 取全部。\n' +
      'A=1/B=2/.../Z=26/AA=27（1-based），A1→{row:1,col:1}。\n' +
      '读到后立即结束，cellsData 会进入 check_if_cells_match 的 context。'
  })

  // 节点2：检查当前单元格数据是否已符合需求
  const checkIfCellsMatch = buildCheckIfNeedModifyNode({
    nodeId: 'check_if_cells_match',
    dataKey: 'cellsData',
    skipKey: 'skipCellModify',
    dataDescription: '单元格数据格式为 {"row,col": {value, type, ...}}，row和col从1开始'
  })

  // 节点3：补齐行列（解析 cellsData 目标坐标，差值时调 insert_row/insert_col）
  const checkAndApplyRowCol = withInput(async (state: ReportState, _config, runtime) => {
    const nodeId = 'check_and_apply_row_col'
    const cellsData = state.cellsData
    if (!cellsData || !runtime) return {} as ReportStateUpdate

    let targetRow = 0
    let targetCol = 0
    for (const key of Object.keys(cellsData)) {
      const [r, c] = key.split(',').map(n => parseInt(n, 10))
      if (Number.isFinite(r) && r > targetRow) targetRow = r
      if (Number.isFinite(c) && c > targetCol) targetCol = c
    }
    if (targetRow === 0 && targetCol === 0) return {} as ReportStateUpdate

    const rowsResult = await runtime.toolRegistry.executeTool('get_rows', {})
    const colsResult = await runtime.toolRegistry.executeTool('get_columns', {})
    const currentRows = rowsResult && typeof rowsResult === 'object' ? Object.keys(rowsResult).length : 0
    const currentCols = colsResult && typeof colsResult === 'object' ? Object.keys(colsResult).length : 0

    if (currentRows < targetRow) {
      await runToolWithEvent(runtime, nodeId, 'insert_row', { position: currentRows, number: targetRow - currentRows })
    }
    if (currentCols < targetCol) {
      await runToolWithEvent(runtime, nodeId, 'insert_col', { position: currentCols, number: targetCol - currentCols })
    }

    return { cellsData } as ReportStateUpdate
  }, { nodeName: 'check_and_apply_row_col' })

  // 节点4：规划行级分批结构（轻量 LLM 节点）
  // 只输出每行要写哪些单元格、什么类型、什么样式，不生成完整单元格定义
  const planCellStructure = createLLMDecideNode({
    nodeId: 'plan_cell_structure',
    allowedTools: ['plan_cell_batches'],
    requiredToolResults: ['plan_cell_batches'],
    maxIterations: 2,
    resultKey: 'cellBatchPlan',
    description:
      '根据用户需求和知识库中的报表规范，规划单元格的行级分批写入结构。\n' +
      '只输出每行的骨架信息（行号、band、单元格类型、样式提示），不生成完整单元格定义。\n' +
      '必须调用 plan_cell_batches 工具，参数格式如下：\n' +
      '{\n' +
      '  "totalRows": 数字,\n' +
      '  "totalCols": 数字,\n' +
      '  "batches": [\n' +
      '    {\n' +
      '      "row": 行号(1-based),\n' +
      '      "band": "title"|"headerrepeat"|"footerrepeat"|"summary"|null,\n' +
      '      "cells": [\n' +
      '        { "col": 列号(1-based), "valueType": "simple"|"dataset"|"expression", "value":"显示值"(simple时),\n' +
      '          "datasetName":"数据集名"(dataset时), "property":"字段名"(dataset时), "aggregate":"group"|"select"|...(dataset时),\n' +
      '          "expression":"表达式"(expression时), "cellName":"单元格名"(分组列必须设), "leftParent":"左父单元格名" },\n' +
      '        ...\n' +
      '      ],\n' +
      '      "styleHint": "该行的样式描述，如：标题行跨列合并+居中加粗14号字",\n' +
      '      "contextNote": "该行与其他行的关联说明，如：dept_cell是左父单元格"\n' +
      '    },\n' +
      '    ...\n' +
      '  ]\n' +
      '}\n\n' +
      '【关键规则】\n' +
      '1. 标题行(batch.band="title")：通常只有1个单元格，跨列合并(colSpan=总列数-1)，styleHint写"标题行：跨列合并+居中加粗+14号字+forecolor:0,0,0"\n' +
      '2. 表头行(batch.band="headerrepeat")：每列一个simple类型单元格，styleHint写"表头行：深底浅字+加粗+边框，forecolor=255,255,255 bgcolor=64,81,150"\n' +
      '3. 数据行(batch.band=null)：绑定dataset的单元格，分组列必须设cellName，其他列设leftParent引用分组列的cellName，expand必须为Down，styleHint写"数据行：expand:Down，topParentCellName=root"\n' +
      '4. 合计行(batch.band="summary")：用expression类型=SUM()，styleHint写"合计行：expression类型，加粗"\n' +
      '5. 每行是一个batch，不要把多行合并为一个batch\n' +
      '6. 参照 [Agent知识库] 中已加载的报表制作规范进行规划'
  })

  // 节点5：分批写入单元格（LLM 节点，循环调用，每批处理一行）
  const writeCellsBatch = createLLMDecideNode({
    nodeId: 'write_cells_batch',
    allowedTools: ['write_cells', 'get_cell_template', 'load_report_doc'],
    requiredToolResults: ['write_cells'],
    maxIterations: 3,
    description: (state: ReportState) => {
      const plan = state.cellBatchPlan as CellBatchPlan | null
      const idx = state.cellBatchIndex ?? 0
      if (!plan || idx >= plan.batches.length) {
        return '无分批计划，请直接调用 write_cells 写入单元格。'
      }
      const batch = plan.batches[idx]
      const batchNum = idx + 1
      const totalBatches = plan.batches.length
      const cellDesc = batch.cells.map(c => {
        let desc = `列${c.col}(${c.valueType})`
        if (c.valueType === 'simple' && c.value) desc += ` 值="${c.value}"`
        if (c.valueType === 'dataset') desc += ` ${c.datasetName}.${c.property}(${c.aggregate})`
        if (c.valueType === 'expression') desc += ` ${c.expression}`
        if (c.cellName) desc += ` cellName=${c.cellName}`
        if (c.leftParent) desc += ` leftParent=${c.leftParent}`
        return desc
      }).join(', ')

      let desc =
        `【分批写入 ${batchNum}/${totalBatches}】当前写入第${batch.row}行(band=${batch.band ?? '数据行'})\n` +
        `单元格：${cellDesc}\n` +
        `样式提示：${batch.styleHint}\n`
      if (batch.contextNote) {
        desc += `上下文备注：${batch.contextNote}\n`
      }
      // 列出已完成的 cellName，让 LLM 能正确引用
      if (idx > 0) {
        const prevCellNames: string[] = []
        for (let i = 0; i < idx; i++) {
          for (const c of plan.batches[i].cells) {
            if (c.cellName) prevCellNames.push(`${c.cellName}(第${plan.batches[i].row}行列${c.col})`)
          }
        }
        if (prevCellNames.length > 0) {
          desc += `已创建的cellName（可直接引用）：${prevCellNames.join(', ')}\n`
        }
      }
      desc +=
        '\n只写当前行的单元格，不要写其他行。' +
        '索引：get_cell_template 用 0-based，write_cells 的 key "row,col" 用 1-based。\n' +
        '参照 [Agent知识库] 中已加载的报表制作规范，严格按规范配置样式和属性。'
      return desc
    }
  })

  // 节点6：推进批次索引（代码节点）
  const advanceBatch = withInput(async (state: ReportState, _config, _runtime) => {
    const idx = state.cellBatchIndex ?? 0
    return { cellBatchIndex: idx + 1 } as ReportStateUpdate
  }, { nodeName: 'advance_batch' })

  // 节点7：单次写入单元格（兜底路径，无分批时使用）
  const writeCellsSingle = createLLMDecideNode({
    nodeId: 'write_cells',
    allowedTools: ['write_cells', 'get_cell_template', 'load_report_doc'],
    requiredToolResults: ['write_cells'],
    maxIterations: 6,
    description:
      'cellsData 已在 context 中。taskParams.cellAddresses 列出待写入的 cell，合并为一个 cells 对象、一次 write_cells 完成。\n' +
      '索引：get_cell_template 用 0-based，write_cells 的 key "row,col" 用 1-based（C4→"4,3"）。\n' +
      '失败重试同一次 write_cells，不要拆成多次。\n' +
      '当 userMessage 涉及"制作/创建报表"时，参考 [Agent知识库] 中已加载的报表制作规范，严格按规范配置：标题行跨列合并（colSpan）+居中加粗+大字号、表头行深底浅字+加粗+边框、数据行绑定 dataset 类型并设 expand:Down、所有单元格加边框。不要使用简陋无样式的裸单元格。'
  })

  // ==================== 构建图 ====================
  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_cells', readCells)
    .addNode('check_if_cells_match', checkIfCellsMatch)
    .addNode('check_and_apply_row_col', checkAndApplyRowCol)
    .addNode('plan_cell_structure', planCellStructure)
    .addNode('write_cells_batch', writeCellsBatch)
    .addNode('advance_batch', advanceBatch)
    .addNode('write_cells', writeCellsSingle)

  // __start__ → read_cells 或直接 check_if_cells_match（已有数据时跳过读取）
  g.addConditionalEdges(START, (state: ReportState) => {
    const cellsData = state.cellsData
    if (cellsData && typeof cellsData === 'object' && Object.keys(cellsData).length > 0) {
      return 'check_if_cells_match'
    }
    return 'read_cells'
  }, {
    read_cells: 'read_cells',
    check_if_cells_match: 'check_if_cells_match'
  })

  g.addEdge('read_cells', 'check_if_cells_match')

  // check_if_cells_match → END 或 check_and_apply_row_col
  g.addConditionalEdges('check_if_cells_match', (state: ReportState) => {
    if (state.skipCellModify === true) {
      console.log('[modifyCellGraph] 单元格数据已符合需求，跳过修改操作')
      return 'END'
    }
    return 'check_and_apply_row_col'
  }, {
    END: END,
    check_and_apply_row_col: 'check_and_apply_row_col'
  })

  g.addEdge('check_and_apply_row_col', 'plan_cell_structure')

  // plan_cell_structure → 分批写入 或 单次写入
  g.addConditionalEdges('plan_cell_structure', (state: ReportState) => {
    if (needBatchWrite(state)) {
      console.log('[modifyCellGraph] 启用按行分批写入，共', (state.cellBatchPlan as CellBatchPlan).batches.length, '个批次')
      return 'write_cells_batch'
    }
    console.log('[modifyCellGraph] 无分批计划或仅1个批次，走单次写入路径')
    return 'write_cells'
  }, {
    write_cells_batch: 'write_cells_batch',
    write_cells: 'write_cells'
  })

  // write_cells_batch → 继续循环 或 END
  g.addConditionalEdges('write_cells_batch', (state: ReportState) => {
    const plan = state.cellBatchPlan as CellBatchPlan | null
    const idx = state.cellBatchIndex ?? 0
    if (plan && idx + 1 < plan.batches.length) {
      return 'advance_batch'
    }
    console.log('[modifyCellGraph] 分批写入完成，共', plan?.batches.length, '个批次')
    return 'END'
  }, {
    advance_batch: 'advance_batch',
    END: END
  })

  g.addEdge('advance_batch', 'write_cells_batch')
  g.addEdge('write_cells', END)

  return g.compile()
}

/**
 * 单元格地址 → 行列坐标
 * 支持 A1 / B2 / AA10 等 1-based 坐标，非法地址返回 null
 */
export function cellAddressToPosition(addr: string): { row: number; col: number } | null {
  if (!addr) return null
  const m = /^([A-Z]+)(\d+)$/i.exec(addr.trim())
  if (!m) return null
  const colLetters = m[1].toUpperCase()
  let col = 0
  for (let i = 0; i < colLetters.length; i++) {
    col = col * 26 + (colLetters.charCodeAt(i) - 64)
  }
  return { row: Number(m[2]), col }
}

// ==================== 读单元格子工作流 ====================

/**
 * 读单元格工作流（dispatcher read_cells 动作调用）
 */
export function readCellsGraph(): CompiledReportGraph {
  const readNode = createToolCallNode({
    nodeId: 'read_cells',
    toolName: 'read_cells',
    args: (state) => {
      const p = state.taskParams ?? {}
      if (Array.isArray(p.cellPositionArray) && p.cellPositionArray.length > 0) {
        return { cellPositionArray: p.cellPositionArray }
      }
      return {}
    },
    resultKey: 'cellsData'
  })

  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('read_cells', readNode)
    .addEdge(START, 'read_cells')
    .addEdge('read_cells', END)

  return g.compile()
}
