# 单元格通用属性说明（cell）

## 一、职能
报表由一个个单元格组成，每个单元格通过 `cell` 定义其位置、数据值、样式、展开方式、父子格关系等属性。后台渲染报表时，根据单元格的展开方向和父子格关系进行数据填充和单元格复制，最终生成完整的报表。

---

## 二、数据模型

**结构概览**：`cellsMap{ "row,col": cell }` → `cell`（含 `value`、`cellStyle`、`conditionPropertyItems`）

---

### (一) cell（单元格定义）

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| rowNumber | number | 行号 | 从 1 开始，对应 cellsMap 的 key 第一部分 |
| columnNumber | number | 列号 | 从 1 开始，对应 cellsMap 的 key 第二部分 |
| rowSpan | number | 行合并数 | `0` 表示不合并，>0 表示跨行数 |
| colSpan | number | 列合并数 | `0` 表示不合并，>0 表示跨列数 |
| name | string | 单元格名称 | 如 `"A1"`、`"B2"`，列字母+行号组合 |
| value | Value | 单元格值对象 | 根据 type 不同有多种结构，见下方 ValueType 说明 |
| cellStyle | CellStyle | 单元格样式 | 见 CellStyle 数据模型 |
| linkUrl | string | 链接地址 | 支持表达式 `${...}`，如 `"${ return 'http://www.baidu.com'}"`，`null` 为无链接 |
| linkTargetWindow | string | 链接打开方式 | `"_blank"`（新窗口）/ `null`（当前窗口） |
| linkParameters | LinkParameter[] | 链接参数列表 | 点击链接时传递的参数，`null` 为无参数 |
| fillBlankRows | boolean | 是否填充空白行 | `true` / `false`，当数据行数不足时是否补空白行 |
| multiple | number | 填充行数倍数 | `0` 表示不限制，>0 时数据行数必须是该值的倍数，不足补空白行 |
| expand | string | 展开方向 | `None`（不展开）/ `Down`（向下展开）/ `Right`（向右展开），对应 Expand 枚举 |
| leftParentCellName | string | 左父格名称 | 如 `"A1"`，`null` 表示无左父格，`"root"` 表示根 |
| topParentCellName | string | 上父格名称 | 如 `"A1"`，`null` 表示无上父格，`"root"` 表示根 |
| conditionPropertyItems | ConditionPropertyItem[] | 条件属性列表 | 满足条件时改变样式/值/链接等，`null` 为无条件属性 |

---

### (二) ValueType（值类型枚举）

单元格 `value.type` 决定了值的数据结构：

| 枚举值 | 说明 | value 对象关键字段 |
|--------|------|-------------------|
| simple | 普通文本 | `value`: 文本内容 |
| expression | 表达式 | `value`: 表达式文本，`text`: 表达式源码，`expression`: 表达式解析对象 |
| dataset | 数据集引用 | `datasetName`: 数据集名，`aggregate`: 聚合方式，`property`: 字段名，`conditions`: 过滤条件，`order`: 排序 |
| image | 图片 | `path`: 图片路径，`source`: 来源（`"text"`），`width`/`height`: 尺寸 |
| chart | 图表 | `chart`: 图表配置对象（含 dataset、options、plugins、xaxes、yaxes） |
| slash | 斜表头 | `slashes`: 斜线项目数组，`svg`: SVG 内容，`base64Data`: 图片数据 |
| zxing | 二维码/条码 | `text`: 编码内容，`category`: 类别（`"qrcode"` / `"barcode"`），`format`: 条码格式，`width`/`height`: 尺寸 |

---

### (三) Expand（展开方向枚举）

| 枚举值 | 说明 |
|--------|------|
| None | 不展开，单元格保持原位 |
| Down | 向下展开，数据多行时纵向复制单元格 |
| Right | 向右展开，数据多列时横向复制单元格 |

> **展开与父格关系**：当单元格设置了展开方向（Down/Right），需要通过 `leftParentCellName` 和 `topParentCellName` 确定展开的参照关系。向下展开时通常需要设置上父格，向右展开时通常需要设置左父格。

---

### (四) CellStyle（单元格样式）

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| bgcolor | string | 背景色 | RGB 格式 `"R,G,B"`，如 `"255,0,0"`，`null` 为透明 |
| forecolor | string | 前景色（字体颜色） | RGB 格式 `"R,G,B"`，如 `"0,0,0"` 为黑色 |
| fontSize | number | 字体大小 | 如 `10`、`12`、`14` |
| fontFamily | string | 字体族 | 如 `"宋体"`、`"微软雅黑"`、`"Arial"` |
| format | string | 格式化模式 | 如 `"#.##"` 保留两位小数，`null` 为不格式化 |
| lineHeight | number | 行高倍数 | `0` 为默认行高，>0 为行高倍数（如 `2` 表示两倍行高） |
| align | string | 水平对齐 | `left` / `center` / `right`（对应 Alignment 枚举） |
| valign | string | 垂直对齐 | `top` / `middle` / `bottom`（对应 Alignment 枚举） |
| bold | boolean | 是否加粗 | `true` / `false` / `null`（null 为不加粗） |
| italic | boolean | 是否斜体 | `true` / `false` / `null` |
| underline | boolean | 是否下划线 | `true` / `false` / `null` |
| wrapCompute | boolean | 是否自动换行 | `true` / `false` / `null` |
| leftBorder | Border | 左边框 | 见 Border 数据模型，`null` 为无边框 |
| rightBorder | Border | 右边框 | 见 Border 数据模型，`null` 为无边框 |
| topBorder | Border | 上边框 | 见 Border 数据模型，`null` 为无边框 |
| bottomBorder | Border | 下边框 | 见 Border 数据模型，`null` 为无边框 |

