<template>
  <a-modal
    :title="t('dialog.datasource.title')"
    :width="800"
    :open="visible"
    :mask-closable="false"
    @cancel="closeDialog"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ style: { width: '120px' } }"
    >
      <a-form-item :label="t('dialog.datasource.name')" name="dsName">
        <a-input v-model:value="formData.dsName" style="width: 600px" />
      </a-form-item>

      <a-form-item :label="t('dialog.datasource.username')" name="username">
        <a-input v-model:value="formData.username" style="width: 600px" />
      </a-form-item>

      <a-form-item :label="t('dialog.datasource.password')" name="password">
        <a-input-password
          v-model:value="formData.password"
          style="width: 600px"
        />
      </a-form-item>

      <a-form-item :label="t('dialog.datasource.driver')" name="driver">
        <a-input v-model:value="formData.driver" style="width: 600px" />
      </a-form-item>

      <a-form-item :label="t('dialog.datasource.url')" name="url">
        <a-input v-model:value="formData.url" style="width: 600px" />
      </a-form-item>
    </a-form>

    <template #footer>
      <a-button @click="testConnection(true)" :loading="testing" style="margin-right: 10px;">
        {{ t('dialog.datasource.test') }}
      </a-button>
      <a-button type="primary" @click="handleOk" :loading="confirmLoading">
        {{ t('dialog.common.ok') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * DatasourceDialog 数据源配置弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → resetForm / initData 填充表单
 * 2. 「测试连接」→ 走表单校验 → testConnection API
 * 3. 「确定」→ 校验 → 隐式 testConnection → emit('save', ...)
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UForm/UFormItem/UInput/UButton（自定义）→ a-modal/a-form/a-form-item/a-input/a-button
 * - $refs.form.validate → formRef.value.validate()
 * - this.$emit → defineEmits
 * - watch visible → 监听 props.visible
 */
import { ref, reactive, watch } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'
import { showAlert } from '@/utils/comnon'
import { setDirty } from '@/utils/table'
import { testConnection as testConnectionApi } from '@/api/designer'
import type { ReportDatasource } from '@/types/report-def'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'DatasourceDialog' })


const { t } = useI18n()
/** 表单数据结构 */
interface DatasourceForm {
  dsName: string
  username: string
  password: string
  driver: string
  url: string
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
    username: string
    password: string
    driver: string
    url: string
    oldName: string | null
    type: 'jdbc'
  }): void
}>()

const formRef = ref()
const testing = ref<boolean>(false)
const confirmLoading = ref<boolean>(false)
const oldName = ref<string | null>(null)

const formData = reactive<DatasourceForm>({
  dsName: '',
  username: '',
  password: '',
  driver: '',
  url: ''
})

/** 自定义校验：名称必填 + 查重 */
const validateDsName = async (_rule: Rule, value: string): Promise<void> => {
  if (!value) {
    throw new Error(t('dialog.datasource.nameTip'))
  }
  if (checkDuplicateName(value)) {
    return
  }
  throw new Error(
    `${t('dialog.datasource.datasource')}[${value}]${t('dialog.datasource.existTip')}`
  )
}

const rules: Record<string, Rule[]> = {
  dsName: [{ required: true, validator: validateDsName, trigger: 'blur' }],
  username: [
    { required: true, message: t('dialog.datasource.usernameTip'), trigger: 'blur' }
  ],
  password: [
    { required: true, message: t('dialog.datasource.passwordTip'), trigger: 'blur' }
  ],
  driver: [
    { required: true, message: t('dialog.datasource.driverTip'), trigger: 'blur' }
  ],
  url: [{ required: true, message: t('dialog.datasource.urlTip'), trigger: 'blur' }]
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
  formRef.value?.resetFields()
  oldName.value = null
}

/** 回填表单（编辑模式） */
function initData(): void {
  const d = props.datasource
  oldName.value = d?.name ?? null
  formData.dsName = d?.name ?? ''
  formData.username = (d as any)?.username ?? ''
  formData.password = (d as any)?.password ?? ''
  formData.driver = (d as any)?.driver ?? ''
  formData.url = (d as any)?.url ?? ''
}

/** 校验重名（排除当前编辑项） */
function checkDuplicateName(name: string): boolean {
  if (!oldName.value || name !== oldName.value) {
    for (const source of props.datasources || []) {
      if (source.name === name) return false
    }
  }
  return true
}

/** 关闭弹窗 */
function closeDialog(): void {
  emit('close')
}

/** 表单校验（antd 形式返回 Promise<boolean>） */
async function validateForm(): Promise<boolean> {
  try {
    await formRef.value?.validate()
    return true
  } catch {
    return false
  }
}

/** 测试连接：可选择是否展示成功提示 */
async function testConnection(showSuccessTips: boolean): Promise<boolean> {
  const valid = await validateForm()
  if (!valid) return false

  testing.value = true
  const form = new FormData()
  form.append('username', formData.username)
  form.append('password', formData.password)
  form.append('driver', formData.driver)
  form.append('url', formData.url)

  try {
    const data = await testConnectionApi(form)
    if (data?.result && showSuccessTips) {
      showAlert(t('dialog.datasource.testSuccess'))
    }
    return true
  } catch (error: any) {
    console.error('Error testing connection:', error)
    if (error?.msg) {
      showAlert(t('dialog.datasource.failTip') + t('colon') + error.msg, {
        useHTMLString: true
      })
    } else {
      showAlert(t('dialog.datasource.failTip'))
    }
    return false
  } finally {
    testing.value = false
  }
}

/** 确定按钮：先校验、再测试连接，成功后 emit('save') */
async function handleOk(): Promise<void> {
  confirmLoading.value = true
  try {
    const success = await testConnection(false)
    if (!success) return

    emit('save', {
      name: formData.dsName,
      username: formData.username,
      password: formData.password,
      driver: formData.driver,
      url: formData.url,
      oldName: oldName.value,
      type: 'jdbc'
    })
    setDirty()
    closeDialog()
  } finally {
    confirmLoading.value = false
  }
}
</script>

<style scoped>
.ant-modal-body {
  padding-top: 16px;
}
</style>
