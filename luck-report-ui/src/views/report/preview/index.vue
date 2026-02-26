<template>
  <div id="preview-container">

    <div class="search-query">
      <div ref="searchForm"></div>
    </div>

    <!-- 工具栏区域 -->
    <div v-if="reportData && reportData.tools && reportData.tools.show"
         class="tools-content">
      <div :style="{ textAlign: reportData.reportAlign }">
        <!-- 打印按钮 -->
        <u-button v-if="reportData.tools.print"
                  type="info"
                  :title="$t('preview.buttons.print')"
                  class="p-button"
                  @click="print"
        >
          <img src="@/assets/icons/print.svg" width="20px" height="20px">
        </u-button>

        <!-- PDF直接打印按钮 -->
        <u-button v-if="reportData.tools.pdfPrint"
                  type="info"
                  :title="$t('preview.buttons.pdfDirectPrint')"
                  class="p-button"
                  @click="printDirectPdf">
          <img src="@/assets/icons/pdf-direct-print.svg" width="20px" height="20px">
        </u-button>

        <!-- PDF预览打印按钮 -->
        <u-button v-if="reportData.tools.pdfPreviewPrint"
                  type="info"
                  :title="$t('preview.buttons.pdfPreviewPrint')"
                  class="p-button"
                  @click="printPdf">
          <img src="@/assets/icons/pdf-print.svg" width="20px" height="20px">
        </u-button>

        <!-- 导出PDF按钮 -->
        <u-button v-if="reportData.tools.pdf"
                  type="info"
                  :title="$t('preview.buttons.exportPdf')"
                  class="p-button"
                  @click="exportPdf">
          <img src="@/assets/icons/pdf.svg" width="20px" height="20px">
        </u-button>

        <!-- 导出Word按钮 -->
        <u-button v-if="reportData.tools.word"
                  type="info"
                  :title="$t('preview.buttons.exportWord')"
                  class="p-button"
                  @click="exportWord">
          <img src="@/assets/icons/word.svg" width="20px" height="20px">
        </u-button>

        <!-- 导出Excel按钮 -->
        <u-button v-if="reportData.tools.excel"
                  type="info"
                  :title="$t('preview.buttons.exportExcel')"
                  class="p-button"
                  @click="exportExcel">
          <img src="@/assets/icons/excel.svg" width="20px" height="20px">
        </u-button>

        <!-- 分页导出Excel按钮 -->
        <u-button v-if="reportData.tools.pagingExcel"
                  type="info"
                  :title="$t('preview.buttons.exportExcelPaging')"
                  class="p-button"
                  @click="exportExcelPaging">
          <img src="@/assets/icons/excel-paging.svg" width="20px" height="20px">
        </u-button>

        <!-- 分页分Sheet导出Excel按钮 -->
        <u-button v-if="reportData.tools.sheetPagingExcel"
                  type="info"
                  class="p-button"
                  :title="$t('preview.buttons.exportExcelSheetPaging')"
                  @click="exportExcelPagingSheet"
        >
          <img src="@/assets/icons/excel-with-paging-sheet.svg" width="20px" height="20px">
        </u-button>

        <!-- 分页切换 -->
        <div v-if="reportData.tools.paging" class="btn-group">
          <ButtonGroup
              :buttonText="toolsInfo > 0 ? $t('preview.paging.pagingPreview') : $t('preview.paging.preview')"
              :showText="true"
              :buttonStyle="{ background: '#f8f8f8', border: 'none', color: '#337ab7' }"
              :menuItems="pagingMenuItems"
              :customClass="'p-tool-button'"
          />
        </div>

        <!-- 分页控件 -->
        <u-button v-if="reportData.tools.paging && currentPage > 1"
                  type="info"
                  :title="$t('preview.buttons.prevPage')"
                  class="p-button paging-button"
                  @click="goToPrevPage">
          {{ $t('preview.buttons.prevPage') }}
        </u-button>

        <div v-if="toolsInfo > 0" class="btn-group">
          <!-- 分页下拉菜单 -->
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
    </div>

    <!-- 报表内容区域 -->
    <div id="report-table" v-if="reportData && reportData.content"
         v-html="reportData.content"
         :style="{ float: reportData.reportAlign || 'left' }"></div>

    <!-- 打印框架 -->
    <iframe name="print_frame" width="0" height="0" frameborder="0" src="about:blank"></iframe>
    <iframe name="print_pdf_frame" width="0" height="0" frameborder="0" src="about:blank"></iframe>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">{{ $t('preview.loading.report') }}</div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-container">
      <div class="error-message">{{ errorMessage }}</div>
    </div>

    <!-- PDF打印对话框 -->
    <PDFPrintDialog
        ref="pdfPrintDialog"
    />
  </div>
