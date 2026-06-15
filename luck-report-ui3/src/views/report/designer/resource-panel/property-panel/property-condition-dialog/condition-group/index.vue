<template>
  <div>
    <div>
      <a-button
          type="primary"
          :title="t('dialog.propCondition.addGroup')"
          @click="addGroup"
      >
        <template #icon><i class="iconfont icon-plus-circle"></i></template>
      </a-button>
      <a-button
          type="primary"
          :title="t('dialog.propCondition.editGroup')"
          @click="editGroup"
      >
        <template #icon><i class="iconfont icon-edit"></i></template>
      </a-button>
      <a-button
          type="primary"
          :title="t('dialog.propCondition.delGroup')"
          @click="deleteGroup"
      >
        <template #icon><i class="iconfont icon-delete"></i></template>
      </a-button>
    </div>

    <div style="margin-top: 10px;">
      <a-select
        v-model:value="localSelectedGroupIndex"
        class="group-select"
        :options="groupOptions"
        :field-names="{ label: 'name', value: 'value' }"
        style="width: 100%"
      />
    </div>

    <ConditionGroupDialog
      v-model:visible="dialogVisible"
      :condition-items="currentConditionGroup?.conditions || []"
      @save="handleSaveAfter"
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
 * - 原生 <select> → a-select
 * - 子弹窗使用 v-model:visible 双向绑定
 * - 移除 Vuex（getContext 未使用）
 */
import { ref, watch } from 'vue'
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
const currentOperation = ref<string>('add')

const groupOptions = ref<{ value: number; name: string }[]>([])

watch(
  () => props.conditionGroups,
  () => {
    groupOptions.value = props.conditionGroups.map((group, index) => ({
      value: index,
      name: group.name || `Group ${index + 1}`
    }))
  },
  { immediate: true, deep: true }
)

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

watch(localSelectedGroupIndex, (newVal) => {
  emit('group-index-changed', newVal)
})

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

const handleSaveAfter = (conditionItems: Array<{ name?: string }>): void => {
  if (currentOperation.value === 'add') {
    if (!currentConditionGroup.value) {
      currentConditionGroup.value = { name: '' }
    }
    currentConditionGroup.value.conditions = conditionItems
    emit('group-added', currentConditionGroup.value)
    const newIndex = props.conditionGroups.length - 1
    emit('group-index-changed', newIndex)
  } else if (currentOperation.value === 'edit') {
    if (currentConditionGroup.value) {
      currentConditionGroup.value.conditions = conditionItems
    }
    emit('group-updated', localSelectedGroupIndex.value, currentConditionGroup.value!)
  }
  dialogVisible.value = false
  setDirty()
}
</script>

<style scoped>
.button-group :deep(.ant-btn + .ant-btn) {
  margin-left: 5px;
}

.group-select {
  height: 400px;
  outline: none;
}
</style>
