<template>
  <div class="tree" style="margin-left: 10px">
    <ul class="tree-root">
      <li>
        <!-- 数据源节点 -->
        <span
          :id="id"
          @click="toggleDatasource"
          @contextmenu.prevent.stop="showDatasourceContextMenu($event)"
        >
          <i
            class="iconfont"
            :class="datasourceExpanded ? 'icon-minus-circle' : 'icon-plus-circle'"
            style="margin-right:2px"
          ></i>
          <i class="iconfont icon-share"></i>
          <a href="javascript:void(0)" class="ds_name">{{ name }}</a>
        </span>

        <!-- 数据集列表 -->
        <ul
          v-show="datasourceExpanded"
          class="node-list"
        >
          <li
            v-for="(dataset, index) in datasets"
            :key="dataset.name + '_' + index"
          >
            <!-- 数据集节点 -->
            <span
              :id="'dataset_' + dataset.name + '_' + index"
              @click="toggleDataset(index)"
              @contextmenu.prevent.stop="showDatasetContextMenu($event, dataset, index)"
            >
              <i
                class="iconfont"
                :class="datasetExpanded[index] ? 'icon-minus-circle' : 'icon-plus-circle'"
                style="margin-right:2px"
              ></i>
              <i class="iconfont icon-sqlds"></i>
              <a href="javascript:void(0)" class="dataset_name">{{ dataset.name }}</a>
            </span>

            <!-- 字段列表 -->
            <ul
              v-show="datasetExpanded[index]"
              style="padding-left: 22px;"
            >
              <li
                v-for="(field, fieldIndex) in dataset.fields"
                :key="field.name + '_' + fieldIndex"
              >
                <span
                  :id="'field_' + dataset.name + '_' + field.name + '_' + fieldIndex"
                  :title="t('tree.doubleClick')"
                  draggable="true"
                  @dblclick="handleFieldDoubleClick(dataset, field)"
                  @dragstart="handleFieldDragStart($event, dataset, field)"
                  @contextmenu.prevent.stop="showFieldContextMenu($event, dataset, field, fieldIndex)"
                >
                  <i class="iconfont icon-property"></i>
                  <a href="javascript:void(0)">{{ field.name }}</a>
                </span>
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>

    <SqlDatasetDialog
      :visible="sqlDatasetDialogVisible"
      :datasourceData="currentDatasourceData"
      :datasetData="currentDatasetData"
      @save="handleSqlDatasetSave"
      @close="sqlDatasetDialogVisible = false"
    />

    <!-- 字段名输入对话框 -->
    <FieldNameDialog
      :visible="fieldNameDialogVisible"
      :dataset="currentDataset"
      @save="handleFieldNameSave"
      @close="fieldNameDialogVisible = false"
    />

    <!-- 右键菜单 -->
    <ContextMenu ref="contextMenuRef" />
  </div>
</template>

<script setup lang="ts">
/**
 * BuildinTree 内置数据源树（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - 自定义 UL/LI 树保持原样（与原 vue2 版本一致），未改用 a-tree
 * - mapGetters('report', ['getContext']) → useReportStore
 * - this.$emit → defineEmits
 * - this.$set / $delete → reactive 直接赋值 / delete
 * - $refs.contextMenu.show() → contextMenuRef.value.show()
 * - mounted/beforeDestroy → onMounted/onBeforeUnmount
 */
import { ref, reactive, onMounted } from 'vue'
import { v1 as uuidv1 } from 'uuid'
import { showAlert, showConfirm } from '@/utils/comnon'
import { deepCopy } from '@/utils/comnon'
import SqlDatasetDialog from '@/views/report/designer/resource-panel/datasource-panel/sql-dataset-dialog/index.vue'
import FieldNameDialog from '../field-name-dialog/index.vue'
import ContextMenu from '../context-menu/index.vue'
import { buildFields } from '@/api/designer'
import { getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import { useReportStore } from '@/store/modules/report'
import type { ReportDataset, ReportContext, ReportDatasetField } from '@/types/report-def'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'BuildinTree' })


