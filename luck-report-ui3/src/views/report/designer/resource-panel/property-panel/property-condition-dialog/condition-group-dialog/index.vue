<template>
  <a-modal
    :title="t('dialog.conditionGroup.title')"
    :width="800"
    :open="visible"
    @cancel="handleClose"
  >
    <div class="condition-group-dialog">
      <!-- 条件项管理 -->
      <div class="condition-items">
        <div class="button-group">
          <a-button
            type="primary"
            :title="t('dialog.conditionGroup.addCondition')"
            @click="addItem"
          >
            <template #icon><i class="iconfont icon-plus-circle"></i></template>
          </a-button>
          <a-button
            type="primary"
            :title="t('dialog.conditionGroup.deleteCondition')"
            @click="deleteItem"
          >
            <template #icon><i class="iconfont icon-delete"></i></template>
          </a-button>
          <a-button
            type="primary"
            :title="t('dialog.conditionGroup.editCondition')"
            @click="editItem"
          >
            <template #icon><i class="iconfont icon-edit"></i></template>
          </a-button>
        </div>

        <div style="margin-top: 5px;">
          <a-select
            v-model:value="selectedItemIndex"
            class="item-select"
            :options="itemOptions"
            :field-names="{ label: 'name', value: 'index' }"
          />
        </div>
      </div>
    </div>

    <!-- 子弹窗：ConditionItemDialog -->
    <ConditionItemDialog
      v-model:visible="conditionItemDialogVisible"
      :condition-item="editingConditionItem"
      :conditions="localConditionItems"
      @saveAfter="handleConditionItemSave"
    />

    <template #footer>
      <a-button @click="handleClose" style="margin-right: 10px;">{{ t('dialog.common.cancel') }}</a-button>
      <a-button type="primary" @click="handleOk">{{ t('dialog.common.ok') }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * ConditionGroupDialog 条件组弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → 深拷贝 conditionItems + 默认选中第 0 项
 * 2. 用户增删改条件项 → 通过子弹窗（ConditionItemDialog）回写
 * 3. 「确定」→ emit('save', localConditionItems) + 关闭
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UButton（自定义）→ a-modal/a-button
 * - 原生 <select> → a-select
 * - 子弹窗使用 v-model:visible 双向绑定
 */
import { ref, computed, watch } from 'vue'
import { showAlert, showConfirm } from '@/utils/comnon'
import { deepCopy } from '@/utils/comnon'
import ConditionItemDialog, { type ConditionItem } from '../condition-item-dialog/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ConditionGroupDialog' })


const { t } = useI18n()
const props = withDefaults(
  defineProps<{
    visible: boolean
    conditionItems?: ConditionItem[]
  }>(),
  {
    visible: false,
    conditionItems: () => []
  }
)

const emit = defineEmits<{
  (e: 'save', conditionItems: ConditionItem[]): void
  (e: 'update:visible', val: boolean): void
}>()

const localConditionItems = ref<ConditionItem[]>([])
const selectedItemIndex = ref<number | null>(null)
const conditionItemDialogVisible = ref<boolean>(false)
const editingConditionItem = ref<ConditionItem | null>(null)

/** a-select options */
const itemOptions = computed(() =>
  localConditionItems.value.map((item, index) => ({
    index,
    name: item.name
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

/** 初始化：深拷贝入参 + 默认选中第 0 项 */
const initData = (): void => {
  const source = Array.isArray(props.conditionItems) ? props.conditionItems : []
  localConditionItems.value = deepCopy(source) as ConditionItem[]
  if (localConditionItems.value.length > 0) {
    selectedItemIndex.value = 0
  } else {
    selectedItemIndex.value = null
  }
}

const handleOk = (): void => {
  if (!Array.isArray(localConditionItems.value)) {
    localConditionItems.value = []
  }
  emit('save', localConditionItems.value)
  handleClose()
}

const handleClose = (): void => {
  emit('update:visible', false)
}

// ============ 条件项管理 ============
const addItem = (): void => {
  editingConditionItem.value = null
  conditionItemDialogVisible.value = true
}

const deleteItem = (): void => {
  if (selectedItemIndex.value === null || selectedItemIndex.value === -1) {
    showAlert(t('dialog.conditionGroup.deleteTip'))
    return
  }

  const item = localConditionItems.value[selectedItemIndex.value]
  showConfirm(`${t('dialog.conditionGroup.deleteConfirm')}[${item.name}]?`).then(() => {
    localConditionItems.value.splice(selectedItemIndex.value!, 1)
    selectedItemIndex.value = null
  })
}

const editItem = (): void => {
  if (selectedItemIndex.value === null || selectedItemIndex.value === -1) {
    showAlert(t('dialog.conditionGroup.editTip'))
    return
  }

  const item = localConditionItems.value[selectedItemIndex.value]
  editingConditionItem.value = { ...item }
  conditionItemDialogVisible.value = true
}

/** 处理子弹窗回写的条件项 */
const handleConditionItemSave = (data: { name: string; join: string | null }): void => {
  if (!Array.isArray(localConditionItems.value)) {
    localConditionItems.value = []
  }

  if (editingConditionItem.value === null) {
    // 新增
    localConditionItems.value.push({
      name: data.name,
      join: data.join
    })
  } else if (selectedItemIndex.value !== null && selectedItemIndex.value >= 0) {
    // 编辑
    localConditionItems.value[selectedItemIndex.value] = {
      name: data.name,
      join: data.join
    }
  }
}
</script>

<style scoped>
.condition-group-dialog {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.condition-items {
  width: 200px;
}

.item-select {
  width: 100%;
}

.button-group :deep(.ant-btn + .ant-btn) {
  margin-left: 5px;
}
</style>
