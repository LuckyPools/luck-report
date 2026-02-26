<template>
  <div class="chart-option-editor">
    <!-- 标题选项 -->
      <fieldset class="fieldset-style">
        <legend class="legend-style">{{ $t('chart.titleConfig') }}</legend>
        <div class="form-group" style="margin-bottom: 10px">
          <label>{{ $t('chart.display') }}：</label>
          <div class="u-inline">
            <u-radio-group
                v-model="localChartOptions.title.display"
                @change="handleTitleDisplayChange"
            >
              <u-radio v-for="option in [{ label: $t('chart.yes'), value: true }, { label: $t('chart.no'), value: false }]"
                      :key="option.value"
                      :label="option.value">
                {{ option.label }}
              </u-radio>
            </u-radio-group>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 10px" v-show="titleDisplay">
          <label>{{ $t('chart.position') }}：</label>
          <div class="u-inline">
            <u-select
              :value="localChartOptions.title.position"
              :clearable="true"
              @change="handleTitlePositionChange"
            >
              <u-option
                v-for="option in positionOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
              />
            </u-select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 10px" v-show="titleDisplay">
          <label>{{ $t('chart.titleContent') }}：</label>
          <div class="u-inline">
            <u-input
                style="width: 250px;"
                v-model="localChartOptions.title.text"
                @change="handleTitleTextChange"
            >
            </u-input>
          </div>
        </div>
      </fieldset>

      <!-- 图例选项 -->
      <fieldset class="fieldset-style">
        <legend class="legend-style">{{ $t('chart.legendConfig') }}</legend>

        <div class="form-group" style="margin-bottom: 10px">
          <label>{{ $t('chart.display') }}：</label>
          <div class="u-inline">
            <u-radio-group
                v-model="localChartOptions.legend.display"
                @change="handleLegendDisplayChange"
            >
              <u-radio v-for="option in [{ label: $t('chart.yes'), value: true }, { label: $t('chart.no'), value: false }]"
                      :key="option.value"
                      :label="option.value">
                {{ option.label }}
              </u-radio>
            </u-radio-group>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 10px" v-show="legendDisplay">
          <label>{{ $t('chart.position') }}：</label>
          <div class="u-inline">
            <u-select
              :value="localChartOptions.legend.position"
              :clearable="true"
              @change="handleLegendPositionChange"
            >
              <u-option
                v-for="option in positionOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
              />
            </u-select>
          </div>
        </div>

      </fieldset>

      <!-- 数据标签选项 -->
      <fieldset v-if="showDataLabel" class="fieldset-style">
        <legend class="legend-style">{{ $t('chart.dataLabelConfig') }}</legend>
        <div class="form-group" style="margin-bottom: 10px">
          <label>{{ $t('chart.display') }}：</label>
          <div class="u-inline">
            <u-radio-group
                v-model="localChartOptions.dataLabels.display"
                @change="handleDataLabelsDisplayChange"
            >
              <u-radio v-for="option in [{ label: $t('chart.yes'), value: true }, { label: $t('chart.no'), value: false }]"
                      :key="option.value"
                      :label="option.value">
                {{ option.label }}
              </u-radio>
            </u-radio-group>
          </div>
        </div>
      </fieldset>

      <!-- 动画选项 -->
      <fieldset class="fieldset-style">
        <legend class="legend-style">{{ $t('chart.motionConfig') }}</legend>

        <div class="form-group" style="margin-bottom: 10px">
          <label>{{ $t('chart.motionDelay') }}：</label>
          <div class="u-inline">
            <u-input-number
                v-model="localChartOptions.animation.duration"
                @change="handleAnimationDurationChange"
            />
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 10px">
          <label>{{ $t('chart.effect') }}：</label>
          <div class="u-inline">
            <u-select
              :value="localChartOptions.animation.easing"
              :clearable="true"
              @change="handleAnimationEasingChange"
            >
              <u-option
                v-for="option in animationEasingOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
              />
            </u-select>
          </div>
        </div>
      </fieldset>

      <!-- 布局选项 -->
      <!-- todo 后台暂不支持 -->
      <fieldset v-if="false" class="fieldset-style">
        <legend class="legend-style">{{ $t('chart.layout') }}</legend>

        <div class="form-group" style="margin-bottom: 10px">
          <div style="display: inline-block;">
            <span style="margin-right: 10px;">{{ $t('chart.up') }}：</span>
            <div class="u-inline">
              <u-input-number
                  v-model="localChartOptions.layout.top"
                  @change="handleLayoutChange"
              />
            </div>
          </div>
          <div style="display: inline-block; margin-left: 10px;">
            <span style="margin-right: 10px;">{{ $t('chart.down') }}：</span>
            <div class="u-inline">
              <u-input-number
                  v-model="localChartOptions.layout.bottom"
                  @change="handleLayoutChange"
              />
            </div>
          </div>
          <div style="display: inline-block; margin-left: 10px;">
            <span style="margin-right: 10px;">{{ $t('chart.left') }}：</span>
            <div class="u-inline">
              <u-input-number
                  v-model="localChartOptions.layout.left"
                  @change="handleLayoutChange"
              />
            </div>
          </div>
          <div style="display: inline-block; margin-left: 10px;">
            <span style="margin-right: 10px;">{{ $t('chart.right') }}：</span>
            <div class="u-inline">
              <u-input-number
                  v-model="localChartOptions.layout.right"
                  @change="handleLayoutChange"
              />
            </div>
          </div>
        </div>
      </fieldset>
    </div>
