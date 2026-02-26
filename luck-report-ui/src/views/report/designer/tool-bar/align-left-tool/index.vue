<template>
  <ButtonGroup
      :iconClass="'info-button iconfont' + currentIcon"
      :title="$t('tools.alignLeft.leftRightAlign')"
      :menuItems="menuItems"
  />
</template>

<script>
import { undoManager, setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import ButtonGroup from '@/components/button-group/index.vue';

export default {
  name: 'AlignLeftTool',
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
      currentAlign: 'left', // 默认左对齐
      menuItems: [
        {
          text: this.$t('tools.alignLeft.leftAlign'),
          icon: 'iconfont icon-left-align',
          action: () => this.handleAlignLeft()
        },
        {
          text: this.$t('tools.alignLeft.centerAlign'),
          icon: 'iconfont icon-center-align',
          action: () => this.handleAlignCenter()
        },
        {
          text: this.$t('tools.alignLeft.rightAlign'),
          icon: 'iconfont icon-right-align',
          action: () => this.handleAlignRight()
        }
      ]
    };
  },
  computed: {
    // 根据当前对齐方式返回对应的图标
    currentIcon() {
      const iconMap = {
        'left': 'iconfont left-align',
        'center': 'iconfont icon-center-align',
        'right': 'iconfont icon-right-align'
      };
      return iconMap[this.currentAlign] || iconMap['left'];
    }
  },
  methods: {
    // 处理左对齐
    handleAlignLeft() {
      if (!this.checkSelection()) {
        return;
      }

      const oldAligns = this.buildCellAlign('left');

      undoManager.add({
        undo: () => {
          this.buildCellAlign(null, oldAligns);
          setDirty();
        },
        redo: () => {
          this.buildCellAlign('left');
          setDirty();
        }
      });

      setDirty();
      this.currentAlign = 'left';
    },
    // 处理居中对齐
    handleAlignCenter() {
      if (!this.checkSelection()) {
        return;
      }

      const oldAligns = this.buildCellAlign('center');

      undoManager.add({
        undo: () => {
          this.buildCellAlign(null, oldAligns);
          setDirty();
        },
        redo: () => {
          this.buildCellAlign('center');
          setDirty();
        }
      });

      setDirty();
      this.currentAlign = 'center';
    },
    // 处理右对齐
    handleAlignRight() {
      if (!this.checkSelection()) {
        return;
      }

      const oldAligns = this.buildCellAlign('right');

      undoManager.add({
        undo: () => {
          this.buildCellAlign(null, oldAligns);
          setDirty();
        },
        redo: () => {
          this.buildCellAlign('right');
          setDirty();
        }
      });

      setDirty();
      this.currentAlign = 'right';
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
    // 构建单元格对齐方式
    buildCellAlign(align, prevAligns) {
      const oldAligns = {};
      const selected = this.context.hot.getSelected();
      let startRow = selected[0], startCol = selected[1], endRow = selected[2], endCol = selected[3];

      // 确保startRow <= endRow和startCol <= endCol
      if (startRow > endRow) {
        [startRow, endRow] = [endRow, startRow];
      }
      if (startCol > endCol) {
        [startCol, endCol] = [endCol, startCol];
      }

      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = this.context.getCell(i, j);
          const td = this.context.hot.getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          oldAligns[`${i},${j}`] = cellStyle.align || "";

          if (prevAligns) {
            align = prevAligns[`${i},${j}`];
          }

          // 使用原生JavaScript设置样式，替代jQuery的css方法
          if (td) {
            td.style.textAlign = align;
          }

          cellStyle.align = align;
        }
      }

      return oldAligns;
    },
    // 兼容原有工具接口
    refresh(startRow, startCol, endRow, endCol) {
      // 确保startRow <= endRow和startCol <= endCol
      if (startRow > endRow) {
        [startRow, endRow] = [endRow, startRow];
      }
      if (startCol > endCol) {
        [startCol, endCol] = [endCol, startCol];
      }

      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = this.context.getCell(i, j);
          if (!cellDef) {
            continue;
          }

          const cellStyle = cellDef.cellStyle;
          const align = cellStyle.align || "left";
          this.currentAlign = align;
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
