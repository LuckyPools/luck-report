/**
 * Created by Jacky.Gao on 2017-02-17.
 */
import {buildNewCellDef, resetTableData, setDirty, undoManager} from '@/utils/table.js';
import {renderRowHeader} from '@/views/report/designer/edit-table/utils/HeaderUtils.js';
import {$t} from "@/locales";
import {showAlert} from "@/utils/comnon";
import {
    addCell,
    adjustDelRowHeaders,
    adjustInsertRowHeaders,
    getContext,
    removeCell
} from "@/utils/contextActions";
import {deepCopy} from '@/components/utils';
import {shiftFreezeRows} from '../FreezeState.js';
import {
    adjustMergeCellsOnInsertRow,
    cloneMergeCells
} from '../MergeCellsUtils.js';

export function doInsertRow(above, number = 1) {
    const selected = this.getSelected();
    if (!selected) {
        showAlert($t('table.rowTip')).then(r => {
        });
        return;
    }
    const [startRow, startCol, endRow, endCol] = selected[0];
    let position = startRow;
    if (startRow > endRow) {
        if (above) {
            position = endRow;
        } else {
            position = startRow + 1;
        }
    } else {
        if (above) {
            position = startRow;
        } else {
            position = endRow + 1;
        }
    }

    const context = getContext();
    const cellsMap = context.cellsMap;
    // 插入前快照：撤销时整段还原，避免按行号反推与合并区错位
    const savedCells = snapshotCellsFromRow(cellsMap, position);
    let rowHeights = this.getSettings().rowHeights;
    const oldRowHeights = rowHeights.concat([]);
    let mergeCells = this.getSettings().mergeCells || [];
    let oldMergeCells = cloneMergeCells(mergeCells);
    let newMergeCells = adjustMergeCellsOnInsertRow(mergeCells, position, number);
    let newRowHeights = rowHeights.concat([]);
    for (let i = 0; i < number; i++) {
        newRowHeights.splice(position, 0, 25);
    }

    this.updateSettings({mergeCells: []});
    this.alter("insert_row", position, number);
    adjustInsertRowHeaders(position, number);
    renderRowHeader(this);

    buildNewRowCells(this, position, number);
    this.updateSettings({
        rowHeights: newRowHeights,
        manualRowResize: newRowHeights,
        mergeCells: newMergeCells
    });
    shiftFreezeRows(this, position, number, true);
    resetTableData(this);
    setDirty();

    const _this = this;
    undoManager.add({
        redo: function () {
            rowHeights = _this.getSettings().rowHeights;
            mergeCells = _this.getSettings().mergeCells || [];
            oldMergeCells = cloneMergeCells(mergeCells);
            newMergeCells = adjustMergeCellsOnInsertRow(mergeCells, position, number);
            newRowHeights = rowHeights.concat([]);
            for (let i = 0; i < number; i++) {
                newRowHeights.splice(position, 0, 25);
            }
            _this.updateSettings({mergeCells: []});
            _this.alter("insert_row", position, number);
            adjustInsertRowHeaders(position, number);
            renderRowHeader(_this);
            buildNewRowCells(_this, position, number);
            _this.updateSettings({
                rowHeights: newRowHeights,
                manualRowResize: newRowHeights,
                mergeCells: newMergeCells
            });
            shiftFreezeRows(_this, position, number, true);
            resetTableData(_this);
            setDirty();
        },
        undo: function () {
            _this.updateSettings({mergeCells: []});
            _this.alter('remove_row', position, number);
            for (let i = 0; i < number; i++) {
                adjustDelRowHeaders(position + i);
            }
            adjustInsertRowHeaders(position, -number);
            renderRowHeader(_this);
            restoreCellsFromRow(cellsMap, position, savedCells);
            _this.updateSettings({
                rowHeights: oldRowHeights,
                manualRowResize: oldRowHeights,
                mergeCells: oldMergeCells
            });
            shiftFreezeRows(_this, position, number, false);
            resetTableData(_this);
            setDirty();
        }
    });
};

/**
 * 保存从指定行起的单元格深拷贝，供撤销还原。
 */
function snapshotCellsFromRow(cellsMap, position) {
    const saved = [];
    for (let cell of cellsMap.values()) {
        if (cell.rowNumber - 1 >= position) {
            saved.push(deepCopy(cell));
        }
    }
    return saved;
}

/**
 * 删除 position 及以下的现有单元格，再写回插入前快照。
 */
function restoreCellsFromRow(cellsMap, position, savedCells) {
    const toRemove = [];
    for (let cell of cellsMap.values()) {
        if (cell.rowNumber - 1 >= position) {
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

function buildNewRowCells(hot, position, number) {
    const countCols = hot.countCols();
    const context = getContext();
    const cellsMap = context.cellsMap;
    const changeCells = [];
    for (let cell of cellsMap.values()) {
        let rowIndex = cell.rowNumber - 1;
        if (rowIndex >= position) {
            changeCells.push(cell);
        }
    }
    for (let cell of changeCells) {
        removeCell(cell);
    }
    for (let cell of changeCells) {
        let newCell = deepCopy(cell);
        newCell.rowNumber = cell.rowNumber + number;
        addCell(newCell);
    }
    for (let i = 0; i < number; i++) {
        for (let j = 0; j < countCols; j++) {
            let newCellDef = buildNewCellDef(position + i + 1, (j + 1));
            addCell(newCellDef);
        }
    }
};
