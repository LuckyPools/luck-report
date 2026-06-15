/**
 * 通用方法封装
 * 由 utils/index.js 改造为 utils/index.ts：
 * 1. 为所有导出函数添加显式 TS 类型
 * 2. 行为保持不变
 */

/** 日期格式化 */
export function parseTime(time: string | number | Date | null | undefined, pattern?: string): string | null {
  if (arguments.length === 0 || !time) {
    return null
  }
  const format = pattern || '{y}-{m}-{d} {h}:{i}:{s}'
  let date: Date
  if (typeof time === 'object') {
    date = time
  } else {
    if ((typeof time === 'string') && (/^[0-9]+$/.test(time))) {
      time = parseInt(time)
    } else if (typeof time === 'string') {
      time = time.replace(new RegExp(/-/gm), '/').replace('T', ' ').replace(new RegExp(/\.[\d]{3}/gm), '')
    }
    if ((typeof time === 'number') && (time.toString().length === 10)) {
      time = time * 1000
    }
    date = new Date(time)
  }
  const formatObj: Record<string, number> = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }
  const time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key: string): string => {
    let value: number | string = formatObj[key]
    if (key === 'a') { return ['日', '一', '二', '三', '四', '五', '六'][value as number] }
    if (result.length > 0 && (value as number) < 10) {
      value = '0' + value
    }
    return String(value || 0)
  })
  return time_str
}

/**
 * 表格时间格式化
 */
export function formatDate(cellValue: string | number | Date | null | undefined): string {
  if (cellValue == null || cellValue === '') return ''
  const date = new Date(cellValue)
  const year = date.getFullYear()
  const month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1).toString()
  const day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate().toString()
  const hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours().toString()
  const minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes().toString()
  const seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds().toString()
  return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds
}

export function formatTime(time: string | number, option?: string): string {
  if (('' + time).length === 10) {
    time = parseInt(String(time)) * 1000
  } else {
    time = +time
  }
  const d = new Date(time as number)
  const now = Date.now()

  const diff = (now - d.getTime()) / 1000

  if (diff < 30) {
    return '刚刚'
  } else if (diff < 3600) {
    return Math.ceil(diff / 60) + '分钟前'
  } else if (diff < 3600 * 24) {
    return Math.ceil(diff / 3600) + '小时前'
  } else if (diff < 3600 * 24 * 2) {
    return '1天前'
  }
  if (option) {
    return parseTime(time as number, option) as string
  } else {
    return (
      d.getMonth() + 1 +
      '月' +
      d.getDate() +
      '日' +
      d.getHours() +
      '时' +
      d.getMinutes() +
      '分'
    )
  }
}

export function getQueryObject(url?: string): Record<string, string> {
  url = url == null ? window.location.href : url
  const search = url.substring(url.lastIndexOf('?') + 1)
  const obj: Record<string, string> = {}
  const reg = /([^?&=]+)=([^?&=]*)/g
  search.replace(reg, (_rs, $1: string, $2: string) => {
    const name = decodeURIComponent($1)
    let val = decodeURIComponent($2)
    val = String(val)
    obj[name] = val
    return _rs
  })
  return obj
}

export function byteLength(str: string): number {
  let s = str.length
  for (let i = str.length - 1; i >= 0; i--) {
    const code = str.charCodeAt(i)
    if (code > 0x7f && code <= 0x7ff) s++
    else if (code > 0x7ff && code <= 0xffff) s += 2
    if (code >= 0xDC00 && code <= 0xDFFF) i--
  }
  return s
}

export function cleanArray<T>(actual: Array<T | null | undefined | false | 0 | ''>): T[] {
  const newArray: T[] = []
  for (let i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i] as T)
    }
  }
  return newArray
}

export function param(json: Record<string, unknown>): string {
  if (!json) return ''
  return cleanArray(
    Object.keys(json).map(key => {
      if (json[key] === undefined) return ''
      return encodeURIComponent(key) + '=' + encodeURIComponent(String(json[key]))
    })
  ).join('&')
}

export function param2Obj(url: string): Record<string, string> {
  const search = decodeURIComponent(url.split('?')[1]).replace(/\+/g, ' ')
  if (!search) {
    return {}
  }
  const obj: Record<string, string> = {}
  const searchArr = search.split('&')
  searchArr.forEach(v => {
    const index = v.indexOf('=')
    if (index !== -1) {
      const name = v.substring(0, index)
      const val = v.substring(index + 1, v.length)
      obj[name] = val
    }
  })
  return obj
}

export function html2Text(val: string): string {
  const div = document.createElement('div')
  div.innerHTML = val
  return div.textContent || div.innerText
}

