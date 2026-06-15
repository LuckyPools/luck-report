<template>
  <a-modal
    :open="visible"
    :title="t('dialog.import.title')"
    :width="800"
    :mask-closable="false"
    @update:open="handleUpdateOpen"
    @cancel="handleClose"
  >
    <div class="dialog-content">
      <div class="import-tip-box">
        <div class="import-description">{{ t('dialog.import.desc') }}</div>
      </div>
      <div class="form-group">
        <label>{{ t('dialog.import.file') }}：</label>
        <a-input
          type="file"
          :key="fileInputKey"
          accept=".xlsx,.xls"
          @change="handleFileChange"
        />
      </div>
    </div>

    <template #footer>
      <a-button @click="handleClose" style="margin-right: 10px;">{{ t('dialog.common.cancel') }}</a-button>
      <a-button type="primary" @click="handleUpload">{{ t('dialog.common.ok') }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * ImportDialog 导入 Excel 对话框（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=false → true 时清空已选文件 + 重置 input
 * 2. 选择文件 → 暂存到 selectedFile
 * 3. 点击确定 → 调 importExcelFile，成功后 emit import-success
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - UDialog + UButton（自定义）→ a-modal + a-button
 * - @/utils/comnon.js → @/utils/comnon
 * - data()/methods/watch → ref + 普通函数 + watch
 * - v-model:visible → :open + @update:open（a-modal 4.x 用 open 控制）
 */
import { ref, watch } from 'vue'
import { showAlert } from '@/utils/comnon'
import { importExcelFile } from '@/api/designer'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ImportDialog' })


const { t } = useI18n()
const props = withDefaults(
  defineProps<{ visible: boolean }>(),
  { visible: false }
)

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'import-success'): void
}>()

/** 当前已选文件 */
const selectedFile = ref<File | null>(null)
/** 强制重渲染 input 的 key，每次重开弹窗 +1 */
const fileInputKey = ref<number>(0)

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      selectedFile.value = null
      fileInputKey.value += 1
    }
  }
)

function handleUpdateOpen(open: boolean): void {
  emit('update:visible', open)
}

function handleFileChange(event: Event): void {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  selectedFile.value = file ?? null
}

async function handleUpload(): Promise<void> {
  if (!selectedFile.value) {
    const t = (window as { $t?: (k: string) => string }).$t
    showAlert(t?.('dialog.import.selectFile') ?? t?.('dialog.import.file') ?? '请先选择文件')
    return
  }

  try {
    await importExcelFile(selectedFile.value)
    emit('import-success')
    emit('update:visible', false)
  } catch (error) {
    console.error('上传文件失败:', error)
    const t = (window as { $t?: (k: string) => string }).$t
    const err = error as { msg?: string }
    if (err.msg) {
      showAlert((t?.('dialog.import.fail') ?? '导入失败') + (t?.('colon') ?? ':') + err.msg, { useHTMLString: true })
    } else {
      showAlert(t?.('dialog.import.fail') ?? '导入失败')
    }
  }
}

function handleClose(): void {
  emit('update:visible', false)
  selectedFile.value = null
}
</script>

<style scoped>
.import-tip-box {
  padding: 8px 16px;
  background-color: #fafafa;
  border-radius: 4px;
  border-left: 5px solid #007868;
  margin: 20px 0;
}

.import-description {
  line-height: 2;
  color: #929191;
}

.form-group {
  margin: 16px 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}
</style>
