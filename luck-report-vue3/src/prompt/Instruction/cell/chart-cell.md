# 图表单元格说明（ChartValue Cell）

## 一、职能

图表单元格用于在报表中嵌入可视化图表。单元格的 `value.type` 为 `"chart"` 时即为图表单元格，通过 `value.chart` 对象配置图表数据集绑定、轴配置、选项和插件。支持多种图表类型（柱状图、折线图、饼图、雷达图等），图表数据来源于报表数据集，通过配置分类属性、值属性和系列属性将数据映射到图表维度。报表渲染时后台根据配置生成 Chart.js 格式的 JSON 数据，前端据此渲染图表。

---

## 二、数据模型

**结构概览**：`CellDefinition` → `value(ChartValue)` → `chart(Chart)` → `dataset(Dataset)` + `xaxes(XAxes)` + `yaxes(YAxes)` + `options(List<Option>)` + `plugins(List<Plugin>)`

### 1、CellDefinition 单元格定义

CellDefinition 的通用字段与普通文本单元格一致，详见[普通文本类型单元格说明](simple-text-cell.md)的 CellDefinition 部分。图表单元格重点关注以下字段：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| value | ChartValue | 单元格值对象 | 见 ChartValue 数据模型 |
| expand | String | 展开方向 | 图表单元格通常为 `"None"`（不展开） |

---

### 2、ChartValue 值对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| type | String | 值类型 | 固定 `"chart"`，标识为图表类型 |
| chart | Chart | 图表配置对象 | 见 Chart 数据模型 |

---

### 3、Chart 图表配置对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| dataset | Dataset | 图表数据集配置 | 见 CategoryDataset 数据模型 |
| xaxes | XAxes | X 轴配置 | 见 XAxes 数据模型，`null` 为无 X 轴配置 |
| yaxes | YAxes | Y 轴配置 | 见 YAxes 数据模型，`null` 为无 Y 轴配置 |
| options | List\<Option\> | 图表选项列表 | 可包含 TitleOption、LegendOption、LayoutOption、AnimationsOption |
| plugins | List\<Plugin\> | 图表插件列表 | 可包含 DataLabelsPlugin |

---

### 4、CategoryDataset 分类数据集对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| datasetName | String | 绑定的数据集名称 | 必须为报表中已定义的数据集名称 |
| categoryProperty | String | 分类属性（X 轴字段） | 数据集中的字段名，如 `"category_name"` |
| valueProperty | String | 值属性（Y 轴字段） | 数据集中的字段名，如 `"price"` |
| seriesType | String | 系列类型 | `"text"`（静态文本）/ `"property"`（属性），默认 `"text"` |
| seriesProperty | String | 系列属性字段 | 当 `seriesType` 为 `"property"` 时使用，指定数据集中的系列分组字段 |
| seriesText | String | 系列静态文本 | 当 `seriesType` 为 `"text"` 时使用，如 `"销售额"` |
| collectType | String | 聚合方式 | 见 CollectType 枚举值 |
| format | String | 格式化模式 | 如 `"#.##"`、`"yyyy-MM-dd"`，`null` 为不格式化 |

---

### 5、图表类型与 Dataset 实现类

| 图表类型 | Dataset 实现类 | type 值 | 是否有 Y 轴 |
|---------|---------------|---------|------------|
| 柱状图 | BarDataset | `"bar"` | 是 |
| 水平柱状图 | HorizontalBarDataset | `"horizontalBar"` | 是 |
| 折线图 | LineDataset | `"line"` | 是 |
| 面积图 | AreaDataset | `"line"`（fill=true） | 是 |
| 饼图 | PieDataset | `"pie"` | 否 |
| 环形图 | DoughnutDataset | `"doughnut"` | 否 |
| 雷达图 | RadarDataset | `"radar"` | 否 |
| 极地图 | PolarDataset | `"polarArea"` | 否 |

---

### 6、CollectType 图表聚合方式枚举

