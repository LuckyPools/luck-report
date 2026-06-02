# 数据集类型单元格说明（DatasetValue Cell）

## 一、职能

数据集单元格是报表中最核心的动态数据单元格类型，用于绑定数据集的查询结果并按指定聚合方式提取字段值。单元格的 `value.type` 为 `"dataset"` 时即为数据集单元格，通过 `value.datasetName` 指定数据集名称，`value.aggregate` 指定聚合方式，`value.property` 指定字段名称。报表渲染时后台根据聚合方式从数据集中提取数据，结合展开方向（`expand`）将数据填充到单元格中，实现报表的动态数据展示。

---

## 二、数据模型

**结构概览**：`CellDefinition` → `value(DatasetValue)` + `cellStyle(CellStyle)` + 链接/展开/条件属性等附属配置

### 1、CellDefinition 单元格定义

CellDefinition 的通用字段与普通文本单元格一致，详见[普通文本类型单元格说明](simple-text-cell.md)的 CellDefinition 部分。数据集单元格重点关注以下字段：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| value | DatasetValue | 单元格值对象 | 见 DatasetValue 数据模型 |
| expand | String | 展开方向 | `"Right"` / `"Down"` / `"None"`，数据集单元格通常为 `"Down"` 或 `"Right"` |
| fillBlankRows | Boolean | 是否填充空白行 | `true` / `false`，数据集单元格可设为 `true` |
| multiple | Integer | 填充空白行的倍数 | `fillBlankRows=true` 时生效 |
| cellStyle | CellStyle | 单元格样式对象 | `cellStyle.format` 支持格式化数据值 |
| conditionPropertyItems | List\<ConditionPropertyItem\> | 条件属性列表 | 可根据数据值动态改变样式 |

---

### 2、DatasetValue 值对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| type | String | 值类型 | 固定 `"dataset"`，标识为数据集类型 |
| datasetName | String | 数据集名称 | 必须为报表中已定义的数据集名称，如 `"orders"`、`"product"` |
| property | String | 字段名称 | 必须为数据集中的字段名，如 `"order_id"`、`"product_name"`、`"price"` |
| aggregate | String | 聚合方式 | 见 AggregateType 枚举值 |
| order | String | 排序方式 | 见 Order 枚举值 |
| conditions | List\<Condition\> | 过滤条件列表 | 对数据集查询结果进行二次过滤，`null` 为无过滤 |
| groupItems | List\<GroupItem\> | 自定义分组项列表 | 当 `aggregate` 为 `"customgroup"` 时使用，`null` 为无自定义分组 |
| mappingType | String | 数据映射类型 | 见 MappingType 枚举值 |
| mappingItems | List\<MappingItem\> | 简单映射项列表 | 当 `mappingType` 为 `"simple"` 时使用 |
| mappingDataset | String | 数据集映射-数据集名称 | 当 `mappingType` 为 `"dataset"` 时使用 |
| mappingKeyProperty | String | 数据集映射-键字段 | 当 `mappingType` 为 `"dataset"` 时使用 |
| mappingValueProperty | String | 数据集映射-值字段 | 当 `mappingType` 为 `"dataset"` 时使用 |

---

### 3、AggregateType 聚合方式枚举

| 枚举值 | 说明 | 是否支持展开 | 是否支持排序 | 是否支持数据映射 |
|--------|------|-------------|-------------|----------------|
| `select` | 逐条取值 | 是 | 是 | 是 |
| `group` | 分组 | 是 | 是 | 是 |
| `customgroup` | 自定义分组 | 是 | 是 | 否 |
| `regroup` | 重新分组 | 是 | 是 | 否 |
| `reselect` | 重新选择 | 是 | 是 | 否 |
| `sum` | 求和 | 否 | 否 | 否 |
| `avg` | 平均值 | 否 | 否 | 否 |
| `max` | 最大值 | 否 | 否 | 否 |
| `min` | 最小值 | 否 | 否 | 否 |
| `count` | 计数 | 否 | 否 | 否 |

---

### 4、Order 排序方式枚举

| 枚举值 | 说明 |
|--------|------|
| `none` | 不排序 |
| `asc` | 升序 |
| `desc` | 降序 |

---

### 5、MappingType 数据映射类型枚举

| 枚举值 | 说明 |
|--------|------|
| `simple` | 简单映射，通过手动配置映射项实现值转换 |
| `dataset` | 数据集映射，通过另一个数据集的键值对实现值转换 |

---

### 6、MappingItem 简单映射项对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| value | String | 实际值 | 如 `"1"`、`"male"` |
| label | String | 显示值 | 如 `"是"`、`"男"` |

---

### 7、GroupItem 自定义分组项对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| name | String | 分组名称 | 如 `"分组A"`、`"分组B"` |
| conditions | List\<Condition\> | 分组条件列表 | 满足条件的数据归入该分组 |

---

### 8、Condition 过滤条件对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| left | String | 左侧表达式 | 字段名或表达式，如 `"price"` |
| op | String | 比较运算符 | 见 Op 枚举值 |
| right | String | 右侧表达式 | 比较值或表达式，如 `"100"` |
| join | String | 条件连接方式 | `"and"` / `"or"`，与下一个条件的连接关系 |

---

### 9、Op 比较运算符枚举

| 枚举值 | 符号 | 说明 |
|--------|------|------|
| `GreatThen` | `>` | 大于 |
| `EqualsGreatThen` | `>=` | 大于等于 |
| `LessThen` | `<` | 小于 |
| `EqualsLessThen` | `<=` | 小于等于 |
| `Equals` | `==` | 等于 |
| `NotEquals` | `!=` | 不等于 |
| `In` | `in` | 包含 |
| `NotIn` | `not in` | 不包含 |
| `Like` | `like` | 模糊匹配 |

