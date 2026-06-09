# 斜表头单元格说明

## 一、概念说明

斜表头单元格用于在报表中绘制斜线表头，常见于交叉表的左上角单元格。单元格的 `value.type` 为 `"slash"` 时即为斜表头单元格，通过 `value.slashes` 数组配置多条斜线及每条斜线上的文本标签。报表渲染时根据配置绘制 SVG 斜线并在指定位置输出文本标签。

## 二、关键规则

1. **斜表头单元格通常不展开**：`expand` 通常设为 `"None"`。
2. **svg 和 base64Data 由系统生成**：无需手动设置，渲染时自动生成。

## 三、数据约束

数据约束由 data-schemas.ts 自动校验。主要约束：
- value.type 固定为 `"slash"`
- value.slashes 数组，每条斜线包含 x/y/degree/text
- x/y 为坐标，degree 为角度，text 为文本标签