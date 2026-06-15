<template>
  <UDialog
    :title="$t('tools.border.customBorderLine')"
    width="600px"
    :visible="visible"
    :z-index="zIndex"
    @close="handleClose"
  >
    <div class="border-config-container">
      <div class="preset-section">
        <label class="preset-label">
          {{ $t('tools.border.preset') }}：
        </label>
        <u-button
          type="text"
          :title="$t('tools.border.allLine')"
          @click="applyAllBorder"
        >
          <i class="iconfont icon-full-border"></i>
        </u-button>
        <u-button
          type="text"
          :title="$t('tools.border.noBorder')"
          @click="applyNoBorder"
        >
          <i class="iconfont icon-no-border"></i>
        </u-button>
      </div>

      <div class="main-content">
        <div class="preview-section">
          <div class="preview-container">
            <div class="outer-box" :class="outerBoxClass" @click="handleOuterBoxClick">
              <div
                class="inner-box"
                :style="innerBoxStyle"
              >
                <span class="preview-text">{{ $t('tools.border.text') }}</span>
                <div
                  v-for="border in borders"
                  :key="border.position"
                  :class="['border-click-area', `border-${border.position}`]"
                  @click.stop="selectBorder(border.position)"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="property-section">
          <u-form ref="form" :label-width="80">
            <u-form-item :label="$t('tools.border.lineStyle')">
              <u-select v-model="currentBorderStyle.style">
                <u-option
                  v-for="option in lineStyleOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </u-form-item>
            <u-form-item :label="$t('tools.border.size')">
              <u-select v-model="currentBorderStyle.width">
                <u-option
                  v-for="option in lineWidthOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </u-form-item>
            <u-form-item :label="$t('tools.border.color')">
              <UColorPicker v-model="currentBorderStyle.color" />
            </u-form-item>
          </u-form>
        </div>
      </div>
    </div>

    <div slot="footer" style="text-align: right">
      <u-button @click="handleClose" type="info" style="margin-right: 10px;">{{ $t('dialog.common.cancel') }}</u-button>
      <u-button @click="handleOk">{{ $t('dialog.common.ok') }}</u-button>
    </div>
  </UDialog>
</template>

<script>
import UDialog from '@/components/dialog/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UButton from "@/components/button/index.vue";
import UColorPicker from "@/components/color-picker/index.vue";
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import { rgbToHex, hexToRgb } from '@/utils/color';

