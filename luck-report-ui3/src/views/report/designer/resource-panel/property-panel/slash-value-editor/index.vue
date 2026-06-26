<template>
  <div class="slash-value-editor">

    <div class="property-quote">
      <span>{{ t('property.slash.config') }}</span>
    </div>

    <a-form :label-col="{ style: { width: '100px' } }" >

      <a-form-item class="property-label">
        <a-button
          @click="handleRefresh"
          style="float: right"
        >
          <template #icon><i class="iconfont icon-refresh"></i></template>
          {{ t('property.slash.refresh') }}
        </a-button>
      </a-form-item>

      <div v-for="(slash, index) in slashes" :key="index" class="slash-item">

        <a-form-item class="property-label" :label="t('property.slash.name')" style="margin-bottom: 10px;">
          <a-input
            v-model:value="slash.text"
            style="width: 250px;"
            @change="(e) => handleSlashChange(index, (e.target as HTMLInputElement).value)"
          />
        </a-form-item>

        <a-form-item class="property-label" label="Y" style="margin-bottom: 10px;">
          <a-input-number
            v-model:value="slash.y"
            @change="() => handleSlashChange(index)"
          />
        </a-form-item>

        <a-form-item class="property-label" label="X" style="margin-bottom: 10px;">
          <a-input-number
            v-model:value="slash.x"
            @change="() => handleSlashChange(index)"
          />
        </a-form-item>

        <a-form-item class="property-label" :label="t('property.slash.angle')" style="margin-bottom: 10px;">
          <a-input-number
            v-model:value="slash.degree"
            @change="() => handleSlashChange(index)"
          />
        </a-form-item>

      </div>
    </a-form>
  </div>
</template>

<script setup lang="ts">
/**
 * SlashValueEditor 斜线值编辑器（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. cellPosition 变化或 isCellUpdate=true → loadSlashes 加载当前 cellDef.value.slashes
 * 2. 修改任意斜线属性 → handleSlashChange 写回 cellDef
 * 3. 「刷新」→ 重新调用 CrossTabWidget 绘制并重新加载
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UForm/UFormItem/UInputNumber/UInput/UButton（自定义）→ a-form/a-form-item/a-input-number/a-input/a-button
 * - a-input 的 @change 传 event.target.value
 * - Vuex mapGetters/mapActions → useReportStore (Pinia)
 * - a-input-number v-model:value 是 number|null
 */
import { ref, computed, watch } from 'vue'
import { setDirty } from '@/utils/table'
import { deepCopy } from '@/utils/comnon'
import { setCell, getCell, getContext } from '@/utils/contextActions'
import CrossTabWidget from '@/views/report/designer/edit-table/cross-tab-widget/class'
import { useReportStore } from '@/store/modules/report'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'SlashValueEditor' })


const { t } = useI18n()
interface SlashItem {
  text: string
  x: number | null
  y: number | null
  degree: number | null
}

const props = withDefaults(
  defineProps<{
    rowIndex?: number
    colIndex?: number
    row2Index?: number
    col2Index?: number
  }>(),
  {
    rowIndex: 0,
    colIndex: 0,
    row2Index: 0,
    col2Index: 0
  }
)

const reportStore = useReportStore()

// ====== 状态 ======
const slashes = ref<SlashItem[]>([])

// ====== 来自 store ======
const isCellUpdate = computed(() => reportStore.getIsCellUpdate)

const cellPosition = computed<string>(() => `${props.rowIndex},${props.colIndex}`)

/** 回填斜线数组 */
const loadSlashes = (): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (cellDef && cellDef.value && cellDef.value.slashes) {
    slashes.value = deepCopy(cellDef.value.slashes) as SlashItem[]
  } else {
    slashes.value = []
  }
}

watch(cellPosition, () => {
  loadSlashes()
}, { immediate: true })

watch(isCellUpdate, (newVal) => {
  if (newVal) {
    loadSlashes()
    reportStore.setCellUpdate(false)
  }
})

const handleSlashChange = (index: number, _text?: string): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (!cellDef || !cellDef.value || !cellDef.value.slashes) return

  const newCellDef = deepCopy(cellDef)
  newCellDef.value.slashes[index] = deepCopy(slashes.value[index])

  setCell(props.rowIndex, props.colIndex, newCellDef)

  const context = getContext()
  if (context) {
    // 触发斜线重绘（实例化一次即生效，保留原逻辑）
    new CrossTabWidget(context, props.rowIndex, props.colIndex, '')
  }

  setDirty()
}

const handleRefresh = (): void => {
  const cellDef = getCell(props.rowIndex, props.colIndex)
  if (!cellDef) return

  const context = getContext()
  if (context) {
    const crossTabWidget = new CrossTabWidget(context, props.rowIndex, props.colIndex, '')
    crossTabWidget.refreshCell()
    crossTabWidget.doDraw()

    loadSlashes()
  }
}
</script>

<style scoped>
.slash-value-editor {
  width: 100%;
}

.slash-item {
  margin-top: 22px;
}
</style>