---

## 三、数据约束规则

| 规则编号 | 约束对象 | 约束说明 |
|---------|---------|---------|
| D-01 | 值类型固定 | 数据集单元格的 `value.type` 固定为 `"dataset"`，不可更改 |
| D-02 | 数据集名称必填 | `value.datasetName` 必须为报表中已定义的数据集名称，不能为空 |
| D-03 | 字段名称必填 | `value.property` 必须为所选数据集中已定义的字段名称，不能为空 |
| D-04 | 聚合方式默认值 | `value.aggregate` 默认为 `"select"` |
| D-05 | 排序方式默认值 | `value.order` 默认为 `"none"` |
| D-06 | 聚合与展开互斥 | 当 `aggregate` 为 `"sum"` / `"count"` / `"max"` / `"min"` / `"avg"` 时，`expand` 必须为 `"None"`，`order` 必须为 `"none"`，因为这些聚合返回单值无需展开 |
| D-07 | 聚合与排序互斥 | 当 `aggregate` 为统计类聚合（sum/count/max/min/avg）时，排序选项不可用 |
| D-08 | 数据映射可用条件 | 仅当 `aggregate` 为 `"group"` 或 `"select"` 时，数据映射选项可用 |
| D-09 | 自定义分组 | 当 `aggregate` 为 `"customgroup"` 时，需配置 `groupItems` 自定义分组项 |
| D-10 | 展开方向 | 数据集单元格通常设置 `expand` 为 `"Down"`（向下展开）或 `"Right"`（向右展开），以将数据集的多行数据展开到报表中 |
| D-11 | 填充空白行 | 数据集单元格可设置 `fillBlankRows` 为 `true`，配合 `multiple` 确保数据行数为指定倍数 |
| D-12 | 格式化 | `cellStyle.format` 可对数据值进行格式化，如数字格式 `"#,###.00"`、日期格式 `"yyyy-MM-dd"` |

---

## 四、参考数据

以下为两份数据集单元格的 JSON 示例：第一份为分组聚合的向下展开单元格，第二份为求和聚合的统计单元格。

### 示例1：分组聚合的向下展开单元格

```json
{
  "rowNumber": 3,
  "columnNumber": 1,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "A3",
  "value": {
    "type": "dataset",
    "datasetName": "orders",
    "property": "product_name",
    "aggregate": "group",
    "order": "asc",
    "conditions": [],
    "groupItems": null,
    "mappingType": "simple",
    "mappingItems": [],
    "mappingDataset": "",
    "mappingKeyProperty": "",
    "mappingValueProperty": ""
  },
  "cellStyle": {
    "bgcolor": null,
    "forecolor": "0,0,0",
    "fontSize": 10,
    "fontFamily": "宋体",
    "format": null,
    "lineHeight": 0,
    "align": "left",
    "valign": "middle",
    "bold": null,
    "italic": null,
    "underline": null,
    "wrapCompute": null,
    "leftBorder": {
      "width": 1,
      "color": "0,0,0",
      "style": "solid"
    },
    "rightBorder": {
      "width": 1,
      "color": "0,0,0",
      "style": "solid"
    },
    "topBorder": {
      "width": 1,
      "color": "0,0,0",
      "style": "solid"
    },
    "bottomBorder": {
      "width": 1,
      "color": "0,0,0",
      "style": "solid"
    }
  },
  "linkUrl": null,
  "linkTargetWindow": null,
  "linkParameters": null,
  "fillBlankRows": false,
  "multiple": 0,
  "expand": "Down",
  "leftParentCellName": null,
  "topParentCellName": "A1",
  "conditionPropertyItems": null
}
```

### 示例2：求和聚合的统计单元格

```json
{
  "rowNumber": 8,
  "columnNumber": 3,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "C8",
  "value": {
    "type": "dataset",
    "datasetName": "orders",
    "property": "price",
    "aggregate": "sum",
    "order": "none",
    "conditions": [],
    "groupItems": null,
    "mappingType": "simple",
    "mappingItems": [],
    "mappingDataset": "",
    "mappingKeyProperty": "",
    "mappingValueProperty": ""
  },
  "cellStyle": {
    "bgcolor": null,
    "forecolor": "0,0,0",
    "fontSize": 10,
    "fontFamily": "宋体",
    "format": "#,###.00",
    "lineHeight": 0,
    "align": "right",
    "valign": "middle",
    "bold": true,
    "italic": null,
    "underline": null,
    "wrapCompute": null,
    "leftBorder": null,
    "rightBorder": null,
    "topBorder": null,
    "bottomBorder": null
  },
  "linkUrl": null,
  "linkTargetWindow": null,
  "linkParameters": null,
  "fillBlankRows": false,
  "multiple": 0,
  "expand": "None",
  "leftParentCellName": null,
  "topParentCellName": null,
  "conditionPropertyItems": null
}
```

> **关键规则**：数据集单元格的 `value.type` 必须为 `"dataset"`，`value.datasetName` 和 `value.property` 为必填项。聚合方式 `aggregate` 决定了数据提取方式：`select`/`group`/`customgroup` 等返回集合的聚合支持展开和排序，而 `sum`/`count`/`max`/`min`/`avg` 等统计聚合返回单值，此时 `expand` 必须为 `"None"`，`order` 必须为 `"none"`。数据映射仅在 `group` 和 `select` 聚合下可用。
