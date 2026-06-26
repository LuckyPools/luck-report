<template>
  <a-modal
    :title="title"
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
    >
      <a-form-item :label="t('dialog.conditionGroup.groupName')" name="name">
        <a-input
          v-model:value="formData.name"
          :placeholder="t('dialog.conditionGroup.nameTip')"
          @keyup.enter="handleOk"
        />
      </a-form-item>
    </a-form>

    <template #footer>
      <a-button @click="handleClose" style="margin-right: 10px;">{{ t('dialog.common.cancel') }}</a-button>
      <a-button type="primary" @click="handleOk">{{ t('dialog.common.ok') }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * ConditionGroupDialog 条件组弹窗（vue3 + TS + ant-design-vue）
 *
 * 用途：新增 / 修改条件分组的名称（仅名称）
 * 工作流程：
 * 1. visible=true → resetForm + 回填名称
 * 2. 用户输入名称 → 「确定」→ 校验 + 重名检查 → emit('saveAfter', { group, operation })
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UForm/UFormItem/UInput/UButton（自定义）→ a-modal/a-form/a-form-item/a-input/a-button
 * - $refs.form.validate(callback) → formRef.value.validate() Promise 化
 */
import { ref, reactive, computed, watch } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'
import { showAlert } from '@/utils/comnon'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ConditionGroupDialog' })


const { t } = useI18n()
export interface ConditionGroup {
  id?: string
  name?: string
  conditions?: unknown[]
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    conditionGroup?: ConditionGroup | null
    operation?: 'add' | 'edit'
    conditionGroups?: ConditionGroup[]
  }>(),
  {
    visible: false,
    conditionGroup: null,
    operation: 'add',
    conditionGroups: () => []
  }
)

const emit = defineEmits<{
  (e: 'saveAfter', payload: { group: ConditionGroup; operation: 'add' | 'edit' }): void
  (e: 'update:visible', val: boolean): void
}>()

const formRef = ref()
const formData = reactive({
  name: ''
})

const rules: Record<string, Rule[]> = {
  name: [
    {
      required: true,
      message: t('dialog.conditionGroup.nameTip'),
      trigger: 'blur'
    }
  ]
}

/** 弹窗标题根据操作类型变化 */
const title = computed<string>(() => {
  if (props.operation === 'add') {
    return t('dialog.conditionGroup.add')
  }
  if (props.operation === 'edit') {
    return t('dialog.conditionGroup.edit')
  }
  return t('dialog.conditionGroup.title')
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetFormData()
      initData()
    }
  }
)

/** 回填：编辑时把现有名称写入表单 */
const initData = (): void => {
  formData.name = props.conditionGroup?.name || ''
}

/** 重置 a-form 校验态 */
const resetFormData = (): void => {
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

const handleOk = async (): Promise<void> => {
  const valid = await validateForm()
  if (!valid) {
    return
  }

  // 重名检查：编辑时跳过自身
  const isDuplicate = props.conditionGroups.some((item) => {
    if (props.operation === 'edit' && item === props.conditionGroup) {
      return false
    }
    return item.name === formData.name
  })

  if (isDuplicate) {
    showAlert(t('dialog.conditionGroup.nameExists'))
    return
  }

  const group: ConditionGroup = {
    ...(props.conditionGroup || {}),
    name: formData.name
  }

  emit('saveAfter', {
    group,
    operation: props.operation
  })

  handleClose()
}

const handleClose = (): void => {
  emit('update:visible', false)
}
</script>

<style scoped>
</style>
