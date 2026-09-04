<template>
  <div class="ud-page">
<!--    <div class="ud-slider"></div>-->
    <div class="ud-table" ref="contentTable"></div>
    <!-- 打印线 -->
    <PrintLine ref="printLine" />
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import Handsontable from 'handsontable';
import Context from '@/components/Context.js';
import * as utils from '@/utils/table.js';
import buildMenuConfigure from './utils/ContextMenu.js';
import { afterRenderer } from './utils/CellRenderer.js';
import { renderRowHeader } from './utils/HeaderUtils.js';
import { loadReport } from '@/api/designer';
import { showAlert } from '@/utils/comnon.js';
import { addRowHeader, getCell, setCell } from "@/utils/contextActions";
import { deepCopy } from '@/components/utils/index.js';
import TableManager from './manager.js';
import { getLibMode } from '@/lib/navigator';
import PrintLine from "@/views/report/designer/print-line/index.vue";
import '../../../../assets/css/designer/table.css';

export default {
  name: 'ContentTable',
  components: {PrintLine},
  props: {
    reportPath: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      hot: null,
      reportDef: null,
      cellsMap: new Map(),
      context: null,
      localReportPath: this.reportPath,
      defaultReportPath: 'classpath:template/template.ureport.xml'
    };
  },
  computed: {
    isLibMode() {
      return getLibMode();
    }
  },
  watch: {
    reportPath(val) {
      this.localReportPath = val;
      if (val) {
        this.loadFile(val);
      }
    }
  },
  mounted() {
    this.initTable();
  },
  beforeUnmount() {
    const tableElement = this.$refs.contentTable;
    if (tableElement) {
      tableElement.removeEventListener('dragover', this.handleDragOver);
      tableElement.removeEventListener('drop', this.handleDrop);
    }
    if (this.hot) {
      this.hot.destroy();
    }
  },
  methods: {
    ...mapActions('report', [
      'setContext',
      'setIsPrintLineRefresh'
    ]),
    initTable() {
      utils.undoManager.setLimit(100);

      this.initHandsontable();

      let filePath = '';
      if (this.isLibMode) {
        filePath = this.localReportPath || this.defaultReportPath;
      } else {
        filePath = utils.getParameter("reportPath");
        if (!filePath || filePath === '') {
          filePath = this.defaultReportPath;
        }
      }

      if (filePath && filePath !== this.defaultReportPath) {
        this.$store.dispatch('report/setIsSaved', true);
      }

      this.loadFile(filePath);
    },

    initHandsontable() {
      this.hot = new Handsontable(this.$refs.contentTable, {
        startCols: 1,
        startRows: 1,
        fillHandle: {
          autoInsertRow: false
        },
        colHeaders: true,
        rowHeaders: true,
        autoColumnSize: false,
        autoRowSize: false,
        manualColumnResize: true,
        manualRowResize: true,
        maxColsNumber: 700,
        outsideClickDeselects: false,
        width: '100%',
        height: '100%',
      });

      TableManager.set(this.hot);

      this.hot.addHook("afterRenderer", afterRenderer);
      this.bindRowResizeEvent();
      this.bindColumnResizeEvent();
      this.bindSelectionEvent();
      this.bindDropEvent();
    },

    bindRowResizeEvent() {
      this.hot.addHook('afterRowResize', function(currentRow, newSize) {
        let rowHeights = this.getSettings().rowHeights;
        let oldRowHeights = rowHeights.concat([]);
        let newRowHeights = rowHeights.concat([]);
        newRowHeights.splice(currentRow, 1, newSize);
        this.updateSettings({
          rowHeights: newRowHeights,
          manualRowResize: newRowHeights
        });
        const _this = this;
        utils.undoManager.add({
          redo: function() {
            rowHeights = _this.getSettings().rowHeights;
            oldRowHeights = rowHeights.concat([]);
            newRowHeights.splice(currentRow, 1, newSize);
            _this.updateSettings({
              rowHeights: newRowHeights,
              manualRowResize: newRowHeights
            });
            utils.setDirty();
          },
          undo: function() {
            _this.updateSettings({
              rowHeights: oldRowHeights,
              manualRowResize: oldRowHeights
            });
            utils.setDirty();
          }
        });
        utils.setDirty();
      });
    },

    bindColumnResizeEvent() {
      this.hot.addHook('afterColumnResize', function(currentColumn, newSize) {
        let colWidths = this.getSettings().colWidths;
        let newColWidths = colWidths.concat([]);
        let oldColWidths = colWidths.concat([]);
        newColWidths.splice(currentColumn, 1, newSize);
        this.updateSettings({
          colWidths: newColWidths,
          manualColumnResize: newColWidths
        });
        const _this = this;
        utils.undoManager.add({
          redo: function() {
            colWidths = _this.getSettings().colWidths;
            newColWidths = colWidths.concat([]);
            oldColWidths = colWidths.concat([]);
            newColWidths.splice(currentColumn, 1, newSize);
            _this.updateSettings({
              colWidths: newColWidths,
              manualColumnResize: newColWidths
            });
            utils.setDirty();
          },
          undo: function() {
            _this.updateSettings({
              colWidths: oldColWidths,
              manualColumnResize: oldColWidths
            });
            utils.setDirty();
          }
        });
        utils.setDirty();
      });
    },

    bindSelectionEvent() {
      const _this = this;
      Handsontable.hooks.add("afterSelectionEnd", function(rowIndex, colIndex, row2Index, col2Index) {
        _this.handleCellSelected(rowIndex, colIndex, row2Index, col2Index);
      }, this.hot);
    },

    /**
     * 绑定拖放事件
     * 处理从数据集树拖拽字段到表格单元格的操作
     */
    bindDropEvent() {
      const tableElement = this.$refs.contentTable;
      tableElement.addEventListener('dragover', this.handleDragOver);
      tableElement.addEventListener('drop', this.handleDrop);
    },

    /**
     * 处理拖拽经过事件
     * @param {DragEvent} event - 拖拽事件对象
     */
    handleDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';

      const targetCell = this.getCellFromPoint(event.clientX, event.clientY);
      if (!targetCell) {
        return;
      }

      const { row, col } = targetCell;
      const selections = this.hot.getSelected();
      const currentSelection = selections && selections[selections.length - 1];
      const isTargetSelected = currentSelection &&
        currentSelection[0] === row && currentSelection[1] === col &&
        currentSelection[2] === row && currentSelection[3] === col;

      if (!isTargetSelected) {
        this.hot.selectCell(row, col);
      }
    },

    /**
     * 处理拖放事件
     * 将数据集字段拖放到单元格时设置单元格类型
     * @param {DragEvent} event - 拖拽事件对象
     */
    handleDrop(event) {
      event.preventDefault();
      const jsonData = event.dataTransfer.getData('application/json');
      if (!jsonData) {
        return;
      }
      let dragData;
      try {
        dragData = JSON.parse(jsonData);
      } catch (e) {
        return;
      }
      if (dragData.type !== 'dataset-field') {
        return;
      }
      const targetCell = this.getCellFromPoint(event.clientX, event.clientY);
      if (!targetCell) {
        return;
      }
      const { row, col } = targetCell;
      this.applyDatasetFieldToCell(row, col, dragData.datasetName, dragData.fieldName);
    },

    /**
     * 根据鼠标坐标获取单元格位置
     * @param {number} clientX - 鼠标 X 坐标
     * @param {number} clientY - 鼠标 Y 坐标
     * @returns {Object|null} 包含 row 和 col 的对象，或 null
     */
    getCellFromPoint(clientX, clientY) {
      const element = document.elementFromPoint(clientX, clientY);
      if (!element) {
        return null;
      }
      const td = element.closest('td');
      if (!td) {
        return null;
      }
      let cellCoords = null;
      if (this.hot.getCoords) {
        cellCoords = this.hot.getCoords(td);
      } else if (this.hot.view && this.hot.view.wt && this.hot.view.wt.wtTable) {
        cellCoords = this.hot.view.wt.wtTable.getCoords(td);
      }
      if (!cellCoords || cellCoords.row < 0 || cellCoords.col < 0) {
        return null;
      }
      return { row: cellCoords.row, col: cellCoords.col };
    },

    /**
     * 将数据集字段应用到单元格
     * @param {number} rowIndex - 行索引
     * @param {number} colIndex - 列索引
     * @param {string} datasetName - 数据集名称
     * @param {string} fieldName - 字段名称
     */
    applyDatasetFieldToCell(rowIndex, colIndex, datasetName, fieldName) {
      const cellDef = getCell(rowIndex, colIndex);
      if (!cellDef) {
        return;
      }
      const oldCellDef = deepCopy(cellDef);
      let newCellDef;
      if (cellDef.value.type !== 'dataset') {
        newCellDef = {
          value: { type: 'dataset', conditions: [] },
          rowNumber: cellDef.rowNumber,
          columnNumber: cellDef.columnNumber,
          cellStyle: cellDef.cellStyle
        };
      } else {
        newCellDef = deepCopy(cellDef);
      }
      newCellDef.expand = 'Down';
      const value = newCellDef.value;
      value.aggregate = 'group';
      value.datasetName = datasetName;
      value.property = fieldName;
      value.order = 'none';
      let text = value.datasetName + '.' + value.aggregate + '(';
      text += value.property + ')';
      setCell(rowIndex, colIndex, newCellDef);
      this.hot.setDataAtCell(rowIndex, colIndex, text);
      if (window.setDirty) {
        window.setDirty();
      }
      this.hot.render();
      if (window.Handsontable && window.Handsontable.hooks) {
        window.Handsontable.hooks.run(this.hot, 'afterSelectionEnd', rowIndex, colIndex, rowIndex, colIndex);
      }
      if (window.undoManager) {
        window.undoManager.add({
          redo: () => {
            const currentCellDef = getCell(rowIndex, colIndex);
            let redoCellDef;
            if (currentCellDef.value.type !== 'dataset') {
              redoCellDef = {
                value: { type: 'dataset', conditions: [] },
                rowNumber: currentCellDef.rowNumber,
                columnNumber: currentCellDef.columnNumber,
                cellStyle: currentCellDef.cellStyle
              };
            } else {
              redoCellDef = deepCopy(currentCellDef);
            }
            redoCellDef.expand = 'Down';
            const redoValue = redoCellDef.value;
            redoValue.aggregate = 'group';
            redoValue.datasetName = datasetName;
            redoValue.property = fieldName;
            redoValue.order = 'none';
            let redoText = redoValue.datasetName + '.' + redoValue.aggregate + '(';
            redoText += redoValue.property + ')';
            setCell(rowIndex, colIndex, redoCellDef);
            this.hot.setDataAtCell(rowIndex, colIndex, redoText);
            if (window.setDirty) window.setDirty();
            this.hot.render();
            if (window.Handsontable && window.Handsontable.hooks) {
              window.Handsontable.hooks.run(this.hot, 'afterSelectionEnd', rowIndex, colIndex, rowIndex, colIndex);
            }
          },
          undo: () => {
            setCell(rowIndex, colIndex, oldCellDef);
            const value = oldCellDef.value;
            let text = value.value || '';
            if (value.type === 'dataset') {
              text = value.datasetName + '.' + value.aggregate + '(';
              text += value.property + ')';
            }
            this.hot.setDataAtCell(rowIndex, colIndex, text);
            if (window.setDirty) window.setDirty();
            this.hot.render();
            if (window.Handsontable && window.Handsontable.hooks) {
              window.Handsontable.hooks.run(this.hot, 'afterSelectionEnd', rowIndex, colIndex, rowIndex, colIndex);
            }
          }
        });
      }
    },

    handleCellSelected(rowIndex, colIndex, row2Index, col2Index) {
      this.$emit('cell-selected', {
        rowIndex,
        colIndex,
        row2Index,
        col2Index
      });
    },

    handleReportLoaded() {
      this.context = new Context(this);
      this.setContext(this.context);
      this.setIsPrintLineRefresh(true);
      this.processRowHeaders();
    },

    processRowHeaders() {
      if (this.reportDef && this.reportDef.rows) {
        const rows = this.reportDef.rows;
        for (let row of rows) {
          const band = row.band;
          if (!band) {
            continue;
          }
          addRowHeader(row.rowNumber - 1, band);
        }
        renderRowHeader(this.hot);
      }
    },

    async loadFile(filePath) {
      try {
        let formData = new FormData();
        formData.append('filePath', filePath);
        const reportDef = await loadReport(formData);

        this.reportDef = reportDef;
        this.buildReportData(reportDef);
        this.buildMenu();
        this.handleReportLoaded();

        if (filePath !== this.defaultReportPath) {
          this.$store.dispatch('report/setFileName', filePath);
        } else {
          this.$store.dispatch('report/setFileName', `${this.$t('table.report.tip')}`);
        }
        const masterElement = document.querySelector('.ht_master');
        if (masterElement) {
          if (reportDef.paper.bgImage) {
            masterElement.style.background = `url(${reportDef.paper.bgImage}) 50px 26px no-repeat`;
          } else {
            masterElement.style.background = 'transparent';
          }
        }

      } catch (error) {
        this.$emit('error', error);
        if (error.msg) {
          showAlert(this.$t('dialog.save.serverError') + this.$t('colon') + error.msg, { useHTMLString: true });
        } else {
          showAlert(this.$t('table.report.load') + `${filePath}` + this.$t('table.report.fail'));
        }
      }
    },

    buildReportData(data) {
      this.cellsMap.clear();
      const rows = data.rows;
      const rowHeights = [];
      for (let row of rows) {
        const height = row.height;
        rowHeights.push(utils.pointToPixel(height));
      }
      const columns = data.columns;
      const colWidths = [];
      for (let col of columns) {
        const width = col.width;
        colWidths.push(utils.pointToPixel(width));
      }
      const cellsMap = data.cellsMap;
      const dataArray = [], mergeCells = [];
      for (let row of rows) {
        const rowData = [];
        for (let col of columns) {
          let key = row.rowNumber + "," + col.columnNumber;
          let cell = cellsMap[key];
          if (cell) {
            this.cellsMap.set(key, cell);
            rowData.push(cell.value.value || "");
            let rowspan = cell.rowSpan, colspan = cell.colSpan;
            if (rowspan > 0 || colspan > 0) {
              if (rowspan === 0) rowspan = 1;
              if (colspan === 0) colspan = 1;
              mergeCells.push({
                rowspan,
                colspan,
                row: row.rowNumber - 1,
                col: col.columnNumber - 1
              });
            }
          } else {
            rowData.push("");
          }
        }
        dataArray.push(rowData);
      }
      this.hot.loadData(dataArray);
      this.hot.updateSettings({
        colWidths,
        rowHeights,
        mergeCells,
        cells: (row, col) => {
          const cellProperties = {};
          const cellDef = getCell(row, col);
          if (cellDef && cellDef.value && cellDef.value.type === 'simple') {
            cellProperties.readOnly = false;
          } else {
            cellProperties.readOnly = true;
          }
          return cellProperties;
        }
      });
      this.bindAfterChangeEvent();
    },

    /**
     * 绑定单元格编辑完成事件
     * 当 simple 类型单元格编辑完成后，更新单元格定义并标记脏数据
     */
    bindAfterChangeEvent() {
      this.hot.addHook('afterChange', (changes, source) => {
        if (source === 'edit' && changes) {
          changes.forEach(([row, col, oldValue, newValue]) => {
            const cellDef = getCell(row, col);
            if (cellDef && cellDef.value && cellDef.value.type === 'simple') {
              const newCellDef = deepCopy(cellDef);
              newCellDef.value.value = newValue;
              setCell(row, col, newCellDef);
              utils.setDirty();
            }
          });
        }
      });
    },

    buildMenu() {
      this.hot.updateSettings({
        contextMenu: buildMenuConfigure()
      });
    },

    getReportData() {
      return utils.tableToXml(this.context);
    },

    saveReport() {
      this.$emit('save', { data: this.getReportData() });
    }
  }
};
</script>

<style scoped>

.ud-page{
  position: relative;
  display: flex;
  flex: 1;
  overflow: hidden;
  background: white;
}

.ud-slider{
  height: 200px;
  width: 50px;
}

.ud-table{
  width: 100%;
  min-height: 500px;
}
</style>
