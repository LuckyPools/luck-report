<template>
  <a-modal
    :title="t('dialog.sqlParam.title')"
    :width="500"
    :open="visible"
    :zIndex="21000"
    @cancel="handleClose"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ style: { width: '120px' } }"
    >
      <a-form-item :label="t('dialog.sqlParam.name')" name="name">
        <a-input
          v-model:value="formData.name"
          :placeholder="t('dialog.sqlParam.namePlaceholder')"
        />
      </a-form-item>

      <a-form-item :label="t('dialog.sqlParam.datatype')" name="type">
        <a-select v-model:value="formData.type" :allow-clear="true">
          <a-select-option
            v-for="option in typeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item :label="t('dialog.sqlParam.defaultValue')" name="defaultValue">
        <a-input
          v-model:value="formData.defaultValue"
          :placeholder="t('dialog.sqlParam.tip')"
        />
      </a-form-item>
    </a-form>

    <template #footer>
      <a-button @click="handleClose" style="margin-right: 10px;">
        {{ t('dialog.common.cancel') }}
      </a-button>
      <a-button type="primary" @click="handleSave">
        {{ t('dialog.common.ok') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * ParameterDialog SQL 参数编辑弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → resetFormData / initData
 * 2. 用户提交 → 校验 + 重名校验 → emit('save', name, type, defaultValue)
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UForm/UFormItem/USelect/UOption/UInput/UButton（自定义）→ a-modal/a-form/a-form-item/a-select/a-select-option/a-input/a-button
 * - $refs.form.validate → formRef.value.validate()
 * - this.$emit → defineEmits
 * - 双向 visible → v-model:visible
 */
import { ref, reactive, computed, watch } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'
import { showAlert } from '@/utils/comnon'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ParameterDialog' })


const { t } = useI18n()
/** 表单数据结构 */
interface ParamForm {
  name: string
  type: string
  defaultValue: string
}

/** 参数项（外部传入） */
interface ParamItem {
  name?: string
  type?: string
  defaultValue?: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    editData?: ParamItem | null
    parameters?: ParamItem[]
    editIndex?: number
  }>(),
  {
    visible: false,
    editData: null,
    parameters: () => [],
    editIndex: -1
  }
)

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'save', name: string, type: string, defaultValue: string): void
}>()

const formRef = ref()
const formData = reactive<ParamForm>({
  name: '',
  type: 'String',
  defaultValue: ''
})

const rules: Record<string, Rule[]> = {
  name: [
    { required: true, message: t('dialog.sqlParam.nameTip'), trigger: 'blur' }
  ],
  type: [
    { required: true, message: t('dialog.sqlParam.datatypeTip'), trigger: 'blur' }
  ]
}

/** 类型下拉选项（写死） */
const typeOptions = computed<{ value: string; label: string }[]>(() => [
  { value: 'String', label: 'String' },
  { value: 'Integer', label: 'Integer' },
  { value: 'Float', label: 'Float' },
  { value: 'Boolean', label: 'Boolean' },
  { value: 'Date', label: 'Date' },
  { value: 'List', label: 'List' }
])

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetFormData()
      initData()
    }
  }
)

/** 回填表单 */
function initData(): void {
  formData.name = props.editData?.name || ''
  formData.type = props.editData?.type || ''
  formData.defaultValue = props.editData?.defaultValue || ''
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

/** 重置表单 */
function resetFormData(): void {
  formRef.value?.resetFields()
}

/** 关闭弹窗（v-model:visible） */
function handleClose(): void {
  emit('update:visible', false)
}

/** 保存：先校验，再做重名校验 */
async function handleSave(): Promise<void> {
  const valid = await validateForm()
  if (!valid) return

  const name = formData.name
  const isNameChanged =
    props.editIndex === -1 || props.parameters[props.editIndex]?.name !== name
  if (isNameChanged && props.parameters.some((p) => p.name === name)) {
    showAlert(t('dialog.sqlParam.nameExists'))
    return
  }

  emit('save', name, formData.type, formData.defaultValue)
  emit('update:visible', false)
}
</script>

<style scoped>
</style>
