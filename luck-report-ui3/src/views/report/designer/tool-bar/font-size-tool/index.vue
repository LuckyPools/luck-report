<template>
  <div class="u-inline">
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
import { deepCopy } from '@/components/utils/index.js';
import ButtonGroup from '@/components/button-group/index.vue';
import {getCell, setCell} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager';

export default {
  name: 'FontSizeTool',
  components: {
    ButtonGroup
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
  data() {
    return {
      currentFontSize: 10,
      fontSizes: Array.from({ length: 100 }, (_, i) => i + 1)
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
    // 应用选定的字号
    applyFontSize(fontSize) {
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
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          oldFontSize[i + ',' + j] = newCellDef.cellStyle.fontSize;
          cellStyle.fontSize = fontSize;
          setCell( i, j, newCellDef );

          // 更新工具状态为第一个单元格的字号
          if (i === startRow && j === startCol) {
            this.currentFontSize = cellStyle.fontSize;
          }
        }
      }

      return oldFontSize;
    },
    // 恢复字号
    restoreFontSize(startRow, startCol, endRow, endCol, oldFontSize) {
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          cellStyle.fontSize = oldFontSize[i + ',' + j];
          setCell( i, j, newCellDef );

          // 更新工具状态为第一个单元格的字号
          if (i === startRow && j === startCol) {
            this.currentFontSize = cellStyle.fontSize || 10;
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

      // 获取第一个单元格的字号
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);

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
.font-size-tool-dropdown ::v-deep .button-text {
  display: inline-block;
  vertical-align: top;
  width: 28px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-left: 0;
}
</style>
