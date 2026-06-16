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
          <i class="iconfont icon-database"></i>
          <a href="javascript:void(0)" class="ds_name">{{ datasource.name }}</a>
        </span>

        <!-- 数据集列表 -->
        <ul
          v-show="datasourceExpanded"
          class="node-list"
        >
          <li
            v-for="(dataset, index) in dsDatasets"
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

    <!-- SQL数据集对话框 -->
    <SqlDatasetDialog
      :visible="sqlDatasetDialogVisible"
      :datasourceData="currentDatasourceData"
      :datasetData="currentDatasetData"
      @save="handleSqlDatasetSave"
      @close="sqlDatasetDialogVisible = false"
    />

    <!-- 数据源对话框 -->
    <DatasourceDialog
      :visible="datasourceDialogVisible"
      :datasources="datasources"
      :datasource="currentDatasource"
      @close="datasourceDialogVisible = false"
      @save="handleDatasourceSave"
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
 * DatabaseTree JDBC 数据库树（vue3 + TS + ant-design-vue）
 *
 * 迁移说明：
 * - Options API → vue3 <script setup>
 * - 自定义 UL/LI 树保持原样（与原 vue2 版本一致），未改用 a-tree
 * - mapGetters('report', ['getContext']) → useReportStore
 * - this.$emit → defineEmits
 * - this.$set / $delete → reactive 直接赋值 / delete
 * - $refs.contextMenu.show() → contextMenuRef.value.show()
 * - 数据源编辑/新建使用 DatasourceDialog（vue3 版本，payload 字段为 name/username/password/driver/url/type/oldName）
 */
import { ref, reactive, computed, nextTick } from 'vue'
import { v1 as uuidv1 } from 'uuid'
import { showAlert, showConfirm, deepCopy } from '@/utils/comnon'
import SqlDatasetDialog from '@/views/report/designer/resource-panel/datasource-panel/sql-dataset-dialog/index.vue'
import DatasourceDialog from '@/views/report/designer/resource-panel/datasource-panel/datasource-dialog/index.vue'
import FieldNameDialog from '../field-name-dialog/index.vue'
import ContextMenu from '../context-menu/index.vue'
import { buildJdbcFields } from '@/api/designer'
import { getCell, setCell } from '@/utils/contextActions'
import TableManager from '@/views/report/designer/edit-table/manager'
import { useReportStore } from '@/store/modules/report'
import type { ReportDatasource, ReportDataset, ReportDatasetField, ReportContext } from '@/types/report-def'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'DatabaseTree' })


const { t } = useI18n()
interface ContextMenuItem {
  key: string
  name: string
  icon: string
}

const props = withDefaults(
  defineProps<{
    datasource: ReportDatasource
    datasources: ReportDatasource[]
  }>(),
  { datasources: () => [] }
)

const emit = defineEmits<{
  (e: 'remove', name: string): void
  (e: 'update-datasource', payload: Record<string, unknown>): void
}>()

const report = useReportStore()
const context = report.getContext as ReportContext | null

const TYPE_JDBC = 'jdbc'
const type = TYPE_JDBC
const id = uuidv1()
const datasourceExpanded = ref<boolean>(true)
const datasetExpanded = reactive<Record<number, boolean>>({})
const currentDataset = ref<ReportDataset | null>(null)
const datasourceDialogVisible = ref<boolean>(false)
const currentDatasource = ref<Record<string, unknown> | null>(null)
const fieldNameDialogVisible = ref<boolean>(false)
const sqlDatasetDialogVisible = ref<boolean>(false)
const currentDatasourceData = ref<Record<string, unknown> | null>(null)
const currentDatasetData = ref<ReportDataset | null>(null)

const contextMenuRef = ref()

const dsDatasets = computed<ReportDataset[]>(() => props.datasource.datasets || [])

/**
 * JDBC 数据源：把 datasets 变更 emit 给父组件
 * 自动携带数据源元信息（连接参数），避免多处重复
 */
function emitJdbcUpdate(datasets: ReportDataset[]): void {
  emit('update-datasource', {
    name: props.datasource.name,
    oldName: props.datasource.name,
    username: (props.datasource as any).username,
    password: (props.datasource as any).password,
    driver: (props.datasource as any).driver,
    url: (props.datasource as any).url,
    type,
    datasets
  })
}

/**
 * 切换数据源展开/折叠
 */
function toggleDatasource(): void {
  datasourceExpanded.value = !datasourceExpanded.value
}

/**
 * 切换数据集展开/折叠
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
    { key: 'edit', name: t('tree.edit'), icon: 'edit' },
    { key: 'delete', name: t('tree.del'), icon: 'delete' }
  ]

  if (contextMenuRef.value) {
    contextMenuRef.value.show(event, items, (key: string) => {
      if (key === 'add') {
        addDatasetAction()
      } else if (key === 'edit') {
        editDatasourceAction()
      } else if (key === 'delete') {
        deleteDatasourceAction()
      }
    })
  } else {
    console.error('contextMenu ref not found')
  }
}

/**
 * 显示数据集右键菜单
 */
