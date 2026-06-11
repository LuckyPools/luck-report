# 单元格通用属性说明

## 一、概念说明

报表由一个个单元格组成，每个单元格通过 `cell` 定义其位置、数据值、样式、展开方式、父子格关系等属性。后台渲染报表时，根据单元格的展开方向和父子格关系进行数据填充和单元格复制，最终生成完整的报表。

## 二、关键规则

1. **修改单元格必须先读取**：调用 read_cells 获取当前数据，基于读取结果修改后写入。
2. **禁止凭空构造单元格对象**：必须基于读取返回的数据或 get_cell_template 返回的模板修改。
3. **表达式必须校验**：修改表达式后调用 validate_expression 校验，条件属性调用 validate_condition 校验。
4. **链接地址 `linkUrl` 支持表达式**：表达式用 `${...}` 包裹，用于与普通 URL 文本区分。有计算需求时参照 EXPRESSION 表达式文档。

## 三、操作流程

操作流程由工作流自动控制，数据校验由工具自动执行。助手只需按工作流步骤执行即可。

## 四、数据约束

数据约束由 data-schemas.ts 自动校验，校验失败会返回错误信息。主要约束：
- value.type 必须是 simple/expression/dataset/image/chart/slash/zxing 之一
- expand 必须是 None/Down/Right 之一
- cellStyle.align 必须是 left/center/right 之一
- 颜色格式必须是 RGB 格式 "R,G,B"，如 "255,0,0"
- dataset 类型单元格必须包含 datasetName、aggregate、property
- 只有数据集类型单元格和表达式类型单元格才有条件属性`conditionPropertyItems`，其它类型单元格一律不允许有条件属性