| 枚举值 | 说明 |
|--------|------|
| `select` | 取第一条值 |
| `sum` | 求和 |
| `count` | 计数 |
| `avg` | 平均值 |
| `max` | 最大值 |
| `min` | 最小值 |

---

### 7、SeriesType 系列类型枚举

| 枚举值 | 说明 |
|--------|------|
| `text` | 静态文本，所有数据归入同一系列 |
| `property` | 属性，按指定字段的值分组为多个系列 |

---

### 8、XAxes X 轴配置对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| rotation | Integer | 标签旋转角度 | 如 `0`、`45`、`90` |
| scaleLabel | ScaleLabel | 轴标题配置 | 见 ScaleLabel 数据模型，`null` 为无标题 |

---

### 9、YAxes Y 轴配置对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| rotation | Integer | 标签旋转角度 | 如 `0`、`45`、`90` |
| scaleLabel | ScaleLabel | 轴标题配置 | 见 ScaleLabel 数据模型，`null` 为无标题 |

---

### 10、ScaleLabel 轴标题对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| display | Boolean | 是否显示轴标题 | `true` / `false`，默认 `false` |
| labelString | String | 标题文本 | 如 `"金额"`、`"数量"` |
| fontColor | String | 字体颜色 | 如 `"#666"` |
| fontSize | Integer | 字体大小 | 如 `12` |
| fontStyle | String | 字体样式 | `"normal"` / `"bold"` / `"italic"` |

---

### 11、Option 图表选项对象

图表选项通过 `type` 字段区分类型，存储在 `chart.options` 数组中：

| 选项类型 | type 值 | 说明 |
|---------|---------|------|
| TitleOption | `"title"` | 图表标题配置 |
| LegendOption | `"legend"` | 图例配置 |
| LayoutOption | `"layout"` | 布局配置 |
| AnimationsOption | `"animation"` | 动画配置 |

#### TitleOption 标题选项

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| type | String | 选项类型 | 固定 `"title"` |
| display | Boolean | 是否显示标题 | `true` / `false` |
| text | String | 标题文本 | 如 `"销售统计图"` |
| position | String | 标题位置 | `"top"` / `"bottom"` / `"left"` / `"right"` |
| fontSize | Integer | 字体大小 | 如 `14` |
| fontColor | String | 字体颜色 | 如 `"#666"` |
| fontStyle | String | 字体样式 | `"normal"` / `"bold"` / `"italic"` |
| padding | Integer | 内边距 | 如 `10` |

#### LegendOption 图例选项

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| type | String | 选项类型 | 固定 `"legend"` |
| display | Boolean | 是否显示图例 | `true` / `false`，默认 `true` |
| position | String | 图例位置 | `"top"` / `"bottom"` / `"left"` / `"right"` |

#### LayoutOption 布局选项

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| type | String | 选项类型 | 固定 `"layout"` |
| padding | Padding | 内边距配置 | 见 Padding 数据模型 |

#### Padding 内边距对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| left | Integer | 左内边距 | 如 `10` |
| right | Integer | 右内边距 | 如 `10` |
| top | Integer | 上内边距 | 如 `10` |
| bottom | Integer | 下内边距 | 如 `10` |

#### AnimationsOption 动画选项

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| type | String | 选项类型 | 固定 `"animation"` |
| duration | Integer | 动画时长（ms） | 如 `1000` |
| easing | String | 缓动函数 | 见 Easing 枚举值 |

---

### 12、Easing 缓动函数枚举

