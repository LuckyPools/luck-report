<template>
  <a-modal
    :title="t('dialog.preview.title')"
    :width="1200"
    :open="visible"
    :style="{ top: '50px' }"
    :zIndex="21000"
    @cancel="closeDialog"
  >
    <div class="preview-body-container">
      <a-spin :spinning="loading">
        <div v-if="errorInfo" v-html="errorInfo"></div>
        <div v-else-if="resultData">
          <div class="preview-summary">
            <span style="margin: 4px;">
              {{ t('dialog.preview.total') }}{{ resultData.total }}{{ t('dialog.preview.totalMid') }}{{ resultData.currentTotal }}{{ t('dialog.preview.item') }}
            </span>
          </div>
          <div
            v-if="resultData.fields && resultData.fields.length > 0"
            class="preview-body-content table-wrapper"
          >
            <table class="table-container" style="table-layout: fixed;">
              <thead>
                <tr>
                  <th
                    v-for="field in resultData.fields"
                    :key="field"
                    style="word-wrap: break-word; width: 120px;"
                  >
                    {{ field }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in resultData.data" :key="index">
                  <td
                    v-for="field in resultData.fields"
                    :key="`${index}-${field}`"
                    style="word-wrap: break-word;"
                  >
                    {{ item[field] }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </a-spin>
    </div>

    <template #footer>
      <a-button @click="closeDialog" style="margin-right: 10px;">
        {{ t('dialog.common.cancel') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * PreviewDataDialog 数据预览弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → loadPreviewData 调用 previewData API
 * 2. 成功 → resultData；失败 → errorInfo（HTML 错误块）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog（自定义）→ a-modal
 * - v-loading 自定义指令 → a-spin
 * - this.$emit → defineEmits
 * - watch visible → 监听 props.visible
 */
import { ref, watch } from 'vue'
import { previewData } from '@/api/designer'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'PreviewDataDialog' })


const { t } = useI18n()
/** 单行数据项（字段名 → 值） */
interface PreviewRow {
  [key: string]: unknown
}

/** 预览接口返回结构 */
interface PreviewResult {
  total: number
  currentTotal: number
  fields: string[]
  data: PreviewRow[]
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    parameters?: Record<string, unknown> | null
  }>(),
  { visible: false, parameters: null }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:visible', value: boolean): void
}>()

const loading = ref<boolean>(false)
const errorInfo = ref<string | null>(null)
const resultData = ref<PreviewResult | null>(null)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadPreviewData()
    }
  }
)

/** 关闭弹窗 */
function closeDialog(): void {
  emit('update:visible', false)
  emit('close')
}

/** 调用 previewData 接口 */
async function loadPreviewData(): Promise<void> {
  if (!props.parameters) return

  loading.value = true
  errorInfo.value = null
  resultData.value = null

  try {
    const data = (await previewData(props.parameters as Record<string, any>)) as PreviewResult
    resultData.value = data
  } catch (error: any) {
    let msg = t('dialog.sql.previewFail')
    if (error?.msg) {
      msg = msg + t('colon') + error.msg
    }
    errorInfo.value = `<div style='color: #d30e00;'>${msg}</div>`
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:root {
  --dialog-height: 600px;
}

.preview-body-container {
  min-height: 300px;
  max-height: var(--dialog-height);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: black;
}

.preview-summary {
  height: 30px;
  background: #fdfdfd;
}

.preview-body-content {
  min-height: 0;
  max-height: var(--dialog-height);
  overflow-x: scroll;
  margin-top: 2px;
}

.table-container td {
  padding: 0 5px;
  color: black;
}
</style>
