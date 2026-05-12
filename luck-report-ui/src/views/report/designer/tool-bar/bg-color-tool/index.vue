<template>
  <div class="u-inline">
    <u-color-picker
      v-model="selectedColor"
      :before-toggle="checkSelection"
      @change="onColorChange"
    >
      <u-button
        type="info"
        native-type="button"
        class="bg-color-btn"
        :title="$t('tools.bgColor.bgColor')"
      >
        <div class="icon-wrapper">
          <i class="iconfont icon-background"></i>
          <span class="color-indicator" :style="{ backgroundColor: displayColor }"></span>
        </div>
      </u-button>
    </u-color-picker>
  </div>
</template>

<script>
import { undoManager, setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import {getCell, setCell} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager.js';
import UButton from "@/components/button/index.vue";
import UColorPicker from "@/components/color-picker/index.vue";

export default {
  name: 'BgColorTool',
  components: {
    UButton,
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
      selectedColor: '#FFFFFF'
    };
  },
  computed: {
    displayColor() {
      return this.selectedColor || '#FFFFFF';
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
    checkSelection() {
      const hot = TableManager.get();
      const selected = hot.getSelected();
      if (!selected || selected.length === 0) {
        showAlert(this.$t('selectTargetCellFirst'));
        return false;
      }
      return true;
    },

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
        let [startRow, startCol, endRow, endCol] = selected[0];

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

    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    },

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
        }
      }

      return oldBgColorStyle;
    },

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

    rgbToHex(r, g, b) {
      return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('').toUpperCase();
    },

    refresh(startRow, startCol, endRow, endCol) {
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
.bg-color-btn {
  border: none;
  padding: 0 10px;
}

.icon-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.icon-wrapper .iconfont {
  font-size: 16px;
  line-height: 1;
}

.color-indicator {
  width: 14px;
  height: 3px;
  margin-top: 1px;
  border-radius: 1px;
}
</style>