</template>

<script>
import 'chart.js/dist/Chart.bundle.min.js';
import 'chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js';
import {
  getExcelExportUrl,
  getExcelPagingExportUrl,
  getExcelSheetPagingExportUrl,
  getPdfDirectPrintUrl,
  getPdfExportUrl,
  getWordExportUrl,
  loadPagePaper,
  loadPrintPages,
  loadReportData,
  previewReport,
  storeChartData
} from '@/api/preview'

import {pointToMM} from '@/utils/table.js';
import showLoading from '@/components/loading/instance.js';
import { showAlert } from '@/utils/comnon.js';
import PDFPrintDialog from '@/views/report/designer/search-form/pdf-print-dialog/index.vue';

import ButtonGroup from "@/components/button-group/index.vue";
import {renderTemplateToComponent} from "@/views/report/preview/utils";
import {beautifierConf, deepClone} from "@/views/report/designer/search-form/utils";
import UButton from "@/components/button/index.vue";
import {cssStyle, makeUpHtml, vueScript, vueTemplate} from "@/views/report/designer/search-form/utils/html";
import {makeUpJs} from "@/views/report/designer/search-form/utils/js";
import {makeUpCss} from "@/views/report/designer/search-form/utils/css";
import beautifier from "js-beautify";

export default {
  name: 'PreviewPage',
  components: {
    UButton,
    PDFPrintDialog,
    ButtonGroup
  },
  data() {
    return {
      loading: true,
      errorMessage: '',
      reportData: null,
      currentReportName: '',
      toolsInfo: 0,
      totalPage: 0,
      currentPage: 1,
      directPrintPdf: false,
      printIndex: 0,
      searchFormParameters: {},
      pageMenuItems: []
    }
  },
  computed: {
    pagingMenuItems() {
      return [
        {
          text: this.$t('preview.paging.preview'),
          action: () => this.goToPreview(0)
        },
        {
          text: this.$t('preview.paging.pagingPreview'),
          action: () => this.goToPreview(1)
        }
      ];
    }
  },
  watch: {
    // 监听路由变化，当页码参数变化时重新加载数据
    '$route.query._i': {
      handler(newPageIndex, oldPageIndex) {
        // 如果页码发生变化且不是初始加载，则重新加载报表数据
        if (newPageIndex !== oldPageIndex && oldPageIndex !== undefined) {
          this.loadReportDataForPage(newPageIndex);
        }
      },
      immediate: false
    }
  },
  async mounted() {
      await this.initReportPreview();
      this.currentPage = null;
      this.totalPage = null;
      this.initPageMenuItems();
  },
  methods: {

    async print(){
      let loadingInstance = null;
      try {
        const urlParameters = this.buildLocationSearchParameters();
        const params = new URLSearchParams(urlParameters);
        // 将URL参数转换为对象
        const formData = new FormData();
        for (const [key, value] of params.entries()) {
          formData.append(key, value);
        }

        loadingInstance = showLoading({
          text: '加载中...',
        });

        // 加载打印页面数据
        const result = await loadPrintPages(formData);

        // 加载纸张信息
        const paper = await loadPagePaper(formData);

        loadingInstance.close();

        // 构建打印HTML
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

    async printPdf(){
      try {
        const urlParameters = this.buildLocationSearchParameters();
        const params = new URLSearchParams(urlParameters);

        const formData = new FormData();
        for (const [key, value] of params.entries()) {
          formData.append(key, value);
        }

        const paper = await loadPagePaper(formData);

        this.$refs.pdfPrintDialog.show(paper);
      } catch (error) {
        console.error('获取纸张信息失败:', error);
        showAlert(this.$t('preview.error.loadPaperFail'));
      }
    },

    printDirectPdf(){
      const loadingInstance = showLoading({
        text: this.$t('preview.loading.default'),
      });
      const urlParameters = this.buildLocationSearchParameters();
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
        const handleLoad = function() {
          closeLoading();
          try {
            iframe.window.focus();
            iframe.window.print();
          } catch (error) {
            console.error('打印失败:', error);
          }
        };

        const handleError = function() {
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

    exportPdf(){
      const urlParameters = this.buildLocationSearchParameters();
      const params = new URLSearchParams(urlParameters);
      const paramObj = {};

      // 将URL参数转换为对象
      for (const [key, value] of params.entries()) {
        paramObj[key] = value;
      }

      // 获取导出PDF的URL
      const url = getPdfExportUrl(paramObj);
      window.open(url, '_blank');
    },

    exportWord(){
      const urlParameters = this.buildLocationSearchParameters();
      const params = new URLSearchParams(urlParameters);
      const paramObj = {};

      for (const [key, value] of params.entries()) {
        paramObj[key] = value;
      }

      const url = getWordExportUrl(paramObj);
      window.open(url, '_blank');
    },

    exportExcelPagingSheet(){
      const urlParameters = this.buildLocationSearchParameters();
      const params = new URLSearchParams(urlParameters);
      const paramObj = {};

      // 将URL参数转换为对象
      for (const [key, value] of params.entries()) {
        paramObj[key] = value;
      }

      // 获取分页分Sheet导出Excel的URL
      const url = getExcelSheetPagingExportUrl(paramObj);
      window.open(url, '_blank');
    },

    exportExcelPaging(){
      const urlParameters = this.buildLocationSearchParameters();
      const params = new URLSearchParams(urlParameters);
      const paramObj = {};

      // 将URL参数转换为对象
      for (const [key, value] of params.entries()) {
        paramObj[key] = value;
      }

      // 获取分页导出Excel的URL
      const url = getExcelPagingExportUrl(paramObj);
      window.open(url, '_blank');
    },

    exportExcel(){
      const urlParameters = this.buildLocationSearchParameters();
      const params = new URLSearchParams(urlParameters);
      const paramObj = {};

      // 将URL参数转换为对象
      for (const [key, value] of params.entries()) {
        paramObj[key] = value;
      }

      // 获取导出Excel的URL
      const url = getExcelExportUrl(paramObj);
      window.open(url, '_blank');
    },

    /**
     * 为指定页码加载报表数据
     * @param {number} pageIndex - 页码索引
     */
    async loadReportDataForPage(pageIndex) {
      try {
        this.loading = true;

        // 从当前路由获取参数
        const fileName = this.$route.query.reportPath; // 报表文件名
        const mode = this.$route.query.mode; // 模式
        const toolsInfo = this.$route.query._t; // 工具栏信息

        if (!fileName) {
          throw new Error(this.$t('preview.error.fileParamMissing'));
        }

        // 构建查询参数
        const params = {
          reportPath: fileName
        };

        if (mode) {
          params.mode = mode
        }

        if (pageIndex) {
          params._i = pageIndex
        }

        if (toolsInfo) {
          params._t = toolsInfo
        }

        // 添加自定义参数（非下划线开头的参数）
        Object.keys(this.$route.query).forEach(key => {
          if (!key.startsWith('_')) {
            params[key] = this.$route.query[key];
          }
        });

        // 添加搜索表单参数
        if (this.searchFormParameters) {
          Object.keys(this.searchFormParameters).forEach(key => {
            if (this.searchFormParameters[key]) {
              params[key] = this.searchFormParameters[key];
            }
          });
        }

        // 加载报表数据
        const reportData = await previewReport(params);
        if (reportData.errorMsg) {
          throw new Error(reportData.errorMsg);
        }

        // 更新报表数据
        this.reportData = reportData;
        this.currentPage = parseInt(pageIndex) || 1;

        // 更新报表内容
        const tableContainer = document.getElementById('report-table');
        if (tableContainer) {
          tableContainer.innerHTML = reportData.content;
        }

        // 重建图表数据
        this._buildChartDatas(reportData.chartDatas);

        // 更新分页信息
        this.totalPage = reportData.totalPageWithCol || reportData.totalPage || 0;

        // 初始化分页菜单项
        this.initPageMenuItems();

      } catch (error) {
        this.errorMessage = '加载报表失败: ' + error.message;
        console.error('加载报表失败:', error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * 初始化报表预览功能
     * 从URL获取参数、加载报表数据、设置报表样式和分页信息
     */
    async initReportPreview() {
      try {
        const fileName = this.$route.query.reportPath; // 报表文件名
        const mode = this.$route.query.mode // 模式
        const pageIndex = this.$route.query._i // 页码索引
        const toolsInfo = this.$route.query._t // 工具栏信息

        if (!fileName) {
          throw new Error(this.$t('preview.error.fileParamMissing'))
        }

        // 构建查询参数
        const params = {
          reportPath: fileName
        }

        if (mode) {
          params.mode = mode
        }

        if (pageIndex) {
          params._i = pageIndex
        }

        if (toolsInfo) {
          params._t = toolsInfo
        }

        // 添加自定义参数（非下划线开头的参数）
        Object.keys(this.$route.query).forEach(key => {
          if (!key.startsWith('_')) {
            params[key] = this.$route.query[key]
          }
        })

        // 加载报表数据
        this.loading = true
        this.reportData = await previewReport(params)
        if(this.reportData.errorMsg){
          throw Error(this.reportData.errorMsg)
        }

        this.currentReportName = this.reportData.title || this.$route.query._title || file
        if (this.currentReportName.endsWith('.ureport.xml')) {
          this.currentReportName = this.currentReportName.replace('.ureport.xml', '')
        }

        // 更新页面标题
        document.title = this.currentReportName

        // 设置报表样式
        this.initReportSearchForm(this.reportData.searchForm)

        // 设置报表样式
        this.injectReportStyle(this.reportData.style)

        // 设置分页信息
        this.toolsInfo = parseInt(this.reportData.pageIndex || pageIndex)
        this.totalPage = this.reportData.totalPageWithCol || this.reportData.totalPage || 0
        this.currentPage = parseInt(this.$route.query._i) || 1

        // 初始化分页菜单项
        this.initPageMenuItems()

        // 初始化预览功能函数
        this.initializePreviewFunctions()

      } catch (error) {
        this.errorMessage = '加载报表失败: ' + error.message
        console.error('加载报表失败:', error)
      } finally {
        // 无论成功失败，都关闭加载状态
        this.loading = false
      }
    },


    initReportSearchForm(searchForm){
      let that = this;
      if(!searchForm || !searchForm.fields || searchForm.fields.length === 0){
        return
      }

      const generateType = 'file';
      const script = vueScript(makeUpJs(searchForm, generateType))
      const html = vueTemplate(makeUpHtml(searchForm, generateType))
      const css = cssStyle(makeUpCss(searchForm))
      const formJs = beautifier.html(html + script + css, beautifierConf.html)
      const instance = renderTemplateToComponent(formJs, this.$refs.searchForm);
      instance.$on('on-submit', (formData) => {
        that.searchFormParameters = deepClone(formData);
        that.submitSearchForm()
      });

    },

    /**
     * 注入报表样式到页面
     * @param {string} style - 报表样式字符串
     */
    injectReportStyle(style) {
      // 创建或更新样式元素
      let styleElement = document.getElementById('report-table-style')
      if (!styleElement) {
        // 如果样式元素不存在，则创建新的
        styleElement = document.createElement('style')
        styleElement.id = 'report-table-style'
        document.head.appendChild(styleElement)
      }
      // 设置样式内容，为空时使用空字符串
      styleElement.textContent = style || ''
    },

    /**
     * 提交表单
     * @returns {Promise<void>}
     */
    async submitSearchForm(){
      const parameters = this.buildLocationSearchParameters('_i');
      try {

        const params = new URLSearchParams(parameters.substring(1));
        const paramObj = {};
        for (const [key, value] of params.entries()) {
          paramObj[key] = value;
        }

        const report = await loadReportData(paramObj);

        this.currentPage = 1;
        const tableContainer = document.getElementById('report-table');
        if (tableContainer) {
          tableContainer.innerHTML = '';
          tableContainer.innerHTML = report.content;
        }
        this._buildChartDatas(report.chartDatas);
        const totalPage=report.totalPage;
        this.totalPage = totalPage;

        // 更新总页数显示
        const totalPageLabel = document.getElementById('totalPageLabel');
        if(totalPageLabel){
          totalPageLabel.textContent = totalPage;
        }

        this.currentPage = report.pageIndex;
        this.buildPaging(this.currentPage,totalPage);
        // 初始化分页菜单项
        this.initPageMenuItems();
      } catch (error) {
        console.error('提交搜索表单失败:', error);
        if (error.msg) {
          showAlert(this.$t('preview.error.serverError') + error.msg);
        } else {
          showAlert(this.$t('preview.error.searchFail'));
        }
      }
    },

    _intervalRefresh(value,totalPage){
      if(!value){
        return;
      }
      this.totalPage = totalPage;
      const second = value * 1000;
      setTimeout(() => {
        this._refreshData(second);
      }, second);
    },

    _buildChartDatas(chartData){
      if(!chartData){
        return;
      }
      for(let d of chartData){
        let json = d.json;
        if(json){
          json = JSON.parse(json,function (k, v) {
            if(v.indexOf && v.indexOf('function') > -1){
              return eval("(function(){return "+v+" })()")
            }
            return v;
          });
        }
        this._buildChart(d.id,json);
      }
    },

    buildLocationSearchParameters(exclude){
      let urlParameters=window.location.search;
      if(urlParameters.length>0){
        urlParameters=urlParameters.substring(1,urlParameters.length);
      }
      let parameters={};
      const pairs=urlParameters.split('&');
      for(let i=0;i<pairs.length;i++){
        const item=pairs[i];
        if(item===''){
          continue;
        }
        const param=item.split('=');
        let key=param[0];
        if(exclude && key===exclude){
          continue;
        }
        let value=param[1];
        parameters[key]=value;
      }
      if(this.searchFormParameters){
        for(let key in this.searchFormParameters){
          if(key===exclude){
            continue;
          }
          const value=this.searchFormParameters[key];
          if(value){
            parameters[key]=value;
          }
        }
      }
      let p='?';
      for(let key in parameters){
        if(p==='?'){
          p+=key+'='+parameters[key];
        }else{
          p+='&'+key+'='+parameters[key];
        }
      }
      return p;
    },

    buildPrintStyle(paper){
      const marginLeft=pointToMM(paper.leftMargin);
      const marginTop=pointToMM(paper.topMargin);
      const marginRight=pointToMM(paper.rightMargin);
      const marginBottom=pointToMM(paper.bottomMargin);
      const paperType=paper.paperType;
      let page=paperType;
      if(paperType==='CUSTOM'){
        page=pointToMM(paper.width)+'mm '+pointToMM(paper.height)+'mm';
      }
      const style=`
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

    buildPaging(pageIndex,totalPage){
      if(totalPage===0){
        return;
      }
      if(!pageIndex){
        return;
      }
      if(!this.currentPage){
        this.currentPage=pageIndex;
      }
      pageIndex=this.currentPage;
      if(!this.totalPage){
        this.totalPage=totalPage;
      }
    },

    // 处理页码选择变化
    handlePageChange() {
      this.navigateToPage(this.currentPage);
    },

    // 导航到指定页面
    navigateToPage(pageIndex) {
      this.currentPage = pageIndex;
      this.initPageMenuItems();

      // 构建新的查询参数
      const query = { ...this.$route.query };
      query._i = pageIndex;

      // 使用路由导航到新页面
      this.$router.push({ query });
    },

    // 上一页
    goToPrevPage() {
      if (this.currentPage > 1) {
        this.navigateToPage(this.currentPage - 1);
      }
    },

    // 下一页
    goToNextPage() {
      if (this.currentPage < this.reportData.totalPageWithCol) {
        this.navigateToPage(this.currentPage + 1);
      }
    },

    // 初始化分页菜单项
    initPageMenuItems() {
      if (!this.reportData || !this.reportData.totalPageWithCol) {
        return;
      }

      const menuItems = [];

      // 添加页码选项
      for (let i = 1; i <= this.reportData.totalPageWithCol; i++) {
        menuItems.push({
          text: `第${i}页`,
          action: () => this.navigateToPage(i)
        });
      }

      this.pageMenuItems = menuItems;
    },

    async _refreshData(second){
      const params = this.buildLocationSearchParameters('_i');
      const totalPage = this.totalPage;

      // 构建参数对象
      const queryParams = new URLSearchParams(params.substring(1));
      const paramObj = {};
      for (const [key, value] of queryParams.entries()) {
        paramObj[key] = value;
      }

      if(totalPage > 0){
        if(this.currentPage){
          if(this.currentPage > totalPage){
            this.currentPage = 1;
          }
          paramObj._i = this.currentPage;
        }
        // 更新总页数显示
        const totalPageLabel = document.getElementById('totalPageLabel');
        if(totalPageLabel){
          totalPageLabel.textContent = this.totalPage;
        }
      }

      try {
        const report = await loadReportData(paramObj);
        const tableContainer = document.getElementById('report-table');
        if (tableContainer) {
          tableContainer.innerHTML = '';
          tableContainer.innerHTML = report.content;
        }
        this.totalPage = report.totalPageWithCol;
        this._buildChartDatas(report.chartDatas);
        this.buildPaging(this.currentPage, this.totalPage);
        setTimeout(() => {
          this._refreshData(second);
        }, second);
      } catch (error) {
        console.error('刷新数据失败:', error);
        const tableContainer = document.getElementById('report-table');
        if (tableContainer) {
          tableContainer.innerHTML = '';
          if (error.msg) {
            tableContainer.innerHTML = `<h3 style='color: #d30e00;'>${this.$t('preview.error.serverError')}${error.msg}</h3>`;
          } else {
            tableContainer.innerHTML = `<h3 style='color: #d30e00;'>${this.$t('preview.error.loadDataFail')}</h3>`;
          }
        }
        setTimeout(() => {
          this._refreshData(second);
        }, second);
      }
    },

    async _buildChart(canvasId,chartJson){
      const ctx=document.getElementById(canvasId);
      if(!ctx){
        return;
      }
      let options=chartJson.options;
      if(!options){
        options={};
        chartJson.options=options;
      }
      let animation=options.animation;
      if(!animation){
        animation={};
        options.animation=animation;
      }

      animation.onComplete=async (event) => {
        try {
          const chart=event.chart;
          const base64Image=chart.toBase64Image();
          const urlParameters=window.location.search;
          const canvas = document.getElementById(canvasId);
          if (!canvas) return;

          const width=parseInt(canvas.style.width) || canvas.width;
          const height=parseInt(canvas.style.height) || canvas.height;

          const formData = new FormData();
          formData.append('_base64Data', base64Image);
          formData.append('_chartId', canvasId);
          formData.append('_width', width);
          formData.append('_height', height);

          const params = new URLSearchParams(urlParameters.substring(1));
          for (const [key, value] of params.entries()) {
            formData.append(key, value);
          }

          await storeChartData(formData);
        } catch (error) {
          console.error('存储图表数据失败:', error);
        }
      };

      const chart=new Chart(ctx,chartJson);
    },

    /**
     * 初始化预览相关的功能函数
     * 包括图表数据、分页、刷新间隔和搜索功能的设置
     */
    initializePreviewFunctions() {
      let that = this;

      setTimeout(() => {

        // 初始化分页功能
        this.buildPaging(that.toolsInfo, that.totalPage)
        // 设置自动刷新间隔
        if (this.reportData.intervalRefreshValue > 0) {
          this._intervalRefresh(that.reportData.intervalRefreshValue, that.totalPage);
        }

        // 初始化图表数据
        if (that.reportData.chartDatas && that.reportData.chartDatas.length > 0) {
          this._buildChartDatas(that.reportData.chartDatas);
        }

      }, 500);
    },

    /**
     * 获取预览URL
     * 根据模式（普通预览/分页预览）和当前参数构建URL
     * @param {number} mode - 预览模式（0:普通预览, 1:分页预览）
     * @returns {string} 构建好的预览URL
     */
    getPreviewUrl(pageMode) {
      const query = { ...this.$route.query };

      if (pageMode === 1) {
        query._i = 1;
      }

      const routeData = this.$router.resolve({
        name: 'Preview',
        query: query
      });

      return routeData.href;
    },

    /**
     * 跳转到指定模式的预览页面
     * @param {number} pageMode - 预览模式（0:普通预览, 1:分页预览）
     */
    goToPreview(pageMode) {
      window.location.href = this.getPreviewUrl(pageMode);
    },

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

.search-query {
  width: 600px;
  margin: 0 auto;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 10px;
  font-size: 16px;
  color: #666;
}

.error-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-width: 80%;
  max-height: 80%;
  overflow: auto;
}

.error-message {
  color: #e74c3c;
  font-size: 16px;
  line-height: 1.5;
}

/* 响应式布局 */
@media (max-width: 768px) {
  #preview-container {
    padding: 5px;
  }

  #tools-container {
    height: auto;
    min-height: 35px;
    padding: 5px 0;
  }

  #tools-buttons {
    text-align: center;
  }
}

.p-tool-button{
  display:inline-block;
  padding:0;
  background:#f8f8f8;
  border:none;
  margin:3px
}

.p-button{
  border: none;
  background: rgb(248, 248, 248);
}

.p-button img{
  vertical-align: middle;
}

.tools-content{
  border:solid 1px #ddd;
  border-radius:5px;
  height:40px;
  width:100%;
  background:#f8f8f8;
}
</style>
