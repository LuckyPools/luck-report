# 斜表头单元格说明（SlashValue Cell）

## 一、职能

斜表头单元格用于在报表中绘制斜线表头，常见于交叉表的左上角单元格。单元格的 `value.type` 为 `"slash"` 时即为斜表头单元格，通过 `value.slashes` 数组配置多条斜线及每条斜线上的文本标签。每条斜线由起点坐标（`x`/`y`）、角度（`degree`）和文本（`text`）定义。报表渲染时根据配置绘制 SVG 斜线并在指定位置输出文本标签。

---

## 二、关键约束提示

> **重要提示**：数据模型、约束规则已迁移至 `data-schemas.ts`，通过工具自动校验。
> 生成单元格数据前，请先调用【get_cell_template】工具，传入 type='slash' 获取符合规范的完整模板。

| 约束项 | 要求 |
|--------|------|
| value.type | 固定为 `"slash"` |
| value.slashes | 斜线配置数组，每条斜线包含 x/y/degree/text |
| value.svg | 由系统渲染时自动生成，无需手动设置 |
| value.base64Data | 由系统渲染时自动生成，无需手动设置 |

> 斜表头单元格通常不展开（`expand` 为 `"None"`）。
