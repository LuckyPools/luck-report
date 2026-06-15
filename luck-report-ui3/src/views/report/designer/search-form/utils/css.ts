/**
 * 样式代码生成器
 *
 * 改造要点：
 * - 行为保持不变（CSS 抽取逻辑通用）
 * - 类型化
 */
import type { FormField } from './types'

/**
 * 字段级 CSS 片段字典
 * key 为 tag（已是 a-xxx），生成的 CSS 文本会按字段去重
 */
const styles: Record<string, string> = {}

function addCss(cssList: string[], el: FormField): void {
  const css = styles[el.tag]
  if (css && cssList.indexOf(css) === -1) cssList.push(css)
  if (el.children && Array.isArray(el.children)) {
    el.children.forEach(el2 => addCss(cssList, el2))
  }
}

export function makeUpCss(conf: { fields?: FormField[] }): string {
  const cssList: string[] = []
  if (conf.fields && Array.isArray(conf.fields)) {
    conf.fields.forEach(el => addCss(cssList, el))
  }
  return cssList.join('\n')
}
