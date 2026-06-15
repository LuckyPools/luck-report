<template>
  <div>
    <div class="top-button">
      <a-button
        type="primary"
        :title="t('dialog.propCondition.addValue')"
        @click="addCondition"
      >
        <template #icon><i class="iconfont icon-plus-circle"></i></template>
      </a-button>
      <a-button
        type="primary"
        :title="t('dialog.propCondition.editConditionItem')"
        @click="editCondition"
      >
        <template #icon><i class="iconfont icon-edit"></i></template>
      </a-button>
      <a-button
        type="primary"
        :title="t('dialog.propCondition.delCondition')"
        @click="deleteCondition"
      >
        <template #icon><i class="iconfont icon-delete"></i></template>
      </a-button>
    </div>

    <div style="margin-top: 10px;">
      <a-select
          v-model:value="selectedConditionIndex"
          class="condition-select"
          :options="conditionOptions"
          :field-names="{ label: 'label', value: 'value' }"
          style="width: 100%"
      />
    </div>

    <ConditionItemDialog
      v-model:visible="dialogVisible"
      :fields="fields"
      :condition-item="editingCondition"
      :conditions="localConditions"
      @saveAfter="handleSaveAfter"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ConditionItem 条件项列表管理（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - u-button（自定义）→ a-button
 * - 原生 <select> → a-select
 * - 移除 Vuex（getContext 未使用）
 * - 子弹窗使用 v-model:visible 双向绑定
 */
import { ref, computed, watch } from 'vue'
import { showAlert } from '@/utils/comnon'
import { setDirty } from '@/utils/table'
import { v1 as uuid } from 'uuid'
import ConditionItemDialog, { type ConditionItem } from '../condition-item-dialog/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ConditionItem' })


const { t } = useI18n()
interface Field {
  name: string
  [key: string]: unknown
}

interface Condition {
  type?: string
  left?: string
  operation?: string
  right?: string
  expr?: string
  join?: string | null
  id?: string
  [key: string]: unknown
}

interface SelectedGroup {
  id?: string
  name?: string
  conditions?: Condition[]
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    selectedGroup?: SelectedGroup | null
    fields?: Field[]
    conditions?: Condition[]
    resetSelection?: boolean
  }>(),
  {
    selectedGroup: null,
    fields: () => [],
    conditions: () => [],
    resetSelection: true
  }
)

const emit = defineEmits<{
  (e: 'condition-added', condition: Condition): void
  (e: 'condition-updated', index: number, condition: Condition): void
  (e: 'condition-deleted', index: number): void
  (e: 'condition-selected', condition: Condition): void
}>()

const selectedConditionIndex = ref<number>(-1)
const isAddingCondition = ref<boolean>(false)
const dialogVisible = ref<boolean>(false)
const editingCondition = ref<ConditionItem | null>(null)
const localConditions = ref<Condition[]>([])

const conditionOptions = computed<{ value: number; label: string }[]>(() => {
  return props.conditions.map((condition, index) => ({
    value: index,
    label: getConditionText(condition, index)
  }))
})

watch(
  () => props.resetSelection,
  (newVal) => {
    if (newVal) {
      selectedConditionIndex.value = -1
    }
  }
)

watch(
  () => props.conditions,
  (newVal) => {
    if (newVal) {
      selectedConditionIndex.value = -1
      localConditions.value = newVal
    }
  },
  { immediate: true, deep: true }
)

const getConditionText = (condition: Condition, index: number): string => {
  let text = `${condition.left || ''} ${condition.operation || ''} ${condition.right || ''}`
  if (condition.type === 'property' && (!condition.left || condition.left === '')) {
    text = `${t('dialog.propCondition.currentValue')} ${condition.operation || ''} ${condition.right || condition.expr || ''}`
  }
  if (condition.join && index > 0) {
    text = `${condition.join} ${text}`
  }
  return text
}

const addCondition = (): void => {
  if (!props.selectedGroup) {
    showAlert(t('dialog.propCondition.selectItem'))
    return
  }

  localConditions.value = props.selectedGroup.conditions || []

  isAddingCondition.value = true
  editingCondition.value = null
  dialogVisible.value = true
}

const editCondition = (): void => {
  if (selectedConditionIndex.value < 0 || selectedConditionIndex.value >= props.conditions.length) {
    showAlert(t('dialog.propCondition.editConditionTip'))
    return
  }

  if (!props.selectedGroup) {
    showAlert(t('dialog.propCondition.selectConditionItem'))
    return
  }

  const condition = props.conditions[selectedConditionIndex.value]
  localConditions.value = props.selectedGroup.conditions || []

  isAddingCondition.value = false
  editingCondition.value = {
    name: (condition.left as string) || '',
    join: condition.join ?? null
  }
  dialogVisible.value = true
}

const handleSaveAfter = (data: { name: string; join: string | null }): void => {
  if (!props.selectedGroup) {
    return
  }

  if (isAddingCondition.value) {
    const newCondition: Condition = {
      type: 'property',
      left: data.name,
      operation: '=',
      right: '',
      join: data.join,
      id: uuid()
    }
    emit('condition-added', newCondition)
    isAddingCondition.value = false
  } else {
    if (selectedConditionIndex.value >= 0 && selectedConditionIndex.value < props.conditions.length) {
      const condition = props.conditions[selectedConditionIndex.value]
      const updatedCondition: Condition = {
        ...condition,
        type: 'property',
        left: data.name,
        operation: condition.operation || '=',
        right: condition.right || '',
        join: data.join,
        id: condition.id || uuid()
      }
      emit('condition-updated', selectedConditionIndex.value, updatedCondition)
    }
    isAddingCondition.value = false
  }

  dialogVisible.value = false
  setDirty()
}

const deleteCondition = (): void => {
  if (selectedConditionIndex.value < 0 || selectedConditionIndex.value >= props.conditions.length) {
    showAlert(t('dialog.propCondition.delConditionTip'))
    return
  }

  if (!props.selectedGroup) {
    showAlert(t('dialog.propCondition.selectDelCondition'))
    return
  }

  emit('condition-deleted', selectedConditionIndex.value)
  selectedConditionIndex.value = -1
  setDirty()
}

watch(selectedConditionIndex, (newVal) => {
  if (newVal >= 0 && newVal < props.conditions.length) {
    const selectedCondition = props.conditions[newVal]
    emit('condition-selected', selectedCondition)
  }
})
</script>

<style scoped>
.top-button {
  display: flex;
  justify-content: end;
}

.top-button :deep(.ant-btn + .ant-btn) {
  margin-left: 5px;
}

.condition-select {
  height: 400px;
  padding: 3px;
  outline: none;
}
</style>
