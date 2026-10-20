package com.luck.report.core.export.excel;

import com.luck.report.core.definition.Border;
import com.luck.report.core.definition.BorderStyle;

/**
 * 将报表边框映射为 POI BorderStyle；Excel 无像素线宽，仅按 width 分档为细/中/粗
 *
 * @author luck
 */
public final class ExcelBorderStyles {

    private ExcelBorderStyles() {
    }

    /**
     * 报表边框 → POI 线型；solid/dashed 按 width（1=细、2=中、大于2=粗），doublesolid 为 DOUBLE
     *
     * @param border 报表边框，可为 null
     * @return POI 边框样式；无法识别时返回 null
     */
    public static org.apache.poi.ss.usermodel.BorderStyle toPoi(Border border) {
        if (border == null || border.getStyle() == null) {
            return null;
        }
        BorderStyle style = border.getStyle();
        int width = border.getWidth();
        if (style.equals(BorderStyle.solid)) {
            if (width == 1) {
                return org.apache.poi.ss.usermodel.BorderStyle.THIN;
            }
            if (width == 2) {
                return org.apache.poi.ss.usermodel.BorderStyle.MEDIUM;
            }
            if (width > 2) {
                return org.apache.poi.ss.usermodel.BorderStyle.THICK;
            }
            return org.apache.poi.ss.usermodel.BorderStyle.NONE;
        }
        if (style.equals(BorderStyle.dashed)) {
            if (width == 1) {
                return org.apache.poi.ss.usermodel.BorderStyle.DASH_DOT;
            }
            if (width == 2) {
                return org.apache.poi.ss.usermodel.BorderStyle.MEDIUM_DASH_DOT;
            }
            if (width > 2) {
                return org.apache.poi.ss.usermodel.BorderStyle.MEDIUM_DASH_DOT_DOT;
            }
            return org.apache.poi.ss.usermodel.BorderStyle.NONE;
        }
        if (style.equals(BorderStyle.doublesolid)) {
            return org.apache.poi.ss.usermodel.BorderStyle.DOUBLE;
        }
        return null;
    }
}
