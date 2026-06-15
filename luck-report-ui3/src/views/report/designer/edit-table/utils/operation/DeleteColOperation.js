import {resetTableData, setDirty, undoManager} from '@/utils/table.js';
import {showAlert} from '@/utils/comnon.js';
import {$t} from "@/locales";
import {addCell, getCell, getContext, removeCell} from "@/utils/contextActions";
import {deepCopy} from '@/components/utils';

/**
 * 删除列
 * 删除指定范围内的列，同时调整单元格数据、合并单元格配置
 *
 * @param {Object} table - Handsontable 实例
 * @param {number} startCol - 起始列索引（从0开始）
 * @param {number} endCol - 结束列索引（从0开始）
 * @return {{ startCol: number, endCol: number, dif: number, oldColWidths: Array, oldMergeCells: Array, removedCells: Array }} 删除信息，用于撤销/还原
 */
export function deleteCol(table, startCol, endCol) {
    const context = getContext();
    let colWidths = table.getSettings().colWidths, mergeCells = table.getSettings().mergeCells;
    let oldMergeCells = [];
    let newMergeCells = mergeCells.concat([]);
    for (let mergeItem of mergeCells) {
        oldMergeCells.push(Object.assign({}, mergeItem));
        let col = mergeItem.col, colspan = mergeItem.colspan;
        let colEnd = col + colspan - 1;
        let index = newMergeCells.indexOf(mergeItem);
        if (col >= startCol && colEnd <= endCol) {
            newMergeCells.splice(index, 1);
        } else if (col <= startCol && colEnd >= endCol) {
            let span = endCol - startCol + 1;
            let leftSpan = colspan - span;
            if (leftSpan === 0) {
                leftSpan = 1;
            }
            if (leftSpan === 1 && mergeItem.rowspan === 1) {
                newMergeCells.splice(index, 1);
            } else {
                newMergeCells[index] = {
                    col: col,
                    row: mergeItem.row,
                    rowspan: mergeItem.rowspan,
                    colspan: leftSpan
                };
            }
        } else if (col > endCol) {
            let totalCols = endCol - startCol + 1;
            newMergeCells[index] = {
                row: mergeItem.row,
                col: col - totalCols,
                rowspan: mergeItem.rowspan,
                colspan: mergeItem.colspan
            };
        }
    }
    table.updateSettings({mergeCells: []});
    let dif = endCol - startCol + 1;
    let oldColWidths = colWidths.concat([]);
    let newColWidths = colWidths.concat([]);
    newColWidths.splice(startCol, dif);
    let countRows = table.countRows(), removedCells = [];
    for (let i = endCol; i >= startCol; i--) {
        table.alter('remove_col', i);
        for (let j = 0; j < countRows; j++) {
            let cell = getCell(j, i);
            if (cell) {
                removedCells.push(deepCopy(cell));
                removeCell(cell);
            }
        }
    }
    let cellsMap = context.cellsMap, changeCells = [];
    for (let cell of cellsMap.values()) {
        let colIndex = cell.columnNumber - 1;
        if (colIndex >= endCol) {
            changeCells.push(cell);
        }
    }
    for (let cell of changeCells) {
        removeCell(cell);
    }
    for (let cell of changeCells) {
        let newCell = deepCopy(cell);
        newCell.columnNumber = cell.columnNumber - dif;
        addCell(newCell);
    }
    table.updateSettings({colWidths: newColWidths, mergeCells: newMergeCells});
    resetTableData(table);
    setDirty();

    return {startCol, endCol, dif, oldColWidths, oldMergeCells, removedCells};
}

export function doDeleteCol() {
    const selected = this.getSelected();
    const context = getContext();
    if (!selected) {
        showAlert($t('table.colTip'));
        return;
    }
    let [startRow, startCol, endRow, endCol] = selected[0];
    if (endCol < startCol) {
        let tempStartCol = startCol;
        startCol = endCol;
        endCol = tempStartCol;
    }

    const result = deleteCol(this, startCol, endCol);

    const _this = this;
    const {dif, oldColWidths, oldMergeCells, removedCells} = result;
    const cellsMap = context.cellsMap;
    undoManager.add({
        redo: function () {
            deleteCol(_this, startCol, endCol);
        },
        undo: function () {
            for (let i = endCol; i >= startCol; i--) {
                _this.alter('insert_col', i);
            }
            let changeCells = [];
            for (let cell of cellsMap.values()) {
                let colIndex = cell.columnNumber - 1;
                if (colIndex >= startCol) {
                    changeCells.push(cell);
                }
            }
            for (let cell of changeCells) {
                removeCell(cell);
            }
            for (let cell of changeCells) {
                let newCell = deepCopy(cell);
                newCell.columnNumber = cell.columnNumber + dif;
                addCell(newCell);
            }
            for (let cell of removedCells) {
                addCell(cell);
            }
            _this.updateSettings({colWidths: oldColWidths, mergeCells: oldMergeCells});
            setDirty();
        }
    })
}
