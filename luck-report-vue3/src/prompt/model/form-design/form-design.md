# 查询表单说明（searchForm）

## 一、职能
查询表单是报表的查询条件区域，在报表预览时渲染为表单 UI。表单中的输入组件通过 `vModel` 绑定数据集参数（Dataset Parameter），用户填写表单后参数值回传给数据集，实现数据筛选。

---

## 二、数据模型

**结构概览**：`SearchForm` → `fields[]` → `RowComponent` → `children[]` → 具体输入组件（Input / Select / RadioGroup / CheckboxGroup / Switch / DatePicker / InputNumber / Button）

---

### 1、SearchForm 顶层属性

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| formRef | string | 表单 ref 标识 | 默认 `"uForm"` |
| tag | string | 表单渲染标签 | 固定 `"u-form"` |
| formModel | string | 表单数据对象名 | 默认 `"formData"` |
| size | string | 表单组件尺寸 | `small` / `medium` / `large` |
| labelPosition | string | 标签对齐方式 | `left` / `right` / `top` |
| labelWidth | number | 标签宽度（px） | 默认 `100` |
| formRules | string | 校验规则对象名 | 默认 `"rules"` |
| gutter | number | 栅格间距（px） | 默认 `15` |
| disabled | boolean | 是否禁用整表 | `true` / `false` |
| span | number | 默认栅格占位 | 默认 `24`（满宽） |
| formBtns | boolean | 是否显示查询/重置按钮 | `true` / `false` |
| fields | Component[] | 表单字段列表（树形结构） | 顶层元素为 RowComponent |

---

### 2、RowComponent（行容器）

每个 `fields` 元素是一个行容器，行内通过 `children` 放置具体输入组件，一行可放多个组件（通过 `span` 控制宽度占比）。

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| type | string | 行类型 | `"default"` |
| tag | string | 渲染标签 | 固定 `"u-row"` |
| tagIcon | string | 图标标识 | `"row"` |
| span | number | 行占位 | 默认 `24` |
| gutter | number | 列间距（px） | 默认 `15` |
| justify | string | 水平排列方式 | `"start"` / `"end"` / `"center"` / `"space-around"` / `"space-between"` |
| align | string | 垂直排列方式 | `"top"` / `"middle"` / `"bottom"` |
| layout | string | 布局类型 | `"rowFormItem"` |
| layoutTree | boolean | 是否为树形布局容器 | `true` |
| componentName | string | 组件名称（唯一） | 如 `"row103"` |
| formId | string | 表单组件 ID | 如 `"103"` |
| renderKey | string | 渲染唯一键 | 时间戳字符串 |
| document | string | 组件文档路径 | `"/component/layout"` |
| children | Component[] | 行内子组件列表 | 放置输入组件或 Button |

---

### 3、BaseInputComponent（输入组件公共属性）

所有输入组件（Input / InputNumber / Select / RadioGroup / CheckboxGroup / Switch / DatePicker）均继承以下公共属性：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| label | string | 字段标签名 | 显示在表单中的名称，如 `"商品名称"` |
| tag | string | 渲染标签 | 见各组件说明 |
| tagIcon | string | 图标标识 | 见各组件说明 |
| vModel | string | 绑定字段名 | **关键属性**，必须与数据集 Parameter 的 name 一致，如 `"product_name"` |
| span | number | 栅格占位 | `1`~`24`，默认 `24`（满宽），同一行内多个组件 span 之和应 ≤ 24 |
| labelWidth | string | 标签宽度（px） | 如 `"100"`，`null` 时继承表单级 labelWidth |
| style | object | 自定义样式 | 如 `{"width": "100%"}` |
| required | boolean | 是否必填 | `true` / `false` |
| regList | Reg[] | 正则校验规则列表 | 如 `[{"pattern": "/^1[3-9]\\d{9}$/", "message": "手机号格式错误"}]` |
| changeTag | boolean | 是否可切换组件类型 | `true` / `false` |
| document | string | 组件文档路径 | 如 `"/component/input"` |
| formId | string | 表单组件 ID | 如 `"101"` |
| renderKey | string | 渲染唯一键 | 时间戳字符串 |
| layout | string | 布局类型 | `"colFormItem"` |
| defaultValue | 各类型 | 默认值 | 各组件类型不同，见各组件说明 |
| disabled | boolean | 是否禁用 | `true` / `false` |
| type | string | 组件子类型 | 大多数为 `null`，DatePicker 中为 `"date"` |

