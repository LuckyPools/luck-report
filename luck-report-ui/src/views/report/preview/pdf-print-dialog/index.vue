<template>
  <UDialog
    :title="$t('preview.pdfPrint.title')"
    top="20px"
    width="1250px"
    :visible="visible"
    @close="handleClose"
    class="pdf-print-dialog"
  >
    <div class="pdf-print-body" v-loading="loading">
      <fieldset class="pdf-print-toolbar">
          <legend>{{ $t('preview.pdfPrint.setup') }}</legend>

          <!-- 纸张类型 -->
          <u-form :label-width="100">
            <u-row>
              <u-col :span="6">
                <u-form-item class="property-label" :label="$t('preview.pdfPrint.paper')">
                  <u-select
                    v-model="paper.paperType"
                    class="page-select"
                    style="width: 140px"
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
                </u-form-item>
              </u-col>

              <u-col :span="6">
                <u-form-item class="property-label" :label="$t('preview.pdfPrint.width')">
                  <u-input-number
                    v-model="pageWidthMM"
                    :disabled="paper.paperType !== 'CUSTOM'"
                    @change="handlePageWidthChange"
                  />
                </u-form-item>
              </u-col>

              <u-col :span="6">
                <u-form-item class="property-label" :label="$t('preview.pdfPrint.height')">
                  <u-input-number
                    v-model="pageHeightMM"
                    :disabled="paper.paperType !== 'CUSTOM'"
                    @change="handlePageHeightChange"
                  />
                </u-form-item>
              </u-col>

              <u-col :span="6">
                <u-form-item class="property-label"  :label="$t('preview.pdfPrint.orientation')">
                  <u-select
                      v-model="paper.orientation"
                      class="orientation-select"
                      style="width: 140px">
                    <u-option
                      v-for="(option, index) in orientationOptions"
                      :key="index"
                      :value="option.value"
                      :label="option.label"
                    >
                      {{ option.label }}
                    </u-option>
                  </u-select>
                </u-form-item>
              </u-col>
            </u-row>

          <u-row style="margin-top: 5px;">
              <u-col :span="6">
                <u-form-item class="property-label" :label="$t('preview.pdfPrint.leftMargin')">
                  <u-input-number
                    v-model="leftMarginMM"
                    @change="handleLeftMarginChange"
                  />
                </u-form-item>
              </u-col>

              <u-col :span="6">
                <u-form-item class="property-label" :label="$t('preview.pdfPrint.rightMargin')">
                  <u-input-number
                    v-model="rightMarginMM"
                    @change="handleRightMarginChange"
                  />
                </u-form-item>
              </u-col>

              <u-col :span="6">
                <u-form-item class="property-label" :label="$t('preview.pdfPrint.topMargin')">
                  <u-input-number
                    v-model="topMarginMM"
                    @change="handleTopMarginChange"
                  />
                </u-form-item>
              </u-col>

              <u-col :span="6">
                <u-form-item class="property-label" :label="$t('preview.pdfPrint.bottomMargin')">
                  <u-input-number
                    v-model="bottomMarginMM"
                    @change="handleBottomMarginChange"
                  />
                </u-form-item>
              </u-col>
            </u-row>

            <u-row style="margin-top: 5px;">
              <u-col :span="6" :offset="18">
                <u-form-item class="property-label" >
                  <u-button type="primary" @click="handleApply">
                    {{ $t('preview.pdfPrint.apply') }}
                  </u-button>

                  <u-button type="error" style="margin-left:5px" @click="handlePrint">
                    {{ $t('preview.pdfPrint.print') }}
                  </u-button>
                </u-form-item>
              </u-col>
            </u-row>
          </u-form>
        </fieldset>

        <!-- PDF预览区域 -->
        <div v-show="!loading" class="pdf-preview-container">
          <iframe
            ref="pdfFrame"
            name="_iframe_for_pdf_print"
            class="pdf-preview-frame"
            frameborder="0"
          ></iframe>
        </div>
    </div>
  </UDialog>
