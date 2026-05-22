// report模块 - 管理报表设计器的状态
const state = {
  context: null,
  fileName: '',
  saveBtnDisable: true,
  // 报表是否已保存
  saveStatus: false,
  // 打印线是否显示
  showPrintLine: true,
  // 打印先是否刷新
  printLineShouldRefresh: false,
};

const mutations = {
  // 设置报表上下文
  SET_CONTEXT(state, context) {
    state.context = context;
  },

  // ============ CellsMap 操作 ============

  // 添加单元格
  CONTEXT_ADD_CELL(state, { cell }) {
    if (state.context && state.context.cellsMap) {
      const key = `${cell.rowNumber},${cell.columnNumber}`;
      state.context.cellsMap.set(key, cell);
    }
  },

  // 移除单元格
  CONTEXT_REMOVE_CELL(state, { cell }) {
    if (state.context && state.context.cellsMap) {
      const key = `${cell.rowNumber},${cell.columnNumber}`;
      state.context.cellsMap.delete(key);
    }
  },

  // 设置单元格（按行列号）
  CONTEXT_SET_CELL(state, { rowIndex, colIndex, cell }) {
    if (state.context && state.context.cellsMap) {
      const key = `${rowIndex},${colIndex}`;
      state.context.cellsMap.set(key, cell);
    }
  },

  // 删除单元格（按行列号）
  CONTEXT_DELETE_CELL(state, { rowNumber, columnNumber }) {
    if (state.context && state.context.cellsMap) {
      const key = `${rowNumber},${columnNumber}`;
      state.context.cellsMap.delete(key);
    }
  },

  // ============ RowHeaders 操作 ============

  // 添加行头
  CONTEXT_ADD_ROW_HEADER(state, { row, band }) {
    if (state.context && state.context.rowHeaders) {
      let targetHeader = null;
      for (let header of state.context.rowHeaders) {
        if (header.rowNumber === row) {
          targetHeader = header;
          break;
        }
      }
      if (targetHeader) {
        targetHeader.band = band;
      } else {
        state.context.rowHeaders.push({ band, rowNumber: row });
      }
    }
  },

  // 调整插入行头
  CONTEXT_ADJUST_INSERT_ROW_HEADERS(state, { row }) {
    if (state.context && state.context.rowHeaders) {
      for (let header of state.context.rowHeaders) {
        if (header.rowNumber >= row) {
          header.rowNumber += 1;
        }
      }
    }
  },

  // 调整删除行头
  CONTEXT_ADJUST_DEL_ROW_HEADERS(state, { row }) {
    if (state.context && state.context.rowHeaders) {
      let targetHeader = null;
      for (let header of state.context.rowHeaders) {
        if (header.rowNumber === row) {
          targetHeader = header;
          break;
        }
      }
      if (targetHeader) {
        const index = state.context.rowHeaders.indexOf(targetHeader);
        state.context.rowHeaders.splice(index, 1);
      }
    }
  },

  // ============ 批量操作 ============

  // ============ 其他 ============

  // 更新 context.reportDef
  CONTEXT_UPDATE_REPORT_DEF(state, { reportDef }) {
    if (state.context) {
      Object.assign(state.context.reportDef, reportDef);
    }
  },

  // 更新 context 的任意属性（用于扩展）
  CONTEXT_UPDATE_PROPERTY(state, { property, value }) {
    if (state.context) {
      state.context[property] = value;
    }
  },

  // 清除上下文
  CLEAR_CONTEXT(state) {
    state.context = null;
  },

  // 设置文件名
  SET_FILE_NAME(state, fileName) {
    state.fileName = fileName;
  },

  // 设置保存按钮状态
  SET_SAVE_BTN_DISABLE(state, disable) {
    state.saveBtnDisable = disable;
  },

  // 设置报表保存状态
  SET_SAVE_STATUS(state, saveStatus) {
    state.saveStatus = saveStatus;
  },

  SET_PRINT_LINE_SHOULD_REFRESH(state, shouldRefresh) {
    state.printLineShouldRefresh = shouldRefresh;
  },

  /**
   * 设置打印线显示状态
   * @param {Object} state - Vuex状态对象
   * @param {boolean} showPrintLine - 是否显示打印线
   */
  SET_SHOW_PRINT_LINE(state, showPrintLine) {
    state.showPrintLine = showPrintLine;
  }
};

