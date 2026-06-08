# 图表单元格说明（ChartValue Cell）

## 一、职能

图表单元格用于在报表中嵌入可视化图表。单元格的 `value.type` 为 `"chart"` 时即为图表单元格，通过 `value.chart` 对象配置图表数据集绑定、轴配置、选项和插件。支持多种图表类型（柱状图、折线图、饼图、雷达图、散点图、气泡图等），图表数据来源于报表数据集，通过配置分类属性、值属性和系列属性将数据映射到图表维度。报表渲染时后台根据配置生成 Chart.js 格式的 JSON 数据，前端据此渲染图表。

---

## 二、关键约束提示

> **重要提示**：数据模型、约束规则已迁移至 `data-schemas.ts`，通过工具自动校验。
> 生成单元格数据前，请先调用【get_cell_template】工具，传入 type='chart' 获取符合规范的完整模板。

| 约束项 | 要求 |
|--------|------|
| value.type | 固定为 `"chart"` |
| chart.dataset.type | 图表类型，见下方图表类型说明 |
| chart.dataset.datasetName | 必填，报表中已定义的数据集名称 |
| chart.dataset.categoryProperty | 必填，分类属性（用于数据分组） |

> 图表单元格通常不展开（`expand` 为 `"None"`）。

---

## 三、图表类型分类

### 3.1 基础图表（有轴配置）

| 类型 | 说明 | 必填属性 |
|------|------|---------|
| bar | 柱状图 | categoryProperty, valueProperty, seriesType, collectType |
| horizontalBar | 横向柱状图 | categoryProperty, valueProperty, seriesType, collectType |
| line | 折线图 | categoryProperty, valueProperty, seriesType, collectType |
| radar | 雷达图 | categoryProperty, valueProperty, seriesType, collectType |

**轴配置**：需配置 xaxes 和 yaxes

### 3.2 饼图类（无轴配置）

| 类型 | 说明 | 必填属性 |
|------|------|---------|
| pie | 饼图 | categoryProperty, valueProperty, seriesType, collectType |
| doughnut | 环形图 | categoryProperty, valueProperty, seriesType, collectType |
| polarArea | 极区图 | categoryProperty, valueProperty, seriesType, collectType |

**轴配置**：无需配置 xaxes 和 yaxes

### 3.3 散点图/气泡图

| 类型 | 说明 | 必填属性 |
|------|------|---------|
| scatter | 散点图 | categoryProperty, xProperty, yProperty |
| bubble | 气泡图 | categoryProperty, xProperty, yProperty, rProperty |

**轴配置**：需配置 xaxes 和 yaxes

---

## 四、数据结构详解

### 4.1 ChartValue 基础属性

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 固定值 `"chart"` |
| value | string | 否 | 值字段，通常为 null |
| chart | object | 是 | 图表配置对象 |

### 4.2 Chart 配置对象

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dataset | object | 是 | 数据集配置 |
| xaxes | object | 否 | X轴配置，饼图类无需 |
| yaxes | object | 否 | Y轴配置，饼图类无需 |
| options | array | 否 | 图表选项列表 |
| plugins | array | 否 | 图表插件列表 |

### 4.3 Dataset 数据集配置

#### 基础图表属性

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 图表类型 |
| datasetName | string | 是 | 数据集名称 |
| categoryProperty | string | 是 | 分类属性 |
| valueProperty | string | 基础图表必填 | 值属性(Y轴字段) |
| seriesType | string | 基础图表必填 | 系列类型：text/property |
| seriesProperty | string | 否 | 系列属性字段，seriesType为property时使用 |
| seriesText | string | 否 | 系列静态文本，seriesType为text时使用 |
| collectType | string | 基础图表必填 | 聚合方式 |
| labels | array | 否 | 标签列表，饼图类使用 |
| format | string | 否 | 格式化模式 |

#### 散点图/气泡图属性

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| xProperty | string | 散点图/气泡图必填 | X轴字段 |
| yProperty | string | 散点图/气泡图必填 | Y轴字段 |
| rProperty | string | 气泡图必填 | 半径字段 |
| fill | boolean | 否 | 是否填充区域，散点图使用 |
| lineTension | number | 否 | 线条张力(0-1)，散点图使用 |

