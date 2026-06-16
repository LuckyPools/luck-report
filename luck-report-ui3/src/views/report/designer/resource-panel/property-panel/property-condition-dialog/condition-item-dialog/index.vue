<template>
  <a-modal
    :title="t('dialog.editPropCondition.title')"
    :width="550"
    :open="visible"
    :mask-closable="false"
    @cancel="handleClose"
  >
    <div v-loading="loading">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        :label-col="{ style: { width: '120px' } }"
        :colon="false"
      >
        <!-- 关系选择 -->
        <a-form-item
          v-if="showJoin"
          :label="t('dialog.editPropCondition.relation')"
        >
          <a-select
            v-model:value="formData.join"
            :options="joinOptions"
            style="width: 300px;"
          />
        </a-form-item>

        <!-- 左值类型选择 -->
        <a-form-item :label="t('dialog.editPropCondition.leftValue')">
          <a-select
            v-model:value="formData.leftType"
            :options="leftTypeOptions"
            style="width: 300px;"
          />
        </a-form-item>

        <!-- 属性名选择 -->
        <a-form-item
          v-if="formData.leftType === 'property'"
          :label="t('dialog.editPropCondition.propName')"
          name="property"
        >
          <a-select
            v-model:value="formData.property"
            :options="fieldOptions"
            :allow-clear="true"
            style="width: 300px;"
          />
        </a-form-item>

        <!-- 表达式输入 -->
        <a-form-item
          v-if="formData.leftType === 'expression'"
          :label="t('dialog.editPropCondition.expr')"
          name="expression"
        >
          <a-input
            v-model:value="formData.expression"
            style="width: 300px;"
            @keyup.enter="handleOk"
          />
        </a-form-item>

        <!-- 运算符选择 -->
        <a-form-item :label="t('dialog.editPropCondition.operator')" name="operator">
          <a-select
            v-model:value="formData.operator"
            :options="operatorOptions"
            :allow-clear="true"
            style="width: 300px;"
          />
        </a-form-item>

        <!-- 值表达式输入 -->
        <a-form-item :label="t('dialog.editPropCondition.valueExpr')" name="value">
          <a-input
            v-model:value="formData.value"
            style="width: 300px;"
            @keyup.enter="handleOk"
          />
        </a-form-item>
      </a-form>
    </div>

    <template #footer>
      <a-button @click="handleClose" style="margin-right: 10px;">{{ t('dialog.common.cancel') }}</a-button>
      <a-button type="primary" :loading="loading" @click="handleOk">{{ t('dialog.common.ok') }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * ConditionItemDialog 条件项弹窗（vue3 + TS + ant-design-vue）
 *
 * 用途：新增 / 修改一条条件项的完整字段（关系 + 左值类型 + 属性/表达式 + 操作符 + 值表达式）
 * 工作流程：
 * 1. visible=true → resetForm + initData
 * 2. 用户填写表单 → 「确定」→ 校验（含 conditionScriptValidation 异步语法校验）→ emit('saveAfter', type, left, op, right, join?)
 *
 * 事件契约（与原版 luck-report-ui 完全一致）：
 * - condition 存在且有 join → emit('saveAfter', type, left, op, right, join)
 * - conditions 已有其他项 → emit('saveAfter', type, left, op, right, join)
 * - 否则 → emit('saveAfter', type, left, op, right)
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UForm/UFormItem/USelect/UOption/UInput/UButton（自定义）→ a-modal/a-form/a-form-item/a-select/a-select-option/a-input/a-button
 * - $refs.form.validate(callback) → formRef.value.validate() Promise 化
 * - mounted/beforeDestroy 绑定的 keydown → onMounted/onBeforeUnmount
 * - i18n 文案提前在 setup 中用 t() 取，避免在 reactive 规则中访问
 */
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'
import { conditionScriptValidation } from '@/api/designer'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ConditionItemDialog' })


const { t } = useI18n()
/** 字段元数据 */
interface Field {
  name: string
  [key: string]: unknown
}

/** 条件数据（与父组件 condition-item 共享） */
export interface Condition {
  type?: string
  left?: string | null
  operation?: string
  op?: string
  right?: string
  expr?: string
  join?: string | null
  id?: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    fields?: Field[]
    condition?: Condition | null
    conditions?: Condition[]
  }>(),
  {
    visible: false,
    fields: () => [],
    condition: null,
    conditions: () => []
  }
)

const emit = defineEmits<{
  (e: 'saveAfter', type: string, left: string | null, op: string, right: string, join?: string | null): void
  (e: 'update:visible', val: boolean): void
}>()

const formRef = ref()
const loading = ref<boolean>(false)
const showJoin = ref<boolean>(false)
const formData = reactive({
  join: 'and',
  leftType: 'current',
  property: '',
  expression: '',
  operator: '',
  value: ''
})

/** 属性名校验：左值类型为 property 时必填 */
const validateProperty = async (_rule: Rule, value: string): Promise<void> => {
  if (formData.leftType === 'property' && !value) {
    throw new Error(t('dialog.editPropCondition.selectProp'))
  }
}

