<template>
  <div ref="containerRef" class="cross-tab-container"></div>
</template>

<script lang="ts">
/**
 * CrossTabWidget：斜线表（cross tab）单元格组件
 *
 * 工作流程：
 * 1. 父级（CrossTabWidget class）createApp 启动本组件 → 注入 context / rowIndex / colIndex / value
 * 2. mounted 解析 value（以 | 分隔的斜线文本）→ refreshCell 计算宽高 / 构建斜线
 * 3. doDraw 用 Raphael 绘制斜线 + 文本 → saveSvgAsPng 转 base64 存到 cellDef
 *
 * 调用方：
 * - src/views/report/designer/edit-table/cross-tab-widget/class.ts（createApp 挂载）
 *
 * 迁移说明：
 * - Vue2 Options API → vue3 setup + 显式 type 标注
 * - props 通过 defineProps 声明，$refs → 模板 ref
 * - 渲染逻辑、API 调用保持原样
 */
import { defineComponent, ref, onMounted, onBeforeUnmount, type Ref } from 'vue'
import Raphael from 'raphael'
import saveSvgAsPng from 'save-svg-as-png'
import { getCell, setCell } from '@/utils/contextActions'
import { deepCopy } from '@/components/utils'
import TableManager from '../manager'
import type { ReportContext, ReportCell } from '@/types/report-def'

/** 斜线项 */
interface SlashItem {
  degree: number
  x: number
  y: number
  text: string
}

/** cellDef.value 的形态（最小子集） */
interface SlashValue {
  slashes: SlashItem[]
  type: string
  base64Data?: string
  [key: string]: unknown
}

/** cellDef.cellStyle 形态（最小子集） */
interface CellStyle {
  fontSize: number
  fontFamily?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  forecolor: string
  [key: string]: unknown
}