### 4.4 Axis 轴配置

| 属性 | 类型 | 说明 |
|------|------|------|
| rotation | integer | 标签旋转角度 |
| scaleLabel | object | 轴标题配置 |
| xposition | string | X轴位置：top/bottom |
| yposition | string | Y轴位置：left/right |
| ticks | object | 刻度配置 |

**scaleLabel 配置：**

| 属性 | 类型 | 说明 |
|------|------|------|
| display | boolean | 是否显示轴标题 |
| labelString | string | 标题文本 |
| fontColor | string | 字体颜色 |
| fontSize | integer | 字体大小 |
| fontStyle | string | 字体样式：normal/bold/italic |

### 4.5 Options 图表选项

| 属性 | 类型 | 说明 |
|------|------|------|
| type | string | 选项类型：title/legend/animation/layout |
| display | boolean | 是否显示 |
| position | string | 位置：top/bottom/left/right |
| text | string | 标题文本（title类型） |
| fontSize | integer | 字体大小 |
| fontColor | string | 字体颜色 |
| fontStyle | string | 字体样式 |
| padding | integer | 内边距 |
| labels | array | 图例标签列表（legend类型） |
| duration | integer | 动画持续时间（animation类型） |
| easing | string | 动画缓动效果 |
| layout | object | 布局配置（layout类型） |

### 4.6 Plugins 图表插件

| 属性 | 类型 | 说明 |
|------|------|------|
| name | string | 插件名称，如 data-labels |
| display | boolean | 是否启用 |

---

## 五、完整示例

### 5.1 饼图示例

```json
{
  "rowNumber": 8,
  "columnNumber": 1,
  "name": "A8",
  "value": {
    "type": "chart",
    "value": null,
    "chart": {
      "dataset": {
        "type": "pie",
        "datasetName": "product",
        "categoryProperty": "order_id",
        "valueProperty": "price",
        "seriesType": "property",
        "seriesProperty": "price",
        "seriesText": null,
        "collectType": "sum",
        "labels": null,
        "format": null
      },
      "xaxes": null,
      "yaxes": null,
      "options": [
        {
          "type": "title",
          "display": true,
          "position": "top",
          "fontSize": 14,
          "fontColor": "#666",
          "fontStyle": "bold",
          "padding": 10,
          "text": "图表标题"
        }
      ],
      "plugins": [
        {
          "name": "data-labels",
          "display": true
        }
      ]
    }
  },
  "expand": "None",
  "cellStyle": {
    "align": "center",
    "valign": "middle"
  }
}
```

### 5.2 散点图示例

```json
{
  "rowNumber": 9,
  "columnNumber": 1,
  "name": "A9",
  "value": {
    "type": "chart",
    "value": null,
    "chart": {
      "dataset": {
        "type": "scatter",
        "datasetName": "product",
        "categoryProperty": "order_id",
        "xProperty": "quantity",
        "yProperty": "price",
        "fill": true,
        "lineTension": 0.2,
        "rProperty": "",
        "format": null
      },
      "xaxes": {
        "rotation": 1,
        "scaleLabel": {
          "display": true,
          "labelString": "x轴标题",
          "fontColor": "#666",
          "fontSize": 12,
          "fontStyle": "normal"
        },
        "xposition": "bottom",
        "ticks": {
          "minRotation": 1
        }
      },
      "yaxes": {
        "rotation": 0,
        "scaleLabel": {
          "display": true,
          "labelString": "y轴标题",
          "fontColor": "#666",
          "fontSize": 12,
          "fontStyle": "normal"
        },
        "yposition": null
      },
      "options": [
        {
          "type": "title",
          "display": true,
          "position": "top",
          "fontSize": 14,
          "fontColor": "#666",
          "fontStyle": "bold",
          "padding": 10,
          "text": "图表标题"
        },
        {
          "type": "legend",
          "display": true,
          "position": "top",
          "labels": null
        }
      ],
      "plugins": [
        {
          "name": "data-labels",
          "display": true
        }
      ]
    }
  },
  "expand": "None",
  "cellStyle": {
    "align": "center",
    "valign": "middle"
  }
}
```