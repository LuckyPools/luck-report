# 页面配置说明（Paper）

## 一、职能
页面配置定义了报表页面的整体布局和样式，包括纸张大小、页边距、方向、分页模式、分栏设置、页眉页脚等。报表配置位于 `reportDef.paper` 中，同时 `reportDef` 下还包含 `header`（页眉）、`footer`（页脚）、`rows`（行定义）、`columns`（列定义）等配置。

---

## 二、数据模型

**结构概览**：`reportDef` → `paper`（纸张配置）+ `header`（页眉）+ `footer`（页脚）+ `rows[]`（行定义）+ `columns[]`（列定义）

---

### 1、Paper（纸张配置）

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| leftMargin | number | 左边距（pt） | 默认 `90` |
| rightMargin | number | 右边距（pt） | 默认 `90` |
| topMargin | number | 上边距（pt） | 默认 `72` |
| bottomMargin | number | 下边距（pt） | 默认 `72` |
| paperType | string | 纸张类型 | `A0`~`A10` / `B0`~`B10` / `CUSTOM`（对应 PaperType 枚举），默认 `A4` |
| pagingMode | string | 分页模式 | `fitpage`（按纸张大小分页）/ `fixrows`（按固定行数分页），对应 PagingMode 枚举 |
| fixRows | number | 固定行数分页时每页行数 | `pagingMode` 为 `fixrows` 时生效，`0` 为不限制 |
| width | number | 纸张宽度（pt） | 由 paperType 自动计算，`CUSTOM` 时需手动指定，如 `595` |
| height | number | 纸张高度（pt） | 由 paperType 自动计算，`CUSTOM` 时需手动指定，如 `842` |
| orientation | string | 纸张方向 | `portrait`（纵向）/ `landscape`（横向），对应 Orientation 枚举 |
| htmlReportAlign | string | HTML 报表对齐方式 | `left` / `center` / `right`，对应 HtmlReportAlign 枚举，默认 `left` |
| bgImage | string | 背景图片 URL | 如 `"https://example.com/bg.jpg"`，`null` 为无背景图 |
| columnEnabled | boolean | 是否启用分栏 | `true` / `false`，默认 `false` |
| columnCount | number | 分栏数 | `columnEnabled` 为 `true` 时生效，默认 `2` |
| columnMargin | number | 分栏间距（pt） | 栏与栏之间的间距，默认 `5` |
| htmlIntervalRefreshValue | number | HTML 自动刷新间隔（秒） | `0` 为不刷新，>0 时按指定秒数自动刷新 |

---

### 2、PaperType（纸张类型枚举）

| 枚举值 | 宽×高（pt） | 说明 |
|--------|------------|------|
| A0 | 2384 × 3370 | A0 纸 |
| A1 | 1684 × 2384 | A1 纸 |
| A2 | 1191 × 1684 | A2 纸 |
| A3 | 842 × 1191 | A3 纸 |
| A4 | 595 × 842 | A4 纸（默认） |
| A5 | 420 × 595 | A5 纸 |
| A6 | 298 × 420 | A6 纸 |
| A7 | 210 × 298 | A7 纸 |
| A8 | 147 × 210 | A8 纸 |
| A9 | 105 × 147 | A9 纸 |
| A10 | 74 × 105 | A10 纸 |
| B0 | 2834 × 4008 | B0 纸 |
| B1 | 2004 × 2834 | B1 纸 |
| B2 | 1417 × 2004 | B2 纸 |
| B3 | 1001 × 1417 | B3 纸 |
| B4 | 709 × 1001 | B4 纸 |
| B5 | 499 × 709 | B5 纸 |
| B6 | 354 × 499 | B6 纸 |
| B7 | 249 × 354 | B7 纸 |
| B8 | 176 × 249 | B8 纸 |
| B9 | 125 × 176 | B9 纸 |
| B10 | 88 × 125 | B10 纸 |
| CUSTOM | 自定义 | 需手动指定 width 和 height |

---

### 3、Orientation（纸张方向枚举）

| 枚举值 | 说明 |
|--------|------|
| portrait | 纵向（默认），宽度 < 高度 |
| landscape | 横向，宽度 > 高度 |

---

### 4、PagingMode（分页模式枚举）

| 枚举值 | 说明 |
|--------|------|
| fitpage | 按纸张大小自动分页，内容超出纸张范围时自动分到下一页 |
| fixrows | 按固定行数分页，每页显示 `fixRows` 指定的行数 |

---

### 5、HtmlReportAlign（HTML 对齐枚举）

| 枚举值 | 说明 |
|--------|------|
| left | 左对齐（默认） |
| center | 居中对齐 |
| right | 右对齐 |

---

### 6、HeaderFooterDefinition（页眉页脚）

页眉和页脚使用相同的数据模型，分别位于 `reportDef.header` 和 `reportDef.footer`。

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| left | string | 左侧内容 | 支持表达式，如 `"页眉1"` |
| center | string | 中间内容 | 支持表达式，如 `"页眉2"` |
| right | string | 右侧内容 | 支持表达式，如 `"\"第\"+page()+\"页,共\"+pages()+\"页\""` |
| fontFamily | string | 字体族 | 默认 `"宋体"` |
| fontSize | number | 字体大小 | 默认 `10` |
| forecolor | string | 字体颜色 | RGB 格式，默认 `"0,0,0"` |
| bold | boolean | 是否加粗 | `true` / `false` |
| italic | boolean | 是否斜体 | `true` / `false` |
| underline | boolean | 是否下划线 | `true` / `false` |
| height | number | 页眉/页脚高度（pt） | 默认 `30` |
| margin | number | 页眉/页脚与内容的间距（pt） | 默认 `30` |

