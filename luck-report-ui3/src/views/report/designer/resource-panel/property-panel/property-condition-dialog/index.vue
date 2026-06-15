<template>
  <a-modal
    :title="t('dialog.propCondition.title')"
    :width="1020"
    :style="{ top: '50px' }"
    :open="visible"
    @cancel="handleClose"
  >
    <div class="condition-body-container">
      <fieldset class="fieldset-small">
        <legend class="legend-style">{{ t('dialog.propCondition.config') }}</legend>
        <condition-group
            :condition-groups="localConditionGroups"
            :selected-group-index="selectedGroupIndex"
            @group-added="onGroupAdded"
            @group-updated="onGroupUpdated"
            @group-deleted="onGroupDeleted"
            @group-selected="onGroupSelected"
            @group-index-changed="onGroupIndexChanged"
        />
      </fieldset>

      <fieldset class="fieldset-medium">
        <legend class="legend-style">{{ t('dialog.propCondition.conditionConfig') }}</legend>
        <condition-item
          :selected-group="selectedGroup"
          :fields="fields"
          :conditions="currentConditions"
          :reset-selection="resetConditionSelection"
          @condition-added="onConditionAdded"
          @condition-updated="onConditionUpdated"
          @condition-deleted="onConditionDeleted"
        />
      </fieldset>

      <fieldset class="fieldset-large" v-show="showPropertyGroup">
        <legend class="legend-style">{{ t('dialog.propCondition.propConfig') }}</legend>
        <condition-config
          :selected-group="selectedGroup"
          @property-changed="onPropertyChanged"
        />
      </fieldset>
    </div>
    <template #footer>
      <div style="text-align: right">
        <a-button @click="handleClose" style="margin-right: 10px;">{{ t('dialog.common.cancel') }}</a-button>
        <a-button type="primary" @click="handleOk">{{ t('dialog.common.ok') }}</a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * PropertyConditionDialog 条件属性弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → 深拷贝 conditionGroups + 默认选中第 0 组
 * 2. 用户增删改条件组 / 条件项 / 属性配置
 * 3. 「确定」→ emit('saveAfter', conditionGroups) + 关闭
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UButton（自定义）→ a-modal/a-button
 * - 移除 Vuex，状态全部本地化
 * - 移除 this.$set / this.$nextTick，使用 ref + watch + nextTick
 */
import { ref, watch, nextTick } from 'vue'
import { setDirty } from '@/utils/table'
import { deepCopy } from '@/utils/comnon'
import ConditionGroup from './condition-group/index.vue'
import ConditionItem from './condition-item/index.vue'
import ConditionConfig, { type SelectedGroup } from './condition-config/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'PropertyConditionDialog' })


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
  join?: string | null
  id?: string
  [key: string]: unknown
}

interface ConditionGroup {
  id?: string
  name?: string
  conditions?: Condition[]
  cellStyle?: SelectedGroup['cellStyle']
  rowHeight?: number | null
  colWidth?: number | null
  newValue?: string | null
  linkUrl?: string | null
  linkTargetWindow?: string | null
  linkParameters?: SelectedGroup['linkParameters']
  paging?: SelectedGroup['paging']
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    fields?: Field[]
    conditionGroups?: ConditionGroup[]
  }>(),
  {
    visible: false,
    fields: () => [],
    conditionGroups: () => []
  }
)

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'saveAfter', conditionGroups: ConditionGroup[]): void
}>()

const selectedGroup = ref<SelectedGroup | null>(null)
const selectedGroupIndex = ref<number>(-1)
const showPropertyGroup = ref<boolean>(false)
const localConditionGroups = ref<ConditionGroup[]>([])
const currentConditions = ref<Condition[]>([])
const resetConditionSelection = ref<boolean>(true)

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      const conditionGroups = props.conditionGroups
      localConditionGroups.value = Array.isArray(conditionGroups)
        ? (deepCopy(conditionGroups) as ConditionGroup[])
        : []
      if (localConditionGroups.value.length > 0) {
        selectFirstGroup()
      } else {
        clearSelection()
      }
    }
  }
)

const onGroupAdded = (newGroup: ConditionGroup): void => {
  localConditionGroups.value.push(newGroup)
  setDirty()
}

