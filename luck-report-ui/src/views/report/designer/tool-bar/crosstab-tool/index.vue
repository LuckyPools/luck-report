<template>
  <u-button
      :title="$t('tools.crosstab.title')"
      type="info"
      class="info-button"
      icon="icon-slash-header"
      @click="handleClick"
  >
    <CrosstabDialog :visible="dialogVisible" @saveAfter="handleSaveAfter" @close="dialogVisible = false" />
  </u-button>
</template>

<script>
import { setDirty, undoManager } from '@/utils/table.js';
import CrossTabWidget from '@/views/report/designer/edit-table/cross-tab-widget/class.js';
import CrossTabWidgetManager from '@/views/report/designer/edit-table/cross-tab-widget/manager.js';
import Handsontable from 'handsontable';
import CrosstabDialog from '@/views/report/designer/tool-bar/crosstab-tool/crosstab-dialog/index.vue';
import { showAlert } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import UButton from "@/components/button/index.vue";
import { mapGetters } from 'vuex';
import {getCell, setCell} from "@/utils/contextActions";

export default {
  name: 'CrosstabTool',
  components: {
    UButton,
    CrosstabDialog
  },
  props: {
    selectedCells: {
      type: Object,
      default: () => ({
        rowIndex: null,
        colIndex: null,
        row2Index: null,
        col2Index: null
      })
    }
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    }
  },
  data() {
    return {
      isActive: false,
      selectedCell: null,
      oldCellData: null,
      oldCellDataValue: null,
      dialogVisible: false
    };
  },
  watch: {
    selectedCells: {
      deep: true,
      handler(newVal) {
        if (newVal.rowIndex !== null && newVal.colIndex !== null) {
          this.refresh(newVal.rowIndex, newVal.colIndex, newVal.row2Index, newVal.col2Index);
        }
      }
    }
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
    handleClick() {
      if (!this.checkSelection()) {
        return;
      }

      const hot = this.context.hot;
      const selected = hot.getSelected();
      const rowIndex = selected[0], colIndex = selected[1];
      const cellDef = getCell(rowIndex, colIndex);

      this.selectedCell = {
        rowIndex,
        colIndex,
        cellDef,
        selected
      };
      this.oldCellData = hot.getDataAtCell(rowIndex, colIndex);
      this.oldCellDataValue = cellDef.value;

      this.dialogVisible = true;
    },
    // 处理保存后的逻辑
    handleSaveAfter(value) {
      const { rowIndex, colIndex, cellDef, selected } = this.selectedCell;
      const hot = this.context.hot;

      const newCellDef = deepCopy(cellDef);
      newCellDef.value = {
        type: 'slash'
      };
      setCell( rowIndex, colIndex, newCellDef )

      const widgetKey = `${rowIndex}_${colIndex}`;
      // 如果已存在 widget，先销毁它
      if (CrossTabWidgetManager.has(widgetKey)) {
        CrossTabWidgetManager.remove(widgetKey);
      }
      CrossTabWidgetManager.set(widgetKey, new CrossTabWidget(this.context, rowIndex, colIndex, value));

      hot.render();
      setDirty();
      Handsontable.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, selected[2], selected[3]);

      undoManager.add({
        redo: () => {
          const redoCellDef = deepCopy(getCell(rowIndex, colIndex));
          redoCellDef.value = {
            type: 'slash'
          };
          setCell(rowIndex, colIndex, redoCellDef );
          const widgetKey = `${rowIndex}_${colIndex}`;
          if (CrossTabWidgetManager.has(widgetKey)) {
            CrossTabWidgetManager.remove(widgetKey);
          }
          CrossTabWidgetManager.set(widgetKey, new CrossTabWidget(this.context, rowIndex, colIndex, value));
          hot.render();
          setDirty();
          Handsontable.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, selected[2], selected[3]);
        },
        undo: () => {
          const undoCellDef = deepCopy(getCell(rowIndex, colIndex));
          undoCellDef.value = this.oldCellDataValue;
          const widgetKey = `${rowIndex}_${colIndex}`;
          if (CrossTabWidgetManager.has(widgetKey)) {
            CrossTabWidgetManager.remove(widgetKey);
          }
          setCell(rowIndex, colIndex, undoCellDef );
          hot.setDataAtCell(rowIndex, colIndex, this.oldCellData);
          hot.render();
          setDirty();
          Handsontable.hooks.run(hot, 'afterSelectionEnd', rowIndex, colIndex, selected[2], selected[3]);
        }
      });
    },
    // 刷新工具状态
    refresh(rowIndex, colIndex, row2Index, col2Index) {
      const cellDef = getCell(rowIndex, colIndex);
      const widgetKey = `${rowIndex}_${colIndex}`;
      this.isActive = !!(cellDef && CrossTabWidgetManager.has(widgetKey));
    }
  }
};
</script>

<style scoped>
.btn:hover {
  background-color: #e6e6e6 !important;
}
</style>