function showDatasetContextMenu(event: MouseEvent, dataset: ReportDataset, index: number): void {
  const items: ContextMenuItem[] = [
    { key: 'add', name: t('tree.addField'), icon: 'add' },
    { key: 'edit', name: t('tree.edit'), icon: 'edit' },
    { key: 'delete', name: t('tree.del'), icon: 'delete' },
    { key: 'refresh', name: t('tree.refresh'), icon: 'loading' }
  ]

  if (contextMenuRef.value) {
    contextMenuRef.value.show(event, items, (key: string) => {
      if (key === 'add') {
        addFieldAction(dataset)
      } else if (key === 'edit') {
        editDatasetAction(dataset, index)
      } else if (key === 'delete') {
        deleteDatasetAction(dataset, index)
      } else if (key === 'refresh') {
        refreshDatasetAction(dataset, index)
      }
    })
  } else {
    console.error('contextMenu ref not found')
  }
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
      if (key === 'delete') {
        deleteFieldAction(dataset, field, fieldIndex)
      }
    })
  }
}

/**
 * 编辑数据源操作
 */
function editDatasourceAction(): void {
  currentDatasource.value = {
    name: props.datasource.name,
    username: (props.datasource as any).username,
    password: (props.datasource as any).password,
    driver: (props.datasource as any).driver,
    url: (props.datasource as any).url,
    type
  }
  datasourceDialogVisible.value = true
}

/**
 * 处理数据源保存事件
 */
function handleDatasourceSave(datasourceData: any): void {
  emit('update-datasource', datasourceData)
}

/**
 * 删除数据源操作
 */
function deleteDatasourceAction(): void {
  showConfirm(t('tree.delConfirm') + `[${props.datasource.name}]？`).then(() => {
    emit('remove', props.datasource.name)
  })
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
    const newDatasets = deepCopy(dsDatasets.value)
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

    targetDataset.fields.push({ name: fieldName } as ReportDatasetField)
    emitJdbcUpdate(newDatasets)
  }
}

/**
 * 添加数据集操作
 */
function addDatasetAction(): void {
  currentDatasourceData.value = {
    name: props.datasource.name,
    username: (props.datasource as any).username,
    password: (props.datasource as any).password,
    driver: (props.datasource as any).driver,
    url: (props.datasource as any).url,
    type,
    datasources: props.datasources
  }
  currentDatasetData.value = { parameters: [] } as any
  sqlDatasetDialogVisible.value = true
}

/**
 * 编辑数据集操作
 */
function editDatasetAction(dataset: ReportDataset, _index: number): void {
  currentDatasourceData.value = {
    name: props.datasource.name,
    username: (props.datasource as any).username,
    password: (props.datasource as any).password,
    driver: (props.datasource as any).driver,
    url: (props.datasource as any).url,
    type,
    datasources: props.datasources
  }
  currentDatasetData.value = dataset
  sqlDatasetDialogVisible.value = true
}

/**
 * 删除数据集操作
 */
function deleteDatasetAction(dataset: ReportDataset, index: number): void {
  showConfirm(t('tree.delDatasetConfirm') + `[${dataset.name}]?`).then(() => {
    const newDatasets = deepCopy(dsDatasets.value)
    newDatasets.splice(index, 1)
    delete datasetExpanded[index]
    emit('update-datasource', {
      name: props.datasource.name,
      oldName: props.datasource.name,
      username: (props.datasource as any).username,
      password: (props.datasource as any).password,
      driver: (props.datasource as any).driver,
      url: (props.datasource as any).url,
      type,
      datasets: newDatasets
    })
  })
}

/**
 * 刷新数据集操作
 */
function refreshDatasetAction(dataset: ReportDataset, index: number): void {
  const newDatasets = deepCopy(dsDatasets.value)
  const targetDataset = newDatasets.find((item) => item.name === dataset.name)
  if (targetDataset) {
    (targetDataset as any).fields = null
    emit('update-datasource', {
      name: props.datasource.name,
      oldName: props.datasource.name,
      username: (props.datasource as any).username,
      password: (props.datasource as any).password,
      driver: (props.datasource as any).driver,
      url: (props.datasource as any).url,
      type,
      datasets: newDatasets
    })
    nextTick(() => {
      buildFieldsLocal(targetDataset, index)
    })
  }
}

/**
 * 删除字段操作
 */