const onGroupUpdated = (index: number, group: ConditionGroup): void => {
  if (index >= 0 && index < localConditionGroups.value.length) {
    localConditionGroups.value[index] = group
  }
  setDirty()
}

const onGroupDeleted = (index: number): void => {
  if (index >= 0 && index < localConditionGroups.value.length) {
    localConditionGroups.value.splice(index, 1)

    if (selectedGroupIndex.value === index) {
      if (localConditionGroups.value.length > 0) {
        nextTick(() => {
          selectedGroupIndex.value = 0
        })
      } else {
        clearSelection()
      }
    }

    setDirty()
  }
}

const onGroupSelected = (group: SelectedGroup | null): void => {
  selectedGroup.value = group

  if (!group) {
    showPropertyGroup.value = false
    currentConditions.value = []
    resetConditionSelection.value = true
    return
  }
  showPropertyGroup.value = true

  if (!group.conditions) {
    group.conditions = []
  }
  currentConditions.value = [...(group.conditions as Condition[])]
  resetConditionSelection.value = false
  setDirty()
}

const onPropertyChanged = (updatedGroup: SelectedGroup): void => {
  if (updatedGroup && selectedGroup.value) {
    Object.keys(updatedGroup).forEach((key) => {
      if (key !== 'conditions' && key !== 'id') {
        ;(selectedGroup.value as Record<string, unknown>)[key] = (
          updatedGroup as Record<string, unknown>
        )[key]
      }
    })
  }
  setDirty()
}

const onConditionAdded = (newCondition: Condition): void => {
  if (selectedGroup.value) {
    if (!selectedGroup.value.conditions) {
      selectedGroup.value.conditions = []
    }
    ;(selectedGroup.value.conditions as Condition[]).push(newCondition)
    currentConditions.value = [...(selectedGroup.value.conditions as Condition[])]
  }
  setDirty()
}

const onConditionUpdated = (index: number, updatedCondition: Condition): void => {
  if (selectedGroup.value && selectedGroup.value.conditions) {
    const conds = selectedGroup.value.conditions as Condition[]
    if (index >= 0 && index < conds.length) {
      conds.splice(index, 1, updatedCondition)
      currentConditions.value = [...conds]
    }
  }
  setDirty()
}

const onConditionDeleted = (index: number): void => {
  if (selectedGroup.value && selectedGroup.value.conditions) {
    const conds = selectedGroup.value.conditions as Condition[]
    if (index >= 0 && index < conds.length) {
      conds.splice(index, 1)
      currentConditions.value = [...conds]
    }
  }
  setDirty()
}

const onGroupIndexChanged = (index: number): void => {
  selectedGroupIndex.value = index
}

const selectFirstGroup = (): void => {
  if (localConditionGroups.value.length > 0) {
    selectedGroupIndex.value = 0
  }
}

const clearSelection = (): void => {
  selectedGroup.value = null
  selectedGroupIndex.value = -1
  showPropertyGroup.value = false
  currentConditions.value = []
  resetConditionSelection.value = true
}

const handleClose = (): void => {
  emit('update:visible', false)
}

const handleOk = (): void => {
  emit('update:visible', false)
  const conditionGroups = deepCopy(localConditionGroups.value) as ConditionGroup[]
  emit('saveAfter', conditionGroups)
}
</script>

<style scoped>
.condition-body-container {
  padding: 10px;
}

.fieldset-small {
  padding: 10px;
  border: solid 1px #dddddd;
  border-radius: 8px;
  width: 160px;
  display: inline-block;
}

.fieldset-medium {
  padding: 10px;
  border: solid 1px #dddddd;
  border-radius: 8px;
  width: 250px;
  display: inline-block;
  vertical-align: top;
  margin-left: 10px;
}

.fieldset-large {
  padding: 10px;
  border: solid 1px #dddddd;
  border-radius: 8px;
  width: 450px;
  display: inline-block;
  vertical-align: top;
  margin-left: 10px;
}

.legend-style {
  width: auto;
  margin-bottom: 1px;
  border-bottom: none;
  font-size: inherit;
  color: #4b4b4b;
}
</style>
