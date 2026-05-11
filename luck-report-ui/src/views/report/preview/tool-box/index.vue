<template>
  <div v-if="reportData && reportData.tools && reportData.tools.show"
       class="tools-content">
    <div :style="{ textAlign: reportData.reportAlign }">
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

      <div v-if="reportData.tools.paging" class="btn-group">
        <ButtonGroup
            :buttonText="pageEnable ? $t('preview.paging.pagingPreview') : $t('preview.paging.preview')"
            :showText="true"
            :buttonStyle="{ background: '#f8f8f8', border: 'none', color: '#337ab7' }"
            :menuItems="pagingMenuItems"
            :customClass="'p-tool-button'"
        />
      </div>

      <u-button v-if="reportData.tools.paging && currentPage > 1"
                type="info"
                :title="$t('preview.buttons.prevPage')"
                class="p-button paging-button"
                @click="goToPrevPage">
        {{ $t('preview.buttons.prevPage') }}
      </u-button>

      <div v-if="pageEnable" class="btn-group">
        <ButtonGroup
            :buttonText="`共${reportData.totalPageWithCol}页，当前第${currentPage}页`"
            :showText="true"
            :buttonStyle="{ background: '#f8f8f8', border: 'none', color: '#337ab7' }"
            :menuItems="pageMenuItems"
            :customClass="'p-tool-button'"
        />
      </div>

      <u-button v-if="reportData.tools.paging && currentPage && currentPage < reportData.totalPageWithCol"
                type="info"
                :title="$t('preview.buttons.nextPage')"
                class="p-button paging-button"
                @click="goToNextPage">
        {{ $t('preview.buttons.nextPage') }}
      </u-button>
    </div>

    <PDFPrintDialog
        :visible="pdfPrintDialogVisible"
        :paper-data="paperData"
        @close="handlePdfPrintDialogClose"
    />

    <iframe name="print_frame" width="0" height="0" frameborder="0" src="about:blank"></iframe>
    <iframe name="print_pdf_frame" width="0" height="0" frameborder="0" src="about:blank"></iframe>
  </div>
</template>

<script>
import {
  getExcelExportUrl,
  getExcelPagingExportUrl,
  getExcelSheetPagingExportUrl,
  getPdfDirectPrintUrl,
  getPdfExportUrl,
  getWordExportUrl,
  loadPagePaper,
  loadPrintPages
} from '@/api/preview'

import {pointToMM} from '@/utils/table.js';
import showLoading from '@/components/loading/instance.js';
import {showAlert} from '@/utils/comnon.js';
import PDFPrintDialog from '@/views/report/preview/pdf-print-dialog/index.vue';
import ButtonGroup from "@/components/button-group/index.vue";
import UButton from "@/components/button/index.vue";
import {buildLocationSearchParameters} from '@/views/report/preview/utils/render.js';

