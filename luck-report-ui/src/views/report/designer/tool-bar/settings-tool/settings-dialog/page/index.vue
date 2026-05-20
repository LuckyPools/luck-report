<template>
  <div>
    <div class="form-group form-group-inline">
      <label>{{ $t('dialog.setting.paperType') }}：</label>
      <div class="u-inline">
        <u-select
          v-model="localPaper.paperType"
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
          v-model="localPageWidth"
          :disabled="localPaper.paperType !== 'CUSTOM'"
          @change="handlePageWidthChange"
        />
      </div>
    </div>

    <div class="form-group form-group-inline form-group-ml15">
      <span>{{ $t('dialog.setting.paperHeight') }}：</span>
      <div class="u-inline">
        <u-input-number
          v-model="localPageHeight"
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
          v-model="localLeftMargin"
          @change="handleLeftMarginChange"
        />
      </div>
    </div>

    <div class="form-group form-group-inline form-group-mt5 form-group-ml25">
      <label>{{ $t('dialog.setting.rightMargin') }}：</label>
      <div class="u-inline">
        <u-input-number
          v-model="localRightMargin"
          @change="handleRightMarginChange"
        />
      </div>
    </div>

    <div></div>

    <div class="form-group form-group-inline form-group-mt5">
      <label>{{ $t('dialog.setting.topMargin') }}：</label>
      <div class="u-inline">
        <u-input-number
          v-model="localTopMargin"
          @change="handleTopMarginChange"
        />
      </div>
    </div>

    <div class="form-group form-group-inline form-group-mt5 form-group-ml25">
      <label>{{ $t('dialog.setting.bottomMargin') }}：</label>
      <div class="u-inline">
        <u-input-number
          v-model="localBottomMargin"
          @change="handleBottomMarginChange"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{ $t('dialog.setting.orientation') }}：</label>
      <div class="u-inline">
        <u-select
          v-model="localPaper.orientation"
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
          v-model="localPaper.htmlReportAlign"
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
          v-model="localPaper.htmlIntervalRefreshValue"
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
          v-model="localPaper.bgImage"
          style="width: 470px;"
          :placeholder="$t('dialog.setting.bgTip')"
          @blur="handleBgImageChange"
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
