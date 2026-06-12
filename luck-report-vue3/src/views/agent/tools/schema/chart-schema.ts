/**
 * 图表单元格数据模型 JSON Schema 定义
 */

// ==================== 图表相关 Schema ====================

/**
 * ChartDataset 图表数据集 Schema
 * 文档参考: chart-cell.md
 *
 * 不同图表类型的数据集配置差异：
 * - 基础图表(bar/horizontalBar/line/radar)：使用 categoryProperty/valueProperty/seriesType/collectType
 * - 饼图类(pie/doughnut/polarArea)：使用 categoryProperty/valueProperty/seriesType/collectType/labels
 * - 散点图(scatter)：使用 xProperty/yProperty/fill/lineTension
 * - 气泡图(bubble)：使用 xProperty/yProperty/rProperty
 */
export const ChartDatasetSchema = {
  type: 'object',
  properties: {
    // 图表类型
    type: {
      type: 'string',
      enum: ['bar', 'horizontalBar', 'line', 'pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble'],
      description: '图表类型：bar-柱状图，horizontalBar-横向柱状图，line-折线图，pie-饼图，doughnut-环形图，radar-雷达图，polarArea-极区图，scatter-散点图，bubble-气泡图'
    },

    // 数据集名称（所有图表类型必填）
    datasetName: { type: 'string', description: '绑定的数据集名称，必须为报表中已定义的数据集' },

    // 分类属性（所有图表类型必填）
    categoryProperty: { type: 'string', description: '分类属性，用于数据分组' },

    // ========== 基础图表属性（bar/line/pie等）==========
    valueProperty: { type: 'string', description: '值属性(Y轴字段)，基础图表(bar/line/pie等)使用' },
    seriesType: { type: 'string', enum: ['text', 'property'], description: '系列类型：text为静态文本，property为属性分组，基础图表使用' },
    seriesProperty: { type: 'string', description: '系列属性字段，当seriesType为property时使用' },
    seriesText: { type: 'string', description: '系列静态文本，当seriesType为text时使用' },
    collectType: { type: 'string', enum: ['select', 'sum', 'count', 'avg', 'max', 'min'], description: '聚合方式，基础图表使用' },
    labels: { type: 'array', items: { type: 'string' }, description: '标签列表，饼图类图表使用' },

    // ========== 散点图/气泡图属性==========
    xProperty: { type: 'string', description: 'X轴字段，散点图/气泡图使用' },
    yProperty: { type: 'string', description: 'Y轴字段，散点图/气泡图使用' },
    rProperty: { type: 'string', description: '半径字段，仅气泡图使用' },
    fill: { type: 'boolean', description: '是否填充区域，散点图使用' },
    lineTension: { type: 'number', description: '线条曲度(0-1)，散点图使用' },

    // ========== 图表样式属性==========
    backgroundColor: { type: 'string', description: '背景色，如rgba(255,99,132,0.2)' },
    borderColor: { type: 'string', description: '边框色，如rgba(255,99,132,1)' },
    borderWidth: { type: 'integer', description: '边框宽度' }
  },
  required: ['type', 'datasetName', 'categoryProperty'],
  description: '图表数据集配置，不同图表类型有不同属性要求'
}

/**
 * ChartAxisScaleLabel 图表轴标题 Schema
 */
export const ChartAxisScaleLabelSchema = {
  type: 'object',
  properties: {
    display: { type: 'boolean', description: '是否显示轴标题' },
    labelString: { type: 'string', description: '轴标题文本' },
    fontColor: { type: 'string', description: '字体颜色' },
    fontSize: { type: 'integer', description: '字体大小' }
  },
  description: '图表轴标题配置'
}

/**
 * ChartAxisTicks 图表轴刻度 Schema
 */
export const ChartAxisTicksSchema = {
  type: 'object',
  properties: {
    minRotation: { type: 'integer', description: '最小旋转角度' },
    maxRotation: { type: 'integer', description: '最大旋转角度' }
  },
  description: '图表轴刻度配置'
}

