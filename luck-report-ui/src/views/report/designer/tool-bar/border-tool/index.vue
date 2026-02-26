<template>
  <div class="tool-btn-group">
    <ButtonGroup
      iconClass="iconfont icon-no-border"
      :title="$t('tools.border.borderLine')"
      :customClass="'border-tool-dropdown'"
      :menuItems="menuItems"
    />

    <!-- 自定义边框对话框 -->
    <CustomBorderDialog ref="customBorderDialog" @saveAfter="handleSaveAfter" />
  </div>
</template>

<script>
import { undoManager, setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import CustomBorderDialog from '@/views/report/designer/tool-bar/border-tool/custom-border-dialog/index.vue';
import ButtonGroup from '@/components/button-group/index.vue';

export default {
  name: 'BorderTool',
  components: {
    CustomBorderDialog,
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

      // 确保startRow <= endRow和startCol <= endCol
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

      // 确保startRow <= endRow和startCol <= endCol
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

      // 确保startRow <= endRow和startCol <= endCol
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

      // 获取当前选中单元格的边框样式
      const selected = this.context.hot.getSelected();
      const startRow = selected[0], startCol = selected[1];
      const cellDef = this.context.getCell(startRow, startCol);

      // 默认边框样式
      const defaultBorderStyle = { width: 1, style: 'solid', color: '0,0,0' };

      // 获取当前单元格的边框样式，如果没有则使用默认样式
      let topBorderStyle, bottomBorderStyle, leftBorderStyle, rightBorderStyle;

      if (cellDef && cellDef.cellStyle) {
        topBorderStyle = cellDef.cellStyle.topBorder || defaultBorderStyle;
        bottomBorderStyle = cellDef.cellStyle.bottomBorder || defaultBorderStyle;
        leftBorderStyle = cellDef.cellStyle.leftBorder || defaultBorderStyle;
        rightBorderStyle = cellDef.cellStyle.rightBorder || defaultBorderStyle;
      } else {
        topBorderStyle = { ...defaultBorderStyle };
        bottomBorderStyle = { ...defaultBorderStyle };
        leftBorderStyle = { ...defaultBorderStyle };
        rightBorderStyle = { ...defaultBorderStyle };
      }

      this.showCustomBorderDialog(topBorderStyle, bottomBorderStyle, leftBorderStyle, rightBorderStyle);
    },
    // 显示自定义边框对话框
    showCustomBorderDialog(topBorderStyle, bottomBorderStyle, leftBorderStyle, rightBorderStyle) {
      this.$refs.customBorderDialog.show(
        this.context,
        topBorderStyle, bottomBorderStyle, leftBorderStyle, rightBorderStyle
      );
    },
    // 处理自定义边框保存后事件
    handleSaveAfter(context, topBorder, bottomBorder, leftBorder, rightBorder) {
      const selected = context.hot.getSelected();
      const startRow = selected[0], startCol = selected[1], endRow = selected[2], endCol = selected[3];

      let oldBorderStyle = this.updateCustomBorderStyle(
        context, startRow, startCol, endRow, endCol,
        leftBorder, rightBorder, topBorder, bottomBorder
      );

      undoManager.add({
        redo: () => {
          oldBorderStyle = this.updateCustomBorderStyle(
            context, startRow, startCol, endRow, endCol,
            leftBorder, rightBorder, topBorder, bottomBorder
          );
          setDirty();
        },
        undo: () => {
          this.updateOldBorderStyles(context, startRow, startCol, endRow, endCol, oldBorderStyle);
          setDirty();
        }
      });

      setDirty();
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
          const td = hot.getCell(i, j);
          const cellDef = context.getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
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
          const td = hot.getCell(i, j);
          const cellDef = context.getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const oldBorder = oldBorderStyle[i + "," + j];
          const cellStyle = cellDef.cellStyle;

          cellStyle.leftBorder = oldBorder.leftBorder || "";
          cellStyle.rightBorder = oldBorder.rightBorder || "";
          cellStyle.topBorder = oldBorder.topBorder || "";
          cellStyle.bottomBorder = oldBorder.bottomBorder || "";
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
          const td = hot.getCell(i, j);
          const cellDef = this.context.getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
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
        }
      }

      return oldStyle;
    }
  }
};
</script>

<style scoped>
</style>
