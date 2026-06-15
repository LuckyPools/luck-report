/**
 * 国际化配置入口（vue-i18n 9）
 *
 * 改造说明：
 * - 使用 legacy: false 走组合式 API 模式，template 中仍可通过 $t 访问
 * - locale 在 composition 模式下是 ref，需要通过 i18n.global.locale.value 修改
 * - 业务 JS 中通过 i18n.global.t(key, values) 获取翻译
 */
import { createI18n } from 'vue-i18n'
import zh from './lang/zh'
import en from './lang/en'

const SUPPORTED_LOCALES = ['zh', 'en']

/**
 * 获取持久化的语言设置
 * @returns {string} 语言标识 (zh/en)
 */
export function getStoredLocale() {
    const stored = localStorage.getItem('report_locale')
    return SUPPORTED_LOCALES.includes(stored) ? stored : 'zh'
}

export const i18n = createI18n({
    legacy: false,
    locale: getStoredLocale(),
    fallbackLocale: 'zh',
    messages: {
        zh: { ...zh },
        en: { ...en }
    }
})

export default i18n

/**
 * 供非组件 JS（如工具函数）使用
 * @param {string} key 翻译键
 * @param {Object} [values] 插值参数对象
 * @returns {string} 翻译结果
 */
export function $t(key, values) {
    return i18n.global.t(key, values)
}

/**
 * 设置语言并持久化
 * @param {string} locale 语言标识 (zh/en)
 * @returns {boolean} 是否设置成功
 */
export function setLocale(locale) {
    if (!SUPPORTED_LOCALES.includes(locale)) {
        return false
    }
    i18n.global.locale.value = locale
    localStorage.setItem('report_locale', locale)
    return true
}
