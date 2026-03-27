<template>
  <div>
    <div class="form-group form-group-inline">
      <label>{{ $t('dialog.setting.paperType') }}：</label>
      <div class="u-inline">
        <u-select
          :value="localPaper.paperType"
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

    <div class="form-group form-group-inline form-group-ml25">
      <span>{{ $t('dialog.setting.paperWidth') }}：</span>
      <div class="u-inline">
        <u-input-number
          :value="pageWidth"
          :disabled="localPaper.paperType !== 'CUSTOM'"
          @change="handlePageWidthChange"
        />
      </div>
    </div>

    <div class="form-group form-group-inline form-group-ml15">
      <span>{{ $t('dialog.setting.paperHeight') }}：</span>
      <div class="u-inline">
        <u-input-number
          :value="pageHeight"
          :disabled="localPaper.paperType !== 'CUSTOM'"
          @change="handlePageHeightChange"
        />
      </div>
    </div>

    <div></div>

    <div class="form-group form-group-inline form-group-mt5">
      <label>{{ $t('dialog.setting.leftMargin') }}：</label>
      <div class="u-inline">
        <u-input-number
          :value="leftMargin"
          @change="handleLeftMarginChange"
        />
      </div>
    </div>

    <div class="form-group form-group-inline form-group-mt5 form-group-ml25">
      <label>{{ $t('dialog.setting.rightMargin') }}：</label>
      <div class="u-inline">
        <u-input-number
          :value="rightMargin"
          @change="handleRightMarginChange"
        />
      </div>
    </div>

    <div></div>

    <div class="form-group form-group-inline form-group-mt5">
      <label>{{ $t('dialog.setting.topMargin') }}：</label>
      <div class="u-inline">
        <u-input-number
          :value="topMargin"
          @change="handleTopMarginChange"
        />
      </div>
    </div>

    <div class="form-group form-group-inline form-group-mt5 form-group-ml25">
      <label>{{ $t('dialog.setting.bottomMargin') }}：</label>
      <div class="u-inline">
        <u-input-number
          :value="bottomMargin"
          @change="handleBottomMarginChange"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{ $t('dialog.setting.orientation') }}：</label>
      <div class="u-inline">
        <u-select
          :value="localPaper.orientation"
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
          :value="localPaper.htmlReportAlign"
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
          :value="localPaper.htmlIntervalRefreshValue"
          :placeholder="$t('dialog.setting.tip1')"
          :title="$t('dialog.setting.tip2')"
          :min="0"
          @change="handleHtmlIntervalRefreshValueChange"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{ $t('dialog.setting.bg') }}：</label>
      <div class="u-inline">
        <u-input
          :value="localPaper.bgImage"
          style="width: 470px;"
          :placeholder="$t('dialog.setting.bgTip')"
          @change="handleBgImageChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { pointToMM, mmToPoint, buildPageSizeList } from '@/utils/table.js';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UInputNumber from "@/components/input-number/index.vue";
import UInput from "@/components/input/index.vue";

export default {
  name: 'PageSettings',
  components: {
    USelect,
    UOption,
    UInputNumber,
    UInput
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
      paperSizeList: buildPageSizeList()
    };
  },
  computed: {
    pageWidth() {
      return pointToMM(this.localPaper.width);
    },
    pageHeight() {
      return pointToMM(this.localPaper.height);
    },
    leftMargin() {
      return pointToMM(this.localPaper.leftMargin);
    },
    rightMargin() {
      return pointToMM(this.localPaper.rightMargin);
    },
    topMargin() {
      return pointToMM(this.localPaper.topMargin);
    },
    bottomMargin() {
      return pointToMM(this.localPaper.bottomMargin);
    },
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
        this.localPaper = { ...newVal };
      },
      deep: true
    }
  },
  methods: {
    handlePaperTypeChange(value) {
      this.$emit('update:paper', { ...this.localPaper, paperType: value });
      this.$emit('paper-type-change', value);
    },
    handlePageWidthChange(value) {
      if (!isNaN(value)) {
        this.$emit('update:paper', { ...this.localPaper, width: mmToPoint(value) });
        this.$emit('paper-size-change');
      }
    },
    handlePageHeightChange(value) {
      if (!isNaN(value)) {
        this.$emit('update:paper', { ...this.localPaper, height: mmToPoint(value) });
        this.$emit('paper-size-change');
      }
    },
    handleLeftMarginChange(value) {
      if (!isNaN(value)) {
        this.$emit('update:paper', { ...this.localPaper, leftMargin: mmToPoint(value) });
        this.$emit('margins-change');
      }
    },
    handleRightMarginChange(value) {
      if (!isNaN(value)) {
        this.$emit('update:paper', { ...this.localPaper, rightMargin: mmToPoint(value) });
        this.$emit('margins-change');
      }
    },
    handleTopMarginChange(value) {
      if (!isNaN(value)) {
        this.$emit('update:paper', { ...this.localPaper, topMargin: mmToPoint(value) });
        this.$emit('margins-change');
      }
    },
    handleBottomMarginChange(value) {
      if (!isNaN(value)) {
        this.$emit('update:paper', { ...this.localPaper, bottomMargin: mmToPoint(value) });
        this.$emit('margins-change');
      }
    },
    handleOrientationChange(value) {
      this.$emit('update:paper', { ...this.localPaper, orientation: value });
      this.$emit('orientation-change');
    },
    handleHtmlAlignChange(value) {
      this.$emit('update:paper', { ...this.localPaper, htmlReportAlign: value });
      this.$emit('html-align-change');
    },
    handleHtmlIntervalRefreshValueChange(value) {
      this.$emit('update:paper', { ...this.localPaper, htmlIntervalRefreshValue: value });
      this.$emit('html-interval-refresh-value-change', value);
    },
    handleBgImageChange(value) {
      this.$emit('update:paper', { ...this.localPaper, bgImage: value });
      this.$emit('background-image-change', value);
    }
  }
};
</script>

<style scoped>
.form-group-inline {
  display: inline-block;
}

.form-group-ml25 {
  margin-left: 25px;
}

.form-group-ml15 {
  margin-left: 15px;
}

.form-group-mt5 {
  margin-top: 5px;
}
</style>