export function objectMerge<T extends object, S extends object>(target: T, source: S): T & S {
  if (typeof target !== 'object') {
    target = {} as T
  }
  if (Array.isArray(source)) {
    return source.slice() as unknown as T & S
  }
  Object.keys(source).forEach(property => {
    const sourceProperty = (source as Record<string, unknown>)[property]
    if (typeof sourceProperty === 'object') {
      ;(target as Record<string, unknown>)[property] = objectMerge(
        (target as Record<string, unknown>)[property] as object,
        sourceProperty as object
      )
    } else {
      ;(target as Record<string, unknown>)[property] = sourceProperty
    }
  })
  return target as T & S
}

export function toggleClass(element: HTMLElement, className: string): void {
  if (!element || !className) {
    return
  }
  let classString = element.className
  const nameIndex = classString.indexOf(className)
  if (nameIndex === -1) {
    classString += '' + className
  } else {
    classString =
      classString.substr(0, nameIndex) +
      classString.substr(nameIndex + className.length)
  }
  element.className = classString
}

export function getTime(type: 'start' | 'end' = 'start'): number {
  if (type === 'start') {
    return new Date().getTime() - 3600 * 1000 * 24 * 90
  } else {
    return new Date(new Date().toDateString()).getTime()
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let timeout: ReturnType<typeof setTimeout> | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let args: any
  let context: unknown
  let timestamp: number
  let result: ReturnType<T> | undefined

  const later = function () {
    const last = +new Date() - timestamp
    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last)
    } else {
      timeout = null
      if (!immediate) {
        result = func.apply(context, args)
        if (!timeout) context = args = null
      }
    }
  }

  return function (this: unknown, ..._args: Parameters<T>) {
    context = this
    timestamp = +new Date()
    args = _args
    const callNow = immediate && !timeout
    if (!timeout) timeout = setTimeout(later, wait)
    if (callNow) {
      result = func.apply(context, args)
      context = args = null
    }
    return result
  }
}

export function deepClone<T>(source: T): T {
  if (!source && typeof source !== 'object') {
    throw new Error('error arguments')
  }
  const targetObj: any = (source as any).constructor === Array ? [] : {}
  Object.keys(source as any).forEach(keys => {
    if ((source as any)[keys] && typeof (source as any)[keys] === 'object') {
      targetObj[keys] = deepClone((source as any)[keys])
    } else {
      targetObj[keys] = (source as any)[keys]
    }
  })
  return targetObj
}

export function uniqueArr(arr: unknown[]): unknown[] {
  return Array.from(new Set(arr))
}

export function createUniqueString(): string {
  const timestamp = +new Date() + ''
  const randomNum = Math.floor((1 + Math.random()) * 65536) + ''
  return (+(randomNum + timestamp)).toString(32)
}

export function hasClass(ele: HTMLElement, cls: string): boolean {
  return !!ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'))
}

export function addClass(ele: HTMLElement, cls: string): void {
  if (!hasClass(ele, cls)) ele.className += ' ' + cls
}

export function removeClass(ele: HTMLElement, cls: string): void {
  if (hasClass(ele, cls)) {
    const reg = new RegExp('(\\s|^)' + cls + '(\\s|$)')
    ele.className = ele.className.replace(reg, ' ')
  }
}

export function makeMap(str: string, expectsLowerCase?: boolean): (val: string) => boolean {
  const map: Record<string, true> = Object.create(null)
  const list = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase
    ? val => !!map[val.toLowerCase()]
    : val => !!map[val]
}

export const exportDefault = 'export default '

export const beautifierConf = {
  html: {
    indent_size: '2',
    indent_char: ' ',
    max_preserve_newlines: '-1',
    preserve_newlines: false,
    keep_array_indentation: false,
    break_chained_methods: false,
    indent_scripts: 'separate',
    brace_style: 'end-expand',
    space_before_conditional: true,
    unescape_strings: false,
    jslint_happy: false,
    end_with_newline: true,
    wrap_line_length: '110',
    indent_inner_html: true,
    comma_first: false,
    e4x: true,
    indent_empty_lines: true
  },
  js: {
    indent_size: '2',
    indent_char: ' ',
    max_preserve_newlines: '-1',
    preserve_newlines: false,
    keep_array_indentation: false,
    break_chained_methods: false,
    indent_scripts: 'normal',
    brace_style: 'end-expand',
    space_before_conditional: true,
    unescape_strings: false,
    jslint_happy: true,
    end_with_newline: true,
    wrap_line_length: '110',
    indent_inner_html: true,
    comma_first: false,
    e4x: true,
    indent_empty_lines: true
  }
} as const

/** 首字母大写 */
export function titleCase(str: string): string {
  return str.replace(/( |^)[a-z]/g, L => L.toUpperCase())
}

/** 下划线转驼峰 */
export function camelCase(str: string): string {
  return str.replace(/_[a-z]/g, str1 => str1.substr(-1).toUpperCase())
}

export function isNumberStr(str: string): boolean {
  return /^[+-]?(0|([1-9]\d*))(\.\d+)?$/g.test(str)
}
