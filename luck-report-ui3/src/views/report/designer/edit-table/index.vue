<template>
  <div class="ud-page">
    <div class="ud-table" ref="contentTableRef"></div>
    <PrintLine ref="printLineRef" />
  </div>
</template>

<script lang="ts">
/**
 * ContentTable：报表设计器主表格组件
 *
 * 工作流程：
 * 1. mounted 初始化 handsontable 实例 + 注册 hooks + 加载默认模板
 * 2. reportPath 变化 → loadFile 拉取报表定义 → buildReportData 渲染
 * 3. 用户右键 / 编辑 / 拖放 → 经 utils/* 中的工具处理后回写到 cellsMap
 * 4. 调用方通过 getReportData() / saveReport() 读取 / 触发保存
 *
 * 调用方：
 * - src/views/report/designer/index.vue（designer 主页面，通过 ref 调用 expose）
 *
 * 迁移说明：
 * - Options API → vue3 setup + 显式 type 标注
 * - $refs.X → 模板 ref
 * - Context 构造从 `new Context(this)` 改为 `new Context({ reportDef, cellsMap })`
 * - mapActions → useStore 调 dispatch / commit
 * - 全部业务逻辑（handsontable 钩子、撤销重做、拖放、右键菜单）保持原样
 */
import { defineComponent, ref, onMounted, onBeforeUnmount, watch, type Ref } from 'vue'
import Handsontable from 'handsontable'
import type { HandsontableInstance } from '@/types/handsontable'
import Context from '@/types/Context'
import * as utils from '@/utils/table'
import buildMenuConfigure from './utils/ContextMenu'
import { afterRenderer } from './utils/CellRenderer'
import { renderRowHeader } from './utils/HeaderUtils'
import { loadReport } from '@/api/designer'
import { showAlert } from '@/utils/comnon'
import { addRowHeader, getCell, setCell } from '@/utils/contextActions'
import { deepCopy } from '@/utils/comnon'
import TableManager from './manager'
import PrintLine from '@/views/report/designer/print-line/index.vue'
import type { ReportContext, ReportDef, ReportCell } from '@/types/report-def'
import { useReportStore } from '@/store/modules/report'
import '../../../../assets/css/designer/table.css'
import { useI18n } from 'vue-i18n'

/** 单元格坐标 */
interface CellCoords { row: number; col: number }

/** dataset 字段拖放数据 */
interface DragDatasetField {
  type: 'dataset-field'
  datasetName: string
  fieldName: string
}

