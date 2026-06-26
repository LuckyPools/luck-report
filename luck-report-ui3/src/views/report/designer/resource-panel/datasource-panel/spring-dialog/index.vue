<template>
  <a-modal
    :title="t('dialog.springDS.title')"
    :width="500"
    :open="visible"
    :zIndex="20000"
    @cancel="closeDialog"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ style: { width: '120px' } }"
    >
      <a-form-item :label="t('dialog.springDS.name')" name="name">
        <a-input v-model:value="formData.name" />
      </a-form-item>
      <a-form-item :label="t('dialog.springDS.bean')" name="beanId">
        <a-input v-model:value="formData.beanId" />
      </a-form-item>
    </a-form>

    <template #footer>
      <a-button @click="closeDialog" style="margin-right: 10px;">
        {{ t('dialog.common.cancel') }}
      </a-button>
      <a-button type="primary" @click="saveData">
        {{ t('dialog.common.ok') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * SpringDialog SpringBean 数据源配置弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → resetForm / initData
 * 2. 「确定」→ 校验 → 查重 → emit('save', { name, beanId, type: 'spring', ... })
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UForm/UFormItem/UInput/UButton（自定义）→ a-modal/a-form/a-form-item/a-input/a-button
 * - $refs.form.validate → formRef.value.validate()
 * - this.$emit → defineEmits
 */
import { ref, reactive, watch } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'
import { showAlert } from '@/utils/comnon'
import { setDirty } from '@/utils/table'
import type { ReportDatasource } from '@/types/report-def'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'SpringDialog' })


const { t } = useI18n()
/** 表单数据结构 */
interface SpringForm {
  name: string
  beanId: string
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    datasources?: ReportDatasource[]
    datasource?: ReportDatasource | null
  }>(),
  {
    visible: false,
    datasources: () => [],
    datasource: null
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: {
    name: string
    beanId: string
    type: 'spring'
    datasets: ReportDatasource['datasets']
    oldName: string | null
  }): void
}>()

const formRef = ref()
const oldName = ref<string | null>(null)
const formData = reactive<SpringForm>({ name: '', beanId: '' })

const rules: Record<string, Rule[]> = {
  name: [
    { required: true, message: t('dialog.springDS.nameTip'), trigger: 'blur' }
  ],
  beanId: [
    { required: true, message: t('dialog.springDS.beanTip'), trigger: 'blur' }
  ]
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetForm()
      initData()
    }
  }
)

/** 重置表单 */
function resetForm(): void {
  formData.name = ''
  formData.beanId = ''
  oldName.value = null
}

/** 回填表单 */
function initData(): void {
  const d = props.datasource
  oldName.value = d?.name ?? null
  formData.name = d?.name ?? ''
  formData.beanId = (d as any)?.beanId ?? ''
}

/** 关闭弹窗 */
function closeDialog(): void {
  emit('close')
}

/** 校验表单 */
async function validateForm(): Promise<boolean> {
  try {
    await formRef.value?.validate()
    return true
  } catch {
    return false
  }
}

/** 校验重名（排除当前编辑项） */
function checkDuplicate(): boolean {
  if (!oldName.value || formData.name !== oldName.value) {
    for (const source of props.datasources || []) {
      if (source.name === formData.name) {
        showAlert(
          `${t('dialog.springDS.ds')}[${formData.name}]${t('dialog.springDS.exist')}`
        )
        return false
      }
    }
  }
  return true
}

/** 保存 */
async function saveData(): Promise<void> {
  const valid = await validateForm()
  if (!valid) return
  if (!checkDuplicate()) return

  emit('save', {
    name: formData.name,
    beanId: formData.beanId,
    type: 'spring',
    datasets: [],
    oldName: oldName.value
  })
  closeDialog()
  setDirty()
}
</script>

<style scoped>
</style>
