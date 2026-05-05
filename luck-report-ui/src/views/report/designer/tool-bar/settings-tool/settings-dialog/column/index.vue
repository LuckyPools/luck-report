<template>
  <div>
    <div class="div-col-desc">{{ $t('dialog.setting.colDesc') }}</div>

    <div class="form-group form-group-col-enabled">
      <label>{{ $t('dialog.setting.column') }}：</label>
      <div class="u-inline">
        <u-radio-group
            :value="localPaper.columnEnabled"
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

    <div class="form-group form-group-col-config">
      <label>{{ $t('dialog.setting.columnCount') }}：</label>
      <div class="u-inline">
        <u-select
          :value="localPaper.columnCount"
          :disabled="!localPaper.columnEnabled"
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

      <span class="span-col-margin">
        <label>{{ $t('dialog.setting.columnMargin') }}：</label>
      </span>
      <div class="u-inline">
        <u-input-number
          :value="columnMargin"
          :disabled="!localPaper.columnEnabled"
          @change="handleColumnMarginChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { pointToMM, mmToPoint } from '@/utils/table.js';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UInputNumber from "@/components/input-number/index.vue";

export default {
  name: 'ColumnSettings',
  components: {
    URadioGroup,
    URadio,
    USelect,
    UOption,
    UInputNumber
  },
  props: {
    paper: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      localPaper: { ...this.paper }
    };
  },
  computed: {
    columnMargin() {
      return pointToMM(this.localPaper.columnMargin);
    },
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
    columnEnabledOptions() {
      return [
        { value: false, label: this.$t('dialog.setting.disable') },
        { value: true, label: this.$t('dialog.setting.enable') }
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
    handleColumnEnabledChange(value) {
      this.$emit('update:paper', { ...this.localPaper, columnEnabled: value });
      this.$emit('column-enabled-change');
    },
    handleColumnCountChange(value) {
      this.$emit('update:paper', { ...this.localPaper, columnCount: value });
      this.$emit('column-count-change');
    },
    handleColumnMarginChange(value) {
      if (!isNaN(value)) {
        this.$emit('update:paper', { ...this.localPaper, columnMargin: mmToPoint(value) });
        this.$emit('column-margin-change');
      }
    }
  }
};
</script>

<style scoped>
.div-col-desc {
  margin: 0 0 5px 5px;
  color: #999999;
  font-size: 12px;
}

.form-group-col-enabled {
  margin-top: 8px;
}

.form-group-col-config {
  margin-top: 1px;
  display: inline-block;
}

.span-col-margin {
  margin-left: 20px;
}
</style>
