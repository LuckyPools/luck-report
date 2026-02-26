<template>
  <div class="scatter-chart-value-editor" ref="container">
    <!-- 选项卡导航 -->
    <u-tabs v-model="activeTab" type="button">
      <u-tab-pane :label="$t('chart.datasetBind')" index="dataset"></u-tab-pane>
      <u-tab-pane :label="$t('chart.option')" index="option"></u-tab-pane>
      <u-tab-pane :label="$t('chart.axisConfig')" index="axis"></u-tab-pane>
    </u-tabs>

    <!-- 选项卡内容 -->
    <div class="tab-content">
      <!-- 数据集绑定选项卡 -->
      <div class="tab-pane fade" :class="{ 'in active': activeTab === 'dataset' }" v-show="activeTab === 'dataset'">
        <!-- 字段选项卡 -->
        <ChartDataConfig
          ref="datasetTab"
          :cellDef="cellDef"
          :datasources="datasources"
          :selectedDataset="datasetValues.selectedDataset"
          :selectedCategoryProperty="datasetValues.selectedCategoryProperty"
          :selectedXProperty="datasetValues.selectedXProperty"
          :selectedYProperty="datasetValues.selectedYProperty"
          :showRProperty="false"
          @update-dataset="handleDatasetUpdate"
        />
      </div>

      <!-- 选项选项卡 -->
      <div class="tab-pane fade" :class="{ 'in active': activeTab === 'option' }" v-show="activeTab === 'option'">
        <ChartOption
          :cellDef="cellDef"
          :chartOptions.sync="chartOptions"
          :showDataLabel="true"
        />
      </div>

      <!-- 轴配置选项卡 -->
      <div class="tab-pane fade" :class="{ 'in active': activeTab === 'axis' }" v-show="activeTab === 'axis'">
        <!-- 使用ChartAxis组件 -->
        <ChartAxis
          :cellDef="cellDef"
          :xAxesConfig.sync="xAxesConfig"
          :yAxesConfig.sync="yAxesConfig"
          :format.sync="xAxisFormat"
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
import UTabs from '@/components/tabs/index.vue';
import UTabPane from '@/components/tabs/pane.vue';

