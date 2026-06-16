# 单元格条件属性说明

## 一、概念说明
条件属性用于在单元格满足特定条件时动态改变其样式、值、链接或触发分页。每个单元格的 `conditionPropertyItems` 是一个条件属性分组列表，每个分组包含一组条件及满足条件后的效果。渲染时按分组顺序依次判断，满足条件的分组效果叠加生效。

## 二、关键规则
1. **条件分组按顺序判断**：多个分组的效果可叠加。
2. **conditions 为空数组时无条件限制**：效果始终生效。
3. **样式作用范围可扩展**：Scope 可设为 cell/row/column，将效果扩展到整行或整列。
4. **nextCondition 必须为 null**：已废弃字段，设为非 null 会导致循环引用错误。

## 三、条件类型
| 类型 | 说明 | left 字段 |
|------|------|----------|
| property | 属性条件，比较数据集字段值 | 字段名 |
| expression | 表达式条件，左右均为表达式 | 表达式文本 |
| cell | 单元格条件，比较指定单元格的值 | 单元格名称 |
| current | 当前值条件，比较当前单元格自身值 | null |

## 四、数据约束
数据约束由 data-schemas.ts 自动校验。主要约束：
- conditions 数组，条件之间通过 join 连接
- op 必须是 GreatThen/EqualsGreatThen/LessThen/EqualsLessThen/Equals/NotEquals/In/NotIn/Like
- join 必须是 and 或 or
- cellStyle 的 Scope 必须是 cell/row/column
- paging.position 必须是 before 或 after
