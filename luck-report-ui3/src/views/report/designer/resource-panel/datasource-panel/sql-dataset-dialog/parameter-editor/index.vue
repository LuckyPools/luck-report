<template>
  <div class="parameter-editor">
    <div class="header-row">
      <div class="text-section">
        {{ t('dialog.sql.searchParam') }}
        <span class="text-info">{{ t('dialog.sql.paramDesc') }}</span>
      </div>
      <a-button @click="addParameter">
        <template #icon><i class="iconfont icon-plus-circle"></i></template>
        {{ t('dialog.paramTable.addParam') }}
      </a-button>
    </div>
    <div class="table-wrapper" style="margin-top: 5px">
      <table class="table-container">
        <thead>
        <tr>
          <th><span>{{ t('dialog.paramTable.paramName') }}</span></th>
          <th><span>{{ t('dialog.paramTable.paramDatatype') }}</span></th>
          <th><span>{{ t('dialog.paramTable.defaultValue') }}</span></th>
          <th style="width: 80px;"><span>{{ t('dialog.paramTable.operator') }}</span></th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="(param, index) in parameters"
            :key="index"
            style="height: 35px;"
        >
          <td><span>{{ param.name }}</span></td>
          <td><span>{{ param.type }}</span></td>
          <td><span>{{ param.defaultValue }}</span></td>
          <td>
            <a-button
                type="text"
                :title="t('dialog.paramTable.editParam')"
                @click.prevent="editParameter(param, index)"
            >
              <template #icon><i class="iconfont icon-edit"></i></template>
            </a-button>
            <a-button
                type="text"
                danger
                :title="t('dialog.paramTable.delParam')"
                @click.prevent="removeParameter(param, index)"
            >
              <template #icon><i class="iconfont icon-delete"></i></template>
            </a-button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    <ParameterDialog
      :visible="parameterDialogVisible"
      :edit-data="currentEditData"
      :parameters="parameters"
      :edit-index="currentIndex"
      @update:visible="parameterDialogVisible = $event"
      @save="handleDialogSave"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ParameterEditor SQL 数据集参数编辑器（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UButton（自定义）→ a-button
 * - this.$emit → defineEmits
 * - props.parameters 保留数组类型，由父组件传入
 */
import { ref } from 'vue'
import ParameterDialog from '../parameter-dialog/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ParameterEditor' })


const { t } = useI18n()
interface ParameterItem {
  name: string
  type: string
  defaultValue: string
}

withDefaults(
  defineProps<{
    parameters?: ParameterItem[]
  }>(),
  { parameters: () => [] }
)

const emit = defineEmits<{
  (e: 'add-parameter', payload: ParameterItem): void
  (e: 'edit-parameter', index: number, payload: ParameterItem): void
  (e: 'remove-parameter', index: number): void
  (e: 'update'): void
}>()

const currentEditData = ref<ParameterItem | null>(null)
const currentIndex = ref<number>(-1)
const parameterDialogVisible = ref<boolean>(false)

function handleDialogSave(name: string, type: string, defaultValue: string): void {
  if (currentIndex.value === -1) {
    emit('add-parameter', { name, type, defaultValue })
  } else {
    emit('edit-parameter', currentIndex.value, { name, type, defaultValue })
  }
  emit('update')
}

function addParameter(): void {
  currentIndex.value = -1
  currentEditData.value = null
  parameterDialogVisible.value = true
}

function editParameter(param: ParameterItem, index: number): void {
  currentIndex.value = index
  currentEditData.value = param
  parameterDialogVisible.value = true
}

function removeParameter(_param: ParameterItem, index: number): void {
  emit('remove-parameter', index)
  emit('update')
}
</script>

<style scoped>
.parameter-editor {
  width: 100%;
}

.header-row{
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-section{
  flex: 1;
}

.table-wrapper{
  height: 116px;
}
</style>
