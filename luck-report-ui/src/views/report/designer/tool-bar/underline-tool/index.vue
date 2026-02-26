<template>
  <u-button
      type="info"
      :title="$t('tools.underline.underline')"
      class="info-button"
      @click="execute"
  >
    <i class="iconfont icon-font-underline" :style="{ color: isActive ? 'black' : '#666' }"></i>
  </u-button>
</template>

<script>
import { undoManager, setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import UButton from "@/components/button/index.vue";

export default {
  name: 'UnderlineTool',
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
    // 执行下划线操作
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
          const cellDef = this.context.getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          oldUnderlineStyle[i + ',' + j] = cellStyle.underline;

          // 切换下划线状态
          cellStyle.underline = !cellStyle.underline;

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
          const cellDef = this.context.getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          cellStyle.underline = oldUnderlineStyle[i + ',' + j];

          // 更新工具状态为第一个单元格的下划线状态
          if (i === startRow && j === startCol) {
            this.isActive = cellStyle.underline;
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

      // 获取第一个单元格的下划线状态
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = this.context.getCell(i, j);

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
