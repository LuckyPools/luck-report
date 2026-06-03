# 普通文本类型单元格说明（SimpleValue Cell）

## 一、职能

普通文本单元格是报表中最基础的单元格类型，用于显示静态文本内容。单元格的 `value.type` 为 `"simple"` 时即为普通文本单元格，`value.value` 存储要显示的文本字符串。报表渲染时直接将文本原样输出到单元格位置，不做任何计算或数据填充。

---

## 二、数据模型

**结构概览**：`cell` → `value(SimpleValue)` + `cellStyle(CellStyle)` + 链接/展开/条件属性等附属配置

### (一) cell 单元格定义

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| rowNumber | number | 行号（从1开始） | 如 `1`、`2`、`3` |
| columnNumber | number | 列号（从1开始） | 如 `1`、`2`、`3` |
| rowSpan | number | 跨行数 | `0` 表示不跨行，`>0` 表示向下合并的行数 |
| colSpan | number | 跨列数 | `0` 表示不跨列，`>0` 表示向右合并的列数 |
| name | string | 单元格名称 | 由列字母+行号组成，如 `"A1"`、`"B3"` |
| value | SimpleValue | 单元格值对象 | 见 SimpleValue 数据模型 |
| cellStyle | CellStyle | 单元格样式对象 | 见 CellStyle 数据模型 |
| linkUrl | string | 超链接地址 | 支持普通URL或表达式（以 `${` 开头 `}` 结尾），`null` 为无链接 |
| linkTargetWindow | string | 链接打开方式 | `"_self"` / `"_blank"` / `null` |
| linkParameters | LinkParameter[] | 链接参数列表 | 见 LinkParameter 数据模型，`null` 为无参数 |
| fillBlankRows | boolean | 是否填充空白行 | `true` / `false`，普通文本单元格通常为 `false` |
| multiple | number | 填充空白行的倍数 | `fillBlankRows=true` 时生效，要求数据行数必须是该值的倍数 |
| expand | string | 展开方向 | `"Right"`（向右展开）/ `"Down"`（向下展开）/ `"None"`（不展开），普通文本通常为 `"None"` |
| leftParentCellName | string | 左父格名称 | 同行左侧父级单元格名称，如 `"A2"`，`null` 为无左父格 |
| topParentCellName | string | 上父格名称 | 同列上方父级单元格名称，如 `"A1"`，`null` 为无上父格 |
| conditionPropertyItems | ConditionPropertyItem[] | 条件属性列表 | 见条件属性说明文档，`null` 为无条件 |

---

### (二) SimpleValue 值对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| type | string | 值类型 | 固定 `"simple"`，标识为普通文本类型 |
| value | string | 文本内容 | 任意字符串，如 `"订单编号"`、`"合计"`、`""`（空字符串） |

---

### 3、CellStyle 样式对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| bgcolor | string | 背景色 | RGB 格式 `"R,G,B"`，如 `"208,2,27"`、`"255,255,255"`，`null` 为无背景色 |
| forecolor | string | 前景色（字体颜色） | RGB 格式 `"R,G,B"`，如 `"0,0,0"`、`"248,231,28"`，`null` 为默认黑色 |
| fontSize | number | 字体大小（pt） | 如 `10`、`12`、`14` |
| fontFamily | string | 字体名称 | 如 `"宋体"`、`"仿宋"`、`"黑体"`、`"Arial"` |
| format | string | 格式化模式 | 如 `"#.##"`、`"#,###.00"`、`"yyyy-MM-dd"`，`null` 为不格式化 |
| lineHeight | number | 行高倍数 | 如 `0`（默认）、`1.5`、`2`、`5` |
| align | string | 水平对齐方式 | `"left"` / `"right"` / `"center"` |
| valign | string | 垂直对齐方式 | `"top"` / `"middle"` / `"bottom"` |
| bold | boolean | 是否加粗 | `true` / `false` / `null`（null 为不加粗） |
| italic | boolean | 是否斜体 | `true` / `false` / `null`（null 为不斜体） |
| underline | boolean | 是否下划线 | `true` / `false` / `null`（null 为无下划线） |
| wrapCompute | boolean | 是否自动换行 | `true` / `false` / `null`（null 为不自动换行） |
| leftBorder | Border | 左边框 | 见 Border 数据模型，`null` 为无边框 |
| rightBorder | Border | 右边框 | 见 Border 数据模型，`null` 为无边框 |
| topBorder | Border | 上边框 | 见 Border 数据模型，`null` 为无边框 |
| bottomBorder | Border | 下边框 | 见 Border 数据模型，`null` 为无边框 |

