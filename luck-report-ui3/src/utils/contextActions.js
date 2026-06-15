/**
 * Context 操作方法集合
 *
 * 架构说明：
 * - 所有操作方法都通过 Vuex dispatch 调用
 * - 保持了对 context 数据的集中管理
 * - 符合 Vuex 的最佳实践
 * - 新增方法统一使用 ({ ... }) 解构对象参数格式，便于 iframe 消息传递调用
 *
 * 使用示例：
 * import { addCell, removeCell } from '@/utils/contextActions.js';
 *
 * // 在组件或函数中调用
 * addCell(store, cell);
 * removeCell(store, cell);
 */

import store from '@/store';
import TableManager from '@/views/report/designer/edit-table/manager.js';
import { deepCopy } from '@/components/utils';
import { setDirty } from '@/utils/table';

/**
 * 工具执行结果枚举
 * 规范所有写操作工具的返回值类型
 */
const ToolResult = {
  /** 执行成功 */
  SUCCESS: 1,
  /** 执行失败 */
  ERROR: 0
};

/**
 * 获取 context
 */
export function getContext() {
  return store.getters['report/getContext'];
}

/**
 * 添加单元格
 * @param {Object} cell - 单元格定义
 */
export function addCell(cell) {
  store.dispatch('report/contextAddCell', cell);
}

/**
 * 移除单元格
 * @param {Object} cell - 单元格
 */
export function removeCell(cell) {
  store.dispatch('report/contextRemoveCell', cell);
}

/**
 * 设置单元格（按行列号）
 * @param {number} rowIndex - 行索引（从 1 开始）
 * @param {number} colIndex - 列索引（从 1 开始）
 * @param cell
 */
export function setCell(rowIndex, colIndex, cell) {
  rowIndex++;
  colIndex++;
  store.dispatch('report/contextSetCell', { rowIndex, colIndex, cell });
}

/**
 * 删除单元格（按行列号）
 * @param {number} rowNumber - 行号
 * @param {number} columnNumber - 列号
 */
export function deleteCell(rowNumber, columnNumber) {
  store.dispatch('report/contextDeleteCell', { rowNumber, columnNumber });
}

/**
 * 获取单元格
 * @param {number} rowIndex - 行索引（从 1 开始）
 * @param {number} colIndex - 列索引（从 1 开始）
 * @returns {Object|null}
 */
export function getCell(rowIndex, colIndex) {
  const context = getContext();
  if (!context || !context.cellsMap) {
    return null;
  }
  const key = `${rowIndex + 1},${colIndex + 1}`;
  return context.cellsMap.get(key) || null;
}

/**
 * 获取 cellsMap
 * @returns {Map|null}
 */
export function getCellsMap() {
  const context = getContext();
  return context ? context.cellsMap : null;
}

/**
 * 添加行头
 * @param {number} row - 行号
 * @param {string} band - 带类型（header, footer, detail 等）
 */
export function addRowHeader(row, band) {
  store.dispatch('report/contextAddRowHeader', { row, band });
}

/**
 * 调整插入行头
 * @param {number} row - 行号
 */
export function adjustInsertRowHeaders(row) {
  store.dispatch('report/contextAdjustInsertRowHeaders', { row });
}

/**
 * 调整删除行头
 * @param {number} row - 行号
 */
export function adjustDelRowHeaders(row) {
  store.dispatch('report/contextAdjustDelRowHeaders', { row });
}

/**
 * 获取单元格名称
 * @param {number} rowIndex - 行索引（从 0 开始，可为 null）
 * @param {number} colIndex - 列索引（从 0 开始）
 * @returns {string}
 */
export function getCellName(rowIndex, colIndex) {
  const context = getContext();
  if (!context || !context.LETTERS) {
    return '';
  }
  if (rowIndex != null) {
    return context.LETTERS[colIndex] + (rowIndex + 1);
  } else {
    return context.LETTERS[colIndex];
  }
}

/**
 * 获取选中的单元格
 * @returns {Array|null}
 */
