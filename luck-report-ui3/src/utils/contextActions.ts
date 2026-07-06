/**
 * Context 操作方法集合
 *
 * 架构说明：
 * - 所有操作方法通过 Pinia store（useReportStore）直接调用
 * - 保持了对 context 数据的集中管理
 * - 新增方法统一使用 ({ ... }) 解构对象参数格式，便于 iframe 消息传递调用
 *
 * 使用示例：
 * import { addCell, removeCell } from '@/utils/contextActions';
 *
 * // 在组件或函数中调用
 * addCell(cell);
 * removeCell(cell);
 */

import { useReportStore } from '@/store/modules/report';
import TableManager from '@/views/report/designer/edit-table/manager';
import type { ReportCell, ReportContext, ReportDatasource, ReportDataset, ReportSearchForm, ReportPaperLike, ReportRowDef, ReportColumnDef } from '@/types/report-def'

/**
 * 工具执行结果枚举
 * 规范所有写操作工具的返回值类型
 */
export const ToolResult = {
  /** 执行成功 */
  SUCCESS: 1,
  /** 执行失败 */
  ERROR: 0
} as const

/** 工具结果类型 */
export type ToolResultType = typeof ToolResult[keyof typeof ToolResult]

/**
 * 惰性获取 report store。
 * 使用闭包形式调用 useReportStore()，避免在模块加载阶段（Pinia 未激活时）抛错。
 */
const useReport = () => useReportStore()

/**
 * 获取 context
 * @returns 当前 report 模块的 context
 */
export function getContext(): ReportContext | null {
  return useReport().getContext;
}

/**
 * 添加单元格
 * @param cell 单元格定义
 */
export function addCell(cell: ReportCell): void {
  useReport().contextAddCell(cell);
}

/**
 * 移除单元格
 * @param cell 单元格
 */
export function removeCell(cell: ReportCell): void {
  useReport().contextRemoveCell(cell);
}

/**
 * 设置单元格（按行列号）
 * @param rowIndex 行索引（从 1 开始）
 * @param colIndex 列索引（从 1 开始）
 * @param cell 单元格定义
 */
export function setCell(rowIndex: number, colIndex: number, cell: ReportCell): void {
  rowIndex++;
  colIndex++;
  useReport().contextSetCell({ rowIndex, colIndex, cell });
}

/**
 * 删除单元格（按行列号）
 * @param rowNumber 行号
 * @param columnNumber 列号
 */
export function deleteCell(rowNumber: number, columnNumber: number): void {
  useReport().contextDeleteCell({ rowNumber, columnNumber });
}

/**
 * 获取单元格
 * @param rowIndex 行索引（从 1 开始）
 * @param colIndex 列索引（从 1 开始）
 * @returns 单元格或 null
 */
export function getCell(rowIndex: number, colIndex: number): ReportCell | null {
  const context = getContext();
  if (!context || !context.cellsMap) {
    return null;
  }
  const key = `${rowIndex + 1},${colIndex + 1}`;
  return (context.cellsMap.get(key) as ReportCell) || null;
}

/**
 * 获取 cellsMap
 * @returns 单元格映射表或 null
 */
export function getCellsMap(): Map<string, ReportCell> | null {
  const context = getContext();
  return context ? context.cellsMap : null;
}

/**
 * 添加行头
 * @param row 行号
 * @param band 带类型（header, footer, detail 等）
 */
export function addRowHeader(row: number, band: string): void {
  useReport().contextAddRowHeader({ row, band });
}

/**
 * 调整插入行头
 * @param row 行号
 */
export function adjustInsertRowHeaders(row: number): void {
  useReport().contextAdjustInsertRowHeaders({ row });
}

/**
 * 调整删除行头
 * @param row 行号
 */
export function adjustDelRowHeaders(row: number): void {
  useReport().contextAdjustDelRowHeaders({ row });
}

/**
 * 获取单元格名称
 * @param rowIndex 行索引（从 0 开始，可为 null）
 * @param colIndex 列索引（从 0 开始）
 * @returns 单元格名称（字母+数字）
 */
