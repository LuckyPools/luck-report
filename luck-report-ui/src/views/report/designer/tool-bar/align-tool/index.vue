<template>
  <ButtonGroup
      :iconClass="'info-button iconfont' + currentIcon"
      :title="$t('tools.alignLeft.upDownAlign')"
      :menuItems="menuItems"
  />
</template>

<script>
import { undoManager, setDirty } from '@/utils/table.js';
import { showAlert } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import ButtonGroup from '@/components/button-group/index.vue';
import { mapGetters } from 'vuex';
import {getCell, setCell} from "@/utils/contextActions";

export default {
  name: 'AlignTopTool',
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
      currentAlign: 'middle',
      menuItems: [
        {
          text: this.$t('tools.alignTop.topAlign'),
          icon: 'iconfont icon-justify-top',
          action: () => this.handleAlignTop()
        },
        {
          text: this.$t('tools.alignTop.middleAlign'),
          icon: 'iconfont icon-justify',
          action: () => this.handleAlignMiddle()
        },
        {
          text: this.$t('tools.alignTop.bottomAlign'),
          icon: 'iconfont icon-justify-bottom',
          action: () => this.handleAlignBottom()
        }
      ]
    };
  },
  computed: {
    ...mapGetters('report', ['getContext']),
    context() {
      return this.getContext;
    },
    currentIcon() {
      const iconMap = {
        'top': 'iconfont icon-justify-top',
        'middle': 'iconfont icon-justify',
        'bottom': 'iconfont icon-justify-bottom'
      };
      return iconMap[this.currentAlign] || iconMap['left'];
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
      const selected = this.context.hot.getSelected();
      if (!selected || selected.length === 0) {
        showAlert(this.$t('selectTargetCellFirst'));
        return false;
      }
      return true;
    },
    // 处理顶部对齐
    handleAlignTop() {
      if (!this.checkSelection()) {
        return;
      }
      this.applyAlign('top');
      this.currentAlign = 'top';
    },
    // 处理中间对齐
    handleAlignMiddle() {
      if (!this.checkSelection()) {
        return;
      }
      this.applyAlign('middle');
      this.currentAlign = 'middle';
    },
    // 处理底部对齐
    handleAlignBottom() {
      if (!this.checkSelection()) {
        return;
      }
      this.applyAlign('bottom');
      this.currentAlign = 'bottom';
    },
    // 应用对齐方式
    applyAlign(align) {
      const oldAligns = this.buildCellAlign(align);

      // 添加到撤销管理器
      undoManager.add({
        undo: () => {
          this.buildCellAlign(null, oldAligns);
          setDirty();
        },
        redo: () => {
          this.buildCellAlign(align);
          setDirty();
        }
      });

      setDirty();
    },
    // 构建单元格对齐
    buildCellAlign(align, prevAligns) {
      const oldAligns = {};
      const selected = this.context.hot.getSelected();
      let startRow = selected[0], startCol = selected[1], endRow = selected[2], endCol = selected[3];

      if (startRow > endRow) {
        [startRow, endRow] = [endRow, startRow];
      }
      if (startCol > endCol) {
        [startCol, endCol] = [endCol, startCol];
      }

      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          let cellDef = getCell(i, j);
          let td = this.context.hot.getCell(i, j);

          if (!cellDef) {
            continue;
          }

          const newCellDef = deepCopy(cellDef);
          const cellStyle = newCellDef.cellStyle;
          oldAligns[i + "," + j] = cellStyle.valign || "";

          if (prevAligns) {
            align = prevAligns[i + "," + j];
          }

          if (td) {
            td.style.verticalAlign = align;
          }

          cellStyle.valign = align;
          setCell( i, j, newCellDef );
        }
      }

      return oldAligns;
    },
    // 刷新工具状态
    refresh(startRow, startCol, endRow, endCol) {
      if (startRow > endRow) {
        [startRow, endRow] = [endRow, startRow];
      }
      if (startCol > endCol) {
        [startCol, endCol] = [endCol, startCol];
      }

      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          let cellDef = getCell(i, j);
          if (!cellDef) {
            continue;
          }

          let cellStyle = cellDef.cellStyle;
          const valign = cellStyle.valign || "top";
          this.currentAlign = valign;
          break;
        }
        break;
      }
    }
  }
};
</script>

<style scoped>
.align-top-tool-dropdown {
  position: relative;
  display: inline-block;
}
</style>
