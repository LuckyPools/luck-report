<template>
  <div id="preview-container">

    <SearchBox
      v-if="searchFormConfig"
      :searchFormConfig="searchFormConfig"
      @submit="handleFormSubmit"
    />

    <ToolBox
        :reportData="reportData"
        :currentPage="currentPage"
        :pageEnable="pageEnable"
        :searchFormParameters="searchFormParameters"
        @page-change="handlePageChange"
        @page-enable-change="handlePageEnableChange"
    />

    <div id="report-table" v-if="reportData && reportData.content"
         v-html="reportData.content"
         :style="{ float: reportData.reportAlign || 'left' }"></div>
  </div>
</template>

<script>
import {Chart, registerables} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {loadReportData, loadHtml} from '@/api/preview'
import {buildChartDatas} from '@/views/report/preview/utils/chart.js'

import SearchBox from '@/views/report/preview/search-box/index.vue';
import ToolBox from '@/views/report/preview/tool-box/index.vue';
import {updateUrlParams} from '@/utils/url';

import {isMobile, showAlert} from "@/utils/comnon";
import showLoading from "@/components/loading/instance";
import {$t} from "@/locales";

Chart.register(...registerables, ChartDataLabels);

export default {
  name: 'PreviewPage',
  components: {
    ToolBox,
    SearchBox
  },
  data() {
    return {
      reportData: null,
      currentReportName: '',
      totalPage: 0,
      currentPage: 1,
      searchFormParameters: {},
      searchFormConfig: null,
      reportPath: '',
      mode: '',
      toolsInfo: null,
      pageIndex: null,
      extraParams: {}
    }
  },
  computed: {
    pageEnable() {
      return this.pageIndex != null && parseInt(this.pageIndex) > 0;
    }
  },
  async mounted() {
    this.parseParamsFromUrl();
    window.addEventListener('popstate', this.handlePopState);
    await this.initReport();
  },
  beforeDestroy() {
    window.removeEventListener('popstate', this.handlePopState);
  },
  methods: {
    async initReport() {
      const reportData = await this.fetchPageData(this.pageIndex);
      if (!reportData) return;

      this.setWebTitle();
      this.searchFormConfig = reportData.searchForm;
      this.injectReportStyle(reportData.style);
      this.initFunctions();

      this.$emit('ready', { reportData });
    },

    setWebTitle() {
      this.currentReportName = this.extraParams._title || this.reportPath;
      if (this.currentReportName) {
        this.currentReportName = decodeURIComponent(this.currentReportName);
      }
      if (this.currentReportName.endsWith('.ureport.xml')) {
        this.currentReportName = this.currentReportName.replace('.ureport.xml', '');
      }
      document.title = this.currentReportName;
    },

    async loadPageData(pageIndex) {
      const reportData = await this.fetchPageData(pageIndex);
      if (!reportData) return;
      this.renderReportContent(reportData);
    },

    async fetchPageData(pageIndex) {
      const loadingInstance = showLoading({
        text: $t('preview.loading.report'),
      });
      try {
        const params = this.getReportParams(pageIndex);
        const reportData = await loadHtml(params);
        if (reportData.errorMsg) {
          throw new Error(reportData.errorMsg);
        }
        reportData.tools = this.computeTools();
        Object.freeze(reportData);
        this.reportData = reportData;
        this.currentPage = parseInt(reportData.pageIndex || pageIndex) || 1;
        this.totalPage = this.extractTotalPage(reportData);
        return reportData;
      } catch (error) {
        showAlert("加载报表失败：" + error.message);
        this.$emit('error', error);
        return null;
      } finally {
        loadingInstance.close();
      }
    },

    async handleFormSubmit(formData) {
      this.searchFormParameters = formData;
      try {
        await this.loadAndRenderReport({ resetToFirstPage: true });
      } catch (error) {
        console.error('提交搜索表单失败:', error);
      }
    },

    async loadAndRenderReport(options = {}) {
      const { resetToFirstPage = false } = options;

      let pageIndex;
      if (resetToFirstPage) {
        this.currentPage = 1;
        pageIndex = 1;
      } else if (this.totalPage > 0 && this.currentPage) {
        if (this.currentPage > this.totalPage) {
          this.currentPage = 1;
        }
        pageIndex = this.currentPage;
      }

      const params = this.getReportParams(pageIndex);
      const report = await loadReportData(params);
      this.renderReportContent(report);

      this.totalPage = this.extractTotalPage(report);
      this.currentPage = report.pageIndex || this.currentPage;

      const totalPageLabel = document.getElementById('totalPageLabel');
      if (totalPageLabel) {
        totalPageLabel.textContent = this.totalPage;
      }
      return report;
    },

    parseParamsFromUrl() {
      const searchParams = new URLSearchParams(window.location.search);
      this.reportPath = searchParams.get('reportPath') || '';
      this.mode = searchParams.get('mode') || '';
      this.toolsInfo = searchParams.get('_t');
      this.pageIndex = searchParams.get('_i');
      this.extraParams = {};
      const localKeys = ['_i', '_t', '_r', '_n', 'mode', 'reportPath'];
      for (const [key, value] of searchParams) {
        if (!localKeys.includes(key)) {
          this.extraParams[key] = value;
        }
      }
    },

    handlePopState() {
      const oldPageIndex = this.pageIndex;
      this.parseParamsFromUrl();
      if (oldPageIndex !== this.pageIndex) {
        this.loadPageData(this.pageIndex || 1);
      }
    },

    getReportParams(pageIndex) {
      if (!this.reportPath) {
        throw new Error(this.$t('preview.error.fileParamMissing'));
      }

      const params = { reportPath: this.reportPath };

      if (this.mode) params.mode = this.mode;
      if (pageIndex != null) params._i = pageIndex;
      if (this.toolsInfo != null) params._t = this.toolsInfo;

      Object.assign(params, this.extraParams);
      this.mergeSearchFormParams(params);

      return params;
    },

    mergeSearchFormParams(target) {
      if (!this.searchFormParameters) return;
      Object.keys(this.searchFormParameters).forEach(key => {
        if (this.searchFormParameters[key]) {
          target[key] = this.searchFormParameters[key];
        }
      });
    },

    renderReportContent(reportData) {
      const tableContainer = document.getElementById('report-table');
      if (tableContainer) {
        tableContainer.innerHTML = reportData.content;
      }
      buildChartDatas(reportData.chartDatas);
    },

    extractTotalPage(reportData) {
      return reportData.totalPageWithCol || reportData.totalPage || 0;
    },

    computeTools() {
      const isMobileDevice = isMobile();
      const allOff = { show: false, print: false, pdfPrint: false, pdfPreviewPrint: false, pdf: false, word: false, excel: false, pagingExcel: false, sheetPagingExcel: false, paging: false };
      const allOn = { show: true, print: true, pdfPrint: true, pdfPreviewPrint: true, pdf: true, word: true, excel: true, pagingExcel: true, sheetPagingExcel: true, paging: true };

      if (isMobileDevice) return allOff;

      if (this.toolsInfo == null || this.toolsInfo === '') return allOn;
      if (String(this.toolsInfo) === '0') return allOff;

      const tools = { ...allOff, show: true };
      const map = {
        '1': 'print',
        '2': 'pdfPrint',
        '3': 'pdfPreviewPrint',
        '4': 'pdf',
        '5': 'word',
        '6': 'excel',
        '7': 'pagingExcel',
        '8': 'sheetPagingExcel',
        '9': 'paging'
      };
      String(this.toolsInfo).split(',').forEach(key => { if (map[key]) tools[map[key]] = true; });
      return tools;
    },

    injectReportStyle(style) {
      let styleElement = document.getElementById('report-table-style');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'report-table-style';
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = style || '';
    },

    async refreshReport(second) {
      try {
        await this.loadAndRenderReport({ resetToFirstPage: false });
      } catch (error) {
        console.error('刷新数据失败:', error);
        const tableContainer = document.getElementById('report-table');
        if (tableContainer) {
          tableContainer.innerHTML = '';
          tableContainer.innerHTML = error.msg
            ? `<h3 style='color: #d30e00;'>${this.$t('preview.error.serverError')}${error.msg}</h3>`
            : `<h3 style='color: #d30e00;'>${this.$t('preview.error.loadDataFail')}</h3>`;
        }
      } finally {
        setTimeout(() => this.refreshReport(second), second);
      }
    },

    intervalRefresh(value, totalPage) {
      if (!value) return;
      this.totalPage = totalPage;
      const second = value * 1000;
      setTimeout(() => this.refreshReport(second), second);
    },

    handlePageChange(pageIndex) {
      updateUrlParams({ _i: pageIndex }, true);
      this.pageIndex = pageIndex;

      if (pageIndex != null) {
        this.loadPageData(pageIndex);
      } else {
        this.initReport();
      }
    },

    initFunctions() {
      setTimeout(() => {
        if (this.reportData.intervalRefreshValue > 0) {
          this.intervalRefresh(this.reportData.intervalRefreshValue, this.totalPage);
        }
        if (this.reportData.chartDatas && this.reportData.chartDatas.length > 0) {
          buildChartDatas(this.reportData.chartDatas);
        }
      }, 500);
    },

    handlePageEnableChange(pageEnable) {
      if (pageEnable) {
        this.handlePageChange(1);
      } else {
        updateUrlParams({ _i: null });
        this.pageIndex = null;
        this.initReport();
      }
    },

    refresh() {
      this.parseParamsFromUrl();
      this.initReport();
    },

    setReportPath(path) {
      updateUrlParams({ reportPath: path });
      this.reportPath = path;
      if (path) this.initReport();
    },

    setParams(params) {
      updateUrlParams(params);
      this.parseParamsFromUrl();
      this.initReport();
    },

    setLocale(locale) {
      this.$i18n.locale = locale;
    }

  }
}
</script>

<style scoped>
#preview-container {
  width: 100%;
  height: 100vh;
  padding: 10px;
  box-sizing: border-box;
  overflow: auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  #preview-container {
    padding: 5px;
  }
}
</style>
