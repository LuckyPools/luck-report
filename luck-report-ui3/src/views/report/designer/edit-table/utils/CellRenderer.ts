/**
 * CellRenderer：单元格渲染钩子
 *
 * 工作流程：
 * 1. 注册为 handsontable 的 afterRenderer 钩子
 * 2. 每当单元格被渲染时触发：根据 cellDef.value.type 决定显示样式
 * 3. 类型分支：simple / dataset / expression / image / slash / zxing / chart
 * 4. 应用 cellDef.cellStyle 中的字体/边框/对齐/背景
 * 5. 处理单元格扩展标识（Down / Right）
 *
 * 调用方：
 * - src/views/report/designer/edit-table/index.vue（在 cells 配置中通过 renderer 引用）
 *
 * 迁移说明：
 * - 函数签名不变：afterRenderer(td, row, col, prop, value, cellProperties)
 * - td/HTMLElement 上有 colSpan/rowSpan 等原生属性
 * - value / cellDef 类型为 unknown，由函数内做窄化
 * - CrossTabWidget / ChartWidget 暂为 .js（依赖阶段 1.4 迁完后再收紧类型）
 */
import { $t } from '@/locales';
import CrossTabWidget from '@/views/report/designer/edit-table/cross-tab-widget/class';
import ChartWidget from '@/views/report/designer/edit-table/chart-widget/class';
import chartWidgetManager from '@/views/report/designer/edit-table/chart-widget/manager';
import CrossTabWidgetManager from '@/views/report/designer/edit-table/cross-tab-widget/manager';
import imageIcon from '@/assets/icons/image.svg';
import qrcodeIcon from '@/assets/icons/qrcode.svg';
import barcodeIcon from '@/assets/icons/barcode.svg';
import exprExpandDownIcon from '@/assets/icons/expr-expand-down.svg';
import expandDownIcon from '@/assets/icons/expand-down.svg';
import exprExpandRightIcon from '@/assets/icons/expr-expand-right.svg';
import expandRightIcon from '@/assets/icons/expand-right.svg';
import propertyIcon from '@/assets/icons/property.svg';
import expressionIcon from '@/assets/icons/expression.svg';
import { getCell, getContext } from '@/utils/contextActions';
import type { ReportCell, ReportContext } from '@/types/report-def';

/** 单元格 value 类型 */
type CellValueType = 'simple' | 'dataset' | 'expression' | 'image' | 'slash' | 'zxing' | 'chart'

/** 单元格扩展方向 */
type CellExpand = 'None' | 'Down' | 'Right' | string

/** 单元格样式（与 ReportCell.cellStyle 一致） */
interface CellStyle {
  align?: string
  valign?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  forecolor?: string
  bgcolor?: string
  fontSize?: number
  fontFamily?: string
  lineHeight?: string
  format?: string | null
  leftBorder?: BorderStyle | ''
  rightBorder?: BorderStyle | ''
  topBorder?: BorderStyle | ''
  bottomBorder?: BorderStyle | ''
  [key: string]: unknown
}

/** 边框样式 */
interface BorderStyle {
  style: string
  width: number | string
  color: string
}

/** 单元格 value（项目实际用到 7 种类型） */
interface CellValue {
  type: CellValueType
  value?: string
  datasetName?: string
  aggregate?: string
  property?: string
  category?: 'qrcode' | 'barcode' | string
  width?: number
  height?: number
  slashes?: Array<{ text: string; x: number; y: number; degree: number }>
  chart?: unknown
  [key: string]: unknown
}

/**
 * 单元格渲染钩子
 * 由 handsontable 在 afterRenderer 阶段回调，负责把 ReportCell 的样式/图标/二维码/图表应用到底层 td 元素
 *
 * @param td 单元格 DOM 元素
 * @param row 行索引（0 基）
 * @param col 列索引（0 基）
 * @param prop 列属性
 * @param value 单元格显示值
 * @param cellProperties handsontable 单元格属性对象
 */
