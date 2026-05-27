<template>
  <div id="preview-container" :class="{ 'right-collapsed': !isShowSearchForm }">
    <div class="preview-left">
      <ToolBox
          :reportData="reportData"
          :reportName="currentReportName"
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
    <div v-if="isRenderSearchForm" class="collapse-btn" @click="toggleCollapse">
      <i class="iconfont collapse-icon" :class="isShowSearchForm ? 'icon-right' : 'icon-left'"></i>
    </div>
    <div v-if="isRenderSearchForm"
         class="preview-right"
         :class="{ collapsed: !isShowSearchForm }">
      <div class="preview-right-content">
        <SearchBox
          :searchFormConfig="searchFormConfig"
          @submit="handleFormSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script>
import {Chart, registerables} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {loadReportData, loadHtml} from '@/api/preview'
import {buildChartDatas} from '@/views/report/preview/utils/chart.js'

import SearchBox from '@/views/report/preview/search-box/index.vue';
import ToolBox from '@/views/report/preview/tool-box/index.vue';
import {updateUrlParams, getUrlSearchParams} from '@/utils/url';

import {isMobile, showAlert} from "@/utils/comnon";
import showLoading from "@/components/loading/instance";
import {$t, setLocale} from "@/locales";

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
      extraParams: {},
      isShowSearchForm: true
    }
  },
  computed: {
    pageEnable() {
      return this.pageIndex != null && parseInt(this.pageIndex) > 0;
    },
    isRenderSearchForm(){
      return !!(this.searchFormConfig?.fields?.length)
    }
  },
  async mounted() {
    let that = this;
    this.parseParamsFromUrl();
    window.addEventListener('popstate', this.handlePopState);
    this.initReport().then(() => {
      that.isShowSearchForm = that.isRenderSearchForm
    })
  },
  beforeDestroy() {
    window.removeEventListener('popstate', this.handlePopState);
  },
  methods: {
    toggleCollapse() {
      this.isShowSearchForm = !this.isShowSearchForm;
    },

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
        reportData.tools = this.computeTools();
        Object.freeze(reportData);
        this.reportData = reportData;
        this.currentPage = parseInt(reportData.pageIndex || pageIndex) || 1;
        this.totalPage = this.extractTotalPage(reportData);
        return reportData;
      } catch (error) {
        if (error.msg) {
          showAlert($t('preview.error.loadReportFail') + this.$t('colon') + error.msg, { useHTMLString: true });
        } else {
          showAlert($t('preview.error.loadReportFail'));
        }

        this.$emit('error', error);
        return null;
      } finally {
        loadingInstance.close();
      }
    },

    async handleFormSubmit(formData) {
      this.searchFormParameters = formData;
      try {
        await this.loadAndRenderReport({ resetToFirstPage: this.pageEnable });
      } catch (error) {
        if (error.msg) {
          showAlert(this.$t('dialog.save.serverError') + this.$t('colon') + error.msg,  { useHTMLString: true });
        } else {
          showAlert(this.$t('dialog.save.serverError') );
        }
        console.error('提交搜索表单失败:', error);
      }
    },

    async loadAndRenderReport(options = {}) {
      const { resetToFirstPage = false } = options;

      let pageIndex;
      if (resetToFirstPage) {
        this.currentPage = 1;
        this.pageIndex = 1;
        pageIndex = 1;
        updateUrlParams({ _i: 1 }, true);
      } else if (this.pageIndex != null) {
        if (this.totalPage > 0 && this.currentPage > this.totalPage) {
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
      const searchParams = getUrlSearchParams();
      this.reportPath = searchParams.get('reportPath') || '';
      this.mode = searchParams.get('mode') || '';
      this.toolsInfo = searchParams.get('_t');
      this.pageIndex = searchParams.get('_i');
      this.extraParams = {};
      const localKeys = ['_i', '_t', '_r', '_n', 'mode', 'reportPath', 'lang'];
      for (const [key, value] of searchParams) {
        if (!localKeys.includes(key)) {
          this.extraParams[key] = value;
        }
      }
      const lang = searchParams.get('lang');
      if (lang) {
        setLocale(lang);
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
        if (error.msg) {
          showAlert(this.$t('dialog.save.serverError') + this.$t('colon') + error.msg,  { useHTMLString: true });
        } else {
          showAlert(this.$t('dialog.save.fail'));
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
      setLocale(locale);
    }

  }
}
</script>

<style scoped>
#preview-container {
  width: 100%;
  height: 100vh;
  padding: 10px 10px 0 10px;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  position: relative;
  background: white;
}

.preview-left {
  flex: 1;
  overflow: auto;
  padding-right: 10px;
  min-width: 0;
}

.preview-right {
  width: 400px;
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.3s ease;
  border-left: 1px solid #e8e8e8;
}

.preview-right-content {
  padding: 0 10px;
  box-sizing: border-box;
}

.preview-right.collapsed {
  width: 0;
  border-left: none;
  overflow: hidden;
}

.preview-right.collapsed .preview-right-content {
  display: none;
}

.collapse-btn {
  width: 32px;
  height: 32px;
  position: absolute;
  top: 25%;
  right: 413px;
  transform: translate(50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  z-index: 10;
}

#preview-container.right-collapsed .collapse-btn {
  right: 0;
  transform: translate(0, -50%);
}

#report-table {
  margin-top: 10px;
}

.collapse-btn:hover {
  background: #f5f5f5;
  border-color: #1890ff;
  color: #1890ff;
  transform: translate(50%, -50%) scale(1.1);
}

#preview-container.right-collapsed .collapse-btn:hover {
  transform: translate(0, -50%) scale(1.1);
}

.collapse-icon {
  font-size: 16px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  #preview-container {
    padding: 5px;
    flex-direction: column;
  }
  .preview-left {
    width: 100%;
    padding-right: 0;
    padding-bottom: 10px;
  }
  .preview-right {
    width: 100%;
    border-left: none;
    border-top: 1px solid #e8e8e8;
  }
  .preview-right-content {
    padding-left: 0;
    padding-top: 10px;
  }
  .preview-right.collapsed {
    width: 0;
    padding-top: 0;
    border-top: none;
  }
  .collapse-btn {
    display: none;
  }
}
</style>
