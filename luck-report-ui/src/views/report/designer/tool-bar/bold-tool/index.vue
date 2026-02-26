<template>
  <u-button
      type="info"
      :title="$t('tools.bold.bold')"
      class="info-button"
      @click="execute"
  >
    <i class="iconfont iconfont icon-font-bold" :style="{ color: isActive ? 'black' : '#666' }"></i>
  </u-button>
</template>

<script>
import { undoManager, setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import UButton from "@/components/button/index.vue";

export default {
  name: 'BoldTool',
  components: {UButton},
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isActive: false
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
    // 执行加粗操作
    execute() {
      if (!this.checkSelection()) {
        return;
      }

      const table = this.context.hot;
      const selected = table.getSelected();
      let startRow = selected[0], startCol = selected[1], endRow = selected[2], endCol = selected[3];

      // 确保startRow <= endRow和startCol <= endCol
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
          const cellDef = this.context.getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          oldBoldStyle[i + ',' + j] = cellStyle.bold;

          // 切换加粗状态
          cellStyle.bold = !cellStyle.bold;

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
          const cellDef = this.context.getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          cellStyle.bold = oldBoldStyle[i + ',' + j];

          // 更新工具状态为第一个单元格的加粗状态
          if (i === startRow && j === startCol) {
            this.isActive = cellStyle.bold;
          }
        }
      }
    },
    // 刷新工具状态
    refresh(startRow, startCol, endRow, endCol) {
      // 确保startRow <= endRow和startCol <= endCol
      if (startRow > endRow) {
        [startRow, endRow] = [endRow, startRow];
      }
      if (startCol > endCol) {
        [startCol, endCol] = [endCol, startCol];
      }

      // 获取第一个单元格的加粗状态
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = this.context.getCell(i, j);

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
