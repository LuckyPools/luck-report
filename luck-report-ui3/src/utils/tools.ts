import {
  writeCell as doWriteCell,
  getCell,
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
  getRows as doGetRows,
  setRows as doSetRows,
  getColumns as doGetColumns,
  setColumns as doSetColumns,
  getContext
} from "@/utils/contextActions";
import { useReportStore } from '@/store/modules/report';
import TableManager from '@/views/report/designer/edit-table/manager.js';
import { doMergeCells } from '@/views/report/designer/edit-table/utils/MergeCellUtils.js';
import { insertRow as doInsertRow } from '@/views/report/designer/edit-table/utils/operation/InsertRowOperation.js';
import { deleteRow as doDeleteRow } from '@/views/report/designer/edit-table/utils/operation/DeleteRowOperation.js';
import { insertCol as doInsertCol } from '@/views/report/designer/edit-table/utils/operation/InsertColOperation.js';
import { deleteCol as doDeleteCol } from '@/views/report/designer/edit-table/utils/operation/DeleteColOperation.js';
import { cleanCells as doCleanCells } from '@/views/report/designer/edit-table/utils/operation/ClearCellOperation.js';
import { pushBackup, popAndRestore, getBackupCount, getBackupSummary, clearBackup } from './backupManager';
import { deepCopy } from "@/utils/comnon";
import {
  scriptValidation as apiScriptValidation,
  previewData as apiPreviewData,
  buildFields as apiBuildFields,
  saveReportFile as apiSaveReportFile,
  loadBuildinDatasources as apiLoadBuildinDatasources,
  testConnection as apiTestConnection,
  loadMethods as apiLoadMethods,
  conditionScriptValidation as apiConditionScriptValidation
} from '@/api/designer/index.js';
import { tableToXml } from '@/utils/table.js';
import store from '@/store';

/**
 * 工具执行结果构造函数
 * 规范 writeCells 等写操作工具的返回值类型，包含详细的成功/失败信息
 *
 * @param {boolean} success - 是否执行成功
 * @param {string} message - 成功/失败的详细信息
 * @param {any} data - 返回的数据（可选）
 * @returns {Object} 包含 success、message、data 的结果对象
 */
function createToolResult(success, message, data = null) {
    return { success, message, data };
}

/**
 * 提取错误对象的详细信息
 * 从各种可能的错误对象结构中提取实际的错误信息
 *
 * @param {any} error - 错误对象，可能来自 API 响应、JavaScript 异常等
 * @returns {string} 错误信息字符串
 */
function extractErrorInfo(error) {
    if (!error) {
        return '未知错误';
    }

    // 1. 优先检查 msg 属性（后端 API 返回的错误格式）
    if (error.msg) {
        // 去除 HTML 标签，只保留纯文本
        return error.msg.replace(/<[^>]*>/g, '').trim();
    }

    // 2. 检查 message 属性（JavaScript 异常的标准属性）
    if (error.message) {
        return error.message;
    }

    // 3. 检查 response.data 结构（axios 错误格式）
    if (error.response && error.response.data) {
        const data = error.response.data;
        if (data.msg) {
            return data.msg.replace(/<[^>]*>/g, '').trim();
        }
        if (data.message) {
            return data.message;
        }
        if (data.error) {
            return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        }
    }

    // 4. 检查 error 属性
    if (error.error) {
        return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
    }

    // 5. 兜底：尝试 JSON 序列化
    try {
        const str = JSON.stringify(error);
        // 如果序列化结果太长，截取前200字符
        if (str.length > 200) {
            return str.substring(0, 200) + '...';
        }
        return str;
    } catch (e) {
        // 无法序列化，返回对象类型描述
        return `错误对象类型: ${typeof error}`;
    }
}

/**
 * 工具执行结果常量（快捷构造方法）
 */
const ToolResult = {
    /** 执行成功，返回成功结果对象 */
    success: (message = '执行成功', data = null) => createToolResult(true, message, data),
    /** 执行失败，返回失败结果对象 */
    error: (message = '执行失败', data = null) => createToolResult(false, message, data)
};

/**
 * Agent 方法注册表
 * 将所有可供 AI Agent 通过 new Function 调用的方法统一注册到此对象
 * 新增方法只需在此处注册即可，无需在 index.vue 中重复定义
 *
 * 注册规则：
 * - 本文件中定义的 agent 专用方法直接注册
 * - contextActions.js 中的通用方法也注册进来，供 agent 直接调用
 * - key 为方法名（agent 代码中使用该名称调用），value 为方法引用
 * - 所有方法统一使用 ({ ... }) 解构对象参数格式，便于 iframe postMessage 传递
 */
export const agentMethodRegistry = {
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
    setColumns,
    mergeCells,
    insertRow,
    deleteRow,
    insertCol,
    deleteCol,
    backupData,
    restoreData,
    getBackupInfo,
    clearBackupData,
    validateExpression,
    previewData,
    buildFields,
    saveReport,
    loadBuildinDatasources,
    testConnection,
    loadBeanMethods,
    validateCondition,
    getReportSchema,
    clearCellContent,
    clearCellStyle,
    clearCellAll,
    readCells,
    writeCells
};

/**
 * 批量读取单元格数据（AI Agent 版本）
 * 根据坐标数组一次性读取多个单元格的定义数据
 *
 * @param {Object} params - 参数对象
 * @param {Array<{row: number, col: number}>} params.cellPositionArray - 单元格坐标数组，row和col从1开始
 * @return {Object} 以 "row,col" 为key、单元格数据为value的对象，如 { "1,1": { 单元格数据 }, "2,2": { 单元格数据 } }
 */
export function readCells({ cellPositionArray }) {
    if (!Array.isArray(cellPositionArray) || cellPositionArray.length === 0) {
        console.error('[AiIframe] readCells: cellPositionArray 不能为空数组');
        return ToolResult.error('cellPositionArray 不能为空数组');
    }

    const result = {};
    for (const pos of cellPositionArray) {
        if (pos.row === undefined || pos.col === undefined) {
            console.error('[AiIframe] readCells: 坐标缺少 row 或 col 属性', pos);
            return ToolResult.error(`坐标缺少 row 或 col 属性: ${JSON.stringify(pos)}`);
        }
        // cellPositionArray 中 row/col 从1开始，getCell 需要 rowIndex/colIndex 从0开始
        let cellData;
        try {
            cellData = getCell(pos.row - 1, pos.col - 1);
        } catch (error) {
            // [关键决策点] 状态变化：读取单元格失败 → 关键日志，便于排查真实原因
            console.error('[AiIframe] readCells: getCell 抛异常', pos, error);
            return ToolResult.error(`readCells 失败，坐标 ${pos.row},${pos.col}，原因: ${extractErrorInfo(error)}`);
        }
        const key = `${pos.row},${pos.col}`;
        result[key] = cellData;
    }

    return result;
}

