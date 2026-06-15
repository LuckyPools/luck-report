<template>
  <div
    v-show="showPrintLine"
    ref="printLine"
    :title="t('tools.printLine.title')"
    class="right-hr-for-print"
    :style="lineStyle"
  ></div>
</template>

<script setup lang="ts">
/**
 * PrintLine 打印线组件（vue3 + TS）
 *
 * 工作流程：
 * 1. 从 pinia store 读取 showPrintLine 控制显隐
 * 2. 监听 isPrintLineRefresh 标志，变化时根据 paper 配置重新计算水平位置并重置标志
 * 3. 监听窗口 resize，重新计算打印线高度（高度 = 视口高度 - 90px）
 *
 * 调用方：
 * - src/views/report/designer/index.vue（直接挂载）
 * - src/views/report/designer/edit-table/index.vue（嵌套挂载）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - Vuex getter 改为 Pinia getter（useReportStore()）
 * - Vuex dispatch('report/setIsPrintLineRefresh', false) 改为 store action 调用
 * - data().lineStyle 改为 reactive 对象
 * - beforeUnmount 改为 onBeforeUnmount
 *
 * 类型说明：
 * - lineStyle 直接复用 vue 提供的 CSSProperties 类型
 * - paper 上的自定义字段（orientation/width/height/leftMargin/rightMargin）
 *   抽到本地 PaperFields 接口，访问前做可选链处理
 */
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  type CSSProperties
} from 'vue'
import { useReportStore } from '@/store/modules/report'
import type { ReportContext } from '@/types/report-def'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'PrintLine' })


const { t } = useI18n()
/** paper 上读取打印线位置需要用到的字段（domain 扩展字段，单独抽接口） */
interface PaperFields {
  orientation?: string
  width?: number
  height?: number
  leftMargin?: number
  rightMargin?: number
}

const reportStore = useReportStore()

/** 模板 ref */
const printLine = ref<HTMLElement | null>(null)

/**
 * 打印线样式（reactive 容器，对象属性变化可被响应式追踪）
 * - zIndex 使用数字，Vue 会自动转成 px-less 数字样式
 * - 宽度单位沿用 'pt'，与 paper 字段保持一致
 */
const lineStyle = reactive<CSSProperties>({
  height: '0px',
  width: '0px',
  borderLeft: 'dashed 1px #999999',
  position: 'absolute',
  left: '300pt',
  top: '35px',
  zIndex: 10
})

/** 从 store 获取 context */
const context = computed<ReportContext | null>(() => reportStore.getContext)

/** 打印线刷新标志 */
const isPrintLineRefresh = computed<boolean>(() => reportStore.getPrintLineShouldRefresh)

/** 打印线显示状态 */
const showPrintLine = computed<boolean>(() => reportStore.getShowPrintLine)

/**
 * 更新打印线高度
 * - 高度 = 视口高度 - 90（顶部工具栏与边距占用的固定像素）
 */
function updateLineHeight(): void {
  const height = window.innerHeight - 90
  lineStyle.height = height + 'px'
}

/**
 * 刷新打印线位置（根据 paper 配置）
 * - 横向时交换 width / height
 * - 实际可用宽度 = 纸张宽度 - 左右边距 + 偏移量 38
 */
function refresh(): void {
  const ctx = context.value
  if (!ctx || !ctx.reportDef || !ctx.reportDef.paper) {
    return
  }
  const paper = ctx.reportDef.paper as PaperFields
  const orientation = paper.orientation
  let width = paper.width ?? 0

  // 横向时交换宽高
  if (orientation === 'landscape') {
    width = paper.height ?? 0
  }

  const leftMargin = paper.leftMargin ?? 0
  const rightMargin = paper.rightMargin ?? 0
  const actualWidth = width - leftMargin - rightMargin + 38
  lineStyle.left = actualWidth + 'pt'
}

// 监听刷新标志，为 true 时刷新并重置标志
watch(isPrintLineRefresh, (newVal) => {
  if (newVal) {
    refresh()
    reportStore.setIsPrintLineRefresh(false)
  }
})

onMounted(() => {
  // 监听窗口大小变化 + 初始化打印线高度
  window.addEventListener('resize', updateLineHeight)
  updateLineHeight()
})

onBeforeUnmount(() => {
  // 清理事件监听
  window.removeEventListener('resize', updateLineHeight)
})
</script>

<style scoped>
/* 组件特定样式（如有需要在此扩展） */
</style>
