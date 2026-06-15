<template>
  <a-form :label-col="{ style: { width: '100px' } }">
    <a-row>
      <a-col :span="24">
        <a-form-item class="property-label" :label="t('dialog.setting.pagingType')">
          <a-radio-group
            v-model:value="localPaper.pagingMode"
            @change="handlePagingModeChange"
          >
            <a-radio
              v-for="option in pagingModeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-radio>
          </a-radio-group>
        </a-form-item>
      </a-col>
    </a-row>

    <a-row v-show="localPaper.pagingMode === 'fixrows'" style="margin-top: 5px;">
      <a-col :span="8">
        <a-form-item class="property-label" :label="t('dialog.setting.rowsPerPage')">
          <a-input-number
            :value="localPaper.fixRows"
            :min="1"
            @change="handleFixRowsChange"
          />
        </a-form-item>
      </a-col>
      <a-col :span="16">
      </a-col>
    </a-row>
  </a-form>
</template>

<script>
import { useI18n } from 'vue-i18n';

export default {
  name: 'PagingSettings',
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
      localPaper: { ...this.paper }
    };
  },
  computed: {
    pagingModeOptions() {
      return [
        { value: 'fitpage', label: this.t('dialog.setting.auto') },
        { value: 'fixrows', label: this.t('dialog.setting.fixRows') }
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