/**
 * ChartAxis 图表轴配置 Schema
 */
export const ChartAxisSchema = {
  type: 'object',
  properties: {
    rotation: { type: 'integer', description: '标签旋转角度，如0、45、90' },
    scaleLabel: { ...ChartAxisScaleLabelSchema, description: '轴标题配置' },
    xposition: { type: 'string', enum: ['top', 'bottom'], description: 'X轴位置' },
    yposition: { type: 'string', enum: ['left', 'right'], description: 'Y轴位置' },
    ticks: { ...ChartAxisTicksSchema, description: '刻度配置' }
  },
  description: '图表轴配置'
}

/**
 * ChartOption 图表选项 Schema
 * 支持多种选项类型：title/legend/animation/layout
 */
export const ChartOptionSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['title', 'legend', 'layout', 'animation'], description: '选项类型' },
    // title 选项属性
    display: { type: 'boolean', description: '是否显示' },
    position: { type: 'string', enum: ['top', 'bottom', 'left', 'right'], description: '位置' },
    text: { type: 'string', description: '标题文本，type为title时使用' },
    fontSize: { type: 'integer', description: '字体大小' },
    fontColor: { type: 'string', description: '字体颜色，如#666' },
    fontStyle: { type: 'string', enum: ['normal', 'bold', 'italic'], description: '字体样式' },
    padding: { type: 'integer', description: '内边距' },
    // legend 选项属性
    labels: { type: 'array', items: { type: 'string' }, description: '图例标签列表' },
    // animation 选项属性
    duration: { type: 'integer', description: '动画持续时间(ms)' },
    easing: { type: 'string', description: '动画缓动效果' },
    // layout 选项属性
    layout: {
      type: 'object',
      properties: {
        top: { type: 'integer', description: '上边距' },
        bottom: { type: 'integer', description: '下边距' },
        left: { type: 'integer', description: '左边距' },
        right: { type: 'integer', description: '右边距' }
      },
      description: '布局配置'
    }
  },
  description: '图表选项配置'
}

/**
 * ChartPlugin 图表插件 Schema
 */
export const ChartPluginSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '插件名称，如data-labels' },
    display: { type: 'boolean', description: '是否启用' }
  },
  description: '图表插件配置'
}

/**
 * ChartValue 图表值 Schema
 * 文档参考: chart-cell.md
 */
export const ChartValueSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', const: 'chart' },
    value: { type: 'string', nullable: true, description: '值字段，通常为null' },
    chart: {
      type: 'object',
      properties: {
        dataset: ChartDatasetSchema,
        xaxes: { ...ChartAxisSchema, description: 'X轴配置，饼图/环形图等无轴图表无需配置' },
        yaxes: { ...ChartAxisSchema, description: 'Y轴配置，饼图/环形图等无轴图表无需配置' },
        options: { type: 'array', items: ChartOptionSchema, description: '图表选项列表(title/legend/layout/animation)' },
        plugins: { type: 'array', items: ChartPluginSchema, description: '图表插件列表(data-labels等)' }
      },
      required: ['dataset']
    }
  },
  required: ['type', 'chart'],
  description: '图表值对象，包含完整图表配置'
}

// ==================== 数据校验函数 ====================

/**
 * 校验图表值数据是否符合规范
 * 收集 dataset/xaxes/yaxes/options/plugins 各部分的全部错误，一次性返回
 * 避免 LLM 一次只看到一条报错反复重试
 *
 * @param chartValue - 图表值对象
 * @returns 错误信息（多条用换行分隔），undefined 表示校验通过
 */