export function getCellName(rowIndex: number | null, colIndex: number): string {
  const context = getContext();
  if (!context || !(context as any).LETTERS) {
    return '';
  }
  if (rowIndex != null) {
    return (context as any).LETTERS[colIndex] + (rowIndex + 1);
  } else {
    return (context as any).LETTERS[colIndex];
  }
}

/** 选区描述，与 handsontable getSelected 保持一致：[startRow, startCol, endRow, endCol] */
type SelectedRange = [number, number, number, number] | undefined | null

/**
 * 获取选中的单元格
 * @returns 选区内的单元格数组
 */
export function getSelectedCells(): ReportCell[] | null {
  const hot: any = TableManager.get();
  if (!hot) {
    return null;
  }

  const selected: SelectedRange = hot.getSelected();
  if (!selected) {
    return null;
  }

  const startRow = selected[0];
  const startCol = selected[1];
  const endRow = selected[2];
  const endCol = selected[3];

  const cells: ReportCell[] = [];
  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cell: ReportCell = hot.getCell(i, j, true);
      const exist = cells.indexOf(cell);
      if (exist === -1) {
        cells.push(cell);
      }
    }
  }
  return cells;
}

/**
 * 批量执行 context 操作
 * @param operationFn 操作函数，接收 context 作为参数
 *
 * 示例：
 * batchExecute((context) => {
 *   context.cellsMap.set('1,1', cell1);
 *   context.cellsMap.set('1,2', cell2);
 * });
 */
export function batchExecute(operationFn: (context: ReportContext) => void): void {
  useReport().contextBatchExecute(operationFn);
}

/**
 * 设置 context（仅在初始化时使用）
 * @param context Context 实例
 */
export function setContext(context: ReportContext): void {
  useReport().setContext(context);
}

/**
 * 更新 context.reportDef
 * @param reportDef 报表定义对象
 */
export function updateReportDef(reportDef: any): void {
  useReport().contextUpdateReportDef(reportDef);
}

/**
 * 更新 context 的任意属性
 * @param property 属性名
 * @param value 属性值
 */
export function updateProperty(property: string, value: any): void {
  useReport().contextUpdateProperty({ property, value });
}

// ============ Agent 单元格操作 ============

/** writeCell 入参 */
export interface WriteCellParams {
  /** 单元格行坐标，从0开始 */
  rowIndex: number
  /** 单元格列坐标，从0开始 */
  colIndex: number
  /** 要设置的单元格定义 */
  cell: ReportCell
}

/**
 * 设置指定坐标的单元格值
 * 执行后会自动触发编辑器组件更新和表格显示刷新
 *
 * @param params 参数对象
 * @return ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function writeCell({ rowIndex, colIndex, cell }: WriteCellParams): ToolResultType {
  try {
    // 1. 更新 cellsMap 数据
    setCell(rowIndex, colIndex, cell);

    // 2. 触发编辑器组件更新（通过 isCellUpdate 状态变化通知监听组件）
    useReport().triggerCellUpdate();

    // 3. 更新 Handsontable 表格显示
    const hot: any = TableManager.get();
    if (hot) {
      // 获取单元格显示值：优先取 value.value，否则为空字符串
      const displayValue = (cell as any)?.value?.value ?? '';
      hot.setDataAtCell(rowIndex, colIndex, displayValue);
      hot.render();
    }
    return ToolResult.SUCCESS;
  } catch (e) {
    throw e;
  }
}

// ============ Datasource 操作 ============

/**
 * 获取数据源数据
 * @param params 参数对象
 * @param params.name 数据源名称，不提供则返回全部数据源
 * @returns 提供name返回单个数据源对象，不提供返回数据源数组
 */
export function getDatasources({ name }: { name?: string } = {}): ReportDatasource | ReportDatasource[] | null {
  return useReport().getDatasources(name);
}

