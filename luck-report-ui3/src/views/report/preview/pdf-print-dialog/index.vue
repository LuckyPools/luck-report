<template>
  <a-modal
    :title="t('preview.pdfPrint.title')"
    :open="visible"
    :width="1250"
    :footer="null"
    class="pdf-print-dialog"
    @cancel="handleClose"
    @update:open="handleOpenChange"
    :styles="{ body: { paddingTop: '5px' } }"
  >
    <div class="pdf-print-body">
      <a-spin :spinning="loading">
        <fieldset class="pdf-print-toolbar">
          <legend>{{ t('preview.pdfPrint.setup') }}</legend>

          <!-- 纸张类型 -->
          <a-form :label-width="100">
            <a-row>
              <a-col :span="6">
                <a-form-item class="property-label" :label="t('preview.pdfPrint.paper')">
                  <a-select
                    v-model:value="paper.paperType"
                    class="page-select"
                    style="width: 140px"
                    @change="handlePageTypeChange"
                  >
                    <a-select-option
                      v-for="(option, index) in paperTypeOptions"
                      :key="index"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>

              <a-col :span="6">
                <a-form-item class="property-label" :label="t('preview.pdfPrint.width')">
                  <a-input-number
                    v-model:value="pageWidthMM"
                    :disabled="paper.paperType !== 'CUSTOM'"
                    @change="handlePageWidthChange"
                  />
                </a-form-item>
              </a-col>

              <a-col :span="6">
                <a-form-item class="property-label" :label="t('preview.pdfPrint.height')">
                  <a-input-number
                    v-model:value="pageHeightMM"
                    :disabled="paper.paperType !== 'CUSTOM'"
                    @change="handlePageHeightChange"
                  />
                </a-form-item>
              </a-col>

              <a-col :span="6">
                <a-form-item class="property-label" :label="t('preview.pdfPrint.orientation')">
                  <a-select
                    v-model:value="paper.orientation"
                    class="orientation-select"
                    style="width: 140px"
                  >
                    <a-select-option
                      v-for="(option, index) in orientationOptions"
                      :key="index"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>

            <a-row style="margin-top: 5px;">
              <a-col :span="6">
                <a-form-item class="property-label" :label="t('preview.pdfPrint.leftMargin')">
                  <a-input-number
                    v-model:value="leftMarginMM"
                    @change="handleLeftMarginChange"
                  />
                </a-form-item>
              </a-col>

              <a-col :span="6">
                <a-form-item class="property-label" :label="t('preview.pdfPrint.rightMargin')">
                  <a-input-number
                    v-model:value="rightMarginMM"
                    @change="handleRightMarginChange"
                  />
                </a-form-item>
              </a-col>

              <a-col :span="6">
                <a-form-item class="property-label" :label="t('preview.pdfPrint.topMargin')">
                  <a-input-number
                    v-model:value="topMarginMM"
                    @change="handleTopMarginChange"
                  />
                </a-form-item>
              </a-col>

              <a-col :span="6">
                <a-form-item class="property-label" :label="t('preview.pdfPrint.bottomMargin')">
                  <a-input-number
                    v-model:value="bottomMarginMM"
                    @change="handleBottomMarginChange"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <a-row style="margin-top: 5px;">
              <a-col :span="6" :offset="18">
                <a-form-item class="property-label">
                  <a-button type="primary" @click="handleApply">
                    {{ t('preview.pdfPrint.apply') }}
                  </a-button>
                  <a-button style="margin-left: 5px" @click="handlePrint">
                    {{ t('preview.pdfPrint.print') }}
                  </a-button>
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </fieldset>

        <div v-show="!loading" class="pdf-preview-container">
          <iframe
            ref="pdfFrameRef"
            name="_iframe_for_pdf_print"
            class="pdf-preview-frame"
            frameborder="0"
          ></iframe>
        </div>
      </a-spin>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * PDF 打印对话框
 *
 * 改造要点：
 * 1. Vue2 Options API + 自定义 u-xxx 组件 → Vue3 <script setup> + TypeScript + ant-design-vue
 * 2. UDialog → a-modal
 * 3. UForm/UFormItem/URow/UCol → a-form/a-form-item/a-row/a-col
 * 4. USelect/UOption → a-select/a-select-option
 * 5. UInputNumber → a-input-number
 * 6. v-model 改 v-model:value
 * 7. v-loading 自定义指令 → a-spin
 * 8. Vuex mapGetters('report', ['getContext']) → 不再需要；本组件通过 props.parameters 接收参数
 * 9. this.$set 改用 reactive 整体赋值或直接改属性
 * 10. v-on="$listeners" 等移除，事件直接使用 emit
 * 11. ant-design-vue 4.x 的 a-modal 已废弃 bodyStyle，改用 styles.body
 */
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildPageSizeList, mmToPoint, pointToMM } from '@/utils/table'
import { showAlert } from '@/utils/comnon'
import { getPdfBlobUrl, loadPagePaper } from '@/api/preview'
import { getUrlSearchParams } from '@/utils/url'