export function validateChartValue(chartValue: any): string | undefined {
  if (!chartValue || typeof chartValue !== 'object') {
    return 'chartValue 必须是对象类型'
  }
  const errors: string[] = []

  // type 必须是 chart
  if (chartValue.type !== 'chart') {
    errors.push('chartValue.type 必须是 "chart"')
  }

  // chart 必须是对象
  if (!chartValue.chart || typeof chartValue.chart !== 'object') {
    errors.push('chartValue.chart 必须是对象类型')
  } else {
    // dataset 校验：收集 dataset 全部错误而不是只取第一个
    const datasetError = validateChartDataset(chartValue.chart.dataset)
    if (datasetError) errors.push(`chart.dataset: ${datasetError}`)

    // xaxes 校验（可选）
    if (chartValue.chart.xaxes) {
      const xaxesError = validateChartAxis(chartValue.chart.xaxes, 'xaxes')
      if (xaxesError) errors.push(`chart.xaxes: ${xaxesError}`)
    }

    // yaxes 校验（可选）
    if (chartValue.chart.yaxes) {
      const yaxesError = validateChartAxis(chartValue.chart.yaxes, 'yaxes')
      if (yaxesError) errors.push(`chart.yaxes: ${yaxesError}`)
    }

    // options 校验（可选）：遍历全部选项并收集所有错误
    if (chartValue.chart.options !== undefined) {
      if (!Array.isArray(chartValue.chart.options)) {
        errors.push('chart.options 必须是数组')
      } else {
        for (let i = 0; i < chartValue.chart.options.length; i++) {
          const optionError = validateChartOption(chartValue.chart.options[i], i)
          if (optionError) errors.push(`chart.options[${i}]: ${optionError}`)
        }
      }
    }

    // plugins 校验（可选）：遍历全部插件并收集所有错误
    if (chartValue.chart.plugins !== undefined) {
      if (!Array.isArray(chartValue.chart.plugins)) {
        errors.push('chart.plugins 必须是数组')
      } else {
        for (let i = 0; i < chartValue.chart.plugins.length; i++) {
          const pluginError = validateChartPlugin(chartValue.chart.plugins[i], i)
          if (pluginError) errors.push(`chart.plugins[${i}]: ${pluginError}`)
        }
      }
    }
  }

  return errors.length ? errors.join('\n') : undefined
}

/**
 * 校验图表数据集是否符合规范
 *
 * @param dataset - 图表数据集对象
 * @returns 错误信息（多条用换行分隔），undefined 表示校验通过
 */
function validateChartDataset(dataset: any): string | undefined {
  if (!dataset || typeof dataset !== 'object') {
    return 'chartValue.chart.dataset 必须是对象类型'
  }
  const errors: string[] = []

  // type 校验
  const validChartTypes = ['bar', 'horizontalBar', 'line', 'pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble']
  if (!dataset.type || !validChartTypes.includes(dataset.type)) {
    errors.push(`type 必须是 ${validChartTypes.join('/')} 之一，当前为 ${dataset.type}`)
  }

  // datasetName 校验
  if (!dataset.datasetName || typeof dataset.datasetName !== 'string') {
    errors.push('datasetName 必须是非空字符串')
  }

  // categoryProperty 校验
  if (!dataset.categoryProperty || typeof dataset.categoryProperty !== 'string') {
    errors.push('categoryProperty 必须是非空字符串')
  }

  // 基础图表类型（bar/line/pie等）需要 valueProperty 和 collectType
  const basicChartTypes = ['bar', 'horizontalBar', 'line', 'pie', 'doughnut', 'radar', 'polarArea']
  if (basicChartTypes.includes(dataset.type)) {
    if (!dataset.valueProperty || typeof dataset.valueProperty !== 'string') {
      errors.push('valueProperty 必须是非空字符串（基础图表类型）')
    }

    // collectType 校验
    const validCollectTypes = ['select', 'sum', 'count', 'avg', 'max', 'min']
    if (dataset.collectType && !validCollectTypes.includes(dataset.collectType)) {
      errors.push(`collectType 必须是 ${validCollectTypes.join('/')} 之一，当前为 ${dataset.collectType}`)
    }

    // seriesType 校验
    if (dataset.seriesType) {
      const validSeriesTypes = ['text', 'property']
      if (!validSeriesTypes.includes(dataset.seriesType)) {
        errors.push(`seriesType 必须是 ${validSeriesTypes.join('/')} 之一，当前为 ${dataset.seriesType}`)
      }
    }
  }

  // 散点图需要 xProperty 和 yProperty
  if (dataset.type === 'scatter') {
    if (!dataset.xProperty || typeof dataset.xProperty !== 'string') {
      errors.push('xProperty 必须是非空字符串（散点图）')
    }
    if (!dataset.yProperty || typeof dataset.yProperty !== 'string') {
      errors.push('yProperty 必须是非空字符串（散点图）')
    }
  }

  // 气泡图需要 xProperty、yProperty 和 rProperty
  if (dataset.type === 'bubble') {
    if (!dataset.xProperty || typeof dataset.xProperty !== 'string') {
      errors.push('xProperty 必须是非空字符串（气泡图）')
    }
    if (!dataset.yProperty || typeof dataset.yProperty !== 'string') {
      errors.push('yProperty 必须是非空字符串（气泡图）')
    }
    if (!dataset.rProperty || typeof dataset.rProperty !== 'string') {
      errors.push('rProperty 必须是非空字符串（气泡图）')
    }
  }

  return errors.length ? errors.join('\n') : undefined
}