/**
 * 设置全部数据源
 * @param params 参数对象
 * @param params.datasources 数据源数组
 * @return ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function setDatasources({ datasources }: { datasources: ReportDatasource[] }): ToolResultType {
  try {
    const report = useReport();
    report.contextSetDatasources(datasources);
    report.triggerDatasourcePanelUpdate();
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] setDatasources 执行失败:', e);
    return ToolResult.ERROR;
  }
}

/**
 * 添加数据源
 * @param params 参数对象
 * @param params.datasource 数据源定义对象
 * @return ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function addDatasource({ datasource }: { datasource: ReportDatasource }): ToolResultType {
  try {
    const report = useReport();
    report.contextAddDatasource(datasource);
    report.triggerDatasourcePanelUpdate();
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] addDatasource 执行失败:', e);
    return ToolResult.ERROR;
  }
}

/**
 * 更新数据源（按name匹配替换）
 * @param params 参数对象
 * @param params.name 目标数据源名称
 * @param params.datasource 新的数据源定义对象
 * @return ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function updateDatasource({ name, datasource }: { name: string; datasource: ReportDatasource }): ToolResultType {
  try {
    const report = useReport();
    report.contextUpdateDatasource({ name, datasource });
    report.triggerDatasourcePanelUpdate();
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] updateDatasource 执行失败:', e);
    return ToolResult.ERROR;
  }
}

/**
 * 删除数据源（按name匹配）
 * @param params 参数对象
 * @param params.name 要删除的数据源名称
 * @return ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function removeDatasource({ name }: { name: string }): ToolResultType {
  try {
    const report = useReport();
    report.contextRemoveDatasource(name);
    report.triggerDatasourcePanelUpdate();
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] removeDatasource 执行失败:', e);
    return ToolResult.ERROR;
  }
}

// ============ Dataset 操作 ============

/**
 * 获取数据集数据
 * @param params 参数对象
 * @param params.datasourceName 数据源名称，不提供则返回所有数据源下的数据集
 * @param params.datasetName 数据集名称，需配合datasourceName使用
 * @returns 返回数据集对象或数组
 */
export function getDatasets({ datasourceName, datasetName }: { datasourceName?: string; datasetName?: string } = {}): ReportDataset | ReportDataset[] | null {
  return useReport().getDatasets(datasourceName, datasetName);
}

/**
 * 添加数据集到指定数据源
 * @param params 参数对象
 * @param params.datasourceName 目标数据源名称
 * @param params.dataset 数据集定义对象
 * @return ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function addDataset({ datasourceName, dataset }: { datasourceName: string; dataset: ReportDataset }): ToolResultType {
  try {
    const report = useReport();
    report.contextAddDataset({ datasourceName, dataset });
    report.triggerDatasourcePanelUpdate();
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] addDataset 执行失败:', e);
    return ToolResult.ERROR;
  }
}

/**
 * 更新指定数据源下的数据集
 * @param params 参数对象
 * @param params.datasourceName 目标数据源名称
 * @param params.datasetName 目标数据集名称
 * @param params.dataset 新的数据集定义对象
 * @return ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function updateDataset({ datasourceName, datasetName, dataset }: { datasourceName: string; datasetName: string; dataset: ReportDataset }): ToolResultType {
  try {
    const report = useReport();
    report.contextUpdateDataset({ datasourceName, datasetName, dataset });
    report.triggerDatasourcePanelUpdate();
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] updateDataset 执行失败:', e);
    return ToolResult.ERROR;
  }
}

/**
 * 删除指定数据源下的数据集
 * @param params 参数对象
 * @param params.datasourceName 目标数据源名称
 * @param params.datasetName 要删除的数据集名称
 * @return ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function removeDataset({ datasourceName, datasetName }: { datasourceName: string; datasetName: string }): ToolResultType {
  try {
    const report = useReport();
    report.contextRemoveDataset({ datasourceName, datasetName });
    report.triggerDatasourcePanelUpdate();
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] removeDataset 执行失败:', e);
    return ToolResult.ERROR;
  }
}

// ============ SearchForm 操作 ============

/**
 * 获取表单设计数据
 * @returns 表单设计对象
 */
export function getSearchForm(): ReportSearchForm | null {
  return useReport().getSearchForm;
}