/**
 * 批量写入单元格定义数据（AI Agent 版本）
 * 以 "row,col" 为key的单元格数据对象，一次性写入多个单元格
 * 执行前自动备份所有目标单元格数据，执行后回读验证
 * 参照单格写入工具的实现，支持备份、异常还原和回读验证
 *
 * @param {Object} params - 参数对象
 * @param {Object} params.cells - 单元格数据对象，key为 "row,col" 格式（从1开始），value为单元格定义对象
 * @return {Object} ToolResult.success 表示全部写入成功，ToolResult.error 表示写入失败及异常信息
 */
export function writeCells({ cells }) {
    if (!cells || typeof cells !== 'object' || Object.keys(cells).length === 0) {
        console.error('[AiIframe] writeCells: cells 不能为空对象');
        return ToolResult.error('cells 不能为空对象');
    }

    // 备份所有目标单元格的当前数据
    const oldCells = {};
    for (const key of Object.keys(cells)) {
        const parts = key.split(',');
        const row = parseInt(parts[0], 10);
        const col = parseInt(parts[1], 10);
        if (isNaN(row) || isNaN(col)) {
            console.error('[AiIframe] writeCells: key 格式无效，应为 "row,col"', key);
            return ToolResult.error(`key 格式无效，应为 "row,col": ${key}`);
        }
        // row/col 从1开始，getCell 需要 rowIndex/colIndex 从0开始
        oldCells[key] = getCell(row - 1, col - 1);
    }

    pushBackup({
        description: `批量修改单元格 [${Object.keys(cells).join(', ')}]`,
        type: 'writeCells',
        restore: function () {
            for (const key of Object.keys(oldCells)) {
                const parts = key.split(',');
                const row = parseInt(parts[0], 10);
                const col = parseInt(parts[1], 10);
                const oldCell = oldCells[key];
                if (oldCell) {
                    doWriteCell({ rowIndex: row - 1, colIndex: col - 1, cell: deepCopy(oldCell) });
                }
            }
        }
    });

    // 逐个写入单元格
    // 失败原因用对象记录，key=坐标，value=具体异常原因（来自 extractErrorInfo 解析），
    // 避免之前只 push(key) 导致 message 只能给 LLM 看坐标、看不到为啥失败
    const failedReasons = {};
    for (const [key, cell] of Object.entries(cells)) {
        if (cell === null || cell === undefined) {
            console.error('[AiIframe] writeCells: 单元格定义对象不能为空', key);
            failedReasons[key] = '单元格定义对象不能为空（LLM 传了 null/undefined）';
            continue;
        }
        const parts = key.split(',');
        const row = parseInt(parts[0], 10);
        const col = parseInt(parts[1], 10);
        try {
            doWriteCell({ rowIndex: row - 1, colIndex: col - 1, cell });
        } catch (error) {
            // [关键决策点] 状态变化：写入失败 → 关键日志，便于排查真实原因
            // extractErrorInfo 能从 JavaScript 异常 / axios 错误 / 后端 API 错误里抽出 msg/message
            const reason = extractErrorInfo(error);
            console.error('[AiIframe] writeCells: 写入单元格失败', key, reason, error);
            failedReasons[key] = reason;
        }
    }

    const failedKeys = Object.keys(failedReasons);
    // 有失败的单元格时，自动还原备份
    if (failedKeys.length > 0) {
        const restoreResult = popAndRestore();
        console.log('[AiIframe] writeCells 已自动还原备份:', restoreResult.message);
        // 拼接每个失败坐标 + 真实原因；让 LLM 能直接定位是 schema 错 / 类型不匹配 / 表格未挂载 还是别的
        const detail = failedKeys
            .map(k => `${k}: ${failedReasons[k]}`)
            .join('；');
        return ToolResult.error(`批量写入单元格失败，失败详情: ${detail}`);
    }

    // 回读验证所有单元格是否写入成功
    for (const key of Object.keys(cells)) {
        const parts = key.split(',');
        const row = parseInt(parts[0], 10);
        const col = parseInt(parts[1], 10);
        const newCell = getCell(row - 1, col - 1);
        if (!newCell) {
            const reason = `回读验证失败，单元格不存在（context.cellsMap 中查不到 ${row},${col}）`;
            console.error('[AiIframe] writeCells: 回读验证失败', key, reason);
            const restoreResult = popAndRestore();
            console.log('[AiIframe] writeCells 已自动还原备份:', restoreResult.message);
            return ToolResult.error(`${reason}（已自动还原备份）`);
        }
    }

    return ToolResult.success(`批量写入 ${Object.keys(cells).length} 个单元格成功`);
}

/**
 * 合并/拆分单元格（AI Agent 版本）
 * 执行前自动备份当前合并配置，支持 AI 调用后的异常还原
 *
 * @param {Object} params - 参数对象
 * @param {number} params.startRow - 起始行索引，从0开始
 * @param {number} params.startCol - 起始列索引，从0开始
 * @param {number} params.endRow - 结束行索引，从0开始
 * @param {number} params.endCol - 结束列索引，从0开始
 * @return {number} ToolResult.success('操作成功') 表示成功，ToolResult.error('操作失败，请检查参数是否正确') 表示失败
 */
export function mergeCells({ startRow, startCol, endRow, endCol }) {
    const table = TableManager.get();
    if (!table) {
        console.error('[AiIframe] mergeCells: 表格实例不存在');
        return ToolResult.error('表格实例不存在，无法执行合并操作');
    }

    const oldMergeCells = deepCopy(table.getSettings().mergeCells || []);

    pushBackup({
        description: `合并/拆分单元格 (${startRow},${startCol})-(${endRow},${endCol})`,
        type: 'mergeCells',
        restore: function () {
            const t = TableManager.get();
            if (t) {
                t.updateSettings({ mergeCells: oldMergeCells });
            }
        }
    });

    try {
        const result = doMergeCells(startRow, startCol, endRow, endCol, table);
        return ToolResult.success('单元格合并/拆分成功');
    } catch (error) {
        console.error('[AiIframe] mergeCells 执行失败:', error);
        // 异常时自动还原备份数据
        const restoreResult = popAndRestore();
        console.log('[AiIframe] mergeCells 已自动还原备份:', restoreResult.message);
        return ToolResult.error(`合并单元格失败: ${extractErrorInfo(error)}`);
    }
}

/**
 * 同步行定义到 useReport store（插入行后调用）
 * @param position 插入位置（0-based）
 * @param number 插入行数
 * @param defaultHeight 默认行高
 */