/**
 * 校验图表轴配置是否符合规范
 *
 * @param axis - 图表轴配置对象
 * @param axisName - 轴名称（xaxes/yaxes）
 * @returns 错误信息（多条用换行分隔），undefined 表示校验通过
 */
function validateChartAxis(axis: any, axisName: string): string | undefined {
  if (!axis || typeof axis !== 'object') {
    return `chartValue.chart.${axisName} 必须是对象类型`
  }
  const errors: string[] = []

  // rotation 校验（可选）
  if (axis.rotation !== undefined && typeof axis.rotation !== 'number') {
    errors.push('rotation 必须是数字类型')
  }

  // xposition 校验（仅 xaxes）
  if (axisName === 'xaxes' && axis.xposition) {
    const validPositions = ['top', 'bottom']
    if (!validPositions.includes(axis.xposition)) {
      errors.push(`xposition 必须是 ${validPositions.join('/')} 之一，当前为 ${axis.xposition}`)
    }
  }

  // yposition 校验（仅 yaxes）
  if (axisName === 'yaxes' && axis.yposition) {
    const validPositions = ['left', 'right']
    if (!validPositions.includes(axis.yposition)) {
      errors.push(`yposition 必须是 ${validPositions.join('/')} 之一，当前为 ${axis.yposition}`)
    }
  }

  // scaleLabel 校验（可选）：收集 display 字段类型错误与对象类型错误
  if (axis.scaleLabel) {
    if (typeof axis.scaleLabel !== 'object') {
      errors.push('scaleLabel 必须是对象类型')
    } else if (axis.scaleLabel.display !== undefined && typeof axis.scaleLabel.display !== 'boolean') {
      errors.push('scaleLabel.display 必须是布尔类型')
    }
  }

  // ticks 校验（可选）
  if (axis.ticks) {
    if (typeof axis.ticks !== 'object') {
      errors.push('ticks 必须是对象类型')
    }
  }

  return errors.length ? errors.join('\n') : undefined
}

/**
 * 校验图表选项是否符合规范
 * 收集 type/display/position/text 等字段的错误
 *
 * @param option - 图表选项对象
 * @param index - 选项索引
 * @returns 错误信息（多条用换行分隔），undefined 表示校验通过
 */
