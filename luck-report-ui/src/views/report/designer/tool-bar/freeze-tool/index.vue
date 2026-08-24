<template>
  <ButtonGroup
      :title="$t('tools.freeze.freeze')"
      iconClass="icon-lock"
      :menuItems="menuItems"
      @menu-item-click="handleMenuItemClick"
  />
</template>

<script>
import ButtonGroup from '@/components/button-group/index.vue';
import { undoManager, setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import TableManager from '@/views/report/designer/edit-table/manager.js';
import { getContext, updateReportDef } from '@/utils/contextActions';
import {
  freezeRowToCellName,
  freezeColToCellName,
  parseFreezeRowFromCellName,
  parseFreezeColFromCellName
} from '@/views/report/designer/edit-table/utils/FreezeState.js';

export default {
  name: 'FreezeTool',
  components: { ButtonGroup },
  computed: {
    paper() {
      const context = this.$store.getters['report/getContext'];
      return (context && context.reportDef && context.reportDef.paper) || {};
    },
    freezeRowCount() {
      return parseFreezeRowFromCellName(this.paper.freezeRowCellName);
    },
    freezeColCount() {
      return parseFreezeColFromCellName(this.paper.freezeColCellName);
    },
    freezeMode() {
      const r = this.freezeRowCount;
      const c = this.freezeColCount;
      if (r > 0 && c === 0) return 'row';
      if (c > 0 && r === 0) return 'col';
      if (r > 0 && c > 0) return 'pane';
      return 'none';
    },
    menuItems() {
      return [
        {
          key: 'row',
          icon: 'iconfont icon-freeze-row',
          text: this.freezeMode === 'row' ? this.$t('tools.freeze.unFreezeRow') : this.$t('tools.freeze.freezeRow'),
          action: () => this.toggleFreezeRow()
        },
        {
          key: 'col',
          icon: 'iconfont icon-freeze-col',
          text: this.freezeMode === 'col' ? this.$t('tools.freeze.unFreezeCol') : this.$t('tools.freeze.freezeCol'),
          action: () => this.toggleFreezeCol()
        },
        {
          key: 'pane',
          icon: 'iconfont icon-freeze-window',
          text: this.freezeMode === 'pane' ? this.$t('tools.freeze.unFreezePane') : this.$t('tools.freeze.freezePane'),
          action: () => this.toggleFreezePane()
        }
      ];
    }
  },
  methods: {
    handleMenuItemClick() {
    },

    /**
     * 校验冻结边界不穿过合并单元格（跨边界合并会导致克隆层渲染错乱）
     * @param {number} newR 新冻结行数
     * @param {number} newC 新冻结列数
     * @return {boolean} true=边界合法
     */
    validateFreezeBoundary(newR, newC) {
      const table = TableManager.get();
      const merges = (table && table.getSettings().mergeCells) || [];
      for (const merge of merges) {
        if (newR > 0 && merge.row < newR && merge.row + merge.rowspan > newR) {
          return false;
        }
        if (newC > 0 && merge.col < newC && merge.col + merge.colspan > newC) {
          return false;
        }
      }
      return true;
    },

    applyFreeze(row, col) {
      const context = getContext();
      if (context && context.reportDef) {
        const newPaper = {
          ...context.reportDef.paper,
          freezeRowCellName: freezeRowToCellName(row),
          freezeColCellName: freezeColToCellName(col)
        };
        updateReportDef({ ...context.reportDef, paper: newPaper });
      }
      const table = TableManager.get();
      if (table) {
        table.updateSettings({ fixedRowsTop: row, fixedColumnsLeft: col });
      }
      setDirty();
    },

    pickStart() {
      const table = TableManager.get();
      const selected = table && table.getSelected();
      if (!table || !selected || selected.length === 0) {
        return [-1, -1];
      }
      let [startRow, startCol, endRow, endCol] = selected[0];
      if (startRow > endRow) {
        const tmp = startRow;
        startRow = endRow;
        endRow = tmp;
      }
      if (startCol > endCol) {
        const tmp = startCol;
        startCol = endCol;
        endCol = tmp;
      }
      return [startRow, startCol];
    },

    toggleFreezeRow() {
      const oldR = this.freezeRowCount;
      const oldC = this.freezeColCount;
      if (this.freezeMode === 'row') {
        this.applyFreeze(0, 0);
        undoManager.add({
          undo: () => this.applyFreeze(oldR, oldC),
          redo: () => this.applyFreeze(0, 0)
        });
        return;
      }
      const [startRow] = this.pickStart();
      if (startRow < 0) {
        showAlert(this.$t('selectTargetCellFirst'));
        return;
      }
      const newR = startRow + 1;
      const newC = 0;
      if (!this.validateFreezeBoundary(newR, newC)) {
        showAlert(this.$t('tools.freeze.mergeConflict'));
        return;
      }
      this.applyFreeze(newR, newC);
      undoManager.add({
        undo: () => this.applyFreeze(oldR, oldC),
        redo: () => this.applyFreeze(newR, newC)
      });
    },

    toggleFreezeCol() {
      const oldR = this.freezeRowCount;
      const oldC = this.freezeColCount;
      if (this.freezeMode === 'col') {
        this.applyFreeze(0, 0);
        undoManager.add({
          undo: () => this.applyFreeze(oldR, oldC),
          redo: () => this.applyFreeze(0, 0)
        });
        return;
      }
      const [, startCol] = this.pickStart();
      if (startCol < 0) {
        showAlert(this.$t('selectTargetCellFirst'));
        return;
      }
      const newR = 0;
      const newC = startCol + 1;
      if (!this.validateFreezeBoundary(newR, newC)) {
        showAlert(this.$t('tools.freeze.mergeConflict'));
        return;
      }
      this.applyFreeze(newR, newC);
      undoManager.add({
        undo: () => this.applyFreeze(oldR, oldC),
        redo: () => this.applyFreeze(newR, newC)
      });
    },

    toggleFreezePane() {
      const oldR = this.freezeRowCount;
      const oldC = this.freezeColCount;
      if (this.freezeMode === 'pane') {
        this.applyFreeze(0, 0);
        undoManager.add({
          undo: () => this.applyFreeze(oldR, oldC),
          redo: () => this.applyFreeze(0, 0)
        });
        return;
      }
      const [startRow, startCol] = this.pickStart();
      if (startRow < 0 || startCol < 0) {
        showAlert(this.$t('selectTargetCellFirst'));
        return;
      }
      const newR = startRow + 1;
      const newC = startCol + 1;
      if (!this.validateFreezeBoundary(newR, newC)) {
        showAlert(this.$t('tools.freeze.mergeConflict'));
        return;
      }
      this.applyFreeze(newR, newC);
      undoManager.add({
        undo: () => this.applyFreeze(oldR, oldC),
        redo: () => this.applyFreeze(newR, newC)
      });
    }
  }
};
</script>

<style scoped>
</style>
