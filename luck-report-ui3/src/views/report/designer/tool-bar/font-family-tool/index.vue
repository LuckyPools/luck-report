<template>
  <div class="u-inline">
    <ButtonGroup
      :buttonText="currentFontFamily"
      :showText="true"
      :title="$t('tools.font.font')"
      :customClass="'font-family-tool-dropdown'"
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
import TableManager from '@/views/report/designer/edit-table/manager.js';

export default {
  name: 'FontFamilyTool',
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
      currentFontFamily: '宋体',
      fontFamilies: [
        "宋体",
        "仿宋",
        "黑体",
        "楷体",
        "微软雅黑",
        "Arial",
        "Impact",
        "Times New Roman",
        "Comic Sans MS",
        "Courier New"
      ]
    };
  },
  computed: {
    menuItems() {
      return this.fontFamilies.map(font => ({
        text: font,
        action: () => this.applyFontFamily(font)
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
    // 应用选定的字体
    applyFontFamily(fontFamily) {
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

      const oldFontFamily = this.updateFontFamily(startRow, startCol, endRow, endCol, fontFamily);
      table.render();

      undoManager.add({
        redo: () => {
          this.updateFontFamily(startRow, startCol, endRow, endCol, fontFamily);
          table.render();
          setDirty();
        },
        undo: () => {
          this.restoreFontFamily(startRow, startCol, endRow, endCol, oldFontFamily);
          table.render();
          setDirty();
        }
      });

      setDirty();
    },
    // 更新字体
    updateFontFamily(startRow, startCol, endRow, endCol, fontFamily) {
      const oldFontFamily = {};

      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          oldFontFamily[i + ',' + j] = newCellDef.cellStyle.fontFamily;
          cellStyle.fontFamily = fontFamily;
          setCell( i, j, newCellDef );

          // 更新工具状态为第一个单元格的字体
          if (i === startRow && j === startCol) {
            this.currentFontFamily = fontFamily;
          }
        }
      }

      return oldFontFamily;
    },
    // 恢复字体
    restoreFontFamily(startRow, startCol, endRow, endCol, oldFontFamily) {
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          cellStyle.fontFamily = oldFontFamily[i + ',' + j];
          setCell( i, j, newCellDef );

          // 更新工具状态为第一个单元格的字体
          if (i === startRow && j === startCol) {
            this.currentFontFamily = cellStyle.fontFamily || "宋体";
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

      // 获取第一个单元格的字体
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          const fontFamily = cellStyle.fontFamily || "宋体";
          this.currentFontFamily = fontFamily;
          break;
        }
        break;
      }
    }
  }
};
</script>

<style scoped>
.font-family-tool-dropdown ::v-deep .button-text {
  display: inline-block;
  vertical-align: top;
  width: 28px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-left: 0;
}
</style>