const { t } = useI18n()
interface ContextMenuItem {
  key: string
  name: string
  icon: string
}

const props = withDefaults(
  defineProps<{
    name: string
    datasets?: ReportDataset[]
  }>(),
  { datasets: () => [] }
)

const emit = defineEmits<{
  (e: 'remove', name: string): void
  (e: 'update-datasource', payload: Record<string, unknown>): void
}>()

const report = useReportStore()
const context = report.getContext as ReportContext | null

const id = 'buildin_' + uuidv1()
const datasourceExpanded = ref<boolean>(true)
const datasetExpanded = reactive<Record<number, boolean>>({})

const currentDataset = ref<ReportDataset | null>(null)
const fieldNameDialogVisible = ref<boolean>(false)
const sqlDatasetDialogVisible = ref<boolean>(false)
const currentDatasourceData = ref<Record<string, unknown> | null>(null)
const currentDatasetData = ref<ReportDataset | null>(null)

const contextMenuRef = ref()

onMounted(() => {
  // 初始化数据集展开状态
  if (props.datasets && props.datasets.length > 0) {
    for (let i = 0; i < props.datasets.length; i++) {
      datasetExpanded[i] = false
    }
  }
})

/**
 * 切换数据源展开/折叠状态
 */
function toggleDatasource(): void {
  datasourceExpanded.value = !datasourceExpanded.value
}

/**
 * 切换数据集展开/折叠状态
 */
function toggleDataset(index: number): void {
  datasetExpanded[index] = !datasetExpanded[index]
}

/**
 * 显示数据源右键菜单
 */
function showDatasourceContextMenu(event: MouseEvent): void {
  const items: ContextMenuItem[] = [
    { key: 'add', name: t('tree.addDataset'), icon: 'add' },
    { key: 'delete', name: t('tree.delete'), icon: 'delete' }
  ]

  if (contextMenuRef.value) {
    contextMenuRef.value.show(event, items, (key: string) => {
      handleDatasourceMenuAction(key)
    })
  }
}

/**
 * 处理数据源菜单操作
 */
function handleDatasourceMenuAction(key: string): void {
  if (key === 'add') {
    addDatasetAction()
  } else if (key === 'delete') {
    deleteDatasourceAction()
  }
}

/**
 * 添加数据集操作
 */
function addDatasetAction(): void {
  currentDatasourceData.value = {
    type: 'buildin',
    name: props.name
  }
  currentDatasetData.value = { parameters: [] } as any
  sqlDatasetDialogVisible.value = true
}

/**
 * 删除数据源操作
 */
function deleteDatasourceAction(): void {
  showConfirm(`${t('tree.delConfirm')}[${props.name}]？`).then(() => {
    emit('remove', props.name)
  })
}

/**
 * 显示数据集右键菜单
 */
function showDatasetContextMenu(event: MouseEvent, dataset: ReportDataset, index: number): void {
  const items: ContextMenuItem[] = [
    { key: 'addField', name: t('tree.addField'), icon: 'add' },
    { key: 'edit', name: t('tree.edit'), icon: 'edit' },
    { key: 'delete', name: t('tree.del'), icon: 'delete' },
    { key: 'refresh', name: t('tree.refresh'), icon: 'loading' }
  ]

  if (contextMenuRef.value) {
    contextMenuRef.value.show(event, items, (key: string) => {
      handleDatasetMenuAction(key, dataset, index)
    })
  }
}

/**
 * 处理数据集菜单操作
 */
function handleDatasetMenuAction(key: string, dataset: ReportDataset, index: number): void {
  if (key === 'addField') {
    addFieldAction(dataset)
  } else if (key === 'delete') {
    deleteDatasetAction(dataset, index)
  } else if (key === 'edit') {
    editDatasetAction(dataset, index)
  } else if (key === 'refresh') {
    refreshDatasetAction(dataset, index)
  }
}

