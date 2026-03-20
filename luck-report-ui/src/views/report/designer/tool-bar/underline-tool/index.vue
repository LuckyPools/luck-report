<template>
  <u-button
      type="info"
      :title="$t('underline')"
      class="info-button"
      @click="handleClick"
  >
    <i class="iconfont icon-font-underline" :style="{ color: isActive ? 'black' : '#666' }"></i>
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
  name: 'UnderlineTool',
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
    // 执行下划线操作
    handleClick() {
      if (!this.checkSelection()) {
        return;
      }

      const table = TableManager.get();
      const selected = table.getSelected();
      let startRow = selected[0], startCol = selected[1], endRow = selected[2], endCol = selected[3];

      if (startRow > endRow) {
        [startRow, endRow] = [endRow, startRow];
      }
      if (startCol > endCol) {
        [startCol, endCol] = [endCol, startCol];
      }

      const oldUnderlineStyle = this.updateCellsUnderlineStyle(startRow, startCol, endRow, endCol);
      table.render();

      undoManager.add({
        redo: () => {
          this.updateCellsUnderlineStyle(startRow, startCol, endRow, endCol);
          table.render();
          setDirty();
        },
        undo: () => {
          this.restoreUnderlineStyle(startRow, startCol, endRow, endCol, oldUnderlineStyle);
          table.render();
          setDirty();
        }
      });

      setDirty();
    },
    // 更新单元格下划线样式
    updateCellsUnderlineStyle(startRow, startCol, endRow, endCol) {
      const oldUnderlineStyle = {};

      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          oldUnderlineStyle[i + ',' + j] = newCellDef.cellStyle.underline;
          // 切换下划线状态
          cellStyle.underline = !cellStyle.underline;
          setCell(i, j, newCellDef );

          // 更新工具状态为第一个单元格的下划线状态
          if (i === startRow && j === startCol) {
            this.isActive = cellStyle.underline;
          }
        }
      }

      return oldUnderlineStyle;
    },
    // 恢复下划线样式
    restoreUnderlineStyle(startRow, startCol, endRow, endCol, oldUnderlineStyle) {
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          cellStyle.underline = oldUnderlineStyle[i + ',' + j];
          setCell(i, j, newCellDef );

          // 更新工具状态为第一个单元格的下划线状态
          if (i === startRow && j === startCol) {
            this.isActive = cellStyle.underline;
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

      // 获取第一个单元格的下划线状态
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          this.isActive = cellStyle.underline || false;
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
