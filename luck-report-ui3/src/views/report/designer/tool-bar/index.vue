<template>
  <div class="ud-toolbar" :style="toolbarStyle" ref="toolbar">
    <div class="ud-toolbar-title">
      <div class="file-info">
        {{ fileName }}
      </div>
      <PreviewTool ref="previewTool" />
      <PreviewPageTool ref="previewPageTool" />
      <SaveTool ref="saveTool" />
      <SaveAsTool ref="saveAsTool" />
      <OpenTool ref="openTool" />
      <ImportTool ref="importTool" />
      <UndoTool ref="undoTool" />
      <RedoTool ref="redoTool" />
      <PrintLineTool ref="printLineTool" />
      <SearchFormSwitchTool ref="searchFormSwitchTool" />
      <SettingsTool ref="settingsTool" />
    </div>
    <div class="ud-toolbar-content">
      <div class="toolbar-box">
        <MergeTool ref="mergeTool" :selected-cells="selectedCells" />
        <AlignLeftTool ref="alignLeftTool" :selected-cells="selectedCells" />
        <AlignTopTool ref="alignTool" :selected-cells="selectedCells" />
        <BorderTool ref="borderTool" :selected-cells="selectedCells" />
        <FontFamilyTool ref="fontFamilyTool" :selected-cells="selectedCells" />
        <FontSizeTool ref="fontSizeTool" :selected-cells="selectedCells" />
        <BoldTool ref="boldTool" :selected-cells="selectedCells" />
        <ItalicTool ref="italicTool" :selected-cells="selectedCells" />
        <UnderlineTool ref="underlineTool" :selected-cells="selectedCells" />
        <FontColorTool ref="fontColorTool" :selected-cells="selectedCells" />
        <BgColorTool ref="bgColorTool" :selected-cells="selectedCells" />
        <CrosstabTool ref="crosstabTool" :selected-cells="selectedCells" />
        <ImageTool ref="imageTool" :selected-cells="selectedCells" />
        <ChartTool ref="chartTool" :selected-cells="selectedCells" />
        <ZxingTool ref="zxingTool" :selected-cells="selectedCells" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * TopToolBar 报表设计器顶部工具条容器（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 接收父级传入的 selectedCells，向下传递给需要响应选中区变化的子工具
 * 2. 从 store 读取 fileName 显示在标题栏，并同步到 document.title
 * 3. 渲染分组工具：标题栏（预览/保存/撤销重做/查询表单/设置） + 内容栏（合并/对齐/字体/边框/图表等）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup> + 显式 type 标注
 * - components 选项 + 字符串模板 ref → 局部 import + 函数名引用
 * - 自定义 U* 工具组件：除本次新增的 5 个工具外，其他子工具仍为 Vue2 Options API；
 *   本组件向下绑定时使用 kebab-case（:selected-cells）以兼容子组件 props 命名
 * - data()/computed/watch → ref/computed/watch
 * - $store.getters['report/X'] → useReportStore().X
 *
 * 注意事项：
 * - 各子工具的 template ref 暂未在本组件内消费，仅保留以便后续接入工具组联动；
 *   子组件在 <script setup> 下需自行 defineExpose 才能被父级访问
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useReportStore } from '@/store/modules/report'

import ImportTool from '@/views/report/designer/tool-bar/import-tool/index.vue'
import SaveTool from '@/views/report/designer/tool-bar/save-tool/index.vue'
import SaveAsTool from '@/views/report/designer/tool-bar/save-as-tool/index.vue'
import PreviewTool from '@/views/report/designer/tool-bar/preview-tool/index.vue'
import PreviewPageTool from '@/views/report/designer/tool-bar/preview-page-tool/index.vue'
import OpenTool from '@/views/report/designer/tool-bar/open-tool/index.vue'
import UndoTool from '@/views/report/designer/tool-bar/undo-tool/index.vue'
import RedoTool from '@/views/report/designer/tool-bar/redo-tool/index.vue'
import PrintLineTool from '@/views/report/designer/tool-bar/print-line-tool/index.vue'
import AlignLeftTool from '@/views/report/designer/tool-bar/align-left-tool/index.vue'
import AlignTopTool from '@/views/report/designer/tool-bar/align-tool/index.vue'
import MergeTool from '@/views/report/designer/tool-bar/merge-tool/index.vue'
import FontFamilyTool from '@/views/report/designer/tool-bar/font-family-tool/index.vue'
import FontSizeTool from '@/views/report/designer/tool-bar/font-size-tool/index.vue'
import BoldTool from '@/views/report/designer/tool-bar/bold-tool/index.vue'
import ItalicTool from '@/views/report/designer/tool-bar/italic-tool/index.vue'
import UnderlineTool from '@/views/report/designer/tool-bar/underline-tool/index.vue'
import BgColorTool from '@/views/report/designer/tool-bar/bg-color-tool/index.vue'
import FontColorTool from '@/views/report/designer/tool-bar/font-color-tool/index.vue'
import CrosstabTool from '@/views/report/designer/tool-bar/crosstab-tool/index.vue'
import ImageTool from '@/views/report/designer/tool-bar/image-tool/index.vue'
import ChartTool from '@/views/report/designer/tool-bar/chart-tool/index.vue'
import ZxingTool from '@/views/report/designer/tool-bar/zxing-tool/index.vue'
import SearchFormSwitchTool from '@/views/report/designer/tool-bar/search-form-switch-tool/index.vue'
import SettingsTool from '@/views/report/designer/tool-bar/settings-tool/index.vue'
import BorderTool from '@/views/report/designer/tool-bar/border-tool/index.vue'

