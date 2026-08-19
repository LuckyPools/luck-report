<template>
  <u-form :label-width="100" label-position="left">
    <u-row>
      <u-col :span="12">
        <u-form-item class="property-label" :label="$t('dialog.setting.paperType')">
          <u-select
            v-model="localPaper.paperType"
            style="width: 140px"
            @change="handlePaperTypeChange"
          >
            <u-option
              v-for="option in paperTypeOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </u-select>
        </u-form-item>
      </u-col>
      <u-col :span="12">
        <u-form-item class="property-label" :label="$t('dialog.setting.orientation')">
          <u-select
              v-model="localPaper.orientation"
              @change="handleOrientationChange"
              style="width: 140px"
          >
            <u-option
                v-for="option in orientationOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
            />
          </u-select>
        </u-form-item>
      </u-col>
    </u-row>

    <u-row style="margin-top: 5px;">
      <u-col :span="12">
        <u-form-item class="property-label" :label="$t('dialog.setting.paperWidth')">
          <u-input-number
              v-model="localPageWidth"
              :disabled="localPaper.paperType !== 'CUSTOM'"
              @change="handlePageWidthChange"
          />
        </u-form-item>
      </u-col>
      <u-col :span="12">
        <u-form-item class="property-label" :label="$t('dialog.setting.paperHeight')">
          <u-input-number
              v-model="localPageHeight"
              :disabled="localPaper.paperType !== 'CUSTOM'"
              @change="handlePageHeightChange"
          />
        </u-form-item>
      </u-col>
    </u-row>

    <u-row style="margin-top: 5px;">
      <u-col :span="12">
        <u-form-item class="property-label" :label="$t('dialog.setting.leftMargin')">
          <u-input-number
            v-model="localLeftMargin"
            @change="handleLeftMarginChange"
          />
        </u-form-item>
      </u-col>
      <u-col :span="12">
        <u-form-item class="property-label" :label="$t('dialog.setting.rightMargin')">
          <u-input-number
            v-model="localRightMargin"
            @change="handleRightMarginChange"
          />
        </u-form-item>
      </u-col>
    </u-row>

    <u-row style="margin-top: 5px;">
      <u-col :span="12">
        <u-form-item class="property-label" :label="$t('dialog.setting.topMargin')">
          <u-input-number
            v-model="localTopMargin"
            @change="handleTopMarginChange"
          />
        </u-form-item>
      </u-col>
      <u-col :span="12">
        <u-form-item class="property-label" :label="$t('dialog.setting.bottomMargin')">
          <u-input-number
            v-model="localBottomMargin"
            @change="handleBottomMarginChange"
          />
        </u-form-item>
      </u-col>
    </u-row>

    <u-row style="margin-top: 5px;">
      <u-col :span="12">
        <u-form-item class="property-label" :label="$t('dialog.setting.htmlAlign')">
          <u-select
            v-model="localPaper.htmlReportAlign"
            style="width: 140px"
            @change="handleHtmlAlignChange"
          >
            <u-option
              v-for="option in htmlAlignOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </u-select>
        </u-form-item>
      </u-col>
      <u-col :span="12">
        <u-form-item class="property-label" :label="$t('dialog.setting.refreshSecond')">
          <u-input-number
            v-model="localPaper.htmlIntervalRefreshValue"
            :placeholder="$t('dialog.setting.tip1')"
            :title="$t('dialog.setting.tip2')"
            :min="0"
            @change="handleHtmlIntervalRefreshValueChange"
          />
        </u-form-item>
      </u-col>
    </u-row>

    <u-row style="margin-top: 5px;">
      <u-col :span="24">
        <u-form-item class="property-label" :label="$t('dialog.setting.bg')">
          <div style="display: flex; gap: 8px; width: 470px;">
            <u-select
              v-model="bgImageSource"
              style="width: 100px; flex-shrink: 0;"
              @change="handleBgImageSourceChange"
            >
              <u-option value="url" :label="'URL'" />
              <u-option value="base64" :label="'Base64'" />
            </u-select>
            <u-input
              v-model="localPaper.bgImage"
              :placeholder="bgImageSource === 'url' ? $t('dialog.setting.bgTip') : $t('dialog.setting.bgBase64Tip')"
              @blur="handleBgImageChange"
              style="flex: 1;"
            />
            <u-button
              v-if="bgImageSource === 'base64'"
              type="info"
              icon="icon-upload"
              @click="handleUploadBgImage"
            >
              {{ $t('dialog.setting.upload') }}
            </u-button>
          </div>
          <input ref="bgFileInputRef" type="file" accept="image/png,image/jpeg,image/gif,image/webp"
            style="display: none;" @change="onBgFileSelected" />
        </u-form-item>
      </u-col>
    </u-row>
  </u-form>
</template>

<script>
import { pointToMM, mmToPoint, buildPageSizeList } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UInputNumber from '@/components/input-number/index.vue';
import UInput from '@/components/input/index.vue';
import UButton from '@/components/button/index.vue';
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import URow from '@/components/row/index.vue';
import UCol from '@/components/col/index.vue';

