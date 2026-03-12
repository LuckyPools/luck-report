<template>
  <div class="chart-option-editor">
    <!-- 标题选项 -->
      <fieldset class="fieldset-style">
        <legend class="legend-style">{{ $t('chart.titleConfig') }}</legend>
        <div class="form-group" style="margin-bottom: 10px">
          <label>{{ $t('chart.display') }}：</label>
          <div class="u-inline">
            <u-radio-group
                v-model="localChartConfig.title.display"
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
              v-model="localChartConfig.title.position"
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
                v-model="localChartConfig.title.text"
                @change="handleTitleTextChange"
            >
            </u-input>
          </div>
        </div>
      </fieldset>

      <!-- 图例选项 -->
      <fieldset class="fieldset-style" >
        <legend class="legend-style">{{ $t('chart.legendConfig') }}</legend>

        <div class="form-group" style="margin-bottom: 10px">
          <label>{{ $t('chart.display') }}：</label>
          <div class="u-inline">
            <u-radio-group
                v-model="localChartConfig.legend.display"
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
              v-model="localChartConfig.legend.position"
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
                v-model="localChartConfig.dataLabels.display"
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
                v-model="localChartConfig.animation.duration"
                @change="handleAnimationDurationChange"
            />
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 10px">
          <label>{{ $t('chart.effect') }}：</label>
          <div class="u-inline">
            <u-select
              v-model="localChartConfig.animation.easing"
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
                  v-model="localChartConfig.layout.top"
                  @change="handleLayoutChange"
              />
            </div>
          </div>
          <div style="display: inline-block; margin-left: 10px;">
            <span style="margin-right: 10px;">{{ $t('chart.down') }}：</span>
            <div class="u-inline">
              <u-input-number
                  v-model="localChartConfig.layout.bottom"
                  @change="handleLayoutChange"
              />
            </div>
          </div>
          <div style="display: inline-block; margin-left: 10px;">
            <span style="margin-right: 10px;">{{ $t('chart.left') }}：</span>
            <div class="u-inline">
              <u-input-number
                  v-model="localChartConfig.layout.left"
                  @change="handleLayoutChange"
              />
            </div>
          </div>
          <div style="display: inline-block; margin-left: 10px;">
            <span style="margin-right: 10px;">{{ $t('chart.right') }}：</span>
            <div class="u-inline">
              <u-input-number
                  v-model="localChartConfig.layout.right"
                  @change="handleLayoutChange"
              />
            </div>
          </div>
        </div>
      </fieldset>
    </div>
</template>
<script>
import { deepCopy } from '@/components/utils';
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
    chartConfig: {
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
      localChartConfig: {
        title: {
          display: true,
          position: 'top',
          text: ''
        },
        legend: {
          display: true,
          position: 'bottom'
        },
        dataLabels: {
          display: false
        },
        animation: {
          duration: 1000,
          easing: 'linear'
        },
        layout: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        }
      }
    };
  },
  watch: {
    chartConfig: {
      handler(newVal) {
        this.localChartConfig = deepCopy(newVal);
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
          return this.localChartConfig.title.display === 'true' ? true :
              this.localChartConfig.title.display === 'false' ? false :
                  this.localChartConfig.title.display;
      },
      // 将图例显示的字符串值转换为boolean类型
      legendDisplay() {
          return this.localChartConfig.legend.display === 'true' ? true :
              this.localChartConfig.legend.display === 'false' ? false :
                  this.localChartConfig.legend.display;
      },
      // 将数据标签显示的字符串值转换为boolean类型
      dataLabelsDisplay() {
          return this.localChartConfig.dataLabels.display === 'true' ? true :
              this.localChartConfig.dataLabels.display === 'false' ? false :
                  this.localChartConfig.dataLabels.display;
      },
  },
  methods: {
    /**
     * 处理标题显示变化
     */
    handleTitleDisplayChange() {
      this.updateChartOption('title', this.localChartConfig.title);
    },

    /**
     * 处理标题位置变化
     */
    handleTitlePositionChange() {
      this.updateChartOption('title', this.localChartConfig.title);
    },

    /**
     * 处理标题文本变化
     */
    handleTitleTextChange() {
      this.updateChartOption('title', this.localChartConfig.title);
    },

    /**
     * 处理图例显示变化
     */
    handleLegendDisplayChange() {
      this.updateChartOption('legend', this.localChartConfig.legend);
    },

    /**
     * 处理图例位置变化
     */
    handleLegendPositionChange() {
      this.updateChartOption('legend', this.localChartConfig.legend);
    },

    /**
     * 处理数据标签显示变化
     */
    handleDataLabelsDisplayChange() {
      this.$emit('data-labels-change', this.localChartConfig.dataLabels);
    },

    /**
     * 处理动画持续时间变化
     */
    handleAnimationDurationChange() {
      this.updateChartOption('animation', this.localChartConfig.animation);
    },

    /**
     * 处理动画缓动变化
     */
    handleAnimationEasingChange() {
      this.updateChartOption('animation', this.localChartConfig.animation);
    },

    /**
     * 处理布局变化
     */
    handleLayoutChange() {
      this.updateChartOption('layout', { layout: this.localChartConfig.layout });
    },

    /**
     * 更新图表选项
     */
    updateChartOption(type, option) {
      this.$emit('chart-option-change', { type, option });
    },


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



