<template>
  <div>
    <div class="form-group" style="margin-bottom: 5px;">
      <div class="u-inline">
        <u-checkbox v-model="borderChecked" @change="onBorderChange">
          {{ $t('dialog.propCondition.border') }}
        </u-checkbox>
      </div>
      <span v-show="borderChecked" style="margin-left: 10px;">
        <u-button @click="configBorder">
          <i class="iconfont icon-setting"></i> {{ $t('dialog.propCondition.borderConfig') }}
        </u-button>
      </span>
    </div>

    <CustomBorderDialog
      :visible="customBorderDialogVisible"
      :cell-style="localCellStyle"
      @close="customBorderDialogVisible = false"
      @update:visible="customBorderDialogVisible = $event"
      @save="handleCustomBorderSave"
    />
  </div>
</template>

<script>
import UCheckbox from '@/components/checkbox/index.vue';
import UButton from '@/components/button/index.vue';
import CustomBorderDialog from '@/views/report/designer/resource-panel/property-panel/custom-border-dialog/index.vue';

export default {
  name: 'BorderConfig',
  components: {
    UCheckbox,
    UButton,
    CustomBorderDialog
  },
  props: {
    cellStyle: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      borderChecked: false,
      customBorderDialogVisible: false,
      localCellStyle: {}
    };
  },
  watch: {
    cellStyle: {
      handler(newVal) {
        this.loadBorderProperties(newVal);
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    loadBorderProperties(cellStyle) {
      if (!cellStyle) return;

      this.borderChecked = !!(cellStyle.leftBorder || cellStyle.rightBorder || cellStyle.topBorder || cellStyle.bottomBorder);
    },

    onBorderChange() {
      const defaultBorder = {
        color: "0,0,0",
        style: "solid",
        width: 1
      };

      this.$emit('border-change', {
        checked: this.borderChecked,
        borders: this.borderChecked ? {
          leftBorder: JSON.parse(JSON.stringify(defaultBorder)),
          rightBorder: JSON.parse(JSON.stringify(defaultBorder)),
          topBorder: JSON.parse(JSON.stringify(defaultBorder)),
          bottomBorder: JSON.parse(JSON.stringify(defaultBorder))
        } : {
          leftBorder: null,
          rightBorder: null,
          topBorder: null,
          bottomBorder: null
        }
      });
    },

    configBorder() {
      this.localCellStyle = JSON.parse(JSON.stringify(this.cellStyle));

      if (!this.localCellStyle.leftBorder) {
        this.localCellStyle.leftBorder = { color: '0,0,0', width: "1", style: 'solid' };
      }
      if (!this.localCellStyle.rightBorder) {
        this.localCellStyle.rightBorder = { color: '0,0,0', width: "1", style: 'solid' };
      }
      if (!this.localCellStyle.topBorder) {
        this.localCellStyle.topBorder = { color: '0,0,0', width: "1", style: 'solid' };
      }
      if (!this.localCellStyle.bottomBorder) {
        this.localCellStyle.bottomBorder = { color: '0,0,0', width: "1", style: 'solid' };
      }

      this.customBorderDialogVisible = true;
    },

    handleCustomBorderSave(borderData) {
      this.$emit('border-save', {
        topBorder: borderData.topBorder,
        bottomBorder: borderData.bottomBorder,
        leftBorder: borderData.leftBorder,
        rightBorder: borderData.rightBorder
      });
    }
  }
};
</script>
