<template>
  <div class="chart-option-editor">
    <div class="property-quote">
      {{ $t('chart.titleConfig') }}
    </div>
    <u-form :label-width="100" labelPosition="right">
      <u-form-item class="property-label" :label="$t('chart.display')">
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
      </u-form-item>

      <u-form-item class="property-label" v-show="titleDisplay" :label="$t('chart.position')">
        <u-select
          v-model="localChartConfig.title.position"
          @change="handleTitlePositionChange"
        >
          <u-option
            v-for="option in positionOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </u-form-item>

      <u-form-item class="property-label" v-show="titleDisplay" :label="$t('chart.titleContent')">
        <u-input
            style="width: 250px;"
            v-model="localChartConfig.title.text"
            @change="handleTitleTextChange"
        >
        </u-input>
      </u-form-item>
    </u-form>

    <div class="property-quote">
      {{ $t('chart.legendConfig') }}
    </div>
    <u-form :label-width="100" labelPosition="right">
      <u-form-item class="property-label" :label="$t('chart.display')">
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
      </u-form-item>

      <u-form-item class="property-label" v-show="legendDisplay" :label="$t('chart.position')">
        <u-select
          v-model="localChartConfig.legend.position"
          @change="handleLegendPositionChange"
        >
          <u-option
            v-for="option in positionOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </u-form-item>
    </u-form>

    <template v-if="showDataLabel">
      <div class="property-quote">
        {{ $t('chart.dataLabelConfig') }}
      </div>
      <u-form :label-width="100" labelPosition="right">
        <u-form-item class="property-label" :label="$t('chart.display')">
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
        </u-form-item>
      </u-form>
    </template>

    <div class="property-quote">
      {{ $t('chart.motionConfig') }}
    </div>
    <u-form :label-width="100" labelPosition="right">
      <u-form-item class="property-label" :label="$t('chart.motionDelay')">
        <u-input-number
            v-model="localChartConfig.animation.duration"
            @change="handleAnimationDurationChange"
            :min="0"
        />
      </u-form-item>

      <u-form-item class="property-label" :label="$t('chart.effect')">
        <u-select
          v-model="localChartConfig.animation.easing"
          @change="handleAnimationEasingChange"
        >
          <u-option
            v-for="option in animationEasingOptions"
            :key="option.value"
            :value="option.value"
            :label="option.label"
          />
        </u-select>
      </u-form-item>
    </u-form>

    <template v-if="false">
      <div class="property-quote">
        {{ $t('chart.layout') }}
      </div>
      <u-form :label-width="100" labelPosition="right">
        <u-form-item class="property-label" :label="$t('chart.up')">
          <u-input-number
              v-model="localChartConfig.layout.top"
              @change="handleLayoutChange"
          />
        </u-form-item>
        <u-form-item class="property-label" :label="$t('chart.down')">
          <u-input-number
              v-model="localChartConfig.layout.bottom"
              @change="handleLayoutChange"
          />
        </u-form-item>
        <u-form-item class="property-label" :label="$t('chart.left')">
          <u-input-number
              v-model="localChartConfig.layout.left"
              @change="handleLayoutChange"
          />
        </u-form-item>
        <u-form-item class="property-label" :label="$t('chart.right')">
          <u-input-number
              v-model="localChartConfig.layout.right"
              @change="handleLayoutChange"
          />
        </u-form-item>
      </u-form>
    </template>
  </div>
</template>
<script>
import URadioGroup from '@/components/radio-group/index.vue';
import URadio from '@/components/radio/index.vue';
import USelect from '@/components/select/index.vue';
import UOption from '@/components/option/index.vue';
import UInputNumber from '@/components/input-number/index.vue';
import UInput from '@/components/input/index.vue';
import UForm from "@/components/form/index.vue";
import UFormItem from "@/components/form-item/index.vue";

export default {
  name: 'ChartOption',
  components: {
    UForm,
    UFormItem,
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
        if (newVal) {
          this.localChartConfig = {
            title: { display: true, position: 'top', text: '', ...(newVal.title || {}) },
            legend: { display: true, position: 'bottom', ...(newVal.legend || {}) },
            dataLabels: { display: false, ...(newVal.dataLabels || {}) },
            animation: { duration: 1000, easing: 'linear', ...(newVal.animation || {}) },
            layout: { top: 0, bottom: 0, left: 0, right: 0, ...(newVal.layout || {}) }
          };
        }
      },
      deep: true,
      immediate: true
    }
  },
  computed: {
      positionOptions() {
          return [
              { value: 'top', label: this.$t('chart.up') },
              { value: 'bottom', label: this.$t('chart.down') },
              { value: 'left', label: this.$t('chart.left') },
              { value: 'right', label: this.$t('chart.right') }
          ];
      },
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
      titleDisplay() {
          return this.localChartConfig.title.display === 'true' ? true :
              this.localChartConfig.title.display === 'false' ? false :
                  this.localChartConfig.title.display;
      },
      legendDisplay() {
          return this.localChartConfig.legend.display === 'true' ? true :
              this.localChartConfig.legend.display === 'false' ? false :
                  this.localChartConfig.legend.display;
      },
      dataLabelsDisplay() {
          return this.localChartConfig.dataLabels.display === 'true' ? true :
              this.localChartConfig.dataLabels.display === 'false' ? false :
                  this.localChartConfig.dataLabels.display;
      },
  },
  methods: {
    handleTitleDisplayChange() {
      this.updateChartOption('title', this.localChartConfig.title);
    },

    handleTitlePositionChange() {
      this.updateChartOption('title', this.localChartConfig.title);
    },

    handleTitleTextChange() {
      this.updateChartOption('title', this.localChartConfig.title);
    },

    handleLegendDisplayChange() {
      this.updateChartOption('legend', this.localChartConfig.legend);
    },

    handleLegendPositionChange() {
      this.updateChartOption('legend', this.localChartConfig.legend);
    },

    handleDataLabelsDisplayChange() {
      this.$emit('data-labels-change', this.localChartConfig.dataLabels);
    },

    handleAnimationDurationChange() {
      this.updateChartOption('animation', this.localChartConfig.animation);
    },

    handleAnimationEasingChange() {
      this.updateChartOption('animation', this.localChartConfig.animation);
    },

    handleLayoutChange() {
      this.updateChartOption('layout', { layout: this.localChartConfig.layout });
    },

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
</style>