/**
 * 设置表单设计数据（整体替换）
 * @param params 参数对象
 * @param params.searchForm 表单设计对象
 * @return ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function setSearchForm({ searchForm }: { searchForm: ReportSearchForm }): ToolResultType {
  try {
    useReport().contextSetSearchForm(searchForm);
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] setSearchForm 执行失败:', e);
    return ToolResult.ERROR;
  }
}

// ============ Paper 操作 ============

/**
 * 获取页面配置数据
 * @returns 页面配置对象
 */
export function getPaperConfig(): ReportPaperLike | null {
  return useReport().getPaperConfig;
}

/**
 * 更新页面配置（合并更新）
 * @param params 参数对象
 * @param params.paper 要合并的页面配置属性
 * @return ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function updatePaper({ paper }: { paper: ReportPaperLike }): ToolResultType {
  try {
    useReport().contextUpdatePaper(paper);
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] updatePaper 执行失败:', e);
    return ToolResult.ERROR;
  }
}

// ============ Header 操作 ============

/**
 * 获取页眉配置数据
 * @returns 页眉配置对象
 */
export function getHeaderConfig(): ReportPaperLike | null {
  return useReport().getHeaderConfig;
}

/**
 * 更新页眉配置（合并更新）
 * @param params 参数对象
 * @param params.header 要合并的页眉配置属性
 * @return ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function updateHeader({ header }: { header: ReportPaperLike }): ToolResultType {
  try {
    useReport().contextUpdateHeader(header);
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] updateHeader 执行失败:', e);
    return ToolResult.ERROR;
  }
}

// ============ Footer 操作 ============

/**
 * 获取页脚配置数据
 * @returns 页脚配置对象
 */
export function getFooterConfig(): ReportPaperLike | null {
  return useReport().getFooterConfig;
}

/**
 * 更新页脚配置（合并更新）
 * @param params 参数对象
 * @param params.footer 要合并的页脚配置属性
 * @return ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function updateFooter({ footer }: { footer: ReportPaperLike }): ToolResultType {
  try {
    useReport().contextUpdateFooter(footer);
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] updateFooter 执行失败:', e);
    return ToolResult.ERROR;
  }
}

// ============ Row 操作 ============

/**
 * 获取表格指定行数据
 * 接收行号数组，按需返回 { 行号: 行定义 } 格式的对象
 * 内部存储为数组，此处做格式转换
 *
 * @param params 参数对象
 * @param params.rowNumbers 行号数组（从1开始），不传则返回全部行的键值对
 * @returns 以行号（字符串）为 key、行定义为 value 的对象
 */
export function getRows({ rowNumbers }: { rowNumbers?: number[] } = {}): Record<string, ReportRowDef> {
  const allRows: ReportRowDef[] = useReport().getRows();
  const result: Record<string, ReportRowDef> = {};
  if (Array.isArray(rowNumbers) && rowNumbers.length > 0) {
    for (const rowNumber of rowNumbers) {
      const row = allRows.find(r => r.rowNumber === rowNumber);
      if (row) {
        result[String(rowNumber)] = row;
      }
    }
    return result;
  }
  // 不传 rowNumbers 时返回全部行（以行号为 key）
  for (const row of allRows) {
    result[String(row.rowNumber)] = row;
  }
  return result;
}

