<template>
  <div class="property-panel">
    <!-- 单元格值编辑器组件 -->
    <cell-value-editor
      :show-parent-group="showParentGroup"
      :show-renderer-group="showRendererGroup"
      :show-link-group="showLinkGroup"
      :show-type-group="showTypeGroup"
      :row-index="rowIndex"
      :col-index="colIndex"
      @select-renderer="handleSelectRenderer"
      @cell-type-change="handleCellTypeChange"
    />

    <!-- 表达式值编辑器Vue组件 -->
    <expression-value-editor
      ref="expressionValueEditor"
      v-if="expressionValueEditorVisible"
      :row-index="rowIndex"
      :col-index="colIndex"
      :row2-index="row2Index"
      :col2-index="col2Index"
    />

    <!-- 简单值编辑器Vue组件 -->
    <simple-value-editor
      ref="simpleValueEditor"
      v-if="simpleValueEditorVisible"
      :row-index="rowIndex"
      :col-index="colIndex"
      :row2-index="row2Index"
      :col2-index="col2Index"
    />

    <!-- 数据集值编辑器Vue组件 -->
    <dataset-value-editor
      ref="datasetValueEditor"
      v-if="datasetValueEditorVisible"
      :row-index="rowIndex"
      :col-index="colIndex"
      :row2-index="row2Index"
      :col2-index="col2Index"
    />

    <!-- 图片值编辑器Vue组件 -->
    <image-value-editor
      ref="imageValueEditor"
      v-if="imageValueEditorVisible"
      :row-index="rowIndex"
      :col-index="colIndex"
      :row2-index="row2Index"
      :col2-index="col2Index"
    />

    <!-- 斜线值编辑器Vue组件 -->
    <slash-value-editor
      ref="slashValueEditor"
      v-if="slashValueEditorVisible"
      :row-index="rowIndex"
      :col-index="colIndex"
      :row2-index="row2Index"
      :col2-index="col2Index"
    />

    <!-- 二维码/条形码值编辑器Vue组件 -->
    <zxing-value-editor
      ref="zxingValueEditor"
      v-if="zxingValueEditorVisible"
      :row-index="rowIndex"
      :col-index="colIndex"
      :row2-index="row2Index"
      :col2-index="col2Index"
    />

    <!-- 图表编辑器容器 -->
    <div ref="chartEditorContainer">
      <chart-value-editor
        ref="chartEditor"
        v-for="(chartType, index) in chartEditorTypes"
        :key="index"
        :id="chartType.id"
        :show-axis="chartType.showAxis"
        v-if="currentChartType === chartType.id"
        :row-index="rowIndex"
        :col-index="colIndex"
        :row2-index="row2Index"
        :col2-index="col2Index"
      />
      <bubble-chart-value-editor
        ref="bubbleChartEditor"
        v-if="bubbleChartValueEditorVisible"
        :row-index="rowIndex"
        :col-index="colIndex"
        :row2-index="row2Index"
        :col2-index="col2Index"
      />
      <scatter-chart-value-editor
        ref="scatterChartEditor"
        v-if="scatterChartValueEditorVisible"
        :row-index="rowIndex"
        :col-index="colIndex"
        :row2-index="row2Index"
        :col2-index="col2Index"
      />
    </div>

  </div>
</template>

<script>
import store from '@/store';
import {setDirty} from '@/utils/table.js';
import {deepCopy} from '@/components/utils/index.js';
import {getCell, getCellName, setCell} from "@/utils/contextActions";
import ExpressionValueEditor from './expression-value-editor/index.vue';
import SimpleValueEditor from './simple-value-editor/index.vue';
import DatasetValueEditor from './dataset-value-editor/index.vue';
import ImageValueEditor from './image-value-editor/index.vue';
import SlashValueEditor from './slash-value-editor/index.vue';
import ZxingValueEditor from './zxing-value-editor/index.vue';
import ChartValueEditor from './chart-value-editor/index.vue';
import BubbleChartValueEditor from './bubble-chart-value-editor/index.vue';
import ScatterChartValueEditor from './scatter-chart-value-editor/index.vue';
import CellValueEditor from './cell-value-editor/index.vue';
import CrossTabWidget from '@/views/report/designer/edit-table/cross-tab-widget/class';
import TableManager from '@/views/report/designer/edit-table/manager';

