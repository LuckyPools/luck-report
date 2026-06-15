<template>
  <div class="bubble-chart-value-editor" ref="container">
    <!-- 选项卡导航 -->
    <u-tabs v-model="activeTab" type="button">
      <u-tab-pane :label="$t('chart.datasetBind')" index="dataset">
        <!-- 数据集绑定选项卡 -->
        <ChartDataConfig
            ref="datasetTab"
            :datasetName="datasetValues.datasetName"
            :categoryProperty="datasetValues.categoryProperty"
            :xProperty="datasetValues.xProperty"
            :yProperty="datasetValues.yProperty"
            :rProperty="datasetValues.rProperty"
            :datasets="currentDatasets"
            :fields="currentFields"
            @update-dataset="handleDatasetUpdate"
        />
      </u-tab-pane>
      <u-tab-pane :label="$t('chart.option')" index="option">
        <ChartOption
            :chartConfig="chartConfig"
            :showDataLabel="false"
            @chart-option-change="handleChartOptionChange"
            @data-labels-change="handleDataLabelsChange"
        />
      </u-tab-pane>
      <u-tab-pane :label="$t('chart.axisConfig')" index="axis">
        <!-- 使用ChartAxis组件 -->
        <ChartAxis
            :xAxesConfig.sync="xAxesConfig"
            :yAxesConfig.sync="yAxesConfig"
            :format.sync="xAxisFormat"
            @axis-change="handleAxisChange"
        />
      </u-tab-pane>
    </u-tabs>
  </div>
</template>

<script>
import { setDirty } from '@/utils/table.js';
import { deepCopy } from '@/components/utils/index.js';
import { getCell, setCell } from '@/utils/contextActions';
import chartWidgetManager from '@/views/report/designer/edit-table/chart-widget/manager';
import ChartAxis from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-axis/index.vue';
import ChartOption from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-option/index.vue';
import ChartDataConfig from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-dataset-bob/index.vue';
import UTabs from "@/components/tabs/index.vue";
import UTabPane from "@/components/tabs/pane.vue";
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'BubbleChartValueEditor',
  components: {
    UTabPane,
    UTabs,
    ChartAxis,
    ChartOption,
    ChartDataConfig
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
    }
  },
  data() {
    return {
      activeTab: 'dataset',

      // 数据集相关 - 使用一个对象来管理所有数据集相关的值
      datasetValues: {
        datasetName: '',
        categoryProperty: '',
        xProperty: '',
        yProperty: '',
        rProperty: ''
      },

      // X轴配置 - 适配ChartAxis组件
      xAxesConfig: {
        rotation: 0,
        scaleLabel: {
          display: false,
          labelString: ''
        }
      },

      // Y轴配置 - 适配ChartAxis组件
      yAxesConfig: {
        rotation: 0,
        scaleLabel: {
          display: false,
          labelString: ''
        }
      },

      // 格式化配置 - 适配ChartAxis组件
      xAxisFormat: '',

      // 图表选项
      chartConfig: {
        title: {
          display: false,
          position: 'top',
          text: ''
        },
        legend: {
          display: false,
          position: 'top'
        },
        dataLabels: {
          display: false
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        },
        layout: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      }
    };
  },
  computed: {
    ...mapGetters('report', ['getContext', 'getIsCellUpdate']),
    context() {
      return this.getContext;
    },
    isCellUpdate() {
      return this.getIsCellUpdate;
    },
    cellPosition() {
      return `${this.rowIndex},${this.colIndex}`;
    },
    /**
     * 获取所有可用数据集列表
     * @return {Array} 数据集数组
     */
    currentDatasets() {
      if (!this.context?.reportDef?.datasources) return [];
      const result = [];
      for (let datasource of this.context.reportDef.datasources) {
        let datasets = datasource.datasets || [];
        for (let dataset of datasets) {
          result.push(dataset);
        }
      }
      return result;
    },
    /**
     * 根据当前选中的数据集获取对应字段列表
     * @return {Array} 字段数组，未选择数据集时返回空数组
     */
    currentFields() {
      const datasetName = this.datasetValues.datasetName;
      if (!datasetName) return [];
      for (let datasource of this.context.reportDef.datasources) {
        let datasets = datasource.datasets || [];
        for (let dataset of datasets) {
          if (dataset.name === datasetName) {
            return dataset.fields || [];
          }
        }
      }
      return [];
    }
  },
  watch: {
    cellPosition: {
      immediate: true,
      handler() {
        this.loadChartConfig();
      }
    },
    isCellUpdate: {
      handler(newVal) {
        if (newVal) {
          this.loadChartConfig();
          this.setCellUpdate(false);
        }
      }
    }
  },
  methods: {
    ...mapActions('report', ['setCellUpdate']),
    getCell,
    // 加载图表配置
    loadChartConfig() {
      const cellDef = getCell(this.rowIndex, this.colIndex);
      if (!cellDef || !cellDef.value || !cellDef.value.chart) return;

      const chart = cellDef.value.chart;
      // 加载数据集配置
      const dataset = chart.dataset || {};
      this.datasetValues = {
        datasetName: dataset.datasetName || '',
        categoryProperty: dataset.categoryProperty || '',
        xProperty: dataset.xProperty || '',
        yProperty: dataset.yProperty || '',
        rProperty: dataset.rProperty || ''
      };
      this.xAxisFormat = dataset.format || '';

      // 加载X轴配置 - 适配ChartAxis组件
      const xaxes = chart.xaxes || {};
      this.xAxesConfig = {
        rotation: xaxes.rotation || 0,
        scaleLabel: {
          display: xaxes.scaleLabel?.display || false,
          labelString: xaxes.scaleLabel?.labelString || ''
        }
      };

      // 加载Y轴配置 - 适配ChartAxis组件
      const yaxes = chart.yaxes || {};
      this.yAxesConfig = {
        rotation: yaxes.rotation || 0,
        scaleLabel: {
          display: yaxes.scaleLabel?.display || false,
          labelString: yaxes.scaleLabel?.labelString || ''
        }
      };

      // 加载图表选项
      const options = chart.options || [];
      for (const option of options) {
        switch (option.type) {
          case 'animation':
            this.chartConfig.animation = { ...this.chartConfig.animation, ...option };
            break;
          case 'title':
            this.chartConfig.title = { ...this.chartConfig.title, ...option };
            break;
          case 'legend':
            this.chartConfig.legend = { ...this.chartConfig.legend, ...option };
            break;
          case 'layout':
            this.chartConfig.layout = { ...this.chartConfig.layout, ...option.layout };
            break;
        }
      }

      // 加载插件配置
      if (chart.plugins && Array.isArray(chart.plugins)) {
        for (const plugin of chart.plugins) {
          if (plugin.name === 'data-labels') {
            this.chartConfig.dataLabels.display = plugin.display;
          }
        }
      }
    },

    /**
     * 处理数据集配置更新
     */
    handleDatasetUpdate(config) {
      const cell = deepCopy(getCell(this.rowIndex, this.colIndex));
      if (!cell || !cell.value || !cell.value.chart) {
        return;
      }

      if (!cell.value.chart.dataset) {
        cell.value.chart.dataset = {};
      }

      Object.assign(cell.value.chart.dataset, config);
      Object.assign(this.datasetValues, config);

      setCell(this.rowIndex, this.colIndex, cell);
      console.log(JSON.stringify(cell))
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
.tab-content {
  min-height: 300px;
}
</style>
