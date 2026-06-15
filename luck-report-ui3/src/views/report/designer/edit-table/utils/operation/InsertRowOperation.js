import {buildNewCellDef, resetTableData, setDirty, undoManager} from '@/utils/table.js';
import {renderRowHeader} from '@/views/report/designer/edit-table/utils/HeaderUtils.js';
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
 * 插入行
 * 在指定位置插入指定数量的行，同时调整单元格数据和行头信息
 *
 * @param {Object} table - Handsontable 实例
 * @param {number} position - 插入位置（行索引，从0开始）
 * @param {number} number - 插入行数，默认1
 * @return {{ position: number, number: number, newRowHeight: number }} 插入信息，用于撤销/还原
 */
export function insertRow(table, position, number = 1) {
    const defaultRowHeight = 25;
    let rowHeights = table.getSettings().rowHeights;
    let newRowHeights = rowHeights.concat([]);
    for (let i = 0; i < number; i++) {
        newRowHeights.splice(position, 0, defaultRowHeight);
    }
    table.alter("insert_row", position, number);
    adjustInsertRowHeaders(position);
    renderRowHeader(table);

    buildNewRowCells(table, position, number);
    table.updateSettings({
        rowHeights: newRowHeights,
        manualRowResize: newRowHeights
    });
    resetTableData(table);
    setDirty();

    return {position, number, newRowHeight: defaultRowHeight};
}

/**
 * 构建新行的单元格数据
 * 将 position 及之后的单元格行号下移 number 位，并在新位置创建空白单元格
 *
 * @param {Object} hot - Handsontable 实例
 * @param {number} position - 插入位置
 * @param {number} number - 插入行数
 */
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
}

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

    insertRow(this, position, number);

    const _this = this;
    const context = getContext();
    const cellsMap = context.cellsMap;
    const removeCells = [];
    let removeRowHeight = 25;
    undoManager.add({
        redo: function () {
            insertRow(_this, position, number);
        },
        undo: function () {
            removeCells.splice(0, removeCells.length);
            let rowHeights = _this.getSettings().rowHeights;
            let newRowHeights = rowHeights.concat([]);
            for (let i = 0; i < number; i++) {
                removeRowHeight = newRowHeights[position];
                newRowHeights.splice(position, 1);
            }
            _this.alter('remove_row', position, number);
            adjustDelRowHeaders(position);
            renderRowHeader(_this);
            _this.updateSettings({
                rowHeights: newRowHeights,
                manualRowResize: newRowHeights
            });
            let countCols = _this.countCols();
            for (let i = 0; i < number; i++) {
                for (let j = 0; j < countCols; j++) {
                    let cell = getCell(position, j);
                    if (cell) {
                        removeCells.push(cell);
                        removeCell(cell);
                    }
                }
            }
            let changeCells = [];
            for (let cell of cellsMap.values()) {
                let rowIndex = cell.rowNumber - 1;
                if (rowIndex > position) {
                    changeCells.push(cell);
                }
            }
            for (let cell of changeCells) {
                removeCell(cell);
            }
            for (let cell of changeCells) {
                cell.rowNumber = cell.rowNumber - number;
                addCell(cell);
            }
            setDirty();
        }
    });
}