/** 纸张配置 */
interface PaperConfig {
  paperType: string
  width: number
  height: number
  orientation: string
  leftMargin: number
  rightMargin: number
  topMargin: number
  bottomMargin: number
}

/** 选择项 */
interface SelectOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    parameters?: Record<string, unknown>
  }>(),
  {
    visible: false,
    parameters: () => ({})
  }
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()

/** 纸张状态（reactive） */
const paper = reactive<PaperConfig>({
  paperType: 'A4',
  width: 0,
  height: 0,
  orientation: 'portrait',
  leftMargin: 0,
  rightMargin: 0,
  topMargin: 0,
  bottomMargin: 0
})

const pageWidthMM = ref(0)
const pageHeightMM = ref(0)
const leftMarginMM = ref(0)
const rightMarginMM = ref(0)
const topMarginMM = ref(0)
const bottomMarginMM = ref(0)

/** 纸张尺寸列表 */
const paperSizeList = buildPageSizeList()
/** 刷新计数器（避免服务端缓存） */
const refreshIndex = ref(0)
const loading = ref(false)
const currentBlobUrl = ref<string | null>(null)
const pdfFrameRef = ref<HTMLIFrameElement | null>(null)

/** 纸张类型下拉项 */
const paperTypeOptions = computed<SelectOption[]>(() => {
  const options: SelectOption[] = []
  for (let i = 0; i <= 10; i++) {
    options.push({ value: `A${i}`, label: `A${i}` })
  }
  for (let i = 0; i <= 10; i++) {
    options.push({ value: `B${i}`, label: `B${i}` })
  }
  options.push({ value: 'CUSTOM', label: t('preview.pdfPrint.custom') })
  return options
})

/** 方向下拉项 */
const orientationOptions = computed<SelectOption[]>(() => [
  { value: 'portrait', label: t('preview.pdfPrint.portrait') },
  { value: 'landscape', label: t('preview.pdfPrint.landscape') }
])

/** 加载纸张配置数据 */
async function loadPaperData(): Promise<void> {
  loading.value = true
  try {
    const formData = new FormData()
    for (const [key, value] of Object.entries(props.parameters)) {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value))
      }
    }

    const paperData = (await loadPagePaper(formData)) as Partial<PaperConfig>

    paper.paperType = paperData.paperType || 'A4'
    paper.width = paperData.width || 0
    paper.height = paperData.height || 0
    paper.orientation = paperData.orientation || 'portrait'
    paper.leftMargin = paperData.leftMargin || 0
    paper.rightMargin = paperData.rightMargin || 0
    paper.topMargin = paperData.topMargin || 0
    paper.bottomMargin = paperData.bottomMargin || 0

    pageWidthMM.value = pointToMM(paper.width)
    pageHeightMM.value = pointToMM(paper.height)
    leftMarginMM.value = pointToMM(paper.leftMargin)
    rightMarginMM.value = pointToMM(paper.rightMargin)
    topMarginMM.value = pointToMM(paper.topMargin)
    bottomMarginMM.value = pointToMM(paper.bottomMargin)

    await handleApply()
  } catch (error) {
    console.error('获取纸张信息失败:', error)
    const err = error as { msg?: string }
    if (err.msg) {
      showAlert(t('preview.error.serverError') + t('colon') + err.msg, { useHTMLString: true })
    } else {
      showAlert(t('preview.error.loadPaperFail'))
    }
  } finally {
    loading.value = false
  }
}

/** 关闭对话框 */
function handleClose(): void {
  revokeBlobUrl()
  emit('close')
}

/** 处理 ant-design-vue 模态框 open 变化 */
function handleOpenChange(open: boolean): void {
  if (!open) {
    handleClose()
  }
}

