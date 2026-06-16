# 查询表单说明

## 一、概念说明
查询表单是报表的查询条件区域，在报表预览时渲染为表单 UI。表单中的输入组件通过 `vModel` 绑定数据集参数，用户填写表单后参数值回传给数据集，实现数据筛选。

## 二、关键规则
1. **vModel 必须与数据集 Parameter 一致**：输入类组件的 vModel 必须与数据集 Parameter 的 name 一致，否则表单提交时参数无法传递到 SQL。
2. **span 之和必须 ≤ 24**：同一行内多个组件的 span 之和必须 ≤ 24。
3. **顶层结构必须是 RowComponent**：fields 顶层元素必须是 layout 为 "rowFormItem" 的行组件。

## 三、组件类型速查
| 组件 | tag | 用途 |
|------|-----|------|
| 单行文本 | u-input | 文本输入 |
| 计数器 | u-input-number | 数字输入 |
| 下拉选择 | u-select | 单选/多选下拉 |
| 单选框组 | u-radio-group | 单选按钮组 |
| 多选框组 | u-checkbox-group | 多选框组 |
| 开关 | u-switch | 布尔开关 |
| 日期选择 | u-date-picker | 日期/时间选择 |

## 四、数据约束
数据约束由 data-schemas.ts 自动校验。主要约束：
- vModel 必填，必须与数据集 Parameter 的 name 一致
- span 必填，同一行内多个组件的 span 之和必须 ≤ 24
- Select/RadioGroup/CheckboxGroup 必须配置 options 列表
