<template>
  <u-form :label-width="100" label-position="left">
    <div class="form-desc">{{ $t('dialog.setting.colDesc') }}</div>

    <u-row>
      <u-col :span="24">
        <u-form-item class="property-label" :label="$t('dialog.setting.column')">
          <u-radio-group
            v-model="localPaper.columnEnabled"
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
        </u-form-item>
      </u-col>
    </u-row>

    <u-row style="margin-top: 5px;">
      <u-col :span="10">
        <u-form-item class="property-label" :label="$t('dialog.setting.columnCount')">
          <u-select
            v-model="localPaper.columnCount"
            :disabled="!localPaper.columnEnabled"
            @change="handleColumnCountChange"
            style="width: 140px"
          >
            <u-option
              v-for="option in columnCountOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </u-select>
        </u-form-item>
      </u-col>
      <u-col :span="10">
        <u-form-item class="property-label" :label="$t('dialog.setting.columnMargin')">
          <u-input-number
            v-model="localColumnMargin"
            :disabled="!localPaper.columnEnabled"
            @change="handleColumnMarginChange"
          />
        </u-form-item>
      </u-col>
    </u-row>
  </u-form>
</template>

<script>
import { pointToMM, mmToPoint } from '@/utils/table.js';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UInputNumber from '@/components/input-number/index.vue';
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import URow from '@/components/row/index.vue';
import UCol from '@/components/col/index.vue';

export default {
  name: 'ColumnSettings',
  components: {
    URadioGroup,
    URadio,
    USelect,
    UOption,
    UInputNumber,
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
      localColumnMargin: pointToMM(this.paper.columnMargin)
    };
  },
  computed: {
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
  margin: 0 5px 10px 5px;
  color: #999999;
  font-size: 12px;
}
</style>
