package com.luck.report.web.controller.importexcel;

import com.luck.report.core.excel.ExcelParseConfig;
import com.luck.report.core.utils.ExcelToJsonUtil;
import com.luck.report.web.controller.base.BaseController;
import com.luck.report.web.service.ImportExcelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * Excel导入控制器，仅负责HTTP请求/响应转换，业务逻辑委托给ImportExcelService
 */
@RestController("bean.importExcelController")
@RequestMapping("${luck-report.servletPrefix:}/import")
public class ImportExcelController extends BaseController {

    @Autowired
    @Qualifier("bean.importExcelService")
    private ImportExcelService importExcelService;

    /**
     * 导入Excel文件并解析为报表定义
     */
    @RequestMapping({"", "/"})
    public Map<String, Object> importExcel(@RequestParam("_excel_file") MultipartFile file) {
        return importExcelService.importExcel(file);
    }


    /**
     * 上传Excel并按配置参数解析为JSON
     *
     * @param file              Excel文件
     * @param headerRowIndex    字段名行号(从0开始)
     * @param firstDataRowIndex 第一个数据行号(可选)
     * @param lastDataRowIndex  最后一个数据行号(可选)
     * @param dateOrder         日期排序: DMY / YMD / MDY
     * @param dateSeparator     日期分隔符
     * @param timeSeparator     时间分隔符
     * @param decimalSymbol     小数点符号
     * @param dateTimeOrder     日期时间排序: DT / TD
     * @param outputDateFormat  输出JSON中的日期格式(可选)
     */
    @PostMapping("/parseToJson")
    public void parseExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "headerRowIndex", defaultValue = "0") int headerRowIndex,
            @RequestParam(value = "firstDataRowIndex", required = false) Integer firstDataRowIndex,
            @RequestParam(value = "lastDataRowIndex", required = false) Integer lastDataRowIndex,
            @RequestParam(value = "dateOrder", defaultValue = "YMD") ExcelParseConfig.DateOrder dateOrder,
            @RequestParam(value = "dateSeparator", defaultValue = "/") String dateSeparator,
            @RequestParam(value = "timeSeparator", defaultValue = ":") String timeSeparator,
            @RequestParam(value = "decimalSymbol", defaultValue = ".") String decimalSymbol,
            @RequestParam(value = "dateTimeOrder", defaultValue = "DT") ExcelParseConfig.DateTimeOrder dateTimeOrder,
            @RequestParam(value = "outputDateFormat", defaultValue = "yyyy-MM-dd HH:mm:ss") String outputDateFormat
    ) {

        // 1. 基础校验
        if (file == null || file.isEmpty()) throw new RuntimeException("上传文件不能为空");
        String fileName = file.getOriginalFilename();
        if (fileName == null || (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")))
            throw new RuntimeException("仅支持 .xlsx 或 .xls 格式的Excel文件");

        // 2. 构建解析配置
        ExcelParseConfig config = ExcelParseConfig.builder()
                .headerRowIndex(headerRowIndex)
                .firstDataRowIndex(firstDataRowIndex)
                .lastDataRowIndex(lastDataRowIndex)
                .dateOrder(dateOrder)
                .dateSeparator(dateSeparator)
                .timeSeparator(timeSeparator)
                .decimalSymbol(decimalSymbol)
                .dateTimeOrder(dateTimeOrder)
                .outputDateFormat(outputDateFormat)
                .build();

        // 3. 解析并返回
        try (InputStream inputStream = file.getInputStream()) {
            String json = ExcelToJsonUtil.parseToJson(inputStream, config);
            resp.writeObjectToJson(json);
        } catch (IllegalStateException e) {
            throw new RuntimeException("Excel格式错误: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("解析失败: " + e.getMessage());
        }
    }


    /**
     * 获取Excel文件的Sheet列表
     */
    @PostMapping("/getExcelSheet")
    public void getExcelSheet(MultipartFile file) {
        try {
            List<Map<String, Object>> sheetSummaryList = ExcelToJsonUtil.getSheetSummaryList(file.getInputStream());
            resp.writeObjectToJson(sheetSummaryList);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