export default {
  name: 'ToolBox',
  components: {
    UButton,
    ButtonGroup,
    PDFPrintDialog
  },
  props: {
    reportData: {
      type: Object,
      default: () => null
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
      paperData: null,
      printIndex: 0
    }
  },
  computed: {
    pagingMenuItems() {
      return [
        {
          text: this.$t('preview.paging.preview'),
          action: () => this.changePageEnable(false)
        },
        {
          text: this.$t('preview.paging.pagingPreview'),
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
      deep: true
    }
  },
  mounted() {
    this.initPageMenuItems();
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
          text: '加载中...',
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
          showAlert(this.$t('preview.error.serverError') + error.msg);
        } else {
          showAlert(this.$t('preview.error.serverErrorSimple'));
        }
      }
    },

    /**
     * PDF预览打印
     * 加载纸张配置信息后打开 PDF 打印对话框，用户可在对话框中调整纸张参数后打印
     */
    async printPdf() {
      try {
        const urlParameters = buildLocationSearchParameters(this.searchFormParameters);
        const params = new URLSearchParams(urlParameters);

        const formData = new FormData();
        for (const [key, value] of params.entries()) {
          formData.append(key, value);
        }

        const paper = await loadPagePaper(formData);

        this.paperData = paper;
        this.pdfPrintDialogVisible = true;
      } catch (error) {
        console.error('获取纸张信息失败:', error);
        showAlert(this.$t('preview.error.loadPaperFail'));
      }
    },

    /**
     * 关闭PDF打印对话框
     */
    handlePdfPrintDialogClose() {
      this.pdfPrintDialogVisible = false;
    },

    /**
     * PDF直接打印
     * 在隐藏 iframe 中加载服务端生成的 PDF，加载完成后自动调用浏览器打印
     * 设置了30秒超时保护，防止 PDF 加载失败导致 loading 一直显示
     */
    printDirectPdf() {
      const loadingInstance = showLoading({
        text: this.$t('preview.loading.default'),
      });
      const urlParameters = buildLocationSearchParameters(this.searchFormParameters);
      const params = new URLSearchParams(urlParameters);
      const paramObj = {};

      for (const [key, value] of params.entries()) {
        paramObj[key] = value;
      }

      const url = getPdfDirectPrintUrl(paramObj, this.printIndex++);
      const iframe = window.frames['print_pdf_frame'];
      const pdfFrame = document.querySelector("iframe[name='print_pdf_frame']");

      let loadTimeout = null;
      let isLoaded = false;

      const closeLoading = () => {
        if (!isLoaded) {
          isLoaded = true;
          if (loadTimeout) {
            clearTimeout(loadTimeout);
          }
          loadingInstance.close();
        }
      };

      if (pdfFrame) {
        const handleLoad = function () {
          closeLoading();
          try {
            iframe.window.focus();
            iframe.window.print();
          } catch (error) {
            console.error('打印失败:', error);
          }
        };

        const handleError = function () {
          closeLoading();
          console.error('PDF加载失败');
          showAlert(this.$t('preview.error.loadPdfFail'));
        }.bind(this);

        pdfFrame.addEventListener('load', handleLoad, { once: true });
        pdfFrame.addEventListener('error', handleError, { once: true });

        loadTimeout = setTimeout(() => {
          closeLoading();
          console.warn('PDF加载超时');
        }, 30000);
      }

      iframe.window.focus();
      iframe.location.href = url;
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
     * 在新标签页中打开导出URL
     * @param {string} url - 导出文件的完整URL
     */
    openExportUrl(url) {
      window.open(url, '_blank');
    },

    /**
     * 导出为PDF文件
     */
    exportPdf() {
      const paramObj = this.getExportParams();
      const url = getPdfExportUrl(paramObj);
      this.openExportUrl(url);
    },

    /**
     * 导出为Word文件
     */
    exportWord() {
      const paramObj = this.getExportParams();
      const url = getWordExportUrl(paramObj);
      this.openExportUrl(url);
    },

    /**
     * 导出为分页Sheet的Excel文件（每页一个Sheet）
     */
    exportExcelPagingSheet() {
      const paramObj = this.getExportParams();
      const url = getExcelSheetPagingExportUrl(paramObj);
      this.openExportUrl(url);
    },

    /**
     * 导出为分页Excel文件
     */
    exportExcelPaging() {
      const paramObj = this.getExportParams();
      const url = getExcelPagingExportUrl(paramObj);
      this.openExportUrl(url);
    },

    /**
     * 导出为Excel文件
     */
    exportExcel() {
      const paramObj = this.getExportParams();
      const url = getExcelExportUrl(paramObj);
      this.openExportUrl(url);
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
          text: `第${i}页`,
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
.p-tool-button {
  display: inline-block;
  padding: 0;
  background: #f8f8f8;
  border: none;
  margin: 3px
}

.p-button {
  border: none;
  background: rgb(248, 248, 248);
}

.p-button img {
  vertical-align: middle;
}

.tools-content {
  border: solid 1px #ddd;
  border-radius: 5px;
  height: 40px;
  width: 100%;
  background: #f8f8f8;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 10px;
}
</style>
