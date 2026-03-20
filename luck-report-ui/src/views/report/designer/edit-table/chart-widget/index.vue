<template>
  <div class="chart-container" ref="chartContainer">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import Chart from 'chart.js';
import { showAlert } from '@/utils/comnon.js';
import {getCell} from "@/utils/contextActions";
import TableManager from '../manager.js';

export default {
  name: 'ChartWidget',
  props: {
    context: {
      type: Object,
      required: true
    },
    rowIndex: {
      type: Number,
      required: true
    },
    colIndex: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      chart: null,
      width: -2,
      height: -2
    };
  },
  computed: {
      chartColors() {
          return {
              red: 'rgb(255, 99, 132)',
              orange: 'rgb(255, 159, 64)',
              yellow: 'rgb(255, 205, 86)',
              green: 'rgb(75, 192, 192)',
              blue: 'rgb(54, 162, 235)',
              purple: 'rgb(153, 102, 255)',
              grey: 'rgb(201, 203, 207)'
          };
      }
  },
  mounted() {
      this.renderChart();
  },
  beforeDestroy() {
      if (this.chart) {
          this.chart.destroy();
      }
  },
  methods: {
    getCell() {
      return getCell(this.rowIndex, this.colIndex);
    },
    renderChart() {
      const { rowIndex, colIndex } = this;
      const hot = TableManager.get();
      const container = this.$refs.chartContainer;
      const canvas = this.$refs.chartCanvas;

      // 获取单元格的行合并和列合并属性
      const tdElement = this.getTDByCell(rowIndex, colIndex);
      const rowSpan = tdElement ? parseInt(tdElement.rowSpan) || 1 : 1;
      const colSpan = tdElement ? parseInt(tdElement.colSpan) || 1 : 1;

      // 计算图表的宽度和高度
      this.width = -2;
      this.height = -2;

      const rowStart = rowIndex;
      const rowEnd = rowIndex + rowSpan;
      for (let i = rowStart; i < rowEnd; i++) {
        this.height += hot.getRowHeight(i);
      }

      const colStart = colIndex;
      const colEnd = colIndex + colSpan;
      for (let i = colStart; i < colEnd; i++) {
        this.width += hot.getColWidth(i);
      }

      // 设置容器和canvas的大小
      container.style.width = `${this.width}px`;
      container.style.height = `${this.height}px`;
      canvas.style.width = `${this.width}px`;
      canvas.style.height = `${this.height}px`;

      // 获取图表类型和配置
      const cell = this.getCell();
      const type = cell.value.chart.dataset.type;
      let data = null;
      let options = {};
      let chartType;

      // 设置默认配置选项
      const defaultOptions = cell.value.chart.options;
      if (defaultOptions) {
        for (let option of defaultOptions) {
          options[option.type] = option;
        }
      }

      // 处理x轴配置
      const xaxes = cell.value.chart.xaxes;
      if (xaxes) {
        if (!options.scales) {
          options.scales = {};
        }
        if (!options.scales.xAxes) {
          options.scales.xAxes = [];
        }
        if (xaxes.rotation) {
          if (!xaxes.ticks) {
            xaxes.ticks = {};
          }
          xaxes.ticks.minRotation = xaxes.rotation;
        }
        options.scales.xAxes.push(xaxes);
      }

      // 处理y轴配置
      const yaxes = cell.value.chart.yaxes;
      if (yaxes) {
        if (!options.scales) {
          options.scales = {};
        }
        if (!options.scales.yAxes) {
          options.scales.yAxes = [];
        }
        if (yaxes.rotation) {
          if (!yaxes.ticks) {
            yaxes.ticks = {};
          }
          yaxes.ticks.minRotation = yaxes.rotation;
        }
        options.scales.yAxes.push(yaxes);
      }

      const color = Chart.helpers.color;

      // 根据图表类型设置数据
      switch (type) {
        case 'bar':
          chartType = 'bar';
          data = {
            labels: ["类型1", "类型2", "类型3", "类型4", "类型5", "类型6"],
            datasets: [{
              label: '系列1',
              backgroundColor: color(this.chartColors.red).alpha(0.5).rgbString(),
              borderColor: this.chartColors.red,
              borderWidth: 1,
              data: [21, 25, 8, 12, 31, 19]
            }, {
              label: '系列2',
              backgroundColor: color(this.chartColors.blue).alpha(0.5).rgbString(),
              borderColor: this.chartColors.blue,
              borderWidth: 1,
              data: [11, 13, 18, 9, 23, 29]
            }]
          };
          break;
        case 'horizontalBar':
          chartType = 'horizontalBar';
          data = {
            labels: ["类型1", "类型2", "类型3", "类型4", "类型5", "类型6"],
            datasets: [{
              label: '系列1',
              backgroundColor: color(this.chartColors.red).alpha(0.5).rgbString(),
              borderColor: this.chartColors.red,
              borderWidth: 1,
              data: [21, 25, 8, 12, 31, 19]
            }, {
              label: '系列2',
              backgroundColor: color(this.chartColors.blue).alpha(0.5).rgbString(),
              borderColor: this.chartColors.blue,
              borderWidth: 1,
              data: [11, 13, 18, 9, 23, 29]
            }]
          };
          break;
        case 'line':
          chartType = 'line';
          data = {
            labels: ["类型1", "类型2", "类型3", "类型4", "类型5", "类型6"],
            datasets: [{
              label: '系列1',
              backgroundColor: color(this.chartColors.red).alpha(0.5).rgbString(),
              borderColor: this.chartColors.red,
              borderWidth: 1,
              fill: false,
              data: [21, 25, 8, 12, 31, 19]
            }, {
              label: '系列2',
              backgroundColor: color(this.chartColors.blue).alpha(0.5).rgbString(),
              borderColor: this.chartColors.blue,
              borderWidth: 1,
              fill: false,
              data: [11, 13, 18, 9, 23, 29]
            }]
          };
          break;
        case 'area':
          chartType = 'line';
          data = {
            labels: ["类型1", "类型2", "类型3", "类型4", "类型5", "类型6"],
            datasets: [{
              label: '系列1',
              backgroundColor: color(this.chartColors.red).alpha(0.5).rgbString(),
              borderColor: this.chartColors.red,
              borderWidth: 1,
              data: [21, 25, 8, 12, 31, 19]
            }, {
              label: '系列2',
              backgroundColor: color(this.chartColors.blue).alpha(0.5).rgbString(),
              borderColor: this.chartColors.blue,
              borderWidth: 1,
              data: [11, 13, 18, 9, 23, 29]
            }]
          };
          options.scales = {
            yAxes: [{
              stacked: true
            }]
          };
          break;
        case 'pie':
          chartType = 'pie';
          data = {
            labels: ["类型1", "类型2", "类型3", "类型4"],
            datasets: [{
              label: '系列1',
              backgroundColor: [
                this.chartColors.red,
                this.chartColors.orange,
                this.chartColors.yellow,
                this.chartColors.green
              ],
              data: [21, 25, 8, 12]
            }]
          };
          break;
        case 'doughnut':
          chartType = 'doughnut';
          data = {
            labels: ["类型1", "类型2", "类型3", "类型4"],
            datasets: [{
              label: '系列1',
              backgroundColor: [
                this.chartColors.red,
                this.chartColors.orange,
                this.chartColors.yellow,
                this.chartColors.green
              ],
              data: [21, 25, 8, 12]
            }]
          };
          break;
        case 'radar':
          chartType = 'radar';
          data = {
            labels: ["类型1", "类型2", "类型3", "类型4", "类型5"],
            datasets: [{
              label: '系列1',
              backgroundColor: color(this.chartColors.red).alpha(0.5).rgbString(),
              borderColor: this.chartColors.red,
              borderWidth: 1,
              data: [21, 25, 8, 12, 31]
            }, {
              label: '系列2',
              backgroundColor: color(this.chartColors.blue).alpha(0.5).rgbString(),
              borderColor: this.chartColors.blue,
              borderWidth: 1,
              data: [11, 13, 18, 9, 23, 9]
            }]
          };
          break;
        case 'polarArea':
          chartType = 'polarArea';
          data = {
            labels: ["类型1", "类型2", "类型3", "类型4"],
            datasets: [{
              label: '系列1',
              backgroundColor: [
                this.chartColors.red,
                this.chartColors.orange,
                this.chartColors.yellow,
                this.chartColors.green
              ],
              data: [21, 25, 12, 31]
            }]
          };
          break;
        case 'scatter':
          chartType = "scatter";
          data = {
            datasets: [
              {
                label: '系列1',
                borderColor: this.chartColors.red,
                backgroundColor: color(this.chartColors.red).alpha(0.2).rgbString(),
                data: [
                  {x: 10, y: 10},
                  {x: 5, y: 15},
                  {x: 8, y: 12},
                  {x: 18, y: 10}
                ]
              },
              {
                label: '系列2',
                borderColor: this.chartColors.blue,
                backgroundColor: color(this.chartColors.blue).alpha(0.2).rgbString(),
                data: [
                  {x: 13, y: 6},
                  {x: 25, y: 10},
                  {x: 18, y: 11},
                  {x: 14, y: 16}
                ]
              }
            ]
          };
          break;
        case 'bubble':
          chartType = "bubble";
          data = {
            datasets: [
              {
                label: '系列1',
                borderColor: this.chartColors.red,
                backgroundColor: color(this.chartColors.red).alpha(0.2).rgbString(),
                data: [
                  {x: 10, y: 10, r: 4},
                  {x: 5, y: 15, r: 6},
                  {x: 8, y: 12, r: 2},
                  {x: 18, y: 10, r: 8}
                ]
              },
              {
                label: '系列2',
                borderColor: this.chartColors.blue,
                backgroundColor: color(this.chartColors.blue).alpha(0.2).rgbString(),
                data: [
                  {x: 13, y: 6, r: 3},
                  {x: 25, y: 10, r: 9},
                  {x: 18, y: 11, r: 2},
                  {x: 14, y: 16, r: 10}
                ]
              }
            ]
          };
          break;
        case 'mix':
          chartType = 'bar';
          data = {
            labels: ["类型1", "类型2", "类型3", "类型4", "类型5", "类型6"],
            datasets: [{
              type: 'line',
              label: '系列1',
              backgroundColor: color(this.chartColors.red).alpha(0.5).rgbString(),
              borderColor: this.chartColors.red,
              data: [21, 25, 8, 12, 31, 19]
            }, {
              type: 'bar',
              label: '系列2',
              backgroundColor: color(this.chartColors.blue).alpha(0.5).rgbString(),
              borderColor: this.chartColors.blue,
              borderWidth: 1,
              data: [11, 13, 18, 9, 23, 29]
            }]
          };
          break;
        default:
          showAlert('不能识别的图表类型：' + type);
      }

      // 处理额外的选项配置
      const optionList = cell.value.chart.options || [];
      for (let op of optionList) {
        switch (op.type) {
          case "title":
            if (op.display) {
              options.title = {
                display: true,
                position: op.position,
                text: op.text
              };
            }
            break;
          case "legend":
            options.legend = {
              display: op.display || false,
              position: op.position,
              labels: op.labels || {}
            };
            break;
          case "layout":
            if (op.padding) {
              options.layout = {
                padding: {
                  left: op.padding.left,
                  right: op.padding.right,
                  top: op.padding.top,
                  bottom: op.padding.bottom
                }
              };
            }
            break;
        }
      }

      // 销毁之前的图表实例（如果存在）
      if (this.chart) {
        this.chart.destroy();
      }

      // 创建新的图表实例
      this.chart = new Chart(canvas, {
        type: chartType,
        data: data,
        options: options || {}
      });
    },

    // 获取单元格对应的DOM元素
    getTDByCell(rowIndex, colIndex) {
      const hot = TableManager.get();
      if (!hot || !hot.view || !hot.view.wtTable) {
        return null;
      }

      const wtTable = hot.view.wtTable;
      if (wtTable.getCell && wtTable.getCell(rowIndex, colIndex)) {
        return wtTable.getCell(rowIndex, colIndex).parentNode;
      }

      // 备用方法：通过选择器查找
      const cellElements = document.querySelectorAll(`.htCore td[data-row="${rowIndex}"][data-col="${colIndex}"]`);
      return cellElements.length > 0 ? cellElements[0] : null;
    },

    // 更新图表
    updateChart() {
      if (this.chart) {
        this.chart.update();
      }
    }
  }
};
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.chart-container canvas {
  max-width: 100%;
  max-height: 100%;
}
</style>
