<template>
  <a-modal
    :open="dialogVisible"
    width="500px"
    :title="t('searchForm.generateType')"
    @update:open="onUpdateOpen"
    @ok="handleConfirm"
    @cancel="close"
  >
    <a-row :gutter="15">
      <a-form
        ref="aFormRef"
        :model="formData"
        :rules="rules"
        size="middle"
        :label-width="100"
      >
        <a-col :span="24">
          <a-form-item :label="t('searchForm.generateType')" prop="type">
            <a-radio-group v-model:value="formData.type" option-type="button" button-style="solid">
              <a-radio
                v-for="(item, index) in typeOptions"
                :key="index"
                :value="item.value"
                :disabled="item.disabled"
              >
                {{ item.label }}
              </a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item v-if="showFileName" :label="t('searchForm.fileName')" prop="fileName">
            <a-input v-model:value="formData.fileName" :placeholder="t('searchForm.enterFileName')" allow-clear />
          </a-form-item>
        </a-col>
      </a-form>
    </a-row>

    <template #footer>
      <a-button @click="close" style="margin-right: 10px;">
        {{ t('searchForm.cancel') }}
      </a-button>
      <a-button type="primary" @click="handleConfirm">
        {{ t('searchForm.confirm') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Rule } from 'ant-design-vue/es/form'

interface TypeOption {
  label: string
  value: 'file' | 'dialog'
  disabled?: boolean
}

const props = defineProps<{
  showFileName: boolean
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'confirm', payload: { type: 'file' | 'dialog'; fileName?: string }): void
}>()

const { t } = useI18n()

const dialogVisible = ref(false)
const aFormRef = ref()
const formData = reactive<{ type: 'file' | 'dialog'; fileName?: string }>({
  type: 'file',
  fileName: undefined
})

const rules: Record<string, Rule[]> = {
  fileName: [
    {
      required: true,
      message: t('searchForm.enterFileName') as string,
      trigger: 'blur'
    }
  ],
  type: [
    {
      required: true,
      message: (t('searchForm.generateType') as string) + t('searchForm.cannotBeEmpty', { field: t('searchForm.generateType') }) as string,
      trigger: 'change'
    }
  ]
}

const typeOptions = computed<TypeOption[]>(() => [
  { label: t('searchForm.page') as string, value: 'file' },
  { label: t('searchForm.dialog') as string, value: 'dialog' }
])

watch(
  () => props.visible,
  (newVal) => {
    dialogVisible.value = newVal
  },
  { immediate: true }
)

watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
})

function onUpdateOpen(val: boolean) {
  dialogVisible.value = val
}

function onOpen() {
  if (props.showFileName) {
    formData.fileName = `${+new Date()}.vue`
  }
}

function onClose() {
  // 关闭后无需清理（a-modal 自身维护）
}

function close() {
  dialogVisible.value = false
}

async function handleConfirm() {
  try {
    await aFormRef.value?.validate()
  } catch {
    return
  }
  emit('confirm', { ...formData })
  close()
}
</script>
