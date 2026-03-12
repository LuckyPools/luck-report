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
            style="width: 250px;"
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
            style="width: 250px;"
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
     * 处理X轴旋转角度变化
     */
    handleXAxesRotationChange() {
      this.$emit('update:xAxesConfig', this.localXAxesConfig);
      this.$emit('axis-change', { type: 'x-rotation', value: this.localXAxesConfig.rotation });
    },

    /**
     * 处理X轴标题显示变化
     */
    handleXTitleDisplayChange(value) {
      this.$emit('update:xAxesConfig', this.localXAxesConfig);
      this.$emit('axis-change', { type: 'x-title-display', value });
    },

    /**
     * 处理X轴标题文本变化
     */
    handleXTitleTextChange() {
      this.$emit('update:xAxesConfig', this.localXAxesConfig);
      this.$emit('axis-change', { type: 'x-title-text', value: this.localXAxesConfig.scaleLabel.labelString });
    },

    /**
     * 处理Y轴旋转角度变化
     */
    handleYAxesRotationChange() {
      this.$emit('update:yAxesConfig', this.localYAxesConfig);
      this.$emit('axis-change', { type: 'y-rotation', value: this.localYAxesConfig.rotation });
    },

    /**
     * 处理Y轴标题显示变化
     */
    handleYTitleDisplayChange(value) {
      this.$emit('update:yAxesConfig', this.localYAxesConfig);
      this.$emit('axis-change', { type: 'y-title-display', value });
    },

    /**
     * 处理Y轴标题文本变化
     */
    handleYTitleTextChange() {
      this.$emit('update:yAxesConfig', this.localYAxesConfig);
      this.$emit('axis-change', { type: 'y-title-text', value: this.localYAxesConfig.scaleLabel.labelString });
    },

    /**
     * 处理格式变化
     */
    handleFormatChange() {
      this.$emit('update:format', this.localFormat);
      this.$emit('axis-change', { type: 'format', value: this.localFormat });
    }
  }
};
</script>

<style scoped>
fieldset {
  border-radius: 4px;
}
</style>
