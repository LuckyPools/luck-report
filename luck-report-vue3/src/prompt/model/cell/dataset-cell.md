# 数据集单元格说明

## 一、概念说明
数据集单元格用于绑定数据集字段，根据聚合方式取值。单元格的 `value.type` 为 `"dataset"` 时即为数据集单元格，通过 `value.datasetName` 指定数据集，通过 `value.property` 指定字段，通过 `value.aggregate` 指定聚合方式。报表渲染时后台根据配置从数据集查询数据并填充到单元格。

## 二、关键规则
1. **必须绑定已定义的数据集**：`datasetName` 必须是报表中已定义的数据集名称。
2. **聚合方式决定取值逻辑**：select 罗列所有值，sum 累加，avg 求平均，max/min 取极值，group 分组。
3. **展开方向控制数据扩展**：Down 向下展开，Right 向右展开，None 不展开。
4. **父子格决定数据对齐**：通过左父格和上父格配置，实现分组汇总等复杂布局。

## 三、数据约束
数据约束由 data-schemas.ts 自动校验。主要约束：
- value.type 固定为 `"dataset"`
- value.datasetName 必填，必须是已定义的数据集名称
- value.property 必填，必须是数据集中的字段名
- value.aggregate 必填，必须是 select/group/sum/avg/max/min/count 之一
- expand 必须是 None/Down/Right 之一
