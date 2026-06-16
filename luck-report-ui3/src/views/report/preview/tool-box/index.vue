<template>
  <div
    v-if="reportData && reportData.tools && reportData.tools.show"
    class="tools-content"
  >
    <a-row type="flex" align="middle" class="tools-row">
      <a-col :span="11" class="tools-left">
        <div class="pagination-group">
          <a-dropdown v-if="reportData.tools.paging" trigger="click">
            <a-button class="pagination-dropdown-btn" :bordered="false">
              <span class="button-text">{{
                pageEnable ? t('preview.paging.pagingPreview') : t('preview.paging.preview')
              }}</span>
              <DownOutlined />
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item key="preview" @click="changePageEnable(false)">
                  <span>{{ t('preview.paging.preview') }}</span>
                </a-menu-item>
                <a-menu-item key="paging" @click="changePageEnable(true)">
                  <span>{{ t('preview.paging.pagingPreview') }}</span>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <span v-if="reportData.tools.paging && pageEnable" class="pagination-divider"></span>
          <template v-if="reportData.tools.paging && pageEnable">
            <a-button
              type="text"
              size="small"
              class="pagination-btn"
              :disabled="currentPage <= 1"
              :title="t('preview.buttons.firstPage')"
              @click="goToFirstPage"
            >
              <StepBackwardOutlined />
              <span class="pagination-btn-text">{{ t('preview.buttons.firstPage') }}</span>
            </a-button>
            <span class="pagination-divider"></span>
            <a-button
              type="text"
              size="small"
              class="pagination-btn"
              :disabled="currentPage <= 1"
              :title="t('preview.buttons.prevPage')"
              @click="goToPrevPage"
            >
              <LeftOutlined />
              <span class="pagination-btn-text">{{ t('preview.buttons.prevPage') }}</span>
            </a-button>
            <span class="pagination-divider"></span>
            <div class="pagination-input-group">
              <input
                v-model="inputPage"
                type="text"
                class="pagination-input"
                @keyup.enter="handleInputPageChange"
                @blur="handleInputPageChange"
              />
              <span class="pagination-total">/ {{ reportData.totalPageWithCol }}</span>
            </div>
            <span class="pagination-divider"></span>
            <a-button
              type="text"
              size="small"
              class="pagination-btn"
              :disabled="currentPage >= reportData.totalPageWithCol"
              :title="t('preview.buttons.nextPage')"
              @click="goToNextPage"
            >
              <span class="pagination-btn-text">{{ t('preview.buttons.nextPage') }}</span>
              <RightOutlined />
            </a-button>
            <span class="pagination-divider"></span>
            <a-button
              type="text"
              size="small"
              class="pagination-btn"
              :disabled="currentPage >= reportData.totalPageWithCol"
              :title="t('preview.buttons.lastPage')"
              @click="goToLastPage"
            >
              <span class="pagination-btn-text">{{ t('preview.buttons.lastPage') }}</span>
              <StepForwardOutlined />
            </a-button>
          </template>
        </div>
      </a-col>

      <a-col :span="2" class="tools-center">
        <span class="report-name">{{ displayReportName }}</span>
      </a-col>

      <a-col :span="11" class="tools-right">
        <a-tooltip
          v-if="reportData.tools.print"
          :title="t('preview.buttons.print')"
        >
          <a-button class="p-button" @click="print">
            <img src="@/assets/icons/print.svg" width="20" height="20" />
          </a-button>
        </a-tooltip>

        <a-tooltip
          v-if="reportData.tools.pdfPrint"
          :title="t('preview.buttons.pdfDirectPrint')"
        >
          <a-button class="p-button" @click="printDirectPdf">
            <img src="@/assets/icons/pdf-direct-print.svg" width="20" height="20" />
          </a-button>
        </a-tooltip>

        <a-tooltip
          v-if="reportData.tools.pdfPreviewPrint"
          :title="t('preview.buttons.pdfPreviewPrint')"
        >
          <a-button class="p-button" @click="printPdf">
            <img src="@/assets/icons/pdf-print.svg" width="20" height="20" />
          </a-button>
        </a-tooltip>

        <a-tooltip
          v-if="reportData.tools.pdf"
          :title="t('preview.buttons.exportPdf')"
        >
          <a-button class="p-button" @click="exportPdf">
            <img src="@/assets/icons/pdf.svg" width="20" height="20" />
          </a-button>
        </a-tooltip>

        <a-tooltip
          v-if="reportData.tools.word"
          :title="t('preview.buttons.exportWord')"
        >
          <a-button class="p-button" @click="exportWord">
            <img src="@/assets/icons/word.svg" width="20" height="20" />
          </a-button>
        </a-tooltip>

        <a-tooltip
          v-if="reportData.tools.excel"
          :title="t('preview.buttons.exportExcel')"
        >
          <a-button class="p-button" @click="exportExcel">
            <img src="@/assets/icons/excel.svg" width="20" height="20" />
          </a-button>
        </a-tooltip>

        <a-tooltip
          v-if="reportData.tools.pagingExcel"
          :title="t('preview.buttons.exportExcelPaging')"
        >
          <a-button class="p-button" @click="exportExcelPaging">
            <img src="@/assets/icons/excel-paging.svg" width="20" height="20" />
          </a-button>
        </a-tooltip>

        <a-tooltip
          v-if="reportData.tools.sheetPagingExcel"
          :title="t('preview.buttons.exportExcelSheetPaging')"
        >
          <a-button class="p-button" @click="exportExcelPagingSheet">
            <img
              src="@/assets/icons/excel-with-paging-sheet.svg"
              width="20"
              height="20"
            />
          </a-button>
        </a-tooltip>
      </a-col>
    </a-row>

    <PDFPrintDialog
      :visible="pdfPrintDialogVisible"
      :parameters="pdfPrintParameters"
      @close="handlePdfPrintDialogClose"
    />

    <iframe name="print_frame" width="0" height="0" frameborder="0" src="about:blank"></iframe>
    <iframe name="print_pdf_frame" width="0" height="0" frameborder="0" src="about:blank"></iframe>
  </div>
