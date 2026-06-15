<template>
  <div
    id="preview-container"
    :class="{ 'right-collapsed': !isShowSearchForm }"
  >
    <div class="preview-left">
      <div class="preview-left-fixed">
        <ToolBox
          :report-data="reportData"
          :report-name="currentReportName"
          :current-page="currentPage"
          :page-enable="pageEnable"
          :search-form-parameters="searchFormParameters"
          @page-change="handlePageChange"
          @page-enable-change="handlePageEnableChange"
        />
      </div>
      <div class="preview-left-scroll">
        <div
          id="report-table"
          v-if="reportData && reportData.content"
          v-html="reportData.content"
          :style="{ float: reportData.reportAlign || 'left' }"
        ></div>
      </div>
    </div>
    <div
      v-if="isRenderSearchForm"
      class="collapse-btn"
      @click="toggleCollapse"
    >
      <LeftOutlined v-if="isShowSearchForm" />
      <RightOutlined v-else />
    </div>
    <div
      v-if="isRenderSearchForm"
      class="preview-right"
      :class="{ collapsed: !isShowSearchForm }"
    >
      <div class="preview-right-content">
        <SearchBox
          :search-form-config="searchFormConfig"
          @submit="handleFormSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 报表预览主页面
 *
 * 改造要点：
 * 1. Vue2 Options API → Vue3 <script setup> + TypeScript
 * 2. 自定义 ToolBox / SearchBox 组件沿用本目录的 Vue3 升级版（已替换 ant-design-vue 组件）
 * 3. $t / $emit / $refs / 事件总线等 Vue2 实例属性统一改用 vue-i18n + defineEmits + emitter
 * 4. Chart.js 注册逻辑放进 onMounted，确保与运行时一致
 * 5. setLocale 改走 src/locales 的 setLocale
 * 6. Vuex 状态不再依赖；如需报表上下文可从 useReportStore() 获取
 */
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { Chart, registerables } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import '@/assets/css/preview/index.css'
import { loadReportData, loadHtml } from '@/api/preview'
import { buildChartDatas } from '@/views/report/preview/utils/chart'
import SearchBox from '@/views/report/preview/search-box/index.vue'
import ToolBox from '@/views/report/preview/tool-box/index.vue'
import { updateUrlParams, getUrlSearchParams } from '@/utils/url'
import { isMobile, showAlert } from '@/utils/comnon'
import showLoading from '@/utils/loading'
import { setLocale as setI18nLocale } from '@/locales'

/** 报表工具可见性 */
interface ReportTools {
  show: boolean
  print: boolean
  pdfPrint: boolean
  pdfPreviewPrint: boolean
  pdf: boolean
  word: boolean
  excel: boolean
  pagingExcel: boolean
  sheetPagingExcel: boolean
  paging: boolean
}

/** 图表数据 */
interface ChartData {
  id: string
  json: string
}

/** 报表数据 */
interface ReportData {
  content: string
  reportAlign?: string
  tools: ReportTools
  totalPageWithCol?: number
  totalPage?: number
  pageIndex?: number
  chartDatas?: ChartData[]
  intervalRefreshValue?: number
  searchForm: Record<string, unknown> | null
  style: string
  [key: string]: unknown
}

const { t } = useI18n()

// 定义对外事件：ready 在报表拉取成功时触发，error 在拉取失败时触发
const emit = defineEmits<{
  (e: 'ready', payload: { reportData: ReportData | null }): void
  (e: 'error', error: unknown): void
}>()

// 注册 Chart.js
Chart.register(...registerables, ChartDataLabels)

const reportData = ref<ReportData | null>(null)
const currentReportName = ref('')
const totalPage = ref(0)
const currentPage = ref(1)
const searchFormParameters = reactive<Record<string, unknown>>({})
const searchFormConfig = ref<Record<string, unknown> | null>(null)
const reportPath = ref('')
const mode = ref('')
const toolsInfo = ref<string | null>(null)
const pageIndex = ref<string | null>(null)
const extraParams = reactive<Record<string, string>>({})
const isShowSearchForm = ref(true)

