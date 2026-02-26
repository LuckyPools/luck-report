<template>
  <div class="axis-config">
    <!-- X轴配置 -->
    <fieldset class="fieldset-style">
      <legend class="legend-style">{{ $t('chart.xAxis') }}</legend>

      <!-- X轴旋转角度 -->
      <div class="form-group" style="margin-bottom: 10px;display:inline-block;margin-right: 20px">
        <label>{{ $t('chart.titleRotation') }}：</label>
        <div class="u-inline">
          <u-input-number
            :title="$t('chart.angleScope')"
            v-model="localXAxesConfig.rotation"
            @change="handleXAxesRotationChange"
          >
          </u-input-number>
        </div>
      </div>

      <!-- X轴标题显示 -->
      <div class="form-group" style="margin-bottom: 10px">
        <label>{{ $t('chart.displayAxisTitle') }}：</label>
        <div class="u-inline">
          <u-radio-group
            v-model="localXAxesConfig.scaleLabel.display"
            @change="handleXTitleDisplayChange"
          >
            <u-radio v-for="option in [{ label: $t('chart.yes'), value: true }, { label: $t('chart.no'), value: false }]"
                      :key="option.value"
                      :label="option.value">
              {{ option.label }}
            </u-radio>
          </u-radio-group>
        </div>
      </div>

      <!-- X轴标题文本 -->
      <div class="form-group" style="margin-bottom: 0" v-show="xTitleDisplay">
        <label>{{ $t('chart.axisTitle') }}：</label>
        <div class="u-inline">
          <u-input
            style="width: 288px;"
            v-model="localXAxesConfig.scaleLabel.labelString"
            @change="handleXTitleTextChange"
          >
          </u-input>
        </div>
      </div>
    </fieldset>

    <!-- Y轴配置 -->
    <fieldset class="fieldset-style">
      <legend class="legend-style">{{ $t('chart.yAxisConfig') }}</legend>

      <!-- Y轴旋转角度 -->
      <div class="form-group" style="margin-bottom: 10px;display:inline-block;margin-right: 20px">
        <label>{{ $t('chart.titleRotation') }}：</label>
        <div class="u-inline">
          <u-input-number
            :title="$t('chart.angleScope')"
            v-model="localYAxesConfig.rotation"
            @change="handleYAxesRotationChange"
          >
          </u-input-number>
        </div>
      </div>

      <!-- Y轴标题显示 -->
      <div class="form-group" style="margin-bottom: 10px">
        <label>{{ $t('chart.displayAxisTitle') }}：</label>
        <div class="u-inline">
          <u-radio-group
            v-model="localYAxesConfig.scaleLabel.display"
            @change="handleYTitleDisplayChange"
          >
            <u-radio v-for="option in [{ label: $t('chart.yes'), value: true }, { label: $t('chart.no'), value: false }]"
                      :key="option.value"
                      :label="option.value">
              {{ option.label }}
            </u-radio>
          </u-radio-group>
        </div>
      </div>

      <!-- Y轴标题文本 -->
      <div class="form-group" style="margin-bottom: 0" v-show="yTitleDisplay">
        <label>{{ $t('chart.axisTitle') }}：</label>
        <div class="u-inline">
          <u-input
            style="width: 288px;"
            v-model="localYAxesConfig.scaleLabel.labelString"
            @change="handleYTitleTextChange"
          >
          </u-input>
        </div>
      </div>
    </fieldset>

    <!-- 格式化配置 -->
    <!-- todo 后台暂不支持 -->
    <fieldset v-if="false" class="fieldset-style">
      <legend class="legend-style">{{ $t('chart.titleFormat') }}</legend>

      <!-- 格式化输入框 -->
      <div class="form-group" style="margin-bottom: 10px">
        <label>{{ $t('chart.titleFormat') }}：</label>
        <div class="u-inline">
          <u-input
            style="width: 260px;"
            v-model="localFormat"
            @change="handleFormatChange"
          >
          </u-input>
        </div>
      </div>
    </fieldset>
  </div>
</template>

<script>
import { setDirty } from '@/utils/table';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import UInputNumber from '@/components/input-number/index.vue';
import UInput from '@/components/input/index.vue';

