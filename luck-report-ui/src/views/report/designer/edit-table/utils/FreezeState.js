/**
 * FreezeState：冻结行列锚点单元格名转换工具（纯函数）
 * 冻结状态存在 context.reportDef.paper.freezeRowCellName / freezeColCellName
 */
import { getContext } from '@/utils/contextActions';

/**
 * 列号（1-based）转列字母，Excel 标准 26 进制（A=1, Z=26, AA=27）
 * @param {number} colNum 列号
 * @return {string} 列字母字符串；colNum<=0 返回空串
 */
function colNumberToLetters(colNum) {
  if (colNum <= 0) return '';
  let n = colNum;
  let result = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    result = String.fromCharCode(65 + r) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

/**
 * 列字母转列号（1-based），colNumberToLetters 的逆运算
 * @param {string} letters 列字母（如 "A"、"AB"）
 * @return {number} 列号；非法字母返回 0
 */
function lettersToColNumber(letters) {
  if (!letters) return 0;
  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    const code = letters.charCodeAt(i);
    if (code < 65 || (code > 90 && code < 97) || code > 122) return 0;
    const val = code <= 90 ? code - 64 : code - 96;
    n = n * 26 + val;
  }
  return n;
}

/**
 * 冻结行数转行锚点单元格名（如 3 → "A3"）
 * @param {number} rowCount 冻结行数，0 表示不冻结
 * @return {string} 锚点单元格名；rowCount<=0 返回空串
 */
export function freezeRowToCellName(rowCount) {
  if (rowCount <= 0) return '';
  return 'A' + rowCount;
}

/**
 * 冻结列数转列锚点单元格名（如 3 → "C1"）
 * @param {number} colCount 冻结列数，0 表示不冻结
 * @return {string} 锚点单元格名；colCount<=0 返回空串
 */
export function freezeColToCellName(colCount) {
  if (colCount <= 0) return '';
  return colNumberToLetters(colCount) + '1';
}

/**
 * 从行锚点单元格名解析冻结行数（如 "A3" → 3）
 * @param {string|null|undefined} name 行锚点单元格名
 * @return {number} 冻结行数；空或无数字返回 0
 */
export function parseFreezeRowFromCellName(name) {
  if (!name) return 0;
  const m = /\d+$/.exec(name);
  return m ? parseInt(m[0], 10) : 0;
}

/**
 * 从列锚点单元格名解析冻结列数（如 "C1" → 3）
 * @param {string|null|undefined} name 列锚点单元格名
 * @return {number} 冻结列数；空或无字母返回 0
 */
export function parseFreezeColFromCellName(name) {
  if (!name) return 0;
  const m = /^[A-Za-z]+/.exec(name);
  return m ? lettersToColNumber(m[0]) : 0;
}

/**
 * 行结构变化（插入/删除行）后同步冻结行锚点到 handsontable fixedRowsTop
 * @param {object|null} hot handsontable 实例，可空
 * @param {number} position 插入/删除起始行索引（0-based）
 * @param {number} number 插入/删除行数
 * @param {boolean} isInsert true=插入行，false=删除行
 */
export function shiftFreezeRows(hot, position, number, isInsert) {
  const context = getContext();
  const paper = context && context.reportDef && context.reportDef.paper;
  if (!paper) return;
  const rowCount = parseFreezeRowFromCellName(paper.freezeRowCellName);
  if (rowCount <= 0) return;
  let newRow = rowCount;
  if (isInsert) {
    if (position < rowCount) {
      newRow = rowCount + number;
    }
  } else if (position < rowCount) {
    if (position + number <= rowCount) {
      newRow = rowCount - number;
    } else {
      newRow = position;
    }
  }
  if (newRow !== rowCount) {
    paper.freezeRowCellName = freezeRowToCellName(newRow);
    if (hot) {
      hot.updateSettings({ fixedRowsTop: newRow });
    }
  }
}

/**
 * 列结构变化（插入/删除列）后同步冻结列锚点到 handsontable fixedColumnsLeft
 * @param {object|null} hot handsontable 实例，可空
 * @param {number} position 插入/删除起始列索引（0-based）
 * @param {number} number 插入/删除列数
 * @param {boolean} isInsert true=插入列，false=删除列
 */
export function shiftFreezeCols(hot, position, number, isInsert) {
  const context = getContext();
  const paper = context && context.reportDef && context.reportDef.paper;
  if (!paper) return;
  const colCount = parseFreezeColFromCellName(paper.freezeColCellName);
  if (colCount <= 0) return;
  let newCol = colCount;
  if (isInsert) {
    if (position < colCount) {
      newCol = colCount + number;
    }
  } else if (position < colCount) {
    if (position + number <= colCount) {
      newCol = colCount - number;
    } else {
      newCol = position;
    }
  }
  if (newCol !== colCount) {
    paper.freezeColCellName = freezeColToCellName(newCol);
    if (hot) {
      hot.updateSettings({ fixedColumnsLeft: newCol });
    }
  }
}
