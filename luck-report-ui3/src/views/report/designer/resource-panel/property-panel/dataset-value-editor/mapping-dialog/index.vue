<template>
  <a-modal
    :title="dialogTitle"
    :width="500"
    :open="visible"
    :z-index="10000"
    :mask-closable="false"
    @cancel="handleClose"
  >
    <div class="dialog-content">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        :label-col="{ style: { width: '120px' } }"
        :colon="false"
      >
        <a-form-item :label="t('dialog.mapping.key')" name="value">
          <a-input
            v-model:value="formData.value"
            :placeholder="t('dialog.mapping.keyPlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="t('dialog.mapping.value')" name="label">
          <a-input
            v-model:value="formData.label"
            :placeholder="t('dialog.mapping.valuePlaceholder')"
          />
        </a-form-item>
      </a-form>
    </div>

    <template #footer>
      <a-button @click="handleClose" style="margin-right: 10px;">{{ t('dialog.common.cancel') }}</a-button>
      <a-button type="primary" @click="handleSave">{{ t('dialog.common.ok') }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * MappingDialog 数据映射项弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → resetForm + initData 回填 value/label
 * 2. 用户编辑 → 「确定」→ 校验 → emit('save', { value, label })
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UForm/UFormItem/UInput/UButton（自定义）→ a-modal/a-form/a-form-item/a-input/a-button
 * - $refs.form.validate(callback) → formRef.value.validate() Promise 化
 */
import { ref, reactive, computed, watch } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'MappingDialog' })


const { t } = useI18n()
/** 映射项结构（key=实际值 value=显示值） */
export interface MappingItem {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    mappingItem?: MappingItem
    operation?: string
  }>(),
  {
    visible: false,
    mappingItem: () => ({ value: '', label: '' }),
    operation: 'add'
  }
)

const emit = defineEmits<{
  (e: 'save', payload: { value: string; label: string }): void
  (e: 'update:visible', val: boolean): void
}>()

const formRef = ref()
const formData = reactive<MappingItem>({ value: '', label: '' })

const rules: Record<string, Rule[]> = {
  value: [
    {
      required: true,
      message: t('dialog.mapping.keyPlaceholder'),
      trigger: 'blur'
    }
  ],
  label: [
    {
      required: true,
      message: t('dialog.mapping.valuePlaceholder'),
      trigger: 'blur'
    }
  ]
}

const dialogTitle = computed(() =>
  props.operation === 'add' ? t('dialog.mapping.add') : t('dialog.mapping.edit')
)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetForm()
      initData()
    }
  }
)

/** 回填 value/label */
const initData = (): void => {
  formData.value = props.mappingItem?.value ?? ''
  formData.label = props.mappingItem?.label ?? ''
}

/** 重置 a-form 校验态 */
const resetForm = (): void => {
  formRef.value?.resetFields()
}

/** 异步校验表单 */
const validateForm = async (): Promise<boolean> => {
  try {
    await formRef.value?.validate()
    return true
  } catch {
    return false
  }
}

const handleSave = async (): Promise<void> => {
  const valid = await validateForm()
  if (!valid) {
    return
  }

  emit('save', {
    value: formData.value,
    label: formData.label
  })

  handleClose()
}

const handleClose = (): void => {
  emit('update:visible', false)
}
</script>

<style scoped>
</style>
