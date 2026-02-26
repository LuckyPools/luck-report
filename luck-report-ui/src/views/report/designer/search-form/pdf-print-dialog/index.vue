<template>
  <UDialog
    :title="$t('preview.pdfPrint.title')"
    width="1250px"
    :visible="visible"
    @close="handleClose"
    class="pdf-print-dialog"
  >
    <div class="pdf-print-body">
      <fieldset class="pdf-print-toolbar">
        <legend>{{ $t('preview.pdfPrint.setup') }}</legend>

        <!-- 纸张类型 -->
        <u-row>
            <u-col :span="6">
                <label>{{ $t('preview.pdfPrint.paper') }}：</label>
                <div class="u-inline">
                    <u-select
                            v-model="paper.paperType"
                            class="page-select"
                            @change="handlePageTypeChange"
                    >
                        <u-option
                                v-for="(option, index) in paperTypeOptions"
                                :key="index"
                                :value="option.value"
                                :label="option.label"
                        >
                            {{ option.label }}
                        </u-option>
                    </u-select>
                </div>
            </u-col>

            <u-col :span="6">
                <label>{{ $t('preview.pdfPrint.width') }}：</label>
                <div class="u-inline">
                    <u-input-number
                            v-model="pageWidthMM"
                            :disabled="paper.paperType !== 'CUSTOM'"
                            @change="handlePageWidthChange"
                    />
                </div>
            </u-col>

            <u-col :span="6">
                <label>{{ $t('preview.pdfPrint.height') }}：</label>
                <div class="u-inline">
                    <u-input-number
                            v-model="pageHeightMM"
                            :disabled="paper.paperType !== 'CUSTOM'"
                            @change="handlePageHeightChange"
                    />
                </div>
            </u-col>

            <u-col :span="6">
                <label>{{ $t('preview.pdfPrint.orientation') }}：</label>
                <div class="u-inline">
                    <u-select v-model="paper.orientation" class="orientation-select">
                        <u-option
                                v-for="(option, index) in orientationOptions"
                                :key="index"
                                :value="option.value"
                                :label="option.label"
                        >
                            {{ option.label }}
                        </u-option>
                    </u-select>
                </div>
            </u-col>
        </u-row>

        <u-row style="margin-top: 5px;">
            <u-col :span="6">
                <label>{{ $t('preview.pdfPrint.leftMargin') }}：</label>
                <div class="u-inline">
                    <u-input-number
                            v-model="leftMarginMM"
                            @change="handleLeftMarginChange"
                    />
                </div>
            </u-col>

            <u-col :span="6">
                <label>{{ $t('preview.pdfPrint.rightMargin') }}：</label>
                <div class="u-inline">
                    <u-input-number
                            v-model="rightMarginMM"
                            @change="handleRightMarginChange"
                    />
                </div>
            </u-col>

            <u-col :span="6">
                <label>{{ $t('preview.pdfPrint.topMargin') }}：</label>
                <div class="u-inline">
                    <u-input-number
                            v-model="topMarginMM"
                            @change="handleTopMarginChange"
                    />
                </div>
            </u-col>

            <u-col :span="6">
                <label>{{ $t('preview.pdfPrint.bottomMargin') }}：</label>
                <div class="u-inline">
                    <u-input-number
                            v-model="bottomMarginMM"
                            @change="handleBottomMarginChange"
                    />
                </div>
            </u-col>
        </u-row>

        <u-row style="margin-top: 5px;">
            <u-col :span="6" :offset="18">
                <!-- 按钮 -->
                <u-button type="primary" style="margin-left:5px" @click="handleApply">
                    {{ $t('preview.pdfPrint.apply') }}
                </u-button>

                <u-button type="error" style="margin-left:5px" @click="handlePrint">
                    {{ $t('preview.pdfPrint.print') }}
                </u-button>
            </u-col>
        </u-row>
      </fieldset>

      <!-- PDF预览区域 -->
      <div class="pdf-preview-container">
        <iframe
          ref="pdfFrame"
          name="_iframe_for_pdf_print"
          class="pdf-preview-frame"
          frameborder="0"
          @load="hideLoading"
        ></iframe>
      </div>
    </div>
  </UDialog>
</template>

<script>
import {buildPageSizeList, mmToPoint, pointToMM} from '@/utils/table.js';
import showLoading from '@/components/loading/instance.js';
import {showAlert} from '@/utils/comnon.js';
import UDialog from '@/components/dialog/index.vue';
import UButton from "@/components/button/index.vue";
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UInputNumber from '@/components/input-number/index.vue';
import {getPdfPreviewUrl, pdfNewPaging} from '@/api/preview';
import UCol from "@/components/col/index.vue";
import URow from "@/components/row/index.vue";

