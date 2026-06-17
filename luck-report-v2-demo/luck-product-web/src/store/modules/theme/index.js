import {setLocale} from "@/locales";
import {useTitle} from "@vueuse/core";

export default {
    namespaced: true,
    state: {
        locale: 'zh',
        localeOptions: [
            { label: '中文', key: 'zh' },
            { label: 'English', key: 'en' }
        ]
    },
    mutations: {
        CHANGE_LOCALE(state, value) {
            state.locale = value;
        }
    },
    actions: {
        changeLocale({commit}, lang) {
            commit('CHANGE_LOCALE', lang);
            localStorage.setItem('locale', lang);
            setLocale(lang);
        },
        updateDocumentTitleByLocale({rootState}) {
            const { i18nKey, title } = rootState.route.curRoute?.meta || {};
            const documentTitle = i18nKey ? rootState.theme.locale === 'zh' ? 
                (title === 'home' ? '首页' : title) : title : title;
            useTitle(documentTitle);
        }
    }
};
