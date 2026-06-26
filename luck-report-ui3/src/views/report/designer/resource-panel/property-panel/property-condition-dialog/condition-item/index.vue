<template>
  <div>
    <div class="top-button">
      <a-button
        :title="t('dialog.propCondition.addValue')"
        @click="addCondition"
      >
        <template #icon><i class="iconfont icon-plus-circle"></i></template>
      </a-button>
      <a-button
        :title="t('dialog.propCondition.editConditionItem')"
        @click="editCondition"
      >
        <template #icon><i class="iconfont icon-edit"></i></template>
      </a-button>
      <a-button
        :title="t('dialog.propCondition.delCondition')"
        @click="deleteCondition"
      >
        <template #icon><i class="iconfont icon-delete"></i></template>
      </a-button>
    </div>

    <div style="margin-top: 10px;">
      <a-list
        class="condition-list"
        bordered
        :pagination="false"
      >
        <a-list-item
          v-for="(condition, index) in conditions"
          :key="index"
          :class="['list-item', { 'list-item-active': selectedConditionIndex === index }]"
          @click="handleItemClick(index)"
        >
          {{ getConditionText(condition, index) }}
        </a-list-item>
      </a-list>
    </div>

    <ConditionItemDialog
      v-model:visible="dialogVisible"
      :fields="fields"
      :condition="editingCondition"
      :conditions="localConditions"
      @saveAfter="handleSaveAfter"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ConditionItem 条件项列表管理（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 接收父组件传入的 conditions + fields + selectedGroup
 * 2. 用户点击 +/编辑/删除 → 打开 ConditionItemDialog
 * 3. 弹窗 saveAfter(type, left, op, right, join?) → 构造 Condition → emit 回父组件
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - u-button（自定义）→ a-button
 * - 原生 <select> → a-list（可点击选择 + 顶部按钮操作）
 * - 移除 Vuex（getContext 未使用）
 * - 子弹窗使用 v-model:visible 双向绑定
 */
import { ref, watch } from 'vue'
import { showAlert } from '@/utils/comnon'
import { setDirty } from '@/utils/table'
import { v1 as uuid } from 'uuid'
import ConditionItemDialog, { type Condition } from '../condition-item-dialog/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ConditionItem' })


const { t } = useI18n()
interface Field {
  name: string
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
const editingCondition = ref<Condition | null>(null)
const localConditions = ref<Condition[]>([])

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

const handleItemClick = (index: number): void => {
  if (selectedConditionIndex.value !== index) {
    selectedConditionIndex.value = index
  }
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
  editingCondition.value = condition
  dialogVisible.value = true
}

/**
 * 弹窗 saveAfter 事件：与原版 luck-report-ui 一致
 * @param type 类型（current 已被归一为 property）
 * @param left 左值（属性名 / 表达式 / null）
 * @param op 操作符
 * @param right 值表达式
 * @param join 与上一条件的关系（'and' | 'or' | undefined）
 */
const handleSaveAfter = (
  type: string,
  left: string | null,
  op: string,
  right: string,
  join?: string | null
): void => {
  if (!props.selectedGroup) {
    return
  }

  if (isAddingCondition.value) {
    const newCondition: Condition = {
      type,
      left,
      operation: op,
      right,
      join,
      id: uuid()
    }
    emit('condition-added', newCondition)
    isAddingCondition.value = false
  } else {
    if (selectedConditionIndex.value >= 0 && selectedConditionIndex.value < props.conditions.length) {
      const condition = props.conditions[selectedConditionIndex.value]
      const updatedCondition: Condition = {
        ...condition,
        type,
        left,
        operation: op,
        right,
        join,
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

.condition-list {
  height: 400px;
  overflow-y: auto;
  border-radius: 4px;
}

.condition-list :deep(.list-item) {
  cursor: pointer;
  padding: 8px 12px;
  transition: background-color 0.2s;
}

.condition-list :deep(.list-item:hover) {
  background-color: #f5f5f5;
}

.condition-list :deep(.list-item-active) {
  background-color: #f5f5f5;
  color: var(--color-primary);
}
</style>