export default {
  name: 'PDFPrintDialog',
  components: {
      URow,
      UCol,
    UDialog,
    UButton,
    USelect,
    UOption,
    UInputNumber
  },
  data() {
    return {
      visible: false,
      paper: {
        paperType: 'A4',
        width: 0,
        height: 0,
        orientation: 'portrait',
        leftMargin: 0,
        rightMargin: 0,
        topMargin: 0,
        bottomMargin: 0
      },
      paperSizeList: buildPageSizeList(),
      refreshIndex: 0,
      context: null
    };
  },
  computed: {
    paperTypeOptions() {
      const options = [];

      // 添加 A 系列纸张
      for (let i = 0; i <= 10; i++) {
        options.push({
          value: `A${i}`,
          label: `A${i}`
        });
      }

      // 添加 B 系列纸张
      for (let i = 0; i <= 10; i++) {
        options.push({
          value: `B${i}`,
          label: `B${i}`
        });
      }

      // 添加自定义选项
      options.push({
        value: 'CUSTOM',
        label: this.$t('preview.pdfPrint.custom')
      });

      return options;
    },
    orientationOptions() {
      return [
        {
          value: 'portrait',
          label: this.$t('preview.pdfPrint.portrait')
        },
        {
          value: 'landscape',
          label: this.$t('preview.pdfPrint.landscape')
        }
      ];
    },
    pageWidthMM: {
      get() {
        return pointToMM(this.paper.width);
      },
      set(value) {
        if (value && !isNaN(value)) {
          this.paper.width = mmToPoint(value);
        }
      }
    },
    pageHeightMM: {
      get() {
        return pointToMM(this.paper.height);
      },
      set(value) {
        if (value && !isNaN(value)) {
          this.paper.height = mmToPoint(value);
        }
      }
    },
    leftMarginMM: {
      get() {
        return pointToMM(this.paper.leftMargin);
      },
      set(value) {
        if (value && !isNaN(value)) {
          this.paper.leftMargin = mmToPoint(value);
        }
      }
    },
    rightMarginMM: {
      get() {
        return pointToMM(this.paper.rightMargin);
      },
      set(value) {
        if (value && !isNaN(value)) {
          this.paper.rightMargin = mmToPoint(value);
        }
      }
    },
    topMarginMM: {
      get() {
        return pointToMM(this.paper.topMargin);
      },
      set(value) {
        if (value && !isNaN(value)) {
          this.paper.topMargin = mmToPoint(value);
        }
      }
    },
    bottomMarginMM: {
      get() {
        return pointToMM(this.paper.bottomMargin);
      },
      set(value) {
        if (value && !isNaN(value)) {
          this.paper.bottomMargin = mmToPoint(value);
        }
      }
    },
    urlParameters() {
      return window.location.search;
    }
  },
  methods: {
    show(paper, context) {
      this.visible = true;

      // 确保每个属性都是响应式的
      if (paper) {
        this.$set(this.paper, 'paperType', paper.paperType || 'A4');
        this.$set(this.paper, 'width', paper.width || 0);
        this.$set(this.paper, 'height', paper.height || 0);
        this.$set(this.paper, 'orientation', paper.orientation || 'portrait');
        this.$set(this.paper, 'leftMargin', paper.leftMargin || 0);
        this.$set(this.paper, 'rightMargin', paper.rightMargin || 0);
        this.$set(this.paper, 'topMargin', paper.topMargin || 0);
        this.$set(this.paper, 'bottomMargin', paper.bottomMargin || 0);
      }

      this.context = context;

      this.$nextTick(() => {
        this.initIFrame();
        this.handleApply();
      });
    },

    handleClose() {
      this.visible = false;
    },

    handlePageTypeChange(value) {
      if (value === 'CUSTOM') {
        // 自定义尺寸，允许编辑宽高
        return;
      }

      // 预设尺寸，更新宽高
      const pageSize = this.paperSizeList[value];
      this.paper.width = mmToPoint(pageSize.width);
      this.paper.height = mmToPoint(pageSize.height);
    },

    handlePageWidthChange(value) {
      if (!value || isNaN(value)) {
        showAlert(this.$t('preview.pdfPrint.numberTip'));
        return;
      }
      this.paper.width = mmToPoint(value);
      if (this.context && this.context.printLine) {
        this.context.printLine.refresh();
      }
    },

    handlePageHeightChange(value) {
      if (!value || isNaN(value)) {
        showAlert(this.$t('preview.pdfPrint.numberTip'));
        return;
      }
      this.paper.height = mmToPoint(value);
    },

    handleLeftMarginChange(value) {
      if (!value || isNaN(value)) {
        showAlert(this.$t('preview.pdfPrint.numberTip'));
        return;
      }
      this.paper.leftMargin = mmToPoint(value);
      if (this.context && this.context.printLine) {
        this.context.printLine.refresh();
      }
    },

    handleRightMarginChange(value) {
      if (!value || isNaN(value)) {
        showAlert(this.$t('preview.pdfPrint.numberTip'));
        return;
      }
      this.paper.rightMargin = mmToPoint(value);
      if (this.context && this.context.printLine) {
        this.context.printLine.refresh();
      }
    },

    handleTopMarginChange(value) {
      if (!value || isNaN(value)) {
        showAlert(this.$t('preview.pdfPrint.numberTip'));
        return;
      }
      this.paper.topMargin = mmToPoint(value);
    },

    handleBottomMarginChange(value) {
      if (!value || isNaN(value)) {
        showAlert(this.$t('preview.pdfPrint.numberTip'));
        return;
      }
      this.paper.bottomMargin = mmToPoint(value);
    },

    async handleApply() {
      const loadingInstance = showLoading({
        text: '加载中...',
      });

      try {
        const currentPaper = {
          paperType: this.paper.paperType,
          width: this.paper.width,
          height: this.paper.height,
          orientation: this.paper.orientation,
          leftMargin: this.paper.leftMargin,
          rightMargin: this.paper.rightMargin,
          topMargin: this.paper.topMargin,
          bottomMargin: this.paper.bottomMargin
        };

        const formData = new FormData();
        formData.append('_paper', JSON.stringify(currentPaper));
        const urlParams = new URLSearchParams(this.urlParameters);
        for (const [key, value] of urlParams) {
          formData.append(key, value);
        }

        await pdfNewPaging(formData);
        loadingInstance.close();
        
        const paramObj = {};
        for (const [key, value] of urlParams) {
          paramObj[key] = value;
        }
        
        this.$refs.pdfFrame.src = getPdfPreviewUrl(paramObj, this.refreshIndex++);
      } catch (error) {
        loadingInstance.close();
        console.error('Error:', error);
        showAlert(this.$t('preview.pdfPrint.fail'));
      }
    },

    handlePrint() {
      try {
        window.frames['_iframe_for_pdf_print'].window.print();
      } catch (e) {
        console.error('Print error:', e);
        showAlert(this.$t('preview.pdfPrint.printError'));
      }
    },

    initIFrame() {
      if (!this.$refs.pdfFrame) {
        return;
      }

      const urlParams = new URLSearchParams(this.urlParameters);
      const paramObj = {};
      for (const [key, value] of urlParams) {
        paramObj[key] = value;
      }

      this.$refs.pdfFrame.src = getPdfPreviewUrl(paramObj, 1);
      // 检测浏览器是否为IE
      const msie = window.navigator.appName.indexOf("Internet Explorer");
      const ie11 = !!window.MSInputMethodContext && !!document.documentMode;

      if (msie === -1 && !ie11) {
        this.loadingInstance = showLoading({
          text: '加载中...',
        });
      }
    },

    hideLoading() {
      if (this.loadingInstance) {
        this.loadingInstance.close();
        this.loadingInstance = null;
      }
    }
  }
};
</script>

<style scoped>
.pdf-print-dialog .pdf-print-body {
  padding-top: 5px;
  height: 600px;
  overflow-y: scroll;
}

.pdf-print-toolbar {
  width: 100%;
  height: 140px;
  font-size: 12px;
  border: solid 1px #ddd;
  border-radius: 5px;
  padding: 1px 8px;
  margin-bottom: 5px;
}

.pdf-print-toolbar legend {
  font-size: 12px;
  width: 60px;
  border-bottom: none;
  margin-bottom: 0;
}

.col-group {
  display: inline-block;
  margin-left: 6px;
  margin-bottom: 15px;
}

.col-group label {
  margin-right: 5px;
}

.margin-group {
  display: inline-block;
}

.pdf-preview-container {
  width: 100%;
  height: calc(100vh - 200px);
  min-height: 400px;
}

.pdf-preview-frame {
  width: 100%;
  height: 100%;
  border: solid 1px #c2c2c2;
}
</style>


