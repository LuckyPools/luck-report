package com.luck.report.core.excel;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExcelParseConfig {
    /**
     * 字段名(列名)所在行号，从0开始，默认0
     */
    @Builder.Default
    private int headerRowIndex = 0;

    /**
     * 第一个数据行号，从0开始，默认=headerRowIndex+1
     */
    private Integer firstDataRowIndex;

    /**
     * 最后一个数据行号(含)，从0开始，null表示到Sheet末尾
     */
    private Integer lastDataRowIndex;

    /**
     * 日期排序：DMY(日/月/年), YMD(年/月/日), MDY(月/日/年)
     */
    @Builder.Default
    private DateOrder dateOrder = DateOrder.YMD;

    /**
     * 日期分隔符，默认 "/"
     */
    @Builder.Default
    private String dateSeparator = "/";

    /**
     * 时间分隔符，默认 ":"
     */
    @Builder.Default
    private String timeSeparator = ":";

    /**
     * 小数点符号，默认 "." ，部分地区为 ","
     */
    @Builder.Default
    private String decimalSymbol = ".";

    /**
     * 日期时间组合排序：DT(日期在前), TD(时间在前)
     */
    @Builder.Default
    private DateTimeOrder dateTimeOrder = DateTimeOrder.DT;

    /**
     * 输出到JSON时的标准日期格式，默认 "yyyy-MM-dd HH:mm:ss"
     */
    @Builder.Default
    private String outputDateFormat = "yyyy-MM-dd HH:mm:ss";

    public int getActualFirstDataRow() {
        return firstDataRowIndex != null ? firstDataRowIndex : headerRowIndex + 1;
    }

    public enum DateOrder {DMY, YMD, MDY}

    public enum DateTimeOrder {DT, TD}
}