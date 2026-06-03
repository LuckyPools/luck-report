# 斜表头单元格说明（SlashValue Cell）

## 一、职能

斜表头单元格用于在报表中绘制斜线表头，常见于交叉表的左上角单元格。单元格的 `value.type` 为 `"slash"` 时即为斜表头单元格，通过 `value.slashes` 数组配置多条斜线及每条斜线上的文本标签。每条斜线由起点坐标（`x`/`y`）、角度（`degree`）和文本（`text`）定义。报表渲染时根据配置绘制 SVG 斜线并在指定位置输出文本标签。

---

## 二、数据模型

**结构概览**：`cell` → `value(SlashValue)` + `cellStyle(CellStyle)` + 链接/展开/条件属性等附属配置

### 1、cell 单元格定义

cell 的通用字段与普通文本单元格一致，详见[普通文本类型单元格说明](simple-text-cell.md)的 cell 部分。斜表头单元格重点关注以下字段：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| value | SlashValue | 单元格值对象 | 见 SlashValue 数据模型 |
| expand | string | 展开方向 | 斜表头单元格通常为 `"None"`（不展开） |

---

### (二) DiagonalValue 值对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| type | string | 值类型 | 固定 `"slash"`，标识为斜表头类型 |
| slashes | Slash[] | 斜线列表 | 每条斜线包含坐标、角度和文本，`null` 或空数组为无斜线 |
| svg | string | SVG 内容 | 渲染后生成的 SVG 字符串，由系统自动生成 |
| base64Data | string | Base64 图片数据 | 渲染后生成的 Base64 编码图片数据，由系统自动生成 |

---

### 3、Slash 斜线对象

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| x | number | 文本 X 坐标 | 相对于单元格的横坐标位置 |
| y | number | 文本 Y 坐标 | 相对于单元格的纵坐标位置 |
| degree | number | 斜线角度 | 斜线的旋转角度，如 `45`、`30` |
| text | string | 斜线上的文本标签 | 如 `"类别"`、`"月份"` |

---

## 三、数据约束规则

| 规则编号 | 约束对象 | 约束说明 |
|---------|---------|---------|
| SL-01 | 值类型固定 | 斜表头单元格的 `value.type` 固定为 `"slash"`，不可更改 |
| SL-02 | 斜线列表 | `value.slashes` 为斜线配置数组，至少包含一条斜线才有实际显示效果 |
| SL-03 | 展开方向 | 斜表头单元格通常 `expand` 为 `"None"`（不展开），因为斜表头为静态展示 |
| SL-04 | SVG 自动生成 | `value.svg` 和 `value.base64Data` 由系统渲染时自动生成，无需手动设置 |
| SL-05 | 坐标与角度 | 每条斜线的 `x`、`y`、`degree` 共同决定斜线的绘制位置和角度，`text` 决定标签内容 |
| SL-06 | 刷新机制 | 修改斜线配置后需调用刷新操作重新绘制 SVG |

---

## 四、参考数据

以下为一份包含两条斜线的斜表头单元格 JSON 示例。

### 示例：双斜线表头单元格

```json
{
  "rowNumber": 1,
  "columnNumber": 1,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "A1",
  "value": {
    "type": "slash",
    "svg": null,
    "slashes": [
      {
        "x": 20,
        "y": 30,
        "degree": 45,
        "text": "类别"
      },
      {
        "x": 60,
        "y": 10,
        "degree": 45,
        "text": "月份"
      }
    ],
    "base64Data": null
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

> **关键规则**：斜表头单元格的 `value.type` 必须为 `"slash"`，`value.slashes` 数组中每条斜线通过 `x`/`y` 定位文本、`degree` 设置斜线角度、`text` 设置标签文本。`svg` 和 `base64Data` 由系统渲染时自动生成。斜表头单元格通常不展开（`expand` 为 `"None"`）。

---
