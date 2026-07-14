/**
 * 表格创建工作流（create_table）
 *
 * 边映射：
 * - __start__ → [条件边：state.datasets 是否已有数据] → fetch_datasets / plan_table_structure
 * - fetch_datasets → plan_table_structure
 * - plan_table_structure → ensure_row_col
 * - ensure_row_col → write_band
 * - write_band → [条件边：还有下一 band？] → advance_band / validate_and_fix
 * - advance_band → write_band（循环）
 * - validate_and_fix → record_validate
 * - record_validate → [条件边：errors 非空且 rebuildCount<2] → clear_and_rebuild / END
 * - clear_and_rebuild → write_band
 *
 * 关键设计：
 * - 复用 planCellBatchesTool（不再新增 plan_table_structure 工具）
 * - 按 plan_cell_batches 的 band 字段聚类写入，顺序：title → headerrepeat → data → summary
 * - data band 匹配 plan_cell_batches 中 band=null 或 band='data' 的行；写入时通过 expand:Down 自动扩展
 * - clear_and_rebuild 上限 2 次（tableRebuildCount 字段），防止死循环
 * - validate_and_fix 失败经 record_validate 节点吸入 errors，供 summary 节点向用户提示
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
import { runToolWithEvent } from '../utils.ts'
import type { ReportState, ReportStateUpdate } from '../state.ts'

/** 固定 band 写入顺序（data 匹配 plan_cell_batches 中 band=null 或 band='data' 的数据行） */
const BAND_ORDER: readonly string[] = ['title', 'headerrepeat', 'data', 'summary']

/** 单次重建硬上限（防止 LLM 校验失败时无限重建） */
const MAX_REBUILD_COUNT = 2

/**
 * 从 cellBatchPlan 中筛出指定 band 类型的所有 batch
 * @param plan - cellBatchPlan 对象（含 batches 数组）
 * @param band - band 类型，'data' 表示 band=null 或 band='data'
 * @returns 该 band 下的所有 batch 数组
 */
function getBatchesForBand(plan: any, band: string): any[] {
  if (band === 'data') {
    return plan.batches.filter((b: any) => !b.band || b.band === 'data')
  }
  return plan.batches.filter((b: any) => b.band === band)
}

/**
 * 构建 band 描述文本（writeBand 节点使用）
 * @param band - 当前写入的 band 类型
 * @param batches - 该 band 下的所有 batch
 * @param prevCellNames - 之前 band 已创建的所有 cellName 列表
 * @returns 拼接好的描述字符串
 */
function buildBandDescription(
  band: string,
  batches: any[],
  prevCellNames: Array<{ cellName: string; row: number; col: number }>
): string {
  let desc = `【写入 band=${band}】共 ${batches.length} 行\n`
  batches.forEach((b) => {
    const cellsDesc = b.cells.map((c: any) => {
      let s = `列${c.col}(${c.valueType})`
      if (c.valueType === 'simple' && c.value) s += ` 值="${c.value}"`
      if (c.valueType === 'dataset') s += ` ${c.datasetName}.${c.property}(${c.aggregate ?? 'select'})`
      if (c.valueType === 'expression') s += ` ${c.expression}`
      if (c.cellName) s += ` cellName=${c.cellName}`
      if (c.leftParent) s += ` leftParent=${c.leftParent}`
      return s
    }).join(', ')
    desc += `  第${b.row}行: ${cellsDesc}\n样式: ${b.styleHint}\n`
  })
  if (prevCellNames.length > 0) {
    const list = prevCellNames.map(c => `${c.cellName}(行${c.row}列${c.col})`).join(', ')
    desc += `\n已创建 cellName（可引用）: ${list}\n`
  }
  return desc
}

/**
 * 构建防捏造约束条款
 * 仅在 band 含 dataset 类型单元格时返回约束文本
 * @param batches - 当前 band 的所有 batch
 * @returns 约束文本，无 dataset 时返回空串
 */