function syncInsertRows(position: number, number: number, defaultHeight = 25): void {
    try {
        const store = useReportStore();
        const currentRows: any[] = store.getRows() || [];
        const newRows: any[] = [];
        for (let i = 0; i < currentRows.length; i++) {
            const row = currentRows[i];
            const rowIndex = row.rowNumber - 1;
            if (rowIndex >= position) {
                newRows.push({ ...row, rowNumber: row.rowNumber + number });
            } else {
                newRows.push(row);
            }
        }
        for (let i = 0; i < number; i++) {
            const newRowNumber = position + 1 + i;
            newRows.push({ rowNumber: newRowNumber, height: defaultHeight });
        }
        newRows.sort((a, b) => a.rowNumber - b.rowNumber);
        store.contextSetRows(newRows);
        console.log(`[AiIframe] syncInsertRows: 已同步行定义到 store，插入 ${number} 行，位置 ${position}，当前总行数=${newRows.length}`);
    } catch (e: any) {
        console.warn('[AiIframe] syncInsertRows 同步失败:', e?.message);
    }
}

/**
 * 同步行定义到 useReport store（删除行后调用）
 * @param startRow 起始行索引（0-based）
 * @param endRow 结束行索引（0-based）
 */
function syncDeleteRows(startRow: number, endRow: number): void {
    try {
        const store = useReportStore();
        const currentRows: any[] = store.getRows() || [];
        const deleteCount = endRow - startRow + 1;
        const newRows: any[] = [];
        for (const row of currentRows) {
            const rowIndex = row.rowNumber - 1;
            if (rowIndex >= startRow && rowIndex <= endRow) {
                continue;
            }
            if (rowIndex > endRow) {
                newRows.push({ ...row, rowNumber: row.rowNumber - deleteCount });
            } else {
                newRows.push(row);
            }
        }
        newRows.sort((a, b) => a.rowNumber - b.rowNumber);
        store.contextSetRows(newRows);
        console.log(`[AiIframe] syncDeleteRows: 已同步行定义到 store，删除 ${deleteCount} 行(${startRow}-${endRow})，当前总行数=${newRows.length}`);
    } catch (e: any) {
        console.warn('[AiIframe] syncDeleteRows 同步失败:', e?.message);
    }
}

/**
 * 同步列定义到 useReport store（插入列后调用）
 * @param position 插入位置（0-based）
 * @param number 插入列数
 * @param defaultWidth 默认列宽
 */
function syncInsertCols(position: number, number: number, defaultWidth = 100): void {
    try {
        const store = useReportStore();
        const currentCols: any[] = store.getColumns() || [];
        const newCols: any[] = [];
        for (let i = 0; i < currentCols.length; i++) {
            const col = currentCols[i];
            const colIndex = col.columnNumber - 1;
            if (colIndex >= position) {
                newCols.push({ ...col, columnNumber: col.columnNumber + number });
            } else {
                newCols.push(col);
            }
        }
        for (let i = 0; i < number; i++) {
            const newColNumber = position + 1 + i;
            newCols.push({ columnNumber: newColNumber, width: defaultWidth });
        }
        newCols.sort((a, b) => a.columnNumber - b.columnNumber);
        store.contextSetColumns(newCols);
        console.log(`[AiIframe] syncInsertCols: 已同步列定义到 store，插入 ${number} 列，位置 ${position}，当前总列数=${newCols.length}`);
    } catch (e: any) {
        console.warn('[AiIframe] syncInsertCols 同步失败:', e?.message);
    }
}

/**
 * 同步列定义到 useReport store（删除列后调用）
 * @param startCol 起始列索引（0-based）
 * @param endCol 结束列索引（0-based）
 */
function syncDeleteCols(startCol: number, endCol: number): void {
    try {
        const store = useReportStore();
        const currentCols: any[] = store.getColumns() || [];
        const deleteCount = endCol - startCol + 1;
        const newCols: any[] = [];
        for (const col of currentCols) {
            const colIndex = col.columnNumber - 1;
            if (colIndex >= startCol && colIndex <= endCol) {
                continue;
            }
            if (colIndex > endCol) {
                newCols.push({ ...col, columnNumber: col.columnNumber - deleteCount });
            } else {
                newCols.push(col);
            }
        }
        newCols.sort((a, b) => a.columnNumber - b.columnNumber);
        store.contextSetColumns(newCols);
        console.log(`[AiIframe] syncDeleteCols: 已同步列定义到 store，删除 ${deleteCount} 列(${startCol}-${endCol})，当前总列数=${newCols.length}`);
    } catch (e: any) {
        console.warn('[AiIframe] syncDeleteCols 同步失败:', e?.message);
    }
}

/**
 * 插入行（AI Agent 版本）
 * 在指定位置插入行，执行前自动备份单元格和行数据
 *
 * @param {Object} params - 参数对象
 * @param {number} params.position - 插入位置（行索引），从0开始
 * @param {number} [params.number=1] - 插入行数
 * @return {number} ToolResult.success('操作成功') 表示成功，ToolResult.error('操作失败，请检查参数是否正确') 表示失败
 */
export function insertRow({ position, number = 1 }) {
    const table = TableManager.get();
    if (!table) {
        console.error('[AiIframe] insertRow: 表格实例不存在');
        return ToolResult.error('表格实例不存在，无法执行插入行操作');
    }
    if (position < 0 || position > table.countRows()) {
        console.error(`[AiIframe] insertRow: 插入位置无效: ${position}，有效范围 0-${table.countRows()}`);
        return ToolResult.error(`插入位置无效: ${position}，有效范围 0-${table.countRows()}`);
    }

    const oldRowHeights = deepCopy(table.getSettings().rowHeights);
    const oldMergeCells = deepCopy(table.getSettings().mergeCells || []);

    pushBackup({
        description: `在位置 ${position} 插入 ${number} 行`,
        type: 'insertRow',
        restore: function () {
            const t = TableManager.get();
            if (t) {
                t.alter('remove_row', position, number);
                t.updateSettings({ rowHeights: oldRowHeights, mergeCells: oldMergeCells });
            }
        }
    });

    try {
        doInsertRow(table, position, number);
        console.log(`[AiIframe] insertRow: 已在位置 ${position} 插入 ${number} 行`);
        syncInsertRows(position, number);
        return ToolResult.success(`已在位置 ${position} 插入 ${number} 行`);
    } catch (error) {
        console.error('[AiIframe] insertRow 执行失败:', error);
        // 异常时自动还原备份数据
        const restoreResult = popAndRestore();
        console.log('[AiIframe] insertRow 已自动还原备份:', restoreResult.message);
        return ToolResult.error(`插入行失败: ${extractErrorInfo(error)}`);
    }
}

/**
 * 删除行（AI Agent 版本）
 * 删除指定范围的行，执行前自动备份所有相关数据
 *
 * @param {Object} params - 参数对象
 * @param {number} params.startRow - 起始行索引，从0开始
 * @param {number} params.endRow - 结束行索引，从0开始
 * @return {number} ToolResult.success('操作成功') 表示成功，ToolResult.error('操作失败，请检查参数是否正确') 表示失败
 */