/** 分页是否启用 */
const pageEnable = computed(() => pageIndex.value != null && parseInt(pageIndex.value) > 0)

/** 是否需要渲染搜索表单 */
const isRenderSearchForm = computed(() => {
  const cfg = searchFormConfig.value
  if (!cfg) return false
  const fields = (cfg as { fields?: unknown[] }).fields
  return !!(fields && Array.isArray(fields) && fields.length)
})

/** 切换右侧搜索表单的展开 / 折叠 */
function toggleCollapse(): void {
  isShowSearchForm.value = !isShowSearchForm.value
}

/** 初始化报表（拉取数据 + 注入样式 + 启动图表） */
async function initReport(): Promise<ReportData | null> {
  const data = await fetchPageData(pageIndex.value)
  if (!data) return null

  setWebTitle()
  searchFormConfig.value = data.searchForm as Record<string, unknown>
  injectReportStyle(data.style)
  initFunctions()

  emit('ready', { reportData: data })
  return data
}

/** 设置网页标题 */
function setWebTitle(): void {
  let name = (extraParams._title as string) || reportPath.value
  if (name) {
    name = decodeURIComponent(name)
  }
  if (name && name.endsWith('.ureport.xml')) {
    name = name.replace('.ureport.xml', '')
  }
  currentReportName.value = name
  if (name) {
    document.title = name
  }
}

/**
 * 加载并渲染指定页
 * @param pageIndex 目标页码
 */
async function loadPageData(pageIndex: string | number | null): Promise<void> {
  const data = await fetchPageData(pageIndex)
  if (!data) return
  renderReportContent(data)
}

/**
 * 拉取页面数据
 * - 构造请求参数
 * - 调用 loadHtml 接口
 * - 处理错误和 loading
 * @param targetPageIndex 目标页码
 */
async function fetchPageData(targetPageIndex: string | number | null | undefined): Promise<ReportData | null> {
  const loadingInstance = showLoading({ text: t('preview.loading.report') })
  try {
    const params = getReportParams(targetPageIndex)
    const data = (await loadHtml(params)) as ReportData
    data.tools = computeTools()
    Object.freeze(data)
    reportData.value = data
    currentPage.value = parseInt(String(data.pageIndex || targetPageIndex)) || 1
    totalPage.value = extractTotalPage(data)
    return data
  } catch (error) {
    const err = error as { msg?: string }
    if (err.msg) {
      showAlert(t('preview.error.loadReportFail') + t('colon') + err.msg, { useHTMLString: true })
    } else {
      showAlert(t('preview.error.loadReportFail'))
    }
    emit('error', error)
    return null
  } finally {
    loadingInstance.close()
  }
}

/**
 * 处理搜索表单提交
 * - 更新 searchFormParameters
 * - 重置到第一页（若分页启用）并重新加载报表
 * @param formData 表单数据
 */
async function handleFormSubmit(formData: Record<string, unknown>): Promise<void> {
  // 一次性清空再合并，避免 delete 触发多次响应式更新
  Object.keys(searchFormParameters).forEach((k) => delete searchFormParameters[k])
  Object.assign(searchFormParameters, formData)
  try {
    await loadAndRenderReport({ resetToFirstPage: pageEnable.value })
  } catch (error) {
    const err = error as { msg?: string }
    if (err.msg) {
      showAlert(t('dialog.save.serverError') + t('colon') + err.msg, { useHTMLString: true })
    } else {
      showAlert(t('dialog.save.serverError'))
    }
    console.error('提交搜索表单失败:', error)
  }
}

/**
 * 加载并渲染报表
 * - resetToFirstPage=true 时强制回到第 1 页（用于表单提交后）
 * - 否则按当前页加载（用于定时刷新）
 * @param options 行为选项
 */