</template>

<script setup lang="ts">
/**
 * 报表预览工具栏
 *
 * 改造要点：
 * 1. Vue2 Options API → Vue3 <script setup> + TypeScript
 * 2. 自定义 u-button / u-row / u-col / ButtonGroup 改为 ant-design-vue 的 a-button / a-row / a-col / a-dropdown
 * 3. iconfont 图标改为 @ant-design/icons-vue 中的线性图标
 * 4. $t / $emit / $refs 等 Vue2 实例属性统一改用 vue-i18n + defineEmits + ref
 * 5. 自定义 Loading 实例沿用 @/utils/loading
 */
import { ref, computed, watch } from 'vue'
import {
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  StepBackwardOutlined,
  StepForwardOutlined
} from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import {
  loadPrintPages,
  exportPdfBlob,
  exportWordBlob,
  exportExcelBlob,
  exportExcelPagingBlob,
  exportExcelSheetPagingBlob,
  getPdfPrintBlob,
  loadPagePaper
} from '@/api/preview'
import { pointToMM } from '@/utils/table'
import showLoading from '@/utils/loading'
import { showAlert } from '@/utils/comnon'
import PDFPrintDialog from '@/views/report/preview/pdf-print-dialog/index.vue'
import { buildLocationSearchParameters } from '@/views/report/preview/utils/render'

/** 报表工具可见性配置 */
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

/** 报表数据 */
interface ReportData {
  totalPageWithCol?: number
  pageIndex?: number
  tools: ReportTools
  [key: string]: unknown
}

/** 纸张配置 */
interface PaperConfig {
  paperType: string
  width: number
  height: number
  orientation: string
  leftMargin: number
  rightMargin: number
  topMargin: number
  bottomMargin: number
}

