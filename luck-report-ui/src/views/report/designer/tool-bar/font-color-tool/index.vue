<template>
  <div class="tool-btn-group">
    <div class="font-color-picker" @click="handlePickerClick">
      <u-button
        type="info"
        native-type="button"
        class="font-color-btn"
        :title="$t('tools.foreColor.color')"
      >
        <div class="icon-wrapper">
          <i class="iconfont icon-font-color"></i>
          <span class="color-indicator" :style="{ backgroundColor: displayColor }"></span>
        </div>
      </u-button>
      <div class="color-picker-popover" v-if="pickerVisible" ref="popover">
        <sketch-picker
          :value="colors"
          @input="updateColor"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { Sketch } from 'vue-color'
import { undoManager, setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import {getCell, setCell} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager.js';
import UButton from "@/components/button/index.vue";

export default {
  name: 'FontColorTool',
  components: {
    UButton,
    'sketch-picker': Sketch
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
      pickerVisible: false,
      colors: {
        hex: '#000000',
        hsl: { h: 0, s: 0, l: 0, a: 1 },
        hsv: { h: 0, s: 0, v: 0, a: 1 },
        rgba: { r: 0, g: 0, b: 0, a: 1 },
        a: 1
      }
    };
  },
  computed: {
    displayColor() {
      return this.selectedColor || '#000000';
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
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    handlePickerClick(event) {
      if (!this.checkSelection()) {
        return;
      }
      event.stopPropagation();
      this.pickerVisible = !this.pickerVisible;
    },

    handleClickOutside(event) {
      if (this.pickerVisible && this.$el && !this.$el.contains(event.target)) {
        this.pickerVisible = false;
      }
    },

    checkSelection() {
      const hot = TableManager.get();
      const selected = hot.getSelected();
      if (!selected || selected.length === 0) {
        showAlert(this.$t('selectTargetCellFirst'));
        return false;
      }
      return true;
    },

    updateColor(val) {
      this.colors = val;
      this.selectedColor = val.hex;
      this.onColorChange(val.hex);
      this.pickerVisible = false;
    },

    onColorChange(color) {
      if (!this.checkSelection()) {
        return;
      }

      const rgb = this.hexToRgb(color);
      if (rgb) {
        const rgbStr = `${rgb.r},${rgb.g},${rgb.b}`;
        this.currentColor = rgbStr;

        const table = TableManager.get();
        const selected = table.getSelected();
        let [startRow, startCol, endRow, endCol] = selected[0];

        if (startRow > endRow) {
          [startRow, endRow] = [endRow, startRow];
        }
        if (startCol > endCol) {
          [startCol, endCol] = [endCol, startCol];
        }

        const oldForeColorStyle = this.updateCellsForeColorStyle(startRow, startCol, endRow, endCol, rgbStr);
        table.render();

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

    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    },

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

    rgbToHex(r, g, b) {
      return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('').toUpperCase();
    },

    refresh(startRow, startCol, endRow, endCol) {
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
            this.colors.hex = this.selectedColor;
          } else {
            this.selectedColor = '#000000';
            this.colors.hex = '#000000';
          }

          return;
        }
      }
    }
  }
};
</script>

<style scoped>
.font-color-picker {
  position: relative;
  display: inline-block;
}

.font-color-btn {
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

.color-picker-popover {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 9999;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.vc-sketch {
  position: relative;
  width: 200px;
  padding: 0;
  box-sizing: initial;
  background: #fff;
  border-radius: 4px;
  box-shadow: none;
}
</style>