| 枚举值 | 说明 |
|--------|------|
| `linear` | 线性 |
| `easeInQuad` | 加速二次 |
| `easeOutQuad` | 减速二次 |
| `easeInOutQuad` | 先加后减二次 |
| `easeInCubic` | 加速三次 |
| `easeOutCubic` | 减速三次 |
| `easeInOutCubic` | 先加后减三次 |
| `easeInQuart` | 加速四次 |
| `easeOutQuart` | 减速四次 |
| `easeInOutQuart` | 先加后减四次 |
| `easeInQuint` | 加速五次 |
| `easeOutQuint` | 减速五次 |
| `easeInOutQuint` | 先加后减五次 |
| `easeInSine` | 加速正弦 |
| `easeOutSine` | 减速正弦 |
| `easeInOutSine` | 先加后减正弦 |
| `easeInExpo` | 加速指数 |
| `easeOutExpo` | 减速指数 |
| `easeInOutExpo` | 先加后减指数 |
| `easeInCirc` | 加速圆形 |
| `easeOutCirc` | 减速圆形 |
| `easeInOutCirc` | 先加后减圆形 |
| `easeInElastic` | 加速弹性 |
| `easeOutElastic` | 减速弹性 |
| `easeInOutElastic` | 先加后减弹性 |
| `easeInBack` | 加速回退 |
| `easeOutBack` | 减速回退 |
| `easeInOutBack` | 先加后减回退 |
| `easeInBounce` | 加速弹跳 |
| `easeOutBounce` | 减速弹跳 |
| `easeInOutBounce` | 先加后减弹跳 |

---

### 13、Plugin 图表插件对象

图表插件通过 `name` 字段区分类型，存储在 `chart.plugins` 数组中：

#### DataLabelsPlugin 数据标签插件

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| name | String | 插件名称 | 固定 `"data-labels"` |
| display | Boolean | 是否显示数据标签 | `true` / `false` |

---

### 14、Position 位置枚举

| 枚举值 | 说明 |
|--------|------|
| `left` | 左侧 |
| `right` | 右侧 |
| `top` | 顶部 |
| `bottom` | 底部 |

---

## 三、数据约束规则

| 规则编号 | 约束对象 | 约束说明 |
|---------|---------|---------|
| CH-01 | 值类型固定 | 图表单元格的 `value.type` 固定为 `"chart"`，不可更改 |
| CH-02 | 数据集必填 | `chart.dataset.datasetName` 必须为报表中已定义的数据集名称 |
| CH-03 | 分类属性必填 | `chart.dataset.categoryProperty` 必须为数据集中的字段名，对应图表 X 轴分类 |
| CH-04 | 值属性必填 | `chart.dataset.valueProperty` 必须为数据集中的字段名，对应图表 Y 轴数值 |
| CH-05 | 系列类型 | `seriesType` 为 `"text"` 时使用 `seriesText` 指定系列名；为 `"property"` 时使用 `seriesProperty` 指定系列分组字段 |
| CH-06 | 聚合方式 | `collectType` 决定同一分类下多个值的聚合方式，默认 `"select"` |
| CH-07 | 轴配置 | 柱状图、折线图、面积图等有 Y 轴的图表类型需配置 `xaxes` 和 `yaxes`；饼图、环形图、雷达图等无 Y 轴的图表类型无需配置 |
| CH-08 | 展开方向 | 图表单元格通常 `expand` 为 `"None"`（不展开），因为图表本身是一个整体 |
| CH-09 | 选项配置 | `chart.options` 数组中每种类型的 Option 只能有一个（如只有一个 title、一个 legend） |
| CH-10 | 插件配置 | `chart.plugins` 数组中每种类型的 Plugin 只能有一个 |
| CH-11 | 格式化 | `chart.dataset.format` 可对分类标签进行格式化，如日期格式 `"yyyy-MM-dd"`、数字格式 `"#,###.##"` |

---

## 四、参考数据

以下为两份图表单元格的 JSON 示例：第一份为柱状图单元格（含标题、图例、轴配置），第二份为饼图单元格（含数据标签）。

### 示例1：柱状图单元格