</template>
<script>
import { setDirty } from '@/utils/table';
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UInputNumber from '@/components/input-number/index.vue';
import UInput from '@/components/input/index.vue';

export default {
  name: 'ChartOption',
  components: {
    URadioGroup,
    URadio,
    USelect,
    UOption,
    UInputNumber,
    UInput
  },
  props: {
    cellDef: {
      type: Object,
      default: () => ({})
    },
    chartOptions: {
      type: Object,
      required: true
    },
    showDataLabel: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      localChartOptions: {}
    };
  },
  created() {
    // 创建chartOptions的本地副本
    this.localChartOptions = JSON.parse(JSON.stringify(this.chartOptions));
  },
  watch: {
    chartOptions: {
      handler(newVal) {
        // 当外部chartOptions变化时，更新本地副本
        this.localChartOptions = JSON.parse(JSON.stringify(newVal));
      },
      deep: true
    }
  },
  computed: {
    // 位置选项数组
    positionOptions() {
      return [
        { value: 'top', label: this.$t('chart.up') },
        { value: 'bottom', label: this.$t('chart.down') },
        { value: 'left', label: this.$t('chart.left') },
        { value: 'right', label: this.$t('chart.right') }
      ];
    },
    // 动画效果选项数组
    animationEasingOptions() {
      return [
        { value: 'linear', label: 'linear' },
        { value: 'easeInQuad', label: 'easeInQuad' },
        { value: 'easeOutQuad', label: 'easeOutQuad' },
        { value: 'easeInOutQuad', label: 'easeInOutQuad' },
        { value: 'easeInCubic', label: 'easeInCubic' },
        { value: 'easeOutCubic', label: 'easeOutCubic' },
        { value: 'easeInOutCubic', label: 'easeInOutCubic' },
        { value: 'easeInQuart', label: 'easeInQuart' },
        { value: 'easeOutQuart', label: 'easeOutQuart' },
        { value: 'easeInOutQuart', label: 'easeInOutQuart' },
        { value: 'easeInQuint', label: 'easeInQuint' },
        { value: 'easeOutQuint', label: 'easeOutQuint' },
        { value: 'easeInOutQuint', label: 'easeInOutQuint' },
        { value: 'easeInSine', label: 'easeInSine' },
        { value: 'easeOutSine', label: 'easeOutSine' },
        { value: 'easeInOutSine', label: 'easeInOutSine' },
        { value: 'easeInExpo', label: 'easeInExpo' },
        { value: 'easeOutExpo', label: 'easeOutExpo' },
        { value: 'easeInOutExpo', label: 'easeInOutExpo' },
        { value: 'easeInCirc', label: 'easeInCirc' },
        { value: 'easeOutCirc', label: 'easeOutCirc' },
        { value: 'easeInOutCirc', label: 'easeInOutCirc' },
        { value: 'easeInElastic', label: 'easeInElastic' },
        { value: 'easeOutElastic', label: 'easeOutElastic' },
        { value: 'easeInOutElastic', label: 'easeInOutElastic' },
        { value: 'easeInBack', label: 'easeInBack' },
        { value: 'easeOutBack', label: 'easeOutBack' },
        { value: 'easeInOutBack', label: 'easeInOutBack' },
        { value: 'easeInBounce', label: 'easeInBounce' },
        { value: 'easeOutBounce', label: 'easeOutBounce' },
        { value: 'easeInOutBounce', label: 'easeInOutBounce' }
      ];
    },
    // 将标题显示的字符串值转换为boolean类型
    titleDisplay() {
      return this.localChartOptions.title.display === 'true' ? true :
             this.localChartOptions.title.display === 'false' ? false :
             this.localChartOptions.title.display;
    },
    // 将图例显示的字符串值转换为boolean类型
    legendDisplay() {
      return this.localChartOptions.legend.display === 'true' ? true :
             this.localChartOptions.legend.display === 'false' ? false :
             this.localChartOptions.legend.display;
    },
    // 将数据标签显示的字符串值转换为boolean类型
    dataLabelsDisplay() {
      return this.localChartOptions.dataLabels.display === 'true' ? true :
             this.localChartOptions.dataLabels.display === 'false' ? false :
             this.localChartOptions.dataLabels.display;
    }
  },
  methods: {
    /**
     * 处理标题显示变化
     */
    handleTitleDisplayChange(value) {
      this.localChartOptions.title.display = value;
      this.updateChartOption('title', this.localChartOptions.title);
    },

    /**
     * 处理标题位置变化
     */
    handleTitlePositionChange(value) {
      this.localChartOptions.title.position = value;
      this.updateChartOption('title', this.localChartOptions.title);
    },

    /**
     * 处理标题文本变化
     */
    handleTitleTextChange() {
      this.updateChartOption('title', this.localChartOptions.title);
    },

    /**
     * 处理图例显示变化
     */
    handleLegendDisplayChange(value) {
      this.localChartOptions.legend.display = value;
      this.updateChartOption('legend', this.localChartOptions.legend);
    },

    /**
     * 处理图例位置变化
     */
    handleLegendPositionChange(value) {
      this.localChartOptions.legend.position = value;
      this.updateChartOption('legend', this.localChartOptions.legend);
    },

    /**
     * 处理数据标签显示变化
     */
    handleDataLabelsDisplayChange(value) {
      if (!this.cellDef || !this.cellDef.value || !this.cellDef.value.chart) {
        return;
      }
      this.localChartOptions.dataLabels.display = value;

      const chart = this.cellDef.value.chart;
      if (!chart.plugins) {
        chart.plugins = [];
      }

      // 查找数据标签插件
      let dataLabelPlugin = chart.plugins.find(p => p.name === 'data-labels');
      if (dataLabelPlugin) {
        dataLabelPlugin.display = this.localChartOptions.dataLabels.display;
      } else {
        chart.plugins.push({
          name: 'data-labels',
          display: this.localChartOptions.dataLabels.display
        });
      }

      this.updateChart();
      setDirty();
    },

    /**
     * 处理动画持续时间变化
     */
    handleAnimationDurationChange() {
      this.updateChartOption('animation', this.localChartOptions.animation);
    },

    /**
     * 处理动画缓动变化
     */
    handleAnimationEasingChange(value) {
      this.localChartOptions.animation.easing = value;
      this.updateChartOption('animation', this.localChartOptions.animation);
    },

    /**
     * 处理布局变化
     */
    handleLayoutChange() {
      this.updateChartOption('layout', { layout: this.localChartOptions.layout });
    },

    /**
     * 更新图表选项
     */
    updateChartOption(type, option) {
      if (!this.cellDef || !this.cellDef.value || !this.cellDef.value.chart) {
        return;
      }

      const chart = this.cellDef.value.chart;
      if (!chart.options) {
        chart.options = [];
      }

      // 查找并更新选项
      let existingOption = chart.options.find(opt => opt.type === type);
      if (existingOption) {
        Object.assign(existingOption, option);
      } else {
        chart.options.push({ type, ...option });
      }

      this.updateChart();
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
.chart-option-editor {
  width: 100%;
}

fieldset {
  border-radius: 4px;
}

.fieldset-style {
  padding: 10px;
  border: solid 1px #dddddd;
  border-radius: 8px;
  margin-bottom: 10px;
  margin-top: 10px;
}

.legend-style {
  width: auto;
  margin-bottom: 1px;
  border-bottom: none;
  font-size: inherit;
  color: #4b4b4b;
}
</style>



