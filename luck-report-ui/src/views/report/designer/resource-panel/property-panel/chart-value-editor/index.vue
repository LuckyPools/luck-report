<template>
  <div class="bar-chart-value-editor" ref="container">
    <!-- 选项卡导航 -->
    <u-tabs v-model="activeTab" type="button">
      <u-tab-pane :label="$t('chart.datasetBind')" index="dataset" />
      <u-tab-pane :label="$t('chart.option')" index="option" />
      <u-tab-pane v-if="showAxis" :label="$t('chart.axisConfig')" index="axis" />
    </u-tabs>

    <!-- 选项卡内容 -->
    <div class="tab-content">
      <!-- 数据集绑定选项卡 -->
      <ChartDataset
          v-show="activeTab === 'dataset'"
          :datasetConfig="datasetConfig"
          :availableDatasets="availableDatasets"
          :availableFields="availableFields"
          @dataset-change="handleDatasetChange"
          @category-property-change="handleCategoryPropertyChange"
          @value-property-change="handleValuePropertyChange"
          @series-type-change="handleSeriesTypeChange"
          @series-property-change="handleSeriesPropertyChange"
          @series-text-change="handleSeriesTextChange"
          @aggregate-change="handleAggregateChange"
      />

      <!-- 选项选项卡 -->
      <ChartOption
          v-show="activeTab === 'option'"
          :cellDef="cellDef"
          :chartOptions="chartOptions"
      />

      <!-- 轴配置选项卡 -->
      <ChartAxis
          v-show="activeTab === 'axis'"
          :cellDef="cellDef"
          :xAxesConfig.sync="xAxesConfig"
          :yAxesConfig.sync="yAxesConfig"
          :format.sync="datasetConfig.format"
      />
    </div>
  </div>
</template>

<script>
import { setDirty } from '@/utils/table';
import ChartDataset from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-dataset/index.vue';
import ChartAxis from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-axis/index.vue';
import ChartOption from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-option/index.vue';
import UTabs from '@/components/tabs/index.vue';
import UTabPane from '@/components/tabs/pane.vue';

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
    context: {
      type: Object,
      required: true
    },
    showAxis: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      activeTab: 'dataset',
      cellDef: null,
      rowIndex: 0,
      colIndex: 0,
      row2Index: 0,
      col2Index: 0,
      datasources: [],
      availableDatasets: [],
      availableFields: [],

      // 数据集配置
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

      // 图表选项
      chartOptions: {
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
  methods: {
    /**
     * 显示编辑器
     */
    show(cellDef, rowIndex, colIndex, row2Index, col2Index) {
      this.cellDef = cellDef;
      this.rowIndex = rowIndex;
      this.colIndex = colIndex;
      this.row2Index = row2Index;
      this.col2Index = col2Index;

      // 加载数据源
      this.datasources = this.context.reportDef.datasources || [];
      this.loadAvailableDatasets();

      // 加载图表配置
      this.loadChartConfig();
    },

    /**
     * 加载可用的数据集
     */
    loadAvailableDatasets() {
      this.availableDatasets = [];
      for (let ds of this.datasources) {
        let datasets = ds.datasets || [];
        for (let dataset of datasets) {
          this.availableDatasets.push(dataset);
        }
      }
    },

    /**
     * 加载图表配置
     */
    loadChartConfig() {
      if (!this.cellDef || !this.cellDef.value || !this.cellDef.value.chart) {
        return;
      }

      const chart = this.cellDef.value.chart;

      // 加载数据集配置
      if (chart.dataset) {
        this.datasetConfig = { ...this.datasetConfig, ...chart.dataset };
        this.loadAvailableFields();
      }

      // 加载X轴配置
      if (chart.xaxes) {
        this.xAxesConfig = { ...this.xAxesConfig, ...chart.xaxes };
      }

      // 加载Y轴配置
      if (chart.yaxes) {
        this.yAxesConfig = { ...this.yAxesConfig, ...chart.yaxes };
      }

      // 加载图表选项
      if (chart.options && Array.isArray(chart.options)) {
        for (let option of chart.options) {
          switch (option.type) {
            case "title":
              this.chartOptions.title = { ...this.chartOptions.title, ...option };
              break;
            case "legend":
              this.chartOptions.legend = { ...this.chartOptions.legend, ...option };
              break;
            case "animation":
              this.chartOptions.animation = { ...this.chartOptions.animation, ...option };
              break;
            case "layout":
              this.chartOptions.layout = { ...this.chartOptions.layout, ...option.layout };
              break;
          }
        }
      }

      // 加载插件配置
      if (chart.plugins && Array.isArray(chart.plugins)) {
        for (let plugin of chart.plugins) {
          if (plugin.name === 'data-labels') {
            this.chartOptions.dataLabels.display = plugin.display;
          }
        }
      }
    },

    /**
     * 加载可用字段
     */
    loadAvailableFields() {
      this.availableFields = [];
      const datasetName = this.datasetConfig.datasetName;

      if (!datasetName) return;

      for (let ds of this.datasources) {
        let datasets = ds.datasets || [];
        for (let dataset of datasets) {
          if (dataset.name === datasetName) {
            this.availableFields = dataset.fields || [];
            break;
          }
        }
        if (this.availableFields.length > 0) {
          break;
        }
      }
    },

    /**
     * 获取数据集配置
     */
    getDatasetConfig() {
      if (!this.cellDef || !this.cellDef.value || !this.cellDef.value.chart) {
        return {};
      }
      return this.cellDef.value.chart.dataset || {};
    },

    /**
     * 处理数据集变化
     */
    handleDatasetChange(value) {
      this.datasetConfig.datasetName = value;
      this.loadAvailableFields();
      const dataset = this.getDatasetConfig();
      dataset.datasetName = value;
      setDirty();
    },

    /**
     * 处理分类属性变化
     */
    handleCategoryPropertyChange(value) {
      this.datasetConfig.categoryProperty = value;
      const dataset = this.getDatasetConfig();
      dataset.categoryProperty = value;
      setDirty();
    },

    /**
     * 处理值属性变化
     */
    handleValuePropertyChange(value) {
      this.datasetConfig.valueProperty = value;
      const dataset = this.getDatasetConfig();
      dataset.valueProperty = value;
      setDirty();
    },

    /**
     * 处理系列类型变化
     */
    handleSeriesTypeChange(value) {
      this.datasetConfig.seriesType = value;
      const dataset = this.getDatasetConfig();
      dataset.seriesType = value;
      setDirty();
    },

    /**
     * 处理系列属性变化
     */
    handleSeriesPropertyChange(value) {
      this.datasetConfig.seriesProperty = value;
      const dataset = this.getDatasetConfig();
      dataset.seriesProperty = value;
      setDirty();
    },

    /**
     * 处理系列文本变化
     */
    handleSeriesTextChange(value) {
      this.datasetConfig.seriesText = value;
      const dataset = this.getDatasetConfig();
      dataset.seriesText = value;
      setDirty();
    },

    /**
     * 处理聚合方式变化
     */
    handleAggregateChange(value) {
      this.datasetConfig.collectType = value;
      const dataset = this.getDatasetConfig();
      dataset.collectType = value;
      setDirty();
    },

    /**
     * 更新图表
     */
    updateChart() {
      if (this.cellDef && this.cellDef.chartWidget && this.cellDef.chartWidget.chart) {
        this.cellDef.chartWidget.chart.update();
      }
    }
  }
};
</script>

<style scoped>
.tab-pane {
  min-height: 300px;
}

fieldset {
  border-radius: 4px;
}
</style>