export default {
  name: 'PageSettings',
  components: {
    USelect,
    UOption,
    UInputNumber,
    UInput,
    UButton,
    UForm,
    UFormItem,
    URow,
    UCol
  },
  props: {
    paper: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      localPaper: { ...this.paper },
      bgImageSource: (this.paper.bgImage && this.paper.bgImage.startsWith('data:')) ? 'base64' : 'url',
      paperSizeList: buildPageSizeList(),
      localPageWidth: pointToMM(this.paper.width),
      localPageHeight: pointToMM(this.paper.height),
      localLeftMargin: pointToMM(this.paper.leftMargin),
      localRightMargin: pointToMM(this.paper.rightMargin),
      localTopMargin: pointToMM(this.paper.topMargin),
      localBottomMargin: pointToMM(this.paper.bottomMargin)
    };
  },
  computed: {
    paperTypeOptions() {
      const options = [];
      for (const [key] of Object.entries(this.paperSizeList)) {
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
    orientationOptions() {
      return [
        { value: 'portrait', label: this.$t('dialog.setting.portrait') },
        { value: 'landscape', label: this.$t('dialog.setting.landscape') }
      ];
    },
    htmlAlignOptions() {
      return [
        { value: 'left', label: this.$t('dialog.setting.left') },
        { value: 'center', label: this.$t('dialog.setting.center') },
        { value: 'right', label: this.$t('dialog.setting.right') }
      ];
    }
  },
  watch: {
    paper: {
      handler(newVal) {
        const bgImageChanged = newVal.bgImage !== this.localPaper.bgImage;
        this.localPaper = { ...newVal };
        this.localPageWidth = pointToMM(newVal.width);
        this.localPageHeight = pointToMM(newVal.height);
        this.localLeftMargin = pointToMM(newVal.leftMargin);
        this.localRightMargin = pointToMM(newVal.rightMargin);
        this.localTopMargin = pointToMM(newVal.topMargin);
        this.localBottomMargin = pointToMM(newVal.bottomMargin);
        if (bgImageChanged) {
          if (newVal.bgImage && newVal.bgImage.startsWith('data:')) {
            this.bgImageSource = 'base64';
          } else {
            this.bgImageSource = 'url';
          }
        }
      },
      deep: true
    }
  },
  methods: {
    handlePaperTypeChange() {
      this.$emit('update:paper', { ...this.localPaper });
      this.$emit('paper-type-change', this.localPaper.paperType);
    },
    handlePageWidthChange() {
      if (!isNaN(this.localPageWidth)) {
        this.$emit('update:paper', { ...this.localPaper, width: mmToPoint(this.localPageWidth) });
        this.$emit('paper-size-change');
      }
    },
    handlePageHeightChange() {
      if (!isNaN(this.localPageHeight)) {
        this.$emit('update:paper', { ...this.localPaper, height: mmToPoint(this.localPageHeight) });
        this.$emit('paper-size-change');
      }
    },
    handleLeftMarginChange() {
      if (!isNaN(this.localLeftMargin)) {
        this.$emit('update:paper', { ...this.localPaper, leftMargin: mmToPoint(this.localLeftMargin) });
        this.$emit('margins-change');
      }
    },
    handleRightMarginChange() {
      if (!isNaN(this.localRightMargin)) {
        this.$emit('update:paper', { ...this.localPaper, rightMargin: mmToPoint(this.localRightMargin) });
        this.$emit('margins-change');
      }
    },
    handleTopMarginChange() {
      if (!isNaN(this.localTopMargin)) {
        this.$emit('update:paper', { ...this.localPaper, topMargin: mmToPoint(this.localTopMargin) });
        this.$emit('margins-change');
      }
    },
    handleBottomMarginChange() {
      if (!isNaN(this.localBottomMargin)) {
        this.$emit('update:paper', { ...this.localPaper, bottomMargin: mmToPoint(this.localBottomMargin) });
        this.$emit('margins-change');
      }
    },
    handleOrientationChange() {
      this.$emit('update:paper', { ...this.localPaper });
      this.$emit('orientation-change');
    },
    handleHtmlAlignChange() {
      this.$emit('update:paper', { ...this.localPaper });
      this.$emit('html-align-change');
    },
    handleHtmlIntervalRefreshValueChange() {
      this.$emit('update:paper', { ...this.localPaper });
      this.$emit('html-interval-refresh-value-change', this.localPaper.htmlIntervalRefreshValue);
    },
    handleBgImageChange() {
      if (this.localPaper.bgImage) {
        this.localPaper.bgImage = this.localPaper.bgImage.trim();
      }
      this.$emit('update:paper', { ...this.localPaper });
      this.$emit('background-image-change', this.localPaper.bgImage);
    },
    handleBgImageSourceChange() {
      this.localPaper.bgImage = '';
      this.handleBgImageChange();
    },
    handleUploadBgImage() {
      this.$refs.bgFileInputRef.click();
    },
    onBgFileSelected(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB
      if (file.size > MAX_IMAGE_SIZE) {
        showAlert(this.$t('dialog.setting.sizeExceedTip'));
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        // 保留完整的 data:image/xxx;base64,xxx 格式，以 data: 前缀区分
        this.localPaper.bgImage = event.target && event.target.result;
        this.handleBgImageChange();
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  }
};
</script>