function buildAntiFabricationClause(batches: any[]): string {
  const hasDataset = batches.some((b: any) => b.cells.some((c: any) => c.valueType === 'dataset'))
  if (!hasDataset) return ''
  return '\n【强约束 — 防捏造】本 band 含 dataset 单元格：\n' +
    '1、若 [可用数据集清单] 已列出引用 datasetName 且包含目标 property，可直接使用；\n' +
    '2、若缺失，**必须**先调 get_datasets 拿到真实 datasetName/fields 后再 write_cells；\n' +
    '3、禁止凭空编造字段名（如 id/name/email 等）。\n'
}

/**
 * 按 band 类型给出样式约束
 * @param band - band 类型
 * @returns 样式约束文本
 */
function buildStyleConstraintByBandType(band: string): string {
  switch (band) {
    case 'title':
      return '\n【标题行约束】跨列合并（colSpan=总列数）+ 居中 + 加粗 + 大字号(14-16号)\n'
    case 'headerrepeat':
      return '\n【表头行约束】深底浅字 + 加粗 + 边框，字段名用 simple 类型\n'
    case 'data':
      return '\n【数据行约束】绑定 dataset 类型 + 设 expand:Down + 左父格 + 边框\n'
    case 'summary':
      return '\n【汇总行约束】使用 expression 类型表达式 + 加粗 + 边框。表达式语法参照 EXPRESSION 和 FUNCTION 文档 。\n'
    default:
      return ''
  }
}

/**
 * 收集已完成的 cellName（按 plan 顺序）
 * @param plan - cellBatchPlan 对象
 * @param upToBandIndex - 收集到第几个 band 之前
 * @returns cellName 列表（含所在行列）
 */
function collectPrevCellNames(plan: any, upToBandIndex: number): Array<{ cellName: string; row: number; col: number }> {
  const out: Array<{ cellName: string; row: number; col: number }> = []
  for (let i = 0; i <= upToBandIndex; i++) {
    const band = BAND_ORDER[i]
    if (!band) break
    const batches = getBatchesForBand(plan, band)
    for (const b of batches) {
      for (const c of b.cells) {
        if (c.cellName) out.push({ cellName: c.cellName, row: b.row, col: c.col })
      }
    }
  }
  return out
}

/**
 * 创建表格工作流
 *
 * 边序：
 *   START → fetch_datasets → plan_table_structure → ensure_row_col → write_band
 *   write_band ⇄ advance_band → validate_and_fix → record_validate → END / clear_and_rebuild
 *   clear_and_rebuild → write_band
 *
 * @returns 编译后的可执行图
 */
