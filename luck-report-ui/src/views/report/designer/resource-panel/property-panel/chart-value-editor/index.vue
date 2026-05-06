<template>
  <div class="bar-chart-value-editor" ref="container">

    <u-tabs v-model="activeTab" type="button">
      <u-tab-pane :label="$t('chart.datasetBind')" index="dataset" >
        <!-- 数据集绑定选项卡 -->
        <ChartDataset
            :datasetConfig="datasetConfig"
            @dataset-change="handleDatasetChange"
            @category-property-change="handleCategoryPropertyChange"
            @value-property-change="handleValuePropertyChange"
            @series-type-change="handleSeriesTypeChange"
            @series-property-change="handleSeriesPropertyChange"
            @series-text-change="handleSeriesTextChange"
            @aggregate-change="handleAggregateChange"
        />
      </u-tab-pane>

      <u-tab-pane :label="$t('chart.option')" index="option" >
        <!-- 选项选项卡 -->
        <ChartOption
            :chartConfig="chartConfig"
            @chart-option-change="handleChartOptionChange"
            @data-labels-change="handleDataLabelsChange"
        />
      </u-tab-pane>

      <u-tab-pane v-if="showAxis" :label="$t('chart.axisConfig')" index="axis" >
        <!-- 轴配置选项卡 -->
        <ChartAxis
            v-show="activeTab === 'axis'"
            :xAxesConfig.sync="xAxesConfig"
            :yAxesConfig.sync="yAxesConfig"
            :format.sync="datasetConfig.format"
            @axis-change="handleAxisChange"
        />
      </u-tab-pane>
    </u-tabs>
  </div>
</template>

<script>
import { setDirty } from '@/utils/table';
import { deepCopy } from '@/components/utils/index.js';
import { getCell, setCell } from '@/utils/contextActions';
import chartWidgetManager from '@/views/report/designer/edit-table/chart-widget/manager.js';
import ChartDataset from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-dataset/index.vue';
import ChartAxis from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-axis/index.vue';
import ChartOption from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-option/index.vue';
import UTabs from '@/components/tabs/index.vue';
import UTabPane from '@/components/tabs/pane.vue';
import { mapGetters } from 'vuex';

