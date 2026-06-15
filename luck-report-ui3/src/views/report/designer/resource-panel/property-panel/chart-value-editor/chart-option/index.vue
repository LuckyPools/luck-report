<template>
  <div class="chart-option-editor">
    <div class="property-quote">
      {{ t('chart.titleConfig') }}
    </div>
    <a-form :label-col="{ style: { width: '100px' } }" :colon="false">
      <a-form-item class="property-label" :label="t('chart.display')">
        <a-radio-group
          v-model:value="localChartConfig.title.display"
          @change="handleTitleDisplayChange"
        >
          <a-radio
            v-for="option in displayOptions"
            :key="String(option.value)"
            :value="option.value"
          >
            {{ option.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item class="property-label" v-show="titleDisplay" :label="t('chart.position')">
        <a-select
          v-model:value="localChartConfig.title.position"
          :options="positionOptions"
          @change="handleTitlePositionChange"
        />
      </a-form-item>

      <a-form-item class="property-label" v-show="titleDisplay" :label="t('chart.titleContent')">
        <a-input
          style="width: 250px;"
          v-model:value="localChartConfig.title.text"
          @change="handleTitleTextChange"
        />
      </a-form-item>
    </a-form>

    <div class="property-quote">
      {{ t('chart.legendConfig') }}
    </div>
    <a-form :label-col="{ style: { width: '100px' } }" :colon="false">
      <a-form-item class="property-label" :label="t('chart.display')">
        <a-radio-group
          v-model:value="localChartConfig.legend.display"
          @change="handleLegendDisplayChange"
        >
          <a-radio
            v-for="option in displayOptions"
            :key="String(option.value)"
            :value="option.value"
          >
            {{ option.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item class="property-label" v-show="legendDisplay" :label="t('chart.position')">
        <a-select
          v-model:value="localChartConfig.legend.position"
          :options="positionOptions"
          @change="handleLegendPositionChange"
        />
      </a-form-item>
    </a-form>

    <template v-if="showDataLabel">
      <div class="property-quote">
        {{ t('chart.dataLabelConfig') }}
      </div>
      <a-form :label-col="{ style: { width: '100px' } }" :colon="false">
        <a-form-item class="property-label" :label="t('chart.display')">
          <a-radio-group
            v-model:value="localChartConfig.dataLabels.display"
            @change="handleDataLabelsDisplayChange"
          >
            <a-radio
              v-for="option in displayOptions"
              :key="String(option.value)"
              :value="option.value"
            >
              {{ option.label }}
            </a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </template>

    <div class="property-quote">
      {{ t('chart.motionConfig') }}
    </div>
    <a-form :label-col="{ style: { width: '100px' } }" :colon="false">
      <a-form-item class="property-label" :label="t('chart.motionDelay')">
        <a-input-number
          v-model:value="localChartConfig.animation.duration"
          @change="handleAnimationDurationChange"
          :min="0"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('chart.effect')">
        <a-select
          v-model:value="localChartConfig.animation.easing"
          :options="animationEasingOptions"
          @change="handleAnimationEasingChange"
        />
      </a-form-item>
    </a-form>

    <template v-if="false">
      <div class="property-quote">
        {{ t('chart.layout') }}
      </div>
      <a-form :label-col="{ style: { width: '100px' } }" :colon="false">
        <a-form-item class="property-label" :label="t('chart.up')">
          <a-input-number
            v-model:value="localChartConfig.layout.top"
            @change="handleLayoutChange"
          />
        </a-form-item>
        <a-form-item class="property-label" :label="t('chart.down')">
          <a-input-number
            v-model:value="localChartConfig.layout.bottom"
            @change="handleLayoutChange"
          />
        </a-form-item>
        <a-form-item class="property-label" :label="t('chart.left')">
          <a-input-number
            v-model:value="localChartConfig.layout.left"
            @change="handleLayoutChange"
          />
        </a-form-item>
        <a-form-item class="property-label" :label="t('chart.right')">
          <a-input-number
            v-model:value="localChartConfig.layout.right"
            @change="handleLayoutChange"
          />
        </a-form-item>
      </a-form>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * ChartOption 图表标题/图例/数据标签/动效配置子组件（vue3 + TS + ant-design-vue）
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ChartOption' })


const { t } = useI18n()
interface ChartTitle {
  display: boolean | string
  position: string
  text: string
}

interface ChartLegend {
  display: boolean | string
  position: string
}

interface ChartDataLabels {
  display: boolean | string
}

interface ChartAnimation {
  duration: number | null
  easing: string
}

interface ChartLayout {
  top: number | null
  bottom: number | null
  left: number | null
  right: number | null
}

interface ChartConfig {
  title: ChartTitle
  legend: ChartLegend
  dataLabels: ChartDataLabels
  animation: ChartAnimation
  layout: ChartLayout
}

interface SelectOption {
  value: string
  label: string
}

interface DisplayOption {
  value: boolean
  label: string
}

const props = withDefaults(
  defineProps<{
    chartConfig: ChartConfig
    showDataLabel?: boolean
  }>(),
  {
    showDataLabel: true
  }
)

const emit = defineEmits<{
  (e: 'chart-option-change', payload: { type: string; option: any }): void
  (e: 'data-labels-change', dataLabels: ChartDataLabels): void
}>()

// ====== 状态 ======
const localChartConfig = ref<ChartConfig>({
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
})

// ====== 选项 ======
const positionOptions = computed<SelectOption[]>(() => [
  { value: 'top', label: t('chart.up') },
  { value: 'bottom', label: t('chart.down') },
  { value: 'left', label: t('chart.left') },
  { value: 'right', label: t('chart.right') }
])

const animationEasingOptions = computed<SelectOption[]>(() => [
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
])

const displayOptions = computed<DisplayOption[]>(() => [
  { value: true, label: t('chart.yes') },
  { value: false, label: t('chart.no') }
])

const titleDisplay = computed<boolean>(() => {
  const v = localChartConfig.value.title.display
  if (v === 'true') return true
  if (v === 'false') return false
  return !!v
})

const legendDisplay = computed<boolean>(() => {
  const v = localChartConfig.value.legend.display
  if (v === 'true') return true
  if (v === 'false') return false
  return !!v
})

watch(
  () => props.chartConfig,
  (newVal) => {
    if (newVal) {
      localChartConfig.value = {
        title: { display: true, position: 'top', text: '', ...(newVal.title || {}) },
        legend: { display: true, position: 'bottom', ...(newVal.legend || {}) },
        dataLabels: { display: false, ...(newVal.dataLabels || {}) },
        animation: { duration: 1000, easing: 'linear', ...(newVal.animation || {}) },
        layout: { top: 0, bottom: 0, left: 0, right: 0, ...(newVal.layout || {}) }
      }
    }
  },
  { deep: true, immediate: true }
)

const updateChartOption = (type: string, option: any): void => {
  emit('chart-option-change', { type, option })
}

const handleTitleDisplayChange = (): void => {
  updateChartOption('title', localChartConfig.value.title)
}

const handleTitlePositionChange = (): void => {
  updateChartOption('title', localChartConfig.value.title)
}

const handleTitleTextChange = (): void => {
  updateChartOption('title', localChartConfig.value.title)
}

const handleLegendDisplayChange = (): void => {
  updateChartOption('legend', localChartConfig.value.legend)
}

const handleLegendPositionChange = (): void => {
  updateChartOption('legend', localChartConfig.value.legend)
}

const handleDataLabelsDisplayChange = (): void => {
  emit('data-labels-change', localChartConfig.value.dataLabels)
}

const handleAnimationDurationChange = (): void => {
  updateChartOption('animation', localChartConfig.value.animation)
}

const handleAnimationEasingChange = (): void => {
  updateChartOption('animation', localChartConfig.value.animation)
}

const handleLayoutChange = (): void => {
  updateChartOption('layout', { layout: localChartConfig.value.layout })
}
</script>

<style scoped>
.chart-option-editor {
  width: 100%;
}
</style>
