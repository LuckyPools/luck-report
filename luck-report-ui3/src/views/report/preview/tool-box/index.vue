<template>
  <div v-if="reportData && reportData.tools && reportData.tools.show"
       class="tools-content">
    <u-row type="flex" align="middle" class="tools-row">
      <u-col :span="11" class="tools-left">
        <div class="pagination-group">
          <ButtonGroup
              v-if="reportData.tools.paging"
              :buttonText="pageEnable ? $t('preview.paging.pagingPreview') : $t('preview.paging.preview')"
              :showText="true"
              :buttonStyle="{ border: 'none', color: '#5e6d82' }"
              :menuItems="pagingMenuItems"
              customClass="pagination-dropdown-btn"
          />
          <span v-if="reportData.tools.paging && pageEnable" class="pagination-divider"></span>
          <template v-if="reportData.tools.paging && pageEnable">
            <u-button
                type="text"
                size="mini"
                class="pagination-btn"
                :disabled="currentPage <= 1"
                :title="$t('preview.buttons.firstPage')"
                @click="goToFirstPage">
              <i class="iconfont icon-page-first"></i>
              <span class="pagination-btn-text">{{ $t('preview.buttons.firstPage') }}</span>
            </u-button>
            <span class="pagination-divider"></span>
            <u-button
                type="text"
                size="mini"
                class="pagination-btn"
                :disabled="currentPage <= 1"
                :title="$t('preview.buttons.prevPage')"
                @click="goToPrevPage">
              <i class="iconfont icon-left"></i>
              <span class="pagination-btn-text">{{ $t('preview.buttons.prevPage') }}</span>
            </u-button>
            <span class="pagination-divider"></span>
            <div class="pagination-input-group">
              <input
                  v-model.number="inputPage"
                  type="text"
                  class="pagination-input"
                  @keyup.enter="handleInputPageChange"
                  @blur="handleInputPageChange"
              />
              <span class="pagination-total">/ {{ reportData.totalPageWithCol }}</span>
            </div>
            <span class="pagination-divider"></span>
            <u-button
                type="text"
                size="mini"
                class="pagination-btn"
                :disabled="currentPage >= reportData.totalPageWithCol"
                :title="$t('preview.buttons.nextPage')"
                @click="goToNextPage">
              <span class="pagination-btn-text">{{ $t('preview.buttons.nextPage') }}</span>
              <i class="iconfont icon-right"></i>
            </u-button>
            <span class="pagination-divider"></span>
            <u-button
                type="text"
                size="mini"
                class="pagination-btn"
                :disabled="currentPage >= reportData.totalPageWithCol"
                :title="$t('preview.buttons.lastPage')"
                @click="goToLastPage">
              <span class="pagination-btn-text">{{ $t('preview.buttons.lastPage') }}</span>
              <i class="iconfont icon-page-last"></i>
            </u-button>
          </template>
        </div>
      </u-col>

      <u-col :span="2" class="tools-center">
        <span class="report-name">{{ displayReportName }}</span>
      </u-col>

      <u-col :span="11" class="tools-right">
        <u-button v-if="reportData.tools.print"
                  type="info"
                  :title="$t('preview.buttons.print')"
                  class="p-button"
                  @click="print"
        >
          <img src="@/assets/icons/print.svg" width="20px" height="20px">
        </u-button>

        <u-button v-if="reportData.tools.pdfPrint"
                  type="info"
                  :title="$t('preview.buttons.pdfDirectPrint')"
                  class="p-button"
                  @click="printDirectPdf">
          <img src="@/assets/icons/pdf-direct-print.svg" width="20px" height="20px">
        </u-button>

        <u-button v-if="reportData.tools.pdfPreviewPrint"
                  type="info"
                  :title="$t('preview.buttons.pdfPreviewPrint')"
                  class="p-button"
                  @click="printPdf">
          <img src="@/assets/icons/pdf-print.svg" width="20px" height="20px">
        </u-button>

        <u-button v-if="reportData.tools.pdf"
                  type="info"
                  :title="$t('preview.buttons.exportPdf')"
                  class="p-button"
                  @click="exportPdf">
          <img src="@/assets/icons/pdf.svg" width="20px" height="20px">
        </u-button>

        <u-button v-if="reportData.tools.word"
                  type="info"
                  :title="$t('preview.buttons.exportWord')"
                  class="p-button"
                  @click="exportWord">
          <img src="@/assets/icons/word.svg" width="20px" height="20px">
        </u-button>

        <u-button v-if="reportData.tools.excel"
                  type="info"
                  :title="$t('preview.buttons.exportExcel')"
                  class="p-button"
                  @click="exportExcel">
          <img src="@/assets/icons/excel.svg" width="20px" height="20px">
        </u-button>

        <u-button v-if="reportData.tools.pagingExcel"
                  type="info"
                  :title="$t('preview.buttons.exportExcelPaging')"
                  class="p-button"
                  @click="exportExcelPaging">
          <img src="@/assets/icons/excel-paging.svg" width="20px" height="20px">
        </u-button>

        <u-button v-if="reportData.tools.sheetPagingExcel"
                  type="info"
                  class="p-button"
                  :title="$t('preview.buttons.exportExcelSheetPaging')"
                  @click="exportExcelPagingSheet"
        >
          <img src="@/assets/icons/excel-with-paging-sheet.svg" width="20px" height="20px">
        </u-button>
      </u-col>
    </u-row>

    <PDFPrintDialog
        :visible="pdfPrintDialogVisible"
        :parameters="pdfPrintParameters"
        @close="handlePdfPrintDialogClose"
    />

    <iframe name="print_frame" width="0" height="0" frameborder="0" src="about:blank"></iframe>
    <iframe name="print_pdf_frame" width="0" height="0" frameborder="0" src="about:blank"></iframe>
  </div>