const actions = {
  // 设置上下文的 Action
  setContext({ commit }, context) {
    commit('SET_CONTEXT', context);
  },

  // ============ CellsMap 操作的 Actions ============

  // 添加单元格
  contextAddCell({ commit }, cell) {
    commit('CONTEXT_ADD_CELL', { cell });
  },

  // 移除单元格
  contextRemoveCell({ commit }, cell) {
    commit('CONTEXT_REMOVE_CELL', { cell });
  },

  // 设置单元格
  contextSetCell({ commit }, { rowIndex, colIndex, cell }) {
    commit('CONTEXT_SET_CELL', { rowIndex, colIndex, cell });
  },

  // 删除单元格
  contextDeleteCell({ commit }, { rowNumber, columnNumber }) {
    commit('CONTEXT_DELETE_CELL', { rowNumber, columnNumber });
  },

  // ============ RowHeaders 操作的 Actions ============

  // 添加行头
  contextAddRowHeader({ commit }, { row, band }) {
    commit('CONTEXT_ADD_ROW_HEADER', { row, band });
  },

  // 调整插入行头
  contextAdjustInsertRowHeaders({ commit }, { row }) {
    commit('CONTEXT_ADJUST_INSERT_ROW_HEADERS', { row });
  },

  // 调整删除行头
  contextAdjustDelRowHeaders({ commit }, { row }) {
    commit('CONTEXT_ADJUST_DEL_ROW_HEADERS', { row });
  },

  // ============ 批量操作 ============

  // ============ 其他 Actions ============

  // 更新 context.reportDef
  contextUpdateReportDef({ commit }, reportDef) {
    commit('CONTEXT_UPDATE_REPORT_DEF', { reportDef });
  },

  // 更新 context 的任意属性
  contextUpdateProperty({ commit }, { property, value }) {
    commit('CONTEXT_UPDATE_PROPERTY', { property, value });
  },

  // 清除上下文的 Action
  clearContext({ commit }) {
    commit('CLEAR_CONTEXT');
  },

  // 设置文件名的 Action
  setFileName({ commit }, fileName) {
    let suffix= '.ureport.xml';
    let pos = fileName.indexOf(suffix);
    if(pos>-1){
      fileName = fileName.substring(0,pos);
    }
    fileName = decodeURI(fileName);
    commit('SET_FILE_NAME', fileName);
  },

  // 设置保存按钮状态的 Action
  setSaveBtnDisable({ commit }, disable) {
    commit('SET_SAVE_BTN_DISABLE', disable);
  },

  // 设置报表保存状态的 Action
  setSaveStatus({ commit }, saveStatus) {
    commit('SET_SAVE_STATUS', saveStatus);
  },

  setPrintLineShouldRefresh({ commit }, shouldRefresh) {
    commit('SET_PRINT_LINE_SHOULD_REFRESH', shouldRefresh);
  },

  /**
   * 设置打印线显示状态
   * @param {Object} param0 - Vuex上下文对象
   * @param {boolean} showPrintLine - 是否显示打印线
   */
  setShowPrintLine({ commit }, showPrintLine) {
    commit('SET_SHOW_PRINT_LINE', showPrintLine);
  }
};

const getters = {
  // 获取上下文
  getContext: state => state.context,

  // 检查是否有上下文
  hasContext: state => !!state.context,

  // 获取文件名
  getFileName: state => state.fileName,

  // 获取保存按钮状态
  getSaveBtnDisable: state => state.saveBtnDisable,

  // 获取报表保存状态
  getSaveStatus: state => state.saveStatus,

  // 打印线是否需要刷新
  getPrintLineShouldRefresh: state => state.printLineShouldRefresh,

  // 获取打印线显示状态
  getShowPrintLine: state => state.showPrintLine
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};
