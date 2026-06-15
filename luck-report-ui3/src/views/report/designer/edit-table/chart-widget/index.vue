<template>
  <div ref="chartContainerRef" class="chart-container">
    <canvas ref="chartCanvasRef"></canvas>
  </div>
</template>

<script lang="ts">
/**
 * ChartWidget：图表单元格组件
 *
 * 工作流程：
 * 1. 父级（ChartWidget class）createApp 启动本组件 → 注入 context / rowIndex / colIndex
 * 2. mounted 调 renderChart → 根据 cell.value.chart 渲染对应 chart.js 图
 * 3. beforeUnmount 释放 chart.js 实例
 *
 * 调用方：
 * - src/views/report/designer/edit-table/chart-widget/class.ts（createApp 挂载）
 *
 * 迁移说明：
 * - Vue2 Options API → vue3 setup + 显式 type 标注
 * - props 通过 defineProps 声明，原 $refs.X → 模板 ref (Ref<HTMLElement | null>)
 * - 渲染逻辑、配色常量保持原样
 */
import { defineComponent, ref, onMounted, onBeforeUnmount, computed, type Ref } from 'vue'
import { Chart, registerables, type ChartData, type ChartOptions, type ChartTypeRegistry } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { showAlert } from '@/utils/comnon'
import { getCell } from '@/utils/contextActions'
import TableManager from '../manager'
import { $t } from '@/locales'
import type { ReportContext } from '@/types/report-def'

Chart.register(...registerables, ChartDataLabels)

/** chart.js 类型（精简） */
type ChartJsInstance = Chart

/** chart 颜色映射 */
interface ChartColors {
  red: string
  orange: string
  yellow: string
  green: string
  blue: string
  purple: string
  grey: string
}

