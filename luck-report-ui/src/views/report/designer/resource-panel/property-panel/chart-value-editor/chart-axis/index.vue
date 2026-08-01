<template>
  <div class="axis-config">
    <u-form :label-width="100" labelPosition="right">

      <div class="property-quote">
        {{ $t('chart.xAxis') }}
      </div>

      <u-form-item class="property-label" :label="$t('chart.titleRotation')">
        <u-input-number
          :title="$t('chart.angleScope')"
          v-model="localXAxesConfig.rotation"
          @change="handleXAxesRotationChange"
        >
        </u-input-number>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('chart.displayAxisTitle')">
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
      </u-form-item>

      <u-form-item class="property-label" :label="$t('chart.axisTitle')" v-show="xTitleDisplay">
        <u-input
          style="width: 250px;"
          v-model="localXAxesConfig.scaleLabel.labelString"
          @change="handleXTitleTextChange"
        >
        </u-input>
      </u-form-item>

      <div class="property-quote">
        {{ $t('chart.yAxisConfig') }}
      </div>

      <u-form-item class="property-label" :label="$t('chart.titleRotation')">
        <u-input-number
          :title="$t('chart.angleScope')"
          v-model="localYAxesConfig.rotation"
          @change="handleYAxesRotationChange"
        >
        </u-input-number>
      </u-form-item>

      <u-form-item class="property-label" :label="$t('chart.displayAxisTitle')">
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
      </u-form-item>

      <u-form-item class="property-label" :label="$t('chart.axisTitle')" v-show="yTitleDisplay">
        <u-input
          style="width: 250px;"
          v-model="localYAxesConfig.scaleLabel.labelString"
          @change="handleYTitleTextChange"
        >
        </u-input>
      </u-form-item>

      <div v-if="false" class="property-quote">
        {{ $t('chart.titleFormat') }}
      </div>

      <u-form-item v-if="false" class="property-label" :label="$t('chart.titleFormat')">
        <u-input
          style="width: 260px;"
          v-model="localFormat"
          @change="handleFormatChange"
        >
        </u-input>
      </u-form-item>

    </u-form>
  </div>
</template>

<script>
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import UInputNumber from '@/components/input-number/index.vue';
import UInput from '@/components/input/index.vue';
import UForm from "@/components/form/index.vue";
import UFormItem from "@/components/form-item/index.vue";

export default {
  name: 'Axis',
  components: {
    UForm,
    UFormItem,
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
    xTitleDisplay() {
      return this.localXAxesConfig.scaleLabel.display === 'true' ? true :
             this.localXAxesConfig.scaleLabel.display === 'false' ? false :
             this.localXAxesConfig.scaleLabel.display;
    },
    yTitleDisplay() {
      return this.localYAxesConfig.scaleLabel.display === 'true' ? true :
             this.localYAxesConfig.scaleLabel.display === 'false' ? false :
             this.localYAxesConfig.scaleLabel.display;
    }
  },
  watch: {
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
.axis-config {
  width: 100%;
}
</style>
