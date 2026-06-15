import {resetTableData, setDirty, undoManager} from '@/utils/table.js';
import {renderRowHeader} from '../HeaderUtils.js';
import {$t} from "@/locales";
import {showAlert} from "@/utils/comnon";
import {
    addCell,
    adjustDelRowHeaders,
    adjustInsertRowHeaders,
    getCell,
    getContext,
    removeCell
} from "@/utils/contextActions";
import {deepCopy} from '@/components/utils';

/**
 * 删除行
 * 删除指定范围内的行，同时调整单元格数据、合并单元格配置和行头信息
 *
 * @param {Object} table - Handsontable 实例
 * @param {number} startRow - 起始行索引（从0开始）
 * @param {number} endRow - 结束行索引（从0开始）
 * @return {{ startRow: number, endRow: number, dif: number, oldRowHeights: Array, oldMergeCells: Array, removedCells: Array }} 删除信息，用于撤销/还原
 */
export function deleteRow(table, startRow, endRow) {
    const context = getContext();
    let rowHeights = table.getSettings().rowHeights, mergeCells = table.getSettings().mergeCells;
    let oldMergeCells = [];
    let newMergeCells = mergeCells.concat([]);
    for (let mergeItem of mergeCells) {
        oldMergeCells.push(Object.assign({}, mergeItem));
        let row = mergeItem.row, rowspan = mergeItem.rowspan;
        let rowEnd = row + rowspan - 1;
        let index = newMergeCells.indexOf(mergeItem);
        if (row >= startRow && rowEnd <= endRow) {
            newMergeCells.splice(index, 1);
        } else if (row <= startRow && rowEnd >= endRow) {
            let span = endRow - startRow + 1;
            let leftSpan = rowspan - span;
            if (leftSpan === 0) {
                leftSpan = 1;
            }
            if (leftSpan === 1 && mergeItem.colspan === 1) {
                newMergeCells.splice(index, 1);
            } else {
                newMergeCells[index] = {
                    col: mergeItem.col,
                    row: row,
                    rowspan: leftSpan,
                    colspan: mergeItem.colspan
                };
            }
        } else if (row > endRow) {
            let totalRows = endRow - startRow + 1;
            newMergeCells[index] = {
                col: mergeItem.col,
                row: row - totalRows,
                rowspan: mergeItem.rowspan,
                colspan: mergeItem.colspan
            };
        }
    }
    table.updateSettings({mergeCells: []});
    let dif = endRow - startRow + 1;
    let oldRowHeights = rowHeights.concat([]);
    let newRowHeights = rowHeights.concat([]);
    newRowHeights.splice(startRow, dif);
    let countCols = table.countCols(), removedCells = [];
    for (let i = endRow; i >= startRow; i--) {
        for (let j = 0; j < countCols; j++) {
            let cell = getCell(i, j);
            if (cell) {
                removedCells.push(deepCopy(cell));
                removeCell(cell);
            }
        }
        table.alter('remove_row', i);
        adjustDelRowHeaders(i);
    }
    renderRowHeader(table);
    let cellsMap = context.cellsMap, changeCells = [];
    for (let cell of cellsMap.values()) {
        let rowIndex = cell.rowNumber - 1;
        if (rowIndex >= endRow) {
            changeCells.push(cell);
        }
    }
    for (let cell of changeCells) {
        removeCell(cell);
    }
    for (let cell of changeCells) {
        let newCell = deepCopy(cell);
        newCell.rowNumber = cell.rowNumber - dif;
        addCell(newCell);
    }
    table.updateSettings({rowHeights: newRowHeights, mergeCells: newMergeCells});
    resetTableData(table);
    setDirty();

    return {startRow, endRow, dif, oldRowHeights, oldMergeCells, removedCells};
}

export function doDeleteRow() {
    const selected = this.getSelected();
    const context = getContext();
    if (!selected) {
        showAlert($t('table.rowTip')).then(r => {
        });
        return;
    }
    let [startRow, startCol, endRow, endCol] = selected[0];
    if (endRow < startRow) {
        let tempStartRow = startRow;
        startRow = endRow;
        endRow = tempStartRow;
    }

    const result = deleteRow(this, startRow, endRow);

    const _this = this;
    const {dif, oldRowHeights, oldMergeCells, removedCells} = result;
    const cellsMap = context.cellsMap;
    undoManager.add({
        redo: function () {
            deleteRow(_this, startRow, endRow);
        },
        undo: function () {
            for (let i = endRow; i >= startRow; i--) {
                _this.alter('insert_row', i);
                adjustInsertRowHeaders(i);
            }
            renderRowHeader(_this);
            let changeCells = [];
            for (let cell of cellsMap.values()) {
                let rowIndex = cell.rowNumber - 1;
                if (rowIndex >= startRow) {
                    changeCells.push(cell);
                }
            }
            for (let cell of changeCells) {
                removeCell(cell);
            }
            for (let cell of changeCells) {
                let newCell = deepCopy(cell);
                newCell.rowNumber = cell.rowNumber + dif;
                addCell(newCell);
            }
            for (let cell of removedCells) {
                addCell(cell);
            }
            _this.updateSettings({rowHeights: oldRowHeights, mergeCells: oldMergeCells});
            setDirty();
        }
    })
}