export default defineComponent({
  name: 'ChartWidget',
  props: {
    context: { type: Object as () => ReportContext, required: true },
    rowIndex: { type: Number, required: true },
    colIndex: { type: Number, required: true }
  },
  setup(props) {
    const chartContainerRef: Ref<HTMLElement | null> = ref(null)
    const chartCanvasRef: Ref<HTMLCanvasElement | null> = ref(null)
    const chart: Ref<ChartJsInstance | null> = ref(null)
    const width = ref(-2)
    const height = ref(-2)

    const chartColors = computed<ChartColors>(() => ({
      red: 'rgb(255, 99, 132)',
      orange: 'rgb(255, 159, 64)',
      yellow: 'rgb(255, 205, 86)',
      green: 'rgb(75, 192, 192)',
      blue: 'rgb(54, 162, 235)',
      purple: 'rgb(153, 102, 255)',
      grey: 'rgb(201, 203, 207)'
    }))

    /**
     * 把 rgb(r,g,b) 转成 rgba(r,g,b,a)
     * @param rgbString rgb 颜色字符串
     * @param alpha 0~1
     * @returns rgba 颜色字符串
     */
    const colorWithAlpha = (rgbString: string, alpha: number): string => {
      const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (match) {
        const r = match[1]
        const g = match[2]
        const b = match[3]
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
      return rgbString
    }

    /**
     * 获取单元格的 DOM 元素（处理合并单元格）
     * @param rowIndex 行索引
     * @param colIndex 列索引
     * @returns 单元格 td 元素或 null
     */
    const getTDByCell = (rowIndex: number, colIndex: number): HTMLElement | null => {
      const hot = TableManager.get()
      if (!hot || !hot.view || !hot.view.wtTable) {
        return null
      }
      const wtTable = hot.view.wtTable
      if (wtTable.getCell) {
        const cell = wtTable.getCell(rowIndex, colIndex)
        if (cell && cell.parentNode) {
          return cell.parentNode
        }
      }
      // 备用：CSS 选择器
      const cellElements = document.querySelectorAll(`.htCore td[data-row="${rowIndex}"][data-col="${colIndex}"]`)
      return cellElements.length > 0 ? (cellElements[0] as HTMLElement) : null
    }

    /**
     * 渲染图表
     * - 读取 cell.value.chart → 解析 type / 数据 / 配置
     * - 创建 chart.js 实例并放到 canvas
     */
    const renderChart = (): void => {
      const { rowIndex, colIndex } = props
      const hot = TableManager.get()
      const container = chartContainerRef.value
      const canvas = chartCanvasRef.value
      if (!hot || !container || !canvas) return

      const tdElement = getTDByCell(rowIndex, colIndex) as HTMLTableCellElement | null
      const rowSpan = tdElement ? parseInt(String(tdElement.rowSpan)) || 1 : 1
      const colSpan = tdElement ? parseInt(String(tdElement.colSpan)) || 1 : 1

      // 累加合并单元格的高 / 宽
      width.value = -2
      height.value = -2
      for (let i = rowIndex; i < rowIndex + rowSpan; i++) {
        height.value += hot.getRowHeight(i)
      }
      for (let i = colIndex; i < colIndex + colSpan; i++) {
        width.value += hot.getColWidth(i)
      }

      container.style.width = `${width.value}px`
      container.style.height = `${height.value}px`
      canvas.style.width = `${width.value}px`
      canvas.style.height = `${height.value}px`

      // 读取 cell 图表配置
      // 两步走强转：ReportCell 与目标结构无共同字段，先转 unknown 再转目标结构
      const cell = getCell(rowIndex, colIndex) as unknown as {
        value: {
          chart: {
            dataset: { type: string }
            xaxes?: Record<string, unknown>
            yaxes?: Record<string, unknown>
            options?: Array<Record<string, unknown>>
          }
        }
      }
      if (!cell || !cell.value || !cell.value.chart) {
        return
      }
      const type = cell.value.chart.dataset.type
      let data: unknown = null
      const options: Record<string, unknown> = {}
      let chartType: string

      // 默认 options
      const defaultOptions = cell.value.chart.options
      if (defaultOptions) {
        for (const option of defaultOptions) {
          options[(option as { type: string }).type] = option
        }
      }
      // x / y 轴配置
      const xaxes = cell.value.chart.xaxes
      if (xaxes) {
        if (!options.scales) options.scales = {}
        if (xaxes.rotation) {
          // xaxes/ticks 都是 Record<string, unknown>，需要 cast 后才能赋子属性
          const axes = xaxes as Record<string, any>
          if (!axes.ticks) axes.ticks = {}
          axes.ticks.minRotation = axes.rotation
        }
        ;(options.scales as Record<string, unknown>).x = xaxes
      }
      const yaxes = cell.value.chart.yaxes
      if (yaxes) {
        if (!options.scales) options.scales = {}
        if (yaxes.rotation) {
          const axes = yaxes as Record<string, any>
          if (!axes.ticks) axes.ticks = {}
          axes.ticks.minRotation = axes.rotation
        }
        ;(options.scales as Record<string, unknown>).y = yaxes
      }

      const c = chartColors.value
      switch (type) {
        case 'bar':
          chartType = 'bar'
          data = {
            labels: ['类型1', '类型2', '类型3', '类型4', '类型5', '类型6'],
            datasets: [
              {
                label: '系列1',
                backgroundColor: colorWithAlpha(c.red, 0.5),
                borderColor: c.red,
                borderWidth: 1,
                data: [21, 25, 8, 12, 31, 19]
              },
              {
                label: '系列2',
                backgroundColor: colorWithAlpha(c.blue, 0.5),
                borderColor: c.blue,
                borderWidth: 1,
                data: [11, 13, 18, 9, 23, 29]
              }
            ]
          }
          break
        case 'horizontalBar':
          chartType = 'bar'
          options.indexAxis = 'y'
          data = {
            labels: ['类型1', '类型2', '类型3', '类型4', '类型5', '类型6'],
            datasets: [
              {
                label: '系列1',
                backgroundColor: colorWithAlpha(c.red, 0.5),
                borderColor: c.red,
                borderWidth: 1,
                data: [21, 25, 8, 12, 31, 19]
              },
              {
                label: '系列2',
                backgroundColor: colorWithAlpha(c.blue, 0.5),
                borderColor: c.blue,
                borderWidth: 1,
                data: [11, 13, 18, 9, 23, 29]
              }
            ]
          }
          break
        case 'line':
          chartType = 'line'
          data = {
            labels: ['类型1', '类型2', '类型3', '类型4', '类型5', '类型6'],
            datasets: [
              {
                label: '系列1',
                backgroundColor: colorWithAlpha(c.red, 0.5),
                borderColor: c.red,
                borderWidth: 1,
                fill: false,
                data: [21, 25, 8, 12, 31, 19]
              },
              {
                label: '系列2',
                backgroundColor: colorWithAlpha(c.blue, 0.5),
                borderColor: c.blue,
                borderWidth: 1,
                fill: false,
                data: [11, 13, 18, 9, 23, 29]
              }
            ]
          }
          break
        case 'area':
          chartType = 'line'
          data = {
            labels: ['类型1', '类型2', '类型3', '类型4', '类型5', '类型6'],
            datasets: [
              {
                label: '系列1',
                backgroundColor: colorWithAlpha(c.red, 0.5),
                borderColor: c.red,
                borderWidth: 1,
                data: [21, 25, 8, 12, 31, 19]
              },
              {
                label: '系列2',
                backgroundColor: colorWithAlpha(c.blue, 0.5),
                borderColor: c.blue,
                borderWidth: 1,
                data: [11, 13, 18, 9, 23, 29]
              }
            ]
          }
          if (!options.scales) options.scales = {}
          ;(options.scales as Record<string, unknown>).y = { stacked: true }
          break
        case 'pie':
          chartType = 'pie'
          data = {
            labels: ['类型1', '类型2', '类型3', '类型4'],
            datasets: [{
              label: '系列1',
              backgroundColor: [c.red, c.orange, c.yellow, c.green],
              data: [21, 25, 8, 12]
            }]
          }
          break
        case 'doughnut':
          chartType = 'doughnut'
          data = {
            labels: ['类型1', '类型2', '类型3', '类型4'],
            datasets: [{
              label: '系列1',
              backgroundColor: [c.red, c.orange, c.yellow, c.green],
              data: [21, 25, 8, 12]
            }]
          }
          break
        case 'radar':
          chartType = 'radar'
          data = {
            labels: ['类型1', '类型2', '类型3', '类型4', '类型5'],
            datasets: [
              {
                label: '系列1',
                backgroundColor: colorWithAlpha(c.red, 0.5),
                borderColor: c.red,
                borderWidth: 1,
                data: [21, 25, 8, 12, 31]
              },
              {
                label: '系列2',
                backgroundColor: colorWithAlpha(c.blue, 0.5),
                borderColor: c.blue,
                borderWidth: 1,
                data: [11, 13, 18, 9, 23, 9]
              }
            ]
          }
          break
        case 'polarArea':
          chartType = 'polarArea'
          data = {
            labels: ['类型1', '类型2', '类型3', '类型4'],
            datasets: [{
              label: '系列1',
              backgroundColor: [c.red, c.orange, c.yellow, c.green],
              data: [21, 25, 12, 31]
            }]
          }
          break
        case 'scatter':
          chartType = 'scatter'
          data = {
            datasets: [
              {
                label: '系列1',
                borderColor: c.red,
                backgroundColor: colorWithAlpha(c.red, 0.2),
                data: [
                  { x: 10, y: 10 }, { x: 5, y: 15 }, { x: 8, y: 12 }, { x: 18, y: 10 }
                ]
              },
              {
                label: '系列2',
                borderColor: c.blue,
                backgroundColor: colorWithAlpha(c.blue, 0.2),
                data: [
                  { x: 13, y: 6 }, { x: 25, y: 10 }, { x: 18, y: 11 }, { x: 14, y: 16 }
                ]
              }
            ]
          }
          break
        case 'bubble':
          chartType = 'bubble'
          data = {
            datasets: [
              {
                label: '系列1',
                borderColor: c.red,
                backgroundColor: colorWithAlpha(c.red, 0.2),
                data: [
                  { x: 10, y: 10, r: 4 }, { x: 5, y: 15, r: 6 }, { x: 8, y: 12, r: 2 }, { x: 18, y: 10, r: 8 }
                ]
              },
              {
                label: '系列2',
                borderColor: c.blue,
                backgroundColor: colorWithAlpha(c.blue, 0.2),
                data: [
                  { x: 13, y: 6, r: 3 }, { x: 25, y: 10, r: 9 }, { x: 18, y: 11, r: 2 }, { x: 14, y: 16, r: 10 }
                ]
              }
            ]
          }
          break
        case 'mix':
          chartType = 'bar'
          data = {
            labels: ['类型1', '类型2', '类型3', '类型4', '类型5', '类型6'],
            datasets: [
              {
                type: 'line',
                label: '系列1',
                backgroundColor: colorWithAlpha(c.red, 0.5),
                borderColor: c.red,
                data: [21, 25, 8, 12, 31, 19]
              },
              {
                type: 'bar',
                label: '系列2',
                backgroundColor: colorWithAlpha(c.blue, 0.5),
                borderColor: c.blue,
                borderWidth: 1,
                data: [11, 13, 18, 9, 23, 29]
              }
            ]
          }
          break
        default:
          showAlert($t('tools.chart.unknownChartType') + $t('colon') + type)
          return
      }

      // 处理额外 options
      const optionList = cell.value.chart.options || []
      for (const op of optionList) {
        // op 是 Record<string, unknown>，嵌套字段统一 cast 后访问
        const o = op as Record<string, any>
        switch (o.type) {
          case 'title':
            if (o.display) {
              options.plugins = options.plugins || {}
              ;(options.plugins as Record<string, unknown>).title = {
                display: true,
                position: o.position,
                text: o.text
              }
            }
            break
          case 'legend':
            options.plugins = options.plugins || {}
            ;(options.plugins as Record<string, unknown>).legend = {
              display: o.display || false,
              position: o.position,
              labels: o.labels || {}
            }
            break
          case 'layout':
            if (o.padding) {
              options.layout = {
                padding: {
                  left: o.padding.left,
                  right: o.padding.right,
                  top: o.padding.top,
                  bottom: o.padding.bottom
                }
              }
            }
            break
        }
      }

      if (chart.value) {
        chart.value.destroy()
      }
      chart.value = new Chart(canvas, {
        // chartType 是字符串，Chart 构造器期望 keyof ChartTypeRegistry
        type: chartType as keyof ChartTypeRegistry,
        data: data as ChartData,
        options: options as ChartOptions
      })
    }

    /** 更新图表（外部调用刷新） */
    const updateChart = (): void => {
      if (chart.value) {
        chart.value.update()
      }
    }

    onMounted(() => {
      renderChart()
    })
    onBeforeUnmount(() => {
      if (chart.value) {
        chart.value.destroy()
        chart.value = null
      }
    })

    return {
      chartContainerRef,
      chartCanvasRef,
      renderChart,
      updateChart
    }
  }
})
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
}
.chart-container canvas {
  max-width: 100%;
  max-height: 100%;
}
</style>
