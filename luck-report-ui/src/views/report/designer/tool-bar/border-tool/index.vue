<template>
  <div class="tool-btn-group">
    <ButtonGroup
      iconClass="iconfont icon-no-border"
      :title="$t('tools.border.borderLine')"
      :customClass="'border-tool-dropdown'"
      :menuItems="menuItems"
    />

    <!-- 自定义边框对话框 -->
    <CustomBorderDialog
      :visible="customBorderVisible"
      :topBorder="customBorderData.topBorder"
      :bottomBorder="customBorderData.bottomBorder"
      :leftBorder="customBorderData.leftBorder"
      :rightBorder="customBorderData.rightBorder"
      @close="customBorderVisible = false"
      @save="handleSave"
    />
  </div>
</template>

<script>
import { undoManager, setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import CustomBorderDialog from '@/views/report/designer/tool-bar/border-tool/custom-border-dialog/index.vue';
import ButtonGroup from '@/components/button-group/index.vue';
import { mapGetters } from 'vuex';
import {getCell, setCell} from "@/utils/contextActions";

export default {
  name: 'BorderTool',
  components: {
    CustomBorderDialog,
    ButtonGroup
  },
  data() {
    return {
      customBorderVisible: false,
      customBorderData: {
        topBorder: { style: 'solid', width: 1, color: '#000000' },
        bottomBorder: { style: 'solid', width: 1, color: '#000000' },
        leftBorder: { style: 'solid', width: 1, color: '#000000' },
        rightBorder: { style: 'solid', width: 1, color: '#000000' }
      },
      menuItems: [
        {
          text: this.$t('tools.border.allLine'),
          icon: 'iconfont icon-full-border',
          action: () => this.handleFullBorder()
        },
        {
          text: this.$t('tools.border.noBorder'),
          icon: 'iconfont icon-no-border',
          action: () => this.handleNoBorder()
        },
        {
          text: this.$t('tools.border.leftBorder'),
          icon: 'iconfont icon-left-border',
          action: () => this.handleLeftBorder()
        },
        {
          text: this.$t('tools.border.rightBorder'),
          icon: 'iconfont icon-right-border',
          action: () => this.handleRightBorder()
        },
        {
          text: this.$t('tools.border.topBorder'),
          icon: 'iconfont icon-top-border',
          action: () => this.handleTopBorder()
        },
        {
          text: this.$t('tools.border.bottomBorder'),
          icon: 'iconfont icon-bottom-border',
          action: () => this.handleBottomBorder()
        },
        {
          text: this.$t('tools.border.customBorder'),
          icon: 'iconfont icon-full-border',
          action: () => this.handleCustomBorder()
        }
      ]
    };
  },
  computed: {
      ...mapGetters('report', ['getContext']),
      context() {
          return this.getContext;
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
    // 处理全边框
    handleFullBorder() {
      if (!this.checkSelection()) {
        return;
      }

      const table = this.context.hot;
      const selected = table.getSelected();
      let startRow = selected[0], startCol = selected[1], endRow = selected[2], endCol = selected[3];

      if (startRow > endRow) {
        [startRow, endRow] = [endRow, startRow];
      }
      if (startCol > endCol) {
        [startCol, endCol] = [endCol, startCol];
      }

      const newBorder = {
        width: 1,
        color: '0,0,0',
        style: 'solid'
      };

      const oldBorderStyle = this.updateBorderStyles(startRow, startCol, endRow, endCol, newBorder);
      table.render();

      undoManager.add({
        redo: () => {
          this.updateBorderStyles(startRow, startCol, endRow, endCol, newBorder);
          table.render();
          setDirty();
        },
        undo: () => {
          this.updateOldBorderStyles(startRow, startCol, endRow, endCol, oldBorderStyle);
          setDirty();
        }
      });

      setDirty();
    },
    // 处理无边框
    handleNoBorder() {
      if (!this.checkSelection()) {
        return;
      }

      const table = this.context.hot;
      const selected = table.getSelected();
      let startRow = selected[0], startCol = selected[1], endRow = selected[2], endCol = selected[3];

      if (startRow > endRow) {
        [startRow, endRow] = [endRow, startRow];
      }
      if (startCol > endCol) {
        [startCol, endCol] = [endCol, startCol];
      }

      const newBorder = '';
      const oldBorderStyle = this.updateBorderStyles(startRow, startCol, endRow, endCol, newBorder);
      table.render();

      undoManager.add({
        redo: () => {
          this.updateBorderStyles(startRow, startCol, endRow, endCol, newBorder);
          table.render();
          setDirty();
        },
        undo: () => {
          this.updateOldBorderStyles(startRow, startCol, endRow, endCol, oldBorderStyle);
          setDirty();
        }
      });

      setDirty();
    },
    // 处理左边框
    handleLeftBorder() {
      this.applyBorder('left');
    },
    // 处理右边框
    handleRightBorder() {
      this.applyBorder('right');
    },
    // 处理上边框
    handleTopBorder() {
      this.applyBorder('top');
    },
    // 处理下边框
    handleBottomBorder() {
      this.applyBorder('bottom');
    },
    // 应用边框
    applyBorder(target) {
      if (!this.checkSelection()) {
        return;
      }

      const table = this.context.hot;
      const selected = table.getSelected();
      let startRow = selected[0], startCol = selected[1], endRow = selected[2], endCol = selected[3];

      if (startRow > endRow) {
        [startRow, endRow] = [endRow, startRow];
      }
      if (startCol > endCol) {
        [startCol, endCol] = [endCol, startCol];
      }

      const newBorder = {
        width: 1,
        color: '0,0,0',
        style: 'solid'
      };

      const oldBorderStyle = this.updateBorderStyles(startRow, startCol, endRow, endCol, newBorder, target);
      table.render();

      undoManager.add({
        redo: () => {
          this.updateBorderStyles(startRow, startCol, endRow, endCol, newBorder, target);
          table.render();
          setDirty();
        },
        undo: () => {
          this.updateOldBorderStyles(startRow, startCol, endRow, endCol, oldBorderStyle);
          setDirty();
        }
      });

      setDirty();
    },
    // 处理自定义边框
    handleCustomBorder() {
      if (!this.checkSelection()) {
        return;
      }

      const selected = this.context.hot.getSelected();
      const startRow = selected[0], startCol = selected[1];
      const cellDef = getCell(startRow, startCol);

      const defaultBorderStyle = { style: 'solid', width: 1, color: '#000000' };

      const convertColorToHex = (borderStyle) => {
        if (!borderStyle) {
          return { ...defaultBorderStyle };
        }
        const result = { ...borderStyle };
        if (typeof result.color === 'string' && result.color.includes(',')) {
          const rgb = result.color.split(',');
          result.color = this.rgbToHex(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
        }
        return result;
      };

      if (cellDef && cellDef.cellStyle) {
        this.customBorderData.topBorder = convertColorToHex(cellDef.cellStyle.topBorder);
        this.customBorderData.bottomBorder = convertColorToHex(cellDef.cellStyle.bottomBorder);
        this.customBorderData.leftBorder = convertColorToHex(cellDef.cellStyle.leftBorder);
        this.customBorderData.rightBorder = convertColorToHex(cellDef.cellStyle.rightBorder);
      } else {
        this.customBorderData.topBorder = { ...defaultBorderStyle };
        this.customBorderData.bottomBorder = { ...defaultBorderStyle };
        this.customBorderData.leftBorder = { ...defaultBorderStyle };
        this.customBorderData.rightBorder = { ...defaultBorderStyle };
      }

      this.customBorderVisible = true;
    },
    handleSave(topBorder, bottomBorder, leftBorder, rightBorder) {
      const selected = this.context.hot.getSelected();
      const startRow = selected[0], startCol = selected[1], endRow = selected[2], endCol = selected[3];

      let oldBorderStyle = this.updateCustomBorderStyle(
        this.context, startRow, startCol, endRow, endCol,
        leftBorder, rightBorder, topBorder, bottomBorder
      );

      undoManager.add({
        redo: () => {
          oldBorderStyle = this.updateCustomBorderStyle(
            this.context, startRow, startCol, endRow, endCol,
            leftBorder, rightBorder, topBorder, bottomBorder
          );
          setDirty();
        },
        undo: () => {
          this.updateOldBorderStyles(this.context, startRow, startCol, endRow, endCol, oldBorderStyle);
          setDirty();
        }
      });

      setDirty();
    },
    rgbToHex(r, g, b) {
      return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    },
    // 更新自定义边框样式
    updateCustomBorderStyle(context, startRow, startCol, endRow, endCol, leftBorderStyle, rightBorderStyle, topBorderStyle, bottomBorderStyle) {
      const hot = context.hot;
      let left = leftBorderStyle, right = rightBorderStyle, top = topBorderStyle, bottom = bottomBorderStyle;

      if (leftBorderStyle.style === 'none') {
        left = "";
      }
      if (rightBorderStyle.style === 'none') {
        right = "";
      }
      if (topBorderStyle.style === 'none') {
        top = "";
      }
      if (bottomBorderStyle.style === 'none') {
        bottom = "";
      }

      const oldBorderStyle = {};

      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          oldBorderStyle[i + "," + j] = {
            leftBorder: cellStyle.leftBorder,
            rightBorder: cellStyle.rightBorder,
            topBorder: cellStyle.topBorder,
            bottomBorder: cellStyle.bottomBorder
          };

          cellStyle.leftBorder = this.cloneBorder(left);
          cellStyle.rightBorder = this.cloneBorder(right);
          cellStyle.topBorder = this.cloneBorder(top);
          cellStyle.bottomBorder = this.cloneBorder(bottom);

          setCell( i, j, newCellDef );
        }
      }

      hot.render();
      return oldBorderStyle;
    },
    // 克隆边框对象
    cloneBorder(border) {
      if (border && border !== "") {
        const text = JSON.stringify(border);
        return JSON.parse(text);
      } else {
        return border;
      }
    },
    // 更新旧边框样式
    updateOldBorderStyles(context, startRow, startCol, endRow, endCol, oldBorderStyle) {
      const hot = context.hot;

      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const oldBorder = oldBorderStyle[i + "," + j];
          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;

          cellStyle.leftBorder = oldBorder.leftBorder || "";
          cellStyle.rightBorder = oldBorder.rightBorder || "";
          cellStyle.topBorder = oldBorder.topBorder || "";
          cellStyle.bottomBorder = oldBorder.bottomBorder || "";

          setCell( i, j, newCellDef );
        }
      }

      hot.render();
    },
    // 更新边框样式
    updateBorderStyles(startRow, startCol, endRow, endCol, newBorder, target) {
      const oldStyle = {};
      const hot = this.context.hot;

      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          oldStyle[i + "," + j] = {
            leftBorder: cellStyle.leftBorder,
            rightBorder: cellStyle.rightBorder,
            topBorder: cellStyle.topBorder,
            bottomBorder: cellStyle.bottomBorder
          };

          if (!target) {
            cellStyle.leftBorder = newBorder;
            cellStyle.rightBorder = newBorder;
            cellStyle.topBorder = newBorder;
            cellStyle.bottomBorder = newBorder;
          } else if (target === 'left') {
            cellStyle.leftBorder = newBorder;
            cellStyle.rightBorder = '';
            cellStyle.topBorder = '';
            cellStyle.bottomBorder = '';
          } else if (target === 'right') {
            cellStyle.rightBorder = newBorder;
            cellStyle.leftBorder = '';
            cellStyle.topBorder = '';
            cellStyle.bottomBorder = '';
          } else if (target === 'top') {
            cellStyle.topBorder = newBorder;
            cellStyle.leftBorder = '';
            cellStyle.rightBorder = '';
            cellStyle.bottomBorder = '';
          } else if (target === 'bottom') {
            cellStyle.bottomBorder = newBorder;
            cellStyle.leftBorder = '';
            cellStyle.rightBorder = '';
            cellStyle.topBorder = '';
          }

          setCell( i, j, newCellDef );
        }
      }

      return oldStyle;
    }
  }
};
</script>

<style scoped>
</style>
