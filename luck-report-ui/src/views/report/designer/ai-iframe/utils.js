import {
  readCell,
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
  getRows,
  setRows,
  updateRow as doUpdateRow,
  getColumns as doGetColumns,
  setColumns as doSetColumns,
  updateColumn as doUpdateColumn,
  getContext
} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager.js';
import { doMergeCells } from '@/views/report/designer/edit-table/utils/MergeCellUtils.js';
import { insertRow as doInsertRow } from '@/views/report/designer/edit-table/utils/operation/InsertRowOperation.js';
import { deleteRow as doDeleteRow } from '@/views/report/designer/edit-table/utils/operation/DeleteRowOperation.js';
import { insertCol as doInsertCol } from '@/views/report/designer/edit-table/utils/operation/InsertColOperation.js';
import { deleteCol as doDeleteCol } from '@/views/report/designer/edit-table/utils/operation/DeleteColOperation.js';
import { pushBackup, popAndRestore, getBackupCount, getBackupSummary, clearBackup } from './backupManager';
import { deepCopy } from "@/components/utils";
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
 * 工具执行结果枚举
 * 规范 writeCell 等写操作工具的返回值类型，提高代码可读性
 */
const ToolResult = {
    /** 执行成功 */
    SUCCESS: 1,
    /** 执行失败 */
    ERROR: 0
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
    updateColumn,
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
    getReportSchema
};

/**
 * 写入单元格定义数据（AI Agent 版本）
 * 执行前自动备份当前单元格数据，执行后回读验证修改是否生效
 *
 * @param {Object} params - 参数对象
 * @param {number} params.rowIndex - 单元格行坐标，从0开始
 * @param {number} params.colIndex - 单元格列坐标，从0开始
 * @param {Object} params.cell - 完整的单元格定义对象，需符合 CellDefinition 数据模型
 * @return {number} 1 表示修改成功，0 表示修改失败
 */
