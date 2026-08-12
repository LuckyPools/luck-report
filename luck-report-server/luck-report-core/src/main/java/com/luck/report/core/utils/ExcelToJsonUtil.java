package com.luck.report.core.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.luck.report.core.excel.ExcelParseConfig;
import org.apache.poi.ss.usermodel.*;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

public class ExcelToJsonUtil {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /**
     * 解析 Excel 为 JSON 字符串
     */
    public static String parseToJson(InputStream inputStream, ExcelParseConfig config) throws Exception {
        List<Map<String, Object>> dataList = ExcelToJsonUtil.parseToList(inputStream, config);
        return ExcelToJsonUtil.MAPPER.writeValueAsString(dataList);
    }

    /**
     * 解析 Excel 为 List<Map> (方便在序列化前进行二次加工)
     */
    public static List<Map<String, Object>> parseToList(InputStream inputStream, ExcelParseConfig config) throws Exception {
        Objects.requireNonNull(inputStream, "InputStream不能为空");
        if (config == null) config = ExcelParseConfig.builder().build();

        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = ExcelToJsonUtil.resolveSheet(workbook, config);

            // 1. 读取列名 (Key)
            Row headerRow = sheet.getRow(config.getHeaderRowIndex());
            if (headerRow == null) throw new IllegalStateException("找不到字段名行: " + config.getHeaderRowIndex());

            List<String> headers = new ArrayList<>();
            for (int c = 0; c < headerRow.getLastCellNum(); c++) {
                Cell cell = headerRow.getCell(c);
                headers.add(ExcelToJsonUtil.getCellStringValue(cell));
            }

            // 2. 确定数据行范围
            int firstData = config.getActualFirstDataRow();
            int lastData = config.getLastDataRowIndex() != null
                    ? Math.min(config.getLastDataRowIndex(), sheet.getLastRowNum())
                    : sheet.getLastRowNum();

            // 3. 构建解析用的格式化器
            DateTimeFormatter inputDateTimeFmt = ExcelToJsonUtil.buildDateTimeFormatter(config);
            DateTimeFormatter outputDateFmt = DateTimeFormatter.ofPattern(config.getOutputDateFormat());

            // 4. 遍历数据行
            List<Map<String, Object>> result = new ArrayList<>();
            for (int i = firstData; i <= lastData; i++) {
                Row row = sheet.getRow(i);
                if (row == null || ExcelToJsonUtil.isEmptyRow(row)) continue;

                Map<String, Object> rowData = new LinkedHashMap<>();
                boolean hasData = false;

                for (int c = 0; c < headers.size(); c++) {
                    String key = headers.get(c);
                    if (key == null || key.trim().isEmpty()) continue; // 跳过空列名

                    Cell cell = row.getCell(c);
                    Object value = ExcelToJsonUtil.extractCellValue(cell, config, inputDateTimeFmt, outputDateFmt);

                    rowData.put(key, value);
                    if (value != null) hasData = true;
                }

                if (hasData) result.add(rowData);
            }
            return result;
        }
    }

    /**
     * 根据配置解析目标Sheet
     * 优先级: sheetIndex > sheetName > 默认第一个Sheet
     */
    private static Sheet resolveSheet(Workbook workbook, ExcelParseConfig config) {
        // 1. 优先按索引获取
        if (config.getSheetIndex() != null) {
            int idx = config.getSheetIndex();
            if (idx < 0 || idx >= workbook.getNumberOfSheets()) throw new IllegalArgumentException(
                    String.format("Sheet索引越界: %d, 有效范围: 0~%d", idx, workbook.getNumberOfSheets() - 1));
            return workbook.getSheetAt(idx);
        }

        // 2. 按名称获取
        if (config.getSheetName() != null && !config.getSheetName().trim().isEmpty()) {
            Sheet sheet = workbook.getSheet(config.getSheetName().trim());
            if (sheet == null) throw new IllegalArgumentException("找不到指定Sheet: " + config.getSheetName());
            return sheet;
        }

        // 3. 默认返回第一个Sheet（向后兼容）
        if (workbook.getNumberOfSheets() == 0) throw new IllegalStateException("Excel文件中没有任何Sheet");
        return workbook.getSheetAt(0);
    }

    // ==================== 核心取值与类型推断 ====================

    private static Object extractCellValue(Cell cell, ExcelParseConfig config,
                                           DateTimeFormatter inputFmt, DateTimeFormatter outputFmt) {
        if (cell == null) return null;

        // 处理公式单元格，获取其计算结果类型
        CellType cellType = cell.getCellType();
        if (cellType == CellType.FORMULA) cellType = cell.getCachedFormulaResultType();

        switch (cellType) {
            case NUMERIC:
                // POI识别为日期，直接转为标准输出格式
                if (DateUtil.isCellDateFormatted(cell)) return cell.getLocalDateTimeCellValue().format(outputFmt);
                double numVal = cell.getNumericCellValue();
                // 判断是整数还是小数
                if (numVal == Math.floor(numVal) && !Double.isInfinite(numVal)) return (long) numVal;
                return BigDecimal.valueOf(numVal);

            case STRING:
                String strVal = cell.getStringCellValue().trim();
                if (strVal.isEmpty()) return null;

                // 尝试处理自定义小数点符号 (如 "1.234,56" -> "1234.56")
                String normalizedStr = strVal;
                if (!".".equals(config.getDecimalSymbol()))
                    normalizedStr = strVal.replace(config.getDecimalSymbol(), ".");
                // 移除千分位逗号（如果小数点是逗号，千分位通常是点，这里做简单兼容处理）
                if (",".equals(config.getDecimalSymbol()))
                    normalizedStr = normalizedStr.replace(".", "").replace(",", ".");

                // 尝试转为数字
                try {
                    if (normalizedStr.contains(".")) return new BigDecimal(normalizedStr);
                    else return Long.parseLong(normalizedStr);
                } catch (NumberFormatException ignored) {
                }

                // 尝试按配置的日期时间格式解析
                try {
                    LocalDateTime ldt = LocalDateTime.parse(strVal, inputFmt);
                    return ldt.format(outputFmt);
                } catch (DateTimeParseException ignored) {
                }

                // 纯字符串
                return strVal;

            case BOOLEAN:
                return cell.getBooleanCellValue();

            case BLANK:
                return null;

            default:
                return cell.toString();
        }
    }

    // ==================== 格式化器构建 ====================

    private static DateTimeFormatter buildDateTimeFormatter(ExcelParseConfig config) {
        String dSep = config.getDateSeparator();
        String tSep = config.getTimeSeparator();

        String datePart;
        switch (config.getDateOrder()) {
            case DMY:
                datePart = "dd" + dSep + "MM" + dSep + "yyyy";
                break;
            case MDY:
                datePart = "MM" + dSep + "dd" + dSep + "yyyy";
                break;
            case YMD:
            default:
                datePart = "yyyy" + dSep + "MM" + dSep + "dd";
                break;
        }
        String timePart = "HH" + tSep + "mm" + tSep + "ss";

        String pattern;
        switch (config.getDateTimeOrder()) {
            case TD:
                pattern = timePart + " " + datePart;
                break;
            case DT:
            default:
                pattern = datePart + " " + timePart;
                break;
        }
        return DateTimeFormatter.ofPattern(pattern).withLocale(Locale.ROOT);
    }

    // ==================== 辅助方法 ====================

    private static String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.NUMERIC) {
            // 防止标题行出现 ".0" 后缀
            double val = cell.getNumericCellValue();
            if (val == Math.floor(val)) return String.valueOf((long) val);
        }
        return cell.toString().trim();
    }

    private static boolean isEmptyRow(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) if (cell.getCellType() == CellType.STRING) {
                if (!cell.getStringCellValue().trim().isEmpty()) return false;
            } else return false;
        }
        return true;
    }


    /**
     * 获取 Excel 文件中所有 Sheet 的名称列表
     *
     * @param inputStream Excel 文件输入流
     * @return Sheet 名称列表（按顺序）
     */
    public static List<String> getSheetNames(InputStream inputStream) throws Exception {
        Objects.requireNonNull(inputStream, "InputStream不能为空");
        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            List<String> sheetNames = new ArrayList<>();
            for (int i = 0; i < workbook.getNumberOfSheets(); i++) sheetNames.add(workbook.getSheetName(i));
            return sheetNames;
        }
    }

    /**
     * 获取 Excel 文件中所有 Sheet 的摘要信息（索引 + 名称）
     * 适用于前端下拉选择等需要同时展示名称和对应索引的场景
     *
     * @param inputStream Excel 文件输入流
     * @return Sheet 摘要信息列表
     */
    public static List<Map<String, Object>> getSheetSummaryList(InputStream inputStream) throws Exception {
        Objects.requireNonNull(inputStream, "InputStream不能为空");
        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            List<Map<String, Object>> summaryList = new ArrayList<>();
            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                Map<String, Object> sheetInfo = new LinkedHashMap<>();
                sheetInfo.put("index", i);
                sheetInfo.put("name", workbook.getSheetName(i));
                summaryList.add(sheetInfo);
            }
            return summaryList;
        }
    }
}