/**
 * 批量设置行数据
 * 接收 { 行号: 行定义 } 格式的对象，整体合并更新到行数据列表
 * 内部存储仍为数组，此处将对象转换为数组格式后分发
 *
 * @param params 参数对象
 * @param params.rows 以行号（字符串或数字）为 key 的行定义对象集合
 * @return ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function setRows({ rows }: { rows: Record<string, ReportRowDef> }): ToolResultType {
  try {
    // 1. 获取当前所有行（数组形式）
    const currentRows: ReportRowDef[] = useReport().getRows();
    // 2. 将 keyed 对象转换为数组
    const incomingRows: ReportRowDef[] = [];
    for (const key of Object.keys(rows || {})) {
      const rowNumber = parseInt(key, 10);
      if (isNaN(rowNumber) || rowNumber < 1) {
        console.error(`[contextActions] setRows: 无效的行号 "${key}"`);
        return ToolResult.ERROR;
      }
      incomingRows.push({ ...rows[key], rowNumber });
    }
    // 3. 合并：按行号去重，incomingRows 中的行覆盖 currentRows 中的行
    const mergedMap = new Map<number, ReportRowDef>();
    for (const r of currentRows) {
      mergedMap.set(r.rowNumber, r);
    }
    for (const r of incomingRows) {
      mergedMap.set(r.rowNumber, r);
    }
    // 4. 按行号升序排序后下发
    const mergedRows = Array.from(mergedMap.values()).sort((a, b) => a.rowNumber - b.rowNumber);
    useReport().contextSetRows(mergedRows);
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] setRows 执行失败:', e);
    return ToolResult.ERROR;
  }
}

// ============ Column 操作 ============

/**
 * 获取表格指定列数据
 * 接收列号数组，按需返回 { 列号: 列定义 } 格式的对象
 *
 * @param params 参数对象
 * @param params.columnNumbers 列号数组（从1开始），不传则返回全部列的键值对
 * @returns 以列号（字符串）为 key、列定义为 value 的对象
 */
export function getColumns({ columnNumbers }: { columnNumbers?: number[] } = {}): Record<string, ReportColumnDef> {
  const allColumns: ReportColumnDef[] = useReport().getColumns();
  const result: Record<string, ReportColumnDef> = {};
  if (Array.isArray(columnNumbers) && columnNumbers.length > 0) {
    for (const columnNumber of columnNumbers) {
      const column = allColumns.find(c => c.columnNumber === columnNumber);
      if (column) {
        result[String(columnNumber)] = column;
      }
    }
    return result;
  }
  for (const column of allColumns) {
    result[String(column.columnNumber)] = column;
  }
  return result;
}

/**
 * 批量设置列数据
 * 接收 { 列号: 列定义 } 格式的对象，整体合并更新到列数据列表
 *
 * @param params 参数对象
 * @param params.columns 以列号（字符串或数字）为 key 的列定义对象集合
 * @return ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function setColumns({ columns }: { columns: Record<string, ReportColumnDef> }): ToolResultType {
  try {
    // 1. 获取当前所有列（数组形式）
    const currentColumns: ReportColumnDef[] = useReport().getColumns();
    // 2. 将 keyed 对象转换为数组
    const incomingColumns: ReportColumnDef[] = [];
    for (const key of Object.keys(columns || {})) {
      const columnNumber = parseInt(key, 10);
      if (isNaN(columnNumber) || columnNumber < 1) {
        console.error(`[contextActions] setColumns: 无效的列号 "${key}"`);
        return ToolResult.ERROR;
      }
      incomingColumns.push({ ...columns[key], columnNumber });
    }
    // 3. 合并：按列号去重，incomingColumns 中的列覆盖 currentColumns 中的列
    const mergedMap = new Map<number, ReportColumnDef>();
    for (const c of currentColumns) {
      mergedMap.set(c.columnNumber, c);
    }
    for (const c of incomingColumns) {
      mergedMap.set(c.columnNumber, c);
    }
    // 4. 按列号升序排序后下发
    const mergedColumns = Array.from(mergedMap.values()).sort((a, b) => a.columnNumber - b.columnNumber);
    useReport().contextSetColumns(mergedColumns);
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] setColumns 执行失败:', e);
    return ToolResult.ERROR;
  }
}

// 默认导出所有方法
export default {
  getContext,
  addCell,
  removeCell,
  setCell,
  deleteCell,
  getCell,
  getCellsMap,
  addRowHeader,
  adjustInsertRowHeaders,
  adjustDelRowHeaders,
  getCellName,
  getSelectedCells,
  batchExecute,
  setContext,
  updateReportDef,
  updateProperty,
  getDatasources,
  setDatasources,
  addDatasource,
  updateDatasource,
  removeDatasource,
  getDatasets,
  addDataset,
  updateDataset,
  removeDataset,
  getSearchForm,
  setSearchForm,
  getPaperConfig,
  updatePaper,
  getHeaderConfig,
  updateHeader,
  getFooterConfig,
  updateFooter,
  getRows,
  setRows,
  getColumns,
  setColumns
};
