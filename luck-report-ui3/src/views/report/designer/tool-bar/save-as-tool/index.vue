<template>
  <a-button
    type="text"
    :title="t('tools.save.saveAs')"
    class="tool-button"
    @click="visible = true"
  >
    <template #icon>
      <i class="iconfont icon-save-as"></i>
    </template>
    <SaveDialog
      v-model:visible="visible"
      @save-after="handleSaveAfter"
    />
  </a-button>
</template>

<script setup lang="ts">
/**
 * SaveAsTool 另存为工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 点击按钮 → visible = true 打开另存为弹窗
 * 2. SaveDialog 内部完成保存，emit('save-after', fullFile)
 * 3. 本组件 window.location.replace 跳转 ?reportPath=
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UButton（自定义）→ a-button + 模板内 icon 槽
 * - mapGetters / Vuex → useReportStore（context 仅保存为 computed，未直接使用，但保留以匹配原签名）
 */
import { ref, computed } from 'vue'
import SaveDialog from '@/views/report/designer/tool-bar/save-as-tool/save-dialog/index.vue'
import { useReportStore } from '@/store/modules/report'
import type { ReportContext } from '@/types/report-def'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'SaveAsTool' })


const { t } = useI18n()
/** 弹窗显示状态 */
const visible = ref<boolean>(false)

const report = useReportStore()
/** 当前报表上下文（与原组件保留同样字段） */
const context = computed<ReportContext | null>(() => report.getContext)

/** 监听 SaveDialog 内部的 saveAfter 事件：跳转到新报表 */
function handleSaveAfter(fullFile: string): void {
  window.location.replace('?reportPath=' + fullFile)
}
</script>

<style scoped>
</style>
