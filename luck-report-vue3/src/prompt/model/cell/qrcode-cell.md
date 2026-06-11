# 二维码单元格说明

## 一、概念说明
二维码单元格用于在报表中生成二维码图片。单元格的 `value.type` 为 `"zxing"` 且 `value.category` 为 `"qrcode"` 时即为二维码单元格，支持两种数据来源：静态文本和表达式。

## 二、关键规则
1. **固定配置**：type 为 `"zxing"`，category 为 `"qrcode"`，format 为 `"QR_CODE"`。
2. **仅表达式模式支持展开**：`source` 为 `"expression"` 时可设置展开方向。

## 三、数据约束
数据约束由 data-schemas.ts 自动校验。主要约束：
- value.type 固定为 `"zxing"`
- value.category 固定为 `"qrcode"`
- value.format 固定为 `"QR_CODE"`
- value.source 为 `"text"` 或 `"expression"`
- value.width/height 最小值为 1，默认 100
