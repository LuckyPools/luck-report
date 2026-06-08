# 普通文本类型单元格说明（SimpleValue Cell）

## 一、职能

普通文本单元格是报表中最基础的单元格类型，用于显示静态文本内容。单元格的 `value.type` 为 `"simple"` 时即为普通文本单元格，`value.value` 存储要显示的文本字符串。报表渲染时直接将文本原样输出到单元格位置，不做任何计算或数据填充。

---

## 二、关键约束提示

> **重要提示**：数据模型、约束规则已迁移至 `data-schemas.ts`，通过工具自动校验。
> 生成单元格数据前，请先调用【get_cell_template】工具，传入 type='simple' 获取符合规范的完整模板。

| 约束项 | 要求 |
|--------|------|
| value.type | 固定为 `"simple"` |
| value.value | 文本字符串，任意内容 |
| expand | 通常为 `"None"`（不展开） |
| fillBlankRows | 通常为 `false` |

> 普通文本单元格无需数据展开，`expand` 通常设为 `"None"`。