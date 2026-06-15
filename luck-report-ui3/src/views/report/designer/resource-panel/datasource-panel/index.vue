<template>
  <div style="width:100%;">
    <!-- 工具栏 -->
    <div class="ds-toolbar">
      <a-button
        type="text"
        class="toolbar-btn"
        :title="t('property.datasource.title')"
        @click="showDatasourceDialog"
      >
        <template #icon><i class="iconfont icon-database"></i></template>
      </a-button>

      <a-button
        type="text"
        class="toolbar-btn"
        :title="t('property.datasource.addBean')"
        @click="showSpringDialog"
      >
        <template #icon><i class="iconfont icon-leaf"></i></template>
      </a-button>

      <a-button
        type="text"
        class="toolbar-btn"
        :title="t('property.datasource.addBuildin')"
        @click="showBuildinDialog"
      >
        <template #icon><i class="iconfont icon-share"></i></template>
      </a-button>
    </div>

    <!-- 树容器 -->
    <div ref="treeContainer">
      <!-- 数据库树组件 -->
      <DatabaseTree
        v-for="(datasource, index) in jdbcDatasources"
        :key="'jdbc_' + '_' + index"
        :datasources="datasources"
        :datasource="datasource"
        @remove="removeDatasource"
        @update-datasource="updateDatasource"
      />

      <!-- Spring树组件 -->
      <SpringTree
        v-for="(datasource, index) in springDatasources"
        :key="'spring_' + '_' + index"
        :name="datasource.name"
        :datasets="datasource.datasets || []"
        :datasources="datasources"
        :bean-id="datasource.beanId"
        @remove="removeDatasource"
        @update-datasource="updateDatasource"
        @update-datasets="updateSpringDatasets(datasource, $event)"
      />

      <!-- 内置数据源树组件 -->
      <BuildinTree
        v-for="(datasource, index) in buildinDatasources"
        :key="'buildin_' + '_' + index"
        :name="datasource.name"
        :datasets="datasource.datasets || []"
        @remove="removeDatasource"
        @update-datasource="updateDatasource"
      />
    </div>

    <!-- 数据源对话框 -->
    <DatasourceDialog
      :datasources="datasources"
      :visible="datasourceDialogVisible"
      :datasource="currentDatasource"
      @close="datasourceDialogVisible = false"
      @save="handleJdbcSave"
    />

    <!-- Spring对话框 -->
    <SpringDialog
      :datasources="datasources"
      :visible="springDialogVisible"
      :datasource="currentSpringDatasource"
      @close="springDialogVisible = false"
      @save="handleSpringSave"
    />

    <!-- 内置数据源选择对话框 -->
    <BuildinDatasourceSelectDialog
      :datasources="datasources"
      :visible="buildinDialogVisible"
      @close="buildinDialogVisible = false"
      @select="handleBuildinSelect"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * DatasourcePanel 数据源面板（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UButton（自定义）→ a-button（保留原 iconfont 类）
 * - mapGetters('report', ...) → useReportStore
 * - this.$set / $delete → vue3 reactive（push / 直接赋值即可被追踪）
 * - this.$store.commit('report/SET_DATASOURCE_PANEL_UPDATE', false) → report.setDatasourcePanelUpdate(false)
 */
import { ref, computed, watch } from 'vue'
import DatabaseTree from './database-tree/index.vue'
import SpringTree from './spring-tree/index.vue'
import BuildinTree from './buildin-tree/index.vue'
import DatasourceDialog from './datasource-dialog/index.vue'
import SpringDialog from './spring-dialog/index.vue'
import BuildinDatasourceSelectDialog from './buildin-datasource-select-dialog/index.vue'
import { deepCopy } from '@/utils/comnon'
import { updateReportDef } from '@/utils/contextActions'
import { useReportStore } from '@/store/modules/report'
import type { ReportDatasource, ReportContext } from '@/types/report-def'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'DatasourcePanel' })


const { t } = useI18n()
const report = useReportStore()

const datasources = ref<ReportDatasource[]>([])
const buildinDialogVisible = ref<boolean>(false)
const datasourceDialogVisible = ref<boolean>(false)
const currentDatasource = ref<ReportDatasource | null>(null)
const springDialogVisible = ref<boolean>(false)
const currentSpringDatasource = ref<Record<string, unknown> | null>(null)
const treeContainer = ref<HTMLDivElement | null>(null)

/** 分离不同类型的数据源以便渲染 */
const jdbcDatasources = computed<ReportDatasource[]>(() =>
  datasources.value.filter((item) => item.type === 'jdbc')
)
const springDatasources = computed<ReportDatasource[]>(() =>
  datasources.value.filter((item) => item.type === 'spring')
)
const buildinDatasources = computed<ReportDatasource[]>(() =>
  datasources.value.filter((item) => item.type === 'buildin')
)

