<template>
  <u-button
      :title="$t('tools.crosstab.title')"
      type="info"
      class="info-button"
      icon="icon-slash-header"
      @click="execute"
  >
    <CrosstabDialog ref="crosstabDialog" @saveAfter="handleSaveAfter" />
  </u-button>
</template>

<script>
import { setDirty, undoManager } from '@/utils/table.js';
import CrossTabWidget from '@/views/report/designer/edit-table/cross-tab-widget/class.js';
import Handsontable from 'handsontable';
import CrosstabDialog from '@/views/report/designer/tool-bar/crosstab-tool/crosstab-dialog/index.vue';
import { showAlert } from '@/utils/comnon.js';
import UButton from "@/components/button/index.vue";

export default {
  name: 'CrosstabTool',
  components: {
    UButton,
    CrosstabDialog
  },
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isActive: false,
      selectedCell: null,
      oldCellData: null,
      oldCellDataValue: null
    };
  },
  methods: {
    // 检查是否有选中的单元格
    checkSelection() {
      const selected = this.context.hot.getSelected();
      if (!selected || selected.length === 0) {
        showAlert(this.$t('selectTargetCellFirst'));
        return false;
      }
      return true;
    },
    // 执行交叉表操作
    execute() {
      if (!this.checkSelection()) {
        return;
      }

      const hot = this.context.hot;
      const selected = hot.getSelected();
      const rowIndex = selected[0], colIndex = selected[1];
      const cellDef = this.context.getCell(rowIndex, colIndex);

      this.selectedCell = {
        rowIndex,
        colIndex,
        cellDef,
        selected
      };
      this.oldCellData = hot.getDataAtCell(rowIndex, colIndex);
      this.oldCellDataValue = cellDef.value;

      this.$refs.crosstabDialog.show();
    },
    // 处理保存后的逻辑
    handleSaveAfter(value) {
      const { rowIndex, colIndex, cellDef, selected } = this.selectedCell;
      const hot = this.context.hot;

      cellDef.crossTabWidget = new CrossTabWidget(this.context, rowIndex, colIndex, null, value);
      hot.render();
      setDirty();
      Handsontable.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, selected[2], selected[3]);

      undoManager.add({
        redo: () => {
          cellDef.crossTabWidget = new CrossTabWidget(this.context, rowIndex, colIndex, null, value);
          hot.render();
          setDirty();
          Handsontable.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, selected[2], selected[3]);
        },
        undo: () => {
          cellDef.value = this.oldCellDataValue;
          cellDef.crossTabWidget = null;
          hot.setDataAtCell(rowIndex, colIndex, this.oldCellData);
          hot.render();
          setDirty();
          Handsontable.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, selected[2], selected[3]);
        }
      });
    },
    // 刷新工具状态
    refresh(rowIndex, colIndex, row2Index, col2Index) {
      const cellDef = this.context.getCell(rowIndex, colIndex);
      this.isActive = !!(cellDef && cellDef.crossTabWidget);
    }
  }
};
</script>

<style scoped>
.btn:hover {
  background-color: #e6e6e6 !important;
}
</style>
