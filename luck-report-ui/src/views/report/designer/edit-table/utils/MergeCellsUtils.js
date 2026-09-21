/**
 * 插入/删除行列时同步调整 Handsontable mergeCells。
 * 设计器保存合并信息依赖 getSettings().mergeCells，不能只靠插件内部集合。
 */

/**
 * 在指定行位置插入行后，计算新的 mergeCells。
 * @param {Array} mergeCells
 * @param {number} position 插入行索引（0-based）
 * @param {number} number 插入行数
 * @returns {Array}
 */
export function adjustMergeCellsOnInsertRow(mergeCells, position, number) {
    const result = [];
    for (const mergeItem of mergeCells || []) {
        const row = mergeItem.row;
        const rowspan = mergeItem.rowspan;
        const rowEnd = row + rowspan - 1;
        if (row >= position) {
            result.push({
                col: mergeItem.col,
                row: row + number,
                rowspan: mergeItem.rowspan,
                colspan: mergeItem.colspan
            });
        } else if (rowEnd >= position) {
            result.push({
                col: mergeItem.col,
                row: row,
                rowspan: rowspan + number,
                colspan: mergeItem.colspan
            });
        } else {
            result.push({
                col: mergeItem.col,
                row: mergeItem.row,
                rowspan: mergeItem.rowspan,
                colspan: mergeItem.colspan
            });
        }
    }
    return result;
}

/**
 * 在指定列位置插入列后，计算新的 mergeCells。
 * @param {Array} mergeCells
 * @param {number} position 插入列索引（0-based）
 * @param {number} number 插入列数
 * @returns {Array}
 */
export function adjustMergeCellsOnInsertCol(mergeCells, position, number) {
    const result = [];
    for (const mergeItem of mergeCells || []) {
        const col = mergeItem.col;
        const colspan = mergeItem.colspan;
        const colEnd = col + colspan - 1;
        if (col >= position) {
            result.push({
                col: col + number,
                row: mergeItem.row,
                rowspan: mergeItem.rowspan,
                colspan: mergeItem.colspan
            });
        } else if (colEnd >= position) {
            result.push({
                col: col,
                row: mergeItem.row,
                rowspan: mergeItem.rowspan,
                colspan: colspan + number
            });
        } else {
            result.push({
                col: mergeItem.col,
                row: mergeItem.row,
                rowspan: mergeItem.rowspan,
                colspan: mergeItem.colspan
            });
        }
    }
    return result;
}

/**
 * 深拷贝 mergeCells，供撤销恢复。
 * @param {Array} mergeCells
 * @returns {Array}
 */
export function cloneMergeCells(mergeCells) {
    return (mergeCells || []).map(item => Object.assign({}, item));
}