---

### 4、各输入组件独有属性

#### 4.1 Input（单行文本）— tag: `"u-input"`

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| placeholder | string | 占位文本 | 如 `"请输入单行文本"` |
| clearable | boolean | 是否可清空 | `true` / `false` |
| readonly | boolean | 是否只读 | `true` / `false` |
| maxlength | string | 最大输入长度 | `null` 为不限制 |
| showWordLimit | boolean | 是否显示字数统计 | `true` / `false` |
| prepend | string | 前置内容 | `null` 为无 |
| append | string | 后置内容 | `null` 为无 |
| prefixIcon | string | 前缀图标 | `null` 为无 |
| suffixIcon | string | 后缀图标 | `null` 为无 |
| defaultValue | string | 默认值 | `null` 为空 |

#### 4.2 InputNumber（计数器）— tag: `"u-input-number"`

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| stepStrictly | boolean | 是否只能输入步长的倍数 | `true` / `false` |
| controlsPosition | string | 控制按钮位置 | `""`（两侧）/ `"right"`（右侧），`null` 为默认 |
| defaultValue | string | 默认值 | 如 `"10"` |

#### 4.3 Select（下拉选择）— tag: `"u-select"`

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| multiple | boolean | 是否多选 | `true` / `false` |
| clearable | boolean | 是否可清空 | `true` / `false` |
| filterable | boolean | 是否可搜索 | `true` / `false` |
| placeholder | string | 占位文本 | 如 `"请选择下拉选择"` |
| options | Option[] | 选项列表 | 见 Option 数据模型 |
| defaultValue | string | 默认值 | `null` 为空 |

#### 4.4 RadioGroup（单选框组）— tag: `"u-radio-group"`

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| options | Option[] | 选项列表 | 见 Option 数据模型 |
| optionType | string | 单选框样式 | `"default"` / `"button"` |
| border | boolean | 是否带边框 | `true` / `false` |
| size | string | 尺寸 | `"medium"` / `"small"` / `"mini"` |
| defaultValue | string | 默认值 | 如 `"false"` |

#### 4.5 CheckboxGroup（多选框组）— tag: `"u-checkbox-group"`

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| options | Option[] | 选项列表 | 见 Option 数据模型 |
| optionType | string | 多选框样式 | `"default"` / `"button"` |
| border | boolean | 是否带边框 | `true` / `false` |
| size | string | 尺寸 | `"medium"` / `"small"` / `"mini"` |
| defaultValue | string[] | 默认值（数组） | 如 `[]` |

#### 4.6 Switch（开关）— tag: `"u-switch"`

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| activeColor | string | 打开时颜色 | `null` 为默认色 |
| inactiveColor | string | 关闭时颜色 | `null` 为默认色 |
| activeValue | boolean | 打开时的值 | 默认 `true` |
| inactiveValue | boolean | 关闭时的值 | 默认 `false` |
| defaultValue | object | 默认值 | `true` / `false` |

#### 4.7 DatePicker（日期选择）— tag: `"u-date-picker"`

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| type | string | 选择器类型 | `"date"` / `"datetime"` / `"week"` / `"month"` / `"year"` / `"daterange"` 等 |
| format | string | 显示格式 | 如 `"YYYY-MM-DD"`、`"YYYY-MM-DD HH:mm:ss"` |
| valueFormat | string | 值格式 | `"format"`（按 format 解析）/ `"timestamp"` |
| placeholder | string | 占位文本 | 如 `"请选择日期"` |
| clearable | boolean | 是否可清空 | `true` / `false` |
| readonly | boolean | 是否只读 | `true` / `false` |
| defaultValue | string | 默认值 | `null` 为空 |

