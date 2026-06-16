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
      :colon="false"
    >
      <a-form-item :label="t('dialog.paramItem.name')" name="name">
        <a-input
          v-model:value="formData.name"
          ref="nameInput"
          @keyup.enter="handleOk"
        />
      </a-form-item>

      <a-form-item :label="t('dialog.paramItem.expr')" name="value">
        <a-input
          v-model:value="formData.value"
          ref="valueInput"
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
 * URLParameterItemDialog URL 参数项弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → resetFormData + initData
 * 2. 用户编辑 → 「确定」→ 校验 → emit('saveAfter', { paramItem, operation })
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UForm/UFormItem/UInput/UButton（自定义）→ a-modal/a-form/a-form-item/a-input/a-button
 * - $refs.form.validate(callback) → formRef.value.validate() Promise 化
 * - keydown 监听从 mounted/beforeDestroy 迁移到 onMounted/onBeforeUnmount
 */
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'URLParameterItemDialog' })


const { t } = useI18n()
/** url 参数项结构 */
export interface UrlParameterItem {
  name: string
  value: string
}

type OperationType = 'add' | 'edit'

interface SaveAfterPayload {
  paramItem: UrlParameterItem
  operation: OperationType
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    paramItem?: UrlParameterItem | null
    operation?: OperationType
  }>(),
  {
    visible: false,
    paramItem: null,
    operation: 'add'
  }
)

const emit = defineEmits<{
  (e: 'saveAfter', payload: SaveAfterPayload): void
  (e: 'update:visible', val: boolean): void
}>()

/** 弹窗标题：新增 / 编辑 */
const title = computed<string>(() => {
  return props.operation === 'add'
    ? t('dialog.paramItem.add')
    : t('dialog.paramItem.edit')
})

const formRef = ref()
const formData = reactive<UrlParameterItem>({ name: '', value: '' })

const rules: Record<string, Rule[]> = {
  name: [
    {
      required: true,
      message: t('dialog.paramItem.nameRequired'),
      trigger: 'blur'
    }
  ],
  value: [
    {
      required: true,
      message: t('dialog.paramItem.valueRequired'),
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

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})

/** 回填名称/值 */
const initData = (): void => {
  formData.name = props.paramItem?.name ?? ''
  formData.value = props.paramItem?.value ?? ''
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

  const paramItem: UrlParameterItem = {
    name: formData.name,
    value: formData.value
  }

  emit('saveAfter', {
    paramItem,
    operation: props.operation
  })

  handleClose()
}

const handleClose = (): void => {
  emit('update:visible', false)
}

/** 键盘事件：ESC 关闭弹窗 */
const handleKeydown = (e: KeyboardEvent): void => {
  if (props.visible && e.key === 'Escape') {
    handleClose()
  }
}
</script>

<style scoped>
</style>
