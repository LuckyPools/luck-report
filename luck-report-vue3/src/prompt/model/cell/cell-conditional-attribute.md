# 单元格条件属性说明（ConditionPropertyItem）

## 一、职能
条件属性用于在单元格满足特定条件时动态改变其样式、值、链接或触发分页。每个单元格的 `conditionPropertyItems` 是一个条件属性分组列表，每个分组包含一组条件及满足条件后的效果。渲染时按分组顺序依次判断，满足条件的分组效果叠加生效。

---

## 二、关键约束提示

> **重要提示**：数据模型、约束规则已迁移至 `data-schemas.ts`，通过工具自动校验。

| 约束项 | 要求 |
|--------|------|
| conditionPropertyItems | 条件属性分组数组 |
| conditions | 条件列表，条件之间通过 join 连接 |
| cellStyle | 条件样式，继承 CellStyle 并增加 Scope 属性 |
| paging | 条件分页配置，满足条件时触发分页 |

> **条件类型**：
> - property：属性条件，比较数据集字段值
> - expression：表达式条件，左右均为表达式
> - cell：单元格条件，比较指定单元格的值
> - current：当前值条件，比较当前单元格自身值

> **样式作用范围（Scope）**：
> - cell：仅当前单元格
> - row：当前单元格所在整行
> - column：当前单元格所在整列

> 条件分组按顺序判断，多个分组的效果可叠加。conditions 为空数组时，该分组无条件限制，效果始终生效。

---

## 三、数据结构

### ConditionPropertyItem 条件属性项
```typescript
{
  name: string              // 条件名称，如"条件1"
  conditions: Condition[]    // 条件列表，空数组表示无条件限制
  rowHeight: number          // 行高，0表示不修改
  colWidth: number           // 列宽，0表示不修改
  newValue: string           // 新值，满足条件时替换单元格值，null表示不修改
  linkUrl: string            // 链接地址，满足条件时设置单元格链接
  linkTargetWindow: string   // 链接打开方式，_blank或null
  linkParameters: LinkParameter[]  // 链接参数列表
  cellStyle: ConditionCellStyle    // 条件样式，满足条件时应用的样式
  paging: Paging              // 分页配置，满足条件时触发分页
  expr: string                // 条件表达式（已废弃）
}
```

### Condition 条件对象
```typescript
{
  type: 'property' | 'expression' | 'cell' | 'current'  // 条件类型
  left: string       // 左侧表达式，type为property时为字段名，type为cell时为单元格名称，type为current时为null
  op: string         // 比较运算符枚举值：GreatThen/EqualsGreatThen/LessThen/EqualsLessThen/Equals/NotEquals/In/NotIn/Like
  operation: string  // 运算符符号：>/>=/</<=/==/!=/in/not in/like
  right: string      // 右侧比较值
  join: 'and' | 'or' | null  // 条件连接方式，多个条件时使用and或or连接
  nextCondition: null      // 【已废弃，禁止使用】必须设为null，否则会导致循环引用错误
}
```

### LinkParameter 链接参数
```typescript
{
  name: string              // 参数名
  value: string             // 参数值，可为表达式
  valueExpression: ExpressionObject  // 参数值表达式对象，当value为表达式时使用
}
```

### ConditionCellStyle 条件样式
继承 CellStyle 并增加以下属性：
```typescript
{
  bgcolorScope: 'cell' | 'row' | 'column'      // 背景色作用范围
  forecolorScope: 'cell' | 'row' | 'column'    // 前景色作用范围
  fontSizeScope: 'cell' | 'row' | 'column'     // 字体大小作用范围
  fontFamilyScope: 'cell' | 'row' | 'column'   // 字体族作用范围
  alignScope: 'cell' | 'row' | 'column'        // 水平对齐作用范围
  valignScope: 'cell' | 'row' | 'column'      // 垂直对齐作用范围
  boldScope: 'cell' | 'row' | 'column'         // 加粗作用范围
  italicScope: 'cell' | 'row' | 'column'       // 斜体作用范围
  underlineScope: 'cell' | 'row' | 'column'    // 下划线作用范围
}
```