export function deleteRow({ startRow, endRow }) {
    const table = TableManager.get();
    if (!table) {
        console.error('[AiIframe] deleteRow: 表格实例不存在');
        return ToolResult.error('表格实例不存在，无法执行删除行操作');
    }
    const countRows = table.countRows();
    if (startRow < 0 || endRow >= countRows || startRow > endRow) {
        console.error(`[AiIframe] deleteRow: 行范围无效: ${startRow}-${endRow}，有效范围 0-${countRows - 1}`);
        return ToolResult.error(`行范围无效: ${startRow}-${endRow}，有效范围 0-${countRows - 1}`);
    }

    const oldRowHeights = deepCopy(table.getSettings().rowHeights);
    const oldMergeCells = deepCopy(table.getSettings().mergeCells || []);

    pushBackup({
        description: `删除行 ${startRow}-${endRow}`,
        type: 'deleteRow',
        restore: function () {
            const t = TableManager.get();
            if (t) {
                for (let i = endRow; i >= startRow; i--) {
                    t.alter('insert_row', i);
                }
                t.updateSettings({ rowHeights: oldRowHeights, mergeCells: oldMergeCells });
            }
        }
    });

    try {
        doDeleteRow(table, startRow, endRow);
        console.log(`[AiIframe] deleteRow: 已删除行 ${startRow}-${endRow}`);
        syncDeleteRows(startRow, endRow);
        return ToolResult.success(`已删除行 ${startRow}-${endRow}`);
    } catch (error) {
        console.error('[AiIframe] deleteRow 执行失败:', error);
        // 异常时自动还原备份数据
        const restoreResult = popAndRestore();
        console.log('[AiIframe] deleteRow 已自动还原备份:', restoreResult.message);
        return ToolResult.error(`删除行失败: ${extractErrorInfo(error)}`);
    }
}

/**
 * 插入列（AI Agent 版本）
 * 在指定位置插入列，执行前自动备份单元格和列数据
 *
 * @param {Object} params - 参数对象
 * @param {number} params.position - 插入位置（列索引），从0开始
 * @param {number} [params.number=1] - 插入列数
 * @return {number} ToolResult.success('操作成功') 表示成功，ToolResult.error('操作失败，请检查参数是否正确') 表示失败
 */
export function insertCol({ position, number = 1 }) {
    const table = TableManager.get();
    if (!table) {
        console.error('[AiIframe] insertCol: 表格实例不存在');
        return ToolResult.error('表格实例不存在，无法执行插入列操作');
    }
    if (position < 0 || position > table.countCols()) {
        console.error(`[AiIframe] insertCol: 插入位置无效: ${position}，有效范围 0-${table.countCols()}`);
        return ToolResult.error(`插入位置无效: ${position}，有效范围 0-${table.countCols()}`);
    }

    const oldColWidths = deepCopy(table.getSettings().colWidths);
    const oldMergeCells = deepCopy(table.getSettings().mergeCells || []);

    pushBackup({
        description: `在位置 ${position} 插入 ${number} 列`,
        type: 'insertCol',
        restore: function () {
            const t = TableManager.get();
            if (t) {
                t.alter('remove_col', position, number);
                t.updateSettings({ colWidths: oldColWidths, mergeCells: oldMergeCells });
            }
        }
    });

    try {
        doInsertCol(table, position, number);
        console.log(`[AiIframe] insertCol: 已在位置 ${position} 插入 ${number} 列`);
        syncInsertCols(position, number);
        return ToolResult.success(`已在位置 ${position} 插入 ${number} 列`);
    } catch (error) {
        console.error('[AiIframe] insertCol 执行失败:', error);
        // 异常时自动还原备份数据
        const restoreResult = popAndRestore();
        console.log('[AiIframe] insertCol 已自动还原备份:', restoreResult.message);
        return ToolResult.error(`插入列失败: ${extractErrorInfo(error)}`);
    }
}

/**
 * 删除列（AI Agent 版本）
 * 删除指定范围的列，执行前自动备份所有相关数据
 *
 * @param {Object} params - 参数对象
 * @param {number} params.startCol - 起始列索引，从0开始
 * @param {number} params.endCol - 结束列索引，从0开始
 * @return {number} ToolResult.success('操作成功') 表示成功，ToolResult.error('操作失败，请检查参数是否正确') 表示失败
 */
export function deleteCol({ startCol, endCol }) {
    const table = TableManager.get();
    if (!table) {
        console.error('[AiIframe] deleteCol: 表格实例不存在');
        return ToolResult.error('表格实例不存在，无法执行删除列操作');
    }
    const countCols = table.countCols();
    if (startCol < 0 || endCol >= countCols || startCol > endCol) {
        console.error(`[AiIframe] deleteCol: 列范围无效: ${startCol}-${endCol}，有效范围 0-${countCols - 1}`);
        return ToolResult.error(`列范围无效: ${startCol}-${endCol}，有效范围 0-${countCols - 1}`);
    }

    const oldColWidths = deepCopy(table.getSettings().colWidths);
    const oldMergeCells = deepCopy(table.getSettings().mergeCells || []);

    pushBackup({
        description: `删除列 ${startCol}-${endCol}`,
        type: 'deleteCol',
        restore: function () {
            const t = TableManager.get();
            if (t) {
                for (let i = endCol; i >= startCol; i--) {
                    t.alter('insert_col', i);
                }
                t.updateSettings({ colWidths: oldColWidths, mergeCells: oldMergeCells });
            }
        }
    });

    try {
        doDeleteCol(table, startCol, endCol);
        console.log(`[AiIframe] deleteCol: 已删除列 ${startCol}-${endCol}`);
        syncDeleteCols(startCol, endCol);
        return ToolResult.success(`已删除列 ${startCol}-${endCol}`);
    } catch (error) {
        console.error('[AiIframe] deleteCol 执行失败:', error);
        // 异常时自动还原备份数据
        const restoreResult = popAndRestore();
        console.log('[AiIframe] deleteCol 已自动还原备份:', restoreResult.message);
        return ToolResult.error(`删除列失败: ${extractErrorInfo(error)}`);
    }
}

// ============ 行操作方法 ============

/**
 * 获取行数据（AI Agent 版本）
 * 接收行号数组，按需返回 { 行号: 行定义 } 格式的对象
 * 类似 readCellsTool 的批量读取语义
 *
 * @param {Object} params - 参数对象
 * @param {number[]} [params.rowNumbers] - 行号数组（从1开始），不传则返回全部行
 * @return {Object} 以行号（字符串）为 key、行定义为 value 的对象
 */
export function getRows({ rowNumbers } = {}) {
    if (rowNumbers !== undefined && !Array.isArray(rowNumbers)) {
        console.error('[AiIframe] getRows: rowNumbers 必须是数组');
        return ToolResult.error('rowNumbers 必须是数组');
    }
    return doGetRows({ rowNumbers });
}

