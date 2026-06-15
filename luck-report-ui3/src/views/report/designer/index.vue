<template>
  <div ref="container" id="designer-container">
    <div class="u-designer">
      <!-- 左侧区域：顶部工具和内容表格 -->
      <div class="left-part">
        <!-- TODO: 子组件 vue3 迁移完成后回挂 -->
        <!-- <TopToolBar ref="topToolBar" :selectedCells="selectedCells" /> -->
        <!-- <ContentTable
          ref="contentTable"
          :reportPath="localReportPath"
          @cell-selected="handleCellSelected"
          @navigate="handleNavigate"
          @save="handleSave"
          @error="handleError"
        /> -->
      </div>
      <!-- 右侧区域：侧边栏 -->
      <div class="right-part">
        <!-- <ResourcePanel ref="sidePanel" :selectedCells="selectedCells" /> -->
      </div>
    </div>

    <!-- AI 对话框 iframe 组件 -->
    <!-- <AiIframe :defaultVisible="true" ref="aiIframe" /> -->
  </div>
</template>

<script setup lang="ts">
/**
 * 报表设计器页面（vue3 迁移骨架版）
 *
 * 工作流程：
 * 1. 接收父级传入的 reportPath，挂载时从 URL 解析 lang 并设置 i18n
 * 2. 维护 selectedCells（当前选中单元格范围）和 localReportPath（当前报表路径）
 * 3. 将顶层工具条 / 表格 / 资源面板 / AI 对话框的事件向上抛
 *
 * 迁移说明：
 * - 子组件（TopToolBar / ContentTable / ResourcePanel / AiIframe）暂未迁移到 vue3，
 *   当前先注释掉 import 和 template 引用，待各子组件完成 vue3 改造后再回挂
 * - 第三方样式（handsontable / codemirror / designer/tree.css）随子组件一起暂注释，
 *   待相关子组件回挂后再放开
 *
 * 类型说明：
 * - 保留 lang="ts" 以便后续接入完整 TS 类型检查
 * - 当前阶段故意避开 ESLint parser（@babel/eslint-parser）不识别的 TS 高级语法：
 *   顶级 interface / type 声明、defineProps<T>() / defineEmits<T>() 泛型、
 *   函数参数与返回值类型注解、ref<多行对象字面量>() 等
 * - 类型信息通过 JSDoc @type 注释承载
 *
 * 调用方：src/router/index.ts（/report/designer 路由）
 */
import { ref, watch, onMounted } from 'vue'

// 第三方样式与子组件引用：随子组件 vue3 迁移完成后再放开
// import 'handsontable/dist/handsontable.min.css'
// import 'codemirror/lib/codemirror.css'
// import 'codemirror/addon/hint/show-hint.css'
// import 'codemirror/addon/lint/lint.css'
// import '../../../assets/css/designer/tree.css'
// import 'codemirror/mode/javascript/javascript.js'

// import ResourcePanel from '@/views/report/designer/resource-panel/index.vue'
// import TopToolBar from '@/views/report/designer/tool-bar/index.vue'
// import ContentTable from '@/views/report/designer/edit-table/index.vue'
// import AiIframe from '@/views/report/designer/ai-iframe/index.vue'
import { createNavigator } from '@/utils/navigator'
import { getUrlSearchParams } from '@/utils/url'
import { setLocale } from '@/locales'

/**
 * 组件 props 定义
 * - 采用 vue3 defineProps 选项写法，避开 TS 顶级 interface 声明
 *   （项目 ESLint 解析器为 @babel/eslint-parser，不支持该语法）
 * @type {{ reportPath: string }}
 */
const props = defineProps({
  /** 报表路径（query/reportPath） */
  reportPath: {
    type: String,
    default: ''
  }
})

/**
 * 组件向外暴露的事件
 * - navigate: 子组件请求跳转
 * - save: 子组件请求保存
 * - error: 子组件上报错误
 *
 * 写法说明：采用数组式 declareEmits 写法，避开 TS 调用签名语法
 * （项目 ESLint 解析器为 @babel/eslint-parser，不支持该语法）
 */
const emit = defineEmits(['navigate', 'save', 'error'])

/** 容器 DOM 引用（原文件中保留但未被使用） */
const container = ref(null)

/**
 * 当前选中单元格范围（行列起止）
 * @type {{ rowIndex: number|null, colIndex: number|null, row2Index: number|null, col2Index: number|null }}
 */
const selectedCells = ref({
  rowIndex: null,
  colIndex: null,
  row2Index: null,
  col2Index: null
})

/** 当前报表路径（跟随 props 同步，可被内部方法覆写） */
const localReportPath = ref(props.reportPath)

// 监听 props.reportPath 变化同步到本地
watch(
  () => props.reportPath,
  (val) => {
    localReportPath.value = val
  }
)

/**
 * 从 URL 解析 lang 参数并设置语言
 * @returns {void}
 */
function parseLocaleFromUrl() {
  const searchParams = getUrlSearchParams()
  const lang = searchParams.get('lang')
  if (lang) {
    // i18n 模块对 locale 的入参已收紧为联合类型，这里用 as 强转以匹配 URL 任意字符串
    setLocale(lang)
  }
}

/**
 * 单元格选中事件处理
 * @param {{ rowIndex: number|null, colIndex: number|null, row2Index: number|null, col2Index: number|null }} cells 选中的单元格范围
 * @returns {void}
 */
function handleCellSelected(cells) {
  selectedCells.value = {
    rowIndex: cells.rowIndex,
    colIndex: cells.colIndex,
    row2Index: cells.row2Index,
    col2Index: cells.col2Index
  }
}

/**
 * 跳转事件透传给父组件
 * @param {*} data 跳转参数
 * @returns {void}
 */
function handleNavigate(data) {
  emit('navigate', data)
}

/**
 * 保存事件透传给父组件
 * @param {*} data 保存数据
 * @returns {void}
 */
function handleSave(data) {
  emit('save', data)
}

/**
 * 错误事件透传给父组件
 * @param {*} err 错误对象
 * @returns {void}
 */
function handleError(err) {
  emit('error', err)
}

/**
 * 获取报表数据（待 ContentTable 迁移后实现）
 * @returns {*} 当前报表数据快照
 */
function getReportData() {
  // TODO: 待 ContentTable 迁移后接入
  return null
}

/**
 * 触发保存（待 ContentTable 迁移后实现）
 * @returns {*} 保存结果
 */
function saveReport() {
  // TODO: 待 ContentTable 迁移后接入
  return null
}

/**
 * 通用跳转（待 router 注入后实现）
 * @param {string} target 目标路由 name
 * @param {Record<string, *>=} params 附加到 url query 的参数，可选
 * @param {boolean} [openInNewTab=true] 是否在新标签页打开
 * @returns {void}
 */
function navigateTo(target, params, openInNewTab = true) {
  // TODO: 接入 vue-router 后改为 useRouter() / useRoute()，此处保留接口签名
  createNavigator({
    $router: undefined,
    $route: undefined
  }).navigate({ target, params, openInNewTab })
}

/**
 * 设置当前报表路径
 * @param {string} path 新的报表路径
 * @returns {void}
 */
function setReportPath(path) {
  localReportPath.value = path
}

/**
 * 设置语言
 * @param {string} locale 语言标识
 * @returns {void}
 */
function switchLocale(locale) {
  setLocale(locale)
}

onMounted(() => {
  parseLocaleFromUrl()
})
</script>

<style scoped>
#designer-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.u-designer {
  height: 100%;
  display: flex;
  flex-direction: row;
}

.left-part {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-part {
  width: 400px;
  overflow: hidden;
}
</style>