### Paging 分页配置
```typescript
{
  position: 'before' | 'after'  // 分页位置：before-之前分页，after-之后分页
  line: number                  // 分页行数，0表示不分页
}
```

---

## 四、条件类型详解

### property - 属性条件
比较数据集字段值，left为字段名：
```json
{
  "name": "条件1",
  "conditions": [
    {
      "type": "property",
      "left": "price",
      "op": "GreatThen",
      "operation": ">",
      "right": "100",
      "join": null,
      "nextCondition": null
    }
  ],
  "rowHeight": 0,
  "colWidth": 0,
  "newValue": null,
  "linkUrl": null,
  "linkTargetWindow": null,
  "linkParameters": null,
  "cellStyle": {
    "forecolor": "255,0,0",
    "forecolorScope": "cell"
  },
  "paging": null,
  "expr": null
}
```

### expression - 表达式条件
左右均为表达式：
```json
{
  "name": "条件1",
  "conditions": [
    {
      "type": "expression",
      "left": "A1+B1",
      "op": "Equals",
      "operation": "==",
      "right": "100",
      "join": null,
      "nextCondition": null
    }
  ],
  "rowHeight": 0,
  "colWidth": 0,
  "newValue": null,
  "linkUrl": null,
  "linkTargetWindow": null,
  "linkParameters": null,
  "cellStyle": {
    "bgcolor": "255,255,0",
    "bgcolorScope": "row"
  },
  "paging": null,
  "expr": null
}
```

### cell - 单元格条件
比较指定单元格的值，left为单元格名称：
```json
{
  "name": "条件1",
  "conditions": [
    {
      "type": "cell",
      "left": "B2",
      "op": "Equals",
      "operation": "==",
      "right": "1",
      "join": null,
      "nextCondition": null
    }
  ],
  "rowHeight": 0,
  "colWidth": 0,
  "newValue": null,
  "linkUrl": null,
  "linkTargetWindow": null,
  "linkParameters": null,
  "cellStyle": {
    "forecolor": "255,0,0",
    "forecolorScope": "cell"
  },
  "paging": null,
  "expr": null
}
```

### current - 当前值条件
比较当前单元格自身值，left为null：
```json
{
  "name": "条件1",
  "conditions": [
    {
      "type": "current",
      "left": null,
      "op": "Equals",
      "operation": "==",
      "right": "1",
      "join": null,
      "nextCondition": null
    }
  ],
  "rowHeight": 0,
  "colWidth": 0,
  "newValue": null,
  "linkUrl": null,
  "linkTargetWindow": null,
  "linkParameters": null,
  "cellStyle": {
    "forecolor": "255,0,0",
    "forecolorScope": "cell"
  },
  "paging": null,
  "expr": null
}
```

---

## 五、多条件组合示例

多个条件通过join连接：
```json
{
  "name": "条件1",
  "conditions": [
    {
      "type": "property",
      "left": "price",
      "op": "GreatThen",
      "operation": ">",
      "right": "100",
      "join": "and",
      "nextCondition": null
    },
    {
      "type": "property",
      "left": "quantity",
      "op": "LessThen",
      "operation": "<",
      "right": "10",
      "join": null,
      "nextCondition": null
    }
  ],
  "rowHeight": 0,
  "colWidth": 0,
  "newValue": null,
  "linkUrl": null,
  "linkTargetWindow": null,
  "linkParameters": null,
  "cellStyle": {
    "bgcolor": "255,255,0",
    "forecolor": "255,0,0",
    "bgcolorScope": "cell",
    "forecolorScope": "cell"
  },
  "paging": null,
  "expr": null
}
```

---

## 六、无条件限制示例

conditions为空数组时，效果始终生效：
```json
{
  "name": "默认样式",
  "conditions": [],
  "rowHeight": 0,
  "colWidth": 0,
  "newValue": null,
  "linkUrl": null,
  "linkTargetWindow": null,
  "linkParameters": null,
  "cellStyle": {
    "bgcolor": "240,240,240",
    "bgcolorScope": "row"
  },
  "paging": null,
  "expr": null
}
```
