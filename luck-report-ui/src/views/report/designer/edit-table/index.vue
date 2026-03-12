<template>
  <div class="ud-page">
<!--    <div class="ud-slider"></div>-->
    <div class="ud-table" ref="contentTable"></div>
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

export default {
  name: 'ContentTable',
  data() {
    return {
      hot: null,
      reportDef: null,
      cellsMap: new Map(),
      context: null
    };
  },
  mounted() {
    this.initTable();
  },
  beforeUnmount() {
    // 清理资源
    if (this.hot) {
      this.hot.destroy();
    }
  },
  methods: {
    ...mapActions('report', [
      'setContext'
    ]),
    /**
     * 初始化表格
     */
    initTable() {
      utils.undoManager.setLimit(100);

      // 初始化Handsontable
      this.initHandsontable();

      // 加载文件
      let filePath = utils.getParameter("reportPath");
      if (!filePath || filePath === '') {
          filePath = 'classpath:template/template.ureport.xml';
      }else{
          this.$store.dispatch('report/setSaveStatus', true);
      }
      this.loadFile(filePath, this.handleReportLoaded.bind(this));
    },

    /**
     * 初始化Handsontable实例
     */
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

      this.hot.addHook("afterRenderer", afterRenderer);
      this.bindRowResizeEvent();
      this.bindColumnResizeEvent();
      this.bindSelectionEvent();
    },

    /**
     * 绑定行调整大小事件
     */
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

    /**
     * 绑定列调整大小事件
     */
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

    /**
     * 绑定选择事件
     */
    bindSelectionEvent() {
      const _this = this;
      Handsontable.hooks.add("afterSelectionEnd", function(rowIndex, colIndex, row2Index, col2Index) {
        _this.handleCellSelected(rowIndex, colIndex, row2Index, col2Index);
      }, this.hot);
    },

    /**
     * 处理单元格选择事件
     */
    handleCellSelected(rowIndex, colIndex, row2Index, col2Index) {
      this.$emit('cell-selected', {
        rowIndex,
        colIndex,
        row2Index,
        col2Index
      });
    },

    /**
     * 处理报表加载完成
     */
    handleReportLoaded() {
      // 创建Context实例
      this.context = new Context(this);

      // 将context存入vuex
      this.setContext(this.context);

      // 通过事件传递context给父组件
      this.$emit('context-created', this.context);

      // 处理行头
      this.processRowHeaders();
    },

    /**
     * 处理行头
     */
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
        renderRowHeader(this.hot, this.context);
      }
    },

    /**
     * 加载报表文件
     */
    async loadFile(filePath, callback) {
      try {
        let formData = new FormData();
        formData.append('filePath', filePath);
        const reportDef = await loadReport(formData);

        this.reportDef = reportDef;
        this._buildReportData(reportDef);
        this.hot.render();

        // 先构建菜单，因为它依赖于hot实例但不依赖于context
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
        if (error.msg) {
          showAlert("服务端错误：" + error.msg);
        } else {
          showAlert(this.$t('table.report.load') + `${file}` + this.$t('table.report.fail'));
        }
      }
    },

    /**
     * 构建报表数据
     */
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

    /**
     * 构建菜单
     */
    buildMenu() {
      this.hot.updateSettings({
        contextMenu: buildMenuConfigure()
      });
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
.htCore {
  border-bottom-width: 1px !important;
  border-right-width: 1px !important;
}

.handsontable tr{
    background: transparent;
}
.handsontable td, .handsontable th{
    background: transparent;
}
.handsontable table.htCore{
    border-collapse:collapse
}
</style>
