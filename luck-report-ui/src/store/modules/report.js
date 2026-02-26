// report模块 - 管理报表设计器的状态
const state = {
  // 报表上下文对象
  context: null,
  // 报表名称
  fileName: '',
  saveBtnDisable: true,
  // 报表是否已保存
  isSaved: false
};

const mutations = {
  // 设置报表上下文
  SET_CONTEXT(state, context) {
    state.context = context;
  },

  // 更新上下文的某个属性
  UPDATE_CONTEXT_PROPERTY(state, { property, value }) {
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
  SET_IS_SAVED(state, isSaved) {
    state.isSaved = isSaved;
  }
};

const actions = {
  // 设置上下文的Action
  setContext({ commit }, context) {
    commit('SET_CONTEXT', context);
  },

  // 更新上下文属性的Action
  updateContextProperty({ commit }, payload) {
    commit('UPDATE_CONTEXT_PROPERTY', payload);
  },

  // 清除上下文的Action
  clearContext({ commit }) {
    commit('CLEAR_CONTEXT');
  },

  // 设置文件名的Action
  setFileName({ commit }, fileName) {
    let suffix= '.ureport.xml';
    let pos = fileName.indexOf(suffix);
    if(pos>-1){
      fileName = fileName.substring(0,pos);
    }
    fileName = decodeURI(fileName);
    commit('SET_FILE_NAME', fileName);
  },

  // 设置保存按钮状态的Action
  setSaveBtnDisable({ commit }, disable) {
    commit('SET_SAVE_BTN_DISABLE', disable);
  },

  // 设置报表保存状态的Action
  setIsSaved({ commit }, isSaved) {
    commit('SET_IS_SAVED', isSaved);
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
  getIsSaved: state => state.isSaved
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};
