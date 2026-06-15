<template>
  <a-button
    :title="t('setting')"
    type="text"
    class="tool-button"
    @click="handleClick"
  >
    <i class="iconfont icon-settings"></i>
  </a-button>

  <SettingsDialog
    :visible="dialogVisible"
    @update:visible="dialogVisible = $event"
  />
</template>

<script setup lang="ts">
/**
 * SettingsTool 报表设置工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 点击按钮 → 打开 SettingsDialog（页面/页眉页脚/分页/列设置）
 * 2. 子弹窗关闭时通过 update:visible 通知父级同步状态
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - u-button（自定义按钮）→ a-button[type="text"]
 * - data()/methods → ref + 普通函数
 * - $emit('close') / $emit('ok') → v-model:visible 双向
 * - SettingsDialog 子组件仍保留旧实现，父级只做状态中转
 */
import { ref } from 'vue'
import SettingsDialog from '@/views/report/designer/tool-bar/settings-tool/settings-dialog/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'SettingsTool' })


const { t } = useI18n()
/** 设置弹窗显隐状态 */
const dialogVisible = ref<boolean>(false)

/** 打开弹窗 */
function handleClick(): void {
  dialogVisible.value = true
}
</script>

<style scoped>
.tool-button {
  font-size: 16px;
  margin: 7px 0;
}
</style>