const props = withDefaults(
  defineProps<{
    reportData: ReportData | null
    reportName?: string
    currentPage?: number
    pageEnable?: boolean
    searchFormParameters?: Record<string, unknown>
  }>(),
  {
    reportData: null,
    reportName: '',
    currentPage: 1,
    pageEnable: false,
    searchFormParameters: () => ({})
  }
)

const emit = defineEmits<{
  (e: 'page-change', pageIndex: number | null): void
  (e: 'page-enable-change', pageEnable: boolean): void
}>()

const { t } = useI18n()

/** 报表打印菜单项（每页一项） */
interface PageMenuItem {
  text: string
  action: () => void
}

const pageMenuItems = ref<PageMenuItem[]>([])
const pdfPrintDialogVisible = ref(false)
const printIndex = ref(0)
const inputPage = ref<string>(String(props.currentPage))

/** 显示的报表名称（去掉文件名前缀和 .ureport.xml 后缀） */
const displayReportName = computed(() => {
  if (!props.reportName) {
    return ''
  }
  let name = props.reportName
  const colonIndex = name.indexOf(':')
  if (colonIndex > -1) {
    name = name.substring(colonIndex + 1)
  }
  if (name.endsWith('.ureport.xml')) {
    name = name.replace('.ureport.xml', '')
  }
  return name
})

/** PDF 打印对话框所需的合并参数对象 */
const pdfPrintParameters = computed(() => {
  const urlParameters = buildLocationSearchParameters(props.searchFormParameters)
  const params = new URLSearchParams(urlParameters)
  const paramObj: Record<string, string> = {}
  for (const [key, value] of params.entries()) {
    paramObj[key] = value
  }
  return paramObj
})

/**
 * 构建打印样式字符串
 * 根据纸张配置生成 @page 和 @media print 的 CSS 样式
 * @param paper 纸张配置
 * @returns CSS 样式字符串
 */
function buildPrintStyle(paper: PaperConfig): string {
  const marginLeft = pointToMM(paper.leftMargin)
  const marginTop = pointToMM(paper.topMargin)
  const marginRight = pointToMM(paper.rightMargin)
  const marginBottom = pointToMM(paper.bottomMargin)
  let page: string = paper.paperType
  if (paper.paperType === 'CUSTOM') {
    page = `${pointToMM(paper.width)}mm ${pointToMM(paper.height)}mm`
  }
  return `
    @media print {
        .page-break{
            display: block;
            page-break-before: always;
        }
    }
    @page {
      size: ${page} ${paper.orientation};
      margin-left: ${marginLeft}mm;
      margin-top: ${marginTop}mm;
      margin-right:${marginRight}mm;
      margin-bottom:${marginBottom}mm;
    }
  `
}

/** 获取导出接口的请求参数 */
function getExportParams(): Record<string, string> {
  const urlParameters = buildLocationSearchParameters(props.searchFormParameters)
  const params = new URLSearchParams(urlParameters)
  const paramObj: Record<string, string> = {}
  for (const [key, value] of params.entries()) {
    paramObj[key] = value
  }
  return paramObj
}

/** 浏览器直接打印 */
async function print(): Promise<void> {
  let loadingInstance: { close: () => void } | null = null
  try {
    const urlParameters = buildLocationSearchParameters(props.searchFormParameters)
    const params = new URLSearchParams(urlParameters)
    const formData = new FormData()
    for (const [key, value] of params.entries()) {
      formData.append(key, value)
    }
    loadingInstance = showLoading({ text: t('preview.loading.default') })
    const result = await loadPrintPages(formData)
    const paper = (await loadPagePaper(formData)) as PaperConfig
    loadingInstance.close()
    loadingInstance = null

    const html = result.html
    const iFrame = window.frames['print_frame']
    let styles = `<style type="text/css">`
    styles += buildPrintStyle(paper)
    const styleElement = document.getElementById('report-table-style')
    styles += styleElement ? styleElement.textContent : ''
    styles += `</style>`

    iFrame.document.body.innerHTML = styles + html
    iFrame.window.focus()
    iFrame.window.print()
  } catch (error) {
    if (loadingInstance) {
      loadingInstance.close()
    }
    console.error('打印失败:', error)
    const err = error as { msg?: string }
    if (err.msg) {
      showAlert(t('preview.error.serverError') + t('colon') + err.msg, { useHTMLString: true })
    } else {
      showAlert(t('preview.error.serverErrorSimple'))
    }
  }
}

