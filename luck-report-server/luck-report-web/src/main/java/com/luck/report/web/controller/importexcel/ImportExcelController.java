package com.luck.report.web.controller.importexcel;

import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.exception.ReportException;
import com.luck.report.web.cache.TempObjectCache;
import com.luck.report.web.filter.RequestHolderFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Excel导入控制器
 * 替代原有的ImportExcelServletAction，负责导入Excel文件并解析为报表定义
 */
@RestController("bean.importExcelController")
@RequestMapping("${luck-report.servletPrefix}/import")
public class ImportExcelController {

    private static final Logger logger = LoggerFactory.getLogger(RequestHolderFilter.class);

    private final List<ExcelParser> excelParsers = new ArrayList<>();

    public ImportExcelController() {
        excelParsers.add(new HSSFExcelParser());
        excelParsers.add(new XSSFExcelParser());
    }

    /**
     * 导入Excel文件并解析为报表定义
     */
    @RequestMapping({"", "/"})
    public Map<String, Object> importExcel(@RequestParam("_excel_file") MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        ReportDefinition report = null;

        try {
            String fileName = file.getOriginalFilename();
            if (fileName != null && (fileName.toLowerCase().endsWith(".xls") || fileName.toLowerCase().endsWith(".xlsx"))) {
                InputStream inputStream = file.getInputStream();
                for (ExcelParser parser : excelParsers) {
                    if (parser.support(fileName)) {
                        report = parser.parse(inputStream);
                        break;
                    }
                }
                inputStream.close();
            } else {
                throw new ReportException("请选择一个合法的Excel导入");
            }
        } catch (Exception e) {
            logger.error("Import Excel Error: {}", e);
            throw new ReportException(e.getMessage());
        }

        if (report != null) {
            result.put("result", true);
            TempObjectCache.putObject("classpath:template/template.ureport.xml", report);
        } else {
            throw new ReportException("Excel文件解析失败，请检查文件格式是否正确");
        }

        return result;
    }
}
