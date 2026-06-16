# 图表单元格说明

## 一、概念说明
图表单元格用于在报表中嵌入可视化图表。单元格的 `value.type` 为 `"chart"` 时即为图表单元格，通过 `value.chart` 对象配置图表数据集绑定、轴配置、选项和插件。图表数据来源于报表数据集，通过配置分类属性、值属性和系列属性将数据映射到图表维度。

## 二、关键规则
1. **必须绑定数据集**：`chart.dataset.datasetName` 必须是报表中已定义的数据集名称。
2. **图表单元格通常不展开**：`expand` 通常设为 `"None"`。
3. **饼图类无需轴配置**：pie/doughnut/polarArea 无需配置 xaxes 和 yaxes。

## 三、图表类型分类
| 类型 | 说明 | 轴配置 |
|------|------|--------|
| bar | 柱状图 | 需 xaxes/yaxes |
| horizontalBar | 横向柱状图 | 需 xaxes/yaxes |
| line | 折线图 | 需 xaxes/yaxes |
| radar | 雷达图 | 需 xaxes/yaxes |
| pie | 饼图 | 无需 |
| doughnut | 环形图 | 无需 |
| polarArea | 极区图 | 无需 |
| scatter | 散点图 | 需 xaxes/yaxes |
| bubble | 气泡图 | 需 xaxes/yaxes |

## 四、数据约束
数据约束由 data-schemas.ts 自动校验。主要约束：
- chart.dataset.type 必须是有效图表类型
- chart.dataset.datasetName 必填
- chart.dataset.categoryProperty 必填
- 基础图表需 valueProperty、seriesType、collectType
- 散点图需 xProperty、yProperty
- 气泡图需 xProperty、yProperty、rProperty