</template>

<script>
import {
  loadPrintPages,
  exportPdfBlob,
  exportWordBlob,
  exportExcelBlob,
  exportExcelPagingBlob,
  exportExcelSheetPagingBlob,
  getPdfPrintBlob, loadPagePaper
} from '@/api/preview'

import {pointToMM} from '@/utils/table.js';
import showLoading from '@/components/loading/instance.js';
import {showAlert} from '@/utils/comnon.js';
import PDFPrintDialog from '@/views/report/preview/pdf-print-dialog/index.vue';
import ButtonGroup from "@/components/button-group/index.vue";
import UButton from "@/components/button/index.vue";
import URow from "@/components/row/index.vue";
import UCol from "@/components/col/index.vue";
import {buildLocationSearchParameters} from '@/views/report/preview/utils/render.js';

export default {
  name: 'ToolBox',
  components: {
    UButton,
    ButtonGroup,
    URow,
    UCol,
    PDFPrintDialog
  },
  props: {
    reportData: {
      type: Object,
      default: () => null
    },
    reportName: {
      type: String,
      default: ''
    },
    currentPage: {
      type: Number,
      default: 1
    },
    pageEnable: {
      type: Boolean,
      default: false
    },
    searchFormParameters: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      pageMenuItems: [],
      pdfPrintDialogVisible: false,
      printIndex: 0,
      inputPage: 1
    }
  },
  computed: {
    /**
     * 显示的报表名称
     * 去掉文件名前缀（如 "file:"、"db:" 等）和后缀（.ureport.xml）
     */
    displayReportName() {
      if (!this.reportName) {
        return '';
      }
      let name = this.reportName;
      const colonIndex = name.indexOf(':');
      if (colonIndex > -1) {
        name = name.substring(colonIndex + 1);
      }
      if (name.endsWith('.ureport.xml')) {
        name = name.replace('.ureport.xml', '');
      }
      return name;
    },
    pdfPrintParameters() {
      const urlParameters = buildLocationSearchParameters(this.searchFormParameters);
      const params = new URLSearchParams(urlParameters);
      const paramObj = {};
      for (const [key, value] of params.entries()) {
        paramObj[key] = value;
      }
      return paramObj;
    },
    pagingMenuItems() {
      return [
        {
          text: this.$t('preview.paging.preview'),
          icon: 'iconfont icon-preview',
          action: () => this.changePageEnable(false)
        },
        {
          text: this.$t('preview.paging.pagingPreview'),
          icon: 'iconfont icon-view-page',
          action: () => this.changePageEnable(true)
        }
      ];
    }
  },
  watch: {
    reportData: {
      handler() {
        this.initPageMenuItems();
      },
      deep: true,
      immediate: true
    },
    currentPage: {
      handler(newVal) {
        this.inputPage = String(newVal);
      },
      immediate: true
    }
  },
  methods: {
    /**
     * 构建打印样式字符串
     * 根据纸张配置生成 @page 和 @media print 的 CSS 样式，
     * 包括纸张大小、方向和四边边距
     * @param {Object} paper - 纸张配置对象，包含 paperType、width、height、orientation 及四边边距
     * @returns {string} CSS 样式字符串
     */
    buildPrintStyle(paper) {
      const marginLeft = pointToMM(paper.leftMargin);
      const marginTop = pointToMM(paper.topMargin);
      const marginRight = pointToMM(paper.rightMargin);
      const marginBottom = pointToMM(paper.bottomMargin);
      const paperType = paper.paperType;
      let page = paperType;
      if (paperType === 'CUSTOM') {
        page = pointToMM(paper.width) + 'mm ' + pointToMM(paper.height) + 'mm';
      }
      const style = `
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
    `;
      return style;
    },

    /**
     * 浏览器直接打印
     * 加载打印页面内容和纸张配置，将内容注入隐藏 iframe 中调用浏览器打印功能
     */
    async print() {
      let loadingInstance = null;
      try {
        const urlParameters = buildLocationSearchParameters(this.searchFormParameters);
        const params = new URLSearchParams(urlParameters);
        const formData = new FormData();
        for (const [key, value] of params.entries()) {
          formData.append(key, value);
        }

        loadingInstance = showLoading({
          text: this.$t('preview.loading.default'),
        });

        const result = await loadPrintPages(formData);
        const paper = await loadPagePaper(formData);

        loadingInstance.close();

        const html = result.html;
        const iFrame = window.frames['print_frame'];
        let styles = `<style type="text/css">`;
        styles += this.buildPrintStyle(paper);
        const styleElement = document.getElementById('report-table-style');
        styles += styleElement ? styleElement.textContent : '';
        styles += `</style>`;

        iFrame.document.body.innerHTML = styles + html;
        iFrame.window.focus();
        iFrame.window.print();
      } catch (error) {
        if (loadingInstance) {
          loadingInstance.close();
        }
        console.error('打印失败:', error);
        if (error.msg) {
          showAlert(this.$t('preview.error.serverError') + this.$t('colon') + error.msg, { useHTMLString: true });
        } else {
          showAlert(this.$t('preview.error.serverErrorSimple'));
        }
      }
    },

    /**
     * PDF预览打印
     * 打开 PDF 打印对话框，对话框内部会加载纸张配置信息
     */
    printPdf() {
      this.pdfPrintDialogVisible = true;
    },

    /**
     * 关闭PDF打印对话框
     */
    handlePdfPrintDialogClose() {
      this.pdfPrintDialogVisible = false;
    },

    /**
     * PDF直接打印
     * 通过 axios 获取 PDF blob，加载到 iframe 后调用浏览器打印
     */
    async printDirectPdf() {
      const loadingInstance = showLoading({
        text: this.$t('preview.loading.default'),
      });

      try {
        const urlParameters = buildLocationSearchParameters(this.searchFormParameters);
        const params = new URLSearchParams(urlParameters);
        const paramObj = {};

        for (const [key, value] of params.entries()) {
          paramObj[key] = value;
        }
        paramObj['_i'] = this.printIndex++;

        const { blobUrl, revoke } = await getPdfPrintBlob(paramObj);

        const iframe = window.frames['print_pdf_frame'];
        const pdfFrame = document.querySelector("iframe[name='print_pdf_frame']");

        if (pdfFrame) {
          const handleLoad = () => {
            loadingInstance.close();
            try {
              iframe.window.focus();
              iframe.window.print();
            } catch (error) {
              console.error('打印失败:', error);
            } finally {
              setTimeout(revoke, 1000);
            }
          };

          const handleError = () => {
            loadingInstance.close();
            revoke();
            console.error('PDF加载失败');
            showAlert(this.$t('preview.error.loadPdfFail'));
          };

          pdfFrame.addEventListener('load', handleLoad, { once: true });
          pdfFrame.addEventListener('error', handleError, { once: true });
        }

        iframe.location.href = blobUrl;
      } catch (error) {
        loadingInstance.close();
        console.error('PDF直接打印失败:', error);
        showAlert(this.$t('preview.error.loadPdfFail'));
      }
    },

    /**
     * 获取导出接口的公共请求参数
     * 将搜索表单参数转换为 URL 查询参数对象
     * @returns {Object} 导出请求参数对象
     */
    getExportParams() {
      const urlParameters = buildLocationSearchParameters(this.searchFormParameters);
      const params = new URLSearchParams(urlParameters);
      const paramObj = {};
      for (const [key, value] of params.entries()) {
        paramObj[key] = value;
      }
      return paramObj;
    },

    /**
     * 导出为PDF文件
     */
    async exportPdf() {
      const paramObj = this.getExportParams();
      try {
        await exportPdfBlob(paramObj);
      } catch (error) {
        console.error('导出PDF失败:', error);
        showAlert(this.$t('preview.error.exportFail'));
      }
    },

    /**
     * 导出为Word文件
     */
    async exportWord() {
      const paramObj = this.getExportParams();
      try {
        await exportWordBlob(paramObj);
      } catch (error) {
        console.error('导出Word失败:', error);
        showAlert(this.$t('preview.error.exportFail'));
      }
    },

    /**
     * 导出为分页Sheet的Excel文件（每页一个Sheet）
     */
    async exportExcelPagingSheet() {
      const paramObj = this.getExportParams();
      try {
        await exportExcelSheetPagingBlob(paramObj);
      } catch (error) {
        console.error('导出Excel失败:', error);
        showAlert(this.$t('preview.error.exportFail') || '导出失败');
      }
    },

    /**
     * 导出为分页Excel文件
     */
    async exportExcelPaging() {
      const paramObj = this.getExportParams();
      try {
        await exportExcelPagingBlob(paramObj);
      } catch (error) {
        console.error('导出Excel失败:', error);
        showAlert(this.$t('preview.error.exportFail') || '导出失败');
      }
    },

    /**
     * 导出为Excel文件
     */
    async exportExcel() {
      const paramObj = this.getExportParams();
      try {
        await exportExcelBlob(paramObj);
      } catch (error) {
        console.error('导出Excel失败:', error);
        showAlert(this.$t('preview.error.exportFail') || '导出失败');
      }
    },

    /**
     * 跳转到首页
     * 当前页大于1时触发页码变更事件
     */
    goToFirstPage() {
      if (this.currentPage > 1) {
        this.$emit('page-change', 1);
      }
    },

    /**
     * 跳转到末页
     * 当前页小于总页数时触发页码变更事件
     */
    goToLastPage() {
      if (this.currentPage < this.reportData.totalPageWithCol) {
        this.$emit('page-change', this.reportData.totalPageWithCol);
      }
    },

    /**
     * 跳转到上一页
     * 当前页大于1时触发页码变更事件
     */
    goToPrevPage() {
      if (this.currentPage > 1) {
        this.$emit('page-change', this.currentPage - 1);
      }
    },

    /**
     * 跳转到下一页
     * 当前页小于总页数时触发页码变更事件
     */
    goToNextPage() {
      if (this.currentPage < this.reportData.totalPageWithCol) {
        this.$emit('page-change', this.currentPage + 1);
      }
    },

    /**
     * 处理输入框页码跳转
     * 验证输入页码的合法性后触发页码变更事件
     * 非数字输入会还原为1
     */
    handleInputPageChange() {
      const page = Number(this.inputPage);
      const totalPages = this.reportData.totalPageWithCol;

      if (isNaN(page) || page < 1) {
        this.inputPage = '1';
        this.$emit('page-change', 1);
        return;
      }

      if (page > totalPages) {
        this.inputPage = String(totalPages);
        this.$emit('page-change', totalPages);
        return;
      }

      if (page !== this.currentPage) {
        this.$emit('page-change', page);
      } else {
        this.inputPage = String(this.currentPage);
      }
    },

    /**
     * 跳转到指定页码
     * @param {number} pageIndex - 目标页码
     */
    handlePageChange(pageIndex) {
      this.$emit('page-change', pageIndex);
    },

    /**
     * 切换分页启用状态
     * @param {boolean} pageEnable - true 启用分页，false 禁用分页
     */
    changePageEnable(pageEnable) {
      this.$emit('page-enable-change', pageEnable);
    },

    /**
     * 初始化页码下拉菜单项
     * 根据报表总页数生成每页对应的菜单项，点击后跳转到对应页码
     */
    initPageMenuItems() {
      if (!this.reportData || !this.reportData.totalPageWithCol) {
        return;
      }

      const menuItems = [];

      for (let i = 1; i <= this.reportData.totalPageWithCol; i++) {
        const pageIndex = i;
        menuItems.push({
          text: this.$t('preview.paging.pageX', { x: i }),
          action: () => {
            this.handlePageChange(pageIndex);
          }
        });
      }

      this.pageMenuItems = menuItems;
    }
  }
}
</script>