export default {
  name: 'ScatterChartValueEditor',
  components: {
    ChartAxis,
    ChartOption,
    ChartDataConfig,
    UTabs,
    UTabPane
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
        selectedYProperty: ''
      },

      // 标题相关
      titleDisplay: false,
      titlePosition: 'top',
      titleText: '',

      // 图例相关
      legendDisplay: false,
      legendPosition: 'top',

      // 数据标签相关
      dataLabelsDisplay: false,

      // 动画相关
      animationDuration: 1000,
      animationEasing: 'easeOutQuart',

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

      // 图表选项配置 - 适配ChartOption组件
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
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        },
        dataLabels: {
          display: false
        }
      }
    };
  },
  watch: {
    legendDisplay(oldVal,newVal) {
      console.log('1111' + newVal);
    }
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

      // 加载图表配置
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
        selectedYProperty: dataset.yProperty || ''
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

      // 加载选项配置到chartOptions对象
      this.chartOptions = {
        title: {
          display: false,
          position: 'top',
          text: ''
        },
        legend: {
          display: false,
          position: 'top'
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        },
        dataLabels: {
          display: false
        }
      };

      // 加载选项配置
      const options = chart.options || [];
      for (const option of options) {
        switch (option.type) {
          case 'animation':
            this.chartOptions.animation.duration = option.duration || 1000;
            this.chartOptions.animation.easing = option.easing || 'easeOutQuart';
            this.animationDuration = this.chartOptions.animation.duration;
            this.animationEasing = this.chartOptions.animation.easing;
            break;
          case 'title':
            this.chartOptions.title.display = option.display || false;
            this.chartOptions.title.position = option.position || 'top';
            this.chartOptions.title.text = option.text || '';
            this.titleDisplay = this.chartOptions.title.display;
            this.titlePosition = this.chartOptions.title.position;
            this.titleText = this.chartOptions.title.text;
            break;
          case 'legend':
            this.chartOptions.legend.display = option.display || false;
            this.chartOptions.legend.position = option.position || 'top';
            this.legendDisplay = this.chartOptions.legend.display;
            this.legendPosition = this.chartOptions.legend.position;
            break;
        }
      }

      // 加载插件配置
      const plugins = chart.plugins || [];
      for (const plugin of plugins) {
        if (plugin.name === 'data-labels') {
          this.chartOptions.dataLabels.display = plugin.display || false;
          this.dataLabelsDisplay = this.chartOptions.dataLabels.display;
          break;
        }
      }
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

    // 处理标题显示变化
    handleTitleDisplayChange() {
      const targetOption = this.getTargetOption('title');
      targetOption.display = this.titleDisplay;
      targetOption.text = this.titleText;
      targetOption.position = this.titlePosition;

      if (this.cellDef && this.cellDef.chartWidget && this.cellDef.chartWidget.chart) {
        const chart = this.cellDef.chartWidget.chart;
        if (!chart.options) {
          chart.options = {};
        }
        chart.options.title = {
          display: this.titleDisplay,
          text: this.titleText,
          fontSize: 14,
          position: this.titlePosition
        };
        this.cellDef.chartWidget.chart.update();
      }
      setDirty();
    },

    // 处理标题位置变化
    handleTitlePositionChange() {
      const targetOption = this.getTargetOption('title');
      targetOption.position = this.titlePosition;

      if (this.cellDef && this.cellDef.chartWidget && this.cellDef.chartWidget.chart) {
        const chart = this.cellDef.chartWidget.chart;
        if (!chart.options) {
          chart.options = {};
        }
        chart.options.title = {
          display: this.titleDisplay,
          text: this.titleText,
          position: this.titlePosition
        };
        this.cellDef.chartWidget.chart.update();
      }
      setDirty();
    },

    // 处理标题文本变化
    handleTitleTextChange() {
      const targetOption = this.getTargetOption('title');
      targetOption.text = this.titleText;

      if (this.cellDef && this.cellDef.chartWidget && this.cellDef.chartWidget.chart) {
        const chart = this.cellDef.chartWidget.chart;
        if (!chart.options) {
          chart.options = {};
        }
        chart.options.title = {
          display: this.titleDisplay,
          text: this.titleText,
          position: this.titlePosition
        };
        this.cellDef.chartWidget.chart.update();
      }
      setDirty();
    },

    // 处理图例显示变化
    handleLegendDisplayChange() {
      const targetOption = this.getTargetOption('legend');
      targetOption.display = this.legendDisplay;
      targetOption.position = this.legendPosition;

      if (this.cellDef && this.cellDef.chartWidget && this.cellDef.chartWidget.chart) {
        const chart = this.cellDef.chartWidget.chart;
        if (!chart.options) {
          chart.options = {};
        }
        chart.options.legend = {
          display: this.legendDisplay,
          position: this.legendPosition
        };
        this.cellDef.chartWidget.chart.update();
      }
      setDirty();
    },

    // 处理图例位置变化
    handleLegendPositionChange() {
      const targetOption = this.getTargetOption('legend');
      targetOption.position = this.legendPosition;

      if (this.cellDef && this.cellDef.chartWidget && this.cellDef.chartWidget.chart) {
        const chart = this.cellDef.chartWidget.chart;
        if (!chart.options) {
          chart.options = {};
        }
        chart.options.legend = {
          display: this.legendDisplay,
          position: this.legendPosition
        };
        this.cellDef.chartWidget.chart.update();
      }
      setDirty();
    },

    // 处理数据标签显示变化
    handleDataLabelsDisplayChange() {
      const dataLabels = this.getTargetPlugin('data-labels');
      dataLabels.display = this.dataLabelsDisplay;
      setDirty();
    },

    // 处理动画持续时间变化
    handleAnimationDurationChange() {
      const targetOption = this.getTargetOption('animation');
      targetOption.duration = this.animationDuration;
      setDirty();
    },

    // 处理动画缓动变化
    handleAnimationEasingChange() {
      const targetOption = this.getTargetOption('animation');
      targetOption.easing = this.animationEasing;
      setDirty();
    },

    // 获取目标插件
    getTargetPlugin(name) {
      let plugins = this.cellDef.value.chart.plugins;
      if (!plugins) {
        plugins = [];
        this.cellDef.value.chart.plugins = plugins;
      }
      let targetPlugin = null;
      for (const plugin of plugins) {
        if (plugin.name === name) {
          targetPlugin = plugin;
          break;
        }
      }
      if (!targetPlugin) {
        targetPlugin = { name: name, display: false };
        plugins.push(targetPlugin);
      }
      return targetPlugin;
    },

    // 获取目标选项
    getTargetOption(type) {
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
.chart-fieldset {
  padding: 10px;
  border: solid 1px #dddddd;
  border-radius: 8px;
  margin-bottom: 10px;
  margin-top: 10px;
}

.chart-fieldset legend {
  width: auto;
  margin-bottom: 1px;
  border-bottom: none;
  font-size: inherit;
  color: #4b4b4b;
}
</style>
