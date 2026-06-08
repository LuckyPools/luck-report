# 单元格通用属性说明（cell）

## 一、职能
报表由一个个单元格组成，每个单元格通过 `cell` 定义其位置、数据值、样式、展开方式、父子格关系等属性。后台渲染报表时，根据单元格的展开方向和父子格关系进行数据填充和单元格复制，最终生成完整的报表。

---

## 二、数据操作步骤

> **重要提示**：数据模型、约束规则、参考数据已迁移至 `data-schemas.ts`，通过工具自动校验。
> 生成单元格数据前，请先调用【get_cell_template】工具获取符合规范的完整模板。

### (一) 读取单元格步骤
1. 确认单元格坐标，坐标由行坐标 rowIndex 和列坐标 colIndex 构成，从0开始
2. 传入 rowIndex、colIndex 作为参数调用【read_cell】工具获取单元格数据
3. read_cell 返回的单元格数据中 rowNumber/columnNumber 从1开始，name 格式为列字母+行号（如 A1），与 rowIndex/colIndex 的换算关系：rowIndex = rowNumber - 1，colIndex = columnNumber - 1

### (二) 修改单元格步骤
1. 确认单元格坐标（rowIndex、colIndex，从0开始）
2. 传入 rowIndex、colIndex 调用【read_cell】工具获取当前单元格完整数据
3. 如果单元格数据不存在说明报表行列数不足，需要先补齐行或列。查阅 TABLE_ROW 或 TABLE_COL 文档，补齐行列后重新开始修改单元格
4. **调用【get_cell_template】工具获取目标类型的单元格模板**，基于模板修改需要的字段
5. 修改后的数据必须符合数据模型约束，表达式要调用【validate_expression】工具做校验
6. 传入 rowIndex、colIndex、修改后的完整单元格定义对象（cell）调用【write_cell】工具写入。cell 参数必须是JSON对象，禁止传JSON字符串。write_cell 会自动备份原数据，返回 1 表示成功、0 表示失败
7. 若 write_cell 返回 0，可重试

### (三) 清空单元格步骤
1. 确认要清空的区域范围（startRow、endRow、startCol、endCol，从0开始）
2. 根据清空需求选择对应工具：
   - 仅清空内容（保留样式）→ 调用【clear_cell_content】
   - 仅清空样式（保留内容）→ 调用【clear_cell_style】
   - 全部清空（内容+样式）→ 调用【clear_cell_all】

---

## 三、关键约束提示

以下约束在工具校验时会自动检查，请务必遵守：

| 约束项 | 要求 |
|--------|------|
| value.type | 必须是 simple/expression/dataset/image/chart/slash/zxing 之一 |
| expand | 必须是 None/Down/Right 之一 |
| cellStyle.align | 必须是 left/center/right 之一 |
| cellStyle.valign | 必须是 top/middle/bottom 之一 |
| 颜色格式 | RGB 格式 "R,G,B"，如 "255,0,0" |
| dataset类型单元格 | 必须包含 datasetName、aggregate、property |
| aggregate | 必须是 group/select/sum/count/max/min/avg/customgroup 之一 |

> 数据校验失败时，系统会返回错误信息，请根据提示修正数据后重试。
