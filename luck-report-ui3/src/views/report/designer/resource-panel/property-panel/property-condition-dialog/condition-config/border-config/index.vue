<template>
  <div>
    <a-row class="condition-config-row" align="middle">
      <a-col :span="8">
        <a-checkbox v-model:checked="borderChecked" @change="onBorderChange">
          {{ t('dialog.propCondition.border') }}
        </a-checkbox>
      </a-col>
      <a-col :span="8">
        <a-button v-show="borderChecked" @click="configBorder">
          <i class="iconfont icon-setting"></i> {{ t('dialog.propCondition.borderConfig') }}
        </a-button>
      </a-col>
      <a-col :span="8">
      </a-col>
    </a-row>

    <CustomBorderDialog
      :visible="customBorderDialogVisible"
      :cell-style="localCellStyle"
      @close="customBorderDialogVisible = false"
      @update:visible="customBorderDialogVisible = $event"
      @save="handleCustomBorderSave"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * BorderConfig 边框条件配置（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - u-row/u-col/u-checkbox/u-button（自定义）→ a-row/a-col/a-checkbox/a-button
 * - 深拷贝 localCellStyle 以避免污染 prop
 */
import { ref, watch, nextTick } from 'vue'
import { deepCopy } from '@/utils/comnon'
import CustomBorderDialog from '@/views/report/designer/resource-panel/property-panel/custom-border-dialog/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'BorderConfig' })


const { t } = useI18n()
interface BorderSide {
  color: string
  style: string
  width: number | string
}

interface CellStyle {
  leftBorder?: BorderSide | null
  rightBorder?: BorderSide | null
  topBorder?: BorderSide | null
  bottomBorder?: BorderSide | null
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    cellStyle?: CellStyle | null
  }>(),
  {
    cellStyle: () => ({})
  }
)

const emit = defineEmits<{
  (
    e: 'border-change',
    payload: {
      checked: boolean
      borders: {
        leftBorder: BorderSide | null
        rightBorder: BorderSide | null
        topBorder: BorderSide | null
        bottomBorder: BorderSide | null
      }
    }
  ): void
  (
    e: 'border-save',
    payload: {
      topBorder: BorderSide
      bottomBorder: BorderSide
      leftBorder: BorderSide
      rightBorder: BorderSide
    }
  ): void
}>()

const borderChecked = ref<boolean>(false)
const customBorderDialogVisible = ref<boolean>(false)
const localCellStyle = ref<Record<string, unknown>>({})

/**
 * 加载边框属性
 */
const loadBorderProperties = (cellStyle?: CellStyle | null): void => {
  if (!cellStyle) return

  borderChecked.value = !!(
    cellStyle.leftBorder ||
    cellStyle.rightBorder ||
    cellStyle.topBorder ||
    cellStyle.bottomBorder
  )
}

watch(
  () => props.cellStyle,
  (newVal) => {
    loadBorderProperties(newVal)
  },
  { immediate: true, deep: true }
)

const onBorderChange = (): void => {
  const defaultBorder: BorderSide = {
    color: '0,0,0',
    style: 'solid',
    width: 1
  }

  emit('border-change', {
    checked: borderChecked.value,
    borders: borderChecked.value
      ? {
          leftBorder: deepCopy(defaultBorder) as BorderSide,
          rightBorder: deepCopy(defaultBorder) as BorderSide,
          topBorder: deepCopy(defaultBorder) as BorderSide,
          bottomBorder: deepCopy(defaultBorder) as BorderSide
        }
      : {
          leftBorder: null,
          rightBorder: null,
          topBorder: null,
          bottomBorder: null
        }
  })
}

const configBorder = (): void => {
  localCellStyle.value = deepCopy(props.cellStyle) as Record<string, unknown>

  const defaultBorder: BorderSide = { color: '0,0,0', width: '1', style: 'solid' }
  const noneBorder: BorderSide = { color: '0,0,0', width: '1', style: 'none' }

  if (!localCellStyle.value.leftBorder || localCellStyle.value.leftBorder === '') {
    localCellStyle.value.leftBorder = { ...noneBorder }
  }
  if (!localCellStyle.value.rightBorder || localCellStyle.value.rightBorder === '') {
    localCellStyle.value.rightBorder = { ...noneBorder }
  }
  if (!localCellStyle.value.topBorder || localCellStyle.value.topBorder === '') {
    localCellStyle.value.topBorder = { ...noneBorder }
  }
  if (!localCellStyle.value.bottomBorder || localCellStyle.value.bottomBorder === '') {
    localCellStyle.value.bottomBorder = { ...noneBorder }
  }

  nextTick(() => {
    customBorderDialogVisible.value = true
  })
}

const handleCustomBorderSave = (borderData: {
  topBorder: BorderSide
  bottomBorder: BorderSide
  leftBorder: BorderSide
  rightBorder: BorderSide
}): void => {
  emit('border-save', {
    topBorder: borderData.topBorder,
    bottomBorder: borderData.bottomBorder,
    leftBorder: borderData.leftBorder,
    rightBorder: borderData.rightBorder
  })
}
</script>
