# 图片类型单元格说明（ImageValue Cell）

## 一、职能

图片单元格用于在报表中嵌入图片内容。单元格的 `value.type` 为 `"image"` 时即为图片单元格，支持两种图片来源：静态路径（`source` 为 `"text"`）和表达式（`source` 为 `"expression"`）。静态路径模式下 `value.value` 存储图片的 URL 或路径字符串；表达式模式下 `value.value` 存储一段 JavaScript 表达式，运行时动态计算图片路径。可配置图片的宽高（`width`/`height`），单位为像素。

---

## 二、关键约束提示

> **重要提示**：数据模型、约束规则已迁移至 `data-schemas.ts`，通过工具自动校验。
> 生成单元格数据前，请先调用【get_cell_template】工具，传入 type='image' 获取符合规范的完整模板。

| 约束项 | 要求 |
|--------|------|
| value.type | 固定为 `"image"` |
| value.source | `"text"`（静态路径）或 `"expression"`（表达式） |
| value.value | 图片 URL 或表达式文本 |
| value.width | 最小值 1，单位像素 |
| value.height | 最小值 1，单位像素 |

> 仅表达式模式（`source` 为 `"expression"`）支持展开方向设置。