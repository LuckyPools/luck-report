<template>
  <a-button
    :title="t('importExcel')"
    type="text"
    class="tool-button"
    @click="visible = true"
  >
    <i class="iconfont icon-cloud-upload"></i>
  </a-button>

  <ImportDialog
    :visible="visible"
    @update:visible="visible = $event"
    @import-success="handleImportSuccess"
  />
</template>

<script setup lang="ts">
/**
 * ImportTool 导入 Excel 工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 点击按钮 → 打开 ImportDialog
 * 2. 用户选择 Excel 并确认 → 后端导入完成后回调 handleImportSuccess
 * 3. handleImportSuccess → 通过 router 跳转到 Designer 刷新当前页
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - u-button（自定义按钮）→ a-button[type="text"]
 * - 跳转路由直接使用 vue-router 的 useRouter() / useRoute()
 * - data()/methods/watch → ref + 普通函数
 */
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ImportDialog from '@/views/report/designer/tool-bar/import-tool/import-dialog/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ImportTool' })


const { t } = useI18n()
const visible = ref<boolean>(false)

const router = useRouter()
const route = useRoute()

/**
 * 导入成功 → 重新打开 Designer 加载新报表
 * 与 Vue2 版 navigator.openDesigner({}, false) 等价：替换当前路由 query
 */
function handleImportSuccess(): void {
  const resolved = router.resolve({
    name: 'Designer',
    query: route.query
  })
  window.open(resolved.href, '_self')
}
</script>

<style scoped>
.tool-button {
  font-size: 16px;
  margin: 7px 0;
}
</style>