function deleteFieldAction(dataset: ReportDataset, field: ReportDatasetField, fieldIndex: number): void {
  showConfirm(t('tree.delFieldConfirm') + `[${field.name}]?`).then(() => {
    const newDatasets = deepCopy(dsDatasets.value)
    const targetDataset = newDatasets.find((item) => item.name === dataset.name)
    if (targetDataset && targetDataset.fields) {
      targetDataset.fields.splice(fieldIndex, 1)
      emitJdbcUpdate(newDatasets)
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
    parameters: JSON.stringify((dataset as any).parameters || []),
    username: (props.datasource as any).username,
    password: (props.datasource as any).password,
    driver: (props.datasource as any).driver,
    url: (props.datasource as any).url,
    type: 'jdbc'
  }

  try {
    const fields = await buildJdbcFields(parameters)
    const newDatasets = deepCopy(dsDatasets.value)
    const targetDataset = newDatasets.find((item) => item.name === dataset.name)
    if (targetDataset) {
      targetDataset.fields = fields
      emit('update-datasource', {
        name: props.datasource.name,
        oldName: props.datasource.name,
        username: (props.datasource as any).username,
        password: (props.datasource as any).password,
        driver: (props.datasource as any).driver,
        url: (props.datasource as any).url,
        type,
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
 * 构建点击事件
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
  const cellDef = getCell(rowIndex, colIndex)
  if (!cellDef) {
    showAlert(t('tree.cellTip'))
    return
  }
  const oldCellDef = deepCopy(cellDef)

  let newCellDef
  if (cellDef.value.type !== 'dataset') {
    newCellDef = {
      value: { type: 'dataset', conditions: [] },
      rowNumber: cellDef.rowNumber,
      columnNumber: cellDef.columnNumber,
      cellStyle: cellDef.cellStyle
    }
  } else {
    newCellDef = deepCopy(cellDef)
  }

  newCellDef.expand = 'Down'
  const value = newCellDef.value
  value.aggregate = 'group'
  value.datasetName = dataset.name
  value.property = field.name
  value.order = 'none'

  let text = value.datasetName + '.' + value.aggregate + '('
  const prop = value.property
  text += prop + ')'

  setCell(rowIndex, colIndex, newCellDef)
  hot.setDataAtCell(rowIndex, colIndex, text)

  if (window.setDirty) {
    ;(window as any).setDirty()
  }

  hot.render()

  if (window.Handsontable && (window as any).Handsontable.hooks) {
    ;(window as any).Handsontable.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, endRow, endCol)
  }

  if ((window as any).undoManager) {
    ;(window as any).undoManager.add({
      redo: () => {
        const currentCellDef = getCell(rowIndex, colIndex)
        if (!currentCellDef) return
        let redoCellDef
        if (currentCellDef.value.type !== 'dataset') {
          redoCellDef = {
            value: { type: 'dataset', conditions: [] },
            rowNumber: currentCellDef.rowNumber,
            columnNumber: currentCellDef.columnNumber,
            cellStyle: currentCellDef.cellStyle
          }
        } else {
          redoCellDef = deepCopy(currentCellDef)
        }
        redoCellDef.expand = 'Down'
        const redoValue = redoCellDef.value
        redoValue.aggregate = 'group'
        redoValue.datasetName = dataset.name
        redoValue.property = field.name
        redoValue.order = 'none'

        let redoText = redoValue.datasetName + '.' + redoValue.aggregate + '('
        redoText += redoValue.property + ')'
        setCell(rowIndex, colIndex, redoCellDef)
        hot.setDataAtCell(rowIndex, colIndex, redoText)
        if ((window as any).setDirty) (window as any).setDirty()
        hot.render()
        if (window.Handsontable && (window as any).Handsontable.hooks) {
          ;(window as any).Handsontable.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, endRow, endCol)
        }
      },
      undo: () => {
        setCell(rowIndex, colIndex, oldCellDef)
        const value = oldCellDef.value
        let text = value.value || ''
        if (value.type === 'dataset') {
          text = value.datasetName + '.' + value.aggregate + '('
          text += value.property + ')'
        }
        hot.setDataAtCell(rowIndex, colIndex, text)
        if ((window as any).setDirty) (window as any).setDirty()
        hot.render()
        if (window.Handsontable && (window as any).Handsontable.hooks) {
          ;(window as any).Handsontable.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, endRow, endCol)
        }
      }
    })
  }
}

/**
 * 处理SQL数据集保存事件
 * 参数 name 是数据集的 name，props.datasource.name 是数据源的 name
 */
function handleSqlDatasetSave(name: string, oldName: string, sql: string, parameters: any): void {
  const newDatasets = deepCopy(dsDatasets.value)

  let dataset = newDatasets.find((item) => item.name === oldName)
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
    name: props.datasource.name,
    oldName: props.datasource.name,
    username: (props.datasource as any).username,
    password: (props.datasource as any).password,
    driver: (props.datasource as any).driver,
    url: (props.datasource as any).url,
    type,
    datasets: newDatasets
  })
  nextTick(() => {
    buildFieldsLocal(dataset as any)
  })
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
