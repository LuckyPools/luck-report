<template>
  <div class="tool-btn-group">
    <div @click="handlePickerClick">
      <UColorPicker
        v-model="selectedColor"
        @input="onColorChange"
        :title="$t('tools.bgColor.bgColor')"
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
import {getCell, setCell} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager.js';

export default {
  name: 'BgColorTool',
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
      currentColor: '255,255,255',
      selectedColor: '#FFFFFF',
      isDropdownOpen: false,
      isSelectionValid: false
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
    // 处理颜色选择器点击事件
    handlePickerClick() {
      this.isSelectionValid = this.checkSelection();
    },

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

    // 颜色选择改变时的回调
    onColorChange(color) {
      if (!this.checkSelection()) {
        return;
      }

      // 将十六进制颜色转换为RGB格式
      const rgb = this.hexToRgb(color);
      if (rgb) {
        const rgbStr = `${rgb.r},${rgb.g},${rgb.b}`;
        this.currentColor = rgbStr;

        const table = TableManager.get();
        const selected = table.getSelected();
        let startRow = selected[0], startCol = selected[1], endRow = selected[2], endCol = selected[3];

        // 确保正确的行列范围
        if (startRow > endRow) {
          [startRow, endRow] = [endRow, startRow];
        }
        if (startCol > endCol) {
          [startCol, endCol] = [endCol, startCol];
        }

        // 更新单元格背景色样式
        const oldBgColorStyle = this.updateCellsBgColorStyle(startRow, startCol, endRow, endCol, rgbStr);
        table.render();

        // 添加撤销操作
        undoManager.add({
          redo: () => {
            this.updateCellsBgColorStyle(startRow, startCol, endRow, endCol, rgbStr);
            table.render();
            setDirty();
          },
          undo: () => {
            this.restoreBgColorStyle(startRow, startCol, endRow, endCol, oldBgColorStyle);
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

    // 更新单元格背景色样式
    updateCellsBgColorStyle(startRow, startCol, endRow, endCol, color) {
      const oldBgColorStyle = {};

      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          oldBgColorStyle[i + ',' + j] = cellStyle.bgcolor;
          cellStyle.bgcolor = color;
          setCell( i, j, newCellDef );

          this.currentColor = color;
        }
      }

      return oldBgColorStyle;
    },

    // 恢复背景色样式
    restoreBgColorStyle(startRow, startCol, endRow, endCol, oldBgColorStyle) {
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          cellStyle.bgcolor = oldBgColorStyle[i + ',' + j];
          setCell( i, j, newCellDef );

          if (i === startRow && j === startCol) {
            this.currentColor = cellStyle.bgcolor || '255,255,255';
            const rgbParts = this.currentColor.split(',');
            if (rgbParts.length === 3) {
              this.selectedColor = this.rgbToHex(
                parseInt(rgbParts[0]),
                parseInt(rgbParts[1]),
                parseInt(rgbParts[2])
              );
            } else {
              this.selectedColor = '#FFFFFF';
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
      // 更新选择状态
      this.isSelectionValid = this.checkSelection();

      // 确保正确的行列范围
      if (startRow > endRow) {
        [startRow, endRow] = [endRow, startRow];
      }
      if (startCol > endCol) {
        [startCol, endCol] = [endCol, startCol];
      }

      // 获取第一个单元格的背景色
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          this.currentColor = cellStyle.bgcolor || '255,255,255';

          // 同步更新颜色选择器的值
          const rgbParts = this.currentColor.split(',');
          if (rgbParts.length === 3) {
            this.selectedColor = this.rgbToHex(
              parseInt(rgbParts[0]),
              parseInt(rgbParts[1]),
              parseInt(rgbParts[2])
            );
          } else {
            this.selectedColor = '#FFFFFF';
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
