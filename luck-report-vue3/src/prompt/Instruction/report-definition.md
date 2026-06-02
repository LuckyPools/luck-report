# 报表说明（ReportDefinition）

## 一、概述

报表（Report）是 Luck-Report 的核心数据结构，用于定义一份完整的报表模板。报表由单元格网格、数据源、纸张设置、页眉页脚、查询表单等元素组成，每个单元格可配置不同类型的数据值，后台根据单元格的展开方向和父子格关系对数据进行迭代渲染，最终生成动态表格。

---

## 二、报表构成要素

| 要素 | 字段名 | 类型 | 说明 |
|------|--------|------|------|
| 纸张设置 | paper | Paper | 定义报表页面尺寸、边距、方向、分页模式等，详见《报表配置说明》 |
| 页眉 | header | HeaderFooterDefinition | 报表每页顶部显示的内容，支持左/中/右三区域及表达式 |
| 页脚 | footer | HeaderFooterDefinition | 报表每页底部显示的内容，支持左/中/右三区域及表达式 |
| 查询表单 | searchForm | SearchForm | 预览时渲染为查询条件表单，用于数据集参数筛选，详见《表单设计说明》 |
| 数据源列表 | datasources | List\<DatasourceDefinition\> | 报表引用的数据源集合，每个数据源下包含数据集，详见《数据源数据集说明》 |
| 行定义列表 | rows | List\<RowDefinition\> | 报表所有行的定义，包含行号、行高、行类型（Band） |
| 列定义列表 | columns | List\<ColumnDefinition\> | 报表所有列的定义，包含列号、列宽、是否隐藏 |
| 单元格列表 | cells | List\<CellDefinition\> | 报表所有单元格的定义，是报表的核心数据，详见《单元格通用属性说明》 |

---

## 三、单元格核心概念

### 1、单元格网格

报表以二维网格形式组织，每个单元格通过 `rowNumber`（行号）和 `columnNumber`（列号）定位，单元格名称格式为列字母+行号，如 `A1`、`B3`。单元格支持合并（`rowSpan`/`colSpan`）。

### 2、单元格值类型（ValueType）

每个单元格的 `value.type` 决定了该单元格的数据来源和渲染方式：

| 枚举值 | 说明 |
|--------|------|
| simple | 普通文本，直接显示静态文本内容 |
| expression | 表达式，通过表达式动态计算值 |
| dataset | 数据集，绑定数据集字段，根据聚合方式取值 |
| image | 图片，显示指定图片 |
| chart | 图表，在单元格中渲染 ECharts 图表 |
| slash | 斜表头，用于绘制交叉表头 |
| zxing | 二维码/条码，根据 category 区分 qrcode 或 barcode |

### 3、单元格展开方向（Expand）

当单元格绑定数据集字段且数据有多条时，通过展开方向控制单元格如何扩展：

| 枚举值 | 说明 |
|--------|------|
| Down | 向下展开，数据多行时单元格向下复制扩展 |
| Right | 向右展开，数据多列时单元格向右复制扩展 |
| None | 不展开，仅显示第一条数据 |

### 4、父子格关系

单元格之间存在依赖关系，通过左父格（`leftParentCellName`）和上父格（`topParentCellName`）定义。父格展开时会带动子格一起展开，这是报表动态渲染的核心机制，详见《父子格关系说明》。

---

## 四、报表渲染逻辑

报表渲染由后端 `ReportBuilder.buildReport()` 方法驱动，流程如下：

1. **构建数据集**：根据 `datasources` 配置查询所有数据集数据
2. **构建父子格关系**：遍历 `cells`，根据 `leftParentCellName`/`topParentCellName` 建立父子格引用链
3. **确定根单元格**：没有左父格和上父格的单元格为根单元格（`rootCell`）
4. **从父格到子格迭代渲染**：从根单元格开始，按父子格依赖顺序逐层渲染；只有当单元格的左父格和上父格都已处理完毕，该单元格才会被处理
5. **填充空白行**：对设置了 `fillBlankRows` 的单元格补充空白行
6. **延迟计算**：处理需要延迟计算的单元格
7. **分页**：根据纸张设置进行分页计算

---

## 五、数据模型

### ReportDefinition 顶层属性

| 字段名 | 类型 | 说明 |
|--------|------|------|
| reportFullName | String | 报表全名 |
| paper | Paper | 纸张设置 |
| header | HeaderFooterDefinition | 页眉 |
| footer | HeaderFooterDefinition | 页脚 |
| searchForm | SearchForm | 查询表单 |
| cells | List\<CellDefinition\> | 单元格列表 |
| rows | List\<RowDefinition\> | 行定义列表 |
| columns | List\<ColumnDefinition\> | 列定义列表 |
| datasources | List\<DatasourceDefinition\> | 数据源列表 |

### RowDefinition 属性

| 字段名 | 类型 | 说明 | 可选值 |
|--------|------|------|--------|
| rowNumber | int | 行号 | 从 1 开始 |
| height | int | 行高（pt） | 正整数 |
| band | Band | 行类型 | `headerrepeat`（重复表头行）/ `footerrepeat`（重复表尾行）/ `title`（标题行）/ `summary`（总结行）/ `null`（普通行） |

### ColumnDefinition 属性

| 字段名 | 类型 | 说明 |
|--------|------|------|
| columnNumber | int | 列号，从 1 开始 |
| width | int | 列宽（pt） |
| hide | boolean | 是否隐藏 |