/** 打开 PDF 打印对话框 */
function printPdf(): void {
  pdfPrintDialogVisible.value = true
}

/** 关闭 PDF 打印对话框 */
function handlePdfPrintDialogClose(): void {
  pdfPrintDialogVisible.value = false
}

/** PDF 直接打印（通过 blob iframe） */
async function printDirectPdf(): Promise<void> {
  const loadingInstance = showLoading({ text: t('preview.loading.default') })
  try {
    const paramObj = getExportParams()
    paramObj['_i'] = String(printIndex.value++)
    const { blobUrl, revoke } = await getPdfPrintBlob(paramObj)
    const iframe = window.frames['print_pdf_frame']
    const pdfFrame = document.querySelector("iframe[name='print_pdf_frame']")
    if (pdfFrame) {
      const handleLoad = () => {
        loadingInstance.close()
        try {
          iframe.window.focus()
          iframe.window.print()
        } catch (error) {
          console.error('打印失败:', error)
        } finally {
          setTimeout(revoke, 1000)
        }
      }
      const handleError = () => {
        loadingInstance.close()
        revoke()
        console.error('PDF加载失败')
        showAlert(t('preview.error.loadPdfFail'))
      }
      pdfFrame.addEventListener('load', handleLoad, { once: true })
      pdfFrame.addEventListener('error', handleError, { once: true })
    }
    iframe.location.href = blobUrl
  } catch (error) {
    loadingInstance.close()
    console.error('PDF直接打印失败:', error)
    showAlert(t('preview.error.loadPdfFail'))
  }
}

/** 导出 PDF */
async function exportPdf(): Promise<void> {
  try {
    await exportPdfBlob(getExportParams())
  } catch (error) {
    console.error('导出PDF失败:', error)
    showAlert(t('preview.error.exportFail'))
  }
}

/** 导出 Word */
async function exportWord(): Promise<void> {
  try {
    await exportWordBlob(getExportParams())
  } catch (error) {
    console.error('导出Word失败:', error)
    showAlert(t('preview.error.exportFail'))
  }
}

/** 导出分页 Sheet 的 Excel（每页一个 Sheet） */
async function exportExcelPagingSheet(): Promise<void> {
  try {
    await exportExcelSheetPagingBlob(getExportParams())
  } catch (error) {
    console.error('导出Excel失败:', error)
    showAlert(t('preview.error.exportFail') || '导出失败')
  }
}

/** 导出分页 Excel */
async function exportExcelPaging(): Promise<void> {
  try {
    await exportExcelPagingBlob(getExportParams())
  } catch (error) {
    console.error('导出Excel失败:', error)
    showAlert(t('preview.error.exportFail') || '导出失败')
  }
}

/** 导出 Excel */
async function exportExcel(): Promise<void> {
  try {
    await exportExcelBlob(getExportParams())
  } catch (error) {
    console.error('导出Excel失败:', error)
    showAlert(t('preview.error.exportFail') || '导出失败')
  }
}

/** 跳到首页 */
function goToFirstPage(): void {
  if (props.currentPage > 1) {
    emit('page-change', 1)
  }
}

/** 跳到末页 */
function goToLastPage(): void {
  const total = props.reportData?.totalPageWithCol ?? 0
  if (props.currentPage < total) {
    emit('page-change', total)
  }
}

