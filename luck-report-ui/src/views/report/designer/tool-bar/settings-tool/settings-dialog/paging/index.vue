<template>
  <u-form :label-width="100" label-position="left">
    <u-row>
      <u-col :span="24">
        <u-form-item class="property-label" :label="$t('dialog.setting.pagingType')">
          <u-radio-group
            v-model="localPaper.pagingMode"
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
        </u-form-item>
      </u-col>
    </u-row>

    <u-row v-show="localPaper.pagingMode === 'fixrows'" style="margin-top: 5px;">
      <u-col :span="8">
        <u-form-item class="property-label" :label="$t('dialog.setting.rowsPerPage')">
          <u-input-number
            :value="localPaper.fixRows"
            :min="1"
            @change="handleFixRowsChange"
          />
        </u-form-item>
      </u-col>
      <u-col :span="16">
      </u-col>
    </u-row>
  </u-form>
</template>

<script>
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import UInputNumber from '@/components/input-number/index.vue';
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import URow from '@/components/row/index.vue';
import UCol from '@/components/col/index.vue';

export default {
  name: 'PagingSettings',
  components: {
    URadioGroup,
    URadio,
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
      localPaper: { ...this.paper }
    };
  },
  computed: {
    pagingModeOptions() {
      return [
        { value: 'fitpage', label: this.$t('dialog.setting.auto') },
        { value: 'fixrows', label: this.$t('dialog.setting.fixRows') }
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
    handlePagingModeChange(value) {
      this.$emit('update:paper', { ...this.localPaper, pagingMode: value });
      this.$emit('paging-mode-change');
    },
    handleFixRowsChange(value) {
      this.$emit('update:paper', { ...this.localPaper, fixRows: value });
      this.$emit('fix-rows-change', value);
    }
  }
};
</script>