/**
 * 批量设置行数据（AI Agent 版本）
 * 接收 { 行号: 行定义 } 格式的对象，整体合并更新行配置
 * 执行前自动备份行高数据，执行后同步更新表格显示
 * 异常时自动回滚备份，参考 updateRow 的备份/还原实现
 *
 * @param {Object} params - 参数对象
 * @param {Object} params.rows - 以行号（字符串或数字）为 key 的行定义对象集合
 * @return {Object} ToolResult.success('操作成功') 表示成功，ToolResult.error('操作失败，请检查参数是否正确') 表示失败
 */
export function setRows({ rows }) {
    const table = TableManager.get();
    if (!table) {
        console.error('[AiIframe] setRows: 表格实例不存在');
        return ToolResult.error('操作失败，请检查参数是否正确');
    }
    if (!rows || typeof rows !== 'object' || Array.isArray(rows) || Object.keys(rows).length === 0) {
        console.error('[AiIframe] setRows: rows 必须是行号到行定义的对象');
        return ToolResult.error('rows 必须是行号到行定义的对象');
    }

    // 备份当前行高数据
    const oldRowHeights = deepCopy(table.getSettings().rowHeights);

    pushBackup({
        description: '批量更新行数据',
        type: 'setRows',
        restore: function () {
            const t = TableManager.get();
            if (t) {
                t.updateSettings({ rowHeights: oldRowHeights, manualRowResize: oldRowHeights });
            }
        }
    });

    try {
        // 1. 更新 Vuex store 数据（contextActions 内部已做 keyed 对象 → 数组的转换）
        doSetRows({ rows });

        // 2. 同步更新 Handsontable 表格行高
        const rowHeights = table.getSettings().rowHeights || [];
        const defaultHeight = table.getSettings().defaultRowHeight || 23;
        for (const key of Object.keys(rows)) {
            const row = rows[key];
            if (row && row.height !== undefined) {
                const rowIndex = parseInt(key, 10) - 1;
                if (rowIndex < 0) continue;
                // reportDef 中 height 是 point 单位，Handsontable 使用 pixel 单位
                // 转换公式：pixel = point * 1.33
                const heightInPixel = Math.round(row.height * 1.33);
                // 确保 rowHeights 数组长度足够
                while (rowHeights.length <= rowIndex) {
                    rowHeights.push(defaultHeight);
                }
                rowHeights[rowIndex] = heightInPixel;
            }
        }
        table.updateSettings({
            rowHeights: rowHeights,
            manualRowResize: rowHeights
        });
        table.render();

        console.log(`[AiIframe] setRows: 已批量更新 ${Object.keys(rows).length} 行定义`);
        return ToolResult.success(`已批量更新 ${Object.keys(rows).length} 行定义`);
    } catch (error) {
        // [关键决策点] 状态变化：setRows 失败 → 关键日志，便于排查真实原因
        console.error('[AiIframe] setRows 执行失败:', error);
        // 异常时自动还原备份数据
        const restoreResult = popAndRestore();
        console.log('[AiIframe] setRows 已自动还原备份:', restoreResult.message);
        return ToolResult.error(`setRows 失败（已自动还原备份），原因: ${extractErrorInfo(error)}`);
    }
}

// ============ 列操作方法 ============

/**
 * 获取列数据（AI Agent 版本）
 * 接收列号数组，按需返回 { 列号: 列定义 } 格式的对象
 *
 * @param {Object} params - 参数对象
 * @param {number[]} [params.columnNumbers] - 列号数组（从1开始），不传则返回全部列
 * @return {Object} 以列号（字符串）为 key、列定义为 value 的对象
 */
export function getColumns({ columnNumbers } = {}) {
    if (columnNumbers !== undefined && !Array.isArray(columnNumbers)) {
        console.error('[AiIframe] getColumns: columnNumbers 必须是数组');
        return ToolResult.error('columnNumbers 必须是数组');
    }
    return doGetColumns({ columnNumbers });
}

/**
 * 批量设置列数据（AI Agent 版本）
 * 接收 { 列号: 列定义 } 格式的对象，整体合并更新列配置
 * 执行前自动备份列宽数据，执行后同步更新表格显示
 * 异常时自动回滚备份
 *
 * @param {Object} params - 参数对象
 * @param {Object} params.columns - 以列号（字符串或数字）为 key 的列定义对象集合
 * @return {Object} ToolResult.success('操作成功') 表示成功，ToolResult.error('操作失败，请检查参数是否正确') 表示失败
 */
export function setColumns({ columns }) {
    const table = TableManager.get();
    if (!table) {
        console.error('[AiIframe] setColumns: 表格实例不存在');
        return ToolResult.error('操作失败，请检查参数是否正确');
    }
    if (!columns || typeof columns !== 'object' || Array.isArray(columns) || Object.keys(columns).length === 0) {
        console.error('[AiIframe] setColumns: columns 必须是列号到列定义的对象');
        return ToolResult.error('columns 必须是列号到列定义的对象');
    }

    // 备份当前列宽数据
    const oldColWidths = deepCopy(table.getSettings().colWidths);

    pushBackup({
        description: '批量更新列数据',
        type: 'setColumns',
        restore: function () {
            const t = TableManager.get();
            if (t) {
                t.updateSettings({ colWidths: oldColWidths });
            }
        }
    });

    try {
        // 1. 更新 Vuex store 数据（contextActions 内部已做 keyed 对象 → 数组的转换）
        doSetColumns({ columns });

        // 2. 同步更新 Handsontable 表格列宽
        const colWidths = table.getSettings().colWidths || [];
        const defaultWidth = table.getSettings().defaultColWidth || 100;
        for (const key of Object.keys(columns)) {
            const column = columns[key];
            if (column && column.width !== undefined) {
                const colIndex = parseInt(key, 10) - 1;
                if (colIndex < 0) continue;
                // reportDef 中 width 是 point 单位，Handsontable 使用 pixel 单位
                // 转换公式：pixel = point * 1.33
                const widthInPixel = Math.round(column.width * 1.33);
                // 确保 colWidths 数组长度足够
                while (colWidths.length <= colIndex) {
                    colWidths.push(defaultWidth);
                }
                colWidths[colIndex] = widthInPixel;
            }
        }
        table.updateSettings({ colWidths: colWidths });
        table.render();

        console.log(`[AiIframe] setColumns: 已批量更新 ${Object.keys(columns).length} 列定义`);
        return ToolResult.success(`已批量更新 ${Object.keys(columns).length} 列定义`);
    } catch (error) {
        // [关键决策点] 状态变化：setColumns 失败 → 关键日志，便于排查真实原因
        console.error('[AiIframe] setColumns 执行失败:', error);
        // 异常时自动还原备份数据
        const restoreResult = popAndRestore();
        console.log('[AiIframe] setColumns 已自动还原备份:', restoreResult.message);
        return ToolResult.error(`setColumns 失败（已自动还原备份），原因: ${extractErrorInfo(error)}`);
    }
}

