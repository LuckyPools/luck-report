<template>
  <div class="u-inline">
    <ButtonGroup
      iconClass="iconfont icon-pie-chart"
      :title="$t('tools.chart.chart')"
      :menuItems="menuItems"
    />
  </div>
</template>

<script>
import { undoManager, setDirty } from '@/utils/table.js';
import Handsontable from 'handsontable';
import { showAlert } from '@/utils/comnon.js';
import { deepCopy } from '@/components/utils/index.js';
import ButtonGroup from '@/components/button-group/index.vue';
import {getCell, setCell} from "@/utils/contextActions";
import TableManager from '@/views/report/designer/edit-table/manager.js';

export default {
  name: 'ChartTool',
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
      menuItems: [
        {
          text: this.$t('tools.chart.pie'),
          icon: 'iconfont icon-pie-chart',
          action: () => this.handleChartClick('pie')
        },
        {
          text: this.$t('tools.chart.doughnut'),
          icon: 'iconfont icon-doughnut',
          action: () => this.handleChartClick('doughnut')
        },
        {
          text: this.$t('tools.chart.line'),
          icon: 'iconfont icon-line',
          action: () => this.handleChartClick('line')
        },
        {
          text: this.$t('tools.chart.bar'),
          icon: 'iconfont icon-bar',
          action: () => this.handleChartClick('bar')
        },
        {
          text: this.$t('tools.chart.horizontalBar'),
          icon: 'iconfont icon-horizontal-bar',
          action: () => this.handleChartClick('horizontalBar')
        },
        {
          text: this.$t('tools.chart.area'),
          icon: 'iconfont icon-area',
          action: () => this.handleChartClick('area')
        },
        {
          text: this.$t('tools.chart.radar'),
          icon: 'iconfont icon-radar',
          action: () => this.handleChartClick('radar')
        },
        {
          text: this.$t('tools.chart.polar'),
          icon: 'iconfont icon-polar',
          action: () => this.handleChartClick('polarArea')
        },
        {
          text: this.$t('tools.chart.scatter'),
          icon: 'iconfont icon-scatter',
          action: () => this.handleChartClick('scatter')
        },
        {
          text: this.$t('tools.chart.bubble'),
          icon: 'iconfont icon-bubble',
          action: () => this.handleChartClick('bubble')
        }
      ]
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
    // 处理图表点击事件
    handleChartClick(category) {
      if (!this.checkSelection()) {
        return;
      }

      const hot = TableManager.get();
      const selected = hot.getSelected();
      const [startRow, startCol, endRow, endCol] = selected[0];
      const cellDef = getCell(startRow, startCol);
      const oldValue = cellDef.value;
      const oldCellData = hot.getDataAtCell(startRow, startCol);

      const newCellDef = deepCopy(cellDef);
      hot.setDataAtCell(startRow, startCol, '');
      newCellDef.value = {
        type: 'chart',
        chart: this.newChart(category)
      };
      setCell(startRow, startCol, newCellDef );
      hot.render();
      setDirty();
      Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);

      undoManager.add({
        redo: () => {
          const currentCellDef = getCell(startRow, startCol);
          const redoNewCellDef = deepCopy(currentCellDef);
          hot.setDataAtCell(startRow, startCol, '');
          redoNewCellDef.value = {
            type: 'chart',
            chart: this.newChart(category)
          };
          setCell(startRow, startCol, redoNewCellDef );
          hot.render();
          setDirty();
          Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);
        },
        undo: () => {
          const undoCellDef = getCell(startRow, startCol);
          const undoNewCellDef = deepCopy(undoCellDef);
          undoNewCellDef.value = oldValue;
          setCell(startRow,startCol, undoNewCellDef);
          hot.setDataAtCell(startRow, startCol, oldCellData);
          hot.render();
          setDirty();
          Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);
        }
      });
    },
    // 创建新的图表对象
    newChart(category) {
      return {
        dataset: {
          type: category
        }
      };
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

      // 检查第一个单元格是否包含图表
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
          const cellDef = getCell(i, j);

          if (!cellDef) {
            continue;
          }

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
