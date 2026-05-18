import {Chart} from 'chart.js';
import {storeChartData} from '@/api/preview';
import {getUrlSearchParams} from '@/utils/url';

/**
 * 将旧版 Chart.js 配置转换为新版（v3+）兼容格式
 * 处理 scales（xAxes/yAxes → x/y）、plugins（title/legend 迁移）和 horizontalBar 类型转换
 * @param {Object} chartJson - Chart.js 图表配置对象
 * @returns {Object} 转换后的图表配置对象
 */
export function convertChartConfig(chartJson) {
  if (!chartJson || !chartJson.options) {
    return chartJson
  }

  const options = chartJson.options

  if (options.scales) {
    if (options.scales.xAxes && options.scales.xAxes.length > 0) {
      options.scales.x = options.scales.xAxes[0]
      delete options.scales.xAxes
    }
    if (options.scales.yAxes && options.scales.yAxes.length > 0) {
      options.scales.y = options.scales.yAxes[0]
      delete options.scales.yAxes
    }
  }

  if (options.title) {
    options.plugins = options.plugins || {}
    options.plugins.title = options.title
    delete options.title
  }

  if (options.legend) {
    options.plugins = options.plugins || {}
    options.plugins.legend = options.legend
    delete options.legend
  }

  if (chartJson.type === 'horizontalBar') {
    chartJson.type = 'bar'
    options.indexAxis = 'y'
  }

  return chartJson
}

/**
 * 批量构建图表数据并渲染
 * 解析每个图表的 JSON 配置（支持函数字符串的 eval 还原），然后调用 buildChart 进行渲染
 * @param {Array<Object>} chartData - 图表数据数组，每项包含 id 和 json 字段
 */
export function buildChartDatas(chartData) {
  console.log(chartData[0].json)
  if (!chartData) {
    return;
  }
  for (let d of chartData) {
    let json = d.json;
    if (json) {
      json = JSON.parse(json, function (k, v) {
        if (v.indexOf && v.indexOf('function') > -1) {
          return eval("(function(){return " + v + " })()")
        }
        return v;
      });
    }
    buildChart(d.id, json);
  }
}

/**
 * 在指定 canvas 元素上创建 Chart.js 图表实例
 * 配置转换后设置动画完成回调，在图表渲染完毕时将图表的 base64 图片数据回传到服务端存储
 * @param {string} canvasId - canvas 元素的 DOM ID
 * @param {Object} chartJson - Chart.js 图表配置对象
 * @returns {Promise<Chart>} Chart.js 图表实例
 */
export async function buildChart(canvasId, chartJson) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    return;
  }

  chartJson = convertChartConfig(chartJson)

  let options = chartJson.options;
  if (!options) {
    options = {};
    chartJson.options = options;
  }
  let animation = options.animation;
  if (!animation) {
    animation = {};
    options.animation = animation;
  }

  animation.onComplete = async (context) => {
    try {
      const chart = context.chart;
      const base64Image = chart.toBase64Image();
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const width = parseInt(canvas.style.width) || canvas.width;
      const height = parseInt(canvas.style.height) || canvas.height;

      const formData = new FormData();
      formData.append('_base64Data', base64Image);
      formData.append('_chartId', canvasId);
      formData.append('_width', width);
      formData.append('_height', height);

      const params = getUrlSearchParams();
      for (const [key, value] of params.entries()) {
        formData.append(key, value);
      }

      await storeChartData(formData);
    } catch (error) {
      console.error('存储图表数据失败:', error);
    }
  };

  const chart = new Chart(ctx, chartJson);
}
