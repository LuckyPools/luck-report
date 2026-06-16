<template>
  <a-button
    type="text"
    :title="t('tools.preview.view')"
    class="tool-button"
    @click="handleClick"
  >
    <template #icon>
      <i class="iconfont icon-preview"></i>
    </template>
  </a-button>
</template>

<script setup lang="ts">
/**
 * PreviewTool 预览工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. handleClick → tableToXml 把当前 context 序列化为 XML
 * 2. savePreviewFile 上传到后端
 * 3. 通过 router 打开 Preview 页面（mode=preview）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UButton（自定义）→ a-button + 模板内 icon 槽
 * - mapGetters / Vuex → useReportStore
 * - 跳转路由直接使用 vue-router 的 useRouter() + resolve + window.open
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { tableToXml } from '@/utils/table'
import { showAlert } from '@/utils/comnon'
import { savePreviewFile } from '@/api/designer'
import { useReportStore } from '@/store/modules/report'
import type { ReportContext } from '@/types/report-def'

defineOptions({ name: 'PreviewTool' })

const router = useRouter()
const report = useReportStore()
const { t } = useI18n()

/** 当前报表上下文（可能为 null） */
const context = computed<ReportContext | null>(() => report.getContext)

/**
 * 通过 router 打开目标路由
 * @param target 目标路由 name
 * @param params 附加到 url query 的参数
 * @param openInNewTab 是否新标签页打开
 */
function openRoute(target: string, params: Record<string, any> = {}, openInNewTab: boolean = true): void {
  const routeData = router.resolve({ name: target, query: params })
  window.open(routeData.href, openInNewTab ? '_blank' : '_self')
}

/**
 * 点击处理：序列化 → 保存预览文件 → 打开 Preview 路由
 */
function handleClick(): void {
  const content = tableToXml(context.value)
  let fileName = report.getFileName
  if (fileName) {
    fileName = fileName + '.ureport.xml'
  } else {
    fileName = 'p'
  }

  savePreviewFile(fileName, content)
    .then(() => {
      openRoute('Preview', {
        reportPath: fileName,
        mode: 'preview'
      }, true)
    })
    .catch((error: { msg?: string }) => {
      console.error('预览失败:', error)
      if (error.msg) {
        showAlert(t('dialog.save.serverError') + t('colon') + error.msg, { useHTMLString: true })
      } else {
        showAlert(t('tools.preview.previewFail'))
      }
    })
}
</script>
