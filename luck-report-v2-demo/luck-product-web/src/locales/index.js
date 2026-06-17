import Vue from 'vue';
import VueI18n from 'vue-i18n';
import zh from './lang/zh';
import en from './lang/en';


Vue.use(VueI18n);

export const i18n = new VueI18n({
    locale: localStorage.getItem('locale') || 'zh',
    messages: {
        zh: {
            ...zh // 中文语言包
        },
        en: {
            ...en // 英文语言包
        }
    }
});

export default i18n;

/**
 * 供其他js使用
 * @param args
 * @returns {string}
 */
export function $t(args) {
    return i18n.tc.call(i18n, args);
}

export function setLocale(locale) {
    i18n.locale = locale;
}
