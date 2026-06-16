<template>
  <div class="form-group" style="padding-top: 10px">
    <!-- 当没有选择数据集时显示提示 -->
    <div v-if="!dataset" class="empty-tip-container">
      <i class="iconfont icon-warning empty-tip-icon"></i>
      <div class="empty-tip-content">
        <div class="empty-tip-title">{{ t('property.dataset.noDatasetSelected') }}</div>
        <div class="empty-tip-desc">{{ t('property.dataset.bindDatasetTip') }}</div>
      </div>
    </div>

    <!-- 条件列表和操作按钮 -->
    <div v-show="dataset" class="form-group" style="margin-bottom: 10px;">
      <div class="top-button">
        <a-button
            :title="t('property.dataset.addFilterCondition')"
            @click="handleAddCondition"
        >
          <template #icon><i class="iconfont icon-plus-circle"></i></template>
        </a-button>
        <a-button
            :title="t('property.dataset.editFilterCondition')"
            @click="handleEditCondition"
        >
          <template #icon><i class="iconfont icon-edit"></i></template>
        </a-button>
        <a-button
            :title="t('property.dataset.delFilterCondition')"
            @click="handleDeleteCondition"
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
            v-for="(cond, index) in conditions"
            :key="index"
            :class="['list-item', { 'list-item-active': selectedConditionIndex === index }]"
            @click="handleItemClick(index)"
          >
            {{ formatConditionText(cond) }}
          </a-list-item>
        </a-list>
      </div>
    </div>

    <!-- 条件对话框组件 -->
    <ConditionDialog
      v-model:visible="conditionDialogVisible"
      :fields="fields"
      :condition="condition"
      :conditions="(conditions as ConditionData[])"
      @saveAfter="handleConditionSave"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * FilterCondition 过滤条件面板（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 用户点击 +/-/edit/delete 按钮 → 触发 conditionDialog 或直接修改
 * 2. 通过 ConditionDialog 弹窗编辑单条条件 → saveAfter → emit('update:conditions') + emit('update-filter-conditions')
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - u-button → a-button（用 #icon 插槽渲染 iconfont）
 * - 原生 <select> → a-list（可点击选择 + 顶部按钮操作）
 * - showConfirm 通过 Promise.then 触发
 */
import { ref } from 'vue'
import { showAlert, showConfirm } from '@/utils/comnon'
import { setDirty } from '@/utils/table'
import ConditionDialog, { type ConditionData } from '@/views/report/designer/resource-panel/property-panel/dataset-value-editor/dataset-config/condition-dialog/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'FilterCondition' })


const { t } = useI18n()
/** 字段元数据 */
interface Field {
  name: string
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    dataset?: string
    conditions?: ConditionData[]
    fields?: Field[]
  }>(),
  {
    dataset: '',
    conditions: () => [],
    fields: () => []
  }
)

const emit = defineEmits<{
  (e: 'update:conditions', value: ConditionData[]): void
  (e: 'update-filter-conditions', value: ConditionData[]): void
}>()

const selectedConditionIndex = ref<number>(-1)
const conditionDialogVisible = ref<boolean>(false)
const condition = ref<ConditionData | null>(null)

/** 点击列表项选中条件 */
const handleItemClick = (index: number): void => {
  selectedConditionIndex.value = index
}

/**
 * 格式化条件文本
 */
const formatConditionText = (cond: ConditionData): string => {
  let text = `${cond.left} ${cond.operation} ${cond.right}`
  if (cond.join) {
    text = `${cond.join} ${text}`
  }
  return text
}

/**
 * 处理添加过滤条件
 */
const handleAddCondition = (): void => {
  if (!props.dataset) {
    showAlert(t('property.dataset.bindDatasetTip'))
    return
  }

  condition.value = null
  conditionDialogVisible.value = true
}

/**
 * 处理编辑过滤条件
 */
const handleEditCondition = (): void => {
  if (selectedConditionIndex.value < 0) {
    showAlert(t('property.dataset.selectFilterConditionTip'))
    return
  }

  condition.value = (props.conditions || [])[selectedConditionIndex.value] || null
  conditionDialogVisible.value = true
}

/**
 * 处理条件保存事件
 */
const handleConditionSave = (conditionData: ConditionData): void => {
  const newConditions = (props.conditions || []).map((item, index) => {
    if (conditionData.isEdit && index === selectedConditionIndex.value) {
      return {
        ...item,
        left: conditionData.left,
        operation: conditionData.operation,
        right: conditionData.right,
        join: conditionData.join
      }
    }
    return item
  })

  if (!conditionData.isEdit) {
    newConditions.push({
      left: conditionData.left,
      operation: conditionData.operation,
      right: conditionData.right,
      join: conditionData.join
    })
  }

  emit('update:conditions', newConditions)
  emit('update-filter-conditions', newConditions)
  setDirty()
}

/**
 * 处理删除过滤条件
 */
const handleDeleteCondition = (): void => {
  if (selectedConditionIndex.value < 0) {
    showAlert(t('property.dataset.delFilterConditionTip'))
    return
  }

  showConfirm(t('property.dataset.delConfirm')).then(() => {
    const newConditions = [...(props.conditions || [])]
    newConditions.splice(selectedConditionIndex.value, 1)
    emit('update:conditions', newConditions)
    emit('update-filter-conditions', newConditions)
    selectedConditionIndex.value = -1
    setDirty()
  })
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

.condition-list {
  min-height: 100px;
  max-height: 400px;
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
  background-color: #e6f7ff;
  color: #1890ff;
}

.empty-tip-container {
  display: flex;
  align-items: flex-start;
  padding: 20px;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.empty-tip-container:hover {
  border-color: #217346;
  box-shadow: 0 2px 12px rgba(33, 115, 70, 0.15);
}

.empty-tip-icon {
  flex-shrink: 0;
  font-size: 32px;
  color: #217346;
  margin-right: 16px;
}

.empty-tip-content {
  flex: 1;
  min-width: 0;
}

.empty-tip-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
  line-height: 1.4;
}

.empty-tip-desc {
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}
</style>
