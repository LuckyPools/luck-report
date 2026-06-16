<template>
  <a-modal
    :title="t('dialog.customGroup.title')"
    :width="800"
    :open="visible"
    @cancel="handleClose"
  >
    <div class="custom-group-dialog">
      <div class="form-group">
        <!-- 分组项管理 -->
        <div class="group-items-section">
          <div class="button-group">
            <a-button
              type="primary"
              :title="t('dialog.customGroup.addGroup')"
              @click="addItem"
            >
              <template #icon><i class="iconfont icon-plus-circle"></i></template>
            </a-button>
            <a-button
              type="primary"
              :title="t('dialog.customGroup.deleteGroup')"
              @click="deleteItem"
            >
              <template #icon><i class="iconfont icon-delete"></i></template>
            </a-button>
            <a-button
              type="primary"
              :title="t('dialog.customGroup.editGroup')"
              @click="editItem"
            >
              <template #icon><i class="iconfont icon-edit"></i></template>
            </a-button>
          </div>

          <div style="margin-top: 5px;">
            <a-select
              v-model:value="selectedItemIndex"
              class="group-select"
              :options="groupItemOptions"
              :field-names="{ label: 'name', value: 'index' }"
              @change="onSelectedItemChange"
            />
          </div>
        </div>

        <!-- 条件管理 -->
        <div
          class="conditions-section"
          v-show="selectedItemIndex !== null && selectedItemIndex !== -1"
        >
          <div class="condition-header">
            <label>{{ t('dialog.customGroup.groupCondition') }}：</label>
            <div class="button-group">
              <a-button
                type="primary"
                :title="t('dialog.customGroup.addCondition')"
                @click="addCondition"
              >
                <template #icon><i class="iconfont icon-plus-circle"></i></template>
              </a-button>
              <a-button
                type="primary"
                :title="t('dialog.customGroup.delTitle')"
                @click="deleteCondition"
              >
                <template #icon><i class="iconfont icon-delete"></i></template>
              </a-button>
              <a-button
                type="primary"
                :title="t('dialog.customGroup.editTip')"
                @click="editCondition"
              >
                <template #icon><i class="iconfont icon-edit"></i></template>
              </a-button>
            </div>
          </div>
          <a-select
            v-model:value="selectedConditionIndex"
            class="condition-select"
            :options="conditionOptions"
            :field-names="{ label: 'label', value: 'index' }"
          />
        </div>
      </div>
    </div>

    <!-- GroupItemDialog 组件 -->
    <GroupItemDialog
      v-model:visible="groupItemDialogVisible"
      :group-item="groupItem"
      :operation="operation"
      @saveAfter="handleGroupItemSave"
    />

    <!-- ConditionDialog 组件 -->
    <ConditionDialog
      v-model:visible="conditionDialogVisible"
      :fields="fields"
      :condition="editingCondition"
      :conditions="currentConditions"
      @saveAfter="handleConditionSave"
    />

    <template #footer>
      <a-button @click="handleClose" style="margin-right: 10px;">{{ t('dialog.common.cancel') }}</a-button>
      <a-button type="primary" @click="handleOk">{{ t('dialog.common.ok') }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * CustomGroupDialog 自定义分组配置弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → 深拷贝 groupItems → localGroupItems + 默认选中第 0 项
 * 2. 用户在分组项 / 条件中增删改 → 通过嵌套子弹窗（GroupItemDialog / ConditionDialog）回写
 * 3. 「确定」→ emit('save', localGroupItems) + 关闭
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UButton（自定义）→ a-modal/a-button
 * - 原生 <select> → a-select
 * - 子弹窗使用 v-model:visible 双向绑定
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { showAlert, showConfirm, deepCopy } from '@/utils/comnon'
import GroupItemDialog, { type GroupItem, type GroupItemSavePayload } from '../custom-group-item-dialog/index.vue'
import ConditionDialog, { type ConditionData } from '../condition-dialog/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'CustomGroupDialog' })


const { t } = useI18n()
/** 字段元数据 */
interface Field {
  name: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    groupItems?: GroupItem[]
    fields?: Field[] | null
  }>(),
  {
    visible: false,
    groupItems: () => [],
    fields: null
  }
)

const emit = defineEmits<{
  (e: 'save', groupItems: GroupItem[]): void
  (e: 'close'): void
  (e: 'update:visible', val: boolean): void
}>()

const localGroupItems = ref<GroupItem[]>([])
const selectedItemIndex = ref<number | null>(null)
const selectedConditionIndex = ref<number | null>(null)
const conditionDialogVisible = ref<boolean>(false)
const editingCondition = ref<ConditionData | null>(null)
const groupItemDialogVisible = ref<boolean>(false)
const groupItem = ref<GroupItem | null>(null)
const operation = ref<string>('add')

/** 当前选中分组项的条件集合 */
const currentConditions = computed<ConditionData[]>(() => {
  if (
    selectedItemIndex.value === null ||
    selectedItemIndex.value === -1 ||
    !localGroupItems.value[selectedItemIndex.value]
  ) {
    return []
  }
  return (localGroupItems.value[selectedItemIndex.value].conditions as ConditionData[]) || []
})

/** a-select options：分组项 */
const groupItemOptions = computed(() =>
  localGroupItems.value.map((item, index) => ({
    index,
    name: item.name
  }))
)

/** a-select options：条件 */
const conditionOptions = computed(() =>
  currentConditions.value.map((condition, index) => ({
    index,
    label: formatConditionText(condition, index)
  }))
)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      initData()
    }
  }
)

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})