/**
 * 添加字段操作
 */
function addFieldAction(dataset: ReportDataset): void {
  currentDataset.value = dataset
  fieldNameDialogVisible.value = true
}

/**
 * 处理字段名保存事件
 */
function handleFieldNameSave(fieldName: string, dataset: ReportDataset | null): void {
  if (fieldName && dataset) {
    if (!dataset.fields) {
      dataset.fields = []
    }

    const newDatasets = deepCopy(props.datasets || [])
    const targetDataset = newDatasets.find((item) => item.name === dataset.name)
    if (!targetDataset) return
    if (!targetDataset.fields) {
      targetDataset.fields = []
    }

    const exists = targetDataset.fields.some((field) => field.name === fieldName)
    if (exists) {
      showAlert(t('tree.fieldExist'))
      return
    }

    const field = { name: fieldName } as ReportDatasetField
    targetDataset.fields.push(field)
    emit('update-datasource', {
      name: props.name,
      oldName: props.name,
      datasets: newDatasets
    })
  }
}

/**
 * 编辑数据集操作
 */
function editDatasetAction(dataset: ReportDataset, _index: number): void {
  currentDatasourceData.value = {
    type: 'buildin',
    name: props.name
  }
  currentDatasetData.value = dataset
  sqlDatasetDialogVisible.value = true
}

/**
 * 删除数据集操作
 */
function deleteDatasetAction(dataset: ReportDataset, index: number): void {
  showConfirm(`${t('tree.delDatasetConfirm')}[${dataset.name}]?`).then(() => {
    const newDatasets = deepCopy(props.datasets || [])
    newDatasets.splice(index, 1)
    delete datasetExpanded[index]
    emit('update-datasource', {
      name: props.name,
      oldName: props.name,
      datasets: newDatasets
    })
  })
}

/**
 * 刷新数据集操作
 */
function refreshDatasetAction(dataset: ReportDataset, index: number): void {
  ;(dataset as any).fields = null
  buildFieldsLocal(dataset, index)
}

/**
 * 显示字段右键菜单
 */
function showFieldContextMenu(event: MouseEvent, dataset: ReportDataset, field: ReportDatasetField, fieldIndex: number): void {
  const items: ContextMenuItem[] = [
    { key: 'delete', name: t('tree.del'), icon: 'delete' }
  ]

  if (contextMenuRef.value) {
    contextMenuRef.value.show(event, items, (key: string) => {
      handleFieldMenuAction(key, dataset, field, fieldIndex)
    })
  }
}

/**
 * 处理字段菜单操作
 */
function handleFieldMenuAction(key: string, dataset: ReportDataset, field: ReportDatasetField, fieldIndex: number): void {
  if (key === 'delete') {
    deleteFieldAction(dataset, field, fieldIndex)
  }
}

/**
 * 删除字段操作
 */
function deleteFieldAction(dataset: ReportDataset, field: ReportDatasetField, fieldIndex: number): void {
  showConfirm(`${t('tree.delFieldConfirm')}[${field.name}]？`).then(() => {
    const newDatasets = deepCopy(props.datasets || [])
    const targetDataset = newDatasets.find((item) => item.name === dataset.name)
    if (targetDataset && targetDataset.fields) {
      targetDataset.fields.splice(fieldIndex, 1)
      emit('update-datasource', {
        name: props.name,
        oldName: props.name,
        datasets: newDatasets
      })
    }
  })
}

/**
 * 字段双击事件
 */
function handleFieldDoubleClick(dataset: ReportDataset, field: ReportDatasetField): void {
  buildClickEvent(dataset, field, context)
}

/**
 * 字段拖拽开始事件
 * @param {DragEvent} event - 拖拽事件对象
 * @param {Object} dataset - 数据集对象
 * @param {Object} field - 字段对象
 */
