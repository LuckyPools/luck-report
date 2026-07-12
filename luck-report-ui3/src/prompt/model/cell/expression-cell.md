``# 表达式单元格说明

## 一、概念说明
表达式单元格用于在报表中嵌入动态计算逻辑。单元格对象的 `value.type` 为 `"expression"` 时即为表达式单元格，`value.value` 存储一段 JavaScript 表达式文本，报表渲染时由后台表达式引擎解析并执行，将计算结果输出到单元格位置。

## 二、关键规则
1. **表达式语法**：详见 EXPRESSION 表达式文档

## 三、数据约束
数据约束由 data-schemas.ts 自动校验。主要约束：
- value.type 固定为 `"expression"`
- value.value 为 JavaScript 表达式文本
- cellStyle.format 可格式化计算结果
