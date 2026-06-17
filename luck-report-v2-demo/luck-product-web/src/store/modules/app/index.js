export default {
    namespaced: true,
    state: {
        siderCollapse: false
    },
    mutations: {
        SET_SIDER_COLLAPSE(state, value) {
            state.siderCollapse = value;
        }
    },
    actions: {
        toggleSiderCollapse({commit, state}) {
            commit('SET_SIDER_COLLAPSE', !state.siderCollapse);
        }
    }
};
