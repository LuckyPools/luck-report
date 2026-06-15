<template>
  <a-form :label-col="{ style: { width: '100px' } }">
    <a-row>
      <a-col :span="12">
        <a-form-item class="property-label" :label="t('dialog.setting.paperType')">
          <a-select
            v-model:value="localPaper.paperType"
            style="width: 140px"
            @change="handlePaperTypeChange"
          >
            <a-select-option
              v-for="option in paperTypeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item class="property-label" :label="t('dialog.setting.orientation')">
          <a-select
              v-model:value="localPaper.orientation"
              @change="handleOrientationChange"
              style="width: 140px"
          >
            <a-select-option
                v-for="option in orientationOptions"
                :key="option.value"
                :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
    </a-row>

    <a-row style="margin-top: 5px;">
      <a-col :span="12">
        <a-form-item class="property-label" :label="t('dialog.setting.paperWidth')">
          <a-input-number
              v-model:value="localPageWidth"
              :disabled="localPaper.paperType !== 'CUSTOM'"
              @change="handlePageWidthChange"
          />
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item class="property-label" :label="t('dialog.setting.paperHeight')">
          <a-input-number
              v-model:value="localPageHeight"
              :disabled="localPaper.paperType !== 'CUSTOM'"
              @change="handlePageHeightChange"
          />
        </a-form-item>
      </a-col>
    </a-row>

    <a-row style="margin-top: 5px;">
      <a-col :span="12">
        <a-form-item class="property-label" :label="t('dialog.setting.leftMargin')">
          <a-input-number
            v-model:value="localLeftMargin"
            @change="handleLeftMarginChange"
          />
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item class="property-label" :label="t('dialog.setting.rightMargin')">
          <a-input-number
            v-model:value="localRightMargin"
            @change="handleRightMarginChange"
          />
        </a-form-item>
      </a-col>
    </a-row>

    <a-row style="margin-top: 5px;">
      <a-col :span="12">
        <a-form-item class="property-label" :label="t('dialog.setting.topMargin')">
          <a-input-number
            v-model:value="localTopMargin"
            @change="handleTopMarginChange"
          />
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item class="property-label" :label="t('dialog.setting.bottomMargin')">
          <a-input-number
            v-model:value="localBottomMargin"
            @change="handleBottomMarginChange"
          />
        </a-form-item>
      </a-col>
    </a-row>

    <a-row style="margin-top: 5px;">
      <a-col :span="12">
        <a-form-item class="property-label" :label="t('dialog.setting.htmlAlign')">
          <a-select
            v-model:value="localPaper.htmlReportAlign"
            style="width: 140px"
            @change="handleHtmlAlignChange"
          >
            <a-select-option
              v-for="option in htmlAlignOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item class="property-label" :label="t('dialog.setting.refreshSecond')">
          <a-input-number
            v-model:value="localPaper.htmlIntervalRefreshValue"
            :placeholder="t('dialog.setting.tip1')"
            :title="t('dialog.setting.tip2')"
            :min="0"
            @change="handleHtmlIntervalRefreshValueChange"
          />
        </a-form-item>
      </a-col>
    </a-row>

    <a-row style="margin-top: 5px;">
      <a-col :span="24">
        <a-form-item class="property-label" :label="t('dialog.setting.bg')">
          <a-input
            v-model:value="localPaper.bgImage"
            style="width: 470px;"
            :placeholder="t('dialog.setting.bgTip')"
            @blur="handleBgImageChange"
          />
        </a-form-item>
      </a-col>
    </a-row>
  </a-form>
</template>

<script>
import { pointToMM, mmToPoint, buildPageSizeList } from '@/utils/table';
import { useI18n } from 'vue-i18n';

export default {
  name: 'PageSettings',
  setup() {
    return { t: useI18n().t };
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
        label: this.t('dialog.setting.custom')
      });
      return options;
    },
    orientationOptions() {
      return [
        { value: 'portrait', label: this.t('dialog.setting.portrait') },
        { value: 'landscape', label: this.t('dialog.setting.landscape') }
      ];
    },
    htmlAlignOptions() {
      return [
        { value: 'left', label: this.t('dialog.setting.left') },
        { value: 'center', label: this.t('dialog.setting.center') },
        { value: 'right', label: this.t('dialog.setting.right') }
      ];
    }
  },
  watch: {
    paper: {
      handler(newVal) {
        this.localPaper = { ...newVal };
        this.localPageWidth = pointToMM(newVal.width);
        this.localPageHeight = pointToMM(newVal.height);
        this.localLeftMargin = pointToMM(newVal.leftMargin);
        this.localRightMargin = pointToMM(newVal.rightMargin);
        this.localTopMargin = pointToMM(newVal.topMargin);
        this.localBottomMargin = pointToMM(newVal.bottomMargin);
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
    }
  }
};
</script>