export function afterRenderer(
  td: HTMLElement,
  row: number,
  col: number,
  prop: string | number,
  value: unknown,
  cellProperties: Record<string, unknown>
): void {
  if (!getContext()) return
  const cellDef = getCell(row, col) as (ReportCell & { cellStyle?: CellStyle; value: CellValue; expand?: CellExpand }) | null
  if (!cellDef) return

  const cellStyle: CellStyle = (cellDef.cellStyle || {}) as CellStyle
  const cellValue = cellDef.value
  const valueType = cellValue.type
  let tip = ''
  if (valueType === 'dataset') {
    tip = (cellValue.datasetName || '') + '.' + (cellValue.aggregate || '') + '('
    const propName = cellValue.property || ''
    tip += propName + ')'
    if (td.innerHTML === '') {
      td.innerHTML = tip
    }
  } else if (valueType === 'expression') {
    tip = cellValue.value || ''
    if (td.innerHTML === '') {
      td.innerHTML = tip
    }
  } else if (valueType === 'image') {
    tip = $t('table.render.image') + (cellValue.value || '')
    const image = document.createElement('img')
    image.src = imageIcon
    image.width = 20
    emptyElement(td)
    td.appendChild(image)
  } else if (valueType === 'slash') {
    tip = $t('table.render.slash')
    const widgetKey = `${row}_${col}`
    const slashNames = (cellValue.slashes || []).map(s => s.text)
    const valueString = slashNames.join('|')
    const context = getContext() as ReportContext | null
    if (!context) return
    if (!CrossTabWidgetManager.has(widgetKey)) {
      CrossTabWidgetManager.set(widgetKey, new CrossTabWidget(context, row, col, valueString))
    } else {
      const widget = CrossTabWidgetManager.get(widgetKey) as { value: string; refreshCell: () => void }
      widget.value = valueString
      widget.refreshCell()
    }
  } else if (valueType === 'zxing') {
    let imagePath = qrcodeIcon
    tip = $t('table.render.qrcode')
    if (cellValue.category === 'barcode') {
      tip = $t('table.render.barcode')
      imagePath = barcodeIcon
    }
    const width = cellValue.width
    const height = cellValue.height
    const image = document.createElement('img')
    image.src = imagePath
    image.width = width || 0
    image.height = height || 0
    emptyElement(td)
    td.appendChild(image)
  } else if (valueType === 'chart') {
    tip = $t('table.render.chart')
    const widgetKey = `${row}_${col}`
    const context = getContext() as ReportContext | null
    if (!context) return
    if (!chartWidgetManager.has(widgetKey)) {
      chartWidgetManager.set(widgetKey, new ChartWidget(td, row, col))
    }
    const widget = chartWidgetManager.get(widgetKey) as { renderChart: (td: HTMLElement, ctx: ReportContext, row: number, col: number) => void }
    widget.renderChart(td, context, row, col)
  } else {
    tip = cellValue.value || ''
    if (td.innerHTML === '') {
      td.innerHTML = tip
    }
  }
  td.title = tip

  if (valueType === 'simple') {
    let text = td.textContent || ''
    if (text && text !== '') {
      text = text.replace(new RegExp('<', 'gm'), '&lt;')
      text = text.replace(new RegExp('>', 'gm'), '&gt;')
      text = text.replace(new RegExp('\r\n', 'gm'), '<br>')
      text = text.replace(new RegExp('\n', 'gm'), '<br>')
      text = text.replace(new RegExp(' ', 'gm'), '&nbsp;')
      td.innerHTML = text
    }
  }

  setStyles(td, {
    'word-break': 'break-all',
    'line-height': 'normal',
    'white-space': 'nowrap',
    'padding': '0 1px'
  })

  if (cellDef.expand === 'Down') {
    let url = exprExpandDownIcon
    if (valueType === 'dataset') {
      url = expandDownIcon
    }
    prependHtml(td, `<image src="${url}"></image>`)
  } else if (cellDef.expand === 'Right') {
    let url = exprExpandRightIcon
    if (valueType === 'dataset') {
      url = expandRightIcon
    }
    prependHtml(td, `<image src="${url}" style="display: block;"></image>`)
  } else {
    if (valueType === 'dataset') {
      const url = propertyIcon
      prependHtml(td, `<image src="${url}" style="display: inline-block;"></image>`)
    } else if (valueType === 'expression') {
      const url = expressionIcon
      prependHtml(td, `<image src="${url}" style="display: inline-block;"></image>`)
    }
  }

  if (cellStyle.align) td.style.textAlign = cellStyle.align
  if (cellStyle.valign) td.style.verticalAlign = cellStyle.valign
  if (cellStyle.bold) td.style.fontWeight = 'bold'
  if (cellStyle.italic) td.style.fontStyle = 'italic'
  if (cellStyle.underline) td.style.textDecoration = 'underline'
  if (cellStyle.forecolor) td.style.color = 'rgb(' + cellStyle.forecolor + ')'
  if (cellStyle.bgcolor) td.style.backgroundColor = 'rgb(' + cellStyle.bgcolor + ')'
  if (cellStyle.fontSize) td.style.fontSize = cellStyle.fontSize + 'pt'
  if (cellStyle.fontFamily) td.style.fontFamily = cellStyle.fontFamily
  if (cellStyle.lineHeight) {
    td.style.lineHeight = cellStyle.lineHeight
  } else {
    td.style.lineHeight = ''
  }

  const leftBorder = cellStyle.leftBorder
  if (leftBorder) {
    if (leftBorder.style === 'none') {
      td.style.borderLeft = ''
    } else {
      let borderStyle = 'double'
      let borderWidth: number | string = leftBorder.width
      if (borderWidth === null || borderWidth === undefined || borderWidth === '') {
        borderWidth = 0
      } else {
        borderWidth = parseInt(String(borderWidth))
      }
      if (leftBorder.style !== 'solid' && (borderWidth as number) > 0) {
        borderStyle = leftBorder.style
        borderWidth = (borderWidth as number) + 1
      }
      const style = borderStyle + ' ' + borderWidth + 'px rgb(' + leftBorder.color + ')'
      td.style.borderLeft = style
    }
  }

  const rightBorder = cellStyle.rightBorder
  if (rightBorder) {
    if (rightBorder.style === 'none') {
      td.style.borderRight = ''
    } else {
      const style = rightBorder.style + ' ' + rightBorder.width + 'px rgb(' + rightBorder.color + ')'
      td.style.borderRight = style
    }
  }

  const topBorder = cellStyle.topBorder
  if (topBorder) {
    if (topBorder.style === 'none') {
      td.style.borderTop = ''
    } else {
      let borderStyle = 'double'
      let borderWidth: number | string = topBorder.width
      if (borderWidth === null || borderWidth === undefined || borderWidth === '') {
        borderWidth = 0
      } else {
        borderWidth = parseInt(String(borderWidth))
      }
      if (topBorder.style !== 'solid' && (borderWidth as number) > 0) {
        borderStyle = topBorder.style
        borderWidth = (borderWidth as number) + 1
      }
      const style = borderStyle + ' ' + borderWidth + 'px rgb(' + topBorder.color + ')'
      td.style.borderTop = style
    }
  }

  const bottomBorder = cellStyle.bottomBorder
  if (bottomBorder) {
    if (bottomBorder.style === 'none') {
      td.style.borderBottom = ''
    } else {
      const style = bottomBorder.style + ' ' + bottomBorder.width + 'px rgb(' + bottomBorder.color + ')'
      td.style.borderBottom = style
    }
  }
}

/**
 * 批量设置元素样式
 * @param element 目标 DOM 元素
 * @param styles 样式键值对
 *
 * 说明：
 * - 用 Object.keys 替代 for...in，避免原型链上的 length/parentRule 等只读字段被遍历到
 * - 通过强转为 Record<string, string> 绕过 CSSStyleDeclaration 的"只读属性不可写"约束
 */
function setStyles(element: HTMLElement, styles: Record<string, string>): void {
  const styleMap = element.style as unknown as Record<string, string>
  Object.keys(styles).forEach((key) => {
    styleMap[key] = styles[key]
  })
}

/**
 * 清空元素的所有子节点
 * @param element 目标 DOM 元素
 */
function emptyElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }
}

/**
 * 在元素开头插入一段 HTML
 * @param element 目标 DOM 元素
 * @param html HTML 字符串
 */
function prependHtml(element: HTMLElement, html: string): void {
  const temp = document.createElement('div')
  temp.innerHTML = html
  while (temp.firstChild) {
    element.insertBefore(temp.firstChild, element.firstChild)
  }
}
