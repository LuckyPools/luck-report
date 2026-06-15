<template>
  <a-modal
    :title="t('dialog.conditionItem.title')"
    :width="500"
    :open="visible"
    :z-index="20000"
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
      <a-form-item
        v-show="showJoinGroup"
        :label="t('dialog.condition.relationship')"
      >
        <a-select v-model:value="formData.joinValue">
          <a-select-option value="and">{{ t('dialog.condition.and') }}</a-select-option>
          <a-select-option value="or">{{ t('dialog.condition.or') }}</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item :label="t('dialog.conditionItem.name')" name="name">
        <a-input v-model:value="formData.name" />
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
 * ConditionItemDialog 条件项弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → resetForm + initData
 * 2. 用户输入名称 → 「确定」→ 校验 → emit('saveAfter', { name, join })
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UForm/UFormItem/UInput/UButton（自定义）→ a-modal/a-form/a-form-item/a-input/a-button
 * - $refs.form.validate(callback) → formRef.value.validate() Promise 化
 */
import { ref, reactive, watch } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ConditionItemDialog' })


const { t } = useI18n()
/** 条件项结构 */
export interface ConditionItem {
  name: string
  join?: string | null
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    conditionItem?: ConditionItem | null
    conditions?: ConditionItem[]
  }>(),
  {
    visible: false,
    conditionItem: null,
    conditions: () => []
  }
)

const emit = defineEmits<{
  (e: 'saveAfter', payload: { name: string; join: string | null }): void
  (e: 'update:visible', val: boolean): void
}>()

const formRef = ref()
const showJoinGroup = ref<boolean>(false)
const formData = reactive({
  joinValue: 'and',
  name: ''
})

const rules: Record<string, Rule[]> = {
  name: [
    {
      required: true,
      message: t('dialog.conditionItem.nameTip'),
      trigger: 'blur'
    }
  ]
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetFormData()
      initData()
    }
  }
)

/** 初始化：决定 join 是否可见 + 回填名称 */
const initData = (): void => {
  const conditionItem = props.conditionItem
  if (conditionItem) {
    showJoinGroup.value = !!conditionItem.join
  } else {
    showJoinGroup.value = (props.conditions?.length ?? 0) > 0
  }

  formData.joinValue = conditionItem?.join || 'and'
  formData.name = conditionItem?.name || ''
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

  emit('saveAfter', {
    name: formData.name,
    join: showJoinGroup.value ? formData.joinValue : null
  })

  handleClose()
}

const handleClose = (): void => {
  emit('update:visible', false)
}
</script>

<style scoped>
</style>
