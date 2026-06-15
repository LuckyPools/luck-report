<template>
  <a-button
    type="text"
    :title="buttonTitle"
    class="tool-button"
    @click="handleClick"
  >
    <template #icon>
      <i :class="['iconfont', buttonIcon]"></i>
    </template>
  </a-button>
</template>

<script setup lang="ts">
/**
 * PrintLineTool 打印线显示切换工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 读取 store.getShowPrintLine 决定按钮 title / icon
 * 2. 点击 → store.setShowPrintLine 翻转
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UButton（自定义）→ a-button + 模板内 icon 槽
 * - $store.getters / $store.dispatch → useReportStore
 * - computed 改用 computed
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReportStore } from '@/store/modules/report'

defineOptions({ name: 'PrintLineTool' })

const report = useReportStore()
const { t } = useI18n()

/** 打印线是否显示 */
const showPrintLine = computed<boolean>(() => report.getShowPrintLine)

/** 按钮标题（hover 提示） */
const buttonTitle = computed<string>(() =>
  showPrintLine.value ? t('tools.printLine.hidePrintLine') : t('tools.printLine.showPrintLine')
)

/** 按钮图标 */
const buttonIcon = computed<string>(() =>
  showPrintLine.value ? 'icon-browse' : 'icon-hide'
)

/** 切换打印线显示 */
function handleClick(): void {
  report.setShowPrintLine(!showPrintLine.value)
}
</script>

<style scoped>
</style>
