<template>
  <a-modal
    :title="t('dialog.urlParam.title')"
    :width="660"
    :open="visible"
    :mask-closable="false"
    :okText="t('common.confirm')"
    :cancelText="t('common.cancel')"
    @ok="handleClose"
    @cancel="handleClose"
  >
    <div class="dialog-content">
      <div class="top-button">
        <a-button
          type="primary"
          :title="t('dialog.urlParam.add')"
          @click="handleAdd"
        >
          <template #icon><i class="iconfont icon-plus-circle"></i></template>
        </a-button>
      </div>

      <table class="table-container" style="margin-top: 5px; width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="width: 150px; text-align: left; padding: 8px;">{{ t('dialog.urlParam.name') }}</th>
            <th style="width: 350px; text-align: left; padding: 8px;">{{ t('dialog.urlParam.expr') }}</th>
            <th style="width: 100px; text-align: left; padding: 8px;">{{ t('dialog.urlParam.op') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(param, index) in displayParameters"
            :key="index"
            style="height: 30px;"
          >
            <td style="padding: 8px;">{{ param.name }}</td>
            <td style="padding: 8px;">{{ param.value }}</td>
            <td style="padding: 8px;">
              <a-button
                type="text"
                :title="t('dialog.urlParam.edit')"
                @click="handleEdit(param)"
              >
                <template #icon><i class="iconfont icon-edit"></i></template>
              </a-button>
              <a-button
                type="text"
                :title="t('dialog.urlParam.delete')"
                @click="handleDelete(param, index)"
                style="color: red;"
              >
                <template #icon><i class="iconfont icon-delete"></i></template>
              </a-button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- URL 参数项对话框 -->
    <URLParameterItemDialog
      v-model:visible="itemDialogVisible"
      :param-item="currentParamItem"
      :operation="currentOperation"
      @saveAfter="handleSaveAfter"
    />
  </a-modal>
</template>

<script setup lang="ts">
/**
 * URLParameterDialog URL 参数弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 父组件传入 visible + parameters
 * 2. 增删改 url 参数项 → 通过子弹窗（URLParameterItemDialog）回写
 * 3. 删除/新增/编辑后通过 emit('parameters-change', newParameters) 把最新数组上抛
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UButton（自定义）→ a-modal/a-button
 * - keydown 监听从 mounted/beforeDestroy 迁移到 onMounted/onBeforeUnmount
 * - showConfirm 工具函数沿用，promise.then() 写法不变
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { showConfirm } from '@/utils/comnon'
import URLParameterItemDialog, { type UrlParameterItem } from './url-parameter-item-dialog/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'URLParameterDialog' })


const { t } = useI18n()
type OperationType = 'add' | 'edit'

interface SaveAfterPayload {
  paramItem: UrlParameterItem
  operation: OperationType
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    parameters?: UrlParameterItem[]
  }>(),
  {
    visible: false,
    parameters: () => []
  }
)

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'saveAfter', payload: SaveAfterPayload): void
  (e: 'parameters-change', val: UrlParameterItem[]): void
}>()

/** 子弹窗状态 */
const itemDialogVisible = ref<boolean>(false)
const currentParamItem = ref<UrlParameterItem | null>(null)
const currentOperation = ref<OperationType>('add')

/** 兼容入参为空的情况 */
const displayParameters = computed<UrlParameterItem[]>(() => {
  return props.parameters ?? []
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})

const handleAdd = (): void => {
  currentParamItem.value = { name: '', value: '' }
  currentOperation.value = 'add'
  itemDialogVisible.value = true
}

const handleEdit = (param: UrlParameterItem): void => {
  currentParamItem.value = param
  currentOperation.value = 'edit'
  itemDialogVisible.value = true
}

/** 子弹窗保存回写：维护一份新数组 → emit('parameters-change') */
const handleSaveAfter = (payload: SaveAfterPayload): void => {
  const { paramItem, operation } = payload
  const source = props.parameters ?? []

  if (operation === 'add') {
    emit('parameters-change', [...source, paramItem])
  } else if (operation === 'edit' && currentParamItem.value) {
    // 直接修改引用对象的字段（保持原对象引用），再 emit 一个新数组触发响应
    currentParamItem.value.name = paramItem.name
    currentParamItem.value.value = paramItem.value
    emit('parameters-change', [...source])
  }

  emit('saveAfter', payload)
}

const handleDelete = (param: UrlParameterItem, index: number): void => {
  showConfirm(t('dialog.urlParam.delTip')).then(() => {
    const newParameters = [...(props.parameters ?? [])]
    newParameters.splice(index, 1)
    emit('parameters-change', newParameters)
  })
}

const handleClose = (): void => {
  emit('update:visible', false)
}

/** 键盘事件：ESC 关闭弹窗 */
const handleKeydown = (e: KeyboardEvent): void => {
  if (props.visible && e.key === 'Escape') {
    handleClose()
  }
}
</script>

<style scoped>
.top-button {
  display: flex;
  justify-content: flex-end;
}

.table-container th,
.table-container td {
  border-bottom: 1px solid #f0f0f0;
}
</style>