export function getSelectedCells() {
  const hot = TableManager.get();
  if (!hot) {
    return null;
  }

  const selected = hot.getSelected();
  if (!selected) {
    return null;
  }

  const startRow = selected[0];
  const startCol = selected[1];
  const endRow = selected[2];
  const endCol = selected[3];

  const cells = [];
  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      const cell = hot.getCell(i, j, true);
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
 * @param {Function} operationFn - 操作函数，接收 context 作为参数
 *
 * 示例：
 * batchExecute((context) => {
 *   context.cellsMap.set('1,1', cell1);
 *   context.cellsMap.set('1,2', cell2);
 * });
 */
export function batchExecute(operationFn) {
  store.dispatch('report/contextBatchExecute', operationFn);
}

/**
 * 设置 context（仅在初始化时使用）
 * @param {Object} context - Context 实例
 */
export function setContext(context) {
  store.dispatch('report/setContext', context);
}

/**
 * 更新 context.reportDef
 * @param {Object} reportDef - 报表定义对象
 */
export function updateReportDef(reportDef) {
  store.dispatch('report/contextUpdateReportDef', reportDef);
}

/**
 * 更新 context 的任意属性
 * @param {string} property - 属性名
 * @param {any} value - 属性值
 */
export function updateProperty(property, value) {
  store.dispatch('report/contextUpdateProperty', { property, value });
}

// ============ Agent 单元格操作 ============

/**
 * 设置指定坐标的单元格值
 * 执行后会自动触发编辑器组件更新和表格显示刷新
 *
 * @param {Object} params - 参数对象
 * @param {number} params.rowIndex - 单元格行坐标，从0开始
 * @param {number} params.colIndex - 单元格列坐标，从0开始
 * @param {string} params.cell - 要设置的单元格定义
 * @return {number} ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function writeCell({ rowIndex, colIndex, cell }) {
  try {
    // 1. 更新 cellsMap 数据
    setCell(rowIndex, colIndex, cell);

    // 2. 触发编辑器组件更新（通过 isCellUpdate 状态变化通知监听组件）
    store.dispatch('report/triggerCellUpdate');

    // 3. 更新 Handsontable 表格显示
    const hot = TableManager.get();
    if (hot) {
      // 获取单元格显示值：优先取 value.value，否则为空字符串
      const displayValue = cell?.value?.value ?? '';
      hot.setDataAtCell(rowIndex, colIndex, displayValue);
      hot.render();
    }
  } catch (e) {
    throw e;
  }
}

// ============ Datasource 操作 ============

/**
 * 获取数据源数据
 * @param {Object} params - 参数对象
 * @param {string} [params.name] - 数据源名称，不提供则返回全部数据源
 * @returns {Object|Array|null} 提供name返回单个数据源对象，不提供返回数据源数组
 */
export function getDatasources({ name } = {}) {
  return store.getters['report/getDatasources'](name);
}

/**
 * 设置全部数据源
 * @param {Object} params - 参数对象
 * @param {Array} params.datasources - 数据源数组
 * @return {number} ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function setDatasources({ datasources }) {
  try {
    store.dispatch('report/contextSetDatasources', datasources);
    store.dispatch('report/triggerDatasourcePanelUpdate');
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] setDatasources 执行失败:', e);
    return ToolResult.ERROR;
  }
}

/**
 * 添加数据源
 * @param {Object} params - 参数对象
 * @param {Object} params.datasource - 数据源定义对象
 * @return {number} ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function addDatasource({ datasource }) {
  try {
    store.dispatch('report/contextAddDatasource', datasource);
    store.dispatch('report/triggerDatasourcePanelUpdate');
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] addDatasource 执行失败:', e);
    return ToolResult.ERROR;
  }
}

/**
 * 更新数据源（按name匹配替换）
 * @param {Object} params - 参数对象
 * @param {string} params.name - 目标数据源名称
 * @param {Object} params.datasource - 新的数据源定义对象
 * @return {number} ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function updateDatasource({ name, datasource }) {
  try {
    store.dispatch('report/contextUpdateDatasource', { name, datasource });
    store.dispatch('report/triggerDatasourcePanelUpdate');
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] updateDatasource 执行失败:', e);
    return ToolResult.ERROR;
  }
}

/**
 * 删除数据源（按name匹配）
 * @param {Object} params - 参数对象
 * @param {string} params.name - 要删除的数据源名称
 * @return {number} ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function removeDatasource({ name }) {
  try {
    store.dispatch('report/contextRemoveDatasource', name);
    store.dispatch('report/triggerDatasourcePanelUpdate');
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] removeDatasource 执行失败:', e);
    return ToolResult.ERROR;
  }
}

// ============ Dataset 操作 ============

/**
 * 获取数据集数据
 * @param {Object} params - 参数对象
 * @param {string} [params.datasourceName] - 数据源名称，不提供则返回所有数据源下的数据集
 * @param {string} [params.datasetName] - 数据集名称，需配合datasourceName使用
 * @returns {Object|Array|null} 返回数据集对象或数组
 */
export function getDatasets({ datasourceName, datasetName } = {}) {
  return store.getters['report/getDatasets'](datasourceName, datasetName);
}

/**
 * 添加数据集到指定数据源
 * @param {Object} params - 参数对象
 * @param {string} params.datasourceName - 目标数据源名称
 * @param {Object} params.dataset - 数据集定义对象
 * @return {number} ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function addDataset({ datasourceName, dataset }) {
  try {
    store.dispatch('report/contextAddDataset', { datasourceName, dataset });
    store.dispatch('report/triggerDatasourcePanelUpdate');
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] addDataset 执行失败:', e);
    return ToolResult.ERROR;
  }
}

/**
 * 更新指定数据源下的数据集
 * @param {Object} params - 参数对象
 * @param {string} params.datasourceName - 目标数据源名称
 * @param {string} params.datasetName - 目标数据集名称
 * @param {Object} params.dataset - 新的数据集定义对象
 * @return {number} ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function updateDataset({ datasourceName, datasetName, dataset }) {
  try {
    store.dispatch('report/contextUpdateDataset', { datasourceName, datasetName, dataset });
    store.dispatch('report/triggerDatasourcePanelUpdate');
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] updateDataset 执行失败:', e);
    return ToolResult.ERROR;
  }
}

/**
 * 删除指定数据源下的数据集
 * @param {Object} params - 参数对象
 * @param {string} params.datasourceName - 目标数据源名称
 * @param {string} params.datasetName - 要删除的数据集名称
 * @return {number} ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function removeDataset({ datasourceName, datasetName }) {
  try {
    store.dispatch('report/contextRemoveDataset', { datasourceName, datasetName });
    store.dispatch('report/triggerDatasourcePanelUpdate');
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] removeDataset 执行失败:', e);
    return ToolResult.ERROR;
  }
}

// ============ SearchForm 操作 ============

/**
 * 获取表单设计数据
 * @returns {Object|null} 表单设计对象
 */
export function getSearchForm() {
  return store.getters['report/getSearchForm'];
}

/**
 * 设置表单设计数据（整体替换）
 * @param {Object} params - 参数对象
 * @param {Object} params.searchForm - 表单设计对象
 * @return {number} ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function setSearchForm({ searchForm }) {
  try {
    store.dispatch('report/contextSetSearchForm', searchForm);
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] setSearchForm 执行失败:', e);
    return ToolResult.ERROR;
  }
}

// ============ Paper 操作 ============

/**
 * 获取页面配置数据
 * @returns {Object|null} 页面配置对象
 */
export function getPaperConfig() {
  return store.getters['report/getPaperConfig'];
}

/**
 * 更新页面配置（合并更新）
 * @param {Object} params - 参数对象
 * @param {Object} params.paper - 要合并的页面配置属性
 * @return {number} ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function updatePaper({ paper }) {
  try {
    store.dispatch('report/contextUpdatePaper', paper);
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] updatePaper 执行失败:', e);
    return ToolResult.ERROR;
  }
}

// ============ Header 操作 ============

/**
 * 获取页眉配置数据
 * @returns {Object|null} 页眉配置对象
 */
export function getHeaderConfig() {
  return store.getters['report/getHeaderConfig'];
}

/**
 * 更新页眉配置（合并更新）
 * @param {Object} params - 参数对象
 * @param {Object} params.header - 要合并的页眉配置属性
 * @return {number} ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function updateHeader({ header }) {
  try {
    store.dispatch('report/contextUpdateHeader', header);
    return ToolResult.SUCCESS;
  } catch (e) {
    console.error('[contextActions] updateHeader 执行失败:', e);
    return ToolResult.ERROR;
  }
}

// ============ Footer 操作 ============

/**
 * 获取页脚配置数据
 * @returns {Object|null} 页脚配置对象
 */
export function getFooterConfig() {
  return store.getters['report/getFooterConfig'];
}

/**
 * 更新页脚配置（合并更新）
 * @param {Object} params - 参数对象
 * @param {Object} params.footer - 要合并的页脚配置属性
 * @return {number} ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function updateFooter({ footer }) {
  try {
    store.dispatch('report/contextUpdateFooter', footer);
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
 * @param {Object} params - 参数对象
 * @param {number[]} [params.rowNumbers] - 行号数组（从1开始），不传则返回全部行的键值对
 * @returns {Object} 以行号（字符串）为 key、行定义为 value 的对象
 */
export function getRows({ rowNumbers } = {}) {
  const allRows = store.getters['report/getRows']();
  const result = {};
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
 * @param {Object} params - 参数对象
 * @param {Object} params.rows - 以行号（字符串或数字）为 key 的行定义对象集合
 * @return {number} ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function setRows({ rows }) {
  try {
    // 1. 获取当前所有行（数组形式）
    const currentRows = store.getters['report/getRows']();
    // 2. 将 keyed 对象转换为数组
    const incomingRows = [];
    for (const key of Object.keys(rows || {})) {
      const rowNumber = parseInt(key, 10);
      if (isNaN(rowNumber) || rowNumber < 1) {
        console.error(`[contextActions] setRows: 无效的行号 "${key}"`);
        return ToolResult.ERROR;
      }
      incomingRows.push({ ...rows[key], rowNumber });
    }
    // 3. 合并：按行号去重，incomingRows 中的行覆盖 currentRows 中的行
    const mergedMap = new Map();
    for (const r of currentRows) {
      mergedMap.set(r.rowNumber, r);
    }
    for (const r of incomingRows) {
      mergedMap.set(r.rowNumber, r);
    }
    // 4. 按行号升序排序后下发
    const mergedRows = Array.from(mergedMap.values()).sort((a, b) => a.rowNumber - b.rowNumber);
    store.dispatch('report/contextSetRows', mergedRows);
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
 * @param {Object} params - 参数对象
 * @param {number[]} [params.columnNumbers] - 列号数组（从1开始），不传则返回全部列的键值对
 * @returns {Object} 以列号（字符串）为 key、列定义为 value 的对象
 */
export function getColumns({ columnNumbers } = {}) {
  const allColumns = store.getters['report/getColumns']();
  const result = {};
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
 * @param {Object} params - 参数对象
 * @param {Object} params.columns - 以列号（字符串或数字）为 key 的列定义对象集合
 * @return {number} ToolResult.SUCCESS(1) 表示成功，ToolResult.ERROR(0) 表示失败
 */
export function setColumns({ columns }) {
  try {
    // 1. 获取当前所有列（数组形式）
    const currentColumns = store.getters['report/getColumns']();
    // 2. 将 keyed 对象转换为数组
    const incomingColumns = [];
    for (const key of Object.keys(columns || {})) {
      const columnNumber = parseInt(key, 10);
      if (isNaN(columnNumber) || columnNumber < 1) {
        console.error(`[contextActions] setColumns: 无效的列号 "${key}"`);
        return ToolResult.ERROR;
      }
      incomingColumns.push({ ...columns[key], columnNumber });
    }
    // 3. 合并：按列号去重，incomingColumns 中的列覆盖 currentColumns 中的列
    const mergedMap = new Map();
    for (const c of currentColumns) {
      mergedMap.set(c.columnNumber, c);
    }
    for (const c of incomingColumns) {
      mergedMap.set(c.columnNumber, c);
    }
    // 4. 按列号升序排序后下发
    const mergedColumns = Array.from(mergedMap.values()).sort((a, b) => a.columnNumber - b.columnNumber);
    store.dispatch('report/contextSetColumns', mergedColumns);
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
