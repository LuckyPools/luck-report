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
import { addRowHeader } from "@/utils/contextActions";
import TableManager from './manager.js';
import { getLibMode } from '@/lib/navigator';
import PrintLine from "@/views/report/designer/print-line/index.vue";

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
      internalReportPath: this.reportPath
    };
  },
  computed: {
    isLibMode() {
      return getLibMode();
    }
  },
  watch: {
    reportPath(val) {
      this.internalReportPath = val;
      if (val) {
        this.loadFile(val, this.handleReportLoaded.bind(this));
      }
    }
  },
  mounted() {
    this.initTable();
  },
  beforeUnmount() {
    if (this.hot) {
      this.hot.destroy();
    }
  },
  methods: {
    ...mapActions('report', [
      'setContext',
      'setPrintLineShouldRefresh'
    ]),
    initTable() {
      utils.undoManager.setLimit(100);

      this.initHandsontable();

      let filePath = '';
      if (this.isLibMode) {
        filePath = this.internalReportPath || 'classpath:template/template.ureport.xml';
      } else {
        filePath = utils.getParameter("reportPath");
        if (!filePath || filePath === '') {
          filePath = 'classpath:template/template.ureport.xml';
        }
      }

      if (filePath && filePath !== 'classpath:template/template.ureport.xml') {
        this.$store.dispatch('report/setSaveStatus', true);
      }

      this.loadFile(filePath, this.handleReportLoaded.bind(this));
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
      this.setPrintLineShouldRefresh(true);
      this.$emit('context-created', this.context);
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

    async loadFile(filePath, callback) {
      try {
        let formData = new FormData();
        formData.append('filePath', filePath);
        const reportDef = await loadReport(formData);

        this.reportDef = reportDef;
        this._buildReportData(reportDef);
        this.hot.render();

        this.buildMenu();

        if (callback) {
          callback.call(this, reportDef);
        }

        if (filePath !== 'classpath:template/template.ureport.xml') {
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

    _buildReportData(data) {
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
        readOnly: true
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
<style>
/** 套打图 **/
.handsontable tr{
  background: transparent;
}
.handsontable td, .handsontable th{
  background: transparent;
}
.handsontable table.htCore{
  border-collapse:collapse;
  cursor: cell;
}

.htContextMenu table.htCore{
  display: block;
  padding: 4px 0;
  width: 200px;
  box-shadow:
      0 3px 6px rgba(0, 0, 0, 0.10),
      0 6px 12px rgba(0, 0, 0, 0.08),
      0 10px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.htContextMenu table tbody tr td{
  padding: 4px 8px;
  font-size: 13px;
  color: black;
}

.htContextMenu table tbody tr td i{
  margin-right: 8px;
}

</style>
