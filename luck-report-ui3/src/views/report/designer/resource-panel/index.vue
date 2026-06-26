<template>
  <div ref="sidePanel" class="ud-panel">
      <div class="resource-tabs">
          <div class="resource-tabs-nav">
              <div
                  v-for="tab in tabs"
                  :key="tab.key"
                  class="resource-tabs-tab"
                  :class="{ 'resource-tabs-tab-active': activeTab === tab.key }"
                  @click="handleTabClick(tab.key)"
              >
                  {{ tab.label }}
              </div>
          </div>
      </div>
      <div class="tab-content" ref="tabContent">
          <PropertyPanel v-show="activeTab === 'property'" ref="propertyPanel" :row-index="rowIndex" :col-index="colIndex" :row2-index="row2Index" :col2-index="col2Index" :refresh-trigger="refreshTrigger" @refresh="handlePropertyPanelRefresh" />
          <DatasourcePanel v-show="activeTab === 'datasource'" />
      </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ResourcePanel 资源侧边栏（vue3 + TS + 自定义 tabs）
 *
 * 工作流程：
 * 1. 通过自定义 tabs 在「属性面板 / 数据源面板」之间切换
 * 2. 监听父组件传入的 selectedCells，更新当前选区索引并触发 PropertyPanel 刷新
 * 3. PropertyPanel 内部 emit('refresh') 时同步自增 refreshTrigger
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

/** tab 配置 */
const tabs = [
  { key: 'property', label: t('panel.property') },
  { key: 'datasource', label: t('panel.datasource') }
]

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

/**
 * tab 点击切换
 * @param key 被点击的 tab key
 */
function handleTabClick(key: string): void {
  if (activeTab.value === key) return
  activeTab.value = key
  if (key === 'property') {
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

.resource-tabs-nav {
  display: flex;
  height: 50px;
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--color-primary);
}

.resource-tabs-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  margin: 0;
  padding: 0 16px;
  color: white;
  background: transparent;
  border: none;
  border-radius: 0;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
}

.resource-tabs-tab:hover {
  color: #d0d0d0;
}

.resource-tabs-tab-active {
  color: var(--color-primary) !important;
  background: #ffffff !important;
}

</style>