#### 4.8 Button（按钮）— tag: `"u-button"`

Button 不继承 BaseInputComponent，为独立组件，通常放在 RowComponent 的 children 中。

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| label | string | 按钮文本 | 如 `"主要按钮"` |
| type | string | 按钮类型 | `"primary"` / `"success"` / `"warning"` / `"danger"` / `"info"` / `"default"` |
| size | string | 尺寸 | `"medium"` / `"small"` / `"mini"` |
| icon | string | 图标类名 | 如 `"icon-search"` |
| disabled | boolean | 是否禁用 | `true` / `false` |
| tag | string | 渲染标签 | `"u-button"` |
| tagIcon | string | 图标标识 | `"button"` |
| span | number | 栅格占位 | `1`~`24` |
| layout | string | 布局类型 | `"colFormItem"` |
| changeTag | boolean | 是否可切换类型 | `true` / `false` |
| defaultValue | string | 默认值（按钮文本） | 如 `"主要按钮"` |
| vModel | string | 绑定字段名 | 按钮一般不需要 |
| formId | string | 表单组件 ID | 如 `"110"` |
| renderKey | string | 渲染唯一键 | 时间戳字符串 |
| document | string | 组件文档路径 | `"/component/button"` |

---

### 5、Option 数据模型

Select / RadioGroup / CheckboxGroup 的选项均使用 Option 结构：

| 字段名 | 类型 | 说明 | 可选值 / 备注 |
|--------|------|------|---------------|
| label | string | 选项显示文本 | 如 `"电子产品"` |
| value | string | 选项实际值 | 如 `"电子产品"`，也可为数字如 `1` |

---

### 6、组件类型速查表

| 组件名 | tag | tagIcon | layout | 是否有 vModel | 是否有 options | 用途 |
|--------|-----|---------|--------|--------------|----------------|------|
| 行容器 | `u-row` | `row` | `rowFormItem` | 否 | 否 | 行布局容器 |
| 单行文本 | `u-input` | `input` | `colFormItem` | 是 | 否 | 文本输入 |
| 计数器 | `u-input-number` | `number` | `colFormItem` | 是 | 否 | 数字输入 |
| 下拉选择 | `u-select` | `select` | `colFormItem` | 是 | 是 | 单选/多选下拉 |
| 单选框组 | `u-radio-group` | `radio` | `colFormItem` | 是 | 是 | 单选按钮组 |
| 多选框组 | `u-checkbox-group` | `checkbox` | `colFormItem` | 是 | 是 | 多选框组 |
| 开关 | `u-switch` | `switch` | `colFormItem` | 是 | 否 | 布尔开关 |
| 日期选择 | `u-date-picker` | `date` | `colFormItem` | 是 | 否 | 日期/时间选择 |
| 按钮 | `u-button` | `button` | `colFormItem` | 可选 | 否 | 操作按钮 |

> **重要规则**：输入类组件（Input / InputNumber / Select / RadioGroup / CheckboxGroup / Switch / DatePicker）必须通过 `vModel` 绑定数据集查询参数，`vModel` 的值必须与某个 Dataset 的 Parameter `name` 一致，否则表单提交时参数无法传递到 SQL。

---

## 三、数据约束规则

| 规则编号 | 约束对象 | 约束说明 |
|---------|---------|---------|
| F-01 | vModel 绑定 | 输入类组件的 `vModel` 必须与某个数据集 Parameter 的 `name` 一致，否则表单提交时参数无法传递到 SQL |
| F-02 | span 栅格 | 同一行内多个组件的 `span` 之和必须 ≤ 24，超出会导致布局溢出 |
| F-03 | required 必填 | 组件设置 `required: true` 后，表单提交时会校验该字段是否为空 |
| F-04 | regList 正则 | `regList` 中的正则校验规则在表单提交时触发，不匹配则显示对应 `message` |
| F-05 | componentName 唯一 | 每个组件的 `componentName` 在同一表单内必须唯一，用于组件标识 |
| F-06 | formId 唯一 | 每个组件的 `formId` 在同一表单内必须唯一 |
| F-07 | options 必填 | Select / RadioGroup / CheckboxGroup 必须配置 `options` 列表，否则无选项可渲染 |
| F-08 | fields 顶层结构 | `fields` 的顶层元素必须是 RowComponent（`layout: "rowFormItem"`），输入组件必须放在 RowComponent 的 `children` 中 |