<style scoped>
/* 工具栏容器 */
.tools-content {
  border-bottom: solid 1px #ddd;
  height: 48px;
  width: 100%;
  box-sizing: border-box;
  padding: 0 10px;
  box-shadow: 0 2px 6px 0 rgba(0,0,0,.2);
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
}

.pagination-dropdown-btn ::v-deep .u-button {
  background-color: transparent;
  border: none;
  color: #5e6d82;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  white-space: nowrap;
  padding: 0 8px;
  height: 28px;
  font-size: 13px;
  line-height: normal !important;
}

.pagination-dropdown-btn ::v-deep .u-button:hover {
  background-color: rgba(0, 85, 74, 0.1);
  color: #00554a;
}

.pagination-dropdown-btn ::v-deep .button-text {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  line-height: 1;
}

.pagination-dropdown-btn ::v-deep .caret {
  display: inline-block !important;
  margin-left: 6px;
  vertical-align: middle;
  border-top: 4px solid #5e6d82;
  border-right: 4px solid transparent;
  border-left: 4px solid transparent;
  line-height: 28px;
}

.pagination-dropdown-btn ::v-deep .u-button:hover .caret {
  border-top-color: #00554a;
}

/* 工具栏按钮 */
.p-button {
  border: none;
}

.p-button img {
  vertical-align: middle;
}

