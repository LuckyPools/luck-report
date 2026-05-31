import {getCell, setCell} from "@/utils/contextActions";
import {deepCopy} from "@/components/utils";
import TableManager from "@/views/report/designer/edit-table/manager";
import {setDirty} from "@/utils/table";

/**
 * 读取指定坐标的单元格数据
 * 供 AI Agent 调用，接收参数对象以便通过 postMessage 传递
 *
 * @param {Object} params - 参数对象
 * @param {number} params.rowIndex - 单元格行坐标，从0开始
 * @param {number} params.colIndex - 单元格列坐标，从0开始
 * @return {Object|null} 单元格定义对象，不存在时返回 null
 */
export function readCellByAgent({ rowIndex, colIndex }) {
    const cellDef = getCell(rowIndex, colIndex);

    if (!cellDef) {
        console.log('单元格数据为空');
        return null;
    }

    const cellValue = cellDef && cellDef.value ? cellDef.value.value : '';
    console.log('单元格数据:', cellDef);
    console.log('单元格值:', cellValue);

    return cellDef;
}

/**
 * 设置指定坐标的单元格数据
 * 供 AI Agent 调用，接收参数对象以便通过 postMessage 传递
 *
 * @param {Object} params - 参数对象
 * @param {number} params.rowIndex - 单元格行坐标，从0开始
 * @param {number} params.colIndex - 单元格列坐标，从0开始
 * @param {string} params.cellValue - 要设置的单元格值
 */
export function setCellByAgent({ rowIndex, colIndex, cellValue }) {
    const cellDef = getCell(rowIndex, colIndex);
    const newCellDef = deepCopy(cellDef) || {};

    if (!newCellDef.value) {
        newCellDef.value = { type: 'simple', value: '' };
    }
    newCellDef.value.type = 'simple';
    newCellDef.value.value = cellValue;

    setCell(rowIndex, colIndex, newCellDef);

    const hot = TableManager.get();
    if (hot) {
        hot.setDataAtCell(rowIndex, colIndex, cellValue);
    }

    setDirty();
    console.log('已设置单元格数据为:', cellValue);
}

/**
 * 获取报表整体结构信息
 * 供 AI Agent 调用，返回行列数、合并单元格区域等概要信息
 *
 * @return {Object} 报表结构信息
 */
export function getReportSchema() {
    const hot = TableManager.get();
    if (!hot) {
        return { error: '报表编辑器未就绪' };
    }

    const rowCount = hot.countRows();
    const colCount = hot.countCols();
    const mergeCells = hot.getPlugin('mergeCells');

    const result = {
        rowCount,
        colCount,
        mergeCells: [],
        cellSummary: []
    };

    // 收集合并单元格信息
    if (mergeCells && mergeCells.mergedCellsCollection) {
        const merged = mergeCells.mergedCellsCollection.mergedCells;
        if (merged && Array.isArray(merged)) {
            result.mergeCells = merged.map(m => ({
                row: m.row,
                col: m.col,
                rowspan: m.rowspan,
                colspan: m.colspan
            }));
        }
    }

    // 收集非空单元格摘要（最多50个，避免数据过大）
    let count = 0;
    for (let r = 0; r < rowCount && count < 50; r++) {
        for (let c = 0; c < colCount && count < 50; c++) {
            const cellDef = getCell(r, c);
            if (cellDef && cellDef.value && cellDef.value.value) {
                result.cellSummary.push({
                    row: r,
                    col: c,
                    value: String(cellDef.value.value).substring(0, 100),
                    type: cellDef.value.type || 'simple'
                });
                count++;
            }
        }
    }

    return result;
}

/**
 * 合并指定区域的单元格
 * 供 AI Agent 调用
 *
 * @param {Object} params - 参数对象
 * @param {number} params.startRow - 起始行索引
 * @param {number} params.startCol - 起始列索引
 * @param {number} params.endRow - 结束行索引
 * @param {number} params.endCol - 结束列索引
 * @return {Object} 操作结果
 */
export function mergeCellsByAgent({ startRow, startCol, endRow, endCol }) {
    const hot = TableManager.get();
    if (!hot) {
        return { error: '报表编辑器未就绪' };
    }

    const mergeCells = hot.getPlugin('mergeCells');
    if (!mergeCells) {
        return { error: '合并单元格插件未启用' };
    }

    const rowspan = endRow - startRow + 1;
    const colspan = endCol - startCol + 1;

    mergeCells.merge(startRow, startCol, rowspan, colspan);
    setDirty();

    return { success: true, message: `已合并区域 (${startRow},${startCol}) 到 (${endRow},${endCol})` };
}

/**
 * 设置单元格样式
 * 供 AI Agent 调用
 *
 * @param {Object} params - 参数对象
 * @param {number} params.rowIndex - 行索引
 * @param {number} params.colIndex - 列索引
 * @param {string} params.styleType - 样式类型
 * @param {string} params.styleValue - 样式值
 * @return {Object} 操作结果
 */
export function setCellStyleByAgent({ rowIndex, colIndex, styleType, styleValue }) {
    const hot = TableManager.get();
    if (!hot) {
        return { error: '报表编辑器未就绪' };
    }

    const cellDef = getCell(rowIndex, colIndex);
    const newCellDef = deepCopy(cellDef) || {};

    if (!newCellDef.cellStyle) {
        newCellDef.cellStyle = {};
    }

    // 样式属性映射
    const styleMap = {
        fontSize: 'fontSize',
        fontFamily: 'fontFamily',
        bold: 'bold',
        italic: 'italic',
        underline: 'underline',
        fontColor: 'forecolor',
        bgColor: 'bgcolor',
        align: 'align',
        valign: 'valign'
    };

    const cssProp = styleMap[styleType];
    if (!cssProp) {
        return { error: `不支持的样式类型: ${styleType}` };
    }

    // 布尔值样式转换
    if (styleType === 'bold' || styleType === 'italic' || styleType === 'underline') {
        newCellDef.cellStyle[cssProp] = styleValue === 'true' || styleValue === true;
    } else {
        newCellDef.cellStyle[cssProp] = styleValue;
    }

    setCell(rowIndex, colIndex, newCellDef);
    hot.render();
    setDirty();

    return { success: true, message: `已设置 (${rowIndex},${colIndex}) 的 ${styleType} 为 ${styleValue}` };
}

/**
 * 插入行
 * 供 AI Agent 调用
 *
 * @param {Object} params - 参数对象
 * @param {number} params.rowIndex - 插入位置行索引
 * @param {number} params.count - 插入行数
 * @return {Object} 操作结果
 */
export function insertRowsByAgent({ rowIndex, count }) {
    const hot = TableManager.get();
    if (!hot) {
        return { error: '报表编辑器未就绪' };
    }

    hot.alter('insert_row_below', rowIndex, count);
    setDirty();

    return { success: true, message: `已在第 ${rowIndex} 行后插入 ${count} 行` };
}

/**
 * 插入列
 * 供 AI Agent 调用
 *
 * @param {Object} params - 参数对象
 * @param {number} params.colIndex - 插入位置列索引
 * @param {number} params.count - 插入列数
 * @return {Object} 操作结果
 */
export function insertColsByAgent({ colIndex, count }) {
    const hot = TableManager.get();
    if (!hot) {
        return { error: '报表编辑器未就绪' };
    }

    hot.alter('insert_col_right', colIndex, count);
    setDirty();

    return { success: true, message: `已在第 ${colIndex} 列后插入 ${count} 列` };
}