</template>

<script>
import {buildPageSizeList, mmToPoint, pointToMM} from '@/utils/table.js';
import {LoadingDirective} from '@/components/loading/instance.js';
import {showAlert} from '@/utils/comnon.js';
import UDialog from '@/components/dialog/index.vue';
import UButton from "@/components/button/index.vue";
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UInputNumber from '@/components/input-number/index.vue';
import {getPdfBlobUrl, loadPagePaper} from '@/api/preview';
import UCol from "@/components/col/index.vue";
import URow from "@/components/row/index.vue";
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import { mapGetters } from 'vuex';
import {getUrlSearchParams} from "@/utils/url";

export default {
  name: 'PDFPrintDialog',
  components: {
      URow,
      UCol,
    UForm,
    UFormItem,
    UDialog,
    UButton,
    USelect,
    UOption,
    UInputNumber
  },
  directives: {
    loading: LoadingDirective
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    parameters: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
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
      pageWidthMM: 0,
      pageHeightMM: 0,
      leftMarginMM: 0,
      rightMarginMM: 0,
      topMarginMM: 0,
      bottomMarginMM: 0,
      paperSizeList: buildPageSizeList(),
      refreshIndex: 0,
      loading: false,
      currentBlobUrl: null
    };
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    },
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
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.loadPaperData();
      }
    }
  },
  methods: {
    /**
     * 加载纸张配置数据
     * 根据传入的 parameters 请求后台获取纸张配置信息
     */
    async loadPaperData() {
      this.loading = true;

      try {
        const formData = new FormData();
        for (const [key, value] of Object.entries(this.parameters)) {
          if (value !== null && value !== undefined) {
            formData.append(key, value);
          }
        }

        const paperData = await loadPagePaper(formData);

        this.$set(this.paper, 'paperType', paperData.paperType || 'A4');
        this.$set(this.paper, 'width', paperData.width || 0);
        this.$set(this.paper, 'height', paperData.height || 0);
        this.$set(this.paper, 'orientation', paperData.orientation || 'portrait');
        this.$set(this.paper, 'leftMargin', paperData.leftMargin || 0);
        this.$set(this.paper, 'rightMargin', paperData.rightMargin || 0);
        this.$set(this.paper, 'topMargin', paperData.topMargin || 0);
        this.$set(this.paper, 'bottomMargin', paperData.bottomMargin || 0);

        this.pageWidthMM = pointToMM(this.paper.width);
        this.pageHeightMM = pointToMM(this.paper.height);
        this.leftMarginMM = pointToMM(this.paper.leftMargin);
        this.rightMarginMM = pointToMM(this.paper.rightMargin);
        this.topMarginMM = pointToMM(this.paper.topMargin);
        this.bottomMarginMM = pointToMM(this.paper.bottomMargin);

        await this.handleApply();
      } catch (error) {
        console.error('获取纸张信息失败:', error);
        if (error.msg) {
          showAlert(this.$t('preview.error.serverError') + this.$t('colon') + error.msg, { useHTMLString: true });
        } else {
          showAlert(this.$t('preview.error.loadPaperFail'));
        }
      } finally {
        this.loading = false;
      }
    },

    /**
     * 关闭对话框，向父组件发送 close 事件
     */
    handleClose() {
      this.revokeBlobUrl();
      this.$emit('close');
    },

    /**
     * 释放当前 Blob URL，避免内存泄漏
     */
    revokeBlobUrl() {
      if (this.currentBlobUrl) {
        URL.revokeObjectURL(this.currentBlobUrl);
        this.currentBlobUrl = null;
      }
    },

    /**
     * 纸张类型变更处理
     * 选择预设纸张时自动更新宽高，选择自定义时允许手动编辑
     * @param {string} value - 纸张类型标识（如 'A4', 'B5', 'CUSTOM'）
     */
    handlePageTypeChange(value) {
      if (value === 'CUSTOM') {
        // 自定义尺寸，允许编辑宽高
        return;
      }

      // 预设尺寸，更新宽高
      const pageSize = this.paperSizeList[value];
      this.paper.width = mmToPoint(pageSize.width);
      this.paper.height = mmToPoint(pageSize.height);
      this.pageWidthMM = pageSize.width;
      this.pageHeightMM = pageSize.height;
    },

    /**
     * 纸张宽度变更处理
     * 将毫米值转换为点值存储，并刷新打印线显示
     * @param {number} value - 纸张宽度（毫米）
     */
    handlePageWidthChange(value) {
      if (!value || isNaN(value)) {
        showAlert(this.$t('preview.pdfPrint.numberTip'));
        return;
      }
      this.paper.width = mmToPoint(value);
    },

    /**
     * 纸张高度变更处理
     * 将毫米值转换为点值存储
     * @param {number} value - 纸张高度（毫米）
     */
    handlePageHeightChange(value) {
      if (!value || isNaN(value)) {
        showAlert(this.$t('preview.pdfPrint.numberTip'));
        return;
      }
      this.paper.height = mmToPoint(value);
    },

    /**
     * 左边距变更处理
     * 将毫米值转换为点值存储，并刷新打印线显示
     * @param {number} value - 左边距（毫米）
     */
    handleLeftMarginChange(value) {
      if (!value || isNaN(value)) {
        showAlert(this.$t('preview.pdfPrint.numberTip'));
        return;
      }
      this.paper.leftMargin = mmToPoint(value);
    },

    /**
     * 右边距变更处理
     * 将毫米值转换为点值存储，并刷新打印线显示
     * @param {number} value - 右边距（毫米）
     */
    handleRightMarginChange(value) {
      if (!value || isNaN(value)) {
        showAlert(this.$t('preview.pdfPrint.numberTip'));
        return;
      }
      this.paper.rightMargin = mmToPoint(value);
    },

    /**
     * 上边距变更处理
     * 将毫米值转换为点值存储
     * @param {number} value - 上边距（毫米）
     */
    handleTopMarginChange(value) {
      if (!value || isNaN(value)) {
        showAlert(this.$t('preview.pdfPrint.numberTip'));
        return;
      }
      this.paper.topMargin = mmToPoint(value);
    },

    /**
     * 下边距变更处理
     * 将毫米值转换为点值存储
     * @param {number} value - 下边距（毫米）
     */
    handleBottomMarginChange(value) {
      if (!value || isNaN(value)) {
        showAlert(this.$t('preview.pdfPrint.numberTip'));
        return;
      }
      this.paper.bottomMargin = mmToPoint(value);
    },

    /**
     * 应用纸张设置并刷新PDF预览
     * 将当前纸张配置通过URL参数传递给服务端，直接生成新的PDF预览
     */
    async handleApply() {
      this.loading = true;

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

        const urlParams = getUrlSearchParams();
        const paramObj = {};
        for (const [key, value] of urlParams) {
          paramObj[key] = value;
        }
        paramObj['_r'] = this.refreshIndex++;

        this.revokeBlobUrl();
        this.currentBlobUrl = await getPdfBlobUrl(paramObj, currentPaper);
        this.$refs.pdfFrame.src = this.currentBlobUrl;

      } catch (error) {

        console.error('Error:', error);
        showAlert(this.$t('preview.pdfPrint.fail'));
      } finally{
        this.loading = false;
      }
    },

    /**
     * 执行PDF打印
     * 调用 PDF 预览 iframe 的浏览器打印功能
     */
    handlePrint() {
      try {
        window.frames['_iframe_for_pdf_print'].window.print();
      } catch (e) {
        console.error('Print error:', e);
        showAlert(this.$t('preview.pdfPrint.printError'));
      }
    }
  }
};
</script>

<style scoped>
.pdf-print-dialog .pdf-print-body {
  padding-top: 5px;
  height: 660px;
  overflow: hidden;
}

.pdf-print-toolbar {
  width: 100%;
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


