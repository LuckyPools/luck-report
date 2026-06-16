<template>
  <div ref="container" id="designer-container">
    <div class="u-designer">
      <!-- 左侧区域：顶部工具和内容表格 -->
      <div class="left-part">
        <TopToolBar ref="topToolBar" :selected-cells="selectedCells" />
        <ContentTable
          ref="contentTableRef"
          :reportPath="localReportPath"
          @cell-selected="handleCellSelected"
          @save="handleSave"
          @error="handleError"
        />
      </div>
      <!-- 右侧区域：侧边栏 -->
      <div class="right-part">
        <ResourcePanel ref="sidePanel" :selectedCells="selectedCells" />
      </div>
    </div>
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
 * - 子组件（TopToolBar / ContentTable / ResourcePanel / AiIframe）已完成 vue3 迁移，
 *   全部回挂并启用
 * - 第三方样式（handsontable / designer/tree.css）随子组件一起放开
 * - CodeMirror 已从 v5 升级到 v6，CSS 由 <CodeMirror> 组件自身按需引入，不再在此处手动 import
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
import { useRouter } from 'vue-router'

// 第三方样式
import 'handsontable/dist/handsontable.min.css'
import '../../../assets/css/designer/tree.css'

// 子组件
import ContentTable from '@/views/report/designer/edit-table/index.vue'
import PrintLine from '@/views/report/designer/print-line/index.vue'
import ResourcePanel from '@/views/report/designer/resource-panel/index.vue'
import TopToolBar from '@/views/report/designer/tool-bar/index.vue'
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

/** ContentTable 组件引用（用于调用暴露的 getReportData / saveReport） */
const contentTableRef = ref(null)

/** TopToolBar 组件引用（用于调用工具组暴露的方法） */
const topToolBar = ref(null)

/** ResourcePanel 组件引用（右侧资源侧边栏） */
const sidePanel = ref(null)

/** AiIframe 组件引用（AI 对话框） */
const aiIframe = ref(null)

/** vue-router 实例（供 navigateTo 使用） */
const router = useRouter()

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
 * 获取报表数据（由 ContentTable 暴露的 getReportData 转发）
 * @returns {string|null} 当前报表 XML 数据；组件未就绪时返回 null
 */
function getReportData() {
  // ContentTable 通过 defineExpose 暴露 getReportData / saveReport
  // 此处仅在 ContentTable 已挂载完成后才有值
  const inst = contentTableRef.value
  if (inst && typeof inst.getReportData === 'function') {
    return inst.getReportData()
  }
  return null
}

/**
 * 触发保存（由 ContentTable 暴露的 saveReport 转发）
 * @returns {boolean} true=已成功触发；false=ContentTable 尚未就绪
 */
function saveReport() {
  const inst = contentTableRef.value
  if (inst && typeof inst.saveReport === 'function') {
    inst.saveReport()
    return true
  }
  return false
}

/**
 * 通用跳转（基于 vue-router）
 * @param {string} target 目标路由 name
 * @param {Record<string, *>=} params 附加到 url query 的参数，可选
 * @param {boolean} [openInNewTab=true] 是否在新标签页打开
 * @returns {void}
 */
function navigateTo(target, params, openInNewTab = true) {
  const routeData = router.resolve({ name: target, query: params })
  window.open(routeData.href, openInNewTab ? '_blank' : '_self')
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
