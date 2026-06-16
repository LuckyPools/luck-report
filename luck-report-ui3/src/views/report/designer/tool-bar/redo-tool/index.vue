<template>
  <a-button
    type="text"
    :title="t('tools.redo.redo')"
    class="tool-button"
    @click="handleClick"
  >
    <template #icon>
      <i class="iconfont icon-redo"></i>
    </template>
  </a-button>
</template>

<script setup lang="ts">
/**
 * RedoTool 重做工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. handleClick → undoManager.redo()
 * 2. 若无可重做 → 弹提示
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UButton（自定义）→ a-button + 模板内 icon 槽
 */
import { undoManager } from '@/utils/table'
import { showAlert } from '@/utils/comnon'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'RedoTool' })


const { t } = useI18n()
/** 重做或提示无内容可重做 */
function handleClick(): void {
  if (undoManager.hasRedo()) {
    undoManager.redo()
  } else {
    showAlert(t('tools.redo.noRedo'))
  }
}
</script>