export default defineComponent({
  name: 'CrossTabWidget',
  props: {
    context: { type: Object as () => ReportContext, required: true },
    rowIndex: { type: Number, required: true },
    colIndex: { type: Number, required: true },
    value: { type: String, default: '' }
  },
  setup(props) {
    const containerRef: Ref<HTMLElement | null> = ref(null)
    const slashData: Ref<string[]> = ref([])
    const rowSpan = ref(1)
    const colSpan = ref(1)
    const width = ref(0)
    const height = ref(0)
    const paper: Ref<unknown> = ref(null)

    /**
     * 计算度数（斜线倾斜角）
     * @param a 直角边 a
     * @param b 直角边 b
     * @returns 角度（度）
     */
    const _computeDegree = (a: number, b: number): number => {
      const c = Math.sqrt(a * a + b * b)
      const sin = Math.sin(b / c)
      const degree = (180 / Math.PI) * Math.asin(sin)
      return parseInt(String(degree))
    }

    /**
     * rgb 数字字符串转 16 进制
     * @param rgb 'r,g,b' 形式
     * @returns #RRGGBB
     */
    const rgbToHex = (rgb: string): string => {
      const rgbArray = rgb.split(',')
      const r = parseInt(rgbArray[0])
      const g = parseInt(rgbArray[1])
      const b = parseInt(rgbArray[2])
      return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b)
    }

    /**
     * 数字转两位 hex
     * @param c 0~255 整数
     * @returns 两位 hex 字符串
     */
    const componentToHex = (c: number): string => {
      const hex = c.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }

    /**
     * 构建斜线数据（按行/列合并自动计算每条斜线的位置 + 文字）
     * - 结果写入 cellDef.value.slashes
     */
    const _buildSlashes = (): void => {
      const hot = TableManager.get()
      if (!hot) return

      const colStart = props.colIndex
      const colEnd = props.colIndex + colSpan.value
      let colWidth = 0
      for (let i = colStart; i < colEnd; i++) {
        colWidth += hot.getColWidth(i)
      }

      let rowHeight = 0
      const rowStart = props.rowIndex
      const rowEnd = props.rowIndex + rowSpan.value
      for (let i = rowStart; i < rowEnd; i++) {
        rowHeight += hot.getRowHeight(i)
      }

      const dataSize = slashData.value.length
      let index = 1
      const slashes: SlashItem[] = []

      // 行斜线（每行一条）
      for (let i = 0; i < rowSpan.value; i++) {
        let h = 0
        for (let j = 0; j < i; j++) {
          h += hot.getRowHeight(props.rowIndex + j)
        }
        h = i === 0 || i + 1 < rowSpan.value ? h + 8 : h - 3

        let itemName = '项目' + index
        if (dataSize > 0 && index - 1 < dataSize) {
          itemName = slashData.value[index - 1]
        } else if (dataSize > 0 && index - 1 >= dataSize) {
          break
        }

        const degree = _computeDegree(colWidth, h)
        const x = parseInt(String(colWidth - 30))

        slashes.push({ degree, x, y: h, text: itemName })
        index++
      }

      // 主斜线（行末 → 列首）
      if (dataSize === 0 || index - 1 < dataSize) {
        let itemName = '项目' + index
        if (dataSize > 0 && index - 1 < dataSize) {
          itemName = slashData.value[index - 1]
        }
        const degree = _computeDegree(colWidth, rowHeight)
        let x = colWidth
        if (colSpan.value > 1) {
          x -= hot.getColWidth(props.colIndex + (colSpan.value - 1))
        } else {
          x -= parseInt(String(x / 5))
        }
        let y = rowHeight
        if (rowSpan.value > 1) {
          y -= parseInt(String(hot.getRowHeight(props.rowIndex + (rowSpan.value - 1)) / 2)) + 5
        } else {
          y -= parseInt(String(y / 2))
        }
        slashes.push({ degree, x, y, text: itemName })
        index++
      }

      // 列斜线（每列一条）
      for (let i = 0; i < colSpan.value; i++) {
        let w = 0
        for (let j = 0; j < i; j++) {
          w += hot.getColWidth(props.colIndex + j)
        }
        let itemName = '项目' + index
        if (dataSize > 0 && index - 1 < dataSize) {
          itemName = slashData.value[index - 1]
        } else if (dataSize > 0 && index - 1 >= dataSize) {
          break
        }
        w += 20
        const degree = _computeDegree(rowHeight, w)
        const y = rowHeight - 20
        slashes.push({ degree, x: w, y, text: itemName })
        index++
      }

      // 落盘
      // ReportCell 与目标结构（SlashValue/CellStyle 字段）无重叠，先转 unknown 再 cast
      const cellDef = getCell(props.rowIndex, props.colIndex) as unknown as { value: SlashValue; cellStyle: CellStyle; [k: string]: unknown }
      const cellDefCopy = deepCopy(cellDef)
      cellDefCopy.value = { slashes, type: 'slash' }
      setCell(props.rowIndex, props.colIndex, cellDefCopy as unknown as ReportCell)
    }

    /**
     * 刷新单元格：重新计算宽高 + 重建/重绘
     */
    const refreshCell = (): void => {
      const hot = TableManager.get()
      const td = containerRef.value?.parentElement
      if (!hot || !td) return
      const cellDef = getCell(props.rowIndex, props.colIndex) as { value: SlashValue; cellStyle: CellStyle; [k: string]: unknown } | null

      rowSpan.value = parseInt(td.getAttribute('rowspan') || '1') || 1
      colSpan.value = parseInt(td.getAttribute('colspan') || '1') || 1

      // 累加宽高
      width.value = -2
      height.value = -4
      for (let i = props.rowIndex; i < props.rowIndex + rowSpan.value; i++) {
        height.value += hot.getRowHeight(i)
      }
      for (let i = props.colIndex; i < props.colIndex + colSpan.value; i++) {
        width.value += hot.getColWidth(i)
      }

      if (!cellDef?.value?.slashes) {
        _buildSlashes()
        doDraw()
      } else {
        doDraw()
      }
    }

    /**
     * 绘制：使用 Raphael 在容器中绘制斜线 + 文字
     */
    const doDraw = (): void => {
      const hot = TableManager.get()
      const container = containerRef.value
      if (!hot || !container) return
      const cellDef = getCell(props.rowIndex, props.colIndex) as { value: SlashValue; cellStyle: CellStyle; [k: string]: unknown } | null
      if (!cellDef) return

      const slashValue = cellDef.value
      const cellStyle = cellDef.cellStyle
      if (!cellStyle.forecolor) {
        cellStyle.forecolor = '0,0,0'
      }

      let index = 0

      // Raphael 操作时会修改容器尺寸，先保存
      const savedWidth = width.value
      const savedHeight = height.value

      // 清空容器
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }
      container.style.width = savedWidth + 'px'
      container.style.height = savedHeight + 'px'

      // 创建 Raphael 实例
      paper.value = (Raphael as unknown as (el: HTMLElement, w: number, h: number) => unknown)(container, savedWidth, savedHeight)
      const p = paper.value as { path: (d: string) => { attr: (a: Record<string, unknown>) => void }; text: (x: number, y: number, t: string) => { attr: (a: Record<string, unknown>) => { attr: (a: Record<string, unknown>) => void } } }

      // 文字样式
      const fontStyle = cellStyle.fontSize + 'pt ' + (cellStyle.fontFamily || '宋体')
      const bold = cellStyle.bold ? 'bold' : 'normal'
      const italic = cellStyle.italic ? 'italic' : 'normal'
      const underline = cellStyle.underline ? 'underline' : 'none'
      const textStyle = {
        fill: rgbToHex(cellStyle.forecolor),
        font: fontStyle,
        'font-weight': bold,
        'font-style': italic,
        'text-decoration': underline
      }

      const slashes = slashValue.slashes || []
      const size = slashes.length

      // 绘制行斜线
      for (let i = 0; i < (rowSpan.value - 1); i++) {
        if (size > 0 && index >= size) break
        let h = 0
        for (let j = 0; j <= i; j++) {
          h += hot.getRowHeight(props.rowIndex + j)
        }
        if (size === 2) h = savedHeight
        if (index < size) {
          p.path('M0 0L' + savedWidth + ' ' + h).attr({ stroke: rgbToHex(cellStyle.forecolor) })
        }
        const slash = slashes[index]
        const text = p.text(0, 0, slash.text).attr(textStyle)
        text.attr({ transform: 'T' + slash.x + ',' + slash.y + 'R' + slash.degree })
        index++
      }

      // 绘制主斜线
      if (size === 0 || index < size) {
        let h = savedHeight - (hot.getRowHeight(props.rowIndex + (rowSpan.value - 1))) / 3
        if (index + 1 < size) {
          if (size === 2) h = savedHeight
          p.path('M0 0L' + savedWidth + ' ' + h).attr({ stroke: rgbToHex(cellStyle.forecolor) })
        }
        const slash = slashes[index]
        index++
        const text = p.text(0, 0, slash.text).attr(textStyle)
        text.attr({ transform: 'T' + slash.x + ',' + slash.y + 'R' + slash.degree })

        if (size === 0 || index < size) {
          const w = savedWidth - (hot.getColWidth(props.colIndex + (colSpan.value - 1))) / 3
          if (index + 1 < size) {
            if (size === 2) (p.path('M0 0L' + w + ' ' + savedHeight) as { attr: (a: Record<string, unknown>) => void }).attr({ stroke: rgbToHex(cellStyle.forecolor) })
          }
          const slash2 = slashes[index]
          index++
          const text2 = p.text(0, 0, slash2.text).attr(textStyle)
          text2.attr({ transform: 'T' + slash2.x + ',' + slash2.y + 'R' + slash2.degree })
        }
      }

      // 绘制列斜线
      for (let i = 0; i < (colSpan.value - 1); i++) {
        if (size > 0 && index >= size) break
        let w = 0
        for (let j = 0; j <= i; j++) {
          w += hot.getColWidth(props.colIndex + j)
        }
        if (size === 2) w = savedWidth
        p.path('M0 0L' + w + ' ' + savedHeight).attr({ stroke: rgbToHex(cellStyle.forecolor) })
        const slash = slashes[index]
        index++
        const text = p.text(0, 0, slash.text).attr(textStyle)
        text.attr({ transform: 'T' + slash.x + ',' + slash.y + 'R' + slash.degree })
      }

      if (size === 0 || index < size) {
        const slash = slashes[index]
        index++
        const text = p.text(0, 0, slash.text).attr(textStyle)
        text.attr({ transform: 'T' + slash.x + ',' + slash.y + 'R' + slash.degree })
      }

      // 转 base64
      const svg = container.querySelector('svg')
      if (svg) {
        ;(saveSvgAsPng as unknown as { svgAsPngUri: (svg: Element, opts: unknown, cb: (data: string) => void) => void })
          .svgAsPngUri(svg, { encoderOptions: 1 }, (base64Data: string) => {
            slashValue.base64Data = base64Data
          })
      }
    }

    onMounted(() => {
      if (props.value) {
        slashData.value = props.value.split('|')
      }
      refreshCell()
    })

    onBeforeUnmount(() => {
      if (paper.value && (paper.value as { remove?: () => void }).remove) {
        ;(paper.value as { remove: () => void }).remove()
        paper.value = null
      }
    })

    return {
      containerRef,
      refreshCell,
      doDraw
    }
  }
})
</script>

<style scoped>
</style>
