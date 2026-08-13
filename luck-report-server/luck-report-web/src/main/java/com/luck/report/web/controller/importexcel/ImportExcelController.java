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
     * 注意：行号参数(headerRowIndex/firstDataRowIndex/lastDataRowIndex)均采用从1开始的语义，
     * 与Excel中直观的"第几行"一致，内部会转换为POI所需的从0开始的索引
     *
     * @param file              Excel文件
     * @param sheetIndex        指定解析的Sheet索引(从0开始，可选)，为null时默认读取第一个Sheet
     * @param headerRowIndex    字段名行号(从1开始)，默认1，对应Excel第1行
     * @param firstDataRowIndex 第一个数据行号(从1开始，可选)，为null时自动取字段名行的下一行
     * @param lastDataRowIndex  最后一个数据行号(从1开始，可选)，为null时解析到Sheet末尾
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
            @RequestParam(value = "sheetIndex", required = false) Integer sheetIndex,
            @RequestParam(value = "headerRowIndex", defaultValue = "1") int headerRowIndex,
            @RequestParam(value = "firstDataRowIndex", required = false) Integer firstDataRowIndex,
            @RequestParam(value = "lastDataRowIndex", required = false) Integer lastDataRowIndex,
            @RequestParam(value = "dateOrder", defaultValue = "YMD") ExcelParseConfig.DateOrder dateOrder,
            @RequestParam(value = "dateSeparator", defaultValue = "/") String dateSeparator,
            @RequestParam(value = "timeSeparator", defaultValue = ":") String timeSeparator,
            @RequestParam(value = "decimalSymbol", defaultValue = ".") String decimalSymbol,
            @RequestParam(value = "dateTimeOrder", defaultValue = "DT") ExcelParseConfig.DateTimeOrder dateTimeOrder,
            @RequestParam(value = "outputDateFormat", defaultValue = "yyyy-MM-dd HH:mm:ss") String outputDateFormat
    ) {

        // 1. 基础校验：文件非空 + 格式合法
        if (file == null || file.isEmpty()) throw new RuntimeException("Upload file cannot be empty");
        String fileName = file.getOriginalFilename();
        if (fileName == null || (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")))
            throw new RuntimeException("Only .xlsx or .xls format Excel files are supported");

        // 行号边界校验：前端传入为从1开始的行号，必须 >= 1
        if (headerRowIndex < 1) throw new RuntimeException("Header row index must be >= 1");
        if (firstDataRowIndex != null && firstDataRowIndex < 1)
            throw new RuntimeException("First data row index must be >= 1");
        if (lastDataRowIndex != null && lastDataRowIndex < 1)
            throw new RuntimeException("Last data row index must be >= 1");

        // 2. 构建解析配置：将1-based行号转换为POI所需的0-based索引
        ExcelParseConfig config = ExcelParseConfig.builder()
                .sheetIndex(sheetIndex)
                .headerRowIndex(headerRowIndex - 1)
                .firstDataRowIndex(firstDataRowIndex != null ? firstDataRowIndex - 1 : null)
                .lastDataRowIndex(lastDataRowIndex != null ? lastDataRowIndex - 1 : null)
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
            throw new RuntimeException("Excel format error: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Parse failed: " + e.getMessage());
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
