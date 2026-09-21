/**
 * Created by Jacky.Gao on 2017-02-17.
 */
import {buildNewCellDef, resetTableData, setDirty, undoManager} from '@/utils/table.js';
import {showAlert} from '@/utils/comnon.js';
import {$t} from "@/locales";
import {addCell, getCellsMap, removeCell} from '@/utils/contextActions.js';
import {deepCopy} from '@/components/utils';
import {shiftFreezeCols} from '../FreezeState.js';
import {
    adjustMergeCellsOnInsertCol,
    cloneMergeCells
} from '../MergeCellsUtils.js';

/**
 * 插入列操作
 */
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

    const cellsMap = getCellsMap();
    const savedCells = snapshotCellsFromCol(cellsMap, position);
    let colWidths = this.getSettings().colWidths;
    const oldColWidths = colWidths.concat([]);
    let mergeCells = this.getSettings().mergeCells || [];
    let oldMergeCells = cloneMergeCells(mergeCells);
    let newMergeCells = adjustMergeCellsOnInsertCol(mergeCells, position, number);
    let newColWidths = colWidths.concat([]);
    for (let i = 0; i < number; i++) {
        newColWidths.splice(position, 0, 98);
    }

    this.updateSettings({mergeCells: []});
    this.alter("insert_col", position, number);
    buildNewColCells(this, position, number);
    this.updateSettings({
        colWidths: newColWidths,
        manualColumnResize: newColWidths,
        mergeCells: newMergeCells
    });
    shiftFreezeCols(this, position, number, true);
    resetTableData(this);
    setDirty();

    const _this = this;
    undoManager.add({
        redo: function () {
            colWidths = _this.getSettings().colWidths;
            mergeCells = _this.getSettings().mergeCells || [];
            oldMergeCells = cloneMergeCells(mergeCells);
            newMergeCells = adjustMergeCellsOnInsertCol(mergeCells, position, number);
            newColWidths = colWidths.concat([]);
            for (let i = 0; i < number; i++) {
                newColWidths.splice(position, 0, 98);
            }
            _this.updateSettings({mergeCells: []});
            _this.alter("insert_col", position, number);
            buildNewColCells(_this, position, number);
            _this.updateSettings({
                colWidths: newColWidths,
                manualColumnResize: newColWidths,
                mergeCells: newMergeCells
            });
            shiftFreezeCols(_this, position, number, true);
            resetTableData(_this);
            setDirty();
        },
        undo: function () {
            _this.updateSettings({mergeCells: []});
            _this.alter('remove_col', position, number);
            restoreCellsFromCol(cellsMap, position, savedCells);
            _this.updateSettings({
                colWidths: oldColWidths,
                manualColumnResize: oldColWidths,
                mergeCells: oldMergeCells
            });
            shiftFreezeCols(_this, position, number, false);
            resetTableData(_this);
            setDirty();
        }
    });
};

function snapshotCellsFromCol(cellsMap, position) {
    const saved = [];
    for (let cell of cellsMap.values()) {
        if (cell.columnNumber - 1 >= position) {
            saved.push(deepCopy(cell));
        }
    }
    return saved;
}

function restoreCellsFromCol(cellsMap, position, savedCells) {
    const toRemove = [];
    for (let cell of cellsMap.values()) {
        if (cell.columnNumber - 1 >= position) {
            toRemove.push(cell);
        }
    }
    for (let cell of toRemove) {
        removeCell(cell);
    }
    for (let cell of savedCells) {
        addCell(deepCopy(cell));
    }
}

function buildNewColCells(hot, position, number) {
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
    const countRows = hot.countRows();
    for (let i = 0; i < number; i++) {
        for (let j = 0; j < countRows; j++) {
            let newCellDef = buildNewCellDef(j + 1, position + i + 1);
            addCell(newCellDef);
        }
    }
}
