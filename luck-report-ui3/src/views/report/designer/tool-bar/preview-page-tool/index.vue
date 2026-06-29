<template>
  <a-button
    type="text"
    :title="t('tools.preview.pagingPreview')"
    class="tool-button"
    @click="handleClick"
  >
    <template #icon>
      <i class="iconfont icon-view-page"></i>
    </template>
  </a-button>
</template>

<script setup lang="ts">
/**
 * PreviewPageTool 分页预览工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. handleClick → tableToXml 把当前 context 序列化为 XML
 * 2. savePreviewFile 上传到后端
 * 3. 通过 router 打开 Preview 页面（mode=preview, _i=1, _r=1）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UButton（自定义）→ a-button + 模板内 icon 槽
 * - mapGetters / Vuex → useReportStore
 * - 跳转路由直接使用 vue-router 的 useRouter() + resolve + window.open
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { tableToXml } from '@/utils/table'
import { showAlert } from '@/utils/comnon'
import { savePreviewFile } from '@/api/designer'
import { useReportStore } from '@/store/modules/report'
import type { ReportContext } from '@/types/report-def'
import { useI18n } from 'vue-i18n'
import { getRequestToken } from '@/utils/token'

defineOptions({ name: 'PreviewPageTool' })


const { t } = useI18n()
const router = useRouter()
const report = useReportStore()

/** 当前报表上下文（可能为 null） */
const context = computed<ReportContext | null>(() => report.getContext)

/**
 * 通过 router 打开目标路由，并携带 token 参数
 * @param target 目标路由 name
 * @param params 附加到 url query 的参数
 * @param openInNewTab 是否新标签页打开
 */
function openRoute(target: string, params: Record<string, any> = {}, openInNewTab: boolean = true): void {
  // 从 sessionStorage 读取 token（iframe 嵌入场景下已由 captureTokenFromUrl 写入）
  const token = getRequestToken()
  if (token) {
    params.token = token
  }
  const routeData = router.resolve({ name: target, query: params })
  window.open(routeData.href, openInNewTab ? '_blank' : '_self')
}

/**
 * 点击处理：序列化 → 保存预览文件 → 打开分页预览路由
 */
function handleClick(): void {
  const content = tableToXml(context.value)
  const filePath = report.getFilePath
  savePreviewFile(filePath, content)
    .then(() => {
      openRoute('Preview', {
        filePath: filePath,
        _m: 'preview',
        _i: '1',
        _r: '1'
      }, true)
    })
    .catch((error: { msg?: string }) => {
      console.error('预览失败:', error)
      if (error.msg) {
        showAlert(t('dialog.save.serverError') + t('colon') + error.msg, { useHTMLString: true })
      } else {
        showAlert(t('tools.preview.pagingPreviewFail'))
      }
    })
}
</script>
