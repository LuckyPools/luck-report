<template>
  <div class="bubble-chart-value-editor" ref="container">
    <!-- 选项卡导航 -->
    <u-tabs v-model="activeTab" type="button">
      <u-tab-pane :label="$t('chart.datasetBind')" index="dataset"></u-tab-pane>
      <u-tab-pane :label="$t('chart.option')" index="option"></u-tab-pane>
      <u-tab-pane :label="$t('chart.axisConfig')" index="axis"></u-tab-pane>
    </u-tabs>

    <!-- 选项卡内容 -->
    <div class="tab-content">
      <!-- 数据集绑定选项卡 -->
      <div class="tab-pane" v-show="activeTab === 'dataset'">
        <!-- 字段选项卡 -->
        <ChartDataConfig
          ref="datasetTab"
          :cellDef="cellDef"
          :datasources="datasources"
          :selectedDataset="datasetValues.selectedDataset"
          :selectedCategoryProperty="datasetValues.selectedCategoryProperty"
          :selectedXProperty="datasetValues.selectedXProperty"
          :selectedYProperty="datasetValues.selectedYProperty"
          :selectedRProperty="datasetValues.selectedRProperty"
          @update-dataset="handleDatasetUpdate"
        />
      </div>

      <!-- 选项选项卡 -->
      <div class="tab-pane" v-show="activeTab === 'option'">
        <ChartOption
          :cellDef="cellDef"
          :chartOptions="chartOptions"
          :showDataLabel="false"
        />
      </div>

      <!-- 轴配置选项卡 -->
      <div class="tab-pane" v-show="activeTab === 'axis'">
        <!-- 使用ChartAxis组件 -->
        <ChartAxis
          :cellDef="cellDef"
          :xAxesConfig.sync="xAxesConfig"
          :yAxesConfig.sync="yAxesConfig"
          :format.sync="xAxisFormat"
          @change="handleAxisConfigChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { setDirty } from '@/utils/table.js';
import ChartAxis from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-axis/index.vue';
import ChartOption from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-option/index.vue';
import ChartDataConfig from '@/views/report/designer/resource-panel/property-panel/chart-value-editor/chart-dataset-bob/index.vue';
import UTabs from "@/components/tabs/index.vue";
import UTabPane from "@/components/tabs/pane.vue";

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
    context: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      activeTab: 'dataset',
      cellDef: null,
      datasources: null,
      rowIndex: 0,
      colIndex: 0,
      row2Index: 0,
      col2Index: 0,

      // 数据集相关 - 使用一个对象来管理所有数据集相关的值
      datasetValues: {
        selectedDataset: '',
        selectedCategoryProperty: '',
        selectedXProperty: '',
        selectedYProperty: '',
        selectedRProperty: ''
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
      chartOptions: {
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
  watch: {
    // 监听X轴格式变化
    xAxisFormat() {
      this.handleXAxisFormatChange();
    },
  },
  methods: {

    // 显示编辑器
    show(cellDef, rowIndex, colIndex, row2Index, col2Index) {
      this.cellDef = cellDef;
      this.rowIndex = rowIndex;
      this.colIndex = colIndex;
      this.row2Index = row2Index;
      this.col2Index = col2Index;

      // 获取数据源
      this.datasources = this.context.reportDef.datasources;

      // 先加载图表配置
      this.loadChartConfig();
    },

    // 加载图表配置
    loadChartConfig() {
      if (!this.cellDef || !this.cellDef.value || !this.cellDef.value.chart) return;

      const chart = this.cellDef.value.chart;
      // 加载数据集配置
      const dataset = chart.dataset || {};
      this.datasetValues = {
        selectedDataset: dataset.datasetName || '',
        selectedCategoryProperty: dataset.categoryProperty || '',
        selectedXProperty: dataset.xProperty || '',
        selectedYProperty: dataset.yProperty || '',
        selectedRProperty: dataset.rProperty || ''
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
            this.chartOptions.animation = { ...this.chartOptions.animation, ...option };
            break;
          case 'title':
            this.chartOptions.title = { ...this.chartOptions.title, ...option };
            break;
          case 'legend':
            this.chartOptions.legend = { ...this.chartOptions.legend, ...option };
            break;
          case 'layout':
            this.chartOptions.layout = { ...this.chartOptions.layout, ...option.layout };
            break;
        }
      }

      // 加载插件配置
      if (chart.plugins && Array.isArray(chart.plugins)) {
        for (const plugin of chart.plugins) {
          if (plugin.name === 'data-labels') {
            this.chartOptions.dataLabels.display = plugin.display;
          }
        }
      }
    },

    // 处理轴配置变化
    handleAxisConfigChange(config) {
      if (!this.cellDef.value.chart) {
        this.cellDef.value.chart = {};
      }
      this.cellDef.value.chart.xAxes = config.xAxes;
      this.cellDef.value.chart.yAxes = config.yAxes;
      setDirty();
    },

    // 处理数据集配置更新
    handleDatasetUpdate(config) {
      if (!this.cellDef.value.chart) {
        this.cellDef.value.chart = {};
      }

      if (!this.cellDef.value.chart.dataset) {
        this.cellDef.value.chart.dataset = {};
      }

      // 更新配置
      Object.assign(this.cellDef.value.chart.dataset, config);

      // 同时更新本地数据集值，保持UI同步
      Object.assign(this.datasetValues, config);

      // 标记为已修改
      setDirty();
    },

    // 处理X轴格式变化
    handleXAxisFormatChange() {
      if (!this.cellDef.value.chart) {
        this.cellDef.value.chart = {};
      }

      if (!this.cellDef.value.chart.dataset) {
        this.cellDef.value.chart.dataset = {};
      }

      this.cellDef.value.chart.dataset.format = this.xAxisFormat;
      setDirty();
    },

    // 获取X轴配置
    getXAxesConfig() {
      if (!this.cellDef || !this.cellDef.value || !this.cellDef.value.chart) {
        return {};
      }

      let xaxes = this.cellDef.value.chart.xaxes;
      if (!xaxes) {
        xaxes = {};
        this.cellDef.value.chart.xaxes = xaxes;
      }
      return xaxes;
    },

    // 获取Y轴配置
    getYAxesConfig() {
      if (!this.cellDef || !this.cellDef.value || !this.cellDef.value.chart) {
        return {};
      }

      let yaxes = this.cellDef.value.chart.yaxes;
      if (!yaxes) {
        yaxes = {};
        this.cellDef.value.chart.yaxes = yaxes;
      }
      return yaxes;
    },

    // 获取目标选项
    getTargetOption(type) {
      if (!this.cellDef || !this.cellDef.value || !this.cellDef.value.chart) {
        return {};
      }

      let options = this.cellDef.value.chart.options;
      if (!options) {
        options = [];
        this.cellDef.value.chart.options = options;
      }

      let targetOption = null;
      for (const option of options) {
        if (option.type === type) {
          targetOption = option;
          break;
        }
      }

      if (!targetOption) {
        targetOption = { type };
        options.push(targetOption);
      }

      return targetOption;
    }
  }
};
</script>

<style scoped>
.tab-content {
  min-height: 300px;
}
</style>
