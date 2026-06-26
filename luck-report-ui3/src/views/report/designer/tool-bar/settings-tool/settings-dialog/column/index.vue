<template>
  <a-form>
    <div class="form-desc">{{ t('dialog.setting.colDesc') }}</div>

    <a-row>
      <a-col :span="24">
        <a-form-item class="property-label" :label="t('dialog.setting.column')">
          <a-radio-group
            v-model:value="localPaper.columnEnabled"
            @change="handleColumnEnabledChange"
          >
            <a-radio
              v-for="option in columnEnabledOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-radio>
          </a-radio-group>
        </a-form-item>
      </a-col>
    </a-row>

    <a-row style="margin-top: 5px;">
      <a-col :span="10">
        <a-form-item class="property-label" :label="t('dialog.setting.columnCount')">
          <a-select
            v-model:value="localPaper.columnCount"
            :disabled="!localPaper.columnEnabled"
            @change="handleColumnCountChange"
            style="width: 140px"
          >
            <a-select-option
              v-for="option in columnCountOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="10">
        <a-form-item class="property-label" :label="t('dialog.setting.columnMargin')">
          <a-input-number
            v-model:value="localColumnMargin"
            :disabled="!localPaper.columnEnabled"
            @change="handleColumnMarginChange"
          />
        </a-form-item>
      </a-col>
    </a-row>
  </a-form>
</template>

<script>
import { pointToMM, mmToPoint } from '@/utils/table';
import { useI18n } from 'vue-i18n';

export default {
  name: 'ColumnSettings',
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
      localColumnMargin: pointToMM(this.paper.columnMargin)
    };
  },
  computed: {
    columnCountOptions() {
      const options = [];
      for (let i = 1; i <= 9; i++) {
        options.push({
          value: i + 1,
          label: `${i + 1}${this.t('dialog.setting.columnUnit')}`
        });
      }
      return options;
    },
    columnEnabledOptions() {
      return [
        { value: false, label: this.t('dialog.setting.disable') },
        { value: true, label: this.t('dialog.setting.enable') }
      ];
    }
  },
  watch: {
    paper: {
      handler(newVal) {
        this.localPaper = { ...newVal };
        this.localColumnMargin = pointToMM(newVal.columnMargin);
      },
      deep: true
    }
  },
  methods: {
    handleColumnEnabledChange() {
      this.$emit('update:paper', { ...this.localPaper });
      this.$emit('column-enabled-change');
    },
    handleColumnCountChange() {
      this.$emit('update:paper', { ...this.localPaper });
      this.$emit('column-count-change');
    },
    handleColumnMarginChange() {
      if (!isNaN(this.localColumnMargin)) {
        this.$emit('update:paper', { ...this.localPaper, columnMargin: mmToPoint(this.localColumnMargin) });
        this.$emit('column-margin-change');
      }
    }
  }
};
</script>

<style scoped>
.form-desc {
  margin-bottom: 10px;
  color: #999999;
  font-size: 12px;
}
</style>
