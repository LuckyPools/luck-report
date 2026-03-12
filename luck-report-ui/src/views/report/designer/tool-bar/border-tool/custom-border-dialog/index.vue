<template>
  <UDialog
    :title="$t('tools.border.customBorderLine')"
    width="400px"
    :visible="visible"
    @close="$emit('close')"
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
      <div class="tab-content" style="padding: 20px">
        <!-- 上边框配置 -->
        <div v-show="activeTab === 'top'" >
          <div class="form-group">
            <label>{{ $t('tools.border.lineStyle') }}：</label>
            <div class="u-inline">
              <u-select
                v-model="localTopBorder.style"
              >
                <u-option
                  v-for="option in lineStyleOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>
          <div class="form-group">
            <label>{{ $t('tools.border.size') }}：</label>
            <div class="u-inline">
              <u-select
                v-model="localTopBorder.width"
              >
                <u-option
                  v-for="option in lineWidthOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>
          <div class="form-group">
            <label>{{ $t('tools.border.color') }}：</label>
            <UColorPicker v-model="localTopBorder.color" />
          </div>
        </div>

        <!-- 下边框配置 -->
        <div v-show="activeTab === 'bottom'" >
          <div class="form-group">
            <label>{{ $t('tools.border.lineStyle') }}：</label>
            <div class="u-inline">
              <u-select
                v-model="localBottomBorder.style"
              >
                <u-option
                  v-for="option in lineStyleOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>
          <div class="form-group">
            <label>{{ $t('tools.border.size') }}：</label>
            <div class="u-inline">
              <u-select
                v-model="localBottomBorder.width"
              >
                <u-option
                  v-for="option in lineWidthOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>
          <div class="form-group">
            <label>{{ $t('tools.border.color') }}：</label>
            <UColorPicker v-model="localBottomBorder.color" :inline="true" />
          </div>
        </div>

        <!-- 左边框配置 -->
        <div v-show="activeTab === 'left'" >
          <div class="form-group">
            <label>{{ $t('tools.border.lineStyle') }}：</label>
            <div class="u-inline">
              <u-select
                v-model="localLeftBorder.style"
              >
                <u-option
                  v-for="option in lineStyleOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>
          <div class="form-group">
            <label>{{ $t('tools.border.size') }}：</label>
            <div class="u-inline">
              <u-select
                v-model="localLeftBorder.width"
              >
                <u-option
                  v-for="option in lineWidthOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>
          <div class="form-group">
            <label>{{ $t('tools.border.color') }}：</label>
            <UColorPicker v-model="localLeftBorder.color" :inline="true" />
          </div>
        </div>

        <!-- 右边框配置 -->
        <div v-show="activeTab === 'right'" >
          <div class="form-group">
            <label>{{ $t('tools.border.lineStyle') }}：</label>
            <div class="u-inline">
              <u-select
                v-model="localRightBorder.style"
              >
                <u-option
                  v-for="option in lineStyleOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>
          <div class="form-group">
            <label>{{ $t('tools.border.size') }}：</label>
            <div class="u-inline">
              <u-select
                v-model="localRightBorder.width"
              >
                <u-option
                  v-for="option in lineWidthOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>
          <div class="form-group">
            <label>{{ $t('tools.border.color') }}：</label>
            <UColorPicker v-model="localRightBorder.color" :inline="true" />
          </div>
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
import UTabs from "@/components/tabs/index.vue";
import UTabPane from "@/components/tabs/pane.vue";
import UColorPicker from "@/components/color-picker/index.vue";

export default {
  name: 'CustomBorderDialog',
  components: {
    UColorPicker,
    UTabPane,
    UTabs,
    UButton,
    UDialog,
    USelect,
    UOption
  },
  props: {
    visible: {
      type: Boolean,
      default: false
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
        this.localTopBorder = { ...this.topBorder };
        this.localBottomBorder = { ...this.bottomBorder };
        this.localLeftBorder = { ...this.leftBorder };
        this.localRightBorder = { ...this.rightBorder };
      }
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
    handleClose() {
      this.$emit('close');
    },
    handleOk() {
      const topBorder = { ...this.localTopBorder };
      const bottomBorder = { ...this.localBottomBorder };
      const leftBorder = { ...this.localLeftBorder };
      const rightBorder = { ...this.localRightBorder };

      topBorder.color = this.hexToRgb(this.localTopBorder.color);
      bottomBorder.color = this.hexToRgb(this.localBottomBorder.color);
      leftBorder.color = this.hexToRgb(this.localLeftBorder.color);
      rightBorder.color = this.hexToRgb(this.localRightBorder.color);

      this.$emit('save', topBorder, bottomBorder, leftBorder, rightBorder);
      this.$emit('close');
    },
    hexToRgb(hex) {
      // 如果已经是RGB格式，直接返回
      if (typeof hex === 'string' && hex.includes(',')) {
        return hex;
      }

      // 将十六进制转换为RGB
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ?
        `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` :
        '0,0,0';
    },
    rgbToHex(r, g, b) {
      return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
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
