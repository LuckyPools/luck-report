/**
 * 读取 A1 单元格数据
 * 打印并返回 A1 单元格（rowIndex=0, colIndex=0）的数据
 */
import {getCell, setCell} from "@/utils/contextActions";
import {deepCopy} from "@/components/utils";
import TableManager from "@/views/report/designer/edit-table/manager";
import {setDirty} from "@/utils/table";


export function readCellA1() {
    const rowIndex = 0;
    const colIndex = 0;
    const cellDef = getCell(rowIndex, colIndex);

    if (!cellDef) {
        console.log('A1 单元格数据为空');
        return null;
    }

    const cellValue = cellDef && cellDef.value ? cellDef.value.value : '';
    console.log('A1 单元格数据:', cellDef);
    console.log('A1 单元格值:', cellValue);

    return cellDef;
}
/**
 * 设置 A1 单元格数据
 * 将 A1 单元格的值设置为 "测试数据"
 */
export function setCellA1() {
    const rowIndex = 0;
    const colIndex = 0;
    const testValue = '测试数据';

    const cellDef = getCell(rowIndex, colIndex);
    const newCellDef = deepCopy(cellDef) || {};

    if (!newCellDef.value) {
        newCellDef.value = { type: 'simple', value: '' };
    }
    newCellDef.value.type = 'simple';
    newCellDef.value.value = testValue;

    setCell(rowIndex, colIndex, newCellDef);

    const hot = TableManager.get();
    if (hot) {
        hot.setDataAtCell(rowIndex, colIndex, testValue);
    }

    setDirty();
    console.log('已设置 A1 单元格数据为:', testValue);
}
