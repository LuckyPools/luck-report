# 页面配置说明（Paper）

## 一、职能
页面配置定义了报表页面的整体布局和样式，包括纸张大小、页边距、方向、分页模式、分栏设置、页眉页脚等。报表配置位于 `reportDef.paper` 中，同时 `reportDef` 下还包含 `header`（页眉）、`footer`（页脚）、`rows`（行定义）、`columns`（列定义）等配置。

---

## 二、数据操作步骤

> **重要提示**：数据模型、约束规则已迁移至 `data-schemas.ts`，通过工具自动校验。

### (一) 读取页面配置步骤
1. 调用【get_paper_config】工具获取页面配置对象

### (二) 创建/修改页面配置步骤
1. 调用【get_paper_config】工具获取页面配置对象
2. （创建操作）构建新的页面配置对象 / （修改操作）基于获取的页面配置对象，按用户要求修改对应字段，页面配置对象必须符合数据模型约束
3. 调用【update_paper】工具写入页面配置，paper 参数必须是JSON对象，禁止传JSON字符串
4. 若 update_paper 返回 0，可重试

---

## 三、关键约束提示

| 约束项 | 要求 |
|--------|------|
| paperType | A0~A10 / B0~B10 / CUSTOM |
| orientation | portrait（纵向）/ landscape（横向） |
| pagingMode | fitpage（按纸张分页）/ fixrows（按固定行数分页） |
| fixRows | pagingMode 为 fixrows 时必须 ≥ 1 |
| columnCount | columnEnabled 为 true 时，取值范围 2~10 |

> **纸张类型联动**：paperType 为非 CUSTOM 时，width 和 height 由系统自动计算；为 CUSTOM 时需手动指定。
> **页眉页脚表达式**：可使用 `page()` 获取当前页码，`pages()` 获取总页数。
