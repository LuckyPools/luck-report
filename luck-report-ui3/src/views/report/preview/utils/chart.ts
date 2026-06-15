/**
 * 图表构建工具
 *
 * 改造说明：
 * 1. 由 chart.js 改造为 chart.ts，加显式类型
 * 2. chartJson 类型使用 Chart.js 官方的 ChartConfiguration / ChartData / ChartOptions 近似表达
 * 3. 行为保持完全一致（图表转换、批量渲染、上传 base64 数据）
 *
 * 调用方：preview/index.vue（构建并上传图表数据）
 */
import { Chart, type ChartConfiguration, type ChartOptions } from 'chart.js'
import { storeChartData } from '@/api/preview'
import { getUrlSearchParams } from '@/utils/url'

/** 图表数据集原始 JSON 形态（chartJson 由后端以字符串形式返回） */
export interface ChartDataRaw {
  /** canvas DOM id */
  id: string
  /** Chart.js 配置 JSON 字符串 */
  json: string
}

/**
 * 将旧版 Chart.js 配置转换为新版（v3+）兼容格式
 * 处理 scales（xAxes/yAxes → x/y）、plugins（title/legend 迁移）和 horizontalBar 类型转换
 * @param chartJson Chart.js 图表配置对象
 * @returns 转换后的图表配置对象
 */
export function convertChartConfig(
  chartJson: ChartConfiguration | null | undefined
): ChartConfiguration | null | undefined {
  if (!chartJson || !chartJson.options) {
    return chartJson
  }

  const options = chartJson.options as ChartOptions & {
    scales?: Record<string, unknown> & {
      xAxes?: unknown[]
      yAxes?: unknown[]
    }
    title?: unknown
    legend?: unknown
  }

  if (options.scales) {
    if (options.scales.xAxes && options.scales.xAxes.length > 0) {
      ;(options.scales as Record<string, unknown>).x = options.scales.xAxes[0]
      delete (options.scales as Record<string, unknown>).xAxes
    }
    if (options.scales.yAxes && options.scales.yAxes.length > 0) {
      ;(options.scales as Record<string, unknown>).y = options.scales.yAxes[0]
      delete (options.scales as Record<string, unknown>).yAxes
    }
  }

  if (options.title) {
    options.plugins = options.plugins || {}
    ;(options.plugins as Record<string, unknown>).title = options.title
    delete options.title
  }

  if (options.legend) {
    options.plugins = options.plugins || {}
    ;(options.plugins as Record<string, unknown>).legend = options.legend
    delete options.legend
  }

  if ((chartJson.type as unknown as string) === 'horizontalBar') {
    // 类型断言：horizontalBar 仅在旧版配置中存在
    ;(chartJson as { type: string }).type = 'bar'
    ;(options as { indexAxis?: string }).indexAxis = 'y'
  }

  return chartJson
}

/**
 * 批量构建图表数据并渲染
 * 解析每个图表的 JSON 配置（支持函数字符串的 eval 还原），然后调用 buildChart 进行渲染
 * @param chartData 图表数据数组，每项包含 id 和 json 字段
 */
export function buildChartDatas(chartData: ChartDataRaw[] | null | undefined): void {
  if (!chartData) {
    return
  }
  for (const d of chartData) {
    let json: ChartConfiguration | null = null
    if (d.json) {
      json = JSON.parse(d.json, function (_k: string, v: unknown) {
        // 还原旧版以函数字符串形式存储的字段
        if (typeof v === 'string' && v.indexOf && v.indexOf('function') > -1) {
          // eslint-disable-next-line no-eval
          return eval('(function(){return ' + v + ' })()')
        }
        return v
      }) as ChartConfiguration
    }
    void buildChart(d.id, json)
  }
}

/**
 * 在指定 canvas 元素上创建 Chart.js 图表实例
 * 配置转换后设置动画完成回调，在图表渲染完毕时将图表的 base64 图片数据回传到服务端存储
 * @param canvasId canvas 元素的 DOM ID
 * @param chartJson Chart.js 图表配置对象
 */
export async function buildChart(
  canvasId: string,
  chartJson: ChartConfiguration | null
): Promise<Chart | void> {
  const ctx = document.getElementById(canvasId)
  if (!ctx) {
    return
  }
  if (!chartJson) {
    return
  }

  const cfg = convertChartConfig(chartJson) as ChartConfiguration
  const options = (cfg.options || {}) as ChartOptions
  let animation = options.animation as Record<string, unknown> | undefined
  if (!animation) {
    animation = {}
    ;(options as { animation: unknown }).animation = animation
  }

  animation.onComplete = async (context: { chart: Chart }) => {
    try {
      const chart = context.chart
      const base64Image = chart.toBase64Image()
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null
      if (!canvas) return

      const width = parseInt(canvas.style.width) || canvas.width
      const height = parseInt(canvas.style.height) || canvas.height

      const formData = new FormData()
      formData.append('_base64Data', base64Image)
      formData.append('_chartId', canvasId)
      formData.append('_width', String(width))
      formData.append('_height', String(height))

      const params = getUrlSearchParams()
      for (const [key, value] of params.entries()) {
        formData.append(key, value)
      }

      await storeChartData(formData)
    } catch (error) {
      console.error('存储图表数据失败:', error)
    }
  }

  return new Chart(ctx as HTMLCanvasElement, cfg)
}