/**
 * 数据节点备份方法
 * 备份当前修改的数据快照，用于后续异常还原
 * 限制最多保留最近20次备份记录
 *
 * @param {Object} params - 参数对象
 * @param {string} params.description - 备份描述，说明当前操作内容
 * @param {string} [params.type] - 备份数据类型标识
 * @return {number} ToolResult.success('操作成功') 表示成功，ToolResult.error('操作失败，请检查参数是否正确') 表示失败
 */
export function backupData({ description, type } = {}) {
    const desc = description || '手动备份';
    const backupType = type || 'manual';

    const table = TableManager.get();
    if (!table) {
        console.error('[AiIframe] backupData: 表格实例不存在，无法备份');
        return ToolResult.error('操作失败，请检查参数是否正确');
    }

    const snapshot = {
        rowHeights: deepCopy(table.getSettings().rowHeights),
        colWidths: deepCopy(table.getSettings().colWidths),
        mergeCells: deepCopy(table.getSettings().mergeCells || [])
    };

    pushBackup({
        description: desc,
        type: backupType,
        restore: function () {
            const t = TableManager.get();
            if (t) {
                t.updateSettings(snapshot);
            }
        }
    });

    console.log(`[AiIframe] backupData: 已备份 - ${desc}，当前备份数量: ${getBackupCount()}`);
    return ToolResult.success('操作成功');
}

/**
 * 数据还原方法
 * 从备份栈中弹出最近一条备份数据并逐步还原
 * 类似撤销操作，只能一步步还原
 *
 * @param {Object} params - 参数对象（无需参数）
 * @return {Object} 还原结果
 */
export function restoreData() {
    return popAndRestore();
}

/**
 * 获取备份信息
 * 查看当前备份栈的摘要信息
 *
 * @return {Object} 包含备份数量和摘要列表
 */
function getBackupInfo() {
    return {
        count: getBackupCount(),
        summary: getBackupSummary()
    };
}

/**
 * 清空备份栈
 * 清除所有已保存的备份数据
 *
 * @return {number} ToolResult.success('操作成功') 表示成功，ToolResult.error('操作失败，请检查参数是否正确') 表示失败
 */
function clearBackupData() {
    clearBackup();
    console.log('[AiIframe] clearBackupData: 已清空备份栈');
    return ToolResult.success('操作成功');
}

/**
 * 校验单元格表达式语法
 * 调用后端 scriptValidation 接口校验表达式语法正确性
 * 调用者：expression-value-editor、zxing-value-editor、image-value-editor
 *
 * @param {Object} params - 参数对象
 * @param {string} params.expression - 待校验的表达式内容，不可为空
 * @return {Promise<Object>} 校验结果，包含 valid 和 errors 字段
 */
export async function validateExpression({ expression }) {
    if (!expression) {
        return { success: false, valid: false, message: '表达式不能为空' };
    }
    try {
        const errors = await apiScriptValidation(expression);
        if (errors && errors.length > 0) {
            return { success: false, valid: false, errors, message: '表达式校验未通过' };
        }
        return { success: true, valid: true, message: '表达式校验通过' };
    } catch (error) {
        return { success: false, valid: false, message: error.msg || '表达式校验失败' };
    }
}

/**
 * 数据集预览数据
 * 调用后端 previewData 接口预览指定数据集的数据
 * 调用者：preview-data-dialog
 *
 * @param {Object} params - 参数对象
 * @param {string} params.sql - SQL 语句，不可为空
 * @param {string} params.type - 数据源类型：jdbc 或 buildin
 * @param {Array} [params.parameters] - SQL 参数列表
 * @param {string} [params.username] - JDBC 用户名（type=jdbc 时必填）
 * @param {string} [params.password] - JDBC 密码（type=jdbc 时必填）
 * @param {string} [params.driver] - JDBC 驱动（type=jdbc 时必填）
 * @param {string} [params.url] - JDBC 连接 URL（type=jdbc 时必填）
 * @param {string} [params.name] - 内置数据源名称（type=buildin 时必填）
 * @return {Promise<number>} ToolResult.success('操作成功') 表示执行成功，ToolResult.error('操作失败，请检查参数是否正确') 表示执行失败
 */
export async function previewData({ sql, type, parameters, username, password, driver, url, name }) {
    if (!sql) {
        return ToolResult.error('SQL语句不能为空');
    }
    const params = { sql, type, parameters: parameters || [] };
    if (type === 'jdbc') {
        params.username = username;
        params.password = password;
        params.driver = driver;
        params.url = url;
    } else if (type === 'buildin') {
        params.name = name;
    }
    try {
        const result = await apiPreviewData(params);
        return ToolResult.success('数据预览成功', result);
    } catch (error) {
        console.error('[AiIframe] previewData 执行失败:', error);
        return ToolResult.error(`数据预览失败: ${extractErrorInfo(error)}`);
    }
}

/**
 * 构建数据集字段
 * 调用后端 buildFields 接口根据 SQL 和数据源信息解析字段列表
 * 调用者：buildin-tree、database-tree、spring-tree
 *
 * @param {Object} params - 参数对象
 * @param {string} params.sql - SQL 语句，不可为空
 * @param {string} params.type - 数据源类型：jdbc 或 buildin
 * @param {Array} [params.parameters] - SQL 参数列表
 * @param {string} [params.username] - JDBC 用户名（type=jdbc 时必填）
 * @param {string} [params.password] - JDBC 密码（type=jdbc 时必填）
 * @param {string} [params.driver] - JDBC 驱动（type=jdbc 时必填）
 * @param {string} [params.url] - JDBC 连接 URL（type=jdbc 时必填）
 * @param {string} [params.name] - 内置数据源名称（type=buildin 时必填）
 * @return {Promise<Object>} 构建结果，包含 fields 字段数组
 */
export async function buildFields({ sql, type, parameters, username, password, driver, url, name }) {
    if (!sql) {
        return { success: false, message: 'SQL不能为空' };
    }
    const params = { sql, parameters: JSON.stringify(parameters || []), type };
    if (type === 'jdbc') {
        params.username = username;
        params.password = password;
        params.driver = driver;
        params.url = url;
    } else if (type === 'buildin') {
        params.name = name;
    }
    try {
        const fields = await apiBuildFields(params);
        return { success: true, fields };
    } catch (error) {
        return { success: false, message: error.msg || '构建字段失败' };
    }
}

/**
 * 保存报表
 * 将当前设计器中的报表数据序列化为 XML 并调用后端保存接口
 * 调用者：save-tool
 *
 * @param {Object} params - 参数对象
 * @param {string} [params.fileName] - 报表文件名
 * @return {Promise<Object>} 保存结果，包含 fileName
 */
