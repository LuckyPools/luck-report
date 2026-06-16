<template>
  <a-button
    type="text"
    :title="t('openFile')"
    class="tool-button"
    @click="visible = true"
  >
    <template #icon>
      <i class="iconfont icon-folder"></i>
    </template>
    <OpenDialog
      v-model:visible="visible"
    />
  </a-button>
</template>

<script setup lang="ts">
/**
 * OpenTool 打开报表工具（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 点击按钮 → visible = true
 * 2. OpenDialog 关闭时通过 v-model:visible 双向同步
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UButton（自定义）→ a-button + 模板内 icon 槽
 * - 子组件 visible 双向绑定改用 v-model:visible 语法糖
 */
import { ref } from 'vue'
import OpenDialog from '@/views/report/designer/tool-bar/open-tool/open-dialog/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'OpenTool' })


const { t } = useI18n()
/** 弹窗显示状态 */
const visible = ref<boolean>(false)
</script>
