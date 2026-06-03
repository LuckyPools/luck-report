// report模块 - 管理报表设计器的状态
const state = {
  context: null,
  // 报表名称
  fileName: '',
  // 禁用保存按钮
  disableSaveBtn: true,
  // 报表是否已保存
  isSaved: false,
  // 打印线是否显示
  showPrintLine: true,
  // 打印线是否需要刷新
  isPrintLineRefresh: false,
  // 单元格是否需要更新
  isCellUpdate: false,
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

  // ============ Datasource 操作 ============

  /**
   * 设置全部数据源
   * @param {Object} state - Vuex状态对象
   * @param {Object} payload - 载荷
   * @param {Array} payload.datasources - 数据源数组
   */
  CONTEXT_SET_DATASOURCES(state, { datasources }) {
    if (state.context && state.context.reportDef) {
      state.context.reportDef.datasources = datasources;
    }
  },

  /**
   * 添加数据源
   * @param {Object} state - Vuex状态对象
   * @param {Object} payload - 载荷
   * @param {Object} payload.datasource - 数据源定义对象
   */
  CONTEXT_ADD_DATASOURCE(state, { datasource }) {
    if (state.context && state.context.reportDef && state.context.reportDef.datasources) {
      state.context.reportDef.datasources.push(datasource);
    }
  },

  /**
   * 更新数据源（按name匹配替换）
   * @param {Object} state - Vuex状态对象
   * @param {Object} payload - 载荷
   * @param {string} payload.name - 目标数据源名称
   * @param {Object} payload.datasource - 新的数据源定义对象
   */
  CONTEXT_UPDATE_DATASOURCE(state, { name, datasource }) {
    if (state.context && state.context.reportDef && state.context.reportDef.datasources) {
      const index = state.context.reportDef.datasources.findIndex(ds => ds.name === name);
      if (index > -1) {
        state.context.reportDef.datasources.splice(index, 1, datasource);
      }
    }
  },

  /**
   * 删除数据源（按name匹配）
   * @param {Object} state - Vuex状态对象
   * @param {Object} payload - 载荷
   * @param {string} payload.name - 要删除的数据源名称
   */
  CONTEXT_REMOVE_DATASOURCE(state, { name }) {
    if (state.context && state.context.reportDef && state.context.reportDef.datasources) {
      const index = state.context.reportDef.datasources.findIndex(ds => ds.name === name);
      if (index > -1) {
        state.context.reportDef.datasources.splice(index, 1);
      }
    }
  },

  // ============ Dataset 操作 ============

  /**
   * 添加数据集到指定数据源
   * @param {Object} state - Vuex状态对象
   * @param {Object} payload - 载荷
   * @param {string} payload.datasourceName - 目标数据源名称
   * @param {Object} payload.dataset - 数据集定义对象
   */
  CONTEXT_ADD_DATASET(state, { datasourceName, dataset }) {
    if (state.context && state.context.reportDef && state.context.reportDef.datasources) {
      const ds = state.context.reportDef.datasources.find(ds => ds.name === datasourceName);
      if (ds) {
        if (!ds.datasets) {
          ds.datasets = [];
        }
        ds.datasets.push(dataset);
      }
    }
  },

  /**
   * 更新指定数据源下的数据集（按datasetName匹配替换）
   * @param {Object} state - Vuex状态对象
   * @param {Object} payload - 载荷
   * @param {string} payload.datasourceName - 目标数据源名称
   * @param {string} payload.datasetName - 目标数据集名称
   * @param {Object} payload.dataset - 新的数据集定义对象
   */
  CONTEXT_UPDATE_DATASET(state, { datasourceName, datasetName, dataset }) {
    if (state.context && state.context.reportDef && state.context.reportDef.datasources) {
      const ds = state.context.reportDef.datasources.find(ds => ds.name === datasourceName);
      if (ds && ds.datasets) {
        const index = ds.datasets.findIndex(dt => dt.name === datasetName);
        if (index > -1) {
          ds.datasets.splice(index, 1, dataset);
        }
      }
    }
  },

  /**
   * 删除指定数据源下的数据集（按datasetName匹配）
   * @param {Object} state - Vuex状态对象
   * @param {Object} payload - 载荷
   * @param {string} payload.datasourceName - 目标数据源名称
   * @param {string} payload.datasetName - 要删除的数据集名称
   */
  CONTEXT_REMOVE_DATASET(state, { datasourceName, datasetName }) {
    if (state.context && state.context.reportDef && state.context.reportDef.datasources) {
      const ds = state.context.reportDef.datasources.find(ds => ds.name === datasourceName);
      if (ds && ds.datasets) {
        const index = ds.datasets.findIndex(dt => dt.name === datasetName);
        if (index > -1) {
          ds.datasets.splice(index, 1);
        }
      }
    }
  },

  // ============ SearchForm 操作 ============

  /**
   * 设置表单设计数据（整体替换）
   * @param {Object} state - Vuex状态对象
   * @param {Object} payload - 载荷
   * @param {Object} payload.searchForm - 表单设计对象
   */
  CONTEXT_SET_SEARCH_FORM(state, { searchForm }) {
    if (state.context && state.context.reportDef) {
      state.context.reportDef.searchForm = searchForm;
    }
  },

  // ============ Paper 操作 ============

  /**
   * 更新页面配置（合并更新）
   * @param {Object} state - Vuex状态对象
   * @param {Object} payload - 载荷
   * @param {Object} payload.paper - 要合并的页面配置属性
   */
  CONTEXT_UPDATE_PAPER(state, { paper }) {
    if (state.context && state.context.reportDef && state.context.reportDef.paper) {
      Object.assign(state.context.reportDef.paper, paper);
    }
  },

  // ============ Row 操作 ============

  /**
   * 设置全部行数据
   * @param {Object} state - Vuex状态对象
   * @param {Object} payload - 载荷
   * @param {Array} payload.rows - 行定义数组
   */
  CONTEXT_SET_ROWS(state, { rows }) {
    if (state.context && state.context.reportDef) {
      state.context.reportDef.rows = rows;
    }
  },

  /**
   * 更新行（按rowNumber匹配替换）
   * @param {Object} state - Vuex状态对象
   * @param {Object} payload - 载荷
   * @param {number} payload.rowNumber - 目标行号
   * @param {Object} payload.row - 新的行定义对象
   */
  CONTEXT_UPDATE_ROW(state, { rowNumber, row }) {
    if (state.context && state.context.reportDef && state.context.reportDef.rows) {
      const index = state.context.reportDef.rows.findIndex(r => r.rowNumber === rowNumber);
      if (index > -1) {
        state.context.reportDef.rows.splice(index, 1, row);
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
  SET_DISABLE_SAVE_BTN(state, disable) {
    state.disableSaveBtn = disable;
  },

  // 设置报表保存状态
  SET_IS_SAVED(state, isSaved) {
    state.isSaved = isSaved;
  },

  SET_IS_PRINT_LINE_REFRESH(state, isRefresh) {
    state.isPrintLineRefresh = isRefresh;
  },

  /**
   * 设置打印线显示状态
   * @param {Object} state - Vuex状态对象
   * @param {boolean} showPrintLine - 是否显示打印线
   */
  SET_SHOW_PRINT_LINE(state, showPrintLine) {
    state.showPrintLine = showPrintLine;
  },

  /**
   * 设置单元格更新状态
   * @param {Object} state - Vuex状态对象
   * @param {boolean} isCellUpdate - 是否需要更新单元格
   */
  SET_CELL_UPDATE(state, isCellUpdate) {
    state.isCellUpdate = isCellUpdate;
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

  // ============ Datasource 操作的 Actions ============

  /**
   * 设置全部数据源
   * @param {Object} param0 - Vuex上下文对象
   * @param {Array} datasources - 数据源数组
   */
  contextSetDatasources({ commit }, datasources) {
    commit('CONTEXT_SET_DATASOURCES', { datasources });
  },

  /**
   * 添加数据源
   * @param {Object} param0 - Vuex上下文对象
   * @param {Object} datasource - 数据源定义对象
   */
  contextAddDatasource({ commit }, datasource) {
    commit('CONTEXT_ADD_DATASOURCE', { datasource });
  },

  /**
   * 更新数据源（按name匹配替换）
   * @param {Object} param0 - Vuex上下文对象
   * @param {Object} payload - 载荷
   * @param {string} payload.name - 目标数据源名称
   * @param {Object} payload.datasource - 新的数据源定义对象
   */
  contextUpdateDatasource({ commit }, { name, datasource }) {
    commit('CONTEXT_UPDATE_DATASOURCE', { name, datasource });
  },

  /**
   * 删除数据源（按name匹配）
   * @param {Object} param0 - Vuex上下文对象
   * @param {string} name - 要删除的数据源名称
   */
  contextRemoveDatasource({ commit }, name) {
    commit('CONTEXT_REMOVE_DATASOURCE', { name });
  },

  // ============ Dataset 操作的 Actions ============

  /**
   * 添加数据集到指定数据源
   * @param {Object} param0 - Vuex上下文对象
   * @param {Object} payload - 载荷
   * @param {string} payload.datasourceName - 目标数据源名称
   * @param {Object} payload.dataset - 数据集定义对象
   */
  contextAddDataset({ commit }, { datasourceName, dataset }) {
    commit('CONTEXT_ADD_DATASET', { datasourceName, dataset });
  },

  /**
   * 更新指定数据源下的数据集
   * @param {Object} param0 - Vuex上下文对象
   * @param {Object} payload - 载荷
   * @param {string} payload.datasourceName - 目标数据源名称
   * @param {string} payload.datasetName - 目标数据集名称
   * @param {Object} payload.dataset - 新的数据集定义对象
   */
  contextUpdateDataset({ commit }, { datasourceName, datasetName, dataset }) {
    commit('CONTEXT_UPDATE_DATASET', { datasourceName, datasetName, dataset });
  },

  /**
   * 删除指定数据源下的数据集
   * @param {Object} param0 - Vuex上下文对象
   * @param {Object} payload - 载荷
   * @param {string} payload.datasourceName - 目标数据源名称
   * @param {string} payload.datasetName - 要删除的数据集名称
   */
  contextRemoveDataset({ commit }, { datasourceName, datasetName }) {
    commit('CONTEXT_REMOVE_DATASET', { datasourceName, datasetName });
  },

  // ============ SearchForm 操作的 Actions ============

  /**
   * 设置表单设计数据（整体替换）
   * @param {Object} param0 - Vuex上下文对象
   * @param {Object} searchForm - 表单设计对象
   */
  contextSetSearchForm({ commit }, searchForm) {
    commit('CONTEXT_SET_SEARCH_FORM', { searchForm });
  },

  // ============ Paper 操作的 Actions ============

  /**
   * 更新页面配置（合并更新）
   * @param {Object} param0 - Vuex上下文对象
   * @param {Object} paper - 要合并的页面配置属性
   */
  contextUpdatePaper({ commit }, paper) {
    commit('CONTEXT_UPDATE_PAPER', { paper });
  },

  // ============ Row 操作的 Actions ============

  /**
   * 设置全部行数据
   * @param {Object} param0 - Vuex上下文对象
   * @param {Array} rows - 行定义数组
   */
  contextSetRows({ commit }, rows) {
    commit('CONTEXT_SET_ROWS', { rows });
  },

  /**
   * 更新行（按rowNumber匹配替换）
   * @param {Object} param0 - Vuex上下文对象
   * @param {Object} payload - 载荷
   * @param {number} payload.rowNumber - 目标行号
   * @param {Object} payload.row - 新的行定义对象
   */
  contextUpdateRow({ commit }, { rowNumber, row }) {
    commit('CONTEXT_UPDATE_ROW', { rowNumber, row });
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
  setDisableSaveBtn({ commit }, disable) {
    commit('SET_DISABLE_SAVE_BTN', disable);
  },

  // 设置报表保存状态的 Action
  setIsSaved({ commit }, isSaved) {
    commit('SET_IS_SAVED', isSaved);
  },

  setIsPrintLineRefresh({ commit }, shouldRefresh) {
    commit('SET_IS_PRINT_LINE_REFRESH', shouldRefresh);
  },

  /**
   * 设置打印线显示状态
   * @param {Object} param0 - Vuex上下文对象
   * @param {boolean} showPrintLine - 是否显示打印线
   */
  setShowPrintLine({ commit }, showPrintLine) {
    commit('SET_SHOW_PRINT_LINE', showPrintLine);
  },

  /**
   * 设置单元格更新状态
   * @param {Object} param0 - Vuex上下文对象
   * @param {boolean} isCellUpdate - 是否需要更新单元格
   */
  setCellUpdate({ commit }, isCellUpdate) {
    commit('SET_CELL_UPDATE', isCellUpdate);
  },

  /**
   * 触发单元格更新（设置isCellUpdate为true，编辑器监听后会自动重置为false）
   * @param {Object} param0 - Vuex上下文对象
   */
  triggerCellUpdate({ commit }) {
    commit('SET_CELL_UPDATE', true);
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
  getSaveBtnDisable: state => state.disableSaveBtn,

  // 获取报表保存状态
  getSaveStatus: state => state.isSaved,

  // 打印线是否需要刷新
  getPrintLineShouldRefresh: state => state.isPrintLineRefresh,

  // 获取打印线显示状态
  getShowPrintLine: state => state.showPrintLine,

  // 获取单元格更新状态
  getIsCellUpdate: state => state.isCellUpdate,

  // ============ Datasource Getters ============

  /**
   * 获取数据源数据
   * @param {string} [name] - 数据源名称，不提供则返回全部数据源
   * @returns {Object|Array|null} 提供name返回单个数据源对象，不提供返回数据源数组，context不存在时返回null/[]
   */
  getDatasources: state => (name) => {
    if (!state.context || !state.context.reportDef || !state.context.reportDef.datasources) {
      return name ? null : [];
    }
    if (name) {
      return state.context.reportDef.datasources.find(ds => ds.name === name) || null;
    }
    return state.context.reportDef.datasources;
  },

  // ============ Dataset Getters ============

  /**
   * 获取数据集数据
   * @param {string} [datasourceName] - 数据源名称，不提供则返回所有数据源下的数据集
   * @param {string} [datasetName] - 数据集名称，需配合datasourceName使用
   * @returns {Object|Array|null} 返回数据集对象或数组，context不存在时返回null/[]
   */
  getDatasets: state => (datasourceName, datasetName) => {
    if (!state.context || !state.context.reportDef || !state.context.reportDef.datasources) {
      return (datasourceName || datasetName) ? null : [];
    }
    if (datasourceName) {
      const ds = state.context.reportDef.datasources.find(ds => ds.name === datasourceName);
      if (!ds || !ds.datasets) {
        return datasetName ? null : [];
      }
      if (datasetName) {
        return ds.datasets.find(dt => dt.name === datasetName) || null;
      }
      return ds.datasets;
    }
    const result = [];
    for (const ds of state.context.reportDef.datasources) {
      if (ds.datasets) {
        if (datasetName) {
          const found = ds.datasets.find(dt => dt.name === datasetName);
          if (found) {
            result.push({ datasourceName: ds.name, dataset: found });
          }
        } else {
          for (const dt of ds.datasets) {
            result.push({ datasourceName: ds.name, dataset: dt });
          }
        }
      }
    }
    return result;
  },

  // ============ SearchForm Getters ============

  /**
   * 获取表单设计数据
   * @returns {Object|null} 表单设计对象，context不存在时返回null
   */
  getSearchForm: state => {
    if (!state.context || !state.context.reportDef) {
      return null;
    }
    return state.context.reportDef.searchForm || null;
  },

  // ============ Paper Getters ============

  /**
   * 获取页面配置数据
   * @returns {Object|null} 页面配置对象，context不存在时返回null
   */
  getPaperConfig: state => {
    if (!state.context || !state.context.reportDef) {
      return null;
    }
    return state.context.reportDef.paper || null;
  },

  // ============ Row Getters ============

  /**
   * 获取表格行数据
   * @param {number} [rowNumber] - 行号，不提供则返回全部行
   * @returns {Object|Array|null} 提供rowNumber返回单行对象，不提供返回行数组，context不存在时返回null/[]
   */
  getRows: state => (rowNumber) => {
    if (!state.context || !state.context.reportDef || !state.context.reportDef.rows) {
      return rowNumber ? null : [];
    }
    if (rowNumber) {
      return state.context.reportDef.rows.find(r => r.rowNumber === rowNumber) || null;
    }
    return state.context.reportDef.rows;
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};
