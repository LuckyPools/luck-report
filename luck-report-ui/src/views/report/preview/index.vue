<template>
  <div id="preview-container" :class="{ 'right-collapsed': !isShowSearchForm }">
    <div class="preview-left">
      <div class="preview-left-fixed">
        <ToolBox
            :reportData="reportData"
            :reportName="currentReportName"
            :currentPage="currentPage"
            :pageEnable="pageEnable"
            :searchFormParameters="searchFormParameters"
            @page-change="handlePageChange"
            @page-enable-change="handlePageEnableChange"
        />
      </div>
      <div class="preview-left-scroll">
        <div id="report-table" v-if="reportData && reportData.content"
             v-html="reportData.content"
             :style="{ float: reportData.reportAlign || 'left' }"></div>
      </div>
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
          :report-path="reportPath"
          :mode="mode"
          @submit="handleFormSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script>
import '@/assets/css/preview/index.css';
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
      isShowSearchForm: true,
      currentFreezeRowCount: 0
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
    // 冻结行吸附顶部时动态切换工具栏阴影
    const scrollContainer = document.querySelector('.preview-left-scroll');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', this.toggleToolsShadow);
    }
    this.initReport().then(() => {
      that.isShowSearchForm = that.isRenderSearchForm
    })
  },
  beforeDestroy() {
    window.removeEventListener('popstate', this.handlePopState);
    const scrollContainer = document.querySelector('.preview-left-scroll');
    if (scrollContainer) {
      scrollContainer.removeEventListener('scroll', this.toggleToolsShadow);
    }
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
      this.$nextTick(() => {
        this.applyFreeze(reportData.freezeRowCount || 0, reportData.freezeColCount || 0);
      });

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
      this.$nextTick(() => {
        this.applyFreeze(reportData.freezeRowCount || 0, reportData.freezeColCount || 0);
      });
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
        if (this.searchFormParameters[key] != null) {
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
      this.applyFreeze(reportData.freezeRowCount || 0, reportData.freezeColCount || 0);
    },

    extractTotalPage(reportData) {
      return reportData.totalPageWithCol || reportData.totalPage || 0;
    },

    /**
     * 应用冻结效果：对前 freezeRowCount 行 / freezeColCount 列的 td 设置 position:sticky
     * 偏移通过 getBoundingClientRect 相对滚动容器计算；读写分离两阶段批量处理，避免反复 reflow
     */
    applyFreeze(freezeRowCount, freezeColCount) {
      this.currentFreezeRowCount = freezeRowCount;
      if (freezeRowCount <= 0 && freezeColCount <= 0) {
        const tools = document.querySelector('.tools-content');
        if (tools) tools.style.boxShadow = '';
        return;
      }
      this.toggleToolsShadow();

      const table = document.querySelector('#report-table table');
      if (!table) return;

      // 清除上一次的冻结样式（分页刷新场景）
      table.querySelectorAll('td').forEach(td => {
        if (td.style.position === 'sticky') {
          td.style.position = '';
          td.style.left = '';
          td.style.top = '';
          td.style.zIndex = '';
          td.style.backgroundColor = '';
          td.style.border = '';
          td.style.boxShadow = '';
        }
      });

      const container = document.querySelector('.preview-left-scroll');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      // sticky 偏移需扣除 #report-table 的 padding，否则滚动内容会从 padding 缝隙透出
      const reportTableEl = document.getElementById('report-table');
      const rtPaddingTop = reportTableEl ? parseFloat(window.getComputedStyle(reportTableEl).paddingTop) || 0 : 0;
      const rtPaddingLeft = reportTableEl ? parseFloat(window.getComputedStyle(reportTableEl).paddingLeft) || 0 : 0;
      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;
      // 网格占位表，处理 rowspan/colspan 确定逻辑列号
      const grid = [];
      const rows = table.querySelectorAll('tr');

      const freezeCells = [];

      rows.forEach((row, rowIdx) => {
        const cells = row.querySelectorAll('td');
        let colIdx = 0;

        while (grid[rowIdx] && grid[rowIdx][colIdx]) {
          colIdx++;
        }

        cells.forEach((cell) => {
          const colspan = cell.colSpan || 1;
          const rowspan = cell.rowSpan || 1;

          const isFreezeRow = rowIdx < freezeRowCount;
          const isFreezeCol = colIdx < freezeColCount;

          if (isFreezeRow || isFreezeCol) {
            freezeCells.push({
              td: cell,
              isFreezeRow,
              isFreezeCol,
              cellRect: cell.getBoundingClientRect(),
              cs: window.getComputedStyle(cell)
            });
          }

          for (let r = 0; r < rowspan; r++) {
            for (let c = 0; c < colspan; c++) {
              if (!grid[rowIdx + r]) grid[rowIdx + r] = [];
              grid[rowIdx + r][colIdx + c] = true;
            }
          }

          colIdx += colspan;
          while (grid[rowIdx] && grid[rowIdx][colIdx]) {
            colIdx++;
          }
        });
      });

      freezeCells.forEach(({ td, isFreezeRow, isFreezeCol, cellRect, cs }) => {
        td.style.position = 'sticky';
        // 透明背景用白色兜底，防止滚动内容透出
        const bg = cs.backgroundColor;
        td.style.backgroundColor = (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') ? bg : '#fff';

        // border-collapse:collapse + sticky 滚动时边框丢失，用 box-shadow 内阴影模拟
        const shadows = [];
        if (parseFloat(cs.borderLeftWidth) > 0) {
          shadows.push(`inset ${cs.borderLeftWidth} 0 0 0 ${cs.borderLeftColor}`);
        }
        if (parseFloat(cs.borderRightWidth) > 0) {
          shadows.push(`inset -${cs.borderRightWidth} 0 0 0 ${cs.borderRightColor}`);
        }
        if (parseFloat(cs.borderTopWidth) > 0) {
          shadows.push(`inset 0 ${cs.borderTopWidth} 0 0 ${cs.borderTopColor}`);
        }
        if (parseFloat(cs.borderBottomWidth) > 0) {
          shadows.push(`inset 0 -${cs.borderBottomWidth} 0 0 ${cs.borderBottomColor}`);
        }
        if (shadows.length > 0) {
          td.style.border = 'none';
          td.style.boxShadow = shadows.join(', ');
        }

        if (isFreezeCol) {
          const left = cellRect.left - containerRect.left + scrollLeft - rtPaddingLeft;
          td.style.left = left + 'px';
        }
        if (isFreezeRow) {
          const top = cellRect.top - containerRect.top + scrollTop - rtPaddingTop;
          td.style.top = top + 'px';
        }
        td.style.zIndex = (isFreezeRow && isFreezeCol) ? '3' : '2';
      });
    },

    /**
     * 滚动时切换工具栏阴影：冻结行吸附顶部时白色背景会遮住阴影，视觉不一致，此时隐藏
     */
    toggleToolsShadow() {
      const tools = document.querySelector('.tools-content');
      if (!tools) return;
      const container = document.querySelector('.preview-left-scroll');
      if (!container) return;
      if (this.currentFreezeRowCount > 0 && container.scrollTop > 0) {
        tools.style.boxShadow = 'none';
      } else {
        tools.style.boxShadow = '';
      }
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
