# 表格列说明（ColumnDefinition）

## 一、职能

表格列定义用于描述报表中每一列的结构属性，包括列号、列宽和隐藏状态。前端通过 `context.reportDef.columns` 数组管理列定义配置，列头区域以字母标签（A、B、C...）标识列位置，列宽可通过拖拽列头边框或属性面板调整，列可通过右键菜单设置隐藏或显示。

---

## 二、数据模型

**结构概览**：`context.reportDef.columns` → `ColumnDefinition[]` ，每个 ColumnDefinition 包含 `columnNumber` + `width` + `hide`

### (一) Column 列对象

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

## 五、数据操作步骤

### (一) 读取列步骤
1. 调用【get_columns】工具获取列数据，不传 columnNumber 返回全部列，传入 columnNumber 返回指定列的数据

### (二) 创建/修改列步骤
1. 调用【get_columns】工具获取列数据
2. （创建操作）构建新的列对象 / （修改操作）基于获取的列数据，按用户要求修改对应字段，列对象必须符合数据模型约束
3. 调用【set_columns】工具整体替换全部列数据，或调用【update_column】工具按列号更新指定列
4. 若 set_columns 或 update_column 返回 0，可调用【restore_data】工具还原备份后重试

### (三) 插入列步骤
1. 确定插入位置 position（列索引，从0开始）和插入列数 number（默认为1）
2. 调用【insert_col】工具在指定位置插入列，工具会同时处理单元格数据
3. 若 insert_col 返回 0，可调用【restore_data】工具还原备份后重试

### (四) 删除列步骤
1. 确定删除列的起始位置 startCol 和结束位置 endCol（列索引，从0开始）
2. 调用【delete_col】工具删除指定范围的列，工具会同时处理单元格数据和合并单元格配置
3. 若 delete_col 返回 0，可调用【restore_data】工具还原备份后重试