async function loadAndRenderReport(options: { resetToFirstPage?: boolean } = {}): Promise<ReportData | null> {
  const { resetToFirstPage = false } = options
  let targetPage: string | number | null
  if (resetToFirstPage) {
    currentPage.value = 1
    pageIndex.value = '1'
    targetPage = 1
    updateUrlParams({ _i: 1 }, true)
  } else if (pageIndex.value != null) {
    if (totalPage.value > 0 && currentPage.value > totalPage.value) {
      currentPage.value = 1
    }
    targetPage = currentPage.value
  } else {
    targetPage = null
  }

  const params = getReportParams(targetPage)
  const report = (await loadReportData(params)) as ReportData
  renderReportContent(report)

  totalPage.value = extractTotalPage(report)
  currentPage.value = parseInt(String(report.pageIndex)) || currentPage.value

  const totalPageLabel = document.getElementById('totalPageLabel')
  if (totalPageLabel) {
    totalPageLabel.textContent = String(totalPage.value)
  }
  return report
}

/** 解析 URL 中的查询参数到组件状态 */
function parseParamsFromUrl(): void {
  const searchParams = getUrlSearchParams()
  reportPath.value = searchParams.get('reportPath') || ''
  mode.value = searchParams.get('mode') || ''
  toolsInfo.value = searchParams.get('_t')
  pageIndex.value = searchParams.get('_i')

  Object.keys(extraParams).forEach((k) => delete extraParams[k])
  const localKeys = ['_i', '_t', '_r', '_n', 'mode', 'reportPath', 'lang']
  for (const [key, value] of searchParams) {
    if (!localKeys.includes(key)) {
      extraParams[key] = value
    }
  }

  const lang = searchParams.get('lang')
  if (lang) {
    setI18nLocale(lang as 'zh' | 'en')
  }
}

/** 浏览器前进 / 后退触发 */
function handlePopState(): void {
  const oldPageIndex = pageIndex.value
  parseParamsFromUrl()
  if (oldPageIndex !== pageIndex.value) {
    void loadPageData(pageIndex.value || 1)
  }
}

/**
 * 构造请求参数
 * @param targetPageIndex 目标页码
 */
function getReportParams(targetPageIndex: string | number | null | undefined): Record<string, unknown> {
  if (!reportPath.value) {
    throw new Error(t('preview.error.fileParamMissing'))
  }
  const params: Record<string, unknown> = { reportPath: reportPath.value }
  if (mode.value) params.mode = mode.value
  if (targetPageIndex != null) params._i = targetPageIndex
  if (toolsInfo.value != null) params._t = toolsInfo.value
  Object.assign(params, extraParams)
  mergeSearchFormParams(params)
  return params
}

/** 将搜索表单参数合并到目标对象（值空不覆盖） */
function mergeSearchFormParams(target: Record<string, unknown>): void {
  Object.keys(searchFormParameters).forEach((key) => {
    const value = searchFormParameters[key]
    if (value) {
      target[key] = value
    }
  })
}

/**
 * 渲染报表内容
 * - 注入 HTML 到 #report-table
 * - 渲染图表
 * @param data 报表数据
 */
function renderReportContent(data: ReportData): void {
  const tableContainer = document.getElementById('report-table')
  if (tableContainer) {
    tableContainer.innerHTML = data.content
  }
  if (data.chartDatas) {
    buildChartDatas(data.chartDatas)
  }
}

/** 提取总页数（优先 totalPageWithCol） */
function extractTotalPage(data: ReportData): number {
  return (data.totalPageWithCol as number) || (data.totalPage as number) || 0
}

/** 计算工具栏可见性（移动端全部关闭，其他按 _t 配置） */
function computeTools(): ReportTools {
  const allOff: ReportTools = {
    show: false,
    print: false,
    pdfPrint: false,
    pdfPreviewPrint: false,
    pdf: false,
    word: false,
    excel: false,
    pagingExcel: false,
    sheetPagingExcel: false,
    paging: false
  }
  const allOn: ReportTools = {
    show: true,
    print: true,
    pdfPrint: true,
    pdfPreviewPrint: true,
    pdf: true,
    word: true,
    excel: true,
    pagingExcel: true,
    sheetPagingExcel: true,
    paging: true
  }
  if (isMobile()) return allOff
  if (toolsInfo.value == null || toolsInfo.value === '') return allOn
  if (String(toolsInfo.value) === '0') return allOff

  const tools: ReportTools = { ...allOff, show: true }
  const map: Record<string, keyof ReportTools> = {
    '1': 'print',
    '2': 'pdfPrint',
    '3': 'pdfPreviewPrint',
    '4': 'pdf',
    '5': 'word',
    '6': 'excel',
    '7': 'pagingExcel',
    '8': 'sheetPagingExcel',
    '9': 'paging'
  }
  String(toolsInfo.value).split(',').forEach((key) => {
    const k = map[key]
    if (k) tools[k] = true
  })
  return tools
}

