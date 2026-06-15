/**
 * useChartConfig 通用图表配置 Composable（vue3 + TS）
 *
 * 抽取自 chart-value-editor、bubble-chart-value-editor、scatter-chart-value-editor
 * 的公共逻辑：读 / 写 cellDef.value.chart 的 options、plugins、xaxes、yaxes、dataset。
 *
 * 用法：
 * ```ts
 * const {
 *   readChartConfig,
 *   handleChartOptionChange,
 *   handleDataLabelsChange,
 *   handleAxisChange,
 *   updateDatasetConfig,
 *   updateChart,
 *   bindWatchers
 * } = useChartConfig({ rowIndex, colIndex })
 * ```
 */
import { computed, watch, type ComputedRef, type Ref } from 'vue'
import { useReportStore } from '@/store/modules/report'
import { setDirty } from '@/utils/table'
import { deepCopy } from '@/utils/comnon'
import { getCell, setCell } from '@/utils/contextActions'
import chartWidgetManager from '@/views/report/designer/edit-table/chart-widget/manager'
import type { ReportCell, ReportContext } from '@/types/report-def'

/** 图表标题 */
export interface ChartTitle {
  display: boolean
  position: string
  text: string
}

/** 图表图例 */
export interface ChartLegend {
  display: boolean
  position: string
}

/** 数据标签 */
export interface ChartDataLabels {
  display: boolean
}

/** 动画 */
export interface ChartAnimation {
  duration: number
  easing: string
}

/** 布局 */
export interface ChartLayout {
  top: number
  bottom: number
  left: number
  right: number
}

/** scaleLabel */
export interface ScaleLabel {
  display: boolean
  labelString: string
}

/** 轴配置 */
export interface AxesConfig {
  rotation: number
  scaleLabel: ScaleLabel
}

/** chart.options 元素的 type 联合类型 */
export type ChartOptionType = 'title' | 'legend' | 'animation' | 'layout'

/** chart.options 元素 */
export interface ChartOptionItem<T = unknown> {
  type: ChartOptionType | string
  [key: string]: T | string | number | boolean | undefined
}

/** chart.plugins 元素 */
export interface ChartPluginItem {
  name: string
  display: boolean
  [key: string]: unknown
}

/** 图表选项变更 payload */
export interface ChartOptionChangePayload {
  type: string
  option: Record<string, unknown>
}

/** 轴变更 payload */
export interface AxisChangePayload {
  type:
    | 'x-rotation'
    | 'x-title-display'
    | 'x-title-text'
    | 'y-rotation'
    | 'y-title-display'
    | 'y-title-text'
    | 'format'
  value: unknown
}

/** 单元格 chart 子对象 */
interface WritableChart {
  dataset?: Record<string, unknown>
  xaxes?: { rotation?: number; scaleLabel?: ScaleLabel; [key: string]: unknown }
  yaxes?: { rotation?: number; scaleLabel?: ScaleLabel; [key: string]: unknown }
  options?: ChartOptionItem[]
  plugins?: ChartPluginItem[]
  [key: string]: unknown
}

/** 入参：Ref<number> 或 getter 函数 */
export type NumberRef = Ref<number> | ComputedRef<number> | (() => number)

/** 提取数字 */
function readNumber(input: NumberRef): number {
  if (typeof input === 'function') {
    return input()
  }
  return input.value
}

interface UseChartConfigOptions {
  rowIndex: NumberRef
  colIndex: NumberRef
}

/**
 * 读取坐标对应的 cellDef（深拷贝）+ chart 子对象。
 */
function readChartCell(
  rowIndex: number,
  colIndex: number
): { cell: ReportCell | null; chart: WritableChart | null } {
  const cell = deepCopy(getCell(rowIndex, colIndex)) as ReportCell | null
  if (!cell || !cell.value || !cell.value.chart) {
    return { cell: null, chart: null }
  }
  return { cell, chart: cell.value.chart as WritableChart }
}

/**
 * 写回指定坐标的 cellDef。
 */
function writeCell(
  rowIndex: number,
  colIndex: number,
  cell: ReportCell | null
): void {
  if (cell) {
    setCell(rowIndex, colIndex, cell)
  }
}

/**
 * 在对象上安全地拿到 scaleLabel，必要时初始化默认值。
 */
function ensureScaleLabel(
  parent: { scaleLabel?: ScaleLabel } | undefined
): ScaleLabel {
  if (!parent) {
    return { display: false, labelString: '' }
  }
  if (!parent.scaleLabel) {
    parent.scaleLabel = { display: false, labelString: '' }
  }
  return parent.scaleLabel
}

