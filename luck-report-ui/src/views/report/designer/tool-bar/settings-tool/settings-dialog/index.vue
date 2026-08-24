<template>
  <UDialog
    :title="$t('dialog.setting.title')"
    width="800px"
    :visible="visible"
    @close="handleClose"
  >
    <div class="settings-dialog">
      <!-- 选项卡导航 -->
      <u-tabs v-model="activeTab">
        <u-tab-pane :label="$t('dialog.setting.pageSetting')" index="page"></u-tab-pane>
        <u-tab-pane :label="$t('dialog.setting.headerFooterSetting')" index="headerFooter"></u-tab-pane>
        <u-tab-pane :label="$t('dialog.setting.pagingSetting')" index="paging"></u-tab-pane>
        <u-tab-pane :label="$t('dialog.setting.columnSetting')" index="column"></u-tab-pane>
      </u-tabs>

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

    <div slot="footer" class="div-footer-align">
      <u-button @click="handleClose" type="info" class="btn-cancel">{{ $t('dialog.common.cancel') }}</u-button>
      <u-button @click="handleOk">{{ $t('dialog.common.ok') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import { showAlert } from '@/utils/comnon.js';
import {buildPageSizeList, mmToPoint, setDirty} from '@/utils/table.js';
import { deepCopy } from '@/components/utils/index.js';
import FontSettingDialog from '@/views/report/designer/tool-bar/settings-tool/font-setting-dialog/index.vue';
import UDialog from '@/components/dialog/index.vue';
import UButton from "@/components/button/index.vue";
import UTabs from "@/components/tabs/index.vue";
import UTabPane from "@/components/tabs/pane.vue";
import PageSettings from './page/index.vue';
import HeaderFooterSettings from '@/views/report/designer/tool-bar/settings-tool/settings-dialog/header-footer/index.vue';
import PagingSettings from './paging/index.vue';
import ColumnSettings from './column/index.vue';
import { mapGetters } from 'vuex';
import { updateReportDef } from '@/utils/contextActions.js';
import { applyTableBackground } from '@/views/report/designer/edit-table/utils/BackgroundUtils.js';

export default {
  name: 'SettingsDialog',
  components: {
    UButton,
    UDialog,
    FontSettingDialog,
    UTabs,
    UTabPane,
    PageSettings,
    HeaderFooterSettings,
    PagingSettings,
    ColumnSettings
  },
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
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    }
  },
  watch: {
    visible(newVal) {
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
        this.$store.dispatch('report/setIsPrintLineRefresh', true);
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
      applyTableBackground(this.paper.bgImage);
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
      this.header = value;
    },
    updateFooter(value) {
      this.footer = value;
    },
    handleFixRowsChange(value) {
      if (this.paper.pagingMode === 'fixrows' && value < 1) {
        showAlert(this.$t('dialog.setting.fixRowsTip'));
        return;
      }
      setDirty();
    },
    handleHtmlIntervalRefreshValueChange(value) {
      if (isNaN(value) || value < 0) {
        showAlert(this.$t('dialog.setting.secondTip'));
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
      if (style) {
        this.header.fontFamily = style.fontFamily;
        this.header.fontSize = style.fontSize;
        this.header.forecolor = style.forecolor;
        this.header.bold = style.bold;
        this.header.italic = style.italic;
        this.header.underline = style.underline;
        setDirty();
      }
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

.tab-content {
  padding: 10px 0;
}

.div-footer-align {
  text-align: right;
}

.btn-cancel {
  margin-right: 10px;
}

</style>
