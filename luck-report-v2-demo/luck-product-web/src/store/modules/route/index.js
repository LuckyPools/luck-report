export default {
    namespaced: true,
    state: {
        curRoute: null
    },
    mutations: {
        SET_CUR_ROUTE(state, value) {
            state.curRoute = value;
        }
    },
    actions: {
        setCurRoute({commit}, value) {
            commit('SET_CUR_ROUTE', value)
        }
    }
};