/** 释放 Blob URL */
function revokeBlobUrl(): void {
  if (currentBlobUrl.value) {
    URL.revokeObjectURL(currentBlobUrl.value)
    currentBlobUrl.value = null
  }
}

/** 纸张类型变更 */
function handlePageTypeChange(value: string): void {
  if (value === 'CUSTOM') {
    return
  }
  // 预设尺寸，更新宽高
  const pageSize = paperSizeList[value as keyof typeof paperSizeList] as { width: number; height: number } | undefined
  if (pageSize) {
    paper.width = mmToPoint(pageSize.width)
    paper.height = mmToPoint(pageSize.height)
    pageWidthMM.value = pageSize.width
    pageHeightMM.value = pageSize.height
  }
}

/** 校验非空数字 */
function ensureValidNumber(value: number | null | undefined): boolean {
  if (value == null || isNaN(value)) {
    showAlert(t('preview.pdfPrint.numberTip'))
    return false
  }
  return true
}

/** 纸张宽度变更 */
function handlePageWidthChange(value: number | null): void {
  if (!ensureValidNumber(value)) return
  paper.width = mmToPoint(value as number)
}

/** 纸张高度变更 */
function handlePageHeightChange(value: number | null): void {
  if (!ensureValidNumber(value)) return
  paper.height = mmToPoint(value as number)
}

/** 左边距变更 */
function handleLeftMarginChange(value: number | null): void {
  if (!ensureValidNumber(value)) return
  paper.leftMargin = mmToPoint(value as number)
}

/** 右边距变更 */
function handleRightMarginChange(value: number | null): void {
  if (!ensureValidNumber(value)) return
  paper.rightMargin = mmToPoint(value as number)
}

/** 上边距变更 */
function handleTopMarginChange(value: number | null): void {
  if (!ensureValidNumber(value)) return
  paper.topMargin = mmToPoint(value as number)
}

/** 下边距变更 */
function handleBottomMarginChange(value: number | null): void {
  if (!ensureValidNumber(value)) return
  paper.bottomMargin = mmToPoint(value as number)
}

/** 应用设置并刷新 PDF 预览 */
async function handleApply(): Promise<void> {
  loading.value = true
  try {
    const currentPaper: PaperConfig = {
      paperType: paper.paperType,
      width: paper.width,
      height: paper.height,
      orientation: paper.orientation,
      leftMargin: paper.leftMargin,
      rightMargin: paper.rightMargin,
      topMargin: paper.topMargin,
      bottomMargin: paper.bottomMargin
    }

    const urlParams = getUrlSearchParams()
    const paramObj: Record<string, string> = {}
    for (const [key, value] of urlParams) {
      paramObj[key] = value
    }
    paramObj['_r'] = String(refreshIndex.value++)

    revokeBlobUrl()
    currentBlobUrl.value = await getPdfBlobUrl(paramObj, currentPaper)
    if (pdfFrameRef.value) {
      pdfFrameRef.value.src = currentBlobUrl.value
    }
  } catch (error) {
    console.error('Error:', error)
    showAlert(t('preview.pdfPrint.fail'))
  } finally {
    loading.value = false
  }
}

/** 调用 PDF iframe 打印 */
function handlePrint(): void {
  try {
    const frame = window.frames['_iframe_for_pdf_print'] as Window | undefined
    if (frame) {
      frame.focus()
      frame.print()
    }
  } catch (e) {
    console.error('Print error:', e)
    showAlert(t('preview.pdfPrint.printError'))
  }
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      void loadPaperData()
    }
  }
)
</script>

<style scoped>
.pdf-print-dialog .pdf-print-body {
  padding-top: 5px;
  height: 660px;
  overflow: hidden;
}

.pdf-print-toolbar {
  width: 100%;
  font-size: 12px;
  border: solid 1px #ddd;
  border-radius: 5px;
  padding: 1px 8px;
  margin-bottom: 5px;
}

.pdf-print-toolbar legend {
  font-size: 12px;
  width: 60px;
  border-bottom: none;
  margin-bottom: 0;
}

.pdf-preview-container {
  width: 100%;
  height: calc(100vh - 200px);
  min-height: 400px;
}

.pdf-preview-frame {
  width: 100%;
  height: 100%;
  border: solid 1px #c2c2c2;
}

.property-label {
  margin-bottom: 0;
}
</style>