::v-deep .p-button.u-button {
  background-color: transparent;
  border: none;
  color: #5e6d82;
}

::v-deep .p-button.u-button:hover {
  background-color: rgba(0, 85, 74, 0.1);
  border-color: transparent;
  color: #00554a;
}

/* 分页按钮组 */
.pagination-group {
  display: inline-flex;
  align-items: center;
}

/* 分页按钮 */
.pagination-group ::v-deep .pagination-btn.u-button {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center;
  gap: 2px;
  height: 28px;
  padding: 0 8px;
  font-size: 13px;
  line-height: normal !important;
  border-radius: 1px;
  background-color: transparent;
  border: none;
  color: #5e6d82;
}

.pagination-group ::v-deep .pagination-btn.u-button .iconfont {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  line-height: 1;
  height: 1em;
}

.pagination-group ::v-deep .pagination-btn.u-button .iconfont::before {
  display: block;
  line-height: 1;
}

.pagination-group ::v-deep .pagination-btn.u-button:hover:not(.u-button-text-disabled) {
  background-color: rgba(0, 85, 74, 0.1);
  border-radius: 3px;
  color: #00554a;
}

.pagination-group ::v-deep .pagination-btn.u-button:active:not(.u-button-text-disabled) {
  background-color: rgba(0, 85, 74, 0.2);
  border-radius: 3px;
  color: #00554a;
}

.pagination-group ::v-deep .pagination-btn.u-button.u-button-text-disabled {
  cursor: not-allowed;
  background-color: transparent;
  color: #c0c4cc;
}

.pagination-group ::v-deep .pagination-btn.u-button.u-button-text-disabled:hover {
  background-color: transparent;
  color: #c0c4cc;
}

.pagination-btn-text {
  display: inline-flex;
  align-items: center;
  margin: 0 2px;
  line-height: 1;
}

/* 分页分隔线 */
.pagination-divider {
  display: inline-block;
  width: 0.5px;
  height: 20px;
  background-color: #ddd;
  margin: 0 4px;
}

/* 页码输入框容器 */
.pagination-input-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  height: 28px;
}

/* 页码输入框 */
.pagination-input {
  width: 36px;
  height: 22px;
  padding: 2px 4px;
  font-size: 13px;
  text-align: center;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  outline: none;
  transition: border-color 0.2s ease;
  line-height: normal;
}

.pagination-input:focus {
  border-color: #00554a;
  box-shadow: 0 0 4px rgba(0, 85, 74, 0.3);
}

/* 总页数文本 */
.pagination-total {
  font-size: 13px;
  color: #5e6d82;
  line-height: 16px;
  white-space: nowrap;
}
</style>
