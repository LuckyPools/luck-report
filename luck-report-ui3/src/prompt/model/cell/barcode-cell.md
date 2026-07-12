# 条码单元格说明

## 一、概念说明
条码单元格用于在报表中生成条码图片。单元格对象的 `value.type` 为 `"zxing"` 且 `value.category` 为 `"barcode"` 时即为条码单元格，支持多种条码格式。

## 二、关键规则
1. **条码格式可选值**：AZTEC、CODABAR、CODE_39、CODE_93、CODE_128、DATA_MATRIX、EAN_8、EAN_13、ITF、PDF_417、UPC_A、UPC_E。
2. **不同格式有不同约束**：如 EAN_13 仅支持 13 位纯数字，CODE_128 支持全部 ASCII 字符。
3. **仅表达式模式支持展开**：`source` 为 `"expression"` 时可设置展开方向。

## 三、数据约束
数据约束由 data-schemas.ts 自动校验。主要约束：
- value.type 固定为 `"zxing"`
- value.category 固定为 `"barcode"`
- value.format 必须是有效条码格式
- value.source 为 `"text"` 或 `"expression"`
- value.width/height 最小值为 1，默认 100