/** 注入报表样式到 <head> */
function injectReportStyle(style: string): void {
  let styleElement = document.getElementById('report-table-style') as HTMLStyleElement | null
  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = 'report-table-style'
    document.head.appendChild(styleElement)
  }
  styleElement.textContent = style || ''
}

/** 定时刷新报表（递归 setTimeout 实现） */
let refreshTimer: number | null = null
async function refreshReport(second: number): Promise<void> {
  try {
    await loadAndRenderReport({ resetToFirstPage: false })
  } catch (error) {
    console.error('刷新数据失败:', error)
    const err = error as { msg?: string }
    if (err.msg) {
      showAlert(t('dialog.save.serverError') + t('colon') + err.msg, { useHTMLString: true })
    } else {
      showAlert(t('dialog.save.fail'))
    }
  } finally {
    refreshTimer = window.setTimeout(() => {
      void refreshReport(second)
    }, second)
  }
}

/**
 * 启动定时刷新
 * @param value 刷新间隔（秒）
 * @param totalPageArg 总页数（兼容旧 API）
 */
function intervalRefresh(value: number, totalPageArg: number): void {
  if (!value) return
  totalPage.value = totalPageArg
  const second = value * 1000
  refreshTimer = window.setTimeout(() => {
    void refreshReport(second)
  }, second)
}

/** 初始化图表渲染与定时刷新（延时 500ms 让 DOM 就绪） */
function initFunctions(): void {
  setTimeout(() => {
    const data = reportData.value
    if (!data) return
    if (data.intervalRefreshValue && data.intervalRefreshValue > 0) {
      intervalRefresh(data.intervalRefreshValue, totalPage.value)
    }
    if (data.chartDatas && data.chartDatas.length > 0) {
      buildChartDatas(data.chartDatas)
    }
  }, 500)
}

/**
 * 处理分页切换事件
 * @param newPageIndex 目标页码；null 表示不分页
 */
function handlePageChange(newPageIndex: number | null): void {
  updateUrlParams({ _i: newPageIndex }, true)
  pageIndex.value = newPageIndex != null ? String(newPageIndex) : null
  if (newPageIndex != null) {
    void loadPageData(newPageIndex)
  } else {
    void initReport()
  }
}

/**
 * 处理分页开关切换
 * @param enable true 启用分页，false 禁用分页
 */
function handlePageEnableChange(enable: boolean): void {
  if (enable) {
    handlePageChange(1)
  } else {
    updateUrlParams({ _i: null })
    pageIndex.value = null
    void initReport()
  }
}

onMounted(() => {
  parseParamsFromUrl()
  window.addEventListener('popstate', handlePopState)
  void initReport().then(() => {
    isShowSearchForm.value = isRenderSearchForm.value
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handlePopState)
  if (refreshTimer != null) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
})

/**
 * 父组件可通过 ref 调用以下方法控制当前预览页
 * - refresh: 重新解析 URL 参数并重新初始化报表
 * - setReportPath: 切换报表路径
 * - setParams: 追加 / 覆盖 URL 参数
 * - setLocale: 切换语言
 */
function refresh(): void {
  parseParamsFromUrl()
  void initReport()
}

function setReportPath(path: string): void {
  updateUrlParams({ reportPath: path })
  reportPath.value = path
  if (path) {
    void initReport()
  }
}

function setParams(params: Record<string, string>): void {
  updateUrlParams(params)
  parseParamsFromUrl()
  void initReport()
}

function setLocale(locale: 'zh' | 'en'): void {
  setI18nLocale(locale)
}

defineExpose({
  refresh,
  setReportPath,
  setParams,
  setLocale
})
</script>
