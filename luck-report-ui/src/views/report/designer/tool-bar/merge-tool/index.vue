<template>
  <u-button
      type="info"
      :title="$t('mergeSplitCells')"
      class="info-button"
      icon="icon-merge"
      @click="handleClick"
  >
  </u-button>
</template>

<script>
import { undoManager, setDirty, buildNewCellDef } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import UButton from "@/components/button/index.vue";
import {addCell, getCell} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager.js';

export default {
  name: 'MergeTool',
  components: {UButton},
  methods: {
    handleClick() {
      const table = TableManager.get();
      const selected = table.getSelected();

      if (!selected) {
        showAlert(this.$t('selectTargetCellFirst'));
        return;
      }

      let mergeCells = table.getSettings().mergeCells || [];
      let oldMergeCells = mergeCells.concat([]);
      let [startRow, startCol, endRow, endCol] = selected[0];

      let tmp = endRow;
      if (startRow > endRow) {
        endRow = startRow;
        startRow = tmp;
      }
      tmp = endCol;
      if (startCol > endCol) {
        endCol = startCol;
        startCol = tmp;
      }

      const _this = this;
      this.doMergeCells(startRow, startCol, endRow, endCol, table);

      undoManager.add({
        redo: function() {
          mergeCells = table.getSettings().mergeCells || [];
          oldMergeCells = mergeCells.concat([]);
          _this.doMergeCells(startRow, startCol, endRow, endCol, table);
          setDirty();
        },
        undo: function() {
          table.updateSettings({ mergeCells: oldMergeCells });
          setDirty();
        }
      });

      setDirty();
    },

    doMergeCells(startRow, startCol, endRow, endCol, table) {
      let doMerge = true, doSplit = false;
      const mergeCells = table.getSettings().mergeCells || [];

      // 检查选中的单元格是否已经合并，如果是则拆分
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          let td = table.getCell(i, j);
          if (!td) {
            continue;
          }

          // 使用原生JavaScript替代jQuery
          let colSpan = td.colSpan || 1;
          let rowSpan = td.rowSpan || 1;

          if (colSpan > 1 || rowSpan > 1) {
            let index = 0;
            doSplit = true;
            doMerge = false;

            while (index < mergeCells.length) {
              let mergeItem = mergeCells[index];
              let row = mergeItem.row, col = mergeItem.col;
              if (row === i && col === j) {
                mergeCells.splice(index, 1);
                break;
              }
              index++;
            }
          }
        }
      }

      if (doMerge) {
        // 确保坐标顺序正确
        if (endRow < startRow) {
          let tmp = startRow;
          startRow = endRow;
          endRow = tmp;
        }
        if (endCol < startCol) {
          let tmp = startCol;
          startCol = endCol;
          endCol = tmp;
        }

        let rowSpan = endRow - startRow, colSpan = endCol - startCol;
        if (rowSpan === 0) {
          rowSpan = 1;
        } else {
          rowSpan++;
        }
        if (colSpan === 0) {
          colSpan = 1;
        } else {
          colSpan++;
        }

        const newMergeItem = { row: startRow, col: startCol, rowspan: rowSpan, colspan: colSpan };
        mergeCells.push(newMergeItem);
      } else {
        if (doSplit) {
          for (let i = startRow; i <= endRow; i++) {
            for (let j = startCol; j <= endCol; j++) {
              let cellDef = getCell(i, j);
              if (!cellDef) {
                cellDef = buildNewCellDef(i + 1, j + 1);
                addCell(cellDef );
              }
            }
          }
        } else {
          showAlert(this.$t('selectMultiTargetCellFirst'));
        }
      }

      table.updateSettings({ mergeCells });
    }
  }
};
</script>

<style scoped>
/* 按钮样式继承自父组件 */
</style>
