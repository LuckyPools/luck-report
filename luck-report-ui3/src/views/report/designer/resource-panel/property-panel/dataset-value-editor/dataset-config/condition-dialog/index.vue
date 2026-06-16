<template>
  <a-modal
    :title="t('dialog.condition.config')"
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
        :colon="false"
      >
        <a-form-item
          v-show="showJoinGroup"
          :label="t('dialog.condition.relationship')"
        >
          <a-select v-model:value="formData.joinValue">
            <a-select-option
              v-for="option in joinOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item :label="t('dialog.condition.propertyName')" name="propertyValue">
          <a-select v-model:value="formData.propertyValue" :allow-clear="true">
            <a-select-option
              v-for="option in propertyOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item :label="t('dialog.condition.op')" name="operatorValue">
          <a-select v-model:value="formData.operatorValue" :allow-clear="true">
            <a-select-option
              v-for="option in operatorOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item :label="t('dialog.condition.valueExpr')" name="valueExpr">
          <a-input v-model:value="formData.valueExpr" />
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
 * ConditionDialog 条件配置弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → resetForm + initData
 * 2. 用户选择属性 / 操作符 / 输入表达式
 * 3. 「确定」→ 校验表达式语法（conditionScriptValidation）→ emit('saveAfter', conditionData)
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UForm/UFormItem/USelect/UOption/UInput/UButton（自定义）→ a-modal/a-form/a-form-item/a-select/a-select-option/a-input/a-button
 * - $refs.form.validate(callback) → formRef.value.validate() Promise 化
 * - mounted/beforeDestroy 绑定的 keydown → onMounted/onBeforeUnmount
 * - i18n 文案提前在 setup 中用 $t 取，避免在 reactive 规则中访问
 */
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'
import { conditionScriptValidation } from '@/api/designer'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ConditionDialog' })


const { t } = useI18n()
/** 字段元数据 */
interface Field {
  name: string
  [key: string]: unknown
}

/** 条件数据载荷 */
export interface ConditionData {
  left: string
  operation: string
  right: string
  join: string | null
  isEdit: boolean
  id: string | null
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    fields?: Field[]
    condition?: ConditionData | null
    conditions?: ConditionData[]
  }>(),
  {
    visible: false,
    fields: () => [],
    condition: null,
    conditions: () => []
  }
)

const emit = defineEmits<{
  (e: 'saveAfter', data: ConditionData): void
  (e: 'update:visible', val: boolean): void
}>()

const formRef = ref()
const showJoinGroup = ref<boolean>(false)
const formData = reactive({
  joinValue: 'and',
  propertyValue: '',
  operatorValue: '==',
  valueExpr: ''
})

/** 表达式异步校验：语法错误时通过 Promise reject 表达 */
const validateValueExpr = async (_rule: Rule, value: string): Promise<void> => {
  if (!value) {
    throw new Error(t('dialog.condition.inputExpr'))
  }
  try {
    const errors = await conditionScriptValidation(value)
    if (errors && errors.length > 0) {
      throw new Error(`${value} ${t('dialog.condition.exprError')}`)
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error
    }
    console.error('Error validating expression:', error)
    throw new Error(t('dialog.condition.exprError'))
  }
}

const rules: Record<string, Rule[]> = {
  propertyValue: [
    {
      required: true,
      message: t('dialog.condition.selectProperty'),
      trigger: 'blur'
    }
  ],
  operatorValue: [
    {
      required: true,
      message: t('dialog.condition.selectOp'),
      trigger: 'blur'
    }
  ],
  valueExpr: [
    {
      required: true,
      validator: validateValueExpr,
      trigger: 'blur'
    }
  ]
}

const joinOptions = computed(() => [
  { value: 'and', label: t('dialog.condition.and') },
  { value: 'or', label: t('dialog.condition.or') }
])

const propertyOptions = computed(() =>
  (props.fields || []).map((field) => ({
    value: field.name,
    label: field.name
  }))
)

const operatorOptions = computed(() => [
  { value: '>', label: t('dialog.condition.greatThen') },
  { value: '>=', label: t('dialog.condition.greatEquals') },
  { value: '<', label: t('dialog.condition.lessThen') },
  { value: '<=', label: t('dialog.condition.lessEquals') },
  { value: '==', label: t('dialog.condition.equals') },
  { value: '!=', label: t('dialog.condition.notEquals') },
  { value: 'in', label: t('dialog.condition.in') },
  { value: 'like', label: t('dialog.condition.like') }
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

/** 初始化：决定是否显示 join 字段 + 回填 condition */
const initData = (): void => {
  const fields = props.fields || []
  const condition = props.condition

  if (condition) {
    showJoinGroup.value = !!condition.join
  } else {
    showJoinGroup.value = (props.conditions?.length ?? 0) > 0
  }

  if (condition) {
    formData.joinValue = condition.join || 'and'
    formData.propertyValue = condition.left || ''
    formData.operatorValue = condition.operation || condition.op || '=='
    formData.valueExpr = condition.right || ''
  } else {
    formData.joinValue = 'and'
    formData.propertyValue = fields.length > 0 ? fields[0].name : ''
    formData.operatorValue = '=='
    formData.valueExpr = ''
  }
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

  const conditionData: ConditionData = {
    left: formData.propertyValue,
    operation: formData.operatorValue,
    right: formData.valueExpr,
    join: showJoinGroup.value ? formData.joinValue : null,
    isEdit: !!props.condition,
    id: props.condition?.id ?? null
  }

  emit('saveAfter', conditionData)
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
