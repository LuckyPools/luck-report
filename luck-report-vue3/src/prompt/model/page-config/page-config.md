# 页面配置说明

## 一、概念说明

页面配置定义了报表页面的整体布局和样式，包括纸张大小、页边距、方向、分页模式、分栏设置等。报表配置位于 `reportDef.paper` 中。

## 二、关键规则

1. **纸张类型联动**：paperType 为非 CUSTOM 时，width 和 height 由系统自动计算；为 CUSTOM 时需手动指定。
2. **分页模式**：fitpage 按纸张分页，fixrows 按固定行数分页。
3. **页眉页脚表达式**：可使用 `page()` 获取当前页码，`pages()` 获取总页数。

## 三、数据约束

数据约束由 data-schemas.ts 自动校验。主要约束：
- paperType 为 A0~A10 / B0~B10 / CUSTOM
- orientation 为 portrait（纵向）或 landscape（横向）
- pagingMode 为 fitpage 或 fixrows
- fixRows 在 pagingMode 为 fixrows 时必须 ≥ 1
- columnCount 在 columnEnabled 为 true 时取值范围 2~10