/** 跳到上一页 */
function goToPrevPage(): void {
  if (props.currentPage > 1) {
    emit('page-change', props.currentPage - 1)
  }
}

/** 跳到下一页 */
function goToNextPage(): void {
  const total = props.reportData?.totalPageWithCol ?? 0
  if (props.currentPage < total) {
    emit('page-change', props.currentPage + 1)
  }
}

/**
 * 处理输入框页码跳转
 * - 非数字 / <1：回退到 1
 * - 超过总页：跳到末页
 * - 等于当前页：仅同步 inputPage 文本
 */
function handleInputPageChange(): void {
  const page = Number(inputPage.value)
  const totalPages = props.reportData?.totalPageWithCol ?? 0

  if (isNaN(page) || page < 1) {
    inputPage.value = '1'
    emit('page-change', 1)
    return
  }
  if (page > totalPages) {
    inputPage.value = String(totalPages)
    emit('page-change', totalPages)
    return
  }
  if (page !== props.currentPage) {
    emit('page-change', page)
  } else {
    inputPage.value = String(props.currentPage)
  }
}

/** 跳转到指定页 */
function handlePageChange(pageIndex: number): void {
  emit('page-change', pageIndex)
}

/** 切换分页启用状态 */
function changePageEnable(pageEnable: boolean): void {
  emit('page-enable-change', pageEnable)
}

/** 初始化页码下拉菜单项（每页一项） */
function initPageMenuItems(): void {
  const total = props.reportData?.totalPageWithCol ?? 0
  if (!total) {
    return
  }
  const menuItems: PageMenuItem[] = []
  for (let i = 1; i <= total; i++) {
    const pageIndex = i
    menuItems.push({
      text: t('preview.paging.pageX', { x: i }),
      action: () => handlePageChange(pageIndex)
    })
  }
  pageMenuItems.value = menuItems
}

watch(
  () => props.reportData,
  () => {
    initPageMenuItems()
  },
  { deep: true, immediate: true }
)

watch(
  () => props.currentPage,
  (newVal) => {
    inputPage.value = String(newVal)
  },
  { immediate: true }
)
</script>

<style scoped>
/* 工具栏容器 */
.tools-content {
  border-bottom: solid 1px #ddd;
  height: 48px;
  width: 100%;
  box-sizing: border-box;
  padding: 0 10px;
  box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.2);
}

.tools-row {
  width: 100%;
  height: 100%;
}

.tools-left {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.tools-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.tools-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* 报表名称 */
.report-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* 预览/分页预览下拉按钮 */
.pagination-dropdown-btn {
  display: inline-flex;
  align-items: center;
  border: none !important;
  color: #5e6d82;
  background-color: transparent;
  padding: 0 8px;
  height: 28px;
  font-size: 13px;
}

.pagination-dropdown-btn:hover {
  background-color: rgba(var(--color-primary-rgb), 0.1) !important;
  color: var(--color-primary) !important;
}

.pagination-btn {
  padding: 0 8px;
  height: 28px;
  font-size: 13px;
}

.pagination-btn-text {
  margin: 0 4px;
}

.pagination-divider {
  display: inline-block;
  width: 1px;
  height: 16px;
  background-color: #ddd;
  margin: 0 4px;
  vertical-align: middle;
}

.pagination-input-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 0 4px;
}

.pagination-input {
  width: 40px;
  height: 24px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  text-align: center;
  font-size: 13px;
  padding: 0 4px;
}

.pagination-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.pagination-total {
  font-size: 13px;
  color: #5e6d82;
}

.p-button {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 6px !important;
  height: 28px !important;
  min-width: 28px !important;
  border: none !important;
  background-color: transparent !important;
  box-shadow: none !important;
}

.p-button:hover {
  background-color: rgba(0, 85, 74, 0.1) !important;
}
</style>
