/**
 * iframe 嵌入场景下的 token 透传。
 * 第三方父页面拼 token 到 URL（?token=xxx 或 ?X-Access-Token=xxx），
 * 子页面在 main.ts 启动时调用 captureTokenFromUrl 抓取并写入 sessionStorage，
 * axios 请求拦截器注入到 X-Access-Token header，
 * 由第三方实现的 JmReportTokenServiceI.getToken(request) 读取。
 */

const STORAGE_KEY = 'luck-report-token'

export const TOKEN_HEADER = 'X-Access-Token'

export function captureTokenFromUrl(): void {
  if (typeof window === 'undefined') return
  if (sessionStorage.getItem(STORAGE_KEY)) return

  const url = new URL(window.location.href)
  const captured =
    url.searchParams.get('token') || url.searchParams.get('X-Access-Token') || ''
  if (captured) {
    sessionStorage.setItem(STORAGE_KEY, captured)
    url.searchParams.delete('token')
    url.searchParams.delete('X-Access-Token')
    window.history.replaceState(null, '', url.toString())
  }
}

export function getRequestToken(): string {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem(STORAGE_KEY) || ''
}

export function setRequestToken(token: string): void {
  if (typeof window === 'undefined') return
  if (token) sessionStorage.setItem(STORAGE_KEY, token)
  else sessionStorage.removeItem(STORAGE_KEY)
}