export default defineComponent({
  name: 'ContentTable',
  components: { PrintLine },
  props: {
    reportPath: {
      type: String,
      default: ''
    }
  },
  emits: ['cell-selected', 'save', 'error'],
  setup(props: { reportPath: string }, { emit, expose }) {
    // Pinia store（替代原 vuex.useStore）
    const reportStore = useReportStore()

    // 模板 ref
    const contentTableRef: Ref<HTMLElement | null> = ref(null)
    const printLineRef: Ref<InstanceType<typeof PrintLine> | null> = ref(null)

    // 状态（替代 data()）
    const hot: Ref<HandsontableInstance | null> = ref(null)
    const reportDef: Ref<ReportDef | null> = ref(null)
    const cellsMap: Map<string, ReportCell> = new Map()
    const context: Ref<ReportContext | null> = ref(null)
    const defaultReportPath = 'classpath:template/template.ureport.xml'

    /**
     * 初始化 handsontable 实例 + 注册钩子
     */
    const initHandsontable = (): void => {
      if (!contentTableRef.value) return
      // 官方 d.ts 的 width/height 仅支持 number；项目原本传 '100%' 让表格铺满父容器
      // 保留原行为：构造时 as Partial<Handsontable.DefaultSettings> 跳过类型校验，运行时仍按字符串生效
      const instance = new Handsontable(contentTableRef.value, {
        startCols: 1,
        startRows: 1,
        fillHandle: { autoInsertRow: false },
        colHeaders: true,
        rowHeaders: true,
        autoColumnSize: false,
        autoRowSize: false,
        manualColumnResize: true,
        manualRowResize: true,
        maxColsNumber: 700,
        outsideClickDeselects: false,
        width: '100%',
        height: '100%'
      } as unknown as Handsontable.DefaultSettings) as unknown as HandsontableInstance
      hot.value = instance
      TableManager.set(instance)

      // afterRenderer / afterChange / afterRowResize / afterColumnResize 都需要接收参数
      // 而官方 d.ts 把 callback 限制为 () => void，通过 any 断言绕过类型校验（与运行时行为一致）
      instance.addHook('afterRenderer', afterRenderer as unknown as () => void)
      bindRowResizeEvent(instance)
      bindColumnResizeEvent(instance)
      bindSelectionEvent(instance)
      bindDropEvent()
    }

    /**
     * 绑定行高调整事件
     * @param instance handsontable 实例
     */
    const bindRowResizeEvent = (instance: HandsontableInstance): void => {
      // 官方 addHook 把 callback 限制为 () => void，运行时实际会传 (currentRow, newSize)
      // 内部函数用 any 接收，避免每处都重复断言
      instance.addHook('afterRowResize', function (this: HandsontableInstance, ...args: unknown[]) {
        const currentRow = args[0] as number
        const newSize = args[1] as number
        const rowHeights = this.getSettings().rowHeights as number[]
        const oldRowHeights = rowHeights.concat([])
        const newRowHeights = rowHeights.concat([])
        newRowHeights.splice(currentRow, 1, newSize)
        this.updateSettings({
          rowHeights: newRowHeights,
          manualRowResize: newRowHeights
        })
        const _this = this
        utils.undoManager.add({
          redo: function () {
            const cur = _this.getSettings().rowHeights as number[]
            oldRowHeights.splice(currentRow, 1, newSize)
            newRowHeights.splice(0, newRowHeights.length, ...cur)
            newRowHeights.splice(currentRow, 1, newSize)
            _this.updateSettings({
              rowHeights: newRowHeights,
              manualRowResize: newRowHeights
            })
            utils.setDirty()
          },
          undo: function () {
            _this.updateSettings({
              rowHeights: oldRowHeights,
              manualRowResize: oldRowHeights
            })
            utils.setDirty()
          }
        })
        utils.setDirty()
      })
    }

    /**
     * 绑定列宽调整事件
     * @param instance handsontable 实例
     */
    const bindColumnResizeEvent = (instance: HandsontableInstance): void => {
      // 官方 addHook 把 callback 限制为 () => void，运行时实际会传 (currentColumn, newSize)
      instance.addHook('afterColumnResize', function (this: HandsontableInstance, ...args: unknown[]) {
        const currentColumn = args[0] as number
        const newSize = args[1] as number
        const colWidths = this.getSettings().colWidths as number[]
        const newColWidths = colWidths.concat([])
        const oldColWidths = colWidths.concat([])
        newColWidths.splice(currentColumn, 1, newSize)
        this.updateSettings({
          colWidths: newColWidths,
          manualColumnResize: newColWidths
        })
        const _this = this
        utils.undoManager.add({
          redo: function () {
            const cur = _this.getSettings().colWidths as number[]
            newColWidths.splice(0, newColWidths.length, ...cur)
            oldColWidths.splice(0, oldColWidths.length, ...cur)
            newColWidths.splice(currentColumn, 1, newSize)
            _this.updateSettings({
              colWidths: newColWidths,
              manualColumnResize: newColWidths
            })
            utils.setDirty()
          },
          undo: function () {
            _this.updateSettings({
              colWidths: oldColWidths,
              manualColumnResize: oldColWidths
            })
            utils.setDirty()
          }
        })
        utils.setDirty()
      })
    }

    /**
     * 绑定选中结束事件：转发到 cell-selected emit
     * @param instance handsontable 实例
     */
    const bindSelectionEvent = (instance: HandsontableInstance): void => {
      Handsontable.hooks.add('afterSelectionEnd', function (
        this: HandsontableInstance,
        rowIndex: number,
        colIndex: number,
        row2Index: number,
        col2Index: number
      ) {
        handleCellSelected(rowIndex, colIndex, row2Index, col2Index)
        return undefined
      }, instance)
    }

    /**
     * 绑定拖放事件（数据集字段 → 单元格）
     */
    const bindDropEvent = (): void => {
      const tableElement = contentTableRef.value
      if (!tableElement) return
      tableElement.addEventListener('dragover', handleDragOver)
      tableElement.addEventListener('drop', handleDrop)
    }

    /**
     * 处理拖拽经过事件
     * @param event 拖拽事件
     */
    const handleDragOver = (event: DragEvent): void => {
      event.preventDefault()
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    }

    /**
     * 处理拖放事件：将数据集字段设置到目标单元格
     * @param event 拖放事件
     */
    const handleDrop = (event: DragEvent): void => {
      event.preventDefault()
      const jsonData = event.dataTransfer?.getData('application/json')
      if (!jsonData) return
      let dragData: DragDatasetField
      try {
        dragData = JSON.parse(jsonData)
      } catch {
        return
      }
      if (dragData.type !== 'dataset-field') return
      const targetCell = getCellFromPoint(event.clientX, event.clientY)
      if (!targetCell) return
      applyDatasetFieldToCell(targetCell.row, targetCell.col, dragData.datasetName, dragData.fieldName)
    }

    /**
     * 根据鼠标坐标获取单元格位置
     * @param clientX 鼠标 X
     * @param clientY 鼠标 Y
     * @returns 单元格坐标或 null
     */
    const getCellFromPoint = (clientX: number, clientY: number): CellCoords | null => {
      const element = document.elementFromPoint(clientX, clientY)
      if (!element) return null
      const td = element.closest('td')
      if (!td) return null
      let cellCoords: CellCoords | null = null
      if (hot.value && hot.value.getCoords) {
        // 官方 d.ts 把 getCoords 返回值类型声明为 {}，运行时实际是 { row, col } | null
        // 两步走：先转 unknown 再转目标类型
        cellCoords = hot.value.getCoords(td as HTMLElement) as unknown as CellCoords | null
      } else if (hot.value && hot.value.view && hot.value.view.wt && hot.value.view.wt.wtTable) {
        cellCoords = hot.value.view.wt.wtTable.getCoords(td as HTMLElement)
      }
      if (!cellCoords || cellCoords.row < 0 || cellCoords.col < 0) return null
      return { row: cellCoords.row, col: cellCoords.col }
    }

    /**
     * 将数据集字段应用到单元格
     * @param rowIndex 行索引
     * @param colIndex 列索引
     * @param datasetName 数据集名称
     * @param fieldName 字段名称
     */
    const applyDatasetFieldToCell = (
      rowIndex: number,
      colIndex: number,
      datasetName: string,
      fieldName: string
    ): void => {
      // ReportCell 自带 [key: string]: any 索引签名，可承载 expand/value 等所有动态字段
      const cellDef = getCell(rowIndex, colIndex) as ReportCell | null
      if (!cellDef) return
      const oldCellDef = deepCopy(cellDef) as ReportCell
      let newCellDef: ReportCell
      if (cellDef.value?.type !== 'dataset') {
        newCellDef = {
          rowNumber: cellDef.rowNumber,
          columnNumber: cellDef.columnNumber,
          cellStyle: cellDef.cellStyle,
          expand: 'Down',
          value: { type: 'dataset', conditions: [] }
        }
      } else {
        newCellDef = deepCopy(cellDef) as ReportCell
      }
      newCellDef.expand = 'Down'
      const value = newCellDef.value as { type: string; aggregate?: string; datasetName?: string; property?: string; order?: string; conditions?: unknown[] }
      value.aggregate = 'group'
      value.datasetName = datasetName
      value.property = fieldName
      value.order = 'none'
      let text = value.datasetName + '.' + value.aggregate + '('
      text += value.property + ')'
      setCell(rowIndex, colIndex, newCellDef)
      if (hot.value) {
        hot.value.setDataAtCell(rowIndex, colIndex, text)
        if (window.setDirty) window.setDirty()
        hot.value.render()
        if (window.Handsontable && window.Handsontable.hooks) {
          window.Handsontable.hooks.run(hot.value, 'afterSelectionEnd', rowIndex, colIndex, rowIndex, colIndex)
        }
      }
      if (window.undoManager) {
        window.undoManager.add({
          redo: () => {
            const currentCellDef = getCell(rowIndex, colIndex) as ReportCell | null
            if (!currentCellDef) return
            let redoCellDef: ReportCell
            if (currentCellDef.value?.type !== 'dataset') {
              redoCellDef = {
                rowNumber: currentCellDef.rowNumber,
                columnNumber: currentCellDef.columnNumber,
                cellStyle: currentCellDef.cellStyle,
                expand: 'Down',
                value: { type: 'dataset', conditions: [] }
              }
            } else {
              redoCellDef = deepCopy(currentCellDef) as ReportCell
            }
            redoCellDef.expand = 'Down'
            const redoValue = redoCellDef.value as { type: string; aggregate?: string; datasetName?: string; property?: string; order?: string; conditions?: unknown[] }
            redoValue.aggregate = 'group'
            redoValue.datasetName = datasetName
            redoValue.property = fieldName
            redoValue.order = 'none'
            let redoText = redoValue.datasetName + '.' + redoValue.aggregate + '('
            redoText += redoValue.property + ')'
            setCell(rowIndex, colIndex, redoCellDef)
            if (hot.value) {
              hot.value.setDataAtCell(rowIndex, colIndex, redoText)
              if (window.setDirty) window.setDirty()
              hot.value.render()
              if (window.Handsontable && window.Handsontable.hooks) {
                window.Handsontable.hooks.run(hot.value, 'afterSelectionEnd', rowIndex, colIndex, rowIndex, colIndex)
              }
            }
          },
          undo: () => {
            setCell(rowIndex, colIndex, oldCellDef)
            const oldValue = oldCellDef.value as { value?: string; type: string; datasetName?: string; aggregate?: string; property?: string }
            let text2 = oldValue.value || ''
            if (oldValue.type === 'dataset') {
              text2 = oldValue.datasetName + '.' + oldValue.aggregate + '('
              text2 += oldValue.property + ')'
            }
            if (hot.value) {
              hot.value.setDataAtCell(rowIndex, colIndex, text2)
              if (window.setDirty) window.setDirty()
              hot.value.render()
              if (window.Handsontable && window.Handsontable.hooks) {
                window.Handsontable.hooks.run(hot.value, 'afterSelectionEnd', rowIndex, colIndex, rowIndex, colIndex)
              }
            }
          }
        })
      }
    }

    /**
     * 单元格选中事件：emit 到父级
     */
    const handleCellSelected = (rowIndex: number, colIndex: number, row2Index: number, col2Index: number): void => {
      emit('cell-selected', { rowIndex, colIndex, row2Index, col2Index })
    }

    /**
     * 报表加载完成：构造 Context + 提交 Vuex + 渲染行头
     */
    const handleReportLoaded = (): void => {
      if (!reportDef.value) return
      context.value = new Context({ reportDef: reportDef.value, cellsMap })
      reportStore.setContext(context.value)
      reportStore.setIsPrintLineRefresh(true)
      processRowHeaders()
    }

    /**
     * 处理报表行头：把 band 类型添加到 Context + 重绘
     */
    const processRowHeaders = (): void => {
      if (reportDef.value && reportDef.value.rows && hot.value) {
        const rows = reportDef.value.rows as Array<{ rowNumber: number; band: string }>
        for (const row of rows) {
          if (!row.band) continue
          addRowHeader(row.rowNumber - 1, row.band)
        }
        renderRowHeader(hot.value)
      }
    }

    /**
     * 加载报表文件
     * @param filePath 报表路径
     */
    const loadFile = async (filePath: string): Promise<void> => {
      try {
        const formData = new FormData()
        formData.append('filePath', filePath)
        const def = await loadReport(formData)
        reportDef.value = def
        buildReportData(def)
        buildMenu()
        handleReportLoaded()

        if (filePath !== defaultReportPath) {
          reportStore.setFileName(filePath)
        } else {
          const t = (window as { $t?: (k: string) => string }).$t
          reportStore.setFileName(`${t ? t('table.report.tip') : 'Tip'}`)
        }
        const masterElement = document.querySelector('.ht_master') as HTMLElement | null
        if (masterElement) {
          const paper = (def as { paper?: { bgImage?: string } }).paper
          if (paper && paper.bgImage) {
            masterElement.style.background = `url(${paper.bgImage}) 50px 26px no-repeat`
          } else {
            masterElement.style.background = 'transparent'
          }
        }
      } catch (error) {
        emit('error', error)
        const err = error as { msg?: string }
        const t = (window as { $t?: (k: string) => string }).$t
        if (err.msg) {
          showAlert((t ? t('dialog.save.serverError') : 'Server error:') + (t ? t('colon') : ':') + err.msg, { useHTMLString: true })
        } else {
          showAlert((t ? t('table.report.load') : 'Load ') + `${filePath}` + (t ? t('table.report.fail') : ' failed'))
        }
      }
    }

    /**
     * 用报表定义构建 handsontable 数据 + 合并单元格 + cells 钩子
     * @param data 报表核心定义
     */
    const buildReportData = (data: ReportDef): void => {
      cellsMap.clear()
      const rows = (data.rows || []) as Array<{ rowNumber: number; height: number }>
      const rowHeights: number[] = []
      for (const row of rows) {
        rowHeights.push(utils.pointToPixel(row.height))
      }
      const columns = (data.columns || []) as Array<{ columnNumber: number; width: number }>
      const colWidths: number[] = []
      for (const col of columns) {
        colWidths.push(utils.pointToPixel(col.width))
      }
      const cellsMapData = (data as { cellsMap?: Record<string, ReportCell & { value: { value?: string }; rowSpan?: number; colSpan?: number }> }).cellsMap || {}
      const dataArray: unknown[][] = []
      const mergeCells: Array<{ rowspan: number; colspan: number; row: number; col: number }> = []
      for (const row of rows) {
        const rowData: unknown[] = []
        for (const col of columns) {
          const key = row.rowNumber + ',' + col.columnNumber
          const cell = cellsMapData[key]
          if (cell) {
            cellsMap.set(key, cell)
            const cv = (cell.value as { value?: string }).value || ''
            rowData.push(cv)
            let rowspan = cell.rowSpan || 0
            let colspan = cell.colSpan || 0
            if (rowspan > 0 || colspan > 0) {
              if (rowspan === 0) rowspan = 1
              if (colspan === 0) colspan = 1
              mergeCells.push({ rowspan, colspan, row: row.rowNumber - 1, col: col.columnNumber - 1 })
            }
          } else {
            rowData.push('')
          }
        }
        dataArray.push(rowData)
      }
      if (hot.value) {
        hot.value.loadData(dataArray)
        hot.value.updateSettings({
          colWidths,
          rowHeights,
          mergeCells,
          cells: ((row: number, col: number) => {
            const cellProperties: { readOnly: boolean } = { readOnly: true }
            const cellDef = getCell(row, col) as { value: { type: string } } | null
            if (cellDef && cellDef.value && cellDef.value.type === 'simple') {
              cellProperties.readOnly = false
            }
            return cellProperties as unknown as Handsontable.GridSettings
          }) as never
        })
        bindAfterChangeEvent()
      }
    }

    /**
     * 绑定单元格编辑完成事件
     */
    const bindAfterChangeEvent = (): void => {
      if (!hot.value) return
      // 官方 addHook 把 callback 限制为 () => void，运行时实际会传 (changes, source)
      hot.value.addHook('afterChange', function (...args: unknown[]) {
        const changes = args[0] as Array<[number, number, string | null, string | null]> | null
        const source = args[1] as string
        if (source === 'edit' && changes) {
          changes.forEach(([row, col, , newValue]) => {
            const cellDef = getCell(row, col) as { value: { type: string; value?: string } } | null
            if (cellDef && cellDef.value && cellDef.value.type === 'simple') {
              // cellDef 是从 getCell 拿到的 ReportCell，rowNumber/columnNumber 一定存在
              const newCellDef = deepCopy(cellDef) as unknown as ReportCell
              const newValueObj = newCellDef.value as { type: string; value?: string }
              newValueObj.value = newValue || ''
              setCell(row, col, newCellDef)
              utils.setDirty()
            }
          })
        }
      })
    }

    /**
     * 构建右键菜单
     */
    const buildMenu = (): void => {
      if (hot.value) {
        hot.value.updateSettings({ contextMenu: buildMenuConfigure() })
      }
    }

    /**
     * 获取当前报表 XML 字符串
     * @returns 序列化后的报表 XML
     */
    const getReportData = (): string => {
      return utils.tableToXml(context.value)
    }

    /**
     * 触发保存：emit 'save' 事件，由父组件处理
     */
    const saveReport = (): void => {
      emit('save', { data: getReportData() })
    }

    /**
     * 初始化（mounted 时执行）
     */
    const initTable = (): void => {
      utils.undoManager.setLimit(100)
      initHandsontable()
      let filePath = utils.getParameter('reportPath')
      if (!filePath || filePath === '') {
        filePath = defaultReportPath
      }
      if (filePath && filePath !== defaultReportPath) {
        reportStore.setIsSaved(true)
      }
      loadFile(filePath)
    }

    // 监听 reportPath 变化，重新加载
    watch(() => props.reportPath, (val) => {
      if (val) {
        loadFile(val)
      }
    })

    onMounted(() => {
      initTable()
    })

    onBeforeUnmount(() => {
      const tableElement = contentTableRef.value
      if (tableElement) {
        tableElement.removeEventListener('dragover', handleDragOver)
        tableElement.removeEventListener('drop', handleDrop)
      }
      if (hot.value) {
        hot.value.destroy()
        TableManager.clear()
      }
    })

    // 暴露给父组件的实例方法
    expose({
      getReportData,
      saveReport
    })

    return {
      contentTableRef,
      printLineRef
    }
  }
})
</script>

<style scoped>
.ud-page {
  position: relative;
  display: flex;
  flex: 1;
  overflow: hidden;
  background: white;
}
.ud-slider {
  height: 200px;
  width: 50px;
}
.ud-table {
  width: 100%;
  min-height: 500px;
}
</style>