---

### 4、Border 边框对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| width | number | 边框宽度 | 如 `1`、`2`、`3` |
| color | string | 边框颜色 | RGB 格式 `"R,G,B"`，如 `"0,0,0"` |
| style | string | 边框样式 | `"solid"`（实线）/ `"dashed"`（虚线）/ `"doublesolid"`（双实线） |

---

### 5、LinkParameter 链接参数对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| name | string | 参数名 | 如 `"a"`、`"b"`、`"id"` |
| value | string | 参数值 | 支持普通字符串或表达式，如 `"1"`、`"2"` |

---

### 6、枚举值速查表

| 枚举类型 | 枚举值 | 说明 |
|----------|--------|------|
| ValueType | `simple` | 普通文本 |
| ValueType | `expression` | 表达式 |
| ValueType | `dataset` | 数据集 |
| ValueType | `image` | 图片 |
| ValueType | `chart` | 图表 |
| ValueType | `slash` | 斜表头 |
| ValueType | `zxing` | 二维码/条码 |
| Expand | `Right` | 向右展开 |
| Expand | `Down` | 向下展开 |
| Expand | `None` | 不展开 |
| Alignment（水平） | `left` | 左对齐 |
| Alignment（水平） | `right` | 右对齐 |
| Alignment（水平） | `center` | 居中对齐 |
| Alignment（垂直） | `top` | 顶部对齐 |
| Alignment（垂直） | `middle` | 垂直居中 |
| Alignment（垂直） | `bottom` | 底部对齐 |
| BorderStyle | `solid` | 实线 |
| BorderStyle | `dashed` | 虚线 |
| BorderStyle | `doublesolid` | 双实线 |

---

## 三、数据约束规则

| 规则编号 | 约束对象 | 约束说明 |
|---------|---------|---------|
| S-01 | 值类型固定 | 普通文本单元格的 `value.type` 固定为 `"simple"`，不可更改 |
| S-02 | 内容直接输出 | `value.value` 存储的文本内容在渲染时原样输出，不做任何计算或数据填充 |
| S-03 | 行高联动 | 修改 `cellStyle.lineHeight` 后前端立即更新对应单元格的行高样式并重新渲染表格 |
| S-04 | 展开方向 | 普通文本单元格通常 `expand` 为 `"None"`（不展开），因为静态文本无需数据展开 |
| S-05 | fillBlankRows | 普通文本单元格通常 `fillBlankRows` 为 `false`，因为静态文本无需填充空白行 |

---

## 四、参考数据

以下为两份普通文本单元格的 JSON 示例：第一份为带完整样式和链接的标题单元格，第二份为默认样式的空文本单元格。

### 示例1：带样式的标题单元格

```json
{
  "rowNumber": 1,
  "columnNumber": 1,
  "rowSpan": 0,
  "colSpan": 2,
  "name": "A1",
  "value": {
    "value": "文本演示",
    "type": "simple"
  },
  "cellStyle": {
    "bgcolor": "208,2,27",
    "forecolor": "248,231,28",
    "fontSize": 11,
    "fontFamily": "仿宋",
    "format": null,
    "lineHeight": 5,
    "align": "right",
    "valign": "top",
    "bold": true,
    "italic": true,
    "underline": true,
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
  "linkUrl": "${ return 'http://www.baidu.com'}",
  "linkTargetWindow": null,
  "linkParameters": [
    {
      "name": "a",
      "value": "1"
    },
    {
      "name": "b",
      "value": "2"
    }
  ],
  "fillBlankRows": false,
  "multiple": 0,
  "expand": "None",
  "leftParentCellName": null,
  "topParentCellName": null,
  "conditionPropertyItems": null
}
```

### 示例2：默认样式的空文本单元格

```json
{
  "rowNumber": 8,
  "columnNumber": 4,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "D8",
  "value": {
    "value": "",
    "type": "simple"
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

> **关键规则**：普通文本单元格的 `value.type` 必须为 `"simple"`，`value.value` 为要显示的文本字符串。当 `value.value` 为空字符串 `""` 时，单元格渲染为空白。`expand` 通常设为 `"None"`（不展开），因为普通文本无需按数据行展开。`rowSpan` 和 `colSpan` 为 `0` 时表示不合并单元格，大于 `0` 时表示合并对应行数或列数。

---
