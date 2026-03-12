<template>
  <div class="tool-btn-group">
    <div @click="handlePickerClick">
      <UColorPicker
        v-model="selectedColor"
        @input="onColorChange"
        :title="$t('tools.foreColor.color')"
        :disabled="!isSelectionValid"
      >
      </UColorPicker>
    </div>
  </div>
</template>

<script>
import { undoManager, setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import UColorPicker from "@/components/color-picker/index.vue";
import { mapGetters } from 'vuex';
import {getCell, setCell} from "@/utils/contextActions";

export default {
  name: 'ForecolorTool',
  components: {
    UColorPicker
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
      currentColor: '0,0,0',
      selectedColor: '#000000',
      isDropdownOpen: false,
      isSelectionValid: false
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

    // 处理颜色选择器点击事件
    handlePickerClick() {
      this.isSelectionValid = this.checkSelection();
    },

    // 检查是否有选中的单元格
    checkSelection() {
      const selected = this.context.hot.getSelected();
      if (!selected || selected.length === 0) {
        showAlert(this.$t('selectTargetCellFirst'));
        return false;
      }
      return true;
    },

    // 颜色选择改变时的回调
    onColorChange(color) {
      if (!this.checkSelection()) {
        return;
      }

      const rgb = this.hexToRgb(color);
      if (rgb) {
        const rgbStr = `${rgb.r},${rgb.g},${rgb.b}`;
        this.currentColor = rgbStr;

        const table = this.context.hot;
        const selected = table.getSelected();
        let startRow = selected[0], startCol = selected[1], endRow = selected[2], endCol = selected[3];

        if (startRow > endRow) {
          [startRow, endRow] = [endRow, startRow];
        }
        if (startCol > endCol) {
          [startCol, endCol] = [endCol, startCol];
        }

        const oldForeColorStyle = this.updateCellsForeColorStyle(startRow, startCol, endRow, endCol, rgbStr);
        table.render();

        // 添加撤销操作
        undoManager.add({
          redo: () => {
            this.updateCellsForeColorStyle(startRow, startCol, endRow, endCol, rgbStr);
            table.render();
            setDirty();
          },
          undo: () => {
            this.restoreForeColorStyle(startRow, startCol, endRow, endCol, oldForeColorStyle);
            table.render();
            setDirty();
          }
        });

        setDirty();
      }
    },

    // 将十六进制颜色转换为RGB对象
    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    },

    // 更新单元格前景色样式
    updateCellsForeColorStyle(startRow, startCol, endRow, endCol, color) {
      const oldForeColorStyle = {};

      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          oldForeColorStyle[i + ',' + j] = cellStyle.forecolor;
          cellStyle.forecolor = color;
          setCell( i, j, newCellDef );
        }
      }

      return oldForeColorStyle;
    },

    // 恢复前景色样式
    restoreForeColorStyle(startRow, startCol, endRow, endCol, oldForeColorStyle) {
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          cellStyle.forecolor = oldForeColorStyle[i + ',' + j];
          setCell( i, j, newCellDef );

          if (i === startRow && j === startCol) {
            this.currentColor = cellStyle.forecolor || '0,0,0';
            const rgbParts = this.currentColor.split(',');
            if (rgbParts.length === 3) {
              this.selectedColor = this.rgbToHex(
                parseInt(rgbParts[0]),
                parseInt(rgbParts[1]),
                parseInt(rgbParts[2])
              );
            } else {
              this.selectedColor = '#000000';
            }
          }
        }
      }
    },

    // 将RGB值转换为十六进制颜色
    rgbToHex(r, g, b) {
      return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('').toUpperCase();
    },

    // 刷新工具状态
    refresh(startRow, startCol, endRow, endCol) {
      this.isSelectionValid = this.checkSelection();

      if (startRow > endRow) {
        [startRow, endRow] = [endRow, startRow];
      }
      if (startCol > endCol) {
        [startCol, endCol] = [endCol, startCol];
      }

      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          this.currentColor = cellStyle.forecolor || '0,0,0';

          const rgbParts = this.currentColor.split(',');
          if (rgbParts.length === 3) {
            this.selectedColor = this.rgbToHex(
              parseInt(rgbParts[0]),
              parseInt(rgbParts[1]),
              parseInt(rgbParts[2])
            );
          } else {
            this.selectedColor = '#000000';
          }

          return;
        }
      }
    }
  }
};
</script>

<style scoped>
</style>
