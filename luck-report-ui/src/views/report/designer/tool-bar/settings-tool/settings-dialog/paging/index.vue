<template>
  <div>
    <div class="form-group">
      <label>{{ $t('dialog.setting.pagingType') }}：</label>
      <div class="u-inline">
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
      </div>
    </div>

    <div v-show="localPaper.pagingMode === 'fixrows'"
         class="form-group">
      <label>{{ $t('dialog.setting.rowsPerPage') }}：</label>
      <div class="u-inline">
        <u-input-number
            :value="localPaper.fixRows"
            :min="1"
            @change="handleFixRowsChange"
        />
      </div>
    </div>

  </div>
</template>

<script>
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import UInputNumber from "@/components/input-number/index.vue";

export default {
  name: 'PagingSettings',
  components: {
    URadioGroup,
    URadio,
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

<style scoped>
</style>
