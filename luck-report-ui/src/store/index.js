/**
 * vuex状态管理
 */
import Vue from 'vue';
import Vuex from 'vuex';
import getters from './getters';
import report from './modules/report';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {},
    mutations: {},
    actions: {},
    modules: {
        report,
    },
    getters
});
