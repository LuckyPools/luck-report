package com.luck.report.web.controller.importexcel;

import com.luck.report.web.service.ImportExcelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Excel导入控制器，仅负责HTTP请求/响应转换，业务逻辑委托给ImportExcelService
 */
@RestController("bean.importExcelController")
@RequestMapping("${luck-report.servletPrefix:}/import")
public class ImportExcelController {

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
}
