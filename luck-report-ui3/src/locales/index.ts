/**
 * 国际化配置入口（vue-i18n 9）
 *
 * 改造说明：
 * - 使用 legacy: false 走组合式 API 模式，template 中仍可通过 $t 访问
 * - locale 在 composition 模式下是 ref，需要通过 i18n.global.locale.value 修改
 * - 业务 JS 中通过 i18n.global.t(key, values) 获取翻译
 * - 文案 schema 由 messages 推导，TS 能对 i18n 路径提供基本提示
 */
import { createI18n } from 'vue-i18n'
import zh from './lang/zh'
import en from './lang/en'

/** 支持的语言标识集合 */
export const SUPPORTED_LOCALES = ['zh', 'en'] as const

/** 语言标识联合类型 */
export type Locale = typeof SUPPORTED_LOCALES[number]

/** 持久化存储的语言 key */
const STORAGE_KEY = 'report_locale'

/**
 * 获取持久化的语言设置
 * @returns {Locale} 语言标识 (zh/en)，未设置或非法时默认返回 'zh'
 */
export function getStoredLocale(): Locale {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    return SUPPORTED_LOCALES.includes(stored as Locale) ? (stored as Locale) : 'zh'
}

/**
 * 全局 i18n 实例（单例）
 * - 显式将 locale/fallbackLocale 断言为 Locale，避免 TS 推出过宽的 string
 * - 不显式标注 I18n 泛型，让 vue-i18n 自动推断具体类型，避免误用泛型位
 */
export const i18n = createI18n({
    legacy: false,
    locale: getStoredLocale() as Locale,
    fallbackLocale: 'zh' as Locale,
    messages: {
        zh,
        en
    }
})

export default i18n

/**
 * 供非组件 JS（如工具函数）使用
 * @param {string} key 翻译键
 * @param {Record<string, unknown>} [values] 插值参数对象
 * @returns {string} 翻译结果
 */
export function t(key: string, values?: Record<string, unknown>): string {
    // vue-i18n 9 的 t 在 legacy 模式下支持多参数；values 用 unknown 转发以避免泛型误判
    return i18n.global.t(key, values as never) as string
}

/**
 * 设置语言并持久化
 * @param {Locale} locale 语言标识 (zh/en)
 * @returns {boolean} 是否设置成功
 */
export function setLocale(locale: Locale): boolean {
    if (!SUPPORTED_LOCALES.includes(locale)) {
        return false
    }
    // 通过 computed 写入触发响应式
    i18n.global.locale.value = locale
    localStorage.setItem(STORAGE_KEY, locale)
    return true
}
