# 表格行说明（RowDefinition）

## 一、职能

表格行定义用于描述报表中每一行的结构属性，包括行号、行高和行类型（Band）。行类型决定了该行在报表分页输出时的显示位置：标题行（`title`）仅在第一页最前端显示，重复表头行（`headerrepeat`）在每一页的顶部显示，重复表尾行（`footerrepeat`）在每一页的底部显示，总结行（`summary`）仅在最后一页的最下端显示。前端通过 `context.rowHeaders` 数组管理行类型配置，右键菜单可批量设置选中行的行类型，行头区域以标签形式（HR/FR/T/S）标识行类型。

---

## 二、数据模型

**结构概览**：`context.rowHeaders` → `List<RowHeader>` ，每个 RowHeader 包含 `rowNumber` + `band`

### 1、RowHeader 行头对象（前端）

前端使用 `context.rowHeaders` 数组存储行类型配置，数组中每个元素为一个 RowHeader 对象：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| rowNumber | Integer | 行号 | 从 `0` 开始的行索引，对应表格中的行位置 |
| band | String | 行类型 | 见 Band 枚举值 |

---

### 2、RowDefinition 行定义对象（后端）

后端使用 `ReportDefinition.rows` 列表存储行定义，每个 RowDefinition 对象：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| rowNumber | int | 行号 | 从 `1` 开始的行序号 |
| height | int | 行高（px） | 行的高度值，如 `30`、`25` |
| band | Band | 行类型枚举 | 见 Band 枚举值，`null` 为普通行 |

---

### 3、Band 行类型枚举

| 枚举值 | 前端标签 | 说明 | 分页行为 |
|--------|---------|------|---------|
| `headerrepeat` | HR | 重复表头行 | 分页时在每一页顶部显示，第一页中位于标题行下方 |
| `footerrepeat` | FR | 重复表尾行 | 分页时在每一页底部显示 |
| `title` | T | 标题行 | 分页时仅在第一页最前端显示 |
| `summary` | S | 总结行 | 分页时仅在最后一页最下端显示，位于重复表尾行下方 |

---

### 4、Row 运行时行对象（后端渲染模型）

报表渲染时后端将 RowDefinition 转换为 Row 对象，Row 对象包含以下额外运行时属性：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| rowKey | String | 行唯一标识 | 格式为 `"r" + rowNumber`，如 `"r1"`、`"r5"` |
| realHeight | int | 实际行高 | 默认 `-1`，`-1` 时取 `height` 值 |
| tempRowNumber | int | 临时行号 | 仅在构建报表时使用 |
| pageIndex | int | 页码索引 | 该行所属的页码 |
| forPaging | boolean | 是否为分页行 | 渲染时自动计算 |
| pageBreak | boolean | 是否在此行分页 | 渲染时自动计算 |
| hide | boolean | 是否隐藏 | `true` / `false` |

---

## 三、数据约束规则

| 规则编号 | 约束对象 | 约束说明 |
|---------|---------|---------|
| R-01 | 行号唯一 | 同一报表中 `rowNumber` 不可重复，每个行号最多对应一个行类型 |
| R-02 | 行号范围 | 前端 `rowNumber` 从 `0` 开始（行索引），后端 `rowNumber` 从 `1` 开始（行序号） |
| R-03 | 行高约束 | `height` 最小值为 `0`，单位为像素 |
| R-04 | 默认行类型 | 未设置 `band` 的行为普通行（`band` 为 `null`），分页时按正常逻辑输出 |
| R-05 | 标题行位置 | 标题行（`title`）可定义在任意位置，但分页输出时总会放在第一页最前端 |
| R-06 | 重复表头与标题行 | 第一页中标题行位于最上方，重复表头行（`headerrepeat`）紧随其后 |
| R-07 | 总结行与重复表尾 | 最后一页中总结行（`summary`）位于重复表尾行（`footerrepeat`）下方 |
| R-08 | 批量设置 | 右键菜单支持选中多行批量设置同一行类型 |
| R-09 | 取消行类型 | 通过右键菜单的"取消行类型"选项可移除行的 `band` 设置，恢复为普通行 |
| R-10 | 插入行调整 | 在已有行类型配置的行之前插入新行时，后续行的 `rowNumber` 自动递增 |
| R-11 | 删除行调整 | 删除带有行类型配置的行时，该行的行类型配置同步移除 |

---

## 四、参考数据

以下为两份行类型配置的 JSON 示例：第一份为包含标题行和重复表头行的配置，第二份为包含重复表尾行和总结行的配置。

### 示例1：标题行 + 重复表头行配置

```json
{
  "rowHeaders": [
    {
      "rowNumber": 0,
      "band": "title"
    },
    {
      "rowNumber": 1,
      "band": "title"
    },
    {
      "rowNumber": 2,
      "band": "headerrepeat"
    }
  ]
}
```

> 说明：第 1、2 行为标题行（`title`），分页时仅在第一页最前端显示；第 3 行为重复表头行（`headerrepeat`），分页时在每一页顶部显示。

### 示例2：重复表尾行 + 总结行配置

```json
{
  "rowHeaders": [
    {
      "rowNumber": 8,
      "band": "footerrepeat"
    },
    {
      "rowNumber": 9,
      "band": "summary"
    },
    {
      "rowNumber": 10,
      "band": "summary"
    }
  ]
}
```

> 说明：第 9 行为重复表尾行（`footerrepeat`），分页时在每一页底部显示；第 10、11 行为总结行（`summary`），分页时仅在最后一页最下端显示，位于重复表尾行下方。

> **关键规则**：行类型通过 `context.rowHeaders` 数组管理，每个元素包含 `rowNumber`（行号）和 `band`（行类型）。`band` 枚举值为 `headerrepeat`（重复表头行）、`footerrepeat`（重复表尾行）、`title`（标题行）、`summary`（总结行）。未设置 `band` 的行为普通行。标题行总在第一页最前端，重复表头行在每页顶部，重复表尾行在每页底部，总结行在最后一页最下端且位于重复表尾行下方。
