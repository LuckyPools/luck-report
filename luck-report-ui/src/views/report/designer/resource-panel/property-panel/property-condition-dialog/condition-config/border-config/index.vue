<template>
  <div>
    <u-row class="condition-config-row" type="flex" align="middle">
      <u-col :span="8">
        <u-checkbox v-model="borderChecked" @change="onBorderChange">
          {{ $t('dialog.propCondition.border') }}
        </u-checkbox>
      </u-col>
      <u-col :span="8">
        <u-button type="info" v-show="borderChecked" @click="configBorder">
          <i class="iconfont icon-setting"></i> {{ $t('dialog.propCondition.borderConfig') }}
        </u-button>
      </u-col>
      <u-col :span="8">
      </u-col>
    </u-row>

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
import URow from '@/components/row/index.vue';
import UCol from '@/components/col/index.vue';
import CustomBorderDialog from '@/views/report/designer/resource-panel/property-panel/custom-border-dialog/index.vue';

export default {
  name: 'BorderConfig',
  components: {
    UCheckbox,
    UButton,
    URow,
    UCol,
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

      const defaultBorder = { color: '0,0,0', width: "1", style: 'solid' };
      const noneBorder = { color: '0,0,0', width: "1", style: 'none' };

      if (!this.localCellStyle.leftBorder || this.localCellStyle.leftBorder === '') {
        this.localCellStyle.leftBorder = { ...noneBorder };
      }
      if (!this.localCellStyle.rightBorder || this.localCellStyle.rightBorder === '') {
        this.localCellStyle.rightBorder = { ...noneBorder };
      }
      if (!this.localCellStyle.topBorder || this.localCellStyle.topBorder === '') {
        this.localCellStyle.topBorder = { ...noneBorder };
      }
      if (!this.localCellStyle.bottomBorder || this.localCellStyle.bottomBorder === '') {
        this.localCellStyle.bottomBorder = { ...noneBorder };
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
