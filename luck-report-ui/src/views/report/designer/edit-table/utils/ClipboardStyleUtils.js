/**
 * Ctrl+C/V 时附带复制单元格样式（系统剪贴板只有文本，样式走内存缓存）。
 */
import { deepCopy } from '@/components/utils';
import { getCell, setCell } from '@/utils/contextActions';

/** @type {{ styles: Array<Array>, data: Array<Array>, rowCount: number, colCount: number } | null} */
let clipboardBuffer = null;

/** 粘贴前选区，与 populateValues 起点一致 */
let pasteSelectionHint = null;

const DEFAULT_CELL_STYLE = {
  fontSize: 10,
  forecolor: '0,0,0',
  fontFamily: '宋体',
  align: 'center',
  valign: 'middle'
};

export function isEditorOpened(hot) {
  const editor = hot && hot.getActiveEditor && hot.getActiveEditor();
  return !!(editor && editor.isOpened && editor.isOpened());
}

/**
 * 复制/剪切前：若仍在编辑，先提交，避免 HT 跳过 copy 导致系统剪贴板仍是旧内容。
 */
export function commitEditorIfOpened(hot) {
  if (!hot) {
    return false;
  }
  if (isEditorOpened(hot)) {
    hot.getActiveEditor().finishEditing();
    return true;
  }
  return false;
}

/**
 * 复制前把选区 simple 单元格的 cellsMap 值写回 Handsontable。
 */
export function syncSelectionFromCellsMap(hot) {
  if (!hot) {
    return 0;
  }
  const selected = hot.getSelected();
  if (!selected || !selected.length) {
    return 0;
  }
  const [r1, c1, r2, c2] = selected[0];
  const startRow = Math.min(r1, r2);
  const endRow = Math.max(r1, r2);
  const startCol = Math.min(c1, c2);
  const endCol = Math.max(c1, c2);
  const changes = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cell = getCell(row, col);
      if (!cell || !cell.value || cell.value.type !== 'simple') {
        continue;
      }
      const next = cell.value.value == null ? '' : String(cell.value.value);
      const current = hot.getDataAtCell(row, col);
      const currentText = current == null ? '' : String(current);
      if (currentText !== next) {
        changes.push([row, col, next]);
      }
    }
  }
  if (changes.length) {
    hot.setDataAtCell(changes, 'CellsMap.sync');
  }
  return changes.length;
}

/**
 * 焦点是否在表格外的输入框。属性面板等处的复制不能被表格抢走。
 */
export function isForeignTextInput(hot, element) {
  if (!element || !hot) {
    return false;
  }
  if (element.id === 'HandsontableCopyPaste' || (element.classList && element.classList.contains('copyPaste'))) {
    return false;
  }
  const root = hot.rootElement;
  if (root && root.contains(element)) {
    return false;
  }
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || element.isContentEditable === true;
}

/**
 * 表格有选区且不在编辑时，强制走 Handsontable 复制。
 * 复制用的 textarea 挂在 document.body 上，Ctrl+C 经常到不了表格，系统剪贴板就会留着旧内容。
 * @returns {boolean} 是否已接管
 */
export function forceTableCopy(hot, action) {
  if (!hot || !hot.getSelectedLast()) {
    return false;
  }
  if (isEditorOpened(hot)) {
    return false;
  }
  const plugin = hot.getPlugin && hot.getPlugin('CopyPaste');
  if (!plugin || (plugin.isEnabled && !plugin.isEnabled())) {
    return false;
  }
  syncSelectionFromCellsMap(hot);
  if (action === 'cut' && plugin.cut) {
    plugin.cut();
  } else if (plugin.copy) {
    plugin.copy();
  } else {
    return false;
  }
  return true;
}

/**
 * 复制/剪切后缓存选区样式，维度与 rangedData 一致。
 */
export function captureClipboardStyles(ranges, rangedData) {
  pasteSelectionHint = null;
  if (!ranges || !ranges.length || !rangedData || !rangedData.length) {
    clipboardBuffer = null;
    return;
  }
  const copyableRows = [];
  const copyableColumns = [];
  for (const range of ranges) {
    for (let row = range.startRow; row <= range.endRow; row++) {
      if (copyableRows.indexOf(row) === -1) {
        copyableRows.push(row);
      }
    }
    for (let col = range.startCol; col <= range.endCol; col++) {
      if (copyableColumns.indexOf(col) === -1) {
        copyableColumns.push(col);
      }
    }
  }
  const styles = [];
  for (const row of copyableRows) {
    const rowStyles = [];
    for (const col of copyableColumns) {
      const cell = getCell(row, col);
      rowStyles.push(cell && cell.cellStyle ? deepCopy(cell.cellStyle) : null);
    }
    styles.push(rowStyles);
  }
  clipboardBuffer = {
    styles,
    data: rangedData.map(row => (row ? row.slice() : [])),
    rowCount: styles.length,
    colCount: styles[0] ? styles[0].length : 0
  };
}

/**
 * 粘贴前记录选区（此时尚未被 selectCell 改写）。
 */
export function rememberPasteSelection(hot) {
  pasteSelectionHint = hot && hot.getSelectedLast ? hot.getSelectedLast() : null;
}

/**
 * 粘贴后仅当内容与最近一次设计器复制完全一致时才套样式。
 * 记事本等外部复制不会命中，避免沿用上一轮单元格样式。
 * @returns {boolean} 是否应用了样式
 */
export function applyClipboardStylesOnPaste(hot, inputArray) {
  if (!hot || !clipboardBuffer || !clipboardBuffer.styles.length || !inputArray || !inputArray.length) {
    return false;
  }
  if (!isSameMatrix(clipboardBuffer.data, inputArray)) {
    return false;
  }

  const selection = pasteSelectionHint || hot.getSelectedLast();
  pasteSelectionHint = null;
  if (!selection) {
    return false;
  }

  const area = resolvePasteArea(selection, inputArray);
  const styleRows = clipboardBuffer.rowCount;
  const styleCols = clipboardBuffer.colCount;

  let applied = false;
  for (let row = area.startRow, styleRow = 0; row <= area.endRow; row++) {
    for (let col = area.startCol, styleCol = 0; col <= area.endCol; col++) {
      const style = clipboardBuffer.styles[styleRow][styleCol];
      const cell = getCell(row, col);
      if (cell) {
        const newCell = deepCopy(cell);
        newCell.cellStyle = style ? deepCopy(style) : Object.assign({}, DEFAULT_CELL_STYLE);
        setCell(row, col, newCell);
        applied = true;
      }
      styleCol = styleCol === styleCols - 1 ? 0 : styleCol + 1;
    }
    styleRow = styleRow === styleRows - 1 ? 0 : styleRow + 1;
  }
  return applied;
}

function isSameMatrix(a, b) {
  if (!a || !b || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!a[i] || !b[i] || a[i].length !== b[i].length) {
      return false;
    }
    for (let j = 0; j < a[i].length; j++) {
      const left = a[i][j] == null ? '' : String(a[i][j]);
      const right = b[i][j] == null ? '' : String(b[i][j]);
      if (left !== right) {
        return false;
      }
    }
  }
  return true;
}

function resolvePasteArea(selection, inputArray) {
  const startRow = Math.min(selection[0], selection[2]);
  const startCol = Math.min(selection[1], selection[3]);
  const dataMaxRow = inputArray.length - 1;
  const dataMaxCol = inputArray[0].length - 1;
  const endRow = Math.max(selection[0], selection[2], dataMaxRow + startRow);
  const endCol = Math.max(selection[1], selection[3], dataMaxCol + startCol);
  return { startRow, startCol, endRow, endCol };
}
