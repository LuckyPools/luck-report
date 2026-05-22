<template>
  <u-button
      type="info"
      :title="$t('tools.bold.bold')"
      class="info-button"
      @click="handleClick"
  >
    <i class="iconfont icon-font-bold" :style="{ color: isActive ? 'black' : '#666' }"></i>
  </u-button>
</template>

<script>
import { undoManager, setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import UButton from "@/components/button/index.vue";
import {getCell, setCell} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager.js';

export default {
  name: 'BoldTool',
  components: {UButton},
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
  data() {
    return {
      isActive: false
    };
  },
  computed: {
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
      const hot = TableManager.get();
      const selected = hot.getSelected();
      if (!selected || selected.length === 0) {
        showAlert(this.$t('selectTargetCellFirst'));
        return false;
      }
      return true;
    },
    // 执行加粗操作
    handleClick() {
      if (!this.checkSelection()) {
        return;
      }

      const table = TableManager.get();
      const selected = table.getSelected();
      let [startRow, startCol, endRow, endCol] = selected[0];

      if (startRow > endRow) {
        [startRow, endRow] = [endRow, startRow];
      }
      if (startCol > endCol) {
        [startCol, endCol] = [endCol, startCol];
      }

      const oldBoldStyle = this.updateCellsBoldStyle(startRow, startCol, endRow, endCol);
      table.render();

      undoManager.add({
        redo: () => {
          this.updateCellsBoldStyle(startRow, startCol, endRow, endCol);
          table.render();
          setDirty();
        },
        undo: () => {
          this.restoreBoldStyle(startRow, startCol, endRow, endCol, oldBoldStyle);
          table.render();
          setDirty();
        }
      });

      setDirty();
    },
    // 更新单元格加粗样式
    updateCellsBoldStyle(startRow, startCol, endRow, endCol) {
      const oldBoldStyle = {};

      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          oldBoldStyle[i + ',' + j] = newCellDef.cellStyle.bold;
          // 切换加粗状态
          cellStyle.bold = !cellStyle.bold;
          setCell( i, j, newCellDef );

          // 更新工具状态为第一个单元格的加粗状态
          if (i === startRow && j === startCol) {
            this.isActive = cellStyle.bold;
          }
        }
      }

      return oldBoldStyle;
    },
    // 恢复加粗样式
    restoreBoldStyle(startRow, startCol, endRow, endCol, oldBoldStyle) {
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          cellStyle.bold = oldBoldStyle[i + ',' + j];
          setCell( i, j, newCellDef );

          // 更新工具状态为第一个单元格的加粗状态
          if (i === startRow && j === startCol) {
            this.isActive = cellStyle.bold;
          }
        }
      }
    },
    // 刷新工具状态
    refresh(startRow, startCol, endRow, endCol) {
      if (startRow > endRow) {
        [startRow, endRow] = [endRow, startRow];
      }
      if (startCol > endCol) {
        [startCol, endCol] = [endCol, startCol];
      }

      // 获取第一个单元格的加粗状态
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          this.isActive = cellStyle.bold || false;
          break;
        }
        break;
      }
    }
  }
};
</script>

<style scoped>
</style>