export function useChartConfig(options: UseChartConfigOptions) {
  const reportStore = useReportStore()

  const context = computed(() => reportStore.getContext)
  const isCellUpdate = computed(() => reportStore.getIsCellUpdate)

  const getRow = (): number => readNumber(options.rowIndex)
  const getCol = (): number => readNumber(options.colIndex)

  /**
   * 触发 chartWidgetManager 重新渲染指定坐标的图表。
   */
  const updateChart = (): void => {
    const row = getRow()
    const col = getCol()
    const widgetKey = `${row}_${col}`
    const chartWidget = chartWidgetManager.get(widgetKey)
    if (chartWidget && context.value) {
      chartWidget.refresh(context.value as ReportContext)
    }
  }

  /**
   * 读取 cellDef.chart 的核心数据。
   * 由调用方决定如何写入 state（不同图表编辑器的 state 结构不同）。
   */
  const readChartConfig = (): {
    dataset: Record<string, unknown>
    xaxes: AxesConfig
    yaxes: AxesConfig
    options: ChartOptionItem[]
    plugins: ChartPluginItem[]
  } | null => {
    const row = getRow()
    const col = getCol()
    const cellDef = getCell(row, col)
    if (!cellDef || !cellDef.value || !cellDef.value.chart) {
      return null
    }
    const chart = cellDef.value.chart as WritableChart
    return {
      dataset: (chart.dataset as Record<string, unknown>) || {},
      xaxes: (chart.xaxes as AxesConfig) || { rotation: 0, scaleLabel: { display: false, labelString: '' } },
      yaxes: (chart.yaxes as AxesConfig) || { rotation: 0, scaleLabel: { display: false, labelString: '' } },
      options: (chart.options as ChartOptionItem[]) || [],
      plugins: (chart.plugins as ChartPluginItem[]) || []
    }
  }

  /**
   * 处理 chart.options 变化（title / legend / animation / layout）。
   * @returns 是否成功（false 表示 cellDef 不存在）
   */
  const handleChartOptionChange = (payload: ChartOptionChangePayload): boolean => {
    const row = getRow()
    const col = getCol()
    const { cell, chart } = readChartCell(row, col)
    if (!cell || !chart) {
      return false
    }

    if (!chart.options) {
      chart.options = []
    }

    const existingOption = chart.options.find((opt) => opt.type === payload.type)
    if (existingOption) {
      Object.assign(existingOption, payload.option)
    } else {
      chart.options.push({ type: payload.type, ...payload.option } as ChartOptionItem)
    }

    writeCell(row, col, cell)
    updateChart()
    setDirty()
    return true
  }

  /**
   * 处理 data-labels 插件显隐变化。
   */
  const handleDataLabelsChange = (dataLabels: ChartDataLabels): boolean => {
    const row = getRow()
    const col = getCol()
    const { cell, chart } = readChartCell(row, col)
    if (!cell || !chart) {
      return false
    }

    if (!chart.plugins) {
      chart.plugins = []
    }

    const dataLabelPlugin = chart.plugins.find((p) => p.name === 'data-labels')
    if (dataLabelPlugin) {
      dataLabelPlugin.display = dataLabels.display
    } else {
      chart.plugins.push({
        name: 'data-labels',
        display: dataLabels.display
      })
    }

    writeCell(row, col, cell)
    updateChart()
    setDirty()
    return true
  }

  /**
   * 处理 x/y 轴及 format 变化。
   */
  const handleAxisChange = (payload: AxisChangePayload): boolean => {
    const row = getRow()
    const col = getCol()
    const { cell, chart } = readChartCell(row, col)
    if (!cell || !chart) {
      return false
    }

    switch (payload.type) {
      case 'x-rotation':
        if (!chart.xaxes) chart.xaxes = {}
        ;(chart.xaxes as { rotation?: number }).rotation = payload.value as number
        break
      case 'x-title-display':
        if (!chart.xaxes) chart.xaxes = {}
        ensureScaleLabel(chart.xaxes).display = Boolean(payload.value)
        break
      case 'x-title-text':
        if (!chart.xaxes) chart.xaxes = {}
        ensureScaleLabel(chart.xaxes).labelString = String(payload.value ?? '')
        break
      case 'y-rotation':
        if (!chart.yaxes) chart.yaxes = {}
        ;(chart.yaxes as { rotation?: number }).rotation = payload.value as number
        break
      case 'y-title-display':
        if (!chart.yaxes) chart.yaxes = {}
        ensureScaleLabel(chart.yaxes).display = Boolean(payload.value)
        break
      case 'y-title-text':
        if (!chart.yaxes) chart.yaxes = {}
        ensureScaleLabel(chart.yaxes).labelString = String(payload.value ?? '')
        break
      case 'format':
        if (!chart.dataset) chart.dataset = {}
        ;(chart.dataset as Record<string, unknown>).format = payload.value
        break
    }

    writeCell(row, col, cell)
    updateChart()
    setDirty()
    return true
  }

  /**
   * 通用：合并写入 chart.dataset。
   */
  const updateDatasetConfig = (config: Record<string, unknown>): boolean => {
    const row = getRow()
    const col = getCol()
    const { cell, chart } = readChartCell(row, col)
    if (!cell || !chart) {
      return false
    }

    if (!chart.dataset) {
      chart.dataset = {}
    }
    Object.assign(chart.dataset, config)

    writeCell(row, col, cell)
    setDirty()
    return true
  }

  /**
   * 通用：写入 cellDef.value.chart 顶层字段（不更新 options）。
   */
  const updateChartField = (field: string, value: unknown): boolean => {
    const row = getRow()
    const col = getCol()
    const { cell, chart } = readChartCell(row, col)
    if (!cell || !chart) {
      return false
    }

    ;(chart as Record<string, unknown>)[field] = value
    writeCell(row, col, cell)
    updateChart()
    setDirty()
    return true
  }

  /**
   * 绑定 cellPosition + isCellUpdate 监听，外部传入加载回调。
   */
  const bindWatchers = (
    cellPositionRef: Ref<string> | ComputedRef<string>,
    onLoad: () => void
  ): void => {
    watch(
      cellPositionRef,
      () => {
        onLoad()
      },
      { immediate: true }
    )

    watch(isCellUpdate, (newVal) => {
      if (newVal) {
        onLoad()
        reportStore.setCellUpdate(false)
      }
    })
  }

  return {
    context,
    isCellUpdate,
    readChartConfig,
    handleChartOptionChange,
    handleDataLabelsChange,
    handleAxisChange,
    updateDatasetConfig,
    updateChartField,
    updateChart,
    bindWatchers
  }
}
