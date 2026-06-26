<template>
  <div>
    <a-modal
      :title="t('dialog.bean.beanDatasetConfig')"
      :width="600"
      :open="visible"
      :zIndex="21000"
      :mask-closable="false"
      @cancel="handleClose"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        :label-col="{ style: { width: '120px' } }"
      >
        <a-form-item :label="t('dialog.bean.datasetName')" name="name">
          <a-input v-model:value="formData.name" style="width: 400px" />
        </a-form-item>

        <a-form-item :label="t('dialog.bean.methodName')" name="method">
          <div class="input-group">
            <a-input
              v-model:value="formData.method"
              :placeholder="t('dialog.bean.methodParameters')"
              style="width: 300px"
            />
            <span class="input-group-btn">
              <a-button type="text" @click.prevent="selectMethod">
                {{ t('dialog.bean.selectMethod') }}
              </a-button>
            </span>
          </div>
        </a-form-item>

        <a-form-item :label="t('dialog.bean.returnObject')" name="clazz">
          <a-input
            v-model:value="formData.clazz"
            :placeholder="t('dialog.bean.className')"
            style="width: 400px"
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

    <MethodSelectDialog
      v-model:visible="methodSelectDialogVisible"
      :beanId="beanId"
      @save="handleMethodSelect"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * BeanMethodDialog SpringBean 数据集配置弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → resetForm / initData
 * 2. 「选择方法」→ 打开 MethodSelectDialog
 * 3. 「确定」→ 校验 → 查重 → emit('save', name, method, clazz, oldName)
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UForm/UFormItem/UInput/UButton（自定义）→ a-modal/a-form/a-form-item/a-input/a-button
 * - $refs.form.validate → formRef.value.validate()
 * - this.$emit → defineEmits
 * - 子弹窗 visible 双向绑定：v-model:visible
 */
import { ref, reactive, watch } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'
import { setDirty } from '@/utils/table'
import { showAlert } from '@/utils/comnon'
import MethodSelectDialog from '@/views/report/designer/resource-panel/datasource-panel/method-select-dialog/index.vue'
import type { ReportDatasource } from '@/types/report-def'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'BeanMethodDialog' })


const { t } = useI18n()
/** 表单数据结构 */
interface BeanForm {
  name: string
  method: string
  clazz: string
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    beanId?: string
    datasources?: ReportDatasource[]
    dataset?: any
  }>(),
  {
    visible: false,
    beanId: '',
    datasources: () => [],
    dataset: null
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', name: string, method: string, clazz: string, oldName: string): void
}>()

const formRef = ref()
const methodSelectDialogVisible = ref<boolean>(false)
const oldName = ref<string>('')

const formData = reactive<BeanForm>({
  name: '',
  method: '',
  clazz: ''
})

const rules: Record<string, Rule[]> = {
  name: [
    { required: true, message: t('dialog.bean.datasetNameRequired'), trigger: 'blur' }
  ],
  method: [
    { required: true, message: t('dialog.bean.methodRequired'), trigger: 'blur' }
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
  formRef.value?.resetFields()
  oldName.value = ''
}

/** 回填表单 */
function initData(): void {
  formData.name = ''
  formData.method = ''
  formData.clazz = ''
  oldName.value = ''

  if (props.dataset) {
    oldName.value = props.dataset.name || ''
    formData.name = props.dataset.name || ''
    formData.method = props.dataset.method || ''
    formData.clazz = props.dataset.clazz || ''
  }
}

/** 关闭弹窗 */
function closeDialog(): void {
  emit('close')
}

/** 取消按钮 */
function handleClose(): void {
  closeDialog()
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

/** 打开方法选择子弹窗 */
function selectMethod(event?: Event): void {
  event?.preventDefault()
  methodSelectDialogVisible.value = true
}

/** 子弹窗选中的方法回填到 formData.method */
function handleMethodSelect(method: string): void {
  formData.method = method
}

/** 校验数据集名是否重复 */
function validateName(): boolean {
  let needCheck = false
  if (!oldName.value || formData.name !== oldName.value) {
    needCheck = true
  }

  if (needCheck) {
    for (const datasource of props.datasources || []) {
      const datasets = datasource.datasets
      if (!datasets || !Array.isArray(datasets)) continue
      for (const dataset of datasets) {
        if (dataset.name === formData.name) {
          showAlert(`${formData.name} ${t('dialog.bean.datasetExist')}`)
          return false
        }
      }
    }
  }
  return true
}

/** 保存 */
async function handleOk(): Promise<void> {
  const valid = await validateForm()
  if (!valid) return
  if (!validateName()) return

  emit('save', formData.name, formData.method, formData.clazz, oldName.value)
  setDirty()
  closeDialog()
}
</script>

<style scoped>
.input-group {
  display: flex;
  align-items: center;
}

.input-group-btn {
  margin-left: 10px;
}
</style>
