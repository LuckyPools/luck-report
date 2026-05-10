
export function updateUrlParams(params, usePushState = false) {
  const url = new URL(window.location.href)
  Object.keys(params).forEach(key => {
    const value = params[key]
    if (value != null && value !== '') {
      url.searchParams.set(key, String(value))
    } else {
      url.searchParams.delete(key)
    }
  })
  if (usePushState) {
    window.history.pushState({}, '', url.toString())
  } else {
    window.history.replaceState({}, '', url.toString())
  }
}
