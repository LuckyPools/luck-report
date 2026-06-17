import Vue from 'vue';
import Vuex from 'vuex';
import getters from './getters';
import app from './modules/app';
import user from './modules/user';
import route from './modules/route';
import theme from './modules/theme';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {},
    mutations: {},
    actions: {},
    modules: {
        app,
        user,
        route,
        theme
    },
    getters
});