export async function saveReport({ fileName , filePath } = {}) {
    try {
        const context = getContext();
        if (!context) {
            return { success: false, message: '报表上下文不存在' };
        }
        const content = tableToXml(context);
        await apiSaveReportFile(fileName, filePath, content);
        return { success: true, message: '报表保存成功', fileName: fullFileName };
    } catch (error) {
        return { success: false, message: error.msg || '保存报表失败' };
    }
}

/**
 * 获取内置数据源列表
 * 调用后端 loadBuildinDatasources 接口获取 Spring 内置数据源
 * 调用者：buildin-datasource-select-dialog
 *
 * @return {Promise<Object>} 内置数据源列表，包含 datasources 数组
 */
export async function loadBuildinDatasources() {
    try {
        const datasources = await apiLoadBuildinDatasources();
        return { success: true, datasources };
    } catch (error) {
        return { success: false, message: error.msg || '获取内置数据源失败' };
    }
}

/**
 * 测试数据库连接
 * 调用后端 testConnection 接口验证数据库连接参数是否可用
 * 调用者：datasource-dialog
 *
 * @param {Object} params - 参数对象
 * @param {string} params.driver - JDBC 驱动类名，不可为空
 * @param {string} params.url - JDBC 连接 URL，不可为空
 * @param {string} [params.username] - 数据库用户名
 * @param {string} [params.password] - 数据库密码
 * @return {Promise<Object>} 测试结果，包含 connected 布尔值
 */
export async function testConnection({ username, password, driver, url }) {
    if (!driver || !url) {
        return { success: false, connected: false, message: '数据库驱动和URL不能为空' };
    }
    const formData = new FormData();
    formData.append('username', username || '');
    formData.append('password', password || '');
    formData.append('driver', driver);
    formData.append('url', url);
    try {
        const data = await apiTestConnection(formData);
        return { success: true, connected: data.result, message: data.result ? '数据库连接成功' : '数据库连接失败' };
    } catch (error) {
        return { success: false, connected: false, message: error.msg || '测试数据库连接失败' };
    }
}

/**
 * 获取 Bean 数据源方法列表
 * 调用后端 loadMethods 接口获取指定 Spring Bean 的可用方法
 * 调用者：method-select-dialog
 *
 * @param {Object} params - 参数对象
 * @param {string} params.beanId - Spring Bean 标识，不可为空
 * @return {Promise<Object>} 方法列表，包含 methods 数组
 */
export async function loadBeanMethods({ beanId }) {
    if (!beanId) {
        return { success: false, message: 'beanId不能为空' };
    }
    try {
        const methods = await apiLoadMethods(beanId);
        return { success: true, methods };
    } catch (error) {
        return { success: false, message: error.msg || '获取Bean方法列表失败' };
    }
}

/**
 * 条件表达式逻辑校验
 * 调用后端 conditionScriptValidation 接口校验条件表达式的语法正确性
 * 调用者：condition-item-dialog、condition-dialog
 *
 * @param {Object} params - 参数对象
 * @param {string} params.expression - 待校验的条件表达式，不可为空
 * @return {Promise<Object>} 校验结果，包含 valid 和 errors 字段
 */
export async function validateCondition({ expression }) {
    if (!expression) {
        return { success: false, valid: false, message: '条件表达式不能为空' };
    }
    try {
        const errors = await apiConditionScriptValidation(expression);
        if (errors && errors.length > 0) {
            return { success: false, valid: false, errors, message: '条件表达式校验未通过' };
        }
        return { success: true, valid: true, message: '条件表达式校验通过' };
    } catch (error) {
        return { success: false, valid: false, message: error.msg || '条件表达式校验失败' };
    }
}

/**
 * 获取所有已注册的方法名列表
 * @return {string[]} 方法名数组
 */
export function getAgentMethodNames() {
    return Object.keys(agentMethodRegistry);
}

/**
 * 获取所有已注册的方法引用列表（与方法名列表顺序一致）
 * @return {Function[]} 方法引用数组
 */
/**
 * 获取报表整体结构信息
 * 返回报表的维度、合并区域、单元格数据、数据绑定等关键信息
 * 用于 AI Agent 获取当前报表状态快照
 *
 * @return {Object} 报表结构信息对象
 */
export function getReportSchema() {
    const table = TableManager.get();
    if (!table) {
        return { success: false, message: '表格实例不存在' };
    }

    const context = getContext();
    if (!context) {
        return { success: false, message: '报表上下文不存在' };
    }

    const rowCount = table.countRows();
    const colCount = table.countCols();
    const mergeCells = table.getSettings().mergeCells || [];

    // 构建单元格数据对象（键为 "row,col" 格式）
    const cells = {};
    const cellsMap = context.cellsMap;
    if (cellsMap) {
        cellsMap.forEach((cell, key) => {
            // 精简单元格数据，只保留关键信息
            cells[key] = {
                value: cell.value?.value || '',
                type: cell.value?.type || 'simple',
                expand: cell.expand || 'None',
                rowNumber: cell.rowNumber,
                colNumber: cell.colNumber
            };
        });
    }

    // 构建数据绑定信息
    const dataBindings = [];
    const datasources = context.datasources || [];
    datasources.forEach(ds => {
        if (ds.datasets) {
            ds.datasets.forEach(dataset => {
                dataBindings.push({
                    datasourceName: ds.name,
                    datasetName: dataset.name,
                    type: dataset.type || 'sql'
                });
            });
        }
    });

    return {
        rowCount,
        colCount,
        rows: rowCount,
        cols: colCount,
        mergedRegions: mergeCells.map(m => ({
            row: m.row,
            col: m.col,
            rowspan: m.rowspan,
            colspan: m.colspan
        })),
        cells,
        dataBindings,
        timestamp: Date.now()
    };
}

/**
 * 清空单元格内容（AI Agent 版本）
 * 将指定区域内的单元格内容清空，保留样式不变，执行前自动备份
 *
 * @param {Object} params - 参数对象
 * @param {number} params.startRow - 起始行索引，从0开始
 * @param {number} params.endRow - 结束行索引，从0开始
 * @param {number} params.startCol - 起始列索引，从0开始
 * @param {number} params.endCol - 结束列索引，从0开始
 * @return {number} ToolResult.success('操作成功') 表示成功，ToolResult.error('操作失败，请检查参数是否正确') 表示失败
 */
