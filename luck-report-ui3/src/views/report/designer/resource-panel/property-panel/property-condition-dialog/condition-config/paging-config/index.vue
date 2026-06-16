<template>
  <div>
    <a-row class="condition-config-row" align="middle">
      <a-col :span="8">
        <a-checkbox v-model:checked="pagingBreakChecked" @change="onPagingBreakChange">
          {{ t('dialog.propCondition.paging') }}
        </a-checkbox>
      </a-col>
      <a-col :span="8">
        <a-select
            v-show="pagingBreakChecked"
            v-model:value="pagingPosition"
            style="width: 120px"
            @change="onPagingPositionChange"
            :options="pagingPositionOptions"
        />
      </a-col>
      <a-col :span="8">
        <a-input-number
            v-show="pagingBreakChecked"
            v-model:value="pagingLine"
            :min="1"
            @change="onPagingLineChange"
        />
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
/**
 * PagingConfig 分页条件配置（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - u-row/u-col/u-checkbox/u-select/u-option/u-input-number（自定义）→ a-row/a-col/a-checkbox/a-select/a-input-number
 * - 选中态对齐使用 v-model:checked / v-model:value
 */
import { ref, watch, onMounted } from 'vue'
import configOptions from '../constants/config-options'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'PagingConfig' })


const { t } = useI18n()
interface Paging {
  position?: string
  line?: number
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    paging?: Paging | null
  }>(),
  {
    paging: null
  }
)

const emit = defineEmits<{
  (
    e: 'paging-change',
    payload: {
      checked: boolean
      paging: Paging | null
    }
  ): void
}>()

const pagingBreakChecked = ref<boolean>(false)
const pagingPosition = ref<string>('after')
const pagingLine = ref<number>(0)

const pagingPositionOptions = ref<{ value: string; label: string }[]>([])

/**
 * 加载分页属性
 */
const loadPagingProperties = (paging?: Paging | null): void => {
  pagingBreakChecked.value = !!paging
  if (pagingBreakChecked.value) {
    pagingPosition.value = paging?.position || 'after'
    pagingLine.value = (paging?.line as number) || 0
  } else {
    pagingPosition.value = 'after'
    pagingLine.value = 0
  }
}

onMounted(() => {
  pagingPositionOptions.value = configOptions.getPagingPositionOptions()
})

watch(
  () => props.paging,
  (newVal) => {
    loadPagingProperties(newVal)
  },
  { immediate: true, deep: true }
)

const onPagingBreakChange = (): void => {
  emit('paging-change', {
    checked: pagingBreakChecked.value,
    paging: pagingBreakChecked.value
      ? {
          position: pagingPosition.value,
          line: pagingLine.value
        }
      : null
  })
}

const onPagingPositionChange = (): void => {
  if (pagingBreakChecked.value) {
    emit('paging-change', {
      checked: true,
      paging: {
        position: pagingPosition.value,
        line: pagingLine.value
      }
    })
  }
}

const onPagingLineChange = (): void => {
  if (pagingBreakChecked.value) {
    emit('paging-change', {
      checked: true,
      paging: {
        position: pagingPosition.value,
        line: pagingLine.value
      }
    })
  }
}
</script>
