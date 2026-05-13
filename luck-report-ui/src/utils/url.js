/**
 * 获取当前URL的查询字符串（不含?前缀）
 * 同时支持 history 模式和 hash 模式路由
 * @returns {string} 查询字符串，如 "reportPath=xxx&mode=preview"
 */
export function getUrlQueryString() {
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
 * @returns {URLSearchParams}
 */
export function getUrlSearchParams() {
  return new URLSearchParams(getUrlQueryString())
}

/**
 * 将参数应用到URLSearchParams对象
 * @param {URLSearchParams} searchParams
 * @param {Object} params
 */
function applyParams(searchParams, params) {
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
 * @param {Object} params
 * @param {boolean} usePushState
 */
export function updateUrlParams(params, usePushState = false) {
  const oldUrl = window.location.href
  const hashIndex = oldUrl.indexOf('#')

  let newUrl
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