function validateChartOption(option: any, index: number): string | undefined {
  if (!option || typeof option !== 'object') {
    return `chartValue.chart.options[${index}] 必须是对象类型`
  }
  const errors: string[] = []

  // type 校验
  const validOptionTypes = ['title', 'legend', 'layout', 'animation']
  if (!option.type || !validOptionTypes.includes(option.type)) {
    errors.push(`type 必须是 ${validOptionTypes.join('/')} 之一，当前为 ${option.type}`)
  }

  // display 校验（可选）
  if (option.display !== undefined && typeof option.display !== 'boolean') {
    errors.push('display 必须是布尔类型')
  }

  // position 校验（可选）
  if (option.position) {
    const validPositions = ['top', 'bottom', 'left', 'right']
    if (!validPositions.includes(option.position)) {
      errors.push(`position 必须是 ${validPositions.join('/')} 之一，当前为 ${option.position}`)
    }
  }

  // title 类型必须有 text
  if (option.type === 'title' && option.display === true) {
    if (!option.text || typeof option.text !== 'string') {
      errors.push('text 必须是非空字符串（当 type 为 title 且 display 为 true 时）')
    }
  }

  return errors.length ? errors.join('\n') : undefined
}

/**
 * 校验图表插件是否符合规范
 * 收集 name/display 字段的错误
 *
 * @param plugin - 图表插件对象
 * @param index - 插件索引
 * @returns 错误信息（多条用换行分隔），undefined 表示校验通过
 */
function validateChartPlugin(plugin: any, index: number): string | undefined {
  if (!plugin || typeof plugin !== 'object') {
    return `chartValue.chart.plugins[${index}] 必须是对象类型`
  }
  const errors: string[] = []

  // name 校验
  if (!plugin.name || typeof plugin.name !== 'string') {
    errors.push('name 必须是非空字符串')
  }

  // display 校验（可选）
  if (plugin.display !== undefined && typeof plugin.display !== 'boolean') {
    errors.push('display 必须是布尔类型')
  }

  return errors.length ? errors.join('\n') : undefined
}

// ==================== 数据模板生成函数 ====================

/**
 * 生成图表单元格模板
 *
 * @param rowIndex - 行索引，从0开始
 * @param colIndex - 列索引，从0开始
 * @param datasetName - 数据集名称，默认空字符串（LLM 必须传入真实数据集名）
 * @param categoryProperty - 分类属性（X轴字段）
 * @param valueProperty - 值属性（Y轴字段）
 * @param chartType - 图表类型，默认 pie
 * @returns 符合规范的图表单元格模板对象
 */
export function getChartCellTemplate(
  rowIndex: number,
  colIndex: number,
  datasetName: string = '',
  categoryProperty: string = '',
  valueProperty: string = '',
  chartType: 'bar' | 'horizontalBar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea' | 'scatter' | 'bubble' = 'pie'
): object {
  const rowNumber = rowIndex + 1
  const colNumber = colIndex + 1
  const colLetter = String.fromCharCode(65 + colIndex)

  return {
    rowNumber,
    columnNumber: colNumber,
    rowSpan: 0,
    colSpan: 0,
    name: `${colLetter}${rowNumber}`,
    value: {
      chart: {
        dataset: {
          collectType: 'sum',
          datasetName,
          categoryProperty,
          seriesProperty: null,
          valueProperty,
          seriesText: null,
          seriesType: 'property',
          labels: null,
          format: null,
          type: chartType
        },
        xaxes: null,
        yaxes: null,
        options: null,
        plugins: null
      },
      value: null,
      type: 'chart'
    },
    cellStyle: {
      bgcolor: null,
      forecolor: '0,0,0',
      fontSize: 10,
      fontFamily: '宋体',
      format: null,
      lineHeight: 0,
      align: 'center',
      valign: 'middle',
      bold: null,
      italic: null,
      underline: null,
      wrapCompute: null,
      leftBorder: null,
      rightBorder: null,
      topBorder: null,
      bottomBorder: null
    },
    linkUrl: null,
    linkTargetWindow: null,
    linkParameters: null,
    fillBlankRows: false,
    multiple: 0,
    expand: 'None',
    leftParentCellName: null,
    topParentCellName: null
  }
}