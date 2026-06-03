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
 * 读取指定坐标的单元格数据
 * @param {Object} params - 参数对象
 * @param {number} params.rowIndex - 单元格行坐标，从0开始
 * @param {number} params.colIndex - 单元格列坐标，从0开始
 * @return {Object|null} 单元格定义对象，不存在时返回 null
 */
export function readCell({ rowIndex, colIndex }) {
  return getCell(rowIndex, colIndex);
}

/**
 * 设置指定坐标的单元格值
 * 执行后会自动触发编辑器组件更新和表格显示刷新
 *
 * @param {Object} params - 参数对象
 * @param {number} params.rowIndex - 单元格行坐标，从0开始
 * @param {number} params.colIndex - 单元格列坐标，从0开始
 * @param {string} params.cell - 要设置的单元格定义
 * @return {Object} 操作结果
 */
export function writeCell({ rowIndex, colIndex, cell }) {
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
 */
export function setDatasources({ datasources }) {
  store.dispatch('report/contextSetDatasources', datasources);
}

/**
 * 添加数据源
 * @param {Object} params - 参数对象
 * @param {Object} params.datasource - 数据源定义对象
 */
export function addDatasource({ datasource }) {
  store.dispatch('report/contextAddDatasource', datasource);
}

/**
 * 更新数据源（按name匹配替换）
 * @param {Object} params - 参数对象
 * @param {string} params.name - 目标数据源名称
 * @param {Object} params.datasource - 新的数据源定义对象
 */
export function updateDatasource({ name, datasource }) {
  store.dispatch('report/contextUpdateDatasource', { name, datasource });
}

/**
 * 删除数据源（按name匹配）
 * @param {Object} params - 参数对象
 * @param {string} params.name - 要删除的数据源名称
 */
export function removeDatasource({ name }) {
  store.dispatch('report/contextRemoveDatasource', name);
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
 */
export function addDataset({ datasourceName, dataset }) {
  store.dispatch('report/contextAddDataset', { datasourceName, dataset });
}

/**
 * 更新指定数据源下的数据集
 * @param {Object} params - 参数对象
 * @param {string} params.datasourceName - 目标数据源名称
 * @param {string} params.datasetName - 目标数据集名称
 * @param {Object} params.dataset - 新的数据集定义对象
 */
export function updateDataset({ datasourceName, datasetName, dataset }) {
  store.dispatch('report/contextUpdateDataset', { datasourceName, datasetName, dataset });
}

/**
 * 删除指定数据源下的数据集
 * @param {Object} params - 参数对象
 * @param {string} params.datasourceName - 目标数据源名称
 * @param {string} params.datasetName - 要删除的数据集名称
 */
export function removeDataset({ datasourceName, datasetName }) {
  store.dispatch('report/contextRemoveDataset', { datasourceName, datasetName });
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
 */
export function setSearchForm({ searchForm }) {
  store.dispatch('report/contextSetSearchForm', searchForm);
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
 */
export function updatePaper({ paper }) {
  store.dispatch('report/contextUpdatePaper', paper);
}

// ============ Row 操作 ============

/**
 * 获取表格行数据
 * @param {Object} params - 参数对象
 * @param {number} [params.rowNumber] - 行号，不提供则返回全部行
 * @returns {Object|Array|null} 提供rowNumber返回单行对象，不提供返回行数组
 */
export function getRows({ rowNumber } = {}) {
  return store.getters['report/getRows'](rowNumber);
}

/**
 * 设置全部行数据
 * @param {Object} params - 参数对象
 * @param {Array} params.rows - 行定义数组
 */
export function setRows({ rows }) {
  store.dispatch('report/contextSetRows', rows);
}

/**
 * 更新行（按rowNumber匹配替换）
 * @param {Object} params - 参数对象
 * @param {number} params.rowNumber - 目标行号
 * @param {Object} params.row - 新的行定义对象
 */
export function updateRow({ rowNumber, row }) {
  store.dispatch('report/contextUpdateRow', { rowNumber, row });
}

// ============ Column 操作 ============

/**
 * 获取表格列数据
 * @param {Object} params - 参数对象
 * @param {number} [params.columnNumber] - 列号，不提供则返回全部列
 * @returns {Object|Array|null} 提供columnNumber返回单列对象，不提供返回列数组
 */
export function getColumns({ columnNumber } = {}) {
  return store.getters['report/getColumns'](columnNumber);
}

/**
 * 设置全部列数据
 * @param {Object} params - 参数对象
 * @param {Array} params.columns - 列定义数组
 */
export function setColumns({ columns }) {
  store.dispatch('report/contextSetColumns', columns);
}

/**
 * 更新列（按columnNumber匹配替换）
 * @param {Object} params - 参数对象
 * @param {number} params.columnNumber - 目标列号
 * @param {Object} params.column - 新的列定义对象
 */
export function updateColumn({ columnNumber, column }) {
  store.dispatch('report/contextUpdateColumn', { columnNumber, column });
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
  readCell,
  writeCell,
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
  getRows,
  setRows,
  updateRow,
  getColumns,
  setColumns,
  updateColumn
};