function handleFieldDragStart(event: DragEvent, dataset: ReportDataset, field: ReportDatasetField): void {
  const dragData = {
    datasetName: dataset.name,
    fieldName: field.name,
    type: 'dataset-field'
  }
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(dragData))
    event.dataTransfer.effectAllowed = 'copy'
  }
}

/**
 * 构建字段列表
 */
async function buildFieldsLocal(dataset: ReportDataset, _index?: number): Promise<void> {
  const defaultFields = dataset.fields
  if (defaultFields) {
    return
  }

  const parameters = {
    sql: (dataset as any).sql,
    parameters: JSON.stringify((dataset as any).parameters),
    name: props.name,
    type: 'buildin'
  }

  try {
    const fields = await buildFields(parameters)
    const newDatasets = deepCopy(props.datasets || [])
    const targetDataset = newDatasets.find((item) => item.name === dataset.name)
    if (targetDataset) {
      targetDataset.fields = fields
      emit('update-datasource', {
        name: props.name,
        oldName: props.name,
        datasets: newDatasets
      })
    }
  } catch (error: any) {
    if (error?.msg) {
      showAlert(t('dialog.save.serverError') + t('colon') + error.msg, { useHTMLString: true })
    } else {
      showAlert(t('tree.loadFieldFail'))
    }
  }
}

/**
 * BaseTree 的 buildClickEvent 方法
 */
function buildClickEvent(dataset: ReportDataset, field: ReportDatasetField, ctx: ReportContext | null): void {
  if (!ctx) {
    showAlert(t('tree.cellTip'))
    return
  }
  const hot = TableManager.get()
  if (!hot) {
    showAlert(t('tree.cellTip'))
    return
  }
  const selected = hot.getSelected()

  if (!selected || selected.length === 0) {
    showAlert(t('tree.cellTip'))
    return
  }

  const [rowIndex, colIndex, endRow, endCol] = selected[0]
  let cellDef = getCell(rowIndex, colIndex)

  if (!cellDef) {
    showAlert(t('tree.cellTip'))
    return
  }

  if (cellDef.value.type !== 'dataset') {
    const newCellDef = deepCopy(cellDef)
    newCellDef.value = { type: 'dataset', conditions: [] }
    addCell(newCellDef)
    cellDef = newCellDef
  }

  const newCellDef = deepCopy(cellDef)
  newCellDef.expand = 'Down'
  const value = newCellDef.value
  value.aggregate = 'group'
  value.datasetName = dataset.name
  value.property = field.name
  value.order = 'none'

  let text = value.datasetName + '.' + value.aggregate + '('
  const prop = value.property
  text += prop + ')'
  hot.setDataAtCell(rowIndex, colIndex, text)

  setCell(rowIndex, colIndex, newCellDef)

  hot.render()

  if ((hot as any).hooks) {
    ;(hot as any).hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, endRow, endCol)
  }
}

/**
 * 处理SQL数据集保存事件
 * 参数 name 是数据集的 name，props.name 是数据源的 name
 */
function handleSqlDatasetSave(name: string, oldName: string, sql: string, parameters: any): void {
  const newDatasets = deepCopy(props.datasets || [])

  let dataset = newDatasets.find((d) => d.name === oldName)
  if (dataset) {
    dataset.name = name
    ;(dataset as any).sql = sql
    ;(dataset as any).parameters = parameters
    ;(dataset as any).fields = null
  } else {
    dataset = { name, sql, parameters } as any
    newDatasets.push(dataset)
  }

  emit('update-datasource', {
    name: props.name,
    oldName: props.name,
    datasets: newDatasets
  })
  buildFieldsLocal(dataset)
}
</script>

<style scoped>
.tree{
  a {
    text-decoration: none;
    margin-left: 4px;
    color: #000;
  }
}
</style>
