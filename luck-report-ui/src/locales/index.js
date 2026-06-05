import Vue from 'vue';
import VueI18n from 'vue-i18n';
import zh from './lang/zh';
import en from './lang/en';


Vue.use(VueI18n);

const SUPPORTED_LOCALES = ['zh', 'en'];

/**
 * 获取存储的语言设置
 * @returns {string} 语言标识 (zh/en)
 */
export function getStoredLocale() {
    const stored = localStorage.getItem('report_locale');
    return SUPPORTED_LOCALES.includes(stored) ? stored : 'zh';
}

export const i18n = new VueI18n({
    locale: getStoredLocale(),
    messages: {
        zh: {
            ...zh
        },
        en: {
            ...en
        }
    }
});

export default i18n;

/**
 * 供其他js使用
 * @param key 翻译键
 * @param values 插值参数对象
 * @returns {string}
 */
export function $t(key, values) {
    return i18n.t(key, i18n.locale, values);
}

/**
 * 设置语言并持久化
 * @param {string} locale - 语言标识 (zh/en)
 * @returns {boolean} 是否设置成功
 */
export function setLocale(locale) {
    if (!SUPPORTED_LOCALES.includes(locale)) {
        return false;
    }
    i18n.locale = locale;
    localStorage.setItem('report_locale', locale);
    return true;
}