export default {
  name: 'CustomBorderDialog',
  components: {
    UColorPicker,
    UButton,
    UDialog,
    USelect,
    UOption,
    UForm,
    UFormItem
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    cellStyle: {
      type: Object,
      default: null
    },
    topBorder: {
      type: Object,
      default: () => ({
        style: 'solid',
        width: 1,
        color: '#000000'
      })
    },
    bottomBorder: {
      type: Object,
      default: () => ({
        style: 'solid',
        width: 1,
        color: '#000000'
      })
    },
    leftBorder: {
      type: Object,
      default: () => ({
        style: 'solid',
        width: 1,
        color: '#000000'
      })
    },
    rightBorder: {
      type: Object,
      default: () => ({
        style: 'solid',
        width: 1,
        color: '#000000'
      })
    },
    zIndex: {
      type: Number,
      default: 20000
    }
  },
  data() {
    return {
      activeBorder: 'left',
      localTopBorder: { style: 'none', width: 1, color: '#000000' },
      localBottomBorder: { style: 'none', width: 1, color: '#000000' },
      localLeftBorder: { style: 'none', width: 1, color: '#000000' },
      localRightBorder: { style: 'none', width: 1, color: '#000000' },
      borders: [
        { position: 'top' },
        { position: 'right' },
        { position: 'bottom' },
        { position: 'left' }
      ]
    };
  },
  computed: {
    lineStyleOptions() {
      return [
        { value: 'solid', label: this.$t('tools.border.solidLine') },
        { value: 'dashed', label: this.$t('tools.border.dashed') },
        { value: 'none', label: this.$t('tools.border.none') }
      ];
    },
    lineWidthOptions() {
      return Array.from({ length: 10 }, (_, i) => ({
        value: i + 1,
        label: (i + 1).toString()
      }));
    },
    currentBorderStyle: {
      get() {
        const borderMap = {
          top: this.localTopBorder,
          bottom: this.localBottomBorder,
          left: this.localLeftBorder,
          right: this.localRightBorder
        };
        return borderMap[this.activeBorder] || this.localRightBorder;
      },
      set(val) {
        const borderMap = {
          top: 'localTopBorder',
          bottom: 'localBottomBorder',
          left: 'localLeftBorder',
          right: 'localRightBorder'
        };
        this[borderMap[this.activeBorder]] = { ...val };
      }
    },
    innerBoxStyle() {
      const getBorderStyle = (border) => {
        if (!border || border.style === 'none') {
          return 'none';
        }
        const width = border.width || 1;
        const color = border.color || '#000000';
        return `${border.style} ${width}px ${color}`;
      };

      return {
        borderTop: getBorderStyle(this.localTopBorder),
        borderRight: getBorderStyle(this.localRightBorder),
        borderBottom: getBorderStyle(this.localBottomBorder),
        borderLeft: getBorderStyle(this.localLeftBorder)
      };
    },
    outerBoxClass() {
      return {
        'active-top': this.activeBorder === 'top',
        'active-right': this.activeBorder === 'right',
        'active-bottom': this.activeBorder === 'bottom',
        'active-left': this.activeBorder === 'left'
      };
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.loadBorderData();
      }
    }
  },
  methods: {
    loadBorderData() {
      const defaultBorder = { style: 'none', width: 1, color: '#000000' };

      if (this.cellStyle) {
        this.localTopBorder = this.cellStyle.topBorder
          ? { ...this.cellStyle.topBorder, color: this.rgbToHexIfNeeded(this.cellStyle.topBorder.color) }
          : { ...defaultBorder };
        this.localBottomBorder = this.cellStyle.bottomBorder
          ? { ...this.cellStyle.bottomBorder, color: this.rgbToHexIfNeeded(this.cellStyle.bottomBorder.color) }
          : { ...defaultBorder };
        this.localLeftBorder = this.cellStyle.leftBorder
          ? { ...this.cellStyle.leftBorder, color: this.rgbToHexIfNeeded(this.cellStyle.leftBorder.color) }
          : { ...defaultBorder };
        this.localRightBorder = this.cellStyle.rightBorder
          ? { ...this.cellStyle.rightBorder, color: this.rgbToHexIfNeeded(this.cellStyle.rightBorder.color) }
          : { ...defaultBorder };
      } else {
        this.localTopBorder = { ...this.topBorder };
        this.localBottomBorder = { ...this.bottomBorder };
        this.localLeftBorder = { ...this.leftBorder };
        this.localRightBorder = { ...this.rightBorder };
      }
    },
    rgbToHexIfNeeded(color) {
      if (typeof color === 'string' && color.includes(',')) {
        return rgbToHex(color);
      }
      return color;
    },
    selectBorder(position) {
      this.activeBorder = position;
    },
    handleOuterBoxClick(event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const outerSize = 140;
      const innerSize = 100;
      const margin = (outerSize - innerSize) / 2;

      if (y < margin) {
        this.selectBorder('top');
      } else if (y > outerSize - margin) {
        this.selectBorder('bottom');
      } else if (x < margin) {
        this.selectBorder('left');
      } else if (x > outerSize - margin) {
        this.selectBorder('right');
      }
    },
    applyAllBorder() {
      const defaultBorder = { style: 'solid', width: 1, color: '#000000' };
      this.localTopBorder = { ...defaultBorder };
      this.localBottomBorder = { ...defaultBorder };
      this.localLeftBorder = { ...defaultBorder };
      this.localRightBorder = { ...defaultBorder };
    },
    applyNoBorder() {
      const noBorder = { style: 'none', width: 1, color: '#000000' };
      this.localTopBorder = { ...noBorder };
      this.localBottomBorder = { ...noBorder };
      this.localLeftBorder = { ...noBorder };
      this.localRightBorder = { ...noBorder };
    },
    handleClose() {
      this.$emit('close');
      this.$emit('update:visible', false);
    },
    handleOk() {
      const topBorder = { ...this.localTopBorder };
      const bottomBorder = { ...this.localBottomBorder };
      const leftBorder = { ...this.localLeftBorder };
      const rightBorder = { ...this.localRightBorder };

      topBorder.color = hexToRgb(this.localTopBorder.color);
      bottomBorder.color = hexToRgb(this.localBottomBorder.color);
      leftBorder.color = hexToRgb(this.localLeftBorder.color);
      rightBorder.color = hexToRgb(this.localRightBorder.color);

      if (this.cellStyle) {
        this.$emit('save', {
          topBorder,
          bottomBorder,
          leftBorder,
          rightBorder
        });
      } else {
        this.$emit('save', topBorder, bottomBorder, leftBorder, rightBorder);
      }
      this.$emit('close');
      this.$emit('update:visible', false);
    }
  }
};
</script>

<style scoped>
.border-config-container {
  padding: 10px;
}

.preset-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 15px;
}

.preset-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.main-content {
  display: flex;
  gap: 20px;
}

.preview-section {
  flex: 0 0 200px;
  display: flex;
  flex-direction: column;
}

.preview-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  padding: 20px;
}

.outer-box {
  width: 140px;
  height: 140px;
  border: 1px solid #c0c4cc;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  cursor: pointer;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.outer-box:hover {
  border-color: #a0a4ac;
}

.outer-box.active-top {
  box-shadow: inset 0 1px 0 rgba(33, 115, 70, 0.4), 0 -1px 0 rgba(33, 115, 70, 0.4);
}

.outer-box.active-right {
  box-shadow: inset -1px 0 0 rgba(33, 115, 70, 0.4), 1px 0 0 rgba(33, 115, 70, 0.4);
}

.outer-box.active-bottom {
  box-shadow: inset 0 -1px 0 rgba(33, 115, 70, 0.4), 0 1px 0 rgba(33, 115, 70, 0.4);
}

.outer-box.active-left {
  box-shadow: inset 1px 0 0 rgba(33, 115, 70, 0.4), -1px 0 0 rgba(33, 115, 70, 0.4);
}

.inner-box {
  width: 100px;
  height: 100px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  cursor: pointer;
  box-sizing: border-box;
}

.preview-text {
  font-size: 14px;
  color: #333;
  user-select: none;
}

.border-click-area {
  position: absolute;
  background-color: transparent;
  cursor: pointer;
}

.border-top {
  top: -20px;
  left: -20px;
  right: -20px;
  height: 20px;
}

.border-bottom {
  bottom: -20px;
  left: -20px;
  right: -20px;
  height: 20px;
}

.border-left {
  top: 0;
  bottom: 0;
  left: -20px;
  width: 20px;
}

.border-right {
  top: 0;
  bottom: 0;
  right: -20px;
  width: 20px;
}

.property-section {
  flex: 1;
}

.property-section .u-form {
  padding-top: 20px;
}
</style>
