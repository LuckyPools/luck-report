# 条码单元格说明（ZxingValue Cell - Barcode）

## 一、职能

条码单元格用于在报表中生成条码图片。单元格的 `value.type` 为 `"zxing"` 且 `value.category` 为 `"barcode"` 时即为条码单元格，支持两种数据来源：静态文本（`source` 为 `"text"`）和表达式（`source` 为 `"expression"`）。静态文本模式下 `value.value` 存储要编码的文本字符串；表达式模式下 `value.value` 存储一段 JavaScript 表达式，运行时动态计算编码内容。可配置条码的宽高（`width`/`height`）和编码格式（`format`）。

---

## 二、关键约束提示

> **重要提示**：数据模型、约束规则已迁移至 `data-schemas.ts`，通过工具自动校验。
> 生成单元格数据前，请先调用【get_cell_template】工具，传入 type='barcode' 获取符合规范的完整模板。

| 约束项 | 要求 |
|--------|------|
| value.type | 固定为 `"zxing"` |
| value.category | 固定为 `"barcode"` |
| value.format | 条码格式，可选值见下方 |
| value.source | `"text"`（静态文本）或 `"expression"`（表达式） |
| value.value | 编码文本或表达式文本 |
| value.width | 最小值 1，默认 100 |
| value.height | 最小值 1，默认 100 |
| value.codeDisplay | true/false，是否显示编码文本 |

> **条码格式可选值**：
> AZTEC、CODABAR、CODE_39、CODE_93、CODE_128、DATA_MATRIX、EAN_8、EAN_13、ITF、PDF_417、UPC_A、UPC_E

> **注意**：不同条码格式对编码内容有不同约束，如 EAN_13 仅支持 13 位纯数字，CODE_128 支持全部 ASCII 字符。
> 仅表达式模式（`source` 为 `"expression"`）支持展开方向设置。
