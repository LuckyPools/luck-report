<template>
  <div class="tool-btn-group">
    <ButtonGroup
      :buttonText="currentFontSize.toString()"
      :showText="true"
      :title="$t('tools.fontSize.size')"
      :customClass="'font-size-tool-dropdown'"
      :menuItems="menuItems"
    />
  </div>
</template>

<script>
import { undoManager, setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import ButtonGroup from '@/components/button-group/index.vue';

export default {
  name: 'FontSizeTool',
  components: {
    ButtonGroup
  },
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      currentFontSize: 10,
      fontSizes: Array.from({ length: 100 }, (_, i) => i + 1) // 1到100的字号
    };
  },
  computed: {
    menuItems() {
      return this.fontSizes.map(size => ({
        text: size,
        action: () => this.applyFontSize(size)
      }));
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
    // 应用选定的字号
    applyFontSize(fontSize) {
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

      const oldFontSize = this.updateFontSize(startRow, startCol, endRow, endCol, fontSize);
      table.render();

      undoManager.add({
        redo: () => {
          this.updateFontSize(startRow, startCol, endRow, endCol, fontSize);
          table.render();
          setDirty();
        },
        undo: () => {
          this.restoreFontSize(startRow, startCol, endRow, endCol, oldFontSize);
          table.render();
          setDirty();
        }
      });

      setDirty();
    },
    // 更新字号
    updateFontSize(startRow, startCol, endRow, endCol, fontSize) {
      const oldFontSize = {};

      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = this.context.getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          oldFontSize[i + ',' + j] = cellStyle.fontSize;
          cellStyle.fontSize = fontSize;
        }
      }

      // 更新当前显示的字号
      this.currentFontSize = fontSize;

      return oldFontSize;
    },
    // 恢复字号
    restoreFontSize(startRow, startCol, endRow, endCol, oldFontSize) {
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = this.context.getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          cellStyle.fontSize = oldFontSize[i + ',' + j];

          // 更新当前显示的字号为第一个单元格的字号
          if (i === startRow && j === startCol) {
            this.currentFontSize = cellStyle.fontSize || 10;
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

      // 获取第一个单元格的字号
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = this.context.getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          const fontSize = cellStyle.fontSize || 10;
          this.currentFontSize = fontSize;
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
