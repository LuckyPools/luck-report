<template>
  <div class="axis-config">
    <a-form :label-col="{ style: { width: '100px' } }" >

      <div class="property-quote">
        {{ t('chart.xAxis') }}
      </div>

      <a-form-item class="property-label" :label="t('chart.titleRotation')">
        <a-input-number
          :title="t('chart.angleScope')"
          v-model:value="localXAxesConfig.rotation"
          @change="handleXAxesRotationChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('chart.displayAxisTitle')">
        <a-radio-group
          v-model:value="localXAxesConfig.scaleLabel.display"
          @change="handleXTitleDisplayChange"
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

      <a-form-item class="property-label" :label="t('chart.axisTitle')" v-show="xTitleDisplay">
        <a-input
          style="width: 250px;"
          v-model:value="localXAxesConfig.scaleLabel.labelString"
          @change="handleXTitleTextChange"
        />
      </a-form-item>

      <div class="property-quote">
        {{ t('chart.yAxisConfig') }}
      </div>

      <a-form-item class="property-label" :label="t('chart.titleRotation')">
        <a-input-number
          :title="t('chart.angleScope')"
          v-model:value="localYAxesConfig.rotation"
          @change="handleYAxesRotationChange"
        />
      </a-form-item>

      <a-form-item class="property-label" :label="t('chart.displayAxisTitle')">
        <a-radio-group
          v-model:value="localYAxesConfig.scaleLabel.display"
          @change="handleYTitleDisplayChange"
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

      <a-form-item class="property-label" :label="t('chart.axisTitle')" v-show="yTitleDisplay">
        <a-input
          style="width: 250px;"
          v-model:value="localYAxesConfig.scaleLabel.labelString"
          @change="handleYTitleTextChange"
        />
      </a-form-item>

      <div v-if="false" class="property-quote">
        {{ t('chart.titleFormat') }}
      </div>

      <a-form-item v-if="false" class="property-label" :label="t('chart.titleFormat')">
        <a-input
          style="width: 260px;"
          v-model:value="localFormat"
          @change="handleFormatChange"
        />
      </a-form-item>

    </a-form>
  </div>
</template>

<script setup lang="ts">
/**
 * ChartAxis 图表 X/Y 轴配置子组件（vue3 + TS + ant-design-vue）
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'Axis' })


const { t } = useI18n()
interface ScaleLabel {
  display: boolean | string
  labelString: string
}

interface AxesConfig {
  rotation: number | null
  scaleLabel: ScaleLabel
}

interface SelectOption {
  value: boolean
  label: string
}

const props = withDefaults(
  defineProps<{
    xAxesConfig?: AxesConfig
    yAxesConfig?: AxesConfig
    format?: string
  }>(),
  {
    xAxesConfig: () => ({
      rotation: 0,
      scaleLabel: { display: false, labelString: '' }
    }),
    yAxesConfig: () => ({
      rotation: 0,
      scaleLabel: { display: false, labelString: '' }
    }),
    format: ''
  }
)

const emit = defineEmits<{
  (e: 'update:xAxesConfig', value: AxesConfig): void
  (e: 'update:yAxesConfig', value: AxesConfig): void
  (e: 'update:format', value: string): void
  (e: 'axis-change', payload: { type: string; value: any }): void
}>()

// ====== 状态 ======
const localXAxesConfig = ref<AxesConfig>({
  rotation: props.xAxesConfig.rotation,
  scaleLabel: {
    display: props.xAxesConfig.scaleLabel.display,
    labelString: props.xAxesConfig.scaleLabel.labelString
  }
})

const localYAxesConfig = ref<AxesConfig>({
  rotation: props.yAxesConfig.rotation,
  scaleLabel: {
    display: props.yAxesConfig.scaleLabel.display,
    labelString: props.yAxesConfig.scaleLabel.labelString
  }
})

const localFormat = ref<string>(props.format)

const displayOptions = computed<SelectOption[]>(() => [
  { value: true, label: t('chart.yes') },
  { value: false, label: t('chart.no') }
])

const xTitleDisplay = computed<boolean>(() => {
  const v = localXAxesConfig.value.scaleLabel.display
  if (v === 'true') return true
  if (v === 'false') return false
  return !!v
})

const yTitleDisplay = computed<boolean>(() => {
  const v = localYAxesConfig.value.scaleLabel.display
  if (v === 'true') return true
  if (v === 'false') return false
  return !!v
})

watch(
  () => props.xAxesConfig,
  (newVal) => {
    localXAxesConfig.value = {
      rotation: newVal.rotation,
      scaleLabel: {
        display: newVal.scaleLabel.display,
        labelString: newVal.scaleLabel.labelString
      }
    }
  },
  { deep: true }
)

watch(
  () => props.yAxesConfig,
  (newVal) => {
    localYAxesConfig.value = {
      rotation: newVal.rotation,
      scaleLabel: {
        display: newVal.scaleLabel.display,
        labelString: newVal.scaleLabel.labelString
      }
    }
  },
  { deep: true }
)

watch(
  () => props.format,
  (newVal) => {
    localFormat.value = newVal
  }
)

/** 处理X轴旋转角度变化 */
const handleXAxesRotationChange = (): void => {
  emit('update:xAxesConfig', localXAxesConfig.value)
  emit('axis-change', { type: 'x-rotation', value: localXAxesConfig.value.rotation })
}

/** 处理X轴标题显示变化 */
const handleXTitleDisplayChange = (value: boolean | string): void => {
  emit('update:xAxesConfig', localXAxesConfig.value)
  emit('axis-change', { type: 'x-title-display', value })
}

/** 处理X轴标题文本变化 */
const handleXTitleTextChange = (): void => {
  emit('update:xAxesConfig', localXAxesConfig.value)
  emit('axis-change', { type: 'x-title-text', value: localXAxesConfig.value.scaleLabel.labelString })
}

/** 处理Y轴旋转角度变化 */
const handleYAxesRotationChange = (): void => {
  emit('update:yAxesConfig', localYAxesConfig.value)
  emit('axis-change', { type: 'y-rotation', value: localYAxesConfig.value.rotation })
}

/** 处理Y轴标题显示变化 */
const handleYTitleDisplayChange = (value: boolean | string): void => {
  emit('update:yAxesConfig', localYAxesConfig.value)
  emit('axis-change', { type: 'y-title-display', value })
}

/** 处理Y轴标题文本变化 */
const handleYTitleTextChange = (): void => {
  emit('update:yAxesConfig', localYAxesConfig.value)
  emit('axis-change', { type: 'y-title-text', value: localYAxesConfig.value.scaleLabel.labelString })
}

/** 处理格式变化 */
const handleFormatChange = (): void => {
  emit('update:format', localFormat.value)
  emit('axis-change', { type: 'format', value: localFormat.value })
}
</script>

<style scoped>
.axis-config {
  width: 100%;
}
</style>
