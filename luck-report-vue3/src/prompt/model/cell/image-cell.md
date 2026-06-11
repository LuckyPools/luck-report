# 图片单元格说明

## 一、概念说明
图片单元格用于在报表中嵌入图片内容。单元格的 `value.type` 为 `"image"` 时即为图片单元格，支持两种图片来源：静态路径（`source` 为 `"text"`）和表达式（`source` 为 `"expression"`）。

## 二、关键规则
1. **两种数据来源**：静态路径模式下 `value.value` 存储图片 URL；表达式模式下 `value.value` 存储 JavaScript 表达式。
2. **仅表达式模式支持展开**：`source` 为 `"expression"` 时可设置展开方向。

## 三、数据约束
数据约束由 data-schemas.ts 自动校验。主要约束：
- value.type 固定为 `"image"`
- value.source 为 `"text"` 或 `"expression"`
- value.value 为图片 URL 或表达式文本
- value.width/height 最小值为 1，单位像素