export default {
  name: 'Axis',
  components: {
    URadioGroup,
    URadio,
    UInputNumber,
    UInput
  },
  props: {
    cellDef: {
      type: Object,
      default: () => ({})
    },
    xAxesConfig: {
      type: Object,
      default: () => ({
        rotation: 0,
        scaleLabel: {
          display: false,
          labelString: ''
        }
      })
    },
    yAxesConfig: {
      type: Object,
      default: () => ({
        rotation: 0,
        scaleLabel: {
          display: false,
          labelString: ''
        }
      })
    },
    format: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      // 创建本地副本，避免直接修改props
      localXAxesConfig: {
        rotation: this.xAxesConfig.rotation,
        scaleLabel: {
          display: this.xAxesConfig.scaleLabel.display,
          labelString: this.xAxesConfig.scaleLabel.labelString
        }
      },
      localYAxesConfig: {
        rotation: this.yAxesConfig.rotation,
        scaleLabel: {
          display: this.yAxesConfig.scaleLabel.display,
          labelString: this.yAxesConfig.scaleLabel.labelString
        }
      },
      localFormat: this.format
    };
  },
  computed: {
    // 将X轴标题显示的字符串值转换为boolean类型
    xTitleDisplay() {
      return this.localXAxesConfig.scaleLabel.display === 'true' ? true :
             this.localXAxesConfig.scaleLabel.display === 'false' ? false :
             this.localXAxesConfig.scaleLabel.display;
    },
    // 将Y轴标题显示的字符串值转换为boolean类型
    yTitleDisplay() {
      return this.localYAxesConfig.scaleLabel.display === 'true' ? true :
             this.localYAxesConfig.scaleLabel.display === 'false' ? false :
             this.localYAxesConfig.scaleLabel.display;
    }
  },
  watch: {
    // 监听props变化，更新本地数据
    xAxesConfig: {
      handler(newVal) {
        this.localXAxesConfig = {
          rotation: newVal.rotation,
          scaleLabel: {
            display: newVal.scaleLabel.display,
            labelString: newVal.scaleLabel.labelString
          }
        };
      },
      deep: true
    },
    yAxesConfig: {
      handler(newVal) {
        this.localYAxesConfig = {
          rotation: newVal.rotation,
          scaleLabel: {
            display: newVal.scaleLabel.display,
            labelString: newVal.scaleLabel.labelString
          }
        };
      },
      deep: true
    },
    format(newVal) {
      this.localFormat = newVal;
    }
  },
  methods: {
    /**
     * 获取X轴配置
     */
    getXAxesConfig() {
      if (!this.cellDef || !this.cellDef.value || !this.cellDef.value.chart) {
        return {};
      }

      let chart = this.cellDef.value.chart;
      if (!chart.xaxes) {
        chart.xaxes = {};
      }
      return chart.xaxes;
    },

    /**
     * 获取Y轴配置
     */
    getYAxesConfig() {
      if (!this.cellDef || !this.cellDef.value || !this.cellDef.value.chart) {
        return {};
      }

      let chart = this.cellDef.value.chart;
      if (!chart.yaxes) {
        chart.yaxes = {};
      }
      return chart.yaxes;
    },

    /**
     * 获取数据集配置
     */
    getDatasetConfig() {
      if (!this.cellDef || !this.cellDef.value || !this.cellDef.value.chart) {
        return {};
      }
      return this.cellDef.value.chart.dataset || {};
    },

    /**
     * 处理X轴旋转角度变化
     */
    handleXAxesRotationChange() {
      const xaxes = this.getXAxesConfig();
      xaxes.rotation = this.localXAxesConfig.rotation;

      // 通知父组件更新
      this.$emit('update:xAxesConfig', this.localXAxesConfig);

      // 更新图表
      if (this.cellDef && this.cellDef.chartWidget && this.cellDef.chartWidget.chart) {
        const chart = this.cellDef.chartWidget.chart;
        if (!chart.options) {
          chart.options = {};
        }
        if (!chart.options.scales) {
          chart.options.scales = {};
        }
        if (!chart.options.scales.xAxes) {
          chart.options.scales.xAxes = [];
        }
        if (chart.options.scales.xAxes.length > 0) {
          if (!chart.options.scales.xAxes[0].ticks) {
            chart.options.scales.xAxes[0].ticks = {};
          }
          chart.options.scales.xAxes[0].ticks.minRotation = xaxes.rotation;
        } else {
          // 如果xAxes为空，创建一个新的轴配置
          chart.options.scales.xAxes.push({
            ticks: {
              minRotation: xaxes.rotation
            }
          });
        }
        this.updateChart();
      }
      setDirty();
    },

    /**
     * 处理X轴标题显示变化
     */
    handleXTitleDisplayChange(value) {
      const xaxes = this.getXAxesConfig();
      if (!xaxes.scaleLabel) {
        xaxes.scaleLabel = {};
      }
      // 使用计算属性确保display是boolean类型
      xaxes.scaleLabel.display = value;

      // 通知父组件更新
      this.$emit('update:xAxesConfig', this.localXAxesConfig);

      // 更新图表
      if (this.cellDef && this.cellDef.chartWidget && this.cellDef.chartWidget.chart) {
        const chart = this.cellDef.chartWidget.chart;
        if (!chart.options) {
          chart.options = {};
        }
        if (!chart.options.scales) {
          chart.options.scales = {};
        }
        if (!chart.options.scales.xAxes) {
          chart.options.scales.xAxes = [];
        }
        if (chart.options.scales.xAxes.length > 0) {
          if (!chart.options.scales.xAxes[0].scaleLabel) {
            chart.options.scales.xAxes[0].scaleLabel = {};
          }
          chart.options.scales.xAxes[0].scaleLabel.display = this.xTitleDisplay;
        } else {
          // 如果xAxes为空，创建一个新的轴配置
          chart.options.scales.xAxes.push({
            scaleLabel: {
              display: this.xTitleDisplay
            }
          });
        }
        this.updateChart();
      }
      setDirty();
    },

    /**
     * 处理X轴标题文本变化
     */
    handleXTitleTextChange() {
      const xaxes = this.getXAxesConfig();
      if (!xaxes.scaleLabel) {
        xaxes.scaleLabel = {};
      }
      xaxes.scaleLabel.labelString = this.localXAxesConfig.scaleLabel.labelString;

      // 通知父组件更新
      this.$emit('update:xAxesConfig', this.localXAxesConfig);

      // 更新图表
      if (this.cellDef && this.cellDef.chartWidget && this.cellDef.chartWidget.chart) {
        const chart = this.cellDef.chartWidget.chart;
        if (!chart.options) {
          chart.options = {};
        }
        if (!chart.options.scales) {
          chart.options.scales = {};
        }
        if (!chart.options.scales.xAxes) {
          chart.options.scales.xAxes = [];
        }
        if (chart.options.scales.xAxes.length > 0) {
          if (!chart.options.scales.xAxes[0].scaleLabel) {
            chart.options.scales.xAxes[0].scaleLabel = {};
          }
          chart.options.scales.xAxes[0].scaleLabel.labelString = xaxes.scaleLabel.labelString;
        }
        this.updateChart();
      }
      setDirty();
    },

    /**
     * 处理Y轴旋转角度变化
     */
    handleYAxesRotationChange() {
      const yaxes = this.getYAxesConfig();
      yaxes.rotation = this.localYAxesConfig.rotation;

      // 通知父组件更新
      this.$emit('update:yAxesConfig', this.localYAxesConfig);

      // 更新图表
      if (this.cellDef && this.cellDef.chartWidget && this.cellDef.chartWidget.chart) {
        const chart = this.cellDef.chartWidget.chart;
        if (!chart.options) {
          chart.options = {};
        }
        if (!chart.options.scales) {
          chart.options.scales = {};
        }
        if (!chart.options.scales.yAxes) {
          chart.options.scales.yAxes = [];
        }
        if (chart.options.scales.yAxes.length > 0) {
          if (!chart.options.scales.yAxes[0].ticks) {
            chart.options.scales.yAxes[0].ticks = {};
          }
          chart.options.scales.yAxes[0].ticks.minRotation = yaxes.rotation;
        } else {
          // 如果yAxes为空，创建一个新的轴配置
          chart.options.scales.yAxes.push({
            ticks: {
              minRotation: yaxes.rotation
            }
          });
        }
        this.updateChart();
      }
      setDirty();
    },

    /**
     * 处理Y轴标题显示变化
     */
    handleYTitleDisplayChange(value) {
      const yaxes = this.getYAxesConfig();
      if (!yaxes.scaleLabel) {
        yaxes.scaleLabel = {};
      }
      // 使用计算属性确保display是boolean类型
      yaxes.scaleLabel.display = value;

      // 通知父组件更新
      this.$emit('update:yAxesConfig', this.localYAxesConfig);

      // 更新图表
      if (this.cellDef && this.cellDef.chartWidget && this.cellDef.chartWidget.chart) {
        const chart = this.cellDef.chartWidget.chart;
        if (!chart.options) {
          chart.options = {};
        }
        if (!chart.options.scales) {
          chart.options.scales = {};
        }
        if (!chart.options.scales.yAxes) {
          chart.options.scales.yAxes = [];
        }
        if (chart.options.scales.yAxes.length > 0) {
          if (!chart.options.scales.yAxes[0].scaleLabel) {
            chart.options.scales.yAxes[0].scaleLabel = {};
          }
          chart.options.scales.yAxes[0].scaleLabel.display = this.yTitleDisplay;
        } else {
          // 如果yAxes为空，创建一个新的轴配置
          chart.options.scales.yAxes.push({
            scaleLabel: {
              display: this.yTitleDisplay
            }
          });
        }
        this.updateChart();
      }
      setDirty();
    },

    /**
     * 处理Y轴标题文本变化
     */
    handleYTitleTextChange() {
      const yaxes = this.getYAxesConfig();
      if (!yaxes.scaleLabel) {
        yaxes.scaleLabel = {};
      }
      yaxes.scaleLabel.labelString = this.localYAxesConfig.scaleLabel.labelString;

      // 通知父组件更新
      this.$emit('update:yAxesConfig', this.localYAxesConfig);

      // 更新图表
      if (this.cellDef && this.cellDef.chartWidget && this.cellDef.chartWidget.chart) {
        const chart = this.cellDef.chartWidget.chart;
        if (!chart.options) {
          chart.options = {};
        }
        if (!chart.options.scales) {
          chart.options.scales = {};
        }
        if (!chart.options.scales.yAxes) {
          chart.options.scales.yAxes = [];
        }
        if (chart.options.scales.yAxes.length > 0) {
          if (!chart.options.scales.yAxes[0].scaleLabel) {
            chart.options.scales.yAxes[0].scaleLabel = {};
          }
          chart.options.scales.yAxes[0].scaleLabel.labelString = yaxes.scaleLabel.labelString;
        }
        this.updateChart();
      }
      setDirty();
    },

    /**
     * 处理格式变化
     */
    handleFormatChange() {
      const dataset = this.getDatasetConfig();
      dataset.format = this.localFormat;

      // 通知父组件更新
      this.$emit('update:format', this.localFormat);

      // 更新图表的格式配置
      if (this.cellDef && this.cellDef.chartWidget && this.cellDef.chartWidget.chart) {
        const chart = this.cellDef.chartWidget.chart;
        if (!chart.options) {
          chart.options = {};
        }
        if (!chart.options.scales) {
          chart.options.scales = {};
        }
        if (!chart.options.scales.xAxes) {
          chart.options.scales.xAxes = [];
        }
        if (chart.options.scales.xAxes.length > 0) {
          if (!chart.options.scales.xAxes[0].ticks) {
            chart.options.scales.xAxes[0].ticks = {};
          }
          chart.options.scales.xAxes[0].ticks.callback = function(value) {
            return window.formatValue(value, dataset.format);
          };
        }
        this.updateChart();
      }
      setDirty();
    },

    /**
     * 更新图表
     */
    updateChart() {
      if (this.cellDef && this.cellDef.chartWidget && this.cellDef.chartWidget.chart) {
        this.cellDef.chartWidget.chart.update();
      }
    }
  }
};
</script>

<style scoped>
fieldset {
  border-radius: 4px;
}
</style>
