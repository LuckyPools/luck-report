/**
 * Context 操作方法集合
 *
 * 架构说明：
 * - 所有操作方法都通过 Vuex dispatch 调用
 * - 保持了对 context 数据的集中管理
 * - 符合 Vuex 的最佳实践
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
 * @param {Object} cell - 单元格定义
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
  updateProperty
};