defineOptions({ name: 'TopToolBar' })

/** 入参：当前选中单元格坐标（行/列均为 0-based，null 表示未选） */
interface SelectedCells {
  rowIndex: number | null
  colIndex: number | null
  row2Index: number | null
  col2Index: number | null
}

const props = withDefaults(
  defineProps<{ selectedCells: SelectedCells }>(),
  {
    selectedCells: () => ({
      rowIndex: null,
      colIndex: null,
      row2Index: null,
      col2Index: null
    })
  }
)

// 暂未使用 props，保留以维持子组件 prop 流
void props

const report = useReportStore()

/** 工具条根容器样式 */
const toolbarStyle = ref<{ position: string }>({
  position: 'relative'
})

/** 工具条根容器 DOM 引用（保留以便后续布局计算） */
const toolbar = ref<HTMLDivElement | null>(null)

/**
 * 当前文件名（来自 store，空值时显示 Blank）
 * - 对原版 `decodeURIComponent` 行为保持一致
 */
const fileName = computed<string>(() => {
  const name = report.getFileName
  if (name) {
    return decodeURIComponent(name)
  }
  return 'Blank'
})

// 同步文件名到 document.title（与 Vue2 行为一致）
watch(
  fileName,
  (val) => {
    if (typeof document !== 'undefined') {
      document.title = val
    }
  },
  { immediate: true }
)

// 触发初始 mount 钩子，保留扩展点
onMounted(() => {
  // 当前无需在挂载时执行副作用；保留以维持与原组件相同的生命周期形状
})
</script>

<style scoped>
.ud-toolbar {
  width: 100%;
  position: relative;
}

.ud-toolbar-title {
  width: 100%;
  height: 50px;
  background-color: var(--color-primary);
  color: white;
}

.ud-toolbar-content {
  background-color: #f3f5f7;
}

.toolbar-box {
  background-color: white;
  box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
}

.file-info {
  position: absolute;
  text-align: center;
  width: 100%;
  line-height: 50px;
  font-size: 14px;
}

/* 标题栏按钮：统一尺寸、间距、hover 背景 */
.ud-toolbar-title :deep(.tool-button) {
  font-size: 16px;
  margin: 7px 0;
  color: white;
  background: transparent;
  border: none;
  box-shadow: none;
  height: 36px;
  padding: 0 10px;
  min-width: 36px;
  line-height: 36px;
}

.ud-toolbar-title :deep(.tool-button:hover),
.ud-toolbar-title :deep(.tool-button:focus) {
  color: white;
  background-color: rgba(0, 119, 103, 0.7) !important;
}

.ud-toolbar-title :deep(.tool-button:active) {
  color: white;
  background-color: rgba(0, 119, 103, 0.9) !important;
}

.info-button {
  font-size: 16px;
  margin: 2px 0;
  border: none;
}

/* 内容栏按钮：统一尺寸、间距、hover 背景 */
.toolbar-box :deep(.info-button) {
  font-size: 16px;
  margin: 4px;
  height: 28px;
  padding: 0 6px;
  min-width: 28px;
  line-height: 28px;
  border: none;
  border-radius: 4px;
}

.toolbar-box :deep(.info-button:hover),
.toolbar-box :deep(.info-button:focus) {
  background-color: rgb(236, 237, 237);
}

/* 内容栏选项按钮（bold/italic/underline）：统一尺寸，有边框 */
.toolbar-box :deep(.bold-tool),
.toolbar-box :deep(.italic-tool),
.toolbar-box :deep(.underline-tool) {
  width: 28px;
  height: 28px;
  margin: 4px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 4px;
}

.toolbar-box :deep(.bold-tool:hover),
.toolbar-box :deep(.italic-tool:hover),
.toolbar-box :deep(.underline-tool:hover) {
  border-color: #d9d9d9;
}

.toolbar-box :deep(.bold-tool.is-active),
.toolbar-box :deep(.italic-tool.is-active),
.toolbar-box :deep(.underline-tool.is-active) {
  background-color: rgb(236, 237, 237);
}

/* 内容栏颜色选择器按钮：统一尺寸，无边框 */
.toolbar-box :deep(.font-color-btn),
.toolbar-box :deep(.bg-color-btn) {
  height: 28px;
  padding: 0 6px;
  margin: 4px;
  border: none;
  border-radius: 4px;
}

.toolbar-box :deep(.font-color-btn:hover),
.toolbar-box :deep(.bg-color-btn:hover) {
  background-color: rgb(236, 237, 237);
}
</style>
