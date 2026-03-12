<template>
  <u-button
      type="info"
      :title="$t('italic')"
      class="info-button"
      @click="handleClick"
  >
    <i class="iconfont icon-font-italic" :style="{ color: isActive ? 'black' : '#666' }"></i>
  </u-button>
</template>

<script>
import { undoManager, setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import UButton from "@/components/button/index.vue";
import { mapGetters } from 'vuex';
import {getCell, setCell} from "@/utils/contextActions";

export default {
  name: 'ItalicTool',
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
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    }
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
    // 执行斜体操作
    handleClick() {
      if (!this.checkSelection()) {
        return;
      }

      const table = this.context.hot;
      const selected = table.getSelected();
      let startRow = selected[0], startCol = selected[1], endRow = selected[2], endCol = selected[3];

      if (startRow > endRow) {
        [startRow, endRow] = [endRow, startRow];
      }
      if (startCol > endCol) {
        [startCol, endCol] = [endCol, startCol];
      }

      const oldItalicStyle = this.updateCellsItalicStyle(startRow, startCol, endRow, endCol);
      table.render();

      undoManager.add({
        redo: () => {
          this.updateCellsItalicStyle(startRow, startCol, endRow, endCol);
          table.render();
          setDirty();
        },
        undo: () => {
          this.restoreItalicStyle(startRow, startCol, endRow, endCol, oldItalicStyle);
          table.render();
          setDirty();
        }
      });

      setDirty();
    },
    // 更新单元格斜体样式
    updateCellsItalicStyle(startRow, startCol, endRow, endCol) {
      const oldItalicStyle = {};

      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          oldItalicStyle[i + ',' + j] = newCellDef.cellStyle.italic;
          // 切换斜体状态
          cellStyle.italic = !cellStyle.italic;
          setCell( i, j, newCellDef );

          // 更新工具状态为第一个单元格的斜体状态
          if (i === startRow && j === startCol) {
            this.isActive = cellStyle.italic;
          }
        }
      }

      return oldItalicStyle;
    },
    // 恢复斜体样式
    restoreItalicStyle(startRow, startCol, endRow, endCol, oldItalicStyle) {
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          cellStyle.italic = oldItalicStyle[i + ',' + j];
          setCell( i, j, newCellDef );

          // 更新工具状态为第一个单元格的斜体状态
          if (i === startRow && j === startCol) {
            this.isActive = cellStyle.italic;
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

      // 获取第一个单元格的斜体状态
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          this.isActive = cellStyle.italic || false;
          break;
        }
        break;
      }
    }
  }
};
</script>

<style scoped>
.btn:hover {
  background-color: #e6e6e6 !important;
}
</style>
