const styles = {
}

function addCss(cssList, el) {
  const css = styles[el.tag]
  css && cssList.indexOf(css) === -1 && cssList.push(css)
  if (el.children && Array.isArray(el.children)) {
    el.children.forEach(el2 => addCss(cssList, el2))
  }
}

export function makeUpCss(conf) {
  const cssList = []
  if (conf.fields && Array.isArray(conf.fields)) {
    conf.fields.forEach(el => addCss(cssList, el))
  }
  return cssList.join('\n')
}
