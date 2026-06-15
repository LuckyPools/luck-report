<template>
  <div ref="sidePanel" class="ud-panel">
      <a-tabs v-model:active-key="activeTab" type="card" class="resource-tabs" @tab-change="handleTabChange">
          <a-tab-pane :key="'property'" :tab="t('panel.property')" />
          <a-tab-pane :key="'datasource'" :tab="t('panel.datasource')" />
      </a-tabs>
      <div class="tab-content" ref="tabContent">
          <PropertyPanel v-show="activeTab === 'property'" ref="propertyPanel" :row-index="rowIndex" :col-index="colIndex" :row2-index="row2Index" :col2-index="col2Index" :refresh-trigger="refreshTrigger" @refresh="handlePropertyPanelRefresh" />
          <DatasourcePanel v-show="activeTab === 'datasource'" />
      </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ResourcePanel 资源侧边栏（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. 通过 a-tabs 在「属性面板 / 数据源面板」之间切换
 * 2. 监听父组件传入的 selectedCells，更新当前选区索引并触发 PropertyPanel 刷新
 * 3. PropertyPanel 内部 emit('refresh') 时同步自增 refreshTrigger
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - u-tabs（自定义）→ a-tabs + a-tab-pane（ant-design-vue）
 * - mapGetters / Vuex → useReportStore
 * - 移除未使用的 context 计算属性（原 vuex 版 getContext 派生但模板未引用）
 */
import { ref, watch } from 'vue'
import DatasourcePanel from './datasource-panel/index.vue'
import PropertyPanel from '@/views/report/designer/resource-panel/property-panel/index.vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'ResourcePanel' })


const { t } = useI18n()
/**
 * 组件 props
 * @type {{ selectedCells: { rowIndex: number|null, colIndex: number|null, row2Index: number|null, col2Index: number|null } }}
 */
const props = defineProps({
  selectedCells: {
    type: Object,
    default: () => ({
      rowIndex: null,
      colIndex: null,
      row2Index: null,
      col2Index: null
    })
  }
})

/** 当前激活的 tab key */
const activeTab = ref<string>('property')

/** 选区起止行/列索引 */
const rowIndex = ref<number>(0)
const colIndex = ref<number>(0)
const row2Index = ref<number>(0)
const col2Index = ref<number>(0)

/** PropertyPanel 刷新触发器（值变化即触发子组件 watch 重新加载） */
const refreshTrigger = ref<number>(0)

/**
 * 刷新属性面板
 * @param r 起始行
 * @param c 起始列
 * @param r2 结束行
 * @param c2 结束列
 */
function refreshPropertyPanel(r: number, c: number, r2: number, c2: number): void {
  rowIndex.value = r
  colIndex.value = c
  row2Index.value = r2
  col2Index.value = c2
  activeTab.value = activeTab.value ? activeTab.value : 'property'
  refreshTrigger.value++
}

/** tab 切换：切回 property 时触发刷新 */
function handleTabChange(): void {
  if (activeTab.value === 'property') {
    refreshTrigger.value++
  }
}

/** PropertyPanel 内部请求刷新 */
function handlePropertyPanelRefresh(): void {
  refreshTrigger.value++
}

// 监听父组件传入的 selectedCells 变化，同步选区索引
watch(
  () => props.selectedCells,
  (newVal) => {
    if (newVal.rowIndex !== null && newVal.colIndex !== null) {
      refreshPropertyPanel(
        newVal.rowIndex,
        newVal.colIndex,
        newVal.row2Index,
        newVal.col2Index
      )
    }
  },
  { deep: true }
)
</script>

<style scoped>
.ud-panel{
  position: relative;
  width: 400px;
  background: #ffffff;
  box-shadow: -5px 0 5px rgba(0, 0, 0, 0.1);
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.tab-content{
  border-left: 1px #e0e0e0 solid;
  flex-grow: 1;
  overflow-y: auto;
}

.resource-tabs {
  height: 50px;
  border: none !important;
}

.resource-tabs /deep/ .nav{
  height: 50px;
  background: var(--color-primary) !important;
}

.resource-tabs /deep/ .nav li{
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: none !important;
}

.resource-tabs /deep/ .nav li:hover {
  color: grey !important;
}

.resource-tabs /deep/ .nav li:active {
  color: var(--color-primary) !important;
}

</style>
