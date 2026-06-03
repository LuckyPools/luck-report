# 图片类型单元格说明（ImageValue Cell）

## 一、职能

图片单元格用于在报表中嵌入图片内容。单元格的 `value.type` 为 `"image"` 时即为图片单元格，支持两种图片来源：静态路径（`source` 为 `"text"`）和表达式（`source` 为 `"expression"`）。静态路径模式下 `value.value` 存储图片的 URL 或路径字符串；表达式模式下 `value.value` 存储一段 JavaScript 表达式，运行时动态计算图片路径。可配置图片的宽高（`width`/`height`），单位为像素。

---

## 二、数据模型

**结构概览**：`cell` → `value(ImageValue)` + `cellStyle(CellStyle)` + 链接/展开/条件属性等附属配置

### 1、cell 单元格定义

cell 的通用字段与普通文本单元格一致，详见[普通文本类型单元格说明](simple-text-cell.md)的 cell 部分。图片单元格重点关注以下字段：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| value | ImageValue | 单元格值对象 | 见 ImageValue 数据模型 |
| expand | string | 展开方向 | `"Right"` / `"Down"` / `"None"`，仅当 `source` 为 `"expression"` 时可设置展开 |

---

### 2、ImageValue 值对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| type | string | 值类型 | 固定 `"image"`，标识为图片类型 |
| source | string | 图片来源 | `"text"`（静态路径）/ `"expression"`（表达式） |
| value | string | 图片路径或表达式文本 | 当 `source` 为 `"text"` 时为图片 URL 路径；当 `source` 为 `"expression"` 时为 JavaScript 表达式 |
| width | number | 图片宽度（px） | 最小值 `1`，如 `100`、`200` |
| height | number | 图片高度（px） | 最小值 `1`，如 `100`、`200` |

---

### 3、Source 图片来源枚举

| 枚举值 | 说明 |
|--------|------|
| `text` | 静态路径，直接指定图片 URL |
| `expression` | 表达式，通过 JavaScript 表达式动态计算图片路径 |

---

## 三、数据约束规则

| 规则编号 | 约束对象 | 约束说明 |
|---------|---------|---------|
| I-01 | 值类型固定 | 图片单元格的 `value.type` 固定为 `"image"`，不可更改 |
| I-02 | 图片来源 | `value.source` 决定图片来源模式：`"text"` 为静态路径，`"expression"` 为表达式动态计算 |
| I-03 | 宽高约束 | `value.width` 和 `value.height` 最小值为 `1`，单位为像素 |
| I-04 | 展开方向 | 仅当 `source` 为 `"expression"` 时，`expand` 才可设置为 `"Down"` 或 `"Right"`；`source` 为 `"text"` 时 `expand` 为 `"None"` |
| I-05 | 路径格式 | 当 `source` 为 `"text"` 时，`value.value` 应为有效的图片 URL 或路径字符串 |
| I-06 | 表达式语法 | 当 `source` 为 `"expression"` 时，`value.value` 应为合法的 JavaScript 表达式，返回图片路径字符串 |

---

## 四、参考数据

以下为两份图片单元格的 JSON 示例：第一份为静态路径模式的图片单元格，第二份为表达式模式的图片单元格。

### 示例1：静态路径模式的图片单元格

```json
{
  "rowNumber": 9,
  "columnNumber": 1,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "A9",
  "value": {
    "type": "image",
    "source": "text",
    "value": "https://example.com/images/logo.png",
    "width": 120,
    "height": 80
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

### 示例2：表达式模式的图片单元格

```json
{
  "rowNumber": 9,
  "columnNumber": 2,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "B9",
  "value": {
    "type": "image",
    "source": "expression",
    "value": "${return 'https://example.com/images/' + A3 + '.png'}",
    "width": 100,
    "height": 100
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
  "expand": "Down",
  "leftParentCellName": null,
  "topParentCellName": null,
  "conditionPropertyItems": null
}
```

> **关键规则**：图片单元格的 `value.type` 必须为 `"image"`，`value.source` 决定图片来源模式。静态路径模式（`source` 为 `"text"`）下 `value.value` 为图片 URL；表达式模式（`source` 为 `"expression"`）下 `value.value` 为 JavaScript 表达式，返回图片路径。`width` 和 `height` 最小值为 `1`，单位为像素。仅表达式模式支持展开方向设置。

---
