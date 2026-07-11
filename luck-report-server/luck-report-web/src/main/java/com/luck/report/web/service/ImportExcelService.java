package com.luck.report.web.service;

import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.definition.ReportDefinitionWrapper;
import com.luck.report.core.exception.ReportException;
import com.luck.report.web.cache.ReportScopedCache;
import com.luck.report.web.controller.importexcel.ExcelParser;
import com.luck.report.web.controller.importexcel.HSSFExcelParser;
import com.luck.report.web.controller.importexcel.XSSFExcelParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Excel导入服务，负责解析上传的Excel文件并写入报表定义缓存
 */
@Service("bean.importExcelService")
public class ImportExcelService {

    private static final Logger logger = LoggerFactory.getLogger(ImportExcelService.class);

    private final List<ExcelParser> excelParsers = new ArrayList<>();

    public ImportExcelService() {
        excelParsers.add(new HSSFExcelParser());
        excelParsers.add(new XSSFExcelParser());
    }

    /**
     * 导入Excel文件并解析为报表定义
     *
     * @param file 上传的Excel文件
     * @return 导入结果，含result=true表示成功
     * @throws ReportException 文件格式非法或解析失败
     */
    public Map<String, Object> importExcel(MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        ReportDefinition reportDefinition = null;

        try {
            String fileName = file.getOriginalFilename();
            if (fileName != null && (fileName.toLowerCase().endsWith(".xls") || fileName.toLowerCase().endsWith(".xlsx"))) {
                InputStream inputStream = file.getInputStream();
                for (ExcelParser parser : excelParsers) {
                    if (parser.support(fileName)) {
                        reportDefinition = parser.parse(inputStream);
                        break;
                    }
                }
                inputStream.close();
            } else {
                throw new ReportException("Please select a valid Excel file for import");
            }
        } catch (Exception e) {
            logger.error("Import Excel Error: {}", e);
            throw new ReportException(e.getMessage());
        }

        if (reportDefinition != null) {
            result.put("result", true);
            ReportDefinitionWrapper wrapper = new ReportDefinitionWrapper(reportDefinition);
            ReportScopedCache.putObject("classpath:template/template.ureport.xml", wrapper);
        } else {
            throw new ReportException("Failed to parse Excel file, please verify the file format");
        }

        return result;
    }
}
