/**
 * Token 存储与注入。
 * Token 可通过 URL 参数（?token=xxx）或 mount options 传入，
 * 写入 sessionStorage 后，axios 拦截器自动注入到 X-Access-Token header。
 * 后端 TokenInterceptor 从 header 中读取，TokenService.getCurrentUserRoles(request) 获取用户角色。
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
