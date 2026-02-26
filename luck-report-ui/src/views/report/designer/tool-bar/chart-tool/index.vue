<template>
  <div class="tool-btn-group">
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
import ButtonGroup from '@/components/button-group/index.vue';

export default {
  name: 'ChartTool',
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
    // 处理图表点击事件
    handleChartClick(category) {
      if (!this.checkSelection()) {
        return;
      }

      const hot = this.context.hot;
      const selected = hot.getSelected();
      const startRow = selected[0], startCol = selected[1], endRow = selected[2], endCol = selected[3];
      let cellDef = this.context.getCell(startRow, startCol);
      let oldValue = cellDef.value, oldCellData = hot.getDataAtCell(startRow, startCol);

      hot.setDataAtCell(startRow, startCol, '');
      cellDef.value = {
        type: 'chart',
        chart: this.newChart(category)
      };
      hot.render();
      setDirty();
      Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);

      undoManager.add({
        redo: () => {
          cellDef = this.context.getCell(startRow, startCol);
          oldValue = cellDef.value;
          oldCellData = hot.getDataAtCell(startRow, startCol);
          hot.setDataAtCell(startRow, startCol, '');
          cellDef.value = {
            type: 'chart',
            chart: this.newChart(category)
          };
          hot.render();
          setDirty();
          Handsontable.hooks.run(hot, 'afterSelectionEnd', startRow, startCol, endRow, endCol);
        },
        undo: () => {
          cellDef = this.context.getCell(startRow, startCol);
          cellDef.value = oldValue;
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
          const cellDef = this.context.getCell(i, j);

          if (!cellDef) {
            continue;
          }

          // 如果单元格包含图表，可以在这里更新状态
          // 目前图表工具没有状态需要更新，但保留此方法以保持一致性
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
