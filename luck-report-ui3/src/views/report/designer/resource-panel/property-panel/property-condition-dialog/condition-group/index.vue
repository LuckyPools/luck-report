<template>
  <div>
    <div class="top-button">
      <a-button
          :title="t('dialog.propCondition.addGroup')"
          @click="addGroup"
      >
        <template #icon><i class="iconfont icon-plus-circle"></i></template>
      </a-button>
      <a-button
          :title="t('dialog.propCondition.editGroup')"
          @click="editGroup"
      >
        <template #icon><i class="iconfont icon-edit"></i></template>
      </a-button>
      <a-button
          :title="t('dialog.propCondition.delGroup')"
          @click="deleteGroup"
      >
        <template #icon><i class="iconfont icon-delete"></i></template>
      </a-button>
    </div>

    <div style="margin-top: 10px;">
      <a-list
        class="group-list"
        bordered
        :pagination="false"
      >
        <a-list-item
          v-for="(group, index) in conditionGroups"
          :key="group.id || index"
          :class="['list-item', { 'list-item-active': localSelectedGroupIndex === index }]"
          @click="handleItemClick(index)"
        >
          {{ group.name || `Group ${index + 1}` }}
        </a-list-item>
      </a-list>
    </div>

    <ConditionGroupDialog
      v-model:visible="dialogVisible"
      :condition-group="currentConditionGroup"
      :operation="currentOperation"
      :condition-groups="conditionGroups"
      @saveAfter="handleSaveAfter"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ConditionGroup 条件组列表管理（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - u-button（自定义）→ a-button
 * - 原生 <select> → a-list（可点击选择 + 顶部按钮操作）
 * - 子弹窗使用 v-model:visible 双向绑定
 * - 移除 Vuex（getContext 未使用）
 */
import { ref, watch, nextTick } from 'vue'
import { showAlert, showConfirm } from '@/utils/comnon'
import { setDirty } from '@/utils/table'
import ConditionGroupDialog from '../condition-group-dialog/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ConditionGroup' })


const { t } = useI18n()
interface ConditionGroup {
  id?: string
  name?: string
  conditions?: Array<{ name?: string }>
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    conditionGroups?: ConditionGroup[]
    selectedGroupIndex?: number
  }>(),
  {
    conditionGroups: () => [],
    selectedGroupIndex: -1
  }
)

const emit = defineEmits<{
  (e: 'group-added', group: ConditionGroup): void
  (e: 'group-updated', index: number, group: ConditionGroup): void
  (e: 'group-deleted', index: number): void
  (e: 'group-selected', group: ConditionGroup | null): void
  (e: 'group-index-changed', index: number): void
}>()

const localSelectedGroupIndex = ref<number>(-1)
const dialogVisible = ref<boolean>(false)
const currentConditionGroup = ref<ConditionGroup | null>(null)
const currentOperation = ref<'add' | 'edit'>('add')

watch(
  () => props.selectedGroupIndex,
  (newVal) => {
    localSelectedGroupIndex.value = newVal
    if (newVal < 0 || newVal >= props.conditionGroups.length) {
      currentConditionGroup.value = null
      emit('group-selected', null)
    } else {
      currentConditionGroup.value = props.conditionGroups[newVal]
      emit('group-selected', currentConditionGroup.value)
    }
  },
  { immediate: true }
)

const handleItemClick = (index: number): void => {
  emit('group-index-changed', index)
}

const addGroup = (): void => {
  currentConditionGroup.value = { name: '', conditions: [] }
  currentOperation.value = 'add'
  dialogVisible.value = true
}

const editGroup = (): void => {
  if (localSelectedGroupIndex.value < 0 || localSelectedGroupIndex.value >= props.conditionGroups.length) {
    showAlert(t('dialog.propCondition.editTip'))
    return
  }

  currentConditionGroup.value = { ...props.conditionGroups[localSelectedGroupIndex.value] }
  currentOperation.value = 'edit'
  dialogVisible.value = true
}

const deleteGroup = (): void => {
  if (localSelectedGroupIndex.value < 0 || localSelectedGroupIndex.value >= props.conditionGroups.length) {
    showAlert(t('dialog.propCondition.delTip'))
    return
  }

  const group = props.conditionGroups[localSelectedGroupIndex.value]
  const groupName = group.name || ''

  showConfirm(`${t('dialog.propCondition.delConfirm')}[${groupName}]?`).then(() => {
    emit('group-deleted', localSelectedGroupIndex.value)
    setDirty()
  })
}

const handleSaveAfter = (payload: { group: ConditionGroup; operation: 'add' | 'edit' }): void => {
  if (payload.operation === 'add') {
    emit('group-added', payload.group)
    // 新增的项会被父组件追加到末尾，nextTick 后再选中
    nextTick(() => {
      const newIndex = props.conditionGroups.length - 1
      emit('group-index-changed', newIndex)
    })
  } else if (payload.operation === 'edit') {
    emit('group-updated', localSelectedGroupIndex.value, payload.group)
  }
  setDirty()
}
</script>

<style scoped>
.top-button {
  display: flex;
  justify-content: end;
}

.top-button :deep(.ant-btn + .ant-btn) {
  margin-left: 5px;
}

.group-list {
  height: 400px;
  overflow-y: auto;
  border-radius: 4px;
}

.group-list :deep(.list-item) {
  cursor: pointer;
  padding: 8px 12px;
  transition: background-color 0.2s;
}

.group-list :deep(.list-item:hover) {
  background-color: #f5f5f5;
}

.group-list :deep(.list-item-active) {
  background-color: #f5f5f5;
  color: var(--color-primary);
}
</style>
