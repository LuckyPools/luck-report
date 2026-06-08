# 表达式类型单元格说明（ExpressionValue Cell）

## 一、职能

表达式单元格用于在报表中嵌入动态计算逻辑。单元格的 `value.type` 为 `"expression"` 时即为表达式单元格，`value.value` 存储一段 JavaScript 表达式文本，报表渲染时由后台表达式引擎解析并执行，将计算结果输出到单元格位置。表达式支持引用其他单元格的值、调用内置函数、进行条件判断等，是实现报表动态数据计算的核心手段。

---

## 二、关键约束提示

> **重要提示**：数据模型、约束规则已迁移至 `data-schemas.ts`，通过工具自动校验。
> 生成单元格数据前，请先调用【get_cell_template】工具，传入 type='expression' 获取符合规范的完整模板。

| 约束项 | 要求 |
|--------|------|
| value.type | 固定为 `"expression"` |
| value.value | JavaScript 表达式文本 |
| cellStyle.format | 可格式化计算结果，如 "#.##"、"yyyy-MM-dd" |

> **表达式语法速查**：
> - 文本表达式：`${return 'hello'}`（以 `${` 开头 `}` 结尾）
> - 单元格引用：`A1`（引用 A1 单元格的值）
> - 单元格所有值引用：`A1[]`（引用 A1 展开后的所有值）
> - 内置函数：`sum(A1[])`、`avg(A1[])`、`count(A1[])`

> 写入表达式单元格前，必须调用【validate_expression】工具校验表达式语法是否正确。