import {addCell, getCell} from "@/utils/contextActions";
import {buildNewCellDef} from '@/utils/table.js';

/**
 * 合并/拆分单元格核心逻辑
 * 检查选中区域内是否存在已合并的单元格，存在则拆分，否则执行合并
 *
 * @param {number} startRow - 起始行索引（从0开始）
 * @param {number} startCol - 起始列索引（从0开始）
 * @param {number} endRow - 结束行索引（从0开始）
 * @param {number} endCol - 结束列索引（从0开始）
 * @param {Object} table - Handsontable 实例
 * @return {{ action: string, mergeCells: Array }} action 为 'merge' 或 'split'，mergeCells 为更新后的合并配置
 */
export function doMergeCells(startRow, startCol, endRow, endCol, table) {
    let doMerge = true, doSplit = false;
    const mergeCells = table.getSettings().mergeCells || [];

    for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
            let td = table.getCell(i, j);
            if (!td) {
                continue;
            }
            let colSpan = td.colSpan || 1;
            let rowSpan = td.rowSpan || 1;

            if (colSpan > 1 || rowSpan > 1) {
                let index = 0;
                doSplit = true;
                doMerge = false;

                while (index < mergeCells.length) {
                    let mergeItem = mergeCells[index];
                    let row = mergeItem.row, col = mergeItem.col;
                    if (row === i && col === j) {
                        mergeCells.splice(index, 1);
                        break;
                    }
                    index++;
                }
            }
        }
    }

    if (doMerge) {
        if (endRow < startRow) {
            let tmp = startRow;
            startRow = endRow;
            endRow = tmp;
        }
        if (endCol < startCol) {
            let tmp = startCol;
            startCol = endCol;
            endCol = tmp;
        }

        let rowSpan = endRow - startRow, colSpan = endCol - startCol;
        rowSpan = rowSpan === 0 ? 1 : rowSpan + 1;
        colSpan = colSpan === 0 ? 1 : colSpan + 1;

        const newMergeItem = {row: startRow, col: startCol, rowspan: rowSpan, colspan: colSpan};
        mergeCells.push(newMergeItem);
    } else if (doSplit) {
        for (let i = startRow; i <= endRow; i++) {
            for (let j = startCol; j <= endCol; j++) {
                let cellDef = getCell(i, j);
                if (!cellDef) {
                    cellDef = buildNewCellDef(i + 1, j + 1);
                    addCell(cellDef);
                }
            }
        }
    }

    table.updateSettings({mergeCells});

    return {
        action: doMerge ? 'merge' : (doSplit ? 'split' : 'none'),
        mergeCells
    };
}