---

### (五) Border（边框）

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| width | number | 边框宽度 | 如 `1`、`2` |
| color | string | 边框颜色 | RGB 格式 `"R,G,B"`，如 `"0,0,0"` |
| style | string | 边框样式 | `solid`（实线）/ `dashed`（虚线）/ `doublesolid`（双实线），对应 BorderStyle 枚举 |

---

### (六) LinkParameter（链接参数）

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| name | string | 参数名 | 如 `"a"` |
| value | string | 参数值 | 如 `"1"`，可为表达式 |
| valueExpression | object | 值表达式对象 | 表达式解析结果，设计器使用 |

---

## 三、数据约束规则

| 规则编号 | 约束对象 | 约束说明 |
|---------|---------|---------|
| C-01 | 值类型联动 | 单元格值类型（`value.type`）决定属性面板显示的编辑器：`simple` → SimpleValueEditor，`dataset` → DatasetValueEditor，`expression` → ExpressionValueEditor，`image` → ImageValueEditor，`slash` → SlashValueEditor，`qrcode`/`barcode` → ZxingValueEditor，`chart` → ChartValueEditor |
| C-02 | 聚合与展开联动 | 当 `value.aggregate` 为 sum / count / max / min / avg 时，排序（`order`）和展开方向（`expand`）自动设为不可编辑并重置为 `none` / `None`，因为聚合值不需要展开和排序 |
| C-03 | 聚合与映射联动 | 当 `value.aggregate` 为 group 或 select 时，显示数据映射配置（`mappingType`）；其他聚合类型隐藏映射配置 |
| C-04 | fillBlankRows 与 multiple | `fillBlankRows` 为 `true` 时 `multiple` 才生效，`multiple` 必须 ≥ 1，表示数据行数必须是该值的倍数 |
| C-05 | wrapCompute 换行计算 | `wrapCompute` 为 `true` 时启用自动换行计算，单元格内容超出宽度时自动换行并调整行高 |
| C-06 | 父格与展开联动 | 单元格设置展开方向（`expand` 为 Down 或 Right）时，需配合左父格（`leftParentCellName`）和上父格（`topParentCellName`）控制数据填充方向；默认父格由系统自动推断（左父格取同行左侧单元格，上父格取同列上方单元格） |
| C-07 | 链接参数依赖 | 配置链接参数（`linkParameters`）前必须先填写 `linkUrl`，否则前端不允许打开参数配置弹窗 |
| C-08 | 自定义分组依赖 | 聚合类型为 `customgroup` 时才能配置自定义分组（`groupItems`），且必须先绑定数据集（`datasetName`）和属性（`property`），否则无法打开分组配置弹窗 |
| C-09 | 条件属性继承 | 单元格的 `conditionPropertyItems` 在数据集值编辑器和属性面板中均可配置，两处修改同步生效 |

---

## 四、参考数据

以下为几种典型单元格的 JSON 示例，涵盖不同值类型和样式配置：

### (一) 普通文本单元格

