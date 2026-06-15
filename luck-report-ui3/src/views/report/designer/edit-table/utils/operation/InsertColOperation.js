import {buildNewCellDef, resetTableData, setDirty, undoManager} from '@/utils/table.js';
import {showAlert} from '@/utils/comnon.js';
import {$t} from "@/locales";
import {addCell, getCell, getCellsMap, removeCell} from '@/utils/contextActions.js';
import {deepCopy} from '@/components/utils';

/**
 * 插入列
 * 在指定位置插入指定数量的列，同时调整单元格数据
 *
 * @param {Object} table - Handsontable 实例
 * @param {number} position - 插入位置（列索引，从0开始）
 * @param {number} number - 插入列数，默认1
 * @return {{ position: number, number: number, newColWidth: number }} 插入信息，用于撤销/还原
 */
export function insertCol(table, position, number = 1) {
    const defaultColWidth = 98;
    let colWidths = table.getSettings().colWidths;
    let newColWidths = colWidths.concat([]);
    for (let i = 0; i < number; i++) {
        newColWidths.splice(position, 0, defaultColWidth);
    }
    table.alter("insert_col", position, number);

    const cellsMap = getCellsMap();
    const changeCells = [];
    for (let cell of cellsMap.values()) {
        let colIndex = cell.columnNumber - 1;
        if (colIndex >= position) {
            changeCells.push(cell);
        }
    }
    for (let cell of changeCells) {
        removeCell(cell);
    }
    for (let cell of changeCells) {
        let newCell = deepCopy(cell);
        newCell.columnNumber = cell.columnNumber + number;
        addCell(newCell);
    }
    let countRows = table.countRows();
    for (let i = 0; i < number; i++) {
        for (let j = 0; j < countRows; j++) {
            let newCellDef = buildNewCellDef(j + 1, position + i + 1);
            addCell(newCellDef);
        }
    }
    table.updateSettings({
        colWidths: newColWidths,
        manualColumnResize: newColWidths
    });
    resetTableData(table);
    setDirty();

    return {position, number, newColWidth: defaultColWidth};
}

export function doInsertCol(left, number = 1) {
    const selected = this.getSelected();
    if (!selected) {
        showAlert($t('table.colTip'));
        return;
    }
    const [startRow, startCol, endRow, endCol] = selected[0];
    let position = startCol;
    if (startCol > endCol) {
        if (left) {
            position = endCol;
        } else {
            position = startCol + 1;
        }
    } else {
        if (left) {
            position = startCol;
        } else {
            position = endCol + 1;
        }
    }

    insertCol(this, position, number);

    const _this = this, removeCells = [];
    let removeColWidth = 98;
    const cellsMap = getCellsMap();
    undoManager.add({
        redo: function () {
            insertCol(_this, position, number);
        },
        undo: function () {
            removeCells.splice(0, removeCells.length);
            let colWidths = _this.getSettings().colWidths;
            let newColWidths = colWidths.concat([]);
            for (let i = 0; i < number; i++) {
                removeColWidth = newColWidths[position];
                newColWidths.splice(position, 1);
            }
            _this.alter('remove_col', position, number);
            _this.updateSettings({
                colWidths: newColWidths,
                manualColumnResize: newColWidths
            });
            let countRows = _this.countRows();
            for (let i = 0; i < number; i++) {
                for (let j = 0; j < countRows; j++) {
                    const cell = getCell(j, position);
                    if (cell) {
                        removeCell(cell);
                        removeCells.push(cell);
                    }
                }
            }
            let changeCells = [];
            for (let cell of cellsMap.values()) {
                let colIndex = cell.columnNumber - 1;
                if (colIndex > position) {
                    changeCells.push(cell);
                }
            }
            for (let cell of changeCells) {
                removeCell(cell);
            }
            for (let cell of changeCells) {
                let newCell = deepCopy(cell);
                newCell.columnNumber = cell.columnNumber - number;
                addCell(newCell);
            }

            setDirty();
        }
    });
}
