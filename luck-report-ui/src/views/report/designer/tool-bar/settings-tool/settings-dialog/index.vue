<template>
  <UDialog
    :title="$t('dialog.setting.title')"
    width="800px"
    :visible="dialogVisible"
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
          <div class="form-group" style="margin-top: 12px;display: inline-block">
            <label>{{ $t('dialog.setting.paperType') }}：</label>
            <div class="u-inline">
              <u-select
                v-model="paper.paperType"
                style="width: 95px"
                @change="handlePaperTypeChange"
              >
                <u-option
                  v-for="option in paperTypeOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>

          <div class="form-group" style="display: inline-block;margin-left: 25px">
            <span>{{ $t('dialog.setting.paperWidth') }}：</span>
            <div class="u-inline">
              <u-input-number
                v-model="pageWidth"
                :disabled="paper.paperType !== 'CUSTOM'"
                @change="updatePaperSize"
              />
            </div>
          </div>

          <div class="form-group" style="display: inline-block;margin-left: 15px">
            <span>{{ $t('dialog.setting.paperHeight') }}：</span>
            <div class="u-inline">
              <u-input-number
                v-model="pageHeight"
                :disabled="paper.paperType !== 'CUSTOM'"
                @change="updatePaperSize"
              />
            </div>
          </div>

          <!-- 换行 -->
          <div></div>

          <div class="form-group" style="display: inline-block;margin-top: 5px;">
            <label>{{ $t('dialog.setting.leftMargin') }}：</label>
            <div class="u-inline">
              <u-input-number
                v-model="leftMargin"
                @change="updateMargins"
              />
            </div>
          </div>

          <div class="form-group" style="display: inline-block;margin-top: 5px;margin-left: 25px">
            <label>{{ $t('dialog.setting.rightMargin') }}：</label>
            <div class="u-inline">
              <u-input-number
                v-model="rightMargin"
                @change="updateMargins"
              />
            </div>
          </div>

          <!-- 换行 -->
          <div></div>

          <div class="form-group" style="display: inline-block;margin-top: 5px;">
            <label>{{ $t('dialog.setting.topMargin') }}：</label>
            <div class="u-inline">
              <u-input-number
                v-model="topMargin"
                @change="updateMargins"
              />
            </div>
          </div>

          <div class="form-group" style="display: inline-block;margin-top: 5px;margin-left: 25px">
            <label>{{ $t('dialog.setting.bottomMargin') }}：</label>
            <div class="u-inline">
              <u-input-number
                v-model="bottomMargin"
                @change="updateMargins"
              />
            </div>
          </div>

          <div class="form-group">
            <label>{{ $t('dialog.setting.orientation') }}：</label>
            <div class="u-inline">
              <u-select
                v-model="paper.orientation"
                style="width: 312px"
                @change="handleOrientationChange"
              >
                <u-option
                  v-for="option in orientationOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>

          <div class="form-group">
            <label>{{ $t('dialog.setting.htmlAlign') }}：</label>
            <div class="u-inline">
              <u-select
                v-model="paper.htmlReportAlign"
                style="width: 80px"
                @change="handleHtmlAlignChange"
              >
                <u-option
                  v-for="option in htmlAlignOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>

            <span style="margin-left: 35px;">
              <label>{{ $t('dialog.setting.refreshSecond') }}：</label>
            </span>
            <div class="u-inline">
              <u-input-number
                v-model="paper.htmlIntervalRefreshValue"
                :placeholder="$t('dialog.setting.tip1')"
                :title="$t('dialog.setting.tip2')"
                :min="0"
              />
            </div>
          </div>

          <div class="form-group">
            <label>{{ $t('dialog.setting.bg') }}：</label>
            <div class="u-inline">
              <u-input
                v-model="paper.bgImage"
                style="width: 470px;"
                :placeholder="$t('dialog.setting.bgTip')"
                @change="updateBackgroundImage"
              />
            </div>
          </div>
        </div>

        <!-- 页眉页脚设置 -->
        <div v-show="activeTab === 'headerFooter'">
          <div class="form-group" style="margin-top: 10px;color: #999999;">
            {{ $t('dialog.setting.hfdesc') }}
          </div>

          <div>
            <label>{{ $t('dialog.setting.header') }}：</label>
            <u-button
                style="margin-left: 10px;"
                @click="openHeaderFontDialog">
              {{ $t('dialog.setting.fontStyleSetting') }}
            </u-button>

            <span style="margin-left:10px">
              <span>{{ $t('dialog.setting.headerMargin') }}：</span>
            </span>
            <div class="u-inline">
              <u-input-number
                v-model="headerMargin"
                @change="updateHeaderMargin"
              />
            </div>
          </div>

          <div class="form-group">
            <span style="vertical-align: top">{{ $t('dialog.setting.hfLeft') }}：</span>
            <textarea
              ref="leftHeader"
              v-model="header.left"
              class="form-control"
              style="font-size:10pt;font-family:'宋体';padding: 5px;display: inline-block;width: 140px;height: 80px;margin-top: 15px"
              @change="validateHeaderFooter"
            ></textarea>

            <span style="margin-left: 15px;vertical-align: top">{{ $t('dialog.setting.hfCenter') }}：</span>
            <textarea
              ref="centerHeader"
              v-model="header.center"
              class="form-control"
              style="padding: 5px;font-size:10pt;font-family:'宋体';display: inline-block;width: 140px;height: 80px;margin-top: 15px"
              @change="validateHeaderFooter"
            ></textarea>

            <span style="margin-left: 15px;vertical-align: top">{{ $t('dialog.setting.hfRight') }}：</span>
            <textarea
              ref="rightHeader"
              v-model="header.right"
              class="form-control"
              style="padding: 5px;font-size:10pt;font-family:'宋体';display: inline-block;width: 140px;height: 80px;margin-top: 15px"
              @change="validateHeaderFooter"
            ></textarea>
          </div>

          <div style="margin-top: 10px;">
            <label>{{ $t('dialog.setting.footer') }}：</label>
            <u-button
                style="margin-left: 10px;"
                @click="openFooterFontDialog">
              {{ $t('dialog.setting.fontStyleSetting') }}
            </u-button>

            <span style="margin-left:10px">
              <span>{{ $t('dialog.setting.footerMargin') }}：</span>
            </span>
            <div class="u-inline">
              <u-input-number
                v-model="footerMargin"
                @change="updateFooterMargin"
              />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 5px">
            <span style="vertical-align: top">{{ $t('dialog.setting.hfLeft') }}：</span>
            <textarea
              ref="leftFooter"
              v-model="footer.left"
              class="form-control"
              style="padding: 5px;font-size:10pt;font-family:'宋体';display: inline-block;width: 140px;height: 80px;margin-top: 15px"
              @change="validateHeaderFooter"
            ></textarea>

            <span style="margin-left: 15px;vertical-align: top">{{ $t('dialog.setting.hfCenter') }}：</span>
            <textarea
              ref="centerFooter"
              v-model="footer.center"
              class="form-control"
              style="padding: 5px;font-size:10pt;font-family:'宋体';display: inline-block;width: 140px;height: 80px;margin-top: 15px"
              @change="validateHeaderFooter"
            ></textarea>

            <span style="margin-left: 15px;vertical-align: top">{{ $t('dialog.setting.hfRight') }}：</span>
            <textarea
              ref="rightFooter"
              v-model="footer.right"
              class="form-control"
              style="padding: 5px;font-size:10pt;font-family:'宋体';display: inline-block;width: 140px;height: 80px;margin-top: 15px"
              @change="validateHeaderFooter"
            ></textarea>
          </div>
        </div>

        <!-- 分页设置 -->
        <div v-show="activeTab === 'paging'">
          <div class="form-group" style="margin-top: 10px;height: 12px;">
            <label>{{ $t('dialog.setting.pagingType') }}：</label>
            <div class="u-inline">
              <u-radio-group
                  v-model="paper.pagingMode"
                  @change="handlePagingModeChange"
              >
                <u-radio
                    v-for="option in pagingModeOptions"
                    :key="option.value"
                    :label="option.value"
                >
                  {{ option.label }}
                </u-radio>
              </u-radio-group>
            </div>

            <span v-show="paper.pagingMode === 'fixrows'" style="margin-left: 15px">
              <span>{{ $t('dialog.setting.rowsPerPage') }}：</span>
            </span>
            <div class="u-inline" v-show="paper.pagingMode === 'fixrows'">
              <u-input-number
                  v-model="paper.fixRows"
                  :min="1"
              />
            </div>
          </div>
        </div>

        <!-- 列设置 -->
        <div v-show="activeTab === 'column'">
          <div style="margin-top: 12px;color:#999999;font-size: 12px">{{ $t('dialog.setting.colDesc') }}</div>

          <div class="form-group" style="margin-top: 8px;">
            <label>{{ $t('dialog.setting.column') }}：</label>
            <div class="u-inline">
              <u-radio-group
                  v-model="paper.columnEnabled"
                  @change="handleColumnEnabledChange"
              >
                <u-radio
                    v-for="option in columnEnabledOptions"
                    :key="option.value"
                    :label="option.value"
                >
                  {{ option.label }}
                </u-radio>
              </u-radio-group>
            </div>
          </div>

          <div class="form-group" style="margin-top: 1px;display: inline-block">
            <label>{{ $t('dialog.setting.columnCount') }}：</label>
            <div class="u-inline">
              <u-select
                v-model="paper.columnCount"
                :disabled="!paper.columnEnabled"
                @change="handleColumnCountChange"
              >
                <u-option
                  v-for="option in columnCountOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>

            <span style="margin-left: 20px">
              <label>{{ $t('dialog.setting.columnMargin') }}：</label>
            </span>
            <div class="u-inline">
              <u-input-number
                v-model="columnMargin"
                :disabled="!paper.columnEnabled"
                @change="updateColumnMargin"
              />
            </div>
          </div>
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

    <div slot="footer" style="text-align: right">
      <u-button @click="handleClose" type="info" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
      <u-button @click="handleOk">{{ $t('dialog.common.ok') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import { showAlert } from '@/utils/comnon.js';
import { pointToMM, mmToPoint, buildPageSizeList, setDirty } from '@/utils/table.js';
import { deepCopy } from '@/components/utils/index.js';
import FontSettingDialog from '@/views/report/designer/tool-bar/settings-tool/font-setting-dialog/index.vue';
import UDialog from '@/components/dialog/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import UButton from "@/components/button/index.vue";
import UInputNumber from "@/components/input-number/index.vue";
import UInput from "@/components/input/index.vue";
import UTabs from "@/components/tabs/index.vue";
import UTabPane from "@/components/tabs/pane.vue";
import { mapGetters } from 'vuex';
import { updateReportDef } from '@/utils/contextActions.js';

export default {
  name: 'SettingsDialog',
  components: {
    UButton,
    UDialog,
    FontSettingDialog,
    USelect,
    UOption,
    URadioGroup,
    URadio,
    UInputNumber,
    UInput,
    UTabs,
    UTabPane
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      dialogVisible: false,
      activeTab: 'page',
      paperSizeList: buildPageSizeList(),
      initializing: false, // 添加初始化标志
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
      footerFontDialogVisible: false
    };
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    },
    reportDef() {
      return this.context ? this.context.reportDef : null;
    },
    // 纸张类型选项
    paperTypeOptions() {
      const options = [];
      for (const [key, value] of Object.entries(this.paperSizeList)) {
        options.push({
          value: key,
          label: key
        });
      }
      options.push({
        value: 'CUSTOM',
        label: this.$t('dialog.setting.custom')
      });
      return options;
    },
    // 纸张方向选项
    orientationOptions() {
      return [
        { value: 'portrait', label: this.$t('dialog.setting.portrait') },
        { value: 'landscape', label: this.$t('dialog.setting.landscape') }
      ];
    },
    // HTML对齐方式选项
    htmlAlignOptions() {
      return [
        { value: 'left', label: this.$t('dialog.setting.left') },
        { value: 'center', label: this.$t('dialog.setting.center') },
        { value: 'right', label: this.$t('dialog.setting.right') }
      ];
    },
    // 列数选项
    columnCountOptions() {
      const options = [];
      for (let i = 1; i <= 9; i++) {
        options.push({
          value: i + 1,
          label: `${i + 1}${this.$t('dialog.setting.columnUnit')}`
        });
      }
      return options;
    },
    // 分页模式选项
    pagingModeOptions() {
      return [
        { value: 'fitpage', label: this.$t('dialog.setting.auto') },
        { value: 'fixrows', label: this.$t('dialog.setting.fixRows') }
      ];
    },
    // 列启用状态选项
    columnEnabledOptions() {
      return [
        { value: false, label: this.$t('dialog.setting.disable') },
        { value: true, label: this.$t('dialog.setting.enable') }
      ];
    },
    pageWidth: {
      get() {
        return pointToMM(this.paper.width);
      },
      set(value) {
        if (!isNaN(value)) {
          this.paper.width = mmToPoint(value);
        }
      }
    },
    pageHeight: {
      get() {
        return pointToMM(this.paper.height);
      },
      set(value) {
        if (!isNaN(value)) {
          this.paper.height = mmToPoint(value);
        }
      }
    },
    leftMargin: {
      get() {
        return pointToMM(this.paper.leftMargin);
      },
      set(value) {
        if (!isNaN(value)) {
          this.paper.leftMargin = mmToPoint(value);
        }
      }
    },
    rightMargin: {
      get() {
        return pointToMM(this.paper.rightMargin);
      },
      set(value) {
        if (!isNaN(value)) {
          this.paper.rightMargin = mmToPoint(value);
        }
      }
    },
    topMargin: {
      get() {
        return pointToMM(this.paper.topMargin);
      },
      set(value) {
        if (!isNaN(value)) {
          this.paper.topMargin = mmToPoint(value);
        }
      }
    },
    bottomMargin: {
      get() {
        return pointToMM(this.paper.bottomMargin);
      },
      set(value) {
        if (!isNaN(value)) {
          this.paper.bottomMargin = mmToPoint(value);
        }
      }
    },
    headerMargin: {
      get() {
        return pointToMM(this.header.margin);
      },
      set(value) {
        if (!isNaN(value)) {
          this.header.margin = mmToPoint(value);
        }
      }
    },
    footerMargin: {
      get() {
        return pointToMM(this.footer.margin);
      },
      set(value) {
        if (!isNaN(value)) {
          this.footer.margin = mmToPoint(value);
        }
      }
    },
    columnMargin: {
      get() {
        return pointToMM(this.paper.columnMargin);
      },
      set(value) {
        if (!isNaN(value)) {
          this.paper.columnMargin = mmToPoint(value);
        }
      }
    }
  },
  created() {
    // 初始化dialogVisible
    this.dialogVisible = this.visible;

    if (this.visible && this.context) {
      this.initializeData();
    }
  },
  watch: {
    visible(newVal) {
      this.dialogVisible = newVal;
      if (newVal && this.context) {
        this.initializeData();
      }
    },
    context(newVal) {
      if (newVal) {
        this.initializeData();
      }
    },
    'paper.paperType'(newVal) {
      if (newVal !== 'CUSTOM') {
        const pageSize = this.paperSizeList[newVal];
        this.paper.width = mmToPoint(pageSize.width);
        this.paper.height = mmToPoint(pageSize.height);
        if (this.context && this.context.printLine) {
          this.context.printLine.refresh();
        }
      }
      setDirty();
    },
    'paper.orientation'() {
      if (this.context && this.context.printLine) {
        this.context.printLine.refresh();
      }
      setDirty();
    },
    'paper.htmlReportAlign'() {
      setDirty();
    },
    'paper.htmlIntervalRefreshValue'(newVal) {
      if (isNaN(newVal) || newVal < 0) {
        showAlert(this.$t('dialog.setting.secondTip'));
        return;
      }
      setDirty();
    },
    'paper.pagingMode'() {
      setDirty();
    },
    'paper.fixRows'(newVal) {
      if (this.initializing) {
        return;
      }

      if (this.paper.pagingMode === 'fixrows' && newVal < 1) {
        showAlert(this.$t('dialog.setting.fixRowsTip'));
        return;
      }
      setDirty();
    },
    'paper.columnEnabled'() {
      setDirty();
    },
    'paper.columnCount'() {
      setDirty();
    }
  },
  mounted() {

  },
  beforeDestroy() {

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

      // 设置初始化标志
      this.initializing = true;

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

      // 设置编辑器样式
      this.$nextTick(() => {
        this.setEditorStyles();
        // 初始化完成后，清除初始化标志
        this.initializing = false;
      });
    },
    handleClose() {
      this.dialogVisible = false;
      this.$emit('close');
    },
    handleOk() {
      // 检查 reportDef 是否存在
      if (!this.context || !this.context.reportDef) {
        this.dialogVisible = false;
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

      this.dialogVisible = false;
      this.$emit('ok');
    },
    updatePaperSize() {
      if (this.paper.paperType !== 'CUSTOM') {
        return;
      }

      if (this.context && this.context.printLine) {
        this.context.printLine.refresh();
      }
      setDirty();
    },
    updateMargins() {
      if (this.context && this.context.printLine) {
        this.context.printLine.refresh();
      }
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
    setEditorStyles() {
      // 设置页眉编辑器样式
      const headerEditors = [
        this.$refs.leftHeader,
        this.$refs.centerHeader,
        this.$refs.rightHeader
      ];

      headerEditors.forEach(editor => {
        if (editor) {
          this.applyEditorStyle(editor, this.header);
        }
      });

      // 设置页脚编辑器样式
      const footerEditors = [
        this.$refs.leftFooter,
        this.$refs.centerFooter,
        this.$refs.rightFooter
      ];

      footerEditors.forEach(editor => {
        if (editor) {
          this.applyEditorStyle(editor, this.footer);
        }
      });
    },
    applyEditorStyle(editor, style) {
      editor.style.fontFamily = style.fontFamily;
      editor.style.fontSize = style.fontSize + 'pt';
      editor.style.color = `rgb(${style.forecolor})`;
      editor.style.fontWeight = style.bold && style.bold !== 'false' ? 'bold' : 'normal';
      editor.style.fontStyle = style.italic && style.italic !== 'false' ? 'italic' : 'normal';
      editor.style.textDecoration = style.underline && style.underline !== 'false' ? 'underline' : 'none';
    },
    handlePaperTypeChange() {
      setDirty();
    },
    handleOrientationChange() {
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
.tab-content {
  padding: 10px 0;
}
</style>