```json
"1,2": {
  "rowNumber": 1,
  "columnNumber": 2,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "B1",
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

### (二) 表达式单元格（含父格关系）

```json
"2,2": {
  "rowNumber": 2,
  "columnNumber": 2,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "B2",
  "value": {
    "text": "return 1",
    "expression": {
      "expr": "return1",
      "expressionList": [
        {
          "expr": "1",
          "operators": [],
          "expressions": [
            { "expr": "1", "value": 1 }
          ]
        }
      ],
      "returnExpression": null
    },
    "value": "return 1",
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
  "leftParentCellName": "A1",
  "topParentCellName": "A1",
  "conditionPropertyItems": null
}
```

### (三) 数据集单元格（向下展开，含条件属性）

```json
"3,1": {
  "rowNumber": 3,
  "columnNumber": 1,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "A3",
  "value": {
    "expr": null,
    "datasetName": "orders",
    "aggregate": "group",
    "property": "price",
    "groupItems": null,
    "mappingType": "simple",
    "mappingDataset": null,
    "mappingKeyProperty": null,
    "mappingValueProperty": null,
    "mappingItems": [
      { "value": "1000", "label": "10元" },
      { "value": "2000", "label": "20元" }
    ],
    "conditions": [
      {
        "op": "Equals",
        "operation": "==",
        "join": "and",
        "nextCondition": {
          "op": "LessThen",
          "operation": "<",
          "join": "and",
          "nextCondition": null,
          "left": "price",
          "right": "10000",
          "type": "property"
        },
        "left": "order_id",
        "right": "1",
        "type": "property"
      }
    ],
    "order": "none",
    "value": "orders.group(price)",
    "type": "dataset"
  },
  "cellStyle": {
    "bgcolor": null,
    "forecolor": "0,0,0",
    "fontSize": 10,
    "fontFamily": "宋体",
    "format": null,
    "lineHeight": 2,
    "align": "center",
    "valign": "middle",
    "bold": null,
    "italic": null,
    "underline": null,
    "wrapCompute": true,
    "leftBorder": null,
    "rightBorder": null,
    "topBorder": null,
    "bottomBorder": null
  },
  "linkUrl": "${ return 'http://www.baidu.com'}",
  "linkTargetWindow": null,
  "linkParameters": null,
  "fillBlankRows": true,
  "multiple": 0,
  "expand": "Down",
  "leftParentCellName": null,
  "topParentCellName": "root",
  "conditionPropertyItems": [ ]
}
```

### (四) 图片单元格

```json
"4,1": {
  "rowNumber": 4,
  "columnNumber": 1,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "A4",
  "value": {
    "path": "https://pic.nximg.cn/file/20200516/30395639_143157224036_2.jpg",
    "expr": null,
    "expression": null,
    "source": "text",
    "width": 100,
    "height": 100,
    "value": "https://pic.nximg.cn/file/20200516/30395639_143157224036_2.jpg",
    "type": "image"
  },
  "cellStyle": { },
  "linkUrl": "${ return 'http://www.baidu.com'}",
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

### (五) 二维码单元格

```json
"6,1": {
  "rowNumber": 6,
  "columnNumber": 1,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "A6",
  "value": {
    "width": 100,
    "height": 100,
    "source": "text",
    "text": "二维码内容",
    "expr": null,
    "format": null,
    "expression": null,
    "category": "qrcode",
    "codeDisplay": false,
    "value": "二维码内容",
    "type": "zxing"
  },
  "cellStyle": { },
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

### (六) 条码单元格

```json
"7,1": {
  "rowNumber": 7,
  "columnNumber": 1,
  "rowSpan": 0,
  "colSpan": 0,
  "name": "A7",
  "value": {
    "width": 103,
    "height": 40,
    "source": "text",
    "text": "条码文本",
    "expr": null,
    "format": "AZTEC",
    "expression": null,
    "category": "barcode",
    "codeDisplay": false,
    "value": "条码文本",
    "type": "zxing"
  },
  "cellStyle": { },
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

> **重要规则**：
> - `expand` 为 `Down` 时，单元格随数据行向下复制，需配合 `topParentCellName` 确定参照；`expand` 为 `Right` 时，需配合 `leftParentCellName` 确定参照。
> - `fillBlankRows` 为 `true` 时，`multiple` 指定数据行数的最小倍数，不足时补空白行。
> - `linkUrl` 支持表达式语法 `${...}`，表达式返回值作为链接地址。

## 五、数据操作步骤

### (一) 读取单元格步骤
1. 确认单元格坐标，坐标由行坐标 rowIndex 和列坐标 colIndex 构成，从0开始
2. 传入 rowIndex、colIndex 作为参数调用【read_cell】工具获取单元格数据
3. read_cell 返回的单元格数据中 rowNumber/columnNumber 从1开始，name 格式为列字母+行号（如 A1），与 rowIndex/colIndex 的换算关系：rowIndex = rowNumber - 1，colIndex = columnNumber - 1，

### (二) 修改单元格步骤
1. 确认单元格坐标（rowIndex、colIndex，从0开始）
2. 传入 rowIndex、colIndex 调用【read_cell】工具获取当前单元格完整数据
3. 如果单元格数据不存在说明报表行列数不足，需要先补齐行或列。查阅 TABLE_ROW 或 TABLE_COL 文档，补齐行列后重新开始修改单元格
4. 基于获取的单元格数据，按用户要求修改对应字段，修改后的数据必须符合数据模型约束，表达式要调用【validate_expression】工具做校验
5. 传入 rowIndex、colIndex、修改后的完整单元格定义对象（cell）调用【write_cell】工具写入。write_cell 会自动备份原数据，返回 1 表示成功、0 表示失败
6. 若 write_cell 返回 0，可调用【restore_data】工具还原备份后重试

### (三) 清空单元格步骤
1. 确认要清空的区域范围（startRow、endRow、startCol、endCol，从0开始）
2. 根据清空需求选择对应工具：
   - 仅清空内容（保留样式）→ 调用【clear_cell_content】
   - 仅清空样式（保留内容）→ 调用【clear_cell_style】
   - 全部清空（内容+样式）→ 调用【clear_cell_all】
