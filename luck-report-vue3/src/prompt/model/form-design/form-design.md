# 查询表单说明（searchForm）

## 一、职能
查询表单是报表的查询条件区域，在报表预览时渲染为表单 UI。表单中的输入组件通过 `vModel` 绑定数据集参数（Dataset Parameter），用户填写表单后参数值回传给数据集，实现数据筛选。

---

## 二、数据操作步骤

> **重要提示**：数据模型、约束规则已迁移至 `data-schemas.ts`，通过工具自动校验。

### (一) 读取查询表单步骤
1. 调用【get_search_form】工具获取查询条件对象

### (二) 创建/修改查询表单步骤
1. 调用【get_search_form】工具获取查询表单对象
2. （创建操作）构建新的查询表单对象 / （修改操作）基于获取的查询表单对象，按用户要求修改对应字段，查询表单对象必须符合数据模型约束
3. 调用【set_search_form】工具写入查询条件，searchForm 参数必须是JSON对象，禁止传JSON字符串
4. 若 set_search_form 返回 0，可重试

---

## 三、关键约束提示

| 约束项 | 要求 |
|--------|------|
| vModel | 必须与数据集 Parameter 的 name 一致 |
| span | 同一行内多个组件的 span 之和必须 ≤ 24 |
| fields 顶层结构 | 顶层元素必须是 RowComponent（layout: "rowFormItem"） |
| options | Select/RadioGroup/CheckboxGroup 必须配置 options 列表 |

> **组件类型速查**：
> | 组件 | tag | 用途 |
> |------|-----|------|
> | 单行文本 | u-input | 文本输入 |
> | 计数器 | u-input-number | 数字输入 |
> | 下拉选择 | u-select | 单选/多选下拉 |
> | 单选框组 | u-radio-group | 单选按钮组 |
> | 多选框组 | u-checkbox-group | 多选框组 |
> | 开关 | u-switch | 布尔开关 |
> | 日期选择 | u-date-picker | 日期/时间选择 |

> **重要规则**：输入类组件的 vModel 必须与数据集 Parameter 的 name 一致，否则表单提交时参数无法传递到 SQL。
