# 二维码单元格说明（ZxingValue Cell - QRCode）

## 一、职能

二维码单元格用于在报表中生成二维码图片。单元格的 `value.type` 为 `"zxing"` 且 `value.category` 为 `"qrcode"` 时即为二维码单元格，支持两种数据来源：静态文本（`source` 为 `"text"`）和表达式（`source` 为 `"expression"`）。静态文本模式下 `value.value` 存储要编码的文本字符串；表达式模式下 `value.value` 存储一段 JavaScript 表达式，运行时动态计算编码内容。可配置二维码的宽高（`width`/`height`），单位为像素。

---

## 二、关键约束提示

> **重要提示**：数据模型、约束规则已迁移至 `data-schemas.ts`，通过工具自动校验。
> 生成单元格数据前，请先调用【get_cell_template】工具，传入 type='qrcode' 获取符合规范的完整模板。

| 约束项 | 要求 |
|--------|------|
| value.type | 固定为 `"zxing"` |
| value.category | 固定为 `"qrcode"` |
| value.format | 固定为 `"QR_CODE"` |
| value.source | `"text"`（静态文本）或 `"expression"`（表达式） |
| value.value | 编码文本或表达式文本 |
| value.width | 最小值 1，默认 100 |
| value.height | 最小值 1，默认 100 |
| value.codeDisplay | true/false，是否显示编码文本 |

> 仅表达式模式（`source` 为 `"expression"`）支持展开方向设置。
