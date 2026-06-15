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
import { undoManager, setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import UButton from "@/components/button/index.vue";
import TableManager from '@/views/report/designer/edit-table/manager';
import { doMergeCells } from '@/views/report/designer/edit-table/utils/MergeCellUtils';

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
      doMergeCells(startRow, startCol, endRow, endCol, table);

      undoManager.add({
        redo: function() {
          mergeCells = table.getSettings().mergeCells || [];
          oldMergeCells = mergeCells.concat([]);
          doMergeCells(startRow, startCol, endRow, endCol, table);
          setDirty();
        },
        undo: function() {
          table.updateSettings({ mergeCells: oldMergeCells });
          setDirty();
        }
      });

      setDirty();
    }
  }
};
</script>

<style scoped>
/* 按钮样式继承自父组件 */
</style>
