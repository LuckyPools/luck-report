# 表达式单元格说明

## 一、概念说明

表达式单元格用于在报表中嵌入动态计算逻辑。单元格的 `value.type` 为 `"expression"` 时即为表达式单元格，`value.value` 存储一段 JavaScript 表达式文本，报表渲染时由后台表达式引擎解析并执行，将计算结果输出到单元格位置。

## 二、关键规则

1. **表达式语法**：文本表达式以 `${` 开头 `}` 结尾，如 `${return 'hello'}`。
2. **单元格引用**：`A1` 引用 A1 单元格的值，`A1[]` 引用 A1 展开后的所有值。
3. **写入前必须校验**：调用 validate_expression 工具校验表达式语法。

## 三、数据约束

数据约束由 data-schemas.ts 自动校验。主要约束：
- value.type 固定为 `"expression"`
- value.value 为 JavaScript 表达式文本
- cellStyle.format 可格式化计算结果