export default {
  name: 'ChartValueEditor',
  components: {
    ChartDataset,
    ChartAxis,
    ChartOption,
    UTabs,
    UTabPane
  },
  props: {
    id: {
      type: String,
      default: 'bar'
    },
    showAxis: {
      type: Boolean,
      default: true
    },
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
    }
  },
  data() {
    return {
      activeTab: 'dataset',
      datasetConfig: {
        datasetName: '',
        categoryProperty: '',
        valueProperty: '',
        seriesType: 'text',
        seriesProperty: '',
        seriesText: '',
        collectType: '',
        format: ''
      },

      // 图表配置
      chartConfig: {
        title: {
          display: false,
          position: 'top',
          text: ''
        },
        legend: {
          display: true,
          position: 'top'
        },
        dataLabels: {
          display: false
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuad'
        },
        layout: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      },

      // X轴配置
      xAxesConfig: {
        rotation: 0,
        scaleLabel: {
          display: false,
          labelString: ''
        }
      },

      // Y轴配置
      yAxesConfig: {
        rotation: 0,
        scaleLabel: {
          display: false,
          labelString: ''
        }
      }
    };
  },
  computed: {
      ...mapGetters('report', ['getContext']),
      context() {
          return this.getContext;
      }
  },
  watch: {
    rowIndex: {
      immediate: true,
      handler() {
        this.loadChartConfig();
      }
    },
    colIndex: {
      immediate: true,
      handler() {
        this.loadChartConfig();
      }
    }
  },
  mounted() {
    this.loadChartConfig();
  },
  methods: {
    getCell,
    /**
     * 加载图表配置
     */
    loadChartConfig() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef || !cellDef.value || !cellDef.value.chart) {
        return;
      }
      const chart = cellDef.value.chart;

      if (chart.dataset) {
        this.datasetConfig = { ...this.datasetConfig, ...chart.dataset };
      }

      if (chart.xaxes) {
        this.xAxesConfig = { ...this.xAxesConfig, ...chart.xaxes };
      }

      if (chart.yaxes) {
        this.yAxesConfig = { ...this.yAxesConfig, ...chart.yaxes };
      }

      if (chart.options && Array.isArray(chart.options)) {
        for (let option of chart.options) {
          switch (option.type) {
            case "title":
              this.chartConfig.title = { ...this.chartConfig.title, ...option };
              break;
            case "legend":
              this.chartConfig.legend = { ...this.chartConfig.legend, ...option };
              break;
            case "animation":
              this.chartConfig.animation = { ...this.chartConfig.animation, ...option };
              break;
            case "layout":
              this.chartConfig.layout = { ...this.chartConfig.layout, ...option.layout };
              break;
          }
        }
      }

      if (chart.plugins && Array.isArray(chart.plugins)) {
        for (let plugin of chart.plugins) {
          if (plugin.name === 'data-labels') {
            this.chartConfig.dataLabels.display = plugin.display;
          }
        }
      }
    },

    /**
     * 处理数据集变化
     */
    handleDatasetChange(value) {
      this.datasetConfig.datasetName = value;
      const cell = deepCopy(getCell(this.rowIndex, this.colIndex));
      if (cell && cell.value && cell.value.chart && cell.value.chart.dataset) {
        cell.value.chart.dataset.datasetName = value;
        setCell(this.rowIndex, this.colIndex, cell);
      }
      setDirty();
    },

    /**
     * 处理分类属性变化
     */
    handleCategoryPropertyChange(value) {
      this.datasetConfig.categoryProperty = value;
      const cell = deepCopy(getCell(this.rowIndex, this.colIndex));
      if (cell && cell.value && cell.value.chart && cell.value.chart.dataset) {
        cell.value.chart.dataset.categoryProperty = value;
        setCell(this.rowIndex, this.colIndex, cell);
      }
      setDirty();
    },

    /**
     * 处理值属性变化
     */
    handleValuePropertyChange(value) {
      this.datasetConfig.valueProperty = value;
      const cell = deepCopy(getCell(this.rowIndex, this.colIndex));
      if (cell && cell.value && cell.value.chart && cell.value.chart.dataset) {
        cell.value.chart.dataset.valueProperty = value;
        setCell(this.rowIndex, this.colIndex, cell);
      }
      setDirty();
    },

    /**
     * 处理系列类型变化
     */
    handleSeriesTypeChange(value) {
      this.datasetConfig.seriesType = value;
      const cell = deepCopy(getCell(this.rowIndex, this.colIndex));
      if (cell && cell.value && cell.value.chart && cell.value.chart.dataset) {
        cell.value.chart.dataset.seriesType = value;
        setCell(this.rowIndex, this.colIndex, cell);
      }
      setDirty();
    },

    /**
     * 处理系列属性变化
     */
    handleSeriesPropertyChange(value) {
      this.datasetConfig.seriesProperty = value;
      const cell = deepCopy(getCell(this.rowIndex, this.colIndex));
      if (cell && cell.value && cell.value.chart && cell.value.chart.dataset) {
        cell.value.chart.dataset.seriesProperty = value;
        setCell(this.rowIndex, this.colIndex, cell);
      }
      setDirty();
    },

    /**
     * 处理系列文本变化
     */
    handleSeriesTextChange(value) {
      this.datasetConfig.seriesText = value;
      const cell = deepCopy(getCell(this.rowIndex, this.colIndex));
      if (cell && cell.value && cell.value.chart && cell.value.chart.dataset) {
        cell.value.chart.dataset.seriesText = value;
        setCell(this.rowIndex, this.colIndex, cell);
      }
      setDirty();
    },

    /**
     * 处理聚合方式变化
     */
    handleAggregateChange(value) {
      this.datasetConfig.collectType = value;
      const cell = deepCopy(getCell(this.rowIndex, this.colIndex));
      if (cell && cell.value && cell.value.chart && cell.value.chart.dataset) {
        cell.value.chart.dataset.collectType = value;
        setCell(this.rowIndex, this.colIndex, cell);
      }
      setDirty();
    },

    /**
     * 处理图表选项变化
     */
    handleChartOptionChange({ type, option }) {
      const cell = deepCopy(getCell(this.rowIndex, this.colIndex));
      if (!cell || !cell.value || !cell.value.chart) {
        return;
      }

      const chart = cell.value.chart;
      if (!chart.options) {
        chart.options = [];
      }

      let existingOption = chart.options.find(opt => opt.type === type);
      if (existingOption) {
        Object.assign(existingOption, option);
      } else {
        chart.options.push({ type, ...option });
      }

      setCell(this.rowIndex, this.colIndex, cell);
      this.updateChart();
      setDirty();
    },

    /**
     * 处理数据标签显示变化
     */
    handleDataLabelsChange(dataLabels) {
      const cell = deepCopy(getCell(this.rowIndex, this.colIndex));
      if (!cell || !cell.value || !cell.value.chart) {
        return;
      }

      const chart = cell.value.chart;
      if (!chart.plugins) {
        chart.plugins = [];
      }

      let dataLabelPlugin = chart.plugins.find(p => p.name === 'data-labels');
      if (dataLabelPlugin) {
        dataLabelPlugin.display = dataLabels.display;
      } else {
        chart.plugins.push({
          name: 'data-labels',
          display: dataLabels.display
        });
      }

      setCell(this.rowIndex, this.colIndex, cell);
      this.updateChart();
      setDirty();
    },

    /**
     * 更新图表
     */
    updateChart() {
      const widgetKey = `${this.rowIndex}_${this.colIndex}`;
      const chartWidget = chartWidgetManager.get(widgetKey);
      if (chartWidget) {
        chartWidget.refresh(this.context);
      }
    },

    /**
     * 处理轴配置变化
     */
    handleAxisChange({ type, value }) {
      const cell = deepCopy(getCell(this.rowIndex, this.colIndex));
      if (!cell || !cell.value || !cell.value.chart) {
        return;
      }

      const chart = cell.value.chart;

      switch (type) {
        case 'x-rotation':
          if (!chart.xaxes) {
            chart.xaxes = {};
          }
          chart.xaxes.rotation = value;
          break;
        case 'x-title-display':
          if (!chart.xaxes) {
            chart.xaxes = {};
          }
          if (!chart.xaxes.scaleLabel) {
            chart.xaxes.scaleLabel = {};
          }
          chart.xaxes.scaleLabel.display = value;
          break;
        case 'x-title-text':
          if (!chart.xaxes) {
            chart.xaxes = {};
          }
          if (!chart.xaxes.scaleLabel) {
            chart.xaxes.scaleLabel = {};
          }
          chart.xaxes.scaleLabel.labelString = value;
          break;
        case 'y-rotation':
          if (!chart.yaxes) {
            chart.yaxes = {};
          }
          chart.yaxes.rotation = value;
          break;
        case 'y-title-display':
          if (!chart.yaxes) {
            chart.yaxes = {};
          }
          if (!chart.yaxes.scaleLabel) {
            chart.yaxes.scaleLabel = {};
          }
          chart.yaxes.scaleLabel.display = value;
          break;
        case 'y-title-text':
          if (!chart.yaxes) {
            chart.yaxes = {};
          }
          if (!chart.yaxes.scaleLabel) {
            chart.yaxes.scaleLabel = {};
          }
          chart.yaxes.scaleLabel.labelString = value;
          break;
        case 'format':
          if (!chart.dataset) {
            chart.dataset = {};
          }
          chart.dataset.format = value;
          break;
      }

      setCell(this.rowIndex, this.colIndex, cell);
      this.updateChart();
      setDirty();
    }
  }
};
</script>

<style scoped>
</style>
