<template>
  <UDialog
    title="自定义边框"
    width="600px"
    :visible="visible"
    :z-index="20000"
    @close="handleClose"
  >
    <div class="border-config-container">
      <!-- 选项卡导航 -->
      <u-tabs v-model="activeTab" type="button">
        <u-tab-pane label="上" index="top"></u-tab-pane>
        <u-tab-pane label="下" index="bottom"></u-tab-pane>
        <u-tab-pane label="左" index="left"></u-tab-pane>
        <u-tab-pane label="右" index="right"></u-tab-pane>
      </u-tabs>

      <!-- 选项卡内容 -->
      <div class="tab-content" style="padding: 20px">
        <!-- 上边框配置 -->
        <div v-show="activeTab === 'top'" >
          <div class="form-group">
            <label>线型：</label>
            <div class="u-inline">
              <u-select
                v-model="topBorder.style"
                :clearable="true"
              >
                <u-option
                  v-for="option in styleOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>
          <div class="form-group">
            <label>尺寸：</label>
            <div class="u-inline">
              <u-select
                v-model="topBorder.width"
                :clearable="true"
              >
                <u-option
                  v-for="option in widthOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>
          <div class="form-group">
            <label>颜色：</label>
            <UColorPicker v-model="topBorder.color" />
          </div>
        </div>

        <!-- 下边框配置 -->
        <div v-show="activeTab === 'bottom'" >
          <div class="form-group">
            <label>线型：</label>
            <div class="u-inline">
              <u-select
                v-model="bottomBorder.style"
                :clearable="true"
              >
                <u-option
                  v-for="option in styleOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>
          <div class="form-group">
            <label>尺寸：</label>
            <div class="u-inline">
              <u-select
                 v-model="bottomBorder.width"
                :clearable="true"
              >
                <u-option
                  v-for="option in widthOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>
          <div class="form-group">
            <label>颜色：</label>
            <UColorPicker v-model="bottomBorder.color" />
          </div>
        </div>

        <!-- 左边框配置 -->
        <div v-show="activeTab === 'left'" >
          <div class="form-group">
            <label>线型：</label>
            <div class="u-inline">
              <u-select
                v-model="leftBorder.style"
                :clearable="true"
              >
                <u-option
                  v-for="option in styleOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>
          <div class="form-group">
            <label>尺寸：</label>
            <div class="u-inline">
              <u-select
                v-model="leftBorder.width"
                :clearable="true"
              >
                <u-option
                  v-for="option in widthOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>
          <div class="form-group">
            <label>颜色：</label>
            <UColorPicker v-model="leftBorder.color" />
          </div>
        </div>

        <!-- 右边框配置 -->
        <div v-show="activeTab === 'right'" >
          <div class="form-group">
            <label>线型：</label>
            <div class="u-inline">
              <u-select
                v-model="rightBorder.style"
                :clearable="true"
              >
                <u-option
                  v-for="option in styleOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>
          <div class="form-group">
            <label>尺寸：</label>
            <div class="u-inline">
              <u-select
                v-model="rightBorder.width"
                :clearable="true"
              >
                <u-option
                  v-for="option in widthOptions"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                />
              </u-select>
            </div>
          </div>
          <div class="form-group">
            <label>颜色：</label>
            <UColorPicker v-model="rightBorder.color" />
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
  name: 'ConditionParameterCustomBorderDialog',
  components: {
    UButton,
    UDialog,
    UColorPicker,
    USelect,
    UOption,
    UTabs,
    UTabPane
  },
  data() {
    return {
      visible: false,
      activeTab: 'top',
      cellStyle: null,
      // 边框配置
      topBorder: {
        style: 'solid',
        width: 1,
        color: '#000000'
      },
      bottomBorder: {
        style: 'solid',
        width: 1,
        color: '#000000'
      },
      leftBorder: {
        style: 'solid',
        width: 1,
        color: '#000000'
      },
      rightBorder: {
        style: 'solid',
        width: 1,
        color: '#000000'
      }
    };
  },
  computed: {
    // 线型选项
    styleOptions() {
      return [
        { value: 'solid', label: '实线' },
        { value: 'dashed', label: '虚线' },
        { value: 'none', label: '无' }
      ];
    },
    // 尺寸选项
    widthOptions() {
      const options = [];
      for (let i = 1; i <= 10; i++) {
        options.push({ value: i, label: i.toString() });
      }
      return options;
    }
  },
  methods: {

    show(cellStyle) {
      this.cellStyle = cellStyle;

      // 加载当前边框样式
      if (cellStyle && cellStyle.topBorder) {
        this.topBorder = { ...cellStyle.topBorder };
        // 如果颜色是RGB格式，转换为十六进制
        if (typeof this.topBorder.color === 'string' && this.topBorder.color.includes(',')) {
          const rgb = this.topBorder.color.split(',');
          this.topBorder.color = this.rgbToHex(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
        }
      }

      if (cellStyle && cellStyle.bottomBorder) {
        this.bottomBorder = { ...cellStyle.bottomBorder };
        if (typeof this.bottomBorder.color === 'string' && this.bottomBorder.color.includes(',')) {
          const rgb = this.bottomBorder.color.split(',');
          this.bottomBorder.color = this.rgbToHex(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
        }
      }

      if (cellStyle && cellStyle.leftBorder) {
        this.leftBorder = { ...cellStyle.leftBorder };
        if (typeof this.leftBorder.color === 'string' && this.leftBorder.color.includes(',')) {
          const rgb = this.leftBorder.color.split(',');
          this.leftBorder.color = this.rgbToHex(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
        }
      }

      if (cellStyle && cellStyle.rightBorder) {
        this.rightBorder = { ...cellStyle.rightBorder };
        if (typeof this.rightBorder.color === 'string' && this.rightBorder.color.includes(',')) {
          const rgb = this.rightBorder.color.split(',');
          this.rightBorder.color = this.rgbToHex(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
        }
      }

      this.visible = true;
    },
    handleClose() {
      this.visible = false;
    },
    handleOk() {
      if (this.cellStyle) {
        // 更新边框样式，将颜色转换为RGB格式
        this.cellStyle.topBorder = { ...this.topBorder };
        this.cellStyle.bottomBorder = { ...this.bottomBorder };
        this.cellStyle.leftBorder = { ...this.leftBorder };
        this.cellStyle.rightBorder = { ...this.rightBorder };

        // 转换颜色格式为RGB
        this.cellStyle.topBorder.color = this.hexToRgb(this.topBorder.color);
        this.cellStyle.bottomBorder.color = this.hexToRgb(this.bottomBorder.color);
        this.cellStyle.leftBorder.color = this.hexToRgb(this.leftBorder.color);
        this.cellStyle.rightBorder.color = this.hexToRgb(this.rightBorder.color);
      }
      this.visible = false;
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

</style>
