import {getCell, setCell} from "@/utils/contextActions";
import {deepCopy} from "@/components/utils";
import TableManager from "@/views/report/designer/edit-table/manager";
import {setDirty} from "@/utils/table";

/**
 * 读取指定坐标的单元格数据
 * 供 AI Agent 调用，接收参数对象以便通过 postMessage 传递
 *
 * @param {Object} params - 参数对象
 * @param {number} params.rowIndex - 单元格行坐标，从0开始
 * @param {number} params.colIndex - 单元格列坐标，从0开始
 * @return {Object|null} 单元格定义对象，不存在时返回 null
 */
export function readCellByAgent({ rowIndex, colIndex }) {
    const cellDef = getCell(rowIndex, colIndex);

    if (!cellDef) {
        console.log('单元格数据为空');
        return null;
    }

    const cellValue = cellDef && cellDef.value ? cellDef.value.value : '';
    console.log('单元格数据:', cellDef);
    console.log('单元格值:', cellValue);

    return cellDef;
}

/**
 * 设置指定坐标的单元格数据
 * 供 AI Agent 调用，接收参数对象以便通过 postMessage 传递
 *
 * @param {Object} params - 参数对象
 * @param {number} params.rowIndex - 单元格行坐标，从0开始
 * @param {number} params.colIndex - 单元格列坐标，从0开始
 * @param {string} params.cellValue - 要设置的单元格值
 */
export function setCellByAgent({ rowIndex, colIndex, cellValue }) {
    const cellDef = getCell(rowIndex, colIndex);
    const newCellDef = deepCopy(cellDef) || {};

    if (!newCellDef.value) {
        newCellDef.value = { type: 'simple', value: '' };
    }
    newCellDef.value.type = 'simple';
    newCellDef.value.value = cellValue;

    setCell(rowIndex, colIndex, newCellDef);

    const hot = TableManager.get();
    if (hot) {
        hot.setDataAtCell(rowIndex, colIndex, cellValue);
    }

    setDirty();
    console.log('已设置单元格数据为:', cellValue);
}
