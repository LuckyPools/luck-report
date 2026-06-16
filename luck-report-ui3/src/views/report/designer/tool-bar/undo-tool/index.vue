<template>
  <a-button
    :title="t('tools.undo.undo')"
    type="text"
    class="tool-button"
    @click="handleClick"
  >
    <template #icon>
      <i class="iconfont icon-undo"></i>
    </template>
  </a-button>
</template>

<script setup lang="ts">
/**
 * UndoTool 撤销工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. handleClick → undoManager.undo()
 * 2. 若无可撤销 → 弹提示
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UButton（自定义）→ a-button + 模板内 icon 槽
 * - 移除 $emit，本组件无对外事件
 */
import { undoManager } from '@/utils/table'
import { showAlert } from '@/utils/comnon'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'UndoTool' })


const { t } = useI18n()
/** 撤销或提示无内容可撤销 */
function handleClick(): void {
  if (undoManager.hasUndo()) {
    undoManager.undo()
  } else {
    showAlert(t('tools.undo.noUndo'))
  }
}
</script>
