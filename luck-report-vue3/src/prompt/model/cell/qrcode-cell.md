# 二维码单元格说明（ZxingValue Cell - QRCode）

## 一、职能

二维码单元格用于在报表中生成二维码图片。单元格的 `value.type` 为 `"zxing"` 且 `value.category` 为 `"qrcode"` 时即为二维码单元格，支持两种数据来源：静态文本（`source` 为 `"text"`）和表达式（`source` 为 `"expression"`）。静态文本模式下 `value.value` 存储要编码的文本字符串；表达式模式下 `value.value` 存储一段 JavaScript 表达式，运行时动态计算编码内容。可配置二维码的宽高（`width`/`height`），单位为像素。

---

## 二、数据模型

**结构概览**：`cell` → `value(ZxingValue)` + `cellStyle(CellStyle)` + 链接/展开/条件属性等附属配置

### 1、cell 单元格定义

cell 的通用字段与普通文本单元格一致，详见[普通文本类型单元格说明](simple-text-cell.md)的 cell 部分。二维码单元格重点关注以下字段：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| value | ZxingValue | 单元格值对象 | 见 ZxingValue 数据模型 |
| expand | string | 展开方向 | `"Right"` / `"Down"` / `"None"`，仅当 `source` 为 `"expression"` 时可设置展开 |

---

### (二) ZxingValue 值对象（二维码模式）

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| type | string | 值类型 | 固定 `"zxing"`，标识为二维码/条码类型 |
| category | string | 分类 | 固定 `"qrcode"`，标识为二维码 |
| source | string | 数据来源 | `"text"`（静态文本）/ `"expression"`（表达式） |
| value | string | 编码内容或表达式文本 | 当 `source` 为 `"text"` 时为要编码的文本；当 `source` 为 `"expression"` 时为 JavaScript 表达式 |
| width | number | 二维码宽度（px） | 最小值 `1`，默认 `100` |
| height | number | 二维码高度（px） | 最小值 `1`，默认 `100` |
| format | string | 编码格式 | 二维码固定为 `"QR_CODE"`，不可更改 |
| codeDisplay | boolean | 是否显示编码文本 | `true` / `false` |

---

### 3、ZxingCategory 分类枚举

| 枚举值 | 说明 |
|--------|------|
| `qrcode` | 二维码 |
| `barcode` | 条码 |

---

### 4、Source 数据来源枚举

| 枚举值 | 说明 |
|--------|------|
| `text` | 静态文本，直接指定编码内容 |
| `expression` | 表达式，通过 JavaScript 表达式动态计算编码内容 |

---

## 三、数据约束规则

| 规则编号 | 约束对象 | 约束说明 |
|---------|---------|---------|
| QR-01 | 值类型固定 | 二维码单元格的 `value.type` 固定为 `"zxing"`，不可更改 |
| QR-02 | 分类固定 | 二维码单元格的 `value.category` 固定为 `"qrcode"` |
| QR-03 | 编码格式固定 | 二维码的 `value.format` 固定为 `"QR_CODE"`，不可选择其他条码格式 |
| QR-04 | 数据来源 | `value.source` 决定数据来源模式：`"text"` 为静态文本，`"expression"` 为表达式动态计算 |
| QR-05 | 宽高约束 | `value.width` 和 `value.height` 最小值为 `1`，单位为像素，默认 `100` |
| QR-06 | 展开方向 | 仅当 `source` 为 `"expression"` 时，`expand` 才可设置为 `"Down"` 或 `"Right"`；`source` 为 `"text"` 时 `expand` 为 `"None"` |
| QR-07 | 格式选项隐藏 | 当 `category` 为 `"qrcode"` 时，前端编辑器隐藏格式选择选项（因为格式固定为 `QR_CODE`） |

---

## 四、参考数据

以下为两份二维码单元格的 JSON 示例：第一份为静态文本模式的二维码单元格，第二份为表达式模式的二维码单元格。

### 示例1：静态文本模式的二维码单元格

```json
{
  "rowNumber": 10,
  "columnNumber": 1,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "A10",
  "value": {
    "type": "zxing",
    "category": "qrcode",
    "source": "text",
    "value": "https://example.com/detail?id=001",
    "width": 100,
    "height": 100,
    "format": "QR_CODE",
    "codeDisplay": false
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

### 示例2：表达式模式的二维码单元格

```json
{
  "rowNumber": 10,
  "columnNumber": 2,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "B10",
  "value": {
    "type": "zxing",
    "category": "qrcode",
    "source": "expression",
    "value": "${return 'https://example.com/detail?id=' + A3}",
    "width": 120,
    "height": 120,
    "format": "QR_CODE",
    "codeDisplay": false
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

> **关键规则**：二维码单元格的 `value.type` 必须为 `"zxing"`，`value.category` 必须为 `"qrcode"`，`value.format` 固定为 `"QR_CODE"`。`value.source` 决定数据来源：静态文本模式（`source` 为 `"text"`）下 `value.value` 为编码文本；表达式模式（`source` 为 `"expression"`）下 `value.value` 为 JavaScript 表达式。`width` 和 `height` 最小值为 `1`，默认 `100`。仅表达式模式支持展开方向设置。

---