/** 表达式（左值）校验：左值类型为 expression 时必填，且需要服务端语法校验 */
const validateExpression = async (_rule: Rule, value: string): Promise<void> => {
  if (formData.leftType !== 'expression') {
    return
  }
  if (!value) {
    throw new Error(t('dialog.editPropCondition.leftValueExpr'))
  }
  try {
    const errors = await conditionScriptValidation(value)
    if (errors && errors.length > 0) {
      throw new Error(`${value} ${t('dialog.editPropCondition.syntaxError')}`)
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error
    }
    console.error('验证表达式失败:', error)
    throw new Error(t('dialog.editPropCondition.syntaxError'))
  }
}

/** 值表达式校验：必填 + 服务端语法校验 */
const validateValue = async (_rule: Rule, value: string): Promise<void> => {
  if (!value) {
    throw new Error(t('dialog.editPropCondition.inputExpr'))
  }
  try {
    const errors = await conditionScriptValidation(value)
    if (errors && errors.length > 0) {
      throw new Error(`${value} ${t('dialog.editPropCondition.syntaxError')}`)
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error
    }
    console.error('验证值表达式失败:', error)
    throw new Error(t('dialog.editPropCondition.syntaxError'))
  }
}

const rules: Record<string, Rule[]> = {
  property: [
    {
      required: true,
      validator: validateProperty,
      trigger: 'blur'
    }
  ],
  expression: [
    {
      required: true,
      validator: validateExpression,
      trigger: 'blur'
    }
  ],
  operator: [
    {
      required: true,
      message: t('dialog.editPropCondition.selectOperator'),
      trigger: 'blur'
    }
  ],
  value: [
    {
      required: true,
      validator: validateValue,
      trigger: 'blur'
    }
  ]
}

const joinOptions = computed(() => [
  { value: 'and', label: t('dialog.editPropCondition.and') },
  { value: 'or', label: t('dialog.editPropCondition.or') }
])

const leftTypeOptions = computed(() => [
  { value: 'current', label: t('dialog.editPropCondition.currentValue') },
  { value: 'property', label: t('dialog.editPropCondition.property') },
  { value: 'expression', label: t('dialog.editPropCondition.expression') }
])

const fieldOptions = computed(() =>
  (props.fields || []).map((field) => ({
    value: field.name,
    label: field.name
  }))
)

const operatorOptions = computed(() => [
  { value: '>', label: t('dialog.editPropCondition.greater') },
  { value: '>=', label: t('dialog.editPropCondition.greaterEquals') },
  { value: '<', label: t('dialog.editPropCondition.less') },
  { value: '<=', label: t('dialog.editPropCondition.lessEquals') },
  { value: '==', label: t('dialog.editPropCondition.equals') },
  { value: '!=', label: t('dialog.editPropCondition.notEquals') },
  { value: 'in', label: t('dialog.editPropCondition.in') },
  { value: 'like', label: t('dialog.editPropCondition.like') }
])

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetForm()
      initData()
    }
  }
)

/** 重置 a-form 校验态 + showJoin */
const resetForm = (): void => {
  formRef.value?.resetFields()
  showJoin.value = false
}

/** 初始化：决定 showJoin + 回填表单 */
const initData = (): void => {
  if (props.condition) {
    showJoin.value = !!props.condition.join
  } else {
    showJoin.value = (props.conditions?.length ?? 0) > 0
  }

  if (props.condition) {
    formData.leftType = props.condition.type || 'current'

    if (formData.leftType === 'expression') {
      formData.expression = props.condition.left || ''
    } else if (props.condition.left) {
      formData.property = props.condition.left
    }

    // 特殊：type=property 但 left 为空 → 退回 current
    if (formData.leftType === 'property' && (!formData.property || formData.property === '')) {
      formData.leftType = 'current'
    }

    formData.operator = props.condition.operation || props.condition.op || ''
    formData.value = props.condition.right || ''
    formData.join = props.condition.join || 'and'
  } else {
    formData.leftType = 'current'
    formData.property = ''
    formData.expression = ''
    formData.operator = ''
    formData.value = ''
    formData.join = 'and'
  }
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
  if (loading.value) {
    return
  }

  loading.value = true
  try {
    const valid = await validateForm()
    if (!valid) {
      return
    }

    // 根据 leftType 推算最终 left
    let left: string | null = formData.property
    if (formData.leftType === 'expression') {
      left = formData.expression
    } else if (formData.leftType === 'current') {
      left = null
    }

    // 业务约束：leftType='current' 在落库时归一为 'property'（与原版一致）
    let type = formData.leftType
    if (type === 'current') {
      type = 'property'
    }

    const op = formData.operator
    const right = formData.value

    // 事件契约（与原版一致）：有 join / 列表已有其他项 → 带 join
    if (props.condition) {
      if (props.condition.join) {
        emit('saveAfter', type, left, op, right, formData.join)
      } else {
        emit('saveAfter', type, left, op, right)
      }
    } else if ((props.conditions?.length ?? 0) > 0) {
      emit('saveAfter', type, left, op, right, formData.join)
    } else {
      emit('saveAfter', type, left, op, right)
    }

    handleClose()
  } finally {
    loading.value = false
  }
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
