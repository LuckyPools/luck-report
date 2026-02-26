<template>
  <div class="tool-btn-group">
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
import ButtonGroup from '@/components/button-group/index.vue';

export default {
  name: 'FontFamilyTool',
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
    // 应用选定的字体
    applyFontFamily(fontFamily) {
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
          const cellDef = this.context.getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          oldFontFamily[i + ',' + j] = cellStyle.fontFamily;
          cellStyle.fontFamily = fontFamily;
        }
      }

      // 更新当前显示的字体
      this.currentFontFamily = fontFamily;

      return oldFontFamily;
    },
    // 恢复字体
    restoreFontFamily(startRow, startCol, endRow, endCol, oldFontFamily) {
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = this.context.getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          cellStyle.fontFamily = oldFontFamily[i + ',' + j];

          // 更新当前显示的字体为第一个单元格的字体
          if (i === startRow && j === startCol) {
            this.currentFontFamily = cellStyle.fontFamily || "宋体";
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

      // 获取第一个单元格的字体
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = this.context.getCell(i, j);

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
</style>
