# 单元格条件属性说明（ConditionPropertyItem）

## 一、职能
条件属性用于在单元格满足特定条件时动态改变其样式、值、链接或触发分页。每个单元格的 `conditionPropertyItems` 是一个条件属性分组列表，每个分组包含一组条件及满足条件后的效果。渲染时按分组顺序依次判断，满足条件的分组效果叠加生效。

---

## 二、数据模型

**结构概览**：`CellDefinition.conditionPropertyItems[]` → `ConditionPropertyItem`（含 `conditions[]`、`cellStyle`、`paging`、`linkParameters[]`）

---

### 1、ConditionPropertyItem（条件属性项）

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| name | String | 条件分组名称 | 如 `"分组1"`、`"分组2"`，用于标识 |
| conditions | List\<Condition\> | 条件列表 | 条件之间通过 `join` 连接，见 Condition 数据模型 |
| rowHeight | int | 满足条件时的行高 | `-1` 表示不改变行高，>0 为指定行高值 |
| colWidth | int | 满足条件时的列宽 | `-1` 表示不改变列宽，>0 为指定列宽值 |
| newValue | String | 满足条件时替换的新值 | 如 `"9999"`，`null` 表示不改变值 |
| linkUrl | String | 满足条件时的链接地址 | 如 `"http://www.baidu.com"`，`null` 表示不改变链接 |
| linkTargetWindow | String | 链接打开方式 | `"_blank"`（新窗口）/ `null`（当前窗口） |
| linkParameters | List\<LinkParameter\> | 链接参数列表 | 满足条件时链接携带的参数，`null` 为无参数 |
| cellStyle | ConditionCellStyle | 条件样式 | 继承 CellStyle，额外增加各属性的 Scope 作用范围，`null` 表示不改变样式 |
| paging | ConditionPaging | 条件分页 | 满足条件时触发分页，`null` 表示不分页 |
| expr | String | 条件表达式字符串 | 表达式方式定义条件，`null` 表示使用 conditions 列表 |

---

### 2、ConditionType（条件类型枚举）

| 枚举值 | 说明 | 使用场景 |
|--------|------|---------|
| property | 属性条件 | 比较数据集字段值与指定值，如 `order_id == 1` |
| expression | 表达式条件 | 左右均为表达式，如 `A1 > 100` |
| cell | 单元格条件 | 比较指定单元格的值与表达式结果 |
| current | 当前值条件 | 比较当前单元格自身值与表达式结果 |

---

### 3、Condition（条件数据模型）

每个条件项包含以下字段：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| type | String | 条件类型 | `property` / `expression` / `cell` / `current`（对应 ConditionType 枚举） |
| op | String | 比较操作符（枚举名） | `Equals` / `NotEquals` / `GreatThen` / `EqualsGreatThen` / `LessThen` / `EqualsLessThen` / `In` / `NotIn` / `Like`（对应 Op 枚举） |
| operation | String | 比较操作符（符号） | `"=="` / `"!="` / `">"` / `">="` / `"<"` / `"<="` / `" in "` / `" not in "` / `" like "` |
| join | String | 与下一条件的连接方式 | `"and"` / `"or"` / `null`（最后一个条件为 null），对应 Join 枚举 |
| left | String | 左侧值 | property 类型为字段名（如 `"order_id"`），expression/cell 类型为表达式或单元格名，`null` 表示当前值 |
| right | String | 右侧值 | 比较的目标值，如 `"1"`、`"10000"` |
| nextCondition | Condition | 下一个条件 | 链表结构，`null` 表示当前为最后一个条件 |

---

### 4、Op（比较操作符枚举）

| 枚举值 | 符号 | 说明 |
|--------|------|------|
| Equals | `==` | 等于 |
| NotEquals | `!=` | 不等于 |
| GreatThen | `>` | 大于 |
| EqualsGreatThen | `>=` | 大于等于 |
| LessThen | `<` | 小于 |
| EqualsLessThen | `<=` | 小于等于 |
| In | ` in ` | 包含 |
| NotIn | ` not in ` | 不包含 |
| Like | ` like ` | 模糊匹配 |

---

### 5、Join（条件连接枚举）

| 枚举值 | 说明 |
|--------|------|
| and | 与，两个条件同时满足 |
| or | 或，满足任一条件即可 |

---

### 6、ConditionCellStyle（条件样式）

继承 CellStyle 的所有属性（bgcolor、forecolor、fontSize、fontFamily、format、lineHeight、align、valign、bold、italic、underline、wrapCompute、四边 Border），额外增加以下 Scope 属性控制样式作用范围：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| bgcolorScope | Scope | 背景色作用范围 | `cell`（仅当前单元格）/ `row`（整行）/ `column`（整列） |
| forecolorScope | Scope | 前景色作用范围 | `cell` / `row` / `column` |
| fontSizeScope | Scope | 字体大小作用范围 | `cell` / `row` / `column` |
| fontFamilyScope | Scope | 字体族作用范围 | `cell` / `row` / `column` |
| alignScope | Scope | 水平对齐作用范围 | `cell` / `row` / `column` |
| valignScope | Scope | 垂直对齐作用范围 | `cell` / `row` / `column` |
| boldScope | Scope | 加粗作用范围 | `cell` / `row` / `column` |
| italicScope | Scope | 斜体作用范围 | `cell` / `row` / `column` |
| underlineScope | Scope | 下划线作用范围 | `cell` / `row` / `column` |

---

### 7、Scope（作用范围枚举）

| 枚举值 | 说明 |
|--------|------|
| cell | 仅当前单元格 |
| row | 当前单元格所在整行 |
| column | 当前单元格所在整列 |