> **页眉页脚表达式**：`left`、`center`、`right` 中可使用表达式语法，如 `page()` 获取当前页码，`pages()` 获取总页数。

---

### 7、RowDefinition（行定义）

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| rowNumber | number | 行号 | 从 1 开始，与 cellsMap 中的 rowNumber 对应 |
| height | number | 行高（pt） | 如 `18`、`19`、`56`、`128` |
| band | string | 行类型 | `null`（普通行）/ `headerrepeat`（重复表头行）/ `footerrepeat`（重复表尾行）/ `title`（标题行）/ `summary`（总结行），对应 Band 枚举 |

---

### 8、Band（行类型枚举）

| 枚举值 | 说明 |
|--------|------|
| headerrepeat | 重复表头行，每页都显示 |
| footerrepeat | 重复表尾行，每页都显示 |
| title | 标题行，仅在第一页显示 |
| summary | 总结行，仅在最后一页显示 |

---

### 9、ColumnDefinition（列定义）

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| columnNumber | number | 列号 | 从 1 开始，与 cellsMap 中的 columnNumber 对应 |
| width | number | 列宽（pt） | 如 `131`、`80`、`74` |
| hide | boolean | 是否隐藏列 | `true`（隐藏）/ `false`（显示） |

---

## 三、数据约束规则

| 规则编号 | 约束对象 | 约束说明 |
|---------|---------|---------|
| P-01 | 纸张类型联动 | `paperType` 为非 `CUSTOM` 时，`width` 和 `height` 由系统根据纸张类型自动计算，前端禁用宽高输入框；为 `CUSTOM` 时才允许手动输入宽高 |
| P-02 | 方向联动 | `orientation` 为 `landscape` 时，纸张宽高互换显示，前端自动交换 width 和 height |
| P-03 | 分页模式联动 | `pagingMode` 为 `fixrows` 时，显示每页固定行数输入框（`fixRows`）；为 `fitpage` 时隐藏该输入框 |
| P-04 | fixRows 校验 | `pagingMode` 为 `fixrows` 时，`fixRows` 必须 ≥ 1，前端校验不通过会提示；`fixRows` 默认值为 30 |
| P-05 | 分栏联动 | `columnEnabled` 为 `true` 时，分栏数量（`columnCount`）和栏间距（`columnMargin`）输入框才可编辑；为 `false` 时禁用 |
| P-06 | columnCount 范围 | `columnCount` 取值范围为 2~10，前端通过下拉选择提供 |
| P-07 | 刷新间隔校验 | `htmlIntervalRefreshValue` 必须 ≥ 0，非数字或负数前端会提示校验失败 |
| P-08 | 页眉页脚表达式 | 页眉页脚的 `left` / `center` / `right` 支持表达式语法，可使用 `page()` 和 `pages()` 函数动态显示页码 |
| P-09 | 边距单位转换 | 前端输入的边距值以 mm 为单位，保存时通过 `mmToPoint()` 转换为 pt 存储到 `paper` 对象中 |

---

## 四、参考数据

以下为一份完整的报表配置 JSON 示例，包含 paper、header、footer、rows、columns：

```json
{
  "paper": {
    "leftMargin": 90,
    "rightMargin": 90,
    "topMargin": 72,
    "bottomMargin": 72,
    "paperType": "A4",
    "pagingMode": "fitpage",
    "fixRows": 0,
    "width": 595,
    "height": 842,
    "orientation": "portrait",
    "htmlReportAlign": "left",
    "bgImage": "https://c-ssl.dtstatic.com/uploads/item/201802/13/20180213121942_PjHEJ.thumb.400_0.jpeg",
    "columnEnabled": false,
    "columnCount": 2,
    "columnMargin": 5,
    "htmlIntervalRefreshValue": 0
  },
  "header": {
    "left": "页眉1",
    "center": "页眉2",
    "right": "\"第\"+page()+\"页,共\"+pages()+\"页\"",
    "fontFamily": "宋体",
    "fontSize": 10,
    "forecolor": "0,0,0",
    "bold": false,
    "italic": false,
    "underline": false,
    "height": 30,
    "margin": 30
  },
  "footer": {
    "left": "页脚1",
    "center": "页脚2",
    "right": "\"第\"+page()+\"页,共\"+pages()+\"页\"",
    "fontFamily": "宋体",
    "fontSize": 10,
    "forecolor": "0,0,0",
    "bold": false,
    "italic": false,
    "underline": false,
    "height": 30,
    "margin": 30
  },
  "rows": [
    { "rowNumber": 1, "height": 18, "band": null },
    { "rowNumber": 2, "height": 18, "band": null },
    { "rowNumber": 3, "height": 19, "band": null }
  ],
  "columns": [
    { "columnNumber": 1, "width": 131, "hide": false },
    { "columnNumber": 2, "width": 80, "hide": false },
    { "columnNumber": 3, "width": 74, "hide": false }
  ]
}
```

---

## 五、工具调用

| 操作 | 工具名称 | 说明 |
|------|---------|------|
| 读取 | `get_paper_config` | 获取报表的页面配置数据，包含纸张大小、边距、方向等信息 |
| 修改 | `update_paper` | 传入 paper 对象合并更新页面配置属性，只需传入要修改的属性，未传入的保持不变 |
| 保存报表 | `save_report` | 保存当前报表到服务器 |