/**
 * 初始化数据源
 */
function initializeDatasources(): void {
  const ctx = report.getContext as ReportContext | null
  if (!ctx) return

  const reportDef = ctx.reportDef
  if (!reportDef) return

  if (!reportDef.datasources) {
    const newReportDef = deepCopy(reportDef) as ReportContext['reportDef']
    newReportDef.datasources = []
    updateReportDef(newReportDef as any)
  }

  datasources.value = reportDef.datasources || []
}

/**
 * 显示数据源对话框
 */
function showDatasourceDialog(): void {
  currentDatasource.value = null
  datasourceDialogVisible.value = true
}

/**
 * 显示Spring对话框
 */
function showSpringDialog(): void {
  currentSpringDatasource.value = null
  springDialogVisible.value = true
}

/**
 * 显示内置数据源对话框
 */
function showBuildinDialog(): void {
  buildinDialogVisible.value = true
}

/**
 * 统一写入新数据源到 store（合并原 addJdbcDatasource / addSpringDatasource / addBuildinDatasource）
 */
function addDatasource(datasource: Record<string, unknown>): void {
  const newDatasource = { ...datasource } as ReportDatasource
  datasources.value.push(newDatasource)
  syncToStore()
}

function handleJdbcSave(datasource: Record<string, unknown>): void {
  addDatasource({
    name: datasource.name,
    username: datasource.username,
    password: datasource.password,
    type: datasource.type || 'jdbc',
    url: datasource.url,
    driver: datasource.driver,
    datasets: datasource.datasets || []
  })
}

function handleSpringSave(datasource: Record<string, unknown>): void {
  addDatasource({
    name: datasource.name,
    beanId: datasource.beanId,
    type: datasource.type || 'spring',
    datasets: datasource.datasets || []
  })
}

function handleBuildinSelect(payload: { name: string; type: 'buildin' }): void {
  addDatasource({
    name: payload.name,
    type: payload.type,
    datasets: []
  })
}

/**
 * 将 datasources 同步到 store.reportDef
 */
function syncToStore(): void {
  const ctx = report.getContext as ReportContext | null
  if (!ctx) return
  const reportDef = { ...ctx.reportDef, datasources: datasources.value }
  updateReportDef(reportDef as any)
}

/**
 * 移除数据源
 */
function removeDatasource(name: string): void {
  const index = datasources.value.findIndex((d) => d.name === name)
  if (index !== -1) {
    datasources.value.splice(index, 1)
    syncToStore()
  }
}

/**
 * 更新数据源
 */
function updateDatasource(data: Record<string, unknown>): void {
  // 查找并更新匹配的数据源
  const index = datasources.value.findIndex((item) => item.name === data.oldName)
  if (index !== -1) {
    datasources.value[index] = { ...datasources.value[index], ...data }
  }
  syncToStore()
}

/**
 * 更新 Spring 数据源的数据集
 */
function updateSpringDatasets(datasource: ReportDatasource, datasets: unknown): void {
  datasource.datasets = datasets as ReportDatasource['datasets']
  syncToStore()
}

/**
 * 兼容旧接口：返回包含 appendChild 的对象，供外部脚本把节点注入到树容器
 *
 * 历史背景：
 * - Vue2 版本对外暴露 buildPanel() 以支持某些插件/iframe 集成方案
 * - 新版本使用 vue3 ref 暴露容器，但保留旧方法签名以避免破坏性变更
 */
function buildPanel(): { appendChild: (el: Node) => void }[] {
  return [
    {
      appendChild: (el: Node) => {
        if (treeContainer.value) {
          treeContainer.value.appendChild(el)
        }
      }
    }
  ]
}

defineExpose({ buildPanel })

// 监听 context 变化（immediate: true 在 created 阶段等价于初始化）
watch(
  () => report.getContext,
  (newContext) => {
    if (newContext && (newContext as ReportContext).reportDef) {
      initializeDatasources()
    }
  },
  { immediate: true, deep: true }
)

// 监听面板刷新标记位
watch(
  () => report.getIsDatasourcePanelUpdate,
  (newVal) => {
    if (newVal) {
      initializeDatasources()
      report.setDatasourcePanelUpdate(false)
    }
  }
)
</script>

<style scoped>
.ds-toolbar {
  background: rgb(248, 248, 248);
  line-height: 40px;
  box-shadow: 0 2px 6px 0 rgba(0,0,0,.2);
}

.toolbar-btn{
  border: none;
  background: #f8f8f8;
}
</style>
