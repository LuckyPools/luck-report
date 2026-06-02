# 表达式类型单元格说明（ExpressionValue Cell）

## 一、职能

表达式单元格用于在报表中嵌入动态计算逻辑。单元格的 `value.type` 为 `"expression"` 时即为表达式单元格，`value.value` 存储一段 JavaScript 表达式文本，报表渲染时由后台表达式引擎解析并执行，将计算结果输出到单元格位置。表达式支持引用其他单元格的值、调用内置函数、进行条件判断等，是实现报表动态数据计算的核心手段。

---

## 二、数据模型

**结构概览**：`CellDefinition` → `value(ExpressionValue)` + `cellStyle(CellStyle)` + 链接/展开/条件属性等附属配置

### 1、CellDefinition 单元格定义

CellDefinition 的通用字段与普通文本单元格一致，详见[普通文本类型单元格说明](simple-text-cell.md)的 CellDefinition 部分。表达式单元格重点关注以下字段：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| value | ExpressionValue | 单元格值对象 | 见 ExpressionValue 数据模型 |
| expand | String | 展开方向 | `"Right"` / `"Down"` / `"None"`，表达式单元格通常为 `"Down"` 或 `"None"` |
| fillBlankRows | Boolean | 是否填充空白行 | `true` / `false` |
| cellStyle | CellStyle | 单元格样式对象 | `cellStyle.format` 支持格式化表达式计算结果，如 `"#.##"`、`"yyyy-MM-dd"` |

---

### 2、ExpressionValue 值对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| type | String | 值类型 | 固定 `"expression"`，标识为表达式类型 |
| value | String | 表达式文本 | 任意合法的 JavaScript 表达式字符串，如 `"${order.price * order.quantity}"`、`"${sum(A1)}"` |

---

### 3、表达式语法速查

| 语法类型 | 示例 | 说明 |
|----------|------|------|
| 文本表达式 | `${return 'hello'}` | 以 `${` 开头 `}` 结尾，内部为 JavaScript 代码 |
| 单元格引用 | `A1` | 引用 A1 单元格的值 |
| 单元格所有值引用 | `A1[]` | 引用 A1 单元格展开后的所有值 |
| 坐标引用 | `&A1` | 按坐标引用单元格 |
| 内置函数 | `sum(A1[])`、`avg(A1[])`、`count(A1[])` | 聚合函数 |
| 条件表达式 | `${if(A1>0){return '正'}else{return '负'}}` | 条件判断 |

---

## 三、数据约束规则

| 规则编号 | 约束对象 | 约束说明 |
|---------|---------|---------|
| E-01 | 值类型固定 | 表达式单元格的 `value.type` 固定为 `"expression"`，不可更改 |
| E-02 | 表达式执行 | `value.value` 存储的表达式文本在渲染时由后台表达式引擎解析执行，输出计算结果 |
| E-03 | 展开方向 | 表达式单元格可设置 `expand` 为 `"Down"`（向下展开）或 `"Right"`（向右展开），当表达式返回集合数据时按展开方向展开 |
| E-04 | 格式化 | `cellStyle.format` 可对表达式计算结果进行格式化，如数字格式 `"#.##"`、日期格式 `"yyyy-MM-dd"` |
| E-05 | 换行计算 | `cellStyle.wrapCompute` 控制是否自动换行，`true` 为开启，`false` / `null` 为关闭 |
| E-06 | 语法校验 | 前端编辑器会对表达式进行语法校验，不合法的表达式会提示错误 |
| E-07 | 聚合类型限制 | 当 `expand` 为 `"Down"` 或 `"Right"` 时，表达式结果应为集合类型，否则展开无意义 |

---

## 四、参考数据

以下为两份表达式单元格的 JSON 示例：第一份为带格式化和向下展开的计算单元格，第二份为默认样式的简单表达式单元格。

### 示例1：带格式化的计算单元格

```json
{
  "rowNumber": 3,
  "columnNumber": 3,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "C3",
  "value": {
    "value": "${return sum(C2[])}",
    "type": "expression"
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
  "expand": "None",
  "leftParentCellName": null,
  "topParentCellName": null,
  "conditionPropertyItems": null
}
```

### 示例2：默认样式的简单表达式单元格

```json
{
  "rowNumber": 2,
  "columnNumber": 4,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "D2",
  "value": {
    "value": "${return C2 * D1}",
    "type": "expression"
  },
  "cellStyle": {
    "bgcolor": null,
    "forecolor": "0,0,0",
    "fontSize": 10,
    "fontFamily": "宋体",
    "format": null,
    "lineHeight": 0,
    "align": "center",
    "valign": "middle",
    "bold": null,
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

> **关键规则**：表达式单元格的 `value.type` 必须为 `"expression"`，`value.value` 为 JavaScript 表达式文本。表达式以 `${` 开头 `}` 结尾包裹，内部可使用单元格引用（如 `A1`）、单元格所有值引用（如 `A1[]`）和内置函数（如 `sum()`、`avg()`、`count()`）。`expand` 决定表达式返回集合时的展开方向，`cellStyle.format` 可格式化计算结果。
