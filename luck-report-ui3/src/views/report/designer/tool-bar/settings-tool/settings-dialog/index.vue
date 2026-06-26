<template>
  <a-modal
    :title="t('dialog.setting.title')"
    width="800px"
    :open="visible"
    @cancel="handleClose"
    @ok="handleOk"
  >
    <div class="settings-dialog">
      <!-- 选项卡导航 -->
      <a-tabs v-model:active-key="activeTab">
        <a-tab-pane :key="'page'" :tab="t('dialog.setting.pageSetting')"></a-tab-pane>
        <a-tab-pane :key="'headerFooter'" :tab="t('dialog.setting.headerFooterSetting')"></a-tab-pane>
        <a-tab-pane :key="'paging'" :tab="t('dialog.setting.pagingSetting')"></a-tab-pane>
        <a-tab-pane :key="'column'" :tab="t('dialog.setting.columnSetting')"></a-tab-pane>
      </a-tabs>

      <!-- 选项卡内容 -->
      <div class="tab-content">
        <!-- 页面设置 -->
        <div v-show="activeTab === 'page'">
          <page-settings
            :paper="paper"
            @update:paper="updatePaper"
            @paper-type-change="handlePaperTypeChange"
            @paper-size-change="updatePaperSize"
            @margins-change="updateMargins"
            @orientation-change="handleOrientationChange"
            @html-align-change="handleHtmlAlignChange"
            @html-interval-refresh-value-change="handleHtmlIntervalRefreshValueChange"
            @background-image-change="updateBackgroundImage"
          />
        </div>

        <!-- 页眉页脚设置 -->
        <div v-show="activeTab === 'headerFooter'">
          <header-footer-settings
            :header="header"
            :footer="footer"
            @update:header="updateHeader"
            @update:footer="updateFooter"
            @open-header-font-dialog="openHeaderFontDialog"
            @open-footer-font-dialog="openFooterFontDialog"
            @header-margin-change="updateHeaderMargin"
            @footer-margin-change="updateFooterMargin"
            @header-footer-change="validateHeaderFooter"
          />
        </div>

        <!-- 分页设置 -->
        <div v-show="activeTab === 'paging'">
          <paging-settings
            :paper="paper"
            @update:paper="updatePaper"
            @paging-mode-change="handlePagingModeChange"
            @fix-rows-change="handleFixRowsChange"
          />
        </div>

        <!-- 列设置 -->
        <div v-show="activeTab === 'column'">
          <column-settings
            :paper="paper"
            @update:paper="updatePaper"
            @column-enabled-change="handleColumnEnabledChange"
            @column-count-change="handleColumnCountChange"
            @column-margin-change="updateColumnMargin"
          />
        </div>
      </div>
    </div>

    <FontSettingDialog
      ref="headerFontDialog"
      :visible="headerFontDialogVisible"
      :font-style="header"
      @close="handleHeaderFontDialogClose"
      @ok="handleHeaderFontDialogOk"
    />

    <FontSettingDialog
      ref="footerFontDialog"
      :visible="footerFontDialogVisible"
      :font-style="footer"
      @close="handleFooterFontDialogClose"
      @ok="handleFooterFontDialogOk"
    />

    <template #footer>
      <div class="div-footer-align">
        <a-button @click="handleClose" type="default" class="btn-cancel">{{ t('dialog.common.cancel') }}</a-button>
        <a-button type="primary" @click="handleOk">{{ t('dialog.common.ok') }}</a-button>
      </div>
    </template>
  </a-modal>
</template>

<script>
import { showAlert, deepCopy } from '@/utils/comnon';
import { buildPageSizeList, mmToPoint, setDirty } from '@/utils/table';
import FontSettingDialog from '@/views/report/designer/tool-bar/settings-tool/font-setting-dialog/index.vue';
import PageSettings from './page/index.vue';
import HeaderFooterSettings from '@/views/report/designer/tool-bar/settings-tool/settings-dialog/header-footer/index.vue';
import PagingSettings from './paging/index.vue';
import ColumnSettings from './column/index.vue';
import { useReportStore } from '@/store/modules/report';
import { updateReportDef } from '@/utils/contextActions';
import { useI18n } from 'vue-i18n';

