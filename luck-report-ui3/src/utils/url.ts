/**
 * 获取当前URL的查询字符串（不含?前缀）
 * 同时支持 history 模式和 hash 模式路由
 * @returns 查询字符串，如 "filePath=xxx&mode=preview"
 */
export function getUrlQueryString(): string {
  const hashIndex = window.location.href.indexOf('#')
  if (hashIndex !== -1) {
    const hash = window.location.href.substring(hashIndex + 1)
    const queryIndex = hash.indexOf('?')
    if (queryIndex !== -1) {
      return hash.substring(queryIndex + 1)
    }
    return ''
  }
  const search = window.location.search
  return search.length > 0 ? search.substring(1) : ''
}

/**
 * 获取当前URL查询参数的URLSearchParams对象
 * @returns URLSearchParams 实例
 */
export function getUrlSearchParams(): URLSearchParams {
  return new URLSearchParams(getUrlQueryString())
}

/**
 * 将参数应用到URLSearchParams对象
 * @param searchParams 待写入的 URLSearchParams
 * @param params 参数对象
 */
function applyParams(searchParams: URLSearchParams, params: Record<string, any>): void {
  Object.keys(params).forEach(key => {
    const value = params[key]
    if (value != null && value !== '') {
      searchParams.set(key, String(value))
    } else {
      searchParams.delete(key)
    }
  })
}

/**
 * 更新当前URL的查询参数
 * 同时支持 history 模式和 hash 模式路由
 * @param params 要合并的参数对象
 * @param usePushState 是否使用 pushState（默认 replaceState）
 */
export function updateUrlParams(params: Record<string, any>, usePushState: boolean = false): void {
  const oldUrl = window.location.href
  const hashIndex = oldUrl.indexOf('#')

  let newUrl: string
  if (hashIndex !== -1) {
    const baseUrl = oldUrl.substring(0, hashIndex)
    const hash = oldUrl.substring(hashIndex + 1)
    const queryIndex = hash.indexOf('?')
    const hashPath = queryIndex !== -1 ? hash.substring(0, queryIndex) : hash

    const searchParams = getUrlSearchParams()
    applyParams(searchParams, params)
    const newQueryString = searchParams.toString()
    newUrl = baseUrl + '#' + hashPath + (newQueryString ? '?' + newQueryString : '')
  } else {
    const url = new URL(oldUrl)
    applyParams(url.searchParams, params)
    newUrl = url.toString()
  }

  if (usePushState) {
    window.history.pushState({}, '', newUrl)
  } else {
    window.history.replaceState({}, '', newUrl)
  }
}