---

## 四、参考数据

以下为一份完整的 searchForm JSON 示例，包含 Input、Select、RadioGroup、Switch、CheckboxGroup、InputNumber、DatePicker 七种输入组件：

```json
"searchForm": {
  "formRef": "uForm",
  "tag": "u-form",
  "formModel": "formData",
  "size": "medium",
  "labelPosition": "right",
  "labelWidth": 100,
  "formRules": "rules",
  "gutter": 15,
  "disabled": false,
  "span": 24,
  "formBtns": true,
  "fields": [
    {
      "type": "default",
      "gutter": 15,
      "justify": "start",
      "align": "top",
      "tag": "u-row",
      "span": 24,
      "layout": "rowFormItem",
      "tagIcon": "row",
      "layoutTree": true,
      "document": "/component/layout",
      "formId": "103",
      "renderKey": "1779857445435",
      "componentName": "row103",
      "children": [
        {
          "label": "商品名称",
          "tag": "u-input",
          "tagIcon": "input",
          "span": 24,
          "labelWidth": null,
          "style": { "width": "100%" },
          "required": false,
          "regList": [],
          "changeTag": true,
          "document": "/component/input",
          "formId": "101",
          "renderKey": "1779857427872",
          "layout": "colFormItem",
          "placeholder": "请输入单行文本",
          "clearable": true,
          "disabled": false,
          "readonly": false,
          "maxlength": null,
          "showWordLimit": false,
          "prepend": null,
          "append": null,
          "prefixIcon": null,
          "suffixIcon": null,
          "defaultValue": null,
          "type": null,
          "vModel": "product_name"
        }
      ]
    },
    {
      "type": "default",
      "gutter": 15,
      "justify": "start",
      "align": "top",
      "tag": "u-row",
      "span": 24,
      "layout": "rowFormItem",
      "tagIcon": "row",
      "layoutTree": true,
      "document": "/component/layout",
      "formId": "107",
      "renderKey": "1779857495463",
      "componentName": "row107",
      "children": [
        {
          "label": "商品类型",
          "tag": "u-select",
          "tagIcon": "select",
          "span": 24,
          "labelWidth": null,
          "style": { "width": "100%" },
          "required": false,
          "regList": [],
          "changeTag": true,
          "document": "/component/select",
          "formId": "108",
          "renderKey": "1779857497757",
          "layout": "colFormItem",
          "multiple": false,
          "clearable": true,
          "filterable": false,
          "placeholder": "请选择下拉选择",
          "disabled": false,
          "options": [
            { "label": "电子产品", "value": "电子产品" },
            { "label": "服装", "value": "服装" },
            { "label": "图书", "value": "图书" }
          ],
          "defaultValue": null,
          "type": null,
          "vModel": "category_name"
        }
      ]
    },
    {
      "type": "default",
      "gutter": 15,
      "justify": "start",
      "align": "top",
      "tag": "u-row",
      "span": 24,
      "layout": "rowFormItem",
      "tagIcon": "row",
      "layoutTree": true,
      "document": "/component/layout",
      "formId": "101",
      "renderKey": "1780321898366",
      "componentName": "row101",
      "children": [
        {
          "label": "单选框组",
          "tag": "u-radio-group",
          "tagIcon": "radio",
          "span": 12,
          "labelWidth": "100",
          "style": {},
          "required": true,
          "regList": [],
          "changeTag": true,
          "document": "/component/radio",
          "formId": "103",
          "renderKey": "1780321908160",
          "layout": "colFormItem",
          "options": [
            { "label": "选项一", "value": "1" },
            { "label": "选项二", "value": "2" }
          ],
          "disabled": false,
          "optionType": "default",
          "border": true,
          "size": "medium",
          "defaultValue": "false",
          "type": null,
          "vModel": "field103"
        },
        {
          "label": "开关",
          "tag": "u-switch",
          "tagIcon": "switch",
          "span": 12,
          "labelWidth": null,
          "style": {},
          "required": true,
          "regList": [],
          "changeTag": true,
          "document": "/component/switch",
          "formId": "104",
          "renderKey": "1780321915251",
          "layout": "colFormItem",
          "activeColor": null,
          "inactiveColor": null,
          "disabled": false,
          "activeValue": true,
          "inactiveValue": false,
          "defaultValue": false,
          "type": null,
          "vModel": "field104"
        }
      ]
    },
    {
      "type": "default",
      "gutter": 15,
      "justify": "start",
      "align": "top",
      "tag": "u-row",
      "span": 24,
      "layout": "rowFormItem",
      "tagIcon": "row",
      "layoutTree": true,
      "document": "/component/layout",
      "formId": "105",
      "renderKey": "1780321962213",
      "componentName": "row105",
      "children": [
        {
          "label": "多选框组",
          "tag": "u-checkbox-group",
          "tagIcon": "checkbox",
          "span": 12,
          "labelWidth": null,
          "style": {},
          "required": true,
          "regList": [],
          "changeTag": true,
          "document": "/component/checkbox",
          "formId": "107",
          "renderKey": "1780321988390",
          "layout": "colFormItem",
          "options": [
            { "label": "选项一", "value": "1" },
            { "label": "选项二", "value": "2" }
          ],
          "disabled": false,
          "optionType": "default",
          "border": false,
          "size": "medium",
          "defaultValue": [],
          "type": null,
          "vModel": "field107"
        },
        {
          "label": "计数器",
          "tag": "u-input-number",
          "tagIcon": "number",
          "span": 12,
          "labelWidth": null,
          "style": null,
          "required": true,
          "regList": [],
          "changeTag": true,
          "document": "/component/input-number",
          "formId": "106",
          "renderKey": "1780321968629",
          "layout": "colFormItem",
          "stepStrictly": false,
          "controlsPosition": null,
          "disabled": false,
          "defaultValue": "10",
          "type": null,
          "vModel": "field106"
        }
      ]
    },
    {
      "type": "default",
      "gutter": 15,
      "justify": "start",
      "align": "top",
      "tag": "u-row",
      "span": 24,
      "layout": "rowFormItem",
      "tagIcon": "row",
      "layoutTree": true,
      "document": "/component/layout",
      "formId": "108",
      "renderKey": "1780322001047",
      "componentName": "row108",
      "children": [
        {
          "label": "日期选择",
          "tag": "u-date-picker",
          "tagIcon": "date",
          "span": 24,
          "labelWidth": null,
          "style": { "width": "100%" },
          "required": true,
          "regList": [],
          "changeTag": true,
          "document": "/component/date-picker",
          "formId": "109",
          "renderKey": "1780322005464",
          "layout": "colFormItem",
          "format": "YYYY-MM-DD",
          "type": "date",
          "placeholder": "请选择日期选择",
          "clearable": true,
          "disabled": false,
          "readonly": false,
          "valueFormat": "format",
          "defaultValue": null,
          "vModel": "field109"
        }
      ]
    }
  ]
}
```

---

## 五、工具调用

| 操作 | 工具名称 | 说明 |
|------|---------|------|
| 读取 | `get_search_form` | 获取报表的查询表单设计数据，包含表单字段定义、布局等信息 |
| 创建/修改 | `set_search_form` | 传入 searchForm 对象整体替换查询表单设计数据，会覆盖现有配置 |
| 保存报表 | `save_report` | 保存当前报表到服务器 |
