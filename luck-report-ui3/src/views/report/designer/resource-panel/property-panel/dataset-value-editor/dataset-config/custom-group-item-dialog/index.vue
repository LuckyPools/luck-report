<template>
  <a-modal
    :title="dialogTitle"
    :width="500"
    :open="visible"
    :mask-closable="false"
    @cancel="handleClose"
  >
    <div class="dialog-content">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        :label-col="{ style: { width: '120px' } }"
      >
        <a-form-item :label="t('dialog.groupItem.name')" name="name">
          <a-input
            ref="nameInputRef"
            v-model:value="formData.name"
            style="width: 240px;"
            @press-enter="handleOk"
          />
        </a-form-item>
      </a-form>
    </div>
    <template #footer>
      <a-button @click="handleClose" style="margin-right: 10px;">{{ t('dialog.common.cancel') }}</a-button>
      <a-button type="primary" @click="handleOk">{{ t('dialog.common.ok') }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * GroupItemDialog 自定义分组项弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → resetForm + initData 回填名称
 * 2. 用户输入名称 → 「确定」→ 校验 → emit('saveAfter', { operation, groupItem })
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UForm/UFormItem/UInput/UButton（自定义）→ a-modal/a-form/a-form-item/a-input/a-button
 * - $refs.form.validate(callback) → formRef.value.validate() Promise 化
 */
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'GroupItemDialog' })


const { t } = useI18n()
/** 分组项结构 */
export interface GroupItem {
  name: string
  conditions?: unknown[]
  [key: string]: unknown
}

/** saveAfter 事件载荷 */
export interface GroupItemSavePayload {
  operation: string
  groupItem: GroupItem | null
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    groupItem?: GroupItem | null
    operation?: string
  }>(),
  {
    visible: false,
    groupItem: null,
    operation: 'add'
  }
)

const emit = defineEmits<{
  (e: 'saveAfter', payload: GroupItemSavePayload): void
  (e: 'update:visible', val: boolean): void
}>()

const formRef = ref()
const nameInputRef = ref()
const formData = reactive({ name: '' })

const rules: Record<string, Rule[]> = {
  name: [
    {
      required: true,
      message: t('dialog.groupItem.nameTip'),
      trigger: 'blur'
    }
  ]
}

const dialogTitle = computed(() =>
  props.operation === 'add'
    ? t('dialog.groupItem.addItem')
    : t('dialog.groupItem.editItem')
)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetFormData()
      initData()
      nextTick(() => {
        nameInputRef.value?.focus?.()
      })
    }
  }
)

/** 回填名称 */
const initData = (): void => {
  formData.name = props.groupItem?.name || ''
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

  const updatedGroupItem: GroupItem | null = props.groupItem
    ? { ...props.groupItem, name: formData.name }
    : null

  emit('saveAfter', {
    operation: props.operation,
    groupItem: updatedGroupItem
  })

  handleClose()
}

const handleClose = (): void => {
  emit('update:visible', false)
}

const handleKeydown = (e: KeyboardEvent): void => {
  if (props.visible && e.key === 'Escape') {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
</style>
