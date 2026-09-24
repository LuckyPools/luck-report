package com.luck.report.core.utils;

import java.math.BigDecimal;

/** 文本出口数字展示，避免 Double.toString 科学计数法。 */
public final class NumberUtils {

    private NumberUtils() {
    }

    /**
     * 将数值格式化为不带科学计数法的纯文本
     *
     * @param value 任意对象；数字走 toPlainString，其它走 toString
     * @return 展示文本；value 为 null 时返回 null
     */
    public static String toPlainString(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            BigDecimal bd;
            if (value instanceof BigDecimal) {
                bd = (BigDecimal) value;
            } else if (value instanceof Double || value instanceof Float) {
                bd = BigDecimal.valueOf(((Number) value).doubleValue());
            } else {
                return value.toString();
            }
            return bd.stripTrailingZeros().toPlainString();
        }
        return value.toString();
    }
}
