/**
 * chart 颜色映射
 *
 * 用途：
 * - chart-widget 渲染柱状图/折线图/饼图时通过 window.chartColors 引用这些值
 * - 把颜色常量从 class.ts 的副作用赋值抽到独立模块，避免模块加载时的全局副作用
 * - 通过 chart-widget/index.vue 顶部 import 一次即可完成 window.chartColors 注入
 */
export interface ChartColors {
  red: string
  orange: string
  yellow: string
  green: string
  blue: string
  purple: string
  grey: string
}

/** 全局 chart 颜色映射（与 chart.js 标准调色板保持一致） */
export const CHART_COLORS: ChartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
}

declare global {
  interface Window {
    chartColors: ChartColors
  }
}

window.chartColors = CHART_COLORS
