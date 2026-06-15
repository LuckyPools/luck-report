<template>
  <a-modal
    :title="t('tree.addField')"
    :width="500"
    :open="visible"
    :mask-closable="false"
    @cancel="handleClose"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ style: { width: '120px' } }"
      :colon="false"
    >
      <a-form-item :label="t('tree.fieldName')" name="fieldName">
        <a-input
          v-model:value="formData.fieldName"
          ref="inputRef"
          :placeholder="t('tree.inputTip')"
          @keyup.enter="handleOk"
        />
      </a-form-item>
    </a-form>

    <template #footer>
      <a-button @click="handleClose" style="margin-right: 10px;">
        {{ t('dialog.common.cancel') }}
      </a-button>
      <a-button type="primary" @click="handleOk">
        {{ t('dialog.common.ok') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * FieldNameDialog 新增字段名弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → resetFields 清空
 * 2. 用户输入 → 按回车 / 点击确定 → 校验 → emit('save', fieldName, dataset)
 * 3. 关闭 → 延迟 300ms 清空，避免动画中数据闪动
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UForm/UFormItem/UInput/UButton（自定义）→ a-modal/a-form/a-form-item/a-input/a-button
 * - $refs.form.validate → formRef.value.validate()
 * - $emit → defineEmits
 * - mounted/beforeDestroy 绑定的 keydown → onMounted/onBeforeUnmount
 */
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'
import type { ReportDataset } from '@/types/report-def'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'FieldNameDialog' })


const { t } = useI18n()
/** 表单数据结构 */
interface FieldNameForm {
  fieldName: string
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    dataset?: ReportDataset | null
  }>(),
  { visible: false, dataset: null }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', fieldName: string, dataset: ReportDataset | null): void
}>()

const formRef = ref()
const inputRef = ref()
const formData = reactive<FieldNameForm>({ fieldName: '' })

const rules: Record<string, Rule[]> = {
  fieldName: [
    { required: true, message: t('tree.inputTip'), trigger: 'blur' }
  ]
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetForm()
    }
  }
)

/** 全局 ESC 关闭（与原实现对齐） */
function handleKeydown(e: KeyboardEvent): void {
  if (props.visible && e.key === 'Escape') {
    handleClose()
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))

/** 重置表单 */
function resetForm(): void {
  formRef.value?.resetFields()
  formData.fieldName = ''
}

/** 关闭弹窗：延迟 300ms 清空避免动画中数据残留 */
function handleClose(): void {
  emit('close')
  setTimeout(() => {
    resetForm()
  }, 300)
}

/** 校验后 emit('save') */
async function handleOk(): Promise<void> {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  emit('save', formData.fieldName.trim(), props.dataset)
  emit('close')
}
</script>

<style scoped>
</style>
