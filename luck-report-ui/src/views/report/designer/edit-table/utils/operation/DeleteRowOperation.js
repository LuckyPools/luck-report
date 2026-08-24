/**
 * Created by Jacky.Gao on 2017-02-17.
 */
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
import {shiftFreezeRows} from '../FreezeState.js';

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
    let rowHeights = this.getSettings().rowHeights, mergeCells = this.getSettings().mergeCells;
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
    this.updateSettings({mergeCells: []});
    let dif = endRow - startRow + 1;
    let oldRowHeights = rowHeights.concat([]);
    let newRowHeights = rowHeights.concat([]);
    newRowHeights.splice(startRow, dif);
    let countCols = this.countCols(), removeCells = [];
    for (let i = endRow; i >= startRow; i--) {
        for (let j = 0; j < countCols; j++) {
            let cell = getCell(i, j);
            if (cell) {
                removeCell(cell);
                removeCells.push(cell);
            }
        }
        this.alter('remove_row', i);
        adjustDelRowHeaders(i);
    }
    renderRowHeader(this);
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
    this.updateSettings({rowHeights: newRowHeights, mergeCells: newMergeCells});
    shiftFreezeRows(this, startRow, dif, false);
    resetTableData(this);
    setDirty();

    const _this = this;
    undoManager.add({
        redo: function () {
            rowHeights = _this.getSettings().rowHeights, mergeCells = _this.getSettings().mergeCells;
            oldMergeCells = [];
            newMergeCells = mergeCells.concat([]);
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
            _this.updateSettings({mergeCells: []});
            oldRowHeights = rowHeights.concat([]);
            newRowHeights = rowHeights.concat([]);
            newRowHeights.splice(startRow, dif);
            countCols = _this.countCols();
            removeCells.splice(0, removeCells.length);
            for (let i = endRow; i >= startRow; i--) {
                for (let j = 0; j < countCols; j++) {
                    let cell = getCell(i, j);
                    if (cell) {
                        removeCell(cell);
                        removeCells.push(cell);
                    }
                }
                _this.alter('remove_row', i);
                adjustDelRowHeaders(i);
            }
            renderRowHeader(_this);
            changeCells.splice(0, changeCells.length);
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
            _this.updateSettings({rowHeights: newRowHeights, mergeCells: newMergeCells});
            shiftFreezeRows(_this, startRow, dif, false);
            resetTableData(_this);
            setDirty();
        },
        undo: function () {
            for (let i = endRow; i >= startRow; i--) {
                _this.alter('insert_row', i);
                adjustInsertRowHeaders(i);
            }
            renderRowHeader(_this);
            changeCells.splice(0, changeCells.length);
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
            for (let cell of removeCells) {
                addCell(cell);
            }
            _this.updateSettings({rowHeights: oldRowHeights, mergeCells: oldMergeCells});
            shiftFreezeRows(_this, startRow, dif, true);
            resetTableData(_this);
            setDirty();
        }
    })
}