function writeCell({ rowIndex, colIndex, cell }) {
    if (cell === null || cell === undefined) {
        console.error('[AiIframe] writeCell: cell 不能为空');
        return ToolResult.ERROR;
    }

    // 备份当前单元格数据，用于异常还原
    const oldCell = getCell(rowIndex, colIndex);
    pushBackup({
        description: `修改单元格 (${rowIndex},${colIndex})`,
        type: 'writeCell',
        restore: function () {
            if (oldCell) {
                doWriteCell({ rowIndex, colIndex, cell: deepCopy(oldCell) });
            }
        }
    });

    try {
        doWriteCell({ rowIndex, colIndex, cell });
    } catch (error) {
        console.error('[AiIframe] writeCell 执行失败:', error);
        return ToolResult.ERROR;
    }

    // 回读验证修改是否生效
    const newCell = getCell(rowIndex, colIndex);
    if (!newCell) {
        console.error('[AiIframe] writeCell: 回读验证失败，单元格不存在');
        return ToolResult.ERROR;
    }

    return ToolResult.SUCCESS;
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
 * @return {Object} 操作结果
 */
function mergeCells({ startRow, startCol, endRow, endCol }) {
    const table = TableManager.get();
    if (!table) {
        return { success: false, message: '表格实例不存在' };
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

    const result = doMergeCells(startRow, startCol, endRow, endCol, table);
    return { success: true, action: result.action, message: `${result.action === 'merge' ? '合并' : '拆分'}单元格成功` };
}

/**
 * 插入行（AI Agent 版本）
 * 在指定位置插入行，执行前自动备份单元格和行数据
 *
 * @param {Object} params - 参数对象
 * @param {number} params.position - 插入位置（行索引），从0开始
 * @param {number} [params.number=1] - 插入行数
 * @return {Object} 操作结果
 */
function insertRow({ position, number = 1 }) {
    const table = TableManager.get();
    if (!table) {
        return { success: false, message: '表格实例不存在' };
    }
    if (position < 0 || position > table.countRows()) {
        return { success: false, message: `插入位置无效: ${position}，有效范围 0-${table.countRows()}` };
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

    doInsertRow(table, position, number);
    return { success: true, message: `已在位置 ${position} 插入 ${number} 行` };
}

/**
 * 删除行（AI Agent 版本）
 * 删除指定范围的行，执行前自动备份所有相关数据
 *
 * @param {Object} params - 参数对象
 * @param {number} params.startRow - 起始行索引，从0开始
 * @param {number} params.endRow - 结束行索引，从0开始
 * @return {Object} 操作结果
 */
function deleteRow({ startRow, endRow }) {
    const table = TableManager.get();
    if (!table) {
        return { success: false, message: '表格实例不存在' };
    }
    const countRows = table.countRows();
    if (startRow < 0 || endRow >= countRows || startRow > endRow) {
        return { success: false, message: `行范围无效: ${startRow}-${endRow}，有效范围 0-${countRows - 1}` };
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

    doDeleteRow(table, startRow, endRow);
    return { success: true, message: `已删除行 ${startRow}-${endRow}` };
}

/**
 * 插入列（AI Agent 版本）
 * 在指定位置插入列，执行前自动备份单元格和列数据
 *
 * @param {Object} params - 参数对象
 * @param {number} params.position - 插入位置（列索引），从0开始
 * @param {number} [params.number=1] - 插入列数
 * @return {Object} 操作结果
 */
function insertCol({ position, number = 1 }) {
    const table = TableManager.get();
    if (!table) {
        return { success: false, message: '表格实例不存在' };
    }
    if (position < 0 || position > table.countCols()) {
        return { success: false, message: `插入位置无效: ${position}，有效范围 0-${table.countCols()}` };
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

    doInsertCol(table, position, number);
    return { success: true, message: `已在位置 ${position} 插入 ${number} 列` };
}

/**
 * 删除列（AI Agent 版本）
 * 删除指定范围的列，执行前自动备份所有相关数据
 *
 * @param {Object} params - 参数对象
 * @param {number} params.startCol - 起始列索引，从0开始
 * @param {number} params.endCol - 结束列索引，从0开始
 * @return {Object} 操作结果
 */
function deleteCol({ startCol, endCol }) {
    const table = TableManager.get();
    if (!table) {
        return { success: false, message: '表格实例不存在' };
    }
    const countCols = table.countCols();
    if (startCol < 0 || endCol >= countCols || startCol > endCol) {
        return { success: false, message: `列范围无效: ${startCol}-${endCol}，有效范围 0-${countCols - 1}` };
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

    doDeleteCol(table, startCol, endCol);
    return { success: true, message: `已删除列 ${startCol}-${endCol}` };
}

/**
 * 更新行定义（AI Agent 版本）
 * 更新指定行的定义数据（如高度等），执行前自动备份，执行后同步更新表格显示
 *
 * @param {Object} params - 参数对象
 * @param {number} params.rowNumber - 目标行号（从1开始）
 * @param {Object} params.row - 新的行定义对象，包含 height 等属性
 * @return {Object} 操作结果
 */
function updateRow({ rowNumber, row }) {
    const table = TableManager.get();
    if (!table) {
        return { success: false, message: '表格实例不存在' };
    }

    // 备份当前行数据
    const oldRowHeights = deepCopy(table.getSettings().rowHeights);
    const rowIndex = rowNumber - 1;

    pushBackup({
        description: `更新行 ${rowNumber} 定义`,
        type: 'updateRow',
        restore: function () {
            const t = TableManager.get();
            if (t) {
                t.updateSettings({ rowHeights: oldRowHeights, manualRowResize: oldRowHeights });
            }
            // 还原 Vuex 数据
            const oldHeight = oldRowHeights[rowIndex] ? Math.round(oldRowHeights[rowIndex] / 1.33) : undefined;
            if (oldHeight !== undefined) {
                doUpdateRow({ rowNumber, row: { rowNumber, height: oldHeight } });
            }
        }
    });

    // 1. 更新 Vuex store 数据
    doUpdateRow({ rowNumber, row });

    // 2. 同步更新 Handsontable 表格行高
    if (row && row.height !== undefined) {
        // reportDef 中 height 是 point 单位，Handsontable 使用 pixel 单位
        // 转换公式：pixel = point * 1.33
        const heightInPixel = Math.round(row.height * 1.33);

        const rowHeights = table.getSettings().rowHeights || [];
        // 确保 rowHeights 数组长度足够
        while (rowHeights.length <= rowIndex) {
            rowHeights.push(table.getSettings().defaultRowHeight || 23);
        }
        rowHeights[rowIndex] = heightInPixel;

        table.updateSettings({
            rowHeights: rowHeights,
            manualRowResize: rowHeights
        });
        table.render();
    }

    return { success: true, message: `已更新行 ${rowNumber} 定义` };
}

// ============ 列操作方法 ============

/**
 * 获取列数据（AI Agent 版本）
 * 直接调用 contextActions 的 getColumns 方法
 *
 * @param {Object} params - 参数对象
 * @param {number} [params.columnNumber] - 列号，不传则返回全部列
 * @return {Object|Array|null} 列数据
 */
function getColumns({ columnNumber } = {}) {
    return doGetColumns({ columnNumber });
}

/**
 * 设置全部列数据（AI Agent 版本）
 * 整体替换列数据列表，执行前自动备份
 *
 * @param {Object} params - 参数对象
 * @param {Array} params.columns - 列定义数组
 * @return {Object} 操作结果
 */
function setColumns({ columns }) {
    const table = TableManager.get();
    if (!table) {
        return { success: false, message: '表格实例不存在' };
    }

    // 备份当前列数据
    const oldColWidths = deepCopy(table.getSettings().colWidths);

    pushBackup({
        description: '整体替换列数据',
        type: 'setColumns',
        restore: function () {
            const t = TableManager.get();
            if (t) {
                t.updateSettings({ colWidths: oldColWidths });
            }
            // 还原 Vuex 数据需要重新获取原始列数据
        }
    });

    // 1. 更新 Vuex store 数据
    doSetColumns({ columns });

    // 2. 同步更新 Handsontable 表格列宽
    if (columns && columns.length > 0) {
        const colWidths = [];
        columns.forEach(col => {
            if (col.width !== undefined) {
                // reportDef 中 width 是 point 单位，Handsontable 使用 pixel 单位
                // 转换公式：pixel = point * 1.33
                colWidths.push(Math.round(col.width * 1.33));
            } else {
                colWidths.push(table.getSettings().defaultColWidth || 100);
            }
        });

        table.updateSettings({ colWidths: colWidths });
        table.render();
    }

    return { success: true, message: '已整体替换列数据' };
}

/**
 * 更新列定义（AI Agent 版本）
 * 更新指定列的定义数据（如宽度等），执行前自动备份，执行后同步更新表格显示
 *
 * @param {Object} params - 参数对象
 * @param {number} params.columnNumber - 目标列号（从1开始）
 * @param {Object} params.column - 新的列定义对象，包含 width 等属性
 * @return {Object} 操作结果
 */
function updateColumn({ columnNumber, column }) {
    const table = TableManager.get();
    if (!table) {
        return { success: false, message: '表格实例不存在' };
    }

    // 备份当前列数据
    const oldColWidths = deepCopy(table.getSettings().colWidths);
    const colIndex = columnNumber - 1;

    pushBackup({
        description: `更新列 ${columnNumber} 定义`,
        type: 'updateColumn',
        restore: function () {
            const t = TableManager.get();
            if (t) {
                t.updateSettings({ colWidths: oldColWidths });
            }
            // 还原 Vuex 数据
            const oldWidth = oldColWidths[colIndex] ? Math.round(oldColWidths[colIndex] / 1.33) : undefined;
            if (oldWidth !== undefined) {
                doUpdateColumn({ columnNumber, column: { columnNumber, width: oldWidth } });
            }
        }
    });

    // 1. 更新 Vuex store 数据
    doUpdateColumn({ columnNumber, column });

    // 2. 同步更新 Handsontable 表格列宽
    if (column && column.width !== undefined) {
        // reportDef 中 width 是 point 单位，Handsontable 使用 pixel 单位
        // 转换公式：pixel = point * 1.33
        const widthInPixel = Math.round(column.width * 1.33);

        const colWidths = table.getSettings().colWidths || [];
        // 确保 colWidths 数组长度足够
        while (colWidths.length <= colIndex) {
            colWidths.push(table.getSettings().defaultColWidth || 100);
        }
        colWidths[colIndex] = widthInPixel;

        table.updateSettings({ colWidths: colWidths });
        table.render();
    }

    return { success: true, message: `已更新列 ${columnNumber} 定义` };
}

/**
 * 数据节点备份方法
 * 备份当前修改的数据快照，用于后续异常还原
 * 限制最多保留最近20次备份记录
 *
 * @param {Object} params - 参数对象
 * @param {string} params.description - 备份描述，说明当前操作内容
 * @param {string} [params.type] - 备份数据类型标识
 * @return {Object} 备份结果，包含当前备份栈大小
 */
function backupData({ description, type } = {}) {
    const desc = description || '手动备份';
    const backupType = type || 'manual';

    const table = TableManager.get();
    if (!table) {
        return { success: false, message: '表格实例不存在，无法备份' };
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

    return { success: true, message: `已备份: ${desc}`, backupCount: getBackupCount() };
}

/**
 * 数据还原方法
 * 从备份栈中弹出最近一条备份数据并逐步还原
 * 类似撤销操作，只能一步步还原
 *
 * @param {Object} params - 参数对象（无需参数）
 * @return {Object} 还原结果
 */
function restoreData() {
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
 * @return {Object} 操作结果
 */
function clearBackupData() {
    clearBackup();
    return { success: true, message: '已清空备份栈' };
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
async function validateExpression({ expression }) {
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
 * @return {Promise<Object>} 预览结果，包含 data（fields、data、total、currentTotal）
 */
async function previewData({ sql, type, parameters, username, password, driver, url, name }) {
    if (!sql) {
        return { success: false, message: 'SQL不能为空' };
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
        const data = await apiPreviewData(params);
        return { success: true, data };
    } catch (error) {
        return { success: false, message: error.msg || '预览数据失败' };
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
async function buildFields({ sql, type, parameters, username, password, driver, url, name }) {
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
 * @param {string} [params.fileName] - 报表文件名，不含 .ureport.xml 后缀；不传则使用当前已打开的文件名
 * @return {Promise<Object>} 保存结果，包含 fileName
 */
async function saveReport({ fileName } = {}) {
    try {
        const context = getContext();
        if (!context) {
            return { success: false, message: '报表上下文不存在' };
        }
        const content = tableToXml(context);
        const name = fileName || store.getters['report/getFileName'];
        if (!name) {
            return { success: false, message: '报表文件名不能为空' };
        }
        const fullFileName = name.endsWith('.ureport.xml') ? name : name + '.ureport.xml';
        await apiSaveReportFile(fullFileName, content);
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
async function loadBuildinDatasources() {
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
async function testConnection({ username, password, driver, url }) {
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
async function loadBeanMethods({ beanId }) {
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
async function validateCondition({ expression }) {
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
function getReportSchema() {
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

export function getAgentMethodArgs() {
    return Object.values(agentMethodRegistry);
}
