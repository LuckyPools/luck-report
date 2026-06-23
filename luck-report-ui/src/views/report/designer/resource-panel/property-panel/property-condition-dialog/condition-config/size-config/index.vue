<template>
  <div>
    <u-row class="condition-config-row" type="flex" align="middle">
      <u-col :span="8">
        <u-checkbox v-model="rowHeightChecked" @change="onRowHeightChange">
          {{ $t('dialog.propCondition.rowHeight') }}
        </u-checkbox>
      </u-col>
      <u-col :span="8">
        <u-input-number
            v-show="rowHeightChecked"
            v-model="localRowHeight"
            :min="0"
            @change="onRowHeightValueChange">
        </u-input-number>
      </u-col>
      <u-col :span="8">
      </u-col>
    </u-row>

    <u-row class="condition-config-row" type="flex" align="middle">
      <u-col :span="8">
        <u-checkbox v-model="colWidthChecked" @change="onColWidthChange">
          {{ $t('dialog.propCondition.colWidth') }}
        </u-checkbox>
      </u-col>
      <u-col :span="8">
        <u-input-number
            v-show="colWidthChecked"
            v-model="localColWidth"
            :min="0"
            @change="onColWidthValueChange">
        </u-input-number>
      </u-col>
      <u-col :span="8">
      </u-col>
    </u-row>
  </div>
</template>

<script>
import UInputNumber from '@/components/input-number/index.vue';
import UCheckbox from '@/components/checkbox/index.vue';
import URow from '@/components/row/index.vue';
import UCol from '@/components/col/index.vue';

export default {
  name: 'SizeConfig',
  components: {
    UInputNumber,
    UCheckbox,
    URow,
    UCol
  },
  props: {
    rowHeight: {
      type: Number,
      default: null
    },
    colWidth: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      rowHeightChecked: false,
      localRowHeight: 0,

      colWidthChecked: false,
      localColWidth: 0
    };
  },
  watch: {
    rowHeight: {
      handler(newVal) {
        this.loadRowHeight(newVal);
      },
      immediate: true
    },
    colWidth: {
      handler(newVal) {
        this.loadColWidth(newVal);
      },
      immediate: true
    }
  },
  methods: {
    loadRowHeight(rowHeight) {
      this.rowHeightChecked = rowHeight !== null && rowHeight !== undefined && rowHeight !== -1;
      this.localRowHeight = this.rowHeightChecked ? rowHeight : 0;
    },

    loadColWidth(colWidth) {
      this.colWidthChecked = colWidth !== null && colWidth !== undefined && colWidth !== -1;
      this.localColWidth = this.colWidthChecked ? colWidth : 0;
    },

    onRowHeightChange() {
      this.$emit('size-change', {
        type: 'rowHeight',
        checked: this.rowHeightChecked,
        value: this.rowHeightChecked ? this.localRowHeight : null
      });
    },

    onRowHeightValueChange() {
      if (this.rowHeightChecked) {
        this.$emit('size-change', {
          type: 'rowHeight',
          checked: true,
          value: this.localRowHeight
        });
      }
    },

    onColWidthChange() {
      this.$emit('size-change', {
        type: 'colWidth',
        checked: this.colWidthChecked,
        value: this.colWidthChecked ? this.localColWidth : null
      });
    },

    onColWidthValueChange() {
      if (this.colWidthChecked) {
        this.$emit('size-change', {
          type: 'colWidth',
          checked: true,
          value: this.localColWidth
        });
      }
    }
  }
};
</script>
