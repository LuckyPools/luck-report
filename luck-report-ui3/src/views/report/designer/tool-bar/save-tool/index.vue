<template>
  <a-button
    type="text"
    :title="t('tools.save.save')"
    class="tool-button"
    @click="handleClick"
  >
    <template #icon>
      <i class="iconfont icon-save2"></i>
    </template>
    <SaveDialog
      v-model:visible="visible"
      @save-after="handleSaveAfter"
    />
  </a-button>
</template>

<script setup lang="ts">
/**
 * SaveTool 保存工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 已保存状态（getSaveStatus=true）→ 直接 saveReportFile
 * 2. 未保存状态 → visible = true 打开 SaveDialog 让用户选保存位置
 * 3. SaveDialog 内部保存完成后 emit('save-after', fullFile)
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UButton（自定义）→ a-button + 模板内 icon 槽
 * - mapGetters / Vuex → useReportStore
 */
import { ref, computed } from 'vue'
import { showAlert } from '@/utils/comnon'
import { resetDirty, tableToXml } from '@/utils/table'
import { saveReportFile } from '@/api/designer'
import SaveDialog from '@/views/report/designer/tool-bar/save-as-tool/save-dialog/index.vue'
import { useReportStore } from '@/store/modules/report'
import type { ReportContext } from '@/types/report-def'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'SaveTool' })


const { t } = useI18n()
/** 弹窗显示状态 */
const visible = ref<boolean>(false)

const report = useReportStore()
/** 当前报表上下文 */
const context = computed<ReportContext | null>(() => report.getContext)

/**
 * 点击处理：
 * - 已存在文件（getSaveStatus=true）直接保存
 * - 否则打开另存为弹窗
 */
function handleClick(): void {
  if (!report.getSaveStatus) {
    visible.value = true
    return
  }

  const content = tableToXml(context.value)
  const fullFileName = report.getFileName + '.ureport.xml'

  saveReportFile(fullFileName, content)
    .then(() => {
      showAlert(t('tools.save.successSave'))
      resetDirty()
    })
    .catch((error: { msg?: string }) => {
      console.error('保存失败:', error)
      if (error.msg) {
        showAlert(t('dialog.save.serverError') + t('colon') + error.msg, { useHTMLString: true })
      } else {
        showAlert(t('tools.save.failSave'))
      }
    })
}

/** 监听 SaveDialog 内部的 saveAfter 事件 */
function handleSaveAfter(fullFile: string): void {
  window.location.replace('?reportPath=' + fullFile)
}
</script>

<style scoped>
</style>