export default {
  name: 'SettingsDialog',
  // 关闭 inheritAttrs，避免父级透传的 @ok 事件（onOk）与模板里 a-modal 的 @ok
  // 合并成数组触发 ant-design-vue AModal 的 prop 类型检查警告
  inheritAttrs: false,
  setup() {
    return { t: useI18n().t };
  },
  components: {
    FontSettingDialog,
    PageSettings,
    HeaderFooterSettings,
    PagingSettings,
    ColumnSettings
  },
  emits: ['close', 'ok'],
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      activeTab: 'page',
      paperSizeList: buildPageSizeList(),
      paper: {
        paperType: 'A4',
        width: mmToPoint(210),
        height: mmToPoint(297),
        leftMargin: mmToPoint(20),
        rightMargin: mmToPoint(20),
        topMargin: mmToPoint(20),
        bottomMargin: mmToPoint(20),
        orientation: 'portrait',
        htmlReportAlign: 'left',
        htmlIntervalRefreshValue: 3,
        bgImage: '',
        pagingMode: 'fitpage',
        fixRows: 30,
        columnEnabled: false,
        columnCount: 2,
        columnMargin: mmToPoint(10)
      },
      header: {
        left: '',
        center: '',
        right: '',
        margin: 30,
        fontFamily: '宋体',
        fontSize: 10,
        forecolor: '0,0,0',
        bold: false,
        italic: false,
        underline: false
      },
      footer: {
        left: '',
        center: '',
        right: '',
        margin: 30,
        fontFamily: '宋体',
        fontSize: 10,
        forecolor: '0,0,0',
        bold: false,
        italic: false,
        underline: false
      },
      headerFontDialogVisible: false,
      footerFontDialogVisible: false,
      isPrintLineRefresh: false
    };
  },
  computed: {
    context() {
      return useReportStore().getContext;
    }
  },
  watch: {
    visible(newVal) {
      console.log('[DEBUG][settings-dialog] watch.visible, newVal=', newVal, 'this.context=', this.context ? 'has context' : 'null')
      if (newVal && this.context) {
        this.initializeData();
      }
    }
  },
  methods: {
    initializeData() {
      if (!this.context) {
        console.error('context 未定义，无法初始化数据');
        return;
      }

      if (!this.context.reportDef) {
        console.error('context.reportDef 未定义，无法初始化数据');
        return;
      }

      const reportDefCopy = deepCopy(this.context.reportDef);

      // 初始化数据
      this.paper = { ...reportDefCopy.paper };

      // 确保 fixRows 有一个有效的默认值
      if (!this.paper.fixRows || this.paper.fixRows < 1) {
        this.paper.fixRows = 30;
      }

      if (!reportDefCopy.header) {
        reportDefCopy.header = { margin: 30 };
      }
      if (!reportDefCopy.footer) {
        reportDefCopy.footer = { margin: 30 };
      }

      this.header = { ...reportDefCopy.header };
      this.footer = { ...reportDefCopy.footer };

      this.isPrintLineRefresh = false;

    },
    handleClose() {
      this.$emit('close');
    },
    handleOk() {
      // 检查 reportDef 是否存在
      if (!this.context || !this.context.reportDef) {
        this.$emit('ok');
        return;
      }

      // 使用 deepCopy 复制数据
      const newPaper = deepCopy(this.paper);
      const newHeader = deepCopy(this.header);
      const newFooter = deepCopy(this.footer);

      updateReportDef({
        ...this.context.reportDef,
        paper: newPaper,
        header: newHeader,
        footer: newFooter
      });

      if (this.isPrintLineRefresh) {
        useReportStore().setIsPrintLineRefresh(true);
      }

      this.$emit('ok');
    },
    updatePaperSize() {
      if (this.paper.paperType !== 'CUSTOM') {
        return;
      }
      this.isPrintLineRefresh = true;
      setDirty();
    },
    updateMargins() {
      this.isPrintLineRefresh = true;
      setDirty();
    },
    updateBackgroundImage() {
      if (this.paper.bgImage === '') {
        const elements = document.querySelectorAll('.ht_master');
        elements.forEach(el => {
          el.style.background = 'transparent';
        });
      } else {
        const elements = document.querySelectorAll('.ht_master');
        elements.forEach(el => {
          el.style.background = `url(${this.paper.bgImage}) 50px 26px no-repeat`;
        });
      }
      setDirty();
    },
    updateHeaderMargin() {
      setDirty();
    },
    updateFooterMargin() {
      setDirty();
    },
    updateColumnMargin() {
      setDirty();
    },
    updatePaper(value) {
      this.paper = value;
    },
    updateHeader(value) {
      console.log('[DEBUG][settings-dialog] updateHeader, value=', JSON.stringify(value))
      this.header = value;
    },
    updateFooter(value) {
      this.footer = value;
    },
    handleFixRowsChange(value) {
      if (this.paper.pagingMode === 'fixrows' && value < 1) {
        showAlert(this.t('dialog.setting.fixRowsTip'));
        return;
      }
      setDirty();
    },
    handleHtmlIntervalRefreshValueChange(value) {
      if (isNaN(value) || value < 0) {
        showAlert(this.t('dialog.setting.secondTip'));
        return;
      }
      setDirty();
    },
    openHeaderFontDialog() {
      this.headerFontDialogVisible = true;
    },
    openFooterFontDialog() {
      this.footerFontDialogVisible = true;
    },
    handleHeaderFontDialogClose() {
      this.headerFontDialogVisible = false;
    },
    handleHeaderFontDialogOk(style) {
      console.log('[DEBUG][settings-dialog] handleHeaderFontDialogOk called, style=', JSON.stringify(style), 'before this.header=', JSON.stringify(this.header))
      if (style) {
        this.header.fontFamily = style.fontFamily;
        this.header.fontSize = style.fontSize;
        this.header.forecolor = style.forecolor;
        this.header.bold = style.bold;
        this.header.italic = style.italic;
        this.header.underline = style.underline;
        setDirty();
      }
      console.log('[DEBUG][settings-dialog] after mutate this.header=', JSON.stringify(this.header))
      this.headerFontDialogVisible = false;
    },
    handleFooterFontDialogClose() {
      this.footerFontDialogVisible = false;
    },
    handleFooterFontDialogOk(style) {
      if (style) {
        this.footer.fontFamily = style.fontFamily;
        this.footer.fontSize = style.fontSize;
        this.footer.forecolor = style.forecolor;
        this.footer.bold = style.bold;
        this.footer.italic = style.italic;
        this.footer.underline = style.underline;
        setDirty();
      }
      this.footerFontDialogVisible = false;
    },
    validateHeaderFooter() {
      setDirty();
    },
    handlePaperTypeChange(value) {
      if (value !== 'CUSTOM') {
        const pageSize = this.paperSizeList[value];
        this.paper.width = mmToPoint(pageSize.width);
        this.paper.height = mmToPoint(pageSize.height);
        this.isPrintLineRefresh = true;
      }
      setDirty();
    },
    handleOrientationChange() {
      this.isPrintLineRefresh = true;
      setDirty();
    },
    handleHtmlAlignChange() {
      setDirty();
    },
    handleColumnCountChange() {
      setDirty();
    },
    handlePagingModeChange() {
      setDirty();
    },
    handleColumnEnabledChange() {
      setDirty();
    }
  }
};
</script>

<style scoped>

.settings-dialog{
  height: 400px;
}

.div-footer-align {
  text-align: right;
}

.btn-cancel {
  margin-right: 10px;
}

</style>
