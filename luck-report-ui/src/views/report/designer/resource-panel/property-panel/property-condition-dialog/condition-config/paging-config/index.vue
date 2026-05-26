<template>
  <div>
    <u-row style="margin-bottom: 5px;" type="flex" align="middle">
      <u-col :span="8">
        <u-checkbox v-model="pagingBreakChecked" @change="onPagingBreakChange">
          {{ $t('dialog.propCondition.paging') }}
        </u-checkbox>
      </u-col>
      <u-col :span="8">
        <u-select
            v-show="pagingBreakChecked"
            v-model="pagingPosition"
            style="width: 120px"
            @change="onPagingPositionChange"
        >
          <u-option
              v-for="option in pagingPositionOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
          />
        </u-select>
      </u-col>
      <u-col :span="8">
        <u-input-number
            v-show="pagingBreakChecked"
            v-model="pagingLine"
            :min="1"
            @change="onPagingLineChange">
        </u-input-number>
      </u-col>
    </u-row>
  </div>
</template>

<script>
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UInputNumber from '@/components/input-number/index.vue';
import UCheckbox from '@/components/checkbox/index.vue';
import URow from '@/components/row/index.vue';
import UCol from '@/components/col/index.vue';
import configOptions from '../constants/config-options.js';

export default {
  name: 'PagingConfig',
  components: {
    USelect,
    UOption,
    UInputNumber,
    UCheckbox,
    URow,
    UCol
  },
  props: {
    paging: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      pagingBreakChecked: false,
      pagingPosition: 'after',
      pagingLine: 0,

      pagingPositionOptions: []
    };
  },
  created() {
    this.pagingPositionOptions = configOptions.getPagingPositionOptions(this.$t);
  },
  watch: {
    paging: {
      handler(newVal) {
        this.loadPagingProperties(newVal);
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    loadPagingProperties(paging) {
      this.pagingBreakChecked = !!paging;
      if (this.pagingBreakChecked) {
        this.pagingPosition = paging.position || 'after';
        this.pagingLine = paging.line || 0;
      } else {
        this.pagingPosition = 'after';
        this.pagingLine = 0;
      }
    },

    onPagingBreakChange() {
      this.$emit('paging-change', {
        checked: this.pagingBreakChecked,
        paging: this.pagingBreakChecked ? {
          position: this.pagingPosition,
          line: this.pagingLine
        } : null
      });
    },

    onPagingPositionChange() {
      if (this.pagingBreakChecked) {
        this.$emit('paging-change', {
          checked: true,
          paging: {
            position: this.pagingPosition,
            line: this.pagingLine
          }
        });
      }
    },

    onPagingLineChange() {
      if (this.pagingBreakChecked) {
        this.$emit('paging-change', {
          checked: true,
          paging: {
            position: this.pagingPosition,
            line: this.pagingLine
          }
        });
      }
    }
  }
};
</script>
