package com.luck.report.web.controller.excel;

import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.web.controller.base.BaseController;
import com.luck.report.web.service.ReportExportService;
import com.luck.report.web.utils.DownloadUtils;
import com.luck.report.web.utils.UrlParameterUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.OutputStream;

/**
 * Excel导出控制器，仅负责HTTP请求/响应转换，业务逻辑委托给ReportExportService
 */
@RestController("bean.exportExcelController")
@RequestMapping("${luck-report.servletPrefix:}/excel")
public class ExportExcelController extends BaseController {

    @Autowired
    @Qualifier("bean.reportExportService")
    private ReportExportService reportExportService;

    /**
     * 构建Excel报表
     */
    @RequestMapping("/build")
    public void build() throws IOException {
        buildExcel(false, false);
    }

    /**
     * 分页导出Excel报表
     */
    @RequestMapping("/paging")
    public void paging() throws IOException {
        buildExcel(true, false);
    }

    /**
     * 按Sheet导出Excel报表
     */
    @RequestMapping("/sheet")
    public void sheet() throws IOException {
        buildExcel(false, true);
    }

    /**
     * 构建Excel报表并写入响应流。预览模式须在写下载头前取缓存，避免过期时返回空附件。
     */
    private void buildExcel(boolean withPage, boolean withSheet) throws IOException {
        String reportPath = req.getParameter("reportPath");
        String mode = req.getParameter("mode");
        String excelName = req.getParameter("_n");
        String decodedPath = UrlParameterUtils.doubleDecode(reportPath);
        ReportDefinition definition = reportExportService.getPreviewDefinition(mode, decodedPath);
        DownloadUtils.buildDownloadHeader(resp, reportPath, excelName, ".xlsx");
        OutputStream outputStream = resp.getOutputStream();
        try {
            reportExportService.buildExcel(decodedPath, mode, req, outputStream, withPage, withSheet, definition);
        } finally {
            outputStream.flush();
            outputStream.close();
        }
    }
}
