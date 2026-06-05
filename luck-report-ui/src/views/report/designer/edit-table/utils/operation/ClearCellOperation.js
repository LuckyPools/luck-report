import {setDirty, undoManager} from '@/utils/table.js';
import {$t} from "@/locales";
import {showAlert} from "@/utils/comnon";
import {addCell, getCell, removeCell} from "@/utils/contextActions";
import Handsontable from 'handsontable';
import TableManager from '../../manager.js';

/**
 * 清空单元格内容
 * 将指定区域内的单元格内容清空，保留样式不变
 *
 * @param {number} startRow - 起始行索引，从0开始
 * @param {number} endRow - 结束行索引，从0开始
 * @param {number} startCol - 起始列索引，从0开始
 * @param {number} endCol - 结束列索引，从0开始
 * @return {Map<string, Object>} 被清空的单元格旧值映射，key为"row,col"，value为旧值对象
 */
export function doCleanContent(startRow, endRow, startCol, endCol) {
    let removeCellsMap = cleanCells(startRow, endRow, startCol, endCol, 'content');
    undoManager.add({
        redo: function () {
            removeCellsMap = cleanCells(startRow, endRow, startCol, endCol, 'content');
        },
        undo: function () {
            undoCleanCells(startRow, endRow, startCol, endCol, removeCellsMap, 'content');
        }
    });
    return removeCellsMap;
}

/**
 * 清空单元格样式
 * 将指定区域内的单元格样式重置为默认样式，保留内容不变
 *
 * @param {number} startRow - 起始行索引，从0开始
 * @param {number} endRow - 结束行索引，从0开始
 * @param {number} startCol - 起始列索引，从0开始
 * @param {number} endCol - 结束列索引，从0开始
 * @return {Map<string, Object>} 被清空的单元格旧样式映射，key为"row,col"，value为旧样式对象
 */
export function doCleanStyle(startRow, endRow, startCol, endCol) {
    let removeCellsMap = cleanCells(startRow, endRow, startCol, endCol, 'style');
    undoManager.add({
        redo: function () {
            removeCellsMap = cleanCells(startRow, endRow, startCol, endCol, 'style');
        },
        undo: function () {
            undoCleanCells(startRow, endRow, startCol, endCol, removeCellsMap, 'style');
        }
    });
    return removeCellsMap;
}

/**
 * 清空单元格全部（内容+样式）
 * 将指定区域内的单元格内容和样式全部清空，重置为默认空白单元格
 *
 * @param {number} startRow - 起始行索引，从0开始
 * @param {number} endRow - 结束行索引，从0开始
 * @param {number} startCol - 起始列索引，从0开始
 * @param {number} endCol - 结束列索引，从0开始
 * @return {Map<string, Object>} 被清空的单元格旧数据映射，key为"row,col"，value为旧单元格对象
 */
export function doCleanAll(startRow, endRow, startCol, endCol) {
    let removeCellsMap = cleanCells(startRow, endRow, startCol, endCol, 'all');
    undoManager.add({
        redo: function () {
            removeCellsMap = cleanCells(startRow, endRow, startCol, endCol, 'all');
        },
        undo: function () {
            undoCleanCells(startRow, endRow, startCol, endCol, removeCellsMap, 'all');
        }
    });
    return removeCellsMap;
}

/**
 * 清空单元格核心方法
 * 根据类型清空指定区域内的单元格内容、样式或全部
 *
 * @param {number} startRow - 起始行索引，从0开始
 * @param {number} endRow - 结束行索引，从0开始
 * @param {number} startCol - 起始列索引，从0开始
 * @param {number} endCol - 结束列索引，从0开始
 * @param {'content'|'style'|'all'} type - 清空类型：content=仅内容，style=仅样式，all=全部
 * @return {Map<string, Object>} 被清空的数据映射，用于撤销还原
 */
export function cleanCells(startRow, endRow, startCol, endCol, type) {
    let removeCellsMap = new Map(), hot = TableManager.get();
    for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
            let cell = getCell(i, j);
            if (!cell) {
                continue;
            }
            cell.cellStyle.format = null;
            let key = cell.rowNumber + "," + cell.columnNumber;
            if (type === 'content') {
                removeCellsMap.set(key, cell.value);
                cell.value = {
                    type: 'simple',
                    value: ''
                };
                cell.expand = 'None';
                cell.conditionPropertyItems = null;
                hot.setDataAtCell(i, j, '');
            } else if (type === 'style') {
                removeCellsMap.set(key, cell.cellStyle);
                cell.cellStyle = {fontSize: 10, forecolor: '0,0,0', fontFamily: '宋体', align: 'center', valign: 'middle'};
            } else if (type === 'all') {
                removeCell(cell);
                removeCellsMap.set(key, cell);
                let newCell = {
                    rowNumber: cell.rowNumber,
                    columnNumber: cell.columnNumber,
                    expand: 'None',
                    value: {
                        type: 'simple',
                        value: ''
                    },
                    cellStyle: {fontSize: 10, forecolor: '0,0,0', fontFamily: '宋体', align: 'center', valign: 'middle'}
                };
                addCell(newCell);
                hot.setDataAtCell(i, j, '');
            }
        }
    }
    Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);
    hot.render();
    return removeCellsMap;
}

/**
 * 撤销清空单元格操作
 * 根据类型还原被清空的单元格内容、样式或全部
 *
 * @param {number} startRow - 起始行索引，从0开始
 * @param {number} endRow - 结束行索引，从0开始
 * @param {number} startCol - 起始列索引，从0开始
 * @param {number} endCol - 结束列索引，从0开始
 * @param {Map<string, Object>} removeCellsMap - 清空时保存的旧数据映射
 * @param {'content'|'style'|'all'} type - 清空类型：content=仅内容，style=仅样式，all=全部
 */
export function undoCleanCells(startRow, endRow, startCol, endCol, removeCellsMap, type) {
    const hot = TableManager.get();
    for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
            let cell = getCell(i, j);
            if (!cell) {
                continue;
            }
            let key = cell.rowNumber + "," + cell.columnNumber;
            if (type === 'content') {
                let orgValue = removeCellsMap.get(key);
                if (!orgValue) {
                    showAlert($t('table.contextMenu.cancelConetntFail'));
                    return;
                }
                cell.value = orgValue;
                let value = cell.value;
                let valueType = value.type;
                let text = value.value;
                if (valueType === 'dataset') {
                    text = value.datasetName + "." + value.aggregate + "(" + value.property + ")";
                }
                hot.setDataAtCell(i, j, text);
            } else if (type === 'style') {
                let orgStyle = removeCellsMap.get(key);
                if (!orgStyle) {
                    showAlert($t('table.contextMenu.cancelStyleFail'));
                    return;
                }
                cell.cellStyle = orgStyle;
            } else if (type === 'all') {
                removeCell(cell);
                let orgCell = removeCellsMap.get(key);
                if (!orgCell) {
                    showAlert($t('table.contextMenu.cancelClearFail'));
                    return;
                }
                addCell(orgCell);
                let value = orgCell.value;
                let valueType = value.type;
                let text = value.value;
                if (valueType === 'dataset') {
                    text = value.datasetName + "." + value.aggregate + "(" + value.property + ")";
                }
                hot.setDataAtCell(i, j, text);
            }
        }
    }
    Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);
    hot.render();
}
