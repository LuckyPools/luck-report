import {removeToken} from "@/utils/auth";

export default {
    namespaced: true,
    state: {
        isLogin: false,
        info: {
            name: ''
        }
    },
    mutations: {
        SET_USER_INFO(state, info) {
            state.info = info;
            state.isLogin = true;
        },
        CLEAR_USER(state) {
            state.info = { name: '' };
            state.isLogin = false;
        }
    },
    actions: {
        clearUserInfo({commit}) {
            commit('CLEAR_USER');
            removeToken();
        },
        setInfo({commit}, value) {
            commit('SET_USER_INFO', value);
        }
    }
};
