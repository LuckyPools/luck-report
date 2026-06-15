<template>
  <a-button
    :title="t('tools.searchFormSwitch')"
    type="text"
    class="tool-button"
    @click="visible = true"
  >
    <i class="iconfont icon-form-design"></i>
  </a-button>

  <SearchFormDialog
    :visible="visible"
    @update:visible="visible = $event"
  />
</template>

<script setup lang="ts">
/**
 * SearchFormSwitchTool 查询表单开关工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 点击按钮 → 打开 SearchFormDialog 进行查询表单编辑
 * 2. SearchFormDialog 内部维护表单配置，关闭时通过 update:visible 通知父级
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - u-button（自定义按钮）→ a-button[type="text"]
 * - data()/methods → ref + 普通函数
 * - 移除 $emit，本组件无对外事件
 */
import { ref } from 'vue'
import SearchFormDialog from '@/views/report/designer/tool-bar/search-form-switch-tool/search-form-dialog/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'SearchFormSwitchTool' })


const { t } = useI18n()
/** 弹窗显隐状态 */
const visible = ref<boolean>(false)
</script>

<style scoped>
.tool-button {
  font-size: 16px;
  margin: 7px 0;
}
</style>