---

### 8、ConditionPaging（条件分页）

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| position | String | 分页位置 | `before`（当前行前分页）/ `after`（当前行后分页），对应 PagingPosition 枚举 |
| line | int | 分页行数 | 当 position 为 `after` 时，指定当前行后多少行进行分页 |

---

### 9、LinkParameter（链接参数）

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| name | String | 参数名 | 如 `"a"` |
| value | String | 参数值 | 如 `"1"` |
| valueExpression | Object | 值表达式对象 | 表达式解析结果，设计器使用 |

---

## 三、数据约束规则

| 规则编号 | 约束对象 | 约束说明 |
|---------|---------|---------|
| CD-01 | 条件分组选择 | 添加或编辑条件前必须先选中一个条件分组，否则前端提示"请选择条件项" |
| CD-02 | 左值类型联动 | 条件左值类型（`leftType`）决定表单项：`current` → 无需选择属性，`property` → 必须从数据集字段列表中选择，`expression` → 必须输入表达式并通过后端语法校验 |
| CD-03 | 运算符必填 | 条件的运算符（`operator`）为必填，可选值为 `>` / `>=` / `<` / `<=` / `==` / `!=` / `in` / `like` |
| CD-04 | 值表达式校验 | 条件的右值（`value`）为必填，且会调用后端 `conditionScriptValidation` 接口进行语法校验，语法错误则无法保存 |
| CD-05 | 属性名必填 | 当左值类型为 `property` 时，`property` 字段为必填，必须从数据集字段列表中选择 |
| CD-06 | 表达式语法校验 | 当左值类型为 `expression` 时，表达式内容会调用后端接口校验语法，不通过则无法保存 |
| CD-07 | 条件连接 | 多个条件之间通过 `join`（and / or）连接，第一个条件无 `join`，后续条件必须设置 `join` |
| CD-08 | 样式作用范围 | 条件样式中的每个属性（bgcolor、forecolor、fontSize、fontFamily、bold、italic、underline、align、valign）都有对应的 Scope 字段控制作用范围：`cell`（仅当前单元格）/ `row`（整行）/ `column`（整列） |
| CD-09 | 分页条件联动 | 条件分页（`paging`）仅在条件满足时触发，`paging` 对象非 null 即表示启用条件分页 |
| CD-10 | 链接参数依赖 | 条件链接配置 `linkParameters` 前必须先设置 `linkUrl`，否则无法配置链接参数 |

---

## 四、参考数据

以下为单元格 A3 的条件属性完整示例，包含两个条件分组：

```json
"conditionPropertyItems": [
  {
    "name": "分组1",
    "conditions": [
      {
        "op": "Equals",
        "operation": "==",
        "join": null,
        "nextCondition": {
          "op": "GreatThen",
          "operation": ">",
          "join": "or",
          "nextCondition": null,
          "left": null,
          "right": "3",
          "type": "property"
        },
        "left": null,
        "right": "2",
        "type": "property"
      },
      {
        "op": "GreatThen",
        "operation": ">",
        "join": "or",
        "nextCondition": null,
        "left": null,
        "right": "3",
        "type": "property"
      }
    ],
    "rowHeight": 2,
    "colWidth": 3,
    "newValue": "9999",
    "linkUrl": "http://www.baidu.com",
    "linkTargetWindow": "_blank",
    "linkParameters": [
      {
        "name": "a",
        "value": "1",
        "valueExpression": {
          "expr": "1",
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
        }
      },
      {
        "name": "b",
        "value": "2",
        "valueExpression": {
          "expr": "2",
          "expressionList": [
            {
              "expr": "2",
              "operators": [],
              "expressions": [
                { "expr": "2", "value": 2 }
              ]
            }
          ],
          "returnExpression": null
        }
      }
    ],
    "cellStyle": {
      "bgcolor": "0,0,0",
      "forecolor": "248,231,28",
      "fontSize": 12,
      "fontFamily": "宋体",
      "format": "#.##",
      "lineHeight": 0,
      "align": "center",
      "valign": "middle",
      "bold": true,
      "italic": true,
      "underline": true,
      "wrapCompute": null,
      "leftBorder": {
        "width": 1,
        "color": "0,0,0",
        "style": "solid"
      },
      "rightBorder": null,
      "topBorder": null,
      "bottomBorder": null,
      "bgcolorScope": "row",
      "forecolorScope": "row",
      "fontSizeScope": "row",
      "fontFamilyScope": "row",
      "alignScope": "cell",
      "valignScope": "cell",
      "boldScope": "row",
      "italicScope": "row",
      "underlineScope": "row"
    },
    "paging": {
      "position": "after",
      "line": 2
    },
    "expr": null
  },
  {
    "name": "分组2",
    "conditions": [],
    "rowHeight": -1,
    "colWidth": -1,
    "newValue": null,
    "linkUrl": null,
    "linkTargetWindow": null,
    "linkParameters": null,
    "cellStyle": null,
    "paging": null,
    "expr": null
  }
]
```

> **关键规则**：
> - 条件分组按顺序判断，多个分组的效果可叠加。
> - `conditions` 为空数组时，该分组无条件限制，效果始终生效（如分组2）。
> - `rowHeight` / `colWidth` 为 `-1` 表示不改变，`null` 值的样式属性也表示不改变。
> - ConditionCellStyle 的 Scope 属性决定样式效果的作用范围：`cell` 仅当前格，`row` 整行生效，`column` 整列生效。
> - 条件之间通过 `join` 字段连接形成链表，`nextCondition` 指向下一个条件，最后一个条件的 `nextCondition` 为 `null`。