```json
{
  "rowNumber": 9,
  "columnNumber": 1,
  "rowSpan": 0,
  "colSpan": 3,
  "name": "A9",
  "value": {
    "type": "chart",
    "chart": {
      "dataset": {
        "type": "bar",
        "datasetName": "orders",
        "categoryProperty": "category_name",
        "valueProperty": "price",
        "seriesType": "text",
        "seriesProperty": "",
        "seriesText": "销售额",
        "collectType": "sum",
        "format": null
      },
      "xaxes": {
        "rotation": 0,
        "scaleLabel": {
          "display": true,
          "labelString": "类别",
          "fontColor": "#666",
          "fontSize": 12,
          "fontStyle": "normal"
        }
      },
      "yaxes": {
        "rotation": 0,
        "scaleLabel": {
          "display": true,
          "labelString": "金额",
          "fontColor": "#666",
          "fontSize": 12,
          "fontStyle": "normal"
        }
      },
      "options": [
        {
          "type": "title",
          "display": true,
          "text": "各类别销售额统计",
          "position": "top",
          "fontSize": 14,
          "fontColor": "#666",
          "fontStyle": "bold",
          "padding": 10
        },
        {
          "type": "legend",
          "display": true,
          "position": "top"
        },
        {
          "type": "layout",
          "padding": {
            "left": 10,
            "right": 10,
            "top": 10,
            "bottom": 10
          }
        },
        {
          "type": "animation",
          "duration": 1000,
          "easing": "easeOutQuad"
        }
      ],
      "plugins": [
        {
          "name": "data-labels",
          "display": false
        }
      ]
    }
  },
  "cellStyle": {
    "bgcolor": null,
    "forecolor": "0,0,0",
    "fontSize": 10,
    "fontFamily": "宋体",
    "format": null,
    "lineHeight": 0,
    "align": "center",
    "valign": "middle",
    "bold": null,
    "italic": null,
    "underline": null,
    "wrapCompute": null,
    "leftBorder": null,
    "rightBorder": null,
    "topBorder": null,
    "bottomBorder": null
  },
  "linkUrl": null,
  "linkTargetWindow": null,
  "linkParameters": null,
  "fillBlankRows": false,
  "multiple": 0,
  "expand": "None",
  "leftParentCellName": null,
  "topParentCellName": null,
  "conditionPropertyItems": null
}
```

### 示例2：饼图单元格

```json
{
  "rowNumber": 9,
  "columnNumber": 4,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "D9",
  "value": {
    "type": "chart",
    "chart": {
      "dataset": {
        "type": "pie",
        "datasetName": "orders",
        "categoryProperty": "category_name",
        "valueProperty": "price",
        "seriesType": "text",
        "seriesProperty": "",
        "seriesText": "占比",
        "collectType": "sum",
        "format": null
      },
      "xaxes": null,
      "yaxes": null,
      "options": [
        {
          "type": "title",
          "display": true,
          "text": "类别占比",
          "position": "top",
          "fontSize": 14,
          "fontColor": "#666",
          "fontStyle": "bold",
          "padding": 10
        },
        {
          "type": "legend",
          "display": true,
          "position": "right"
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
  "cellStyle": {
    "bgcolor": null,
    "forecolor": "0,0,0",
    "fontSize": 10,
    "fontFamily": "宋体",
    "format": null,
    "lineHeight": 0,
    "align": "center",
    "valign": "middle",
    "bold": null,
    "italic": null,
    "underline": null,
    "wrapCompute": null,
    "leftBorder": null,
    "rightBorder": null,
    "topBorder": null,
    "bottomBorder": null
  },
  "linkUrl": null,
  "linkTargetWindow": null,
  "linkParameters": null,
  "fillBlankRows": false,
  "multiple": 0,
  "expand": "None",
  "leftParentCellName": null,
  "topParentCellName": null,
  "conditionPropertyItems": null
}
```

> **关键规则**：图表单元格的 `value.type` 必须为 `"chart"`，`value.chart` 包含完整的图表配置。`chart.dataset` 必须指定 `datasetName`、`categoryProperty`、`valueProperty`，`seriesType` 决定系列来源（静态文本或属性分组），`collectType` 决定聚合方式。有 Y 轴的图表类型（柱状图、折线图等）需配置 `xaxes` 和 `yaxes`；无 Y 轴的类型（饼图、环形图等）无需配置。`chart.options` 数组存储标题、图例、布局、动画等配置，`chart.plugins` 数组存储数据标签等插件配置。图表单元格通常不展开（`expand` 为 `"None"`）。
