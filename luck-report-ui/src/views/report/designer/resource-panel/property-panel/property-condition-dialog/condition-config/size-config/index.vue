<template>
  <div>
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="rowHeightChecked" @change="onRowHeightChange">
          {{ $t('dialog.propCondition.rowHeight') }}
        </u-checkbox>
      </div>
      <span v-show="rowHeightChecked" style="margin-left: 10px;">
        <div class="u-inline">
          <u-input-number v-model="localRowHeight" @change="onRowHeightValueChange">
          </u-input-number>
        </div>
      </span>
    </div>

    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="colWidthChecked" @change="onColWidthChange">
          {{ $t('dialog.propCondition.colWidth') }}
        </u-checkbox>
      </div>
      <span v-show="colWidthChecked" style="margin-left: 10px;">
        <div class="u-inline">
          <u-input-number v-model="localColWidth" @change="onColWidthValueChange">
          </u-input-number>
        </div>
      </span>
    </div>
  </div>
</template>

<script>
import UInputNumber from '@/components/input-number/index.vue';
import UCheckbox from '@/components/checkbox/index.vue';

export default {
  name: 'SizeConfig',
  components: {
    UInputNumber,
    UCheckbox
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
