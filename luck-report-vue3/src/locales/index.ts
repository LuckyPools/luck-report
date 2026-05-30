import { createI18n } from 'vue-i18n'
import zh from './lang/zh'
import en from './lang/en'

const SUPPORTED_LOCALES = ['zh', 'en'] as const
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

const messages = {
  zh,
  en
}

/**
 * 获取存储的语言设置
 * @returns 语言标识 (zh/en)
 */
export function getStoredLocale(): SupportedLocale {
  const stored = localStorage.getItem('report_locale')
  return SUPPORTED_LOCALES.includes(stored as SupportedLocale) 
    ? (stored as SupportedLocale) 
    : 'zh'
}

/**
 * 设置语言并持久化
 * @param locale - 语言标识 (zh/en)
 * @returns 是否设置成功
 */
export function setLocale(locale: string): boolean {
  if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    return false
  }
  i18n.global.locale.value = locale as SupportedLocale
  localStorage.setItem('report_locale', locale)
  return true
}

/**
 * 获取当前语言
 * @returns 当前语言标识
 */
export function getLocale(): string {
  return i18n.global.locale.value
}

const i18n = createI18n({
  legacy: false,
  locale: getStoredLocale(),
  fallbackLocale: 'zh',
  messages
})

export default i18n