/** 初始化：深拷贝入参 + 默认选中第 0 项 */
const initData = (): void => {
  const source = Array.isArray(props.groupItems) ? props.groupItems : []
  localGroupItems.value = deepCopy(source) as GroupItem[]
  if (localGroupItems.value.length > 0) {
    selectedItemIndex.value = 0
  }
  selectedConditionIndex.value = null
}

const handleOk = (): void => {
  if (!Array.isArray(localGroupItems.value)) {
    localGroupItems.value = []
  }
  emit('save', localGroupItems.value)
  handleClose()
}

const handleClose = (): void => {
  emit('update:visible', false)
  emit('close')
}

// ============ 分组项管理 ============
const addItem = (): void => {
  groupItem.value = { name: '', conditions: [] }
  operation.value = 'add'
  groupItemDialogVisible.value = true
}

const deleteItem = (): void => {
  if (selectedItemIndex.value === null || selectedItemIndex.value === -1) {
    showAlert(t('dialog.customGroup.deleteTip'))
    return
  }

  const item = localGroupItems.value[selectedItemIndex.value]
  showConfirm(`${t('dialog.customGroup.deleteConfirm')}[${item.name}]?`).then(() => {
    localGroupItems.value.splice(selectedItemIndex.value!, 1)
    selectedItemIndex.value = null
    selectedConditionIndex.value = null
  })
}

const editItem = (): void => {
  if (selectedItemIndex.value === null || selectedItemIndex.value === -1) {
    showAlert(t('dialog.customGroup.modTip'))
    return
  }

  const item = localGroupItems.value[selectedItemIndex.value]
  groupItem.value = { ...item }
  operation.value = 'edit'
  groupItemDialogVisible.value = true
}

const onSelectedItemChange = (): void => {
  selectedConditionIndex.value = null
}

// ============ 条件管理 ============
const addCondition = (): void => {
  if (selectedItemIndex.value === null || selectedItemIndex.value === -1) {
    showAlert(t('dialog.customGroup.selectTip'))
    return
  }

  editingCondition.value = null
  conditionDialogVisible.value = true
}

const editCondition = (): void => {
  if (selectedConditionIndex.value === null || selectedConditionIndex.value === -1) {
    showAlert(t('dialog.customGroup.editConditionTip'))
    return
  }
  if (selectedItemIndex.value === null || selectedItemIndex.value === -1) {
    showAlert(t('dialog.customGroup.selectTip'))
    return
  }

  const currentItem = localGroupItems.value[selectedItemIndex.value]
  const conditions = (currentItem.conditions as ConditionData[]) || []
  editingCondition.value = conditions[selectedConditionIndex.value]
  conditionDialogVisible.value = true
}

/** 处理子弹窗回写的分组项 */
const handleGroupItemSave = (data: GroupItemSavePayload): void => {
  if (!Array.isArray(localGroupItems.value)) {
    localGroupItems.value = []
  }

  if (data.operation === 'add') {
    localGroupItems.value.push(data.groupItem!)
  } else if (data.operation === 'edit' && selectedItemIndex.value !== null && selectedItemIndex.value >= 0) {
    localGroupItems.value[selectedItemIndex.value] = data.groupItem!
  }
}

/** 处理子弹窗回写的条件 */
const handleConditionSave = (conditionData: ConditionData): void => {
  if (selectedItemIndex.value === null || selectedItemIndex.value === -1) {
    return
  }

  const currentItem = localGroupItems.value[selectedItemIndex.value]
  if (!currentItem.conditions) {
    currentItem.conditions = []
  }
  const conditions = currentItem.conditions as ConditionData[]
  const newCondition = buildCondition(conditionData)

  if (conditionData.isEdit && selectedConditionIndex.value !== null && selectedConditionIndex.value >= 0) {
    conditions[selectedConditionIndex.value] = newCondition
  } else {
    conditions.push(newCondition)
  }
}

/** 构造条件对象：operation / op 同步保留，向后兼容老消费者 */
const buildCondition = (data: ConditionData): ConditionData => ({
  left: data.left,
  operation: data.operation,
  op: data.operation,
  right: data.right,
  join: data.join
})

const deleteCondition = (): void => {
  if (selectedConditionIndex.value === null || selectedConditionIndex.value === -1) {
    showAlert(t('dialog.customGroup.delConditionTip'))
    return
  }
  if (selectedItemIndex.value === null || selectedItemIndex.value === -1) {
    showAlert(t('dialog.customGroup.selectTip'))
    return
  }

  const currentItem = localGroupItems.value[selectedItemIndex.value]
  const conditions = (currentItem.conditions as ConditionData[]) || []
  conditions.splice(selectedConditionIndex.value, 1)
  selectedConditionIndex.value = null
}

const formatConditionText = (condition: ConditionData, index: number): string => {
  const op = condition.operation || (condition as any).op
  let text = `${condition.left} ${op} ${condition.right}`

  if (index > 0 && condition.join) {
    text = `${condition.join} ${text}`
  }
  return text
}

const handleKeydown = (e: KeyboardEvent): void => {
  if (props.visible && e.key === 'Escape') {
    handleClose()
  }
}
</script>

<style scoped>
.custom-group-dialog {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.form-group {
  display: flex;
  height: 100%;
}

.group-items-section {
  width: 200px;
  margin-right: 20px;
}

.conditions-section {
  flex: 1;
}

.group-select,
.condition-select {
  width: 100%;
}

.condition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.condition-header label {
  margin-right: 10px;
}

.button-group :deep(.ant-btn + .ant-btn) {
  margin-left: 5px;
}
</style>
