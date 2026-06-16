<template>
  <div>
    <a-modal
      :title="t('dialog.sql.title')"
      :width="1000"
      :open="visible"
      :style="{ top: '10vh' }"
      :zIndex="20000"
      :mask-closable="false"
      @cancel="closeDialog"
    >
      <div class="dialog-content">
        <div class="content-layout">
          <!-- 左侧：搜索表格（非弹窗组件，后续单独改造） -->
          <div class="left-panel">
            <SearchTable
              :datasourceData="datasourceData"
              :trigger-load="triggerLoadSearchTable"
              @add="handleAddSql"
              @load-complete="handleSearchTableLoadComplete"
            />
          </div>

          <!-- 右侧：SQL 编辑器 + 参数编辑器 -->
          <div class="right-panel">
            <SqlEditor
              :name="datasetName"
              :sql="sql"
              @sql-change="handleSqlChange"
              @dataset-name-change="handleDatasetNameChange"
            />
            <ParameterEditor
              :parameters="parameters"
              @add-parameter="handleAddParameter"
              @edit-parameter="handleEditParameter"
              @remove-parameter="handleRemoveParameter"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <a-button @click="handlePreview" style="margin-right: 10px;">
          {{ t('dialog.sql.preview') }}
        </a-button>
        <a-button type="primary" @click="handleConfirm">
          {{ t('dialog.sql.ok') }}
        </a-button>
      </template>
    </a-modal>

    <PreviewDataDialog
      v-model:visible="previewDialogVisible"
      :parameters="previewParameters"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * SqlDatasetDialog SQL 数据集配置弹窗（vue3 + TS + ant-design-vue）
 *
 * 工作流程：
 * 1. visible=true → initData（清空 / 回填）
 * 2. 内部组件 SearchTable / SqlEditor / ParameterEditor 交互
 * 3. 「预览数据」→ 组装 parameters → 打开 PreviewDataDialog
 * 4. 「确定」→ 校验 + 查重 → emit('save', name, oldName, sql, parameters)
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - UDialog/UButton（自定义）→ a-modal/a-button
 * - mapGetters('report', ['getContext']) / Vuex → useReportStore
 * - this.$emit → defineEmits
 * - $set / 数组 reactive 操作 → push / 直接赋值（vue3 响应式自动追踪）
 */
import { ref, watch, nextTick } from 'vue'
import { showAlert, deepCopy } from '@/utils/comnon'
import { setDirty } from '@/utils/table'
import { useReportStore } from '@/store/modules/report'
import SearchTable from './search-table/index.vue'
import SqlEditor from './sql-editor/index.vue'
import ParameterEditor from './parameter-editor/index.vue'
import PreviewDataDialog from '@/views/report/designer/resource-panel/datasource-panel/preview-data-dialog/index.vue'
import type { ReportDatasource, ReportContext, ReportDataset } from '@/types/report-def'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'SqlDatasetDialog' })


const { t } = useI18n()
/** SQL 参数项结构 */
interface SqlParam {
  name: string
  type: string
  defaultValue: string
  [key: string]: unknown
}

/** 数据集入参（来自父组件） */
interface DatasetData {
  name?: string
  sql?: string
  parameters?: SqlParam[]
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    datasourceData: ReportDatasource | null
    datasetData?: DatasetData | null
  }>(),
  {
    visible: false,
    datasourceData: null,
    datasetData: null
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', name: string, oldName: string, sql: string, parameters: SqlParam[]): void
}>()

const report = useReportStore()
const context = report.getContext

const datasetName = ref<string>('')
const sql = ref<string>('')
const parameters = ref<SqlParam[]>([])
const oldName = ref<string>('')

const previewDialogVisible = ref<boolean>(false)
const previewParameters = ref<Record<string, unknown> | null>(null)
const triggerLoadSearchTable = ref<boolean>(false)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      initData()
    }
  }
)

/** 初始化数据（清空 / 回填） */
function initData(): void {
  datasetName.value = ''
  sql.value = ''
  parameters.value = []
  oldName.value = ''

  if (props.datasetData) {
    datasetName.value = props.datasetData.name || ''
    sql.value = props.datasetData.sql || ''
    parameters.value = Array.isArray(props.datasetData.parameters)
      ? [...props.datasetData.parameters]
      : []
    oldName.value = props.datasetData.name || ''
  }

  nextTick(() => {
    triggerLoadSearchTable.value = true
  })
}

function handleSearchTableLoadComplete(): void {
  triggerLoadSearchTable.value = false
}

function handleSqlChange(newSql: string): void {
  sql.value = newSql || ''
}

function handleDatasetNameChange(newName: string): void {
  datasetName.value = newName || ''
}

function handleAddSql(sqlText: string): void {
  sql.value = sqlText || ''
}

function handleAddParameter(newParam: SqlParam): void {
  parameters.value = [...parameters.value, newParam]
}

function handleEditParameter(index: number, updatedParam: SqlParam): void {
  if (parameters.value[index]) {
    parameters.value[index] = { ...updatedParam }
  }
}

function handleRemoveParameter(index: number): void {
  if (parameters.value && index >= 0 && index < parameters.value.length) {
    parameters.value.splice(index, 1)
  }
}

/** 关闭弹窗 */
function closeDialog(): void {
  emit('close')
}

/** 关闭预览子弹窗 */
function closePreviewDialog(): void {
  previewDialogVisible.value = false
}

/**
 * 预览数据：组装 parameters 调用 PreviewDataDialog
 * - jdbc 类型：补全 username/password/driver/url
 * - buildin 类型：补全 name
 */
function handlePreview(): void {
  const sqlText = sql.value || ''
  if (!sqlText) {
    showAlert(t('dialog.sql.sqlTip'))
    return
  }

  const ds = props.datasourceData
  if (!ds) {
    showAlert(t('dialog.sql.sqlTip'))
    return
  }
  const type = (ds as any).type
  const parametersData: Record<string, unknown> = {
    sql: sqlText,
    type,
    parameters: deepCopy(parameters.value)
  }

  if (type === 'jdbc') {
    parametersData.username = (ds as any).username
    parametersData.password = (ds as any).password
    parametersData.driver = (ds as any).driver
    parametersData.url = (ds as any).url
  } else if (type === 'buildin') {
    parametersData.name = ds.name
  }

  previewParameters.value = parametersData
  previewDialogVisible.value = true
}

/** 校验 + 查重 → emit('save') */
function handleConfirm(): void {
  const name = datasetName.value || ''
  const sqlText = sql.value || ''

  if (!name) {
    showAlert(t('dialog.sql.nameTip'))
    return
  }
  if (!sqlText) {
    showAlert(t('dialog.sql.sqlTip'))
    return
  }

  // 校验重名
  let needCheck = false
  if (!oldName.value || name !== oldName.value) {
    needCheck = true
  }

  if (needCheck && context.value) {
    const datasources = (context.value as ReportContext).reportDef?.datasources || []
    for (const datasource of datasources as ReportDatasource[]) {
      const datasets: ReportDataset[] | undefined = datasource.datasets
      if (!datasets || !Array.isArray(datasets)) continue
      for (const dataset of datasets) {
        if (dataset.name === name) {
          showAlert(`${t('dialog.sql.ds')}[${name}]${t('dialog.sql.exist')}`)
          return
        }
      }
    }
  }

  emit('save', name, oldName.value, sqlText, parameters.value)
  setDirty()
  closeDialog()
}
</script>

<style scoped>
.content-layout {
  display: flex;
  gap: 15px;
  height: 100%;
}

.left-panel {
  flex: 0 0 200px;
  height: 100%;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}
</style>