export function createTableGraph(): CompiledReportGraph {
  // 节点1：获取数据集（代码节点：直接调 get_datasets，结果写入 state.datasets 数组）
  // 关键决策点：用 createToolCallNode 而非 createLLMDecideNode + resultKey
  // 避免 LLM resultKey 累加器把数组包成 { get_datasets: [...] } 对象，导致 START 条件边 Array.isArray 永远为 false
  const fetchDatasets = createToolCallNode({
    nodeId: 'fetch_datasets',
    toolName: 'get_datasets',
    args: {},
    resultKey: 'datasets'
  })

  // 节点2：规划表格结构（复用 planCellBatchesTool，description 引导按 band 组织）
  const planTableStructure = createLLMDecideNode({
    nodeId: 'plan_table_structure',
    allowedTools: ['plan_cell_batches', 'get_datasets', 'load_report_doc'],
    requiredToolResults: ['plan_cell_batches'],
    maxIterations: 3,
    resultKey: 'cellBatchPlan',
    description:
      '根据用户需求和数据集字段，规划完整的表格行级结构。\n' +
      '必须调用 plan_cell_batches 工具，按以下顺序组织 batches：\n' +
      '  1) title  band：标题行（1 行，colSpan 合并全部列）\n' +
      '  2) headerrepeat band：表头行（深底浅字，simple 类型字段名）\n' +
      '  3) null / data band：数据行（band 设为 null，**只规划 1 行**，靠 expand:Down 自动扩展）\n' +
      '  4) summary band：汇总行（expression 类型公式）\n\n' +
      '【关键规则】\n' +
      '1、data band 只规划 1 行模板，禁止规划多行数据；\n' +
      '2、合并单元格只规划 1 个 cell，不要拆成多列；\n' +
      '3、禁止捏造数据，dataset 类型的 datasetName/property 必须从 [可用数据集清单] 中选取；\n' +
      '4、若 [可用数据集清单] 缺失或字段不全，必须先调 get_datasets 拿到真实字段后再规划；\n' +
      '5、totalRows = title 行数 + headerrepeat 行数 + 1（数据模板行）+ summary 行数；\n' +
      '6、totalCols = 最宽那一行的列数（合并后）。'
  })

  // 节点3：补齐行列（代码节点）
  const ensureRowCol = withInput(async (state: ReportState, _config, runtime) => {
    const nodeId = 'ensure_row_col'
    const plan = state.cellBatchPlan as any
    if (!plan || !runtime) return {} as ReportStateUpdate

    const targetRow = plan.totalRows ?? 0
    const targetCol = plan.totalCols ?? 0
    if (targetRow === 0 && targetCol === 0) return {} as ReportStateUpdate

    const rowsResult = await runtime.toolRegistry.executeTool('get_rows', {})
    const colsResult = await runtime.toolRegistry.executeTool('get_columns', {})
    const currentRows = rowsResult && typeof rowsResult === 'object' ? Object.keys(rowsResult).length : 0
    const currentCols = colsResult && typeof colsResult === 'object' ? Object.keys(colsResult).length : 0

    if (currentRows < targetRow) {
      await runToolWithEvent(runtime, nodeId, 'insert_row', {
        position: currentRows,
        number: targetRow - currentRows
      })
    }
    if (currentCols < targetCol) {
      await runToolWithEvent(runtime, nodeId, 'insert_col', {
        position: currentCols,
        number: targetCol - currentCols
      })
    }

    return {} as ReportStateUpdate
  }, { nodeName: 'ensure_row_col' })

  // 节点4：按 band 写入单元格（LLM 节点）
  const writeBand = createLLMDecideNode({
    nodeId: 'write_band',
    allowedTools: ['write_cells', 'get_cell_template', 'get_datasets', 'load_report_doc'],
    requiredToolResults: ['write_cells'],
    maxIterations: 6,
    description: (state: ReportState) => {
      const plan = state.cellBatchPlan as any
      const bandIdx = state.tableBandIndex ?? 0
      if (!plan) return '无表格结构规划，请直接调用 write_cells 写入单元格。'
      const band = BAND_ORDER[bandIdx]
      if (!band) return '所有 band 已写入完成，请进入校验阶段。'
      const batches = getBatchesForBand(plan, band)
      console.log(`[createTableGraph] write_band bandIdx=${bandIdx} band=${band} batches=${batches.length} plan.bands=[${plan.batches?.map((b: any) => b.band ?? 'null').join(',')}]`)
      if (batches.length === 0) {
        return `当前 band=${band} 无 batch，直接进入下一 band 即可。`
      }
      const prevCellNames = collectPrevCellNames(plan, bandIdx - 1)

      let desc = buildBandDescription(band, batches, prevCellNames)
      desc += buildAntiFabricationClause(batches)
      desc += buildStyleConstraintByBandType(band)
      desc +=
        '\n把当前 band 所有行的单元格合并为一个 cells 对象，一次 write_cells 完成。\n' +
        '索引：get_cell_template 用 0-based，write_cells 的 key "row,col" 用 1-based（C4→"4,3"）。\n' +
        '失败重试同一次 write_cells，不要拆成多次。\n' +
        '参照 [Agent知识库] 中已加载的报表制作规范，严格按规范配置样式和属性。'
      return desc
    }
  })

  // 节点5：推进 band 索引（代码节点）
  const advanceBand = withInput(async (state: ReportState) => {
    const idx = state.tableBandIndex ?? 0
    return { tableBandIndex: idx + 1 } as ReportStateUpdate
  }, { nodeName: 'advance_band' })

  // 节点6：校验并修复（LLM 节点）
  const validateAndFix = createLLMDecideNode({
    nodeId: 'validate_and_fix',
    allowedTools: ['read_cells', 'write_cells', 'get_cell_template', 'get_datasets'],
    requiredToolResultsAny: ['read_cells'],
    maxIterations: 3,
    resultKey: 'cellsData',
    description: (state: ReportState) => {
      const plan = state.cellBatchPlan as any
      const rebuildCount = state.tableRebuildCount ?? 0
      let desc =
        '校验报表整体布局，发现问题则调 write_cells 修复。\n' +
        '步骤：1) 调 read_cells 读取关键单元格（标题行、表头行、数据行、汇总行）；\n' +
        '     2) 与 plan_cell_batches 的规划对比，是否缺行/缺列/缺样式；\n' +
        '     3) 缺则调 write_cells 补写，调成功后结束本节点；\n' +
        '     4) 无法修复则不调任何工具，结束本节点（错误由 record_validate 节点记录）。\n'
      if (rebuildCount > 0) {
        desc += `\n【重建反馈】本表格已重建 ${rebuildCount} 次，校验时优先检查上轮失败点。\n`
      }
      if (plan) {
        desc += `\n当前表格结构：totalRows=${plan.totalRows}, totalCols=${plan.totalCols}, batches=${plan.batches?.length ?? 0} 行\n`
      }
      return desc
    }
  })

  // 节点7：记录校验结果（代码节点）
  // 关键决策点：把 validate_and_fix 节点的失败信号"吸入" errors 字段，
  // 供 summary 节点向用户提示，并触发 clear_and_rebuild 兜底重建
  const recordValidate = withInput(async (state: ReportState) => {
    const plan = state.cellBatchPlan as any
    if (!plan) return {} as ReportStateUpdate

    // 校验"写入完成度"：cellBatchPlan.batches 中规划的所有 row，
    // 若 state.cellsData 中没有任何 key（说明 validate_and_fix 没调 read_cells）→ 视为校验失败
    const cellsData = state.cellsData as Record<string, any> | null
    const hasReadResult = cellsData && typeof cellsData === 'object' && Object.keys(cellsData).length > 0
    if (!hasReadResult) {
      const msg = 'validate_and_fix 校验失败：未读取任何单元格数据，无法完成布局校验'
      console.warn(`[createTableGraph] ${msg}`)
      return {
        errors: [msg],
        tableRebuildCount: (state.tableRebuildCount ?? 0) + 1
      } as ReportStateUpdate
    }

    // 校验通过（LLM 调了 read_cells 完成检查），不写 errors
    return {} as ReportStateUpdate
  }, { nodeName: 'record_validate' })

  // 节点8：清空重建（代码节点，硬上限 2 次）
  // 关键决策点：行列都用"反向删全 + 重插"的对称模式，确保 targetRow/targetCol 与实际一致
  const clearAndRebuild = withInput(async (state: ReportState, _config, runtime) => {
    const nodeId = 'clear_and_rebuild'
    const plan = state.cellBatchPlan as any
    if (!plan || !runtime) return {} as ReportStateUpdate

    const targetRow = plan.totalRows ?? 0
    const targetCol = plan.totalCols ?? 0

    // 行方向：先反向删除，再按 targetRow 插入（不受当前行数多少影响）
    const rowsResult = await runtime.toolRegistry.executeTool('get_rows', {})
    const currentRows = rowsResult && typeof rowsResult === 'object' ? Object.keys(rowsResult).length : 0
    for (let r = currentRows; r >= 1; r--) {
      await runToolWithEvent(runtime, nodeId, 'delete_row', { position: r, number: 1 })
    }
    if (targetRow > 0) {
      await runToolWithEvent(runtime, nodeId, 'insert_row', {
        position: 0,
        number: targetRow
      })
    }

    // 列方向：与行对称，反向删除后按 targetCol 插入
    const colsResult = await runtime.toolRegistry.executeTool('get_columns', {})
    const currentCols = colsResult && typeof colsResult === 'object' ? Object.keys(colsResult).length : 0
    for (let c = currentCols; c >= 1; c--) {
      await runToolWithEvent(runtime, nodeId, 'delete_col', { position: c, number: 1 })
    }
    if (targetCol > 0) {
      await runToolWithEvent(runtime, nodeId, 'insert_col', {
        position: 0,
        number: targetCol
      })
    }

    console.log(`[createTableGraph] 重建完成, rebuildCount=${(state.tableRebuildCount ?? 0) + 1}/${MAX_REBUILD_COUNT}`)
    return { tableBandIndex: 0 } as ReportStateUpdate
  }, { nodeName: 'clear_and_rebuild' })

  // ==================== 构建图 ====================
  const g = new StateGraph(ReportStateAnnotation, WorkflowRuntimeAnnotation)
    .addNode('fetch_datasets', fetchDatasets)
    .addNode('plan_table_structure', planTableStructure)
    .addNode('ensure_row_col', ensureRowCol)
    .addNode('write_band', writeBand)
    .addNode('advance_band', advanceBand)
    .addNode('validate_and_fix', validateAndFix)
    .addNode('record_validate', recordValidate)
    .addNode('clear_and_rebuild', clearAndRebuild)

  // __start__ → fetch_datasets（state.datasets 已存在则跳过）→ plan_table_structure
  g.addConditionalEdges(START, (state: ReportState) => {
    const datasets = state.datasets
    if (Array.isArray(datasets) && datasets.length > 0) {
      console.log('[createTableGraph] state.datasets 已有数据，跳过 fetch_datasets')
      return 'plan_table_structure'
    }
    return 'fetch_datasets'
  }, {
    fetch_datasets: 'fetch_datasets',
    plan_table_structure: 'plan_table_structure'
  })

  g.addEdge('fetch_datasets', 'plan_table_structure')
  g.addEdge('plan_table_structure', 'ensure_row_col')
  g.addEdge('ensure_row_col', 'write_band')

  // write_band → [条件边：还有下一 band？] → advance_band / validate_and_fix
  g.addConditionalEdges('write_band', (state: ReportState) => {
    const bandIdx = state.tableBandIndex ?? 0
    if (bandIdx + 1 < BAND_ORDER.length) {
      return 'advance_band'
    }
    console.log('[createTableGraph] 所有 band 写入完成，进入校验')
    return 'validate_and_fix'
  }, {
    advance_band: 'advance_band',
    validate_and_fix: 'validate_and_fix'
  })

  g.addEdge('advance_band', 'write_band')
  g.addEdge('validate_and_fix', 'record_validate')

  // record_validate → [条件边：errors 非空且 rebuildCount<2] → clear_and_rebuild / END
  g.addConditionalEdges('record_validate', (state: ReportState) => {
    const errs = state.errors as string[] | undefined
    const rebuildCount = state.tableRebuildCount ?? 0
    const hasError = Array.isArray(errs) && errs.length > 0
    if (hasError && rebuildCount < MAX_REBUILD_COUNT) {
      console.log(`[createTableGraph] 校验失败，启动重建 (rebuildCount=${rebuildCount}/${MAX_REBUILD_COUNT})`)
      return 'clear_and_rebuild'
    }
    if (hasError) {
      console.warn(`[createTableGraph] 校验失败且已达重建上限 (rebuildCount=${rebuildCount})，结束`)
    }
    return 'END'
  }, {
    clear_and_rebuild: 'clear_and_rebuild',
    END: END
  })

  g.addEdge('clear_and_rebuild', 'write_band')

  return g.compile()
}
