# 表格列说明（ColumnDefinition）

## 一、职能

表格列定义用于描述报表中每一列的结构属性，包括列号、列宽和隐藏状态。前端通过 `context.reportDef.columns` 数组管理列定义配置，列头区域以字母标签（A、B、C...）标识列位置，列宽可通过拖拽列头边框或属性面板调整，列可通过右键菜单设置隐藏或显示。

---

## 二、数据模型

**结构概览**：`context.reportDef.columns` → `ColumnDefinition[]` ，每个 ColumnDefinition 包含 `columnNumber` + `width` + `hide`

### 1、ColumnDefinition 列定义对象

前端使用 `context.reportDef.columns` 数组存储列定义，数组中每个元素为一个 ColumnDefinition 对象：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| columnNumber | number | 列号 | 从 `1` 开始的列序号，对应表格中的列位置 |
| width | number | 列宽（px） | 列的宽度值，如 `131`、`80`，默认由页面宽度自动分配 |
| hide | boolean | 是否隐藏 | `true`（隐藏）/ `false`（显示），隐藏列不参与渲染输出 |

---

## 三、数据约束规则

| 规则编号 | 约束对象 | 约束说明 |
|---------|---------|---------|
| C-01 | 列号唯一 | 同一报表中 `columnNumber` 不可重复 |
| C-02 | 列号范围 | `columnNumber` 从 `1` 开始，按顺序递增，不可跳号 |
| C-03 | 列宽约束 | `width` 最小值为 `0`，单位为像素；`0` 表示自动宽度 |
| C-04 | 隐藏列行为 | 隐藏列（`hide` 为 `true`）在设计器中仍可见但标记为隐藏状态，渲染输出时不显示 |
| C-05 | 插入列调整 | 在已有列之前插入新列时，后续列的 `columnNumber` 自动递增 |
| C-06 | 删除列调整 | 删除列时，后续列的 `columnNumber` 自动递减，同时处理单元格数据和合并单元格配置 |
| C-07 | 列宽与页面宽度 | 所有可见列的宽度之和不应超过页面可用宽度（页面宽度减去左右边距） |

---

## 四、参考数据

以下为一份包含 4 列的列定义 JSON 示例：

```json
{
  "columns": [
    {
      "columnNumber": 1,
      "width": 131,
      "hide": false
    },
    {
      "columnNumber": 2,
      "width": 80,
      "hide": false
    },
    {
      "columnNumber": 3,
      "width": 74,
      "hide": false
    },
    {
      "columnNumber": 4,
      "width": 80,
      "hide": false
    }
  ]
}
```

> 说明：共 4 列，第 1 列宽 131px，第 2、4 列宽 80px，第 3 列宽 74px，所有列均未隐藏。

> **关键规则**：列定义通过 `context.reportDef.columns` 数组管理，每个元素包含 `columnNumber`（列号，从1开始）、`width`（列宽，单位px）和 `hide`（是否隐藏）。列号按顺序递增不可跳号，插入或删除列时后续列号自动调整。

---

## 五、工具调用

| 操作 | 工具名称 | 参数 | 说明 |
|------|---------|------|------|
| 插入列 | `insert_col` | `position: number, number?: number` | 在 position 位置插入列，position 为列索引从0开始，number 为插入列数默认1。会同时处理单元格数据 |
| 删除列 | `delete_col` | `startCol: number, endCol: number` | 删除指定范围的列，startCol 和 endCol 为列索引从0开始。会同时处理单元格数据和合并单元格配置 |
| 保存报表 | `save_report` | | 保存当前报表到服务器 |