export function clearCellContent({ startRow, endRow, startCol, endCol }) {
    const table = TableManager.get();
    if (!table) {
        console.error('[AiIframe] clearCellContent: 表格实例不存在');
        return ToolResult.error('操作失败，请检查参数是否正确');
    }
    if (startRow < 0 || endRow >= table.countRows() || startRow > endRow) {
        console.error('[AiIframe] clearCellContent: 行范围无效');
        return ToolResult.error('操作失败，请检查参数是否正确');
    }
    if (startCol < 0 || endCol >= table.countCols() || startCol > endCol) {
        console.error('[AiIframe] clearCellContent: 列范围无效');
        return ToolResult.error('操作失败，请检查参数是否正确');
    }

    // 备份当前区域单元格数据
    const oldCells = [];
    for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
            const cell = getCell(i, j);
            if (cell) {
                oldCells.push({ row: i, col: j, cell: deepCopy(cell) });
            }
        }
    }

    pushBackup({
        description: `清空单元格内容 (${startRow},${startCol})-(${endRow},${endCol})`,
        type: 'clearCellContent',
        restore: function () {
            for (const item of oldCells) {
                // 最小写入：setCell 走 Vuex，triggerCellUpdate 通知监听器；
                // 异常穿透由 popAndRestore 内部处理
                setCell(item.row, item.col, deepCopy(item.cell));
                store.dispatch('report/triggerCellUpdate');
            }
        }
    });

    try {
        doCleanCells(startRow, endRow, startCol, endCol, 'content');
    } catch (error) {
        // [关键决策点] 状态变化：clearCellContent 失败 → 关键日志，便于排查真实原因
        console.error('[AiIframe] clearCellContent 执行失败:', error);
        // 异常时自动还原备份数据
        const restoreResult = popAndRestore();
        console.log('[AiIframe] clearCellContent 已自动还原备份:', restoreResult.message);
        return ToolResult.error(`clearCellContent 失败（已自动还原备份），原因: ${extractErrorInfo(error)}`);
    }

    return ToolResult.success('操作成功');
}

/**
 * 清空单元格样式（AI Agent 版本）
 * 将指定区域内的单元格样式重置为默认样式，保留内容不变，执行前自动备份
 *
 * @param {Object} params - 参数对象
 * @param {number} params.startRow - 起始行索引，从0开始
 * @param {number} params.endRow - 结束行索引，从0开始
 * @param {number} params.startCol - 起始列索引，从0开始
 * @param {number} params.endCol - 结束列索引，从0开始
 * @return {number} ToolResult.success('操作成功') 表示成功，ToolResult.error('操作失败，请检查参数是否正确') 表示失败
 */
export function clearCellStyle({ startRow, endRow, startCol, endCol }) {
    const table = TableManager.get();
    if (!table) {
        console.error('[AiIframe] clearCellStyle: 表格实例不存在');
        return ToolResult.error('操作失败，请检查参数是否正确');
    }
    if (startRow < 0 || endRow >= table.countRows() || startRow > endRow) {
        console.error('[AiIframe] clearCellStyle: 行范围无效');
        return ToolResult.error('操作失败，请检查参数是否正确');
    }
    if (startCol < 0 || endCol >= table.countCols() || startCol > endCol) {
        console.error('[AiIframe] clearCellStyle: 列范围无效');
        return ToolResult.error('操作失败，请检查参数是否正确');
    }

    // 备份当前区域单元格数据
    const oldCells = [];
    for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
            const cell = getCell(i, j);
            if (cell) {
                oldCells.push({ row: i, col: j, cell: deepCopy(cell) });
            }
        }
    }

    pushBackup({
        description: `清空单元格样式 (${startRow},${startCol})-(${endRow},${endCol})`,
        type: 'clearCellStyle',
        restore: function () {
            for (const item of oldCells) {
                // 最小写入：setCell 走 Vuex，triggerCellUpdate 通知监听器；
                // 异常穿透由 popAndRestore 内部处理
                setCell(item.row, item.col, deepCopy(item.cell));
                store.dispatch('report/triggerCellUpdate');
            }
        }
    });

    try {
        doCleanCells(startRow, endRow, startCol, endCol, 'style');
    } catch (error) {
        // [关键决策点] 状态变化：clearCellStyle 失败 → 关键日志，便于排查真实原因
        console.error('[AiIframe] clearCellStyle 执行失败:', error);
        // 异常时自动还原备份数据
        const restoreResult = popAndRestore();
        console.log('[AiIframe] clearCellStyle 已自动还原备份:', restoreResult.message);
        return ToolResult.error(`clearCellStyle 失败（已自动还原备份），原因: ${extractErrorInfo(error)}`);
    }

    return ToolResult.success('操作成功');
}

/**
 * 清空单元格全部（AI Agent 版本）
 * 将指定区域内的单元格内容和样式全部清空，重置为默认空白单元格，执行前自动备份
 *
 * @param {Object} params - 参数对象
 * @param {number} params.startRow - 起始行索引，从0开始
 * @param {number} params.endRow - 结束行索引，从0开始
 * @param {number} params.startCol - 起始列索引，从0开始
 * @param {number} params.endCol - 结束列索引，从0开始
 * @return {number} ToolResult.success('操作成功') 表示成功，ToolResult.error('操作失败，请检查参数是否正确') 表示失败
 */
export function clearCellAll({ startRow, endRow, startCol, endCol }) {
    const table = TableManager.get();
    if (!table) {
        console.error('[AiIframe] clearCellAll: 表格实例不存在');
        return ToolResult.error('操作失败，请检查参数是否正确');
    }
    if (startRow < 0 || endRow >= table.countRows() || startRow > endRow) {
        console.error('[AiIframe] clearCellAll: 行范围无效');
        return ToolResult.error('操作失败，请检查参数是否正确');
    }
    if (startCol < 0 || endCol >= table.countCols() || startCol > endCol) {
        console.error('[AiIframe] clearCellAll: 列范围无效');
        return ToolResult.error('操作失败，请检查参数是否正确');
    }

    // 备份当前区域单元格数据
    const oldCells = [];
    for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
            const cell = getCell(i, j);
            if (cell) {
                oldCells.push({ row: i, col: j, cell: deepCopy(cell) });
            }
        }
    }

    pushBackup({
        description: `清空单元格全部 (${startRow},${startCol})-(${endRow},${endCol})`,
        type: 'clearCellAll',
        restore: function () {
            for (const item of oldCells) {
                // 最小写入：setCell 走 Vuex，triggerCellUpdate 通知监听器；
                // 异常穿透由 popAndRestore 内部处理
                setCell(item.row, item.col, deepCopy(item.cell));
                store.dispatch('report/triggerCellUpdate');
            }
        }
    });

    try {
        doCleanCells(startRow, endRow, startCol, endCol, 'all');
    } catch (error) {
        // [关键决策点] 状态变化：clearCellAll 失败 → 关键日志，便于排查真实原因
        console.error('[AiIframe] clearCellAll 执行失败:', error);
        // 异常时自动还原备份数据
        const restoreResult = popAndRestore();
        console.log('[AiIframe] clearCellAll 已自动还原备份:', restoreResult.message);
        return ToolResult.error(`clearCellAll 失败（已自动还原备份），原因: ${extractErrorInfo(error)}`);
    }

    return ToolResult.success('操作成功');
}

export function getAgentMethodArgs() {
    return Object.values(agentMethodRegistry);
}