export default {
  name: 'PropertyPanel',
  components: {
    SimpleValueEditor,
    ExpressionValueEditor,
    DatasetValueEditor,
    ImageValueEditor,
    SlashValueEditor,
    ZxingValueEditor,
    ChartValueEditor,
    BubbleChartValueEditor,
    ScatterChartValueEditor,
    CellValueEditor
  },
  props: {
    rowIndex: {
      type: Number,
      default: 0
    },
    colIndex: {
      type: Number,
      default: 0
    },
    row2Index: {
      type: Number,
      default: 0
    },
    col2Index: {
      type: Number,
      default: 0
    },
    refreshTrigger: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      // 显示控制
      showParentGroup: false,
      showRendererGroup: false,
      showLinkGroup: false,
      showTypeGroup: false,

      initialized: false,

      // 编辑器映射
      editorMap: new Map(),
      chartEditorMap: new Map(),

      // 图表编辑器类型配置
      chartEditorTypes: [
        { id: 'bar', showAxis: true },
        { id: 'line', showAxis: true },
        { id: 'horbar', showAxis: true },
        { id: 'area', showAxis: true },
        { id: 'radar', showAxis: false },
        { id: 'polar', showAxis: false },
        { id: 'doughnut', showAxis: false },
        { id: 'pie', showAxis: false }
      ],

      // 当前显示的图表类型
      currentChartType: '',

      // 编辑器可见性控制
      expressionValueEditorVisible: false,
      simpleValueEditorVisible: false,
      datasetValueEditorVisible: false,
      imageValueEditorVisible: false,
      slashValueEditorVisible: false,
      zxingValueEditorVisible: false,
      bubbleChartValueEditorVisible: false,
      scatterChartValueEditorVisible: false
    };
  },
  watch: {
    refreshTrigger() {
      this.refresh();
    }
  },
  mounted() {
  },
  methods: {

    hideAllEditors() {
      this.expressionValueEditorVisible = false;
      this.simpleValueEditorVisible = false;
      this.datasetValueEditorVisible = false;
      this.imageValueEditorVisible = false;
      this.slashValueEditorVisible = false;
      this.zxingValueEditorVisible = false;
      this.bubbleChartValueEditorVisible = false;
      this.scatterChartValueEditorVisible = false;
      this.currentChartType = '';
    },

    /**
     * 刷新属性面板
     */
    refresh() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef) {
        return;
      }

      // 显示所有组
      this.showParentGroup = true;
      this.showTypeGroup = true;
      this.showLinkGroup = true;
      // this.showRendererGroup = true; // 暂时隐藏

      this.initialized = true;

      // 隐藏Vue组件编辑器
      this.currentChartType = '';
      this.expressionValueEditorVisible = false;
      this.simpleValueEditorVisible = false;
      this.datasetValueEditorVisible = false;
      this.imageValueEditorVisible = false;
      this.slashValueEditorVisible = false;
      this.zxingValueEditorVisible = false;
      this.bubbleChartValueEditorVisible = false;
      this.scatterChartValueEditorVisible = false;

      // 加载单元格类型
      let type = cellDef.value.type || 'simple';
      // 显示对应编辑器
      if (type === 'chart') {
        const chartType = cellDef.value.chart.dataset.type;

        // 处理特殊图表类型映射
        let actualChartType = chartType;
        if (chartType === 'horizontalBar') {
          actualChartType = 'horbar';
        } else if (chartType === 'polarArea') {
          actualChartType = 'polar';
        }

        // 检查是否是散点图或气泡图
        if (chartType === 'scatter') {
          // 使用Vue组件显示散点图编辑器
          this.currentChartType = 'scatter';
          this.scatterChartValueEditorVisible = true;
        } else if (chartType === 'bubble') {
          // 使用Vue组件显示气泡图编辑器
          this.currentChartType = 'bubble';
          this.bubbleChartValueEditorVisible = true;
        } else {
          // 使用Vue组件显示图表编辑器
          this.currentChartType = actualChartType;
        }
      } else {
        this.currentChartType = '';

        // 处理简单类型编辑器
        if (type === 'simple') {
          this.simpleValueEditorVisible = true;
        } else if (type === 'expression') {
          this.expressionValueEditorVisible = true;
        } else if (type === 'dataset') {
          this.datasetValueEditorVisible = true;
        } else if (type === 'image') {
          this.imageValueEditorVisible = true;
        } else if (type === 'slash') {
          this.slashValueEditorVisible = true;
        } else if (type === 'zxing') {
          this.zxingValueEditorVisible = true;
        } else {
          // 其他类型的编辑器
          this.editorMap.get(type).show(rowIndex, colIndex, row2Index, col2Index);
        }
      }

      this.initialized = false;
    },

    /**
     *
     */
    refreshProperty(){
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if(!cellDef) {
        return;
      }
      const oldCellDef = getCell(this.rowIndex, this.colIndex);
      const typeChanged = this.cellType !== cellDef.value.type;
      const crossTabWidgetChanged = !!(cellDef.crossTabWidget) !== !!(oldCellDef && oldCellDef.crossTabWidget);

      if(typeChanged || crossTabWidgetChanged){
        this.$emit('refresh');
      }
    },

    handleSelectRenderer() {
      // TODO: 实现选择渲染器的逻辑
    },

    handleCellTypeChange(value) {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef) {
        return;
      }
      const newCellDef = deepCopy(cellDef);

      if (value === 'simple') {
        if (newCellDef.value.type !== 'simple') {
          newCellDef.value = { type: 'simple' };
        }
        newCellDef.expand = 'None';
        setCell(this.rowIndex, this.colIndex, newCellDef);
        this.hideAllEditors();
        this.simpleValueEditorVisible = true;
      } else if (value === 'expression') {
        if (newCellDef.value.type !== 'expression') {
          newCellDef.value = { type: 'expression', value: '' };
        }
        newCellDef.expand = 'None';
        setCell(this.rowIndex, this.colIndex, newCellDef);
        this.hideAllEditors();
        this.expressionValueEditorVisible = true;
      } else if (value === 'dataset') {
        if (newCellDef.value.type !== 'dataset') {
          newCellDef.value = { type: 'dataset', datasetName: '', property: '', aggregate: '', conditions: [], order: 'none' };
        }
        newCellDef.expand = 'Down';
        setCell(this.rowIndex, this.colIndex, newCellDef);
        this.hideAllEditors();
        this.datasetValueEditorVisible = true;
      } else if (value === 'image') {
        if (newCellDef.value.type !== 'image') {
          newCellDef.value = { type: 'image', source: 'text' };
        }
        newCellDef.expand = 'None';
        setCell(this.rowIndex, this.colIndex, newCellDef);
        this.hideAllEditors();
        this.imageValueEditorVisible = true;
      } else if (value === 'qrcode') {
        if (newCellDef.value.type !== 'zxing' || newCellDef.value.category !== 'qrcode') {
          const hot = TableManager.get();
          const width = this.buildWidth(this.colIndex, hot.getCell(this.rowIndex, this.colIndex).colSpan, hot);
          const height = this.buildHeight(this.rowIndex, hot.getCell(this.rowIndex, this.colIndex).rowSpan, hot);
          newCellDef.value = { width, height, type: 'zxing', source: 'text', category: 'qrcode', data: '' };
          newCellDef.expand = 'None';
        }
        setCell(this.rowIndex, this.colIndex, newCellDef);
        this.hideAllEditors();
        this.zxingValueEditorVisible = true;
      } else if (value === 'barcode') {
        if (newCellDef.value.type !== 'zxing' || newCellDef.value.category !== 'barcode') {
          const hot = TableManager.get();
          const width = this.buildWidth(this.colIndex, hot.getCell(this.rowIndex, this.colIndex).colSpan, hot);
          const height = this.buildHeight(this.rowIndex, hot.getCell(this.rowIndex, this.colIndex).rowSpan, hot);
          newCellDef.value = { width, height, type: 'zxing', source: 'text', category: 'barcode', data: '', format: 'CODE_128' };
          newCellDef.expand = 'None';
        }
        setCell(this.rowIndex, this.colIndex, newCellDef);
        this.hideAllEditors();
        this.zxingValueEditorVisible = true;
      } else if (value === 'slash') {
        newCellDef.crossTabWidget = new CrossTabWidget(this.getContext(), this.rowIndex, this.colIndex);
        newCellDef.expand = 'None';
        setCell(this.rowIndex, this.colIndex, newCellDef);
        this.hideAllEditors();
        this.slashValueEditorVisible = true;
      } else if (value === 'chart') {
        const hot = TableManager.get();
        const width = this.buildWidth(this.colIndex, hot.getCell(this.rowIndex, this.colIndex).colSpan, hot);
        const height = this.buildHeight(this.rowIndex, hot.getCell(this.rowIndex, this.colIndex).rowSpan, hot);
        newCellDef.value = {
          width,
          height,
          type: 'chart',
          chart: {
            dataset: {
              type: 'pie'
            }
          }
        };
        setCell(this.rowIndex, this.colIndex, newCellDef);
        this.hideAllEditors();
      }

      const hot = TableManager.get();
      hot.setDataAtCell(this.rowIndex, this.colIndex, '');
      // hot.render();
      setDirty();
    },

    /**
     * 构建宽度
     */
    buildWidth(colIndex, colspan, hot) {
      let width = hot.getColWidth(colIndex) - 3;
      if (!colspan || colspan < 2) {
        return width;
      }
      let start = colIndex + 1, end = colIndex + colspan;
      for (let i = start; i < end; i++) {
        width += hot.getColWidth(i);
      }
      return width;
    },

    /**
     * 构建高度
     */
    buildHeight(rowIndex, rowspan, hot) {
      let height = hot.getRowHeight(rowIndex) - 3;
      if (!rowspan || rowspan < 2) {
        return height;
      }
      let start = rowIndex + 1, end = rowIndex + rowspan;
      for (let i = start; i < end; i++) {
        height += hot.getRowHeight(i);
      }
      return height;
    },

    /**
     * 从store获取context
     */
    getContext() {
      return store.getters['report/getContext'];
    }
  }
};
</script>

<style scoped>
.property-panel {
  margin: 8px
}
</style>

