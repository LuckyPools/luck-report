<template>
  <UDialog
    :title="$t('tools.border.customBorderLine')"
    width="400px"
    :visible="visible"
    :z-index="zIndex"
    @close="handleClose"
  >
    <div class="border-config-container">
      <!-- 选项卡导航 -->
      <u-tabs v-model="activeTab">
        <u-tab-pane :label="$t('tools.border.up')" index="top"></u-tab-pane>
        <u-tab-pane :label="$t('tools.border.down')" index="bottom"></u-tab-pane>
        <u-tab-pane :label="$t('tools.border.left')" index="left"></u-tab-pane>
        <u-tab-pane :label="$t('tools.border.right')" index="right"></u-tab-pane>
      </u-tabs>

      <!-- 选项卡内容 -->
      <div class="tab-content" style="padding-top: 20px">
        <u-form ref="form" :label-width="60">
          <!-- 上边框配置 -->
          <div v-show="activeTab === 'top'">
            <u-form-item :label="$t('tools.border.lineStyle')">
              <u-select v-model="localTopBorder.style">
                <u-option
                  v-for="option in lineStyleOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </u-form-item>
            <u-form-item :label="$t('tools.border.size')">
              <u-select v-model="localTopBorder.width">
                <u-option
                  v-for="option in lineWidthOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </u-form-item>
            <u-form-item :label="$t('tools.border.color')">
              <UColorPicker v-model="localTopBorder.color" />
            </u-form-item>
          </div>

          <!-- 下边框配置 -->
          <div v-show="activeTab === 'bottom'">
            <u-form-item :label="$t('tools.border.lineStyle')">
              <u-select v-model="localBottomBorder.style">
                <u-option
                  v-for="option in lineStyleOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </u-form-item>
            <u-form-item :label="$t('tools.border.size')">
              <u-select v-model="localBottomBorder.width">
                <u-option
                  v-for="option in lineWidthOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </u-form-item>
            <u-form-item :label="$t('tools.border.color')">
              <UColorPicker v-model="localBottomBorder.color" :inline="true" />
            </u-form-item>
          </div>

          <!-- 左边框配置 -->
          <div v-show="activeTab === 'left'">
            <u-form-item :label="$t('tools.border.lineStyle')">
              <u-select v-model="localLeftBorder.style">
                <u-option
                  v-for="option in lineStyleOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </u-form-item>
            <u-form-item :label="$t('tools.border.size')">
              <u-select v-model="localLeftBorder.width">
                <u-option
                  v-for="option in lineWidthOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </u-form-item>
            <u-form-item :label="$t('tools.border.color')">
              <UColorPicker v-model="localLeftBorder.color" :inline="true" />
            </u-form-item>
          </div>

          <!-- 右边框配置 -->
          <div v-show="activeTab === 'right'">
            <u-form-item :label="$t('tools.border.lineStyle')">
              <u-select v-model="localRightBorder.style">
                <u-option
                  v-for="option in lineStyleOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </u-form-item>
            <u-form-item :label="$t('tools.border.size')">
              <u-select v-model="localRightBorder.width">
                <u-option
                  v-for="option in lineWidthOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </u-form-item>
            <u-form-item :label="$t('tools.border.color')">
              <UColorPicker v-model="localRightBorder.color" :inline="true" />
            </u-form-item>
          </div>
        </u-form>
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
import UTabs from "@/components/tabs/index.vue";
import UTabPane from "@/components/tabs/pane.vue";
import UColorPicker from "@/components/color-picker/index.vue";
import UForm from '@/components/form/index.vue';
import UFormItem from '@/components/form-item/index.vue';
import { rgbToHex, hexToRgb } from '@/utils/color';

export default {
  name: 'CustomBorderDialog',
  components: {
    UColorPicker,
    UTabPane,
    UTabs,
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
      activeTab: 'top',
      localTopBorder: { style: 'solid', width: 1, color: '#000000' },
      localBottomBorder: { style: 'solid', width: 1, color: '#000000' },
      localLeftBorder: { style: 'solid', width: 1, color: '#000000' },
      localRightBorder: { style: 'solid', width: 1, color: '#000000' }
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.loadBorderData();
      }
    },
    cellStyle: {
      handler(newVal) {
        if (newVal) {
          this.loadBorderData();
        }
      },
      deep: true
    }
  },
  computed: {
    // 线型选项
    lineStyleOptions() {
      return [
        { value: 'solid', label: this.$t('tools.border.solidLine') },
        { value: 'dashed', label: this.$t('tools.border.dashed') },
        { value: 'none', label: this.$t('tools.border.none') }
      ];
    },
    // 线宽选项
    lineWidthOptions() {
      return Array.from({ length: 10 }, (_, i) => ({
        value: i + 1,
        label: (i + 1).toString()
      }));
    }
  },
  methods: {
    loadBorderData() {
      if (this.cellStyle) {
        if (this.cellStyle.topBorder) {
          this.localTopBorder = { ...this.cellStyle.topBorder };
          this.localTopBorder.color = this.rgbToHexIfNeeded(this.localTopBorder.color);
        }
        if (this.cellStyle.bottomBorder) {
          this.localBottomBorder = { ...this.cellStyle.bottomBorder };
          this.localBottomBorder.color = this.rgbToHexIfNeeded(this.localBottomBorder.color);
        }
        if (this.cellStyle.leftBorder) {
          this.localLeftBorder = { ...this.cellStyle.leftBorder };
          this.localLeftBorder.color = this.rgbToHexIfNeeded(this.localLeftBorder.color);
        }
        if (this.cellStyle.rightBorder) {
          this.localRightBorder = { ...this.cellStyle.rightBorder };
          this.localRightBorder.color = this.rgbToHexIfNeeded(this.localRightBorder.color);
        }
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
.tab-content {
  overflow: auto;
  height: 400px;
}
</